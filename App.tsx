import React, { useState, useEffect, useRef } from 'react';
import { generateRoomDesign, createChatSession, analyzeRoomForStyles } from './services/geminiService';
import ImageUploader from './components/ImageUploader';
import CompareSlider from './components/CompareSlider';
import StyleSelector, { STYLES } from './components/StyleSelector';
import ChatInterface from './components/ChatInterface';
import { ChatMessage, Role, DesignStyle, LoadingState } from './types';
import { RefreshCcw, Download, ArrowLeft, Armchair, X, Wand2, Sparkles } from 'lucide-react';
import { Chat } from "@google/genai";
import { Meteors } from './components/Meteors';

const App: React.FC = () => {
  // --- State ---
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const [suggestedStyles, setSuggestedStyles] = useState<string[]>([]);
  
  // Prompt Modal State
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [promptText, setPromptText] = useState("");
  const [selectedStyleForGeneration, setSelectedStyleForGeneration] = useState<DesignStyle | null>(null);

  // --- Refs ---
  // Keep track of current image in a ref for the chat tool callback access without closure staleness
  const currentImageRef = useRef<string | null>(null);

  useEffect(() => {
    currentImageRef.current = currentImage;
  }, [currentImage]);

  // --- Chat Initialization ---
  useEffect(() => {
    const session = createChatSession();
    setChatSession(session);
  }, []);

  // --- Handlers ---

  const handleImageUpload = async (base64: string) => {
    // Add prefix if missing for display
    const dataUrl = `data:image/png;base64,${base64}`;
    setOriginalImage(dataUrl);
    setCurrentImage(dataUrl);
    setLoadingState('idle');
    setSuggestedStyles([]); // Clear previous suggestions
    
    // Reset chat for new room
    setMessages([{
      id: 'welcome',
      role: Role.MODEL,
      text: "I've loaded your room! Analyzing the space to recommend some styles...",
      timestamp: Date.now()
    }]);
    
    // Re-init chat session to clear history
    const session = createChatSession();
    setChatSession(session);

    // Analyze image for style suggestions
    try {
      const styleIds = await analyzeRoomForStyles(base64, STYLES);
      if (styleIds.length > 0) {
        setSuggestedStyles(styleIds);
        addMessage(Role.MODEL, `Based on your room's structure, I've highlighted a few styles above (marked as **Best**) that would look amazing here! You can click one to apply it, or tell me what you have in mind.`);
      } else {
        addMessage(Role.MODEL, "Feel free to select a style above or describe how you'd like to transform the space.");
      }
    } catch (error) {
      console.error("Analysis failed", error);
      addMessage(Role.MODEL, "Ready! Select a style above or describe your ideas.");
    }
  };

  const handleStyleSelect = (style: DesignStyle) => {
    if (!originalImage || loadingState !== 'idle') return;
    
    // Construct the default prompt
    const defaultPrompt = `Redesign this room in ${style.name} style. ${style.prompt}. Keep the structural layout but change furniture, colors, and textures. Photorealistic, high quality.`;
    
    setPromptText(defaultPrompt);
    setSelectedStyleForGeneration(style);
    setIsPromptModalOpen(true);
  };

  const handleConfirmGeneration = async () => {
    setIsPromptModalOpen(false);
    if (!selectedStyleForGeneration || !originalImage) return;

    setLoadingState('generating');
    try {
        const rawBase64 = originalImage.split(',')[1];
        // Use the edited promptText
        const newImageBase64 = await generateRoomDesign(rawBase64, promptText);
        const newDataUrl = `data:image/png;base64,${newImageBase64}`;
        setCurrentImage(newDataUrl);
        addMessage(Role.MODEL, `I've applied the **${selectedStyleForGeneration.name}** style to your room with your custom instructions.`);
    } catch (error) {
        console.error(error);
        addMessage(Role.MODEL, "Sorry, I encountered an error generating the style. Please try again.");
    } finally {
        setLoadingState('idle');
        setSelectedStyleForGeneration(null);
    }
  };

  const handleChatMessage = async (text: string) => {
    if (!chatSession) return;
    
    addMessage(Role.USER, text);
    setLoadingState('chatting');

    try {
      // Send message to Gemini Chat
      const response = await chatSession.sendMessage({ message: text });
      
      // Check for function calls
      const functionCalls = response.functionCalls;
      
      let finalResponseText = response.text || "";

      if (functionCalls && functionCalls.length > 0) {
        // Handle tool calls (visual updates)
        const call = functionCalls[0]; // Assuming one call for now
        
        if (call.name === 'update_design') {
           const args = call.args as any;
           const editInstruction = args.editInstruction;

           addMessage(Role.MODEL, `*Updating design: ${editInstruction}...*`);
           
           // EXECUTE VISUAL UPDATE
           // Use CURRENT image as base for refinement
           const sourceImage = currentImageRef.current || originalImage;
           if (sourceImage) {
             const rawBase64 = sourceImage.split(',')[1];
             const newImageBase64 = await generateRoomDesign(rawBase64, editInstruction);
             const newDataUrl = `data:image/png;base64,${newImageBase64}`;
             setCurrentImage(newDataUrl);
             
             // Send response back to model using sendMessage with message
             const toolResponse = await chatSession.sendMessage({
               message: [
                 {
                   functionResponse: {
                     id: call.id,
                     name: call.name,
                     response: { result: "Design updated successfully with the new image generated." }
                   }
                 }
               ]
             });
             finalResponseText = toolResponse.text || "";
           } else {
             finalResponseText = "I couldn't find an image to update.";
           }
        } else if (call.name === 'suggest_palette') {
          const args = call.args as any;
          const colors = args.colors; // Expecting { name: string, hex: string }[]
          
          // Send response back to model
          const toolResponse = await chatSession.sendMessage({
             message: [
               {
                 functionResponse: {
                   id: call.id,
                   name: call.name,
                   response: { result: "Palette displayed to user." }
                 }
               }
             ]
          });
          
          finalResponseText = toolResponse.text || "";

          // Add a special message for the palette
          setMessages(prev => [...prev, {
            id: Date.now().toString() + Math.random(),
            role: Role.MODEL,
            text: "Here is a suggested color palette for you:",
            timestamp: Date.now(),
            palette: colors
          }]);
        }
      }

      // If we used a tool, finalResponseText is from the second turn.
      // If we didn't, it's from the first turn.
      // Note: If googleSearch was used, the text is already grounded.
      
      if (finalResponseText) {
        addMessage(Role.MODEL, finalResponseText);
      }

    } catch (error) {
      console.error("Chat Error", error);
      addMessage(Role.MODEL, "I'm having trouble connecting right now. Please try again.");
    } finally {
      setLoadingState('idle');
    }
  };

  const addMessage = (role: Role, text: string) => {
    setMessages(prev => [...prev, {
      id: Date.now().toString() + Math.random(),
      role,
      text,
      timestamp: Date.now()
    }]);
  };

  const resetApp = () => {
    setOriginalImage(null);
    setCurrentImage(null);
    setMessages([]);
    setSuggestedStyles([]);
  };

  // --- Render ---

  return (
    <div className="flex flex-col h-screen w-full bg-background text-foreground">
      {/* Navbar - Persistent across states */}
      <header className="flex-none bg-background/80 backdrop-blur-md border-b border-border h-16 px-4 md:px-6 flex items-center justify-between z-50 transition-all shadow-sm">
        <div className="flex items-center gap-3 select-none">
          <div className="bg-primary text-primary-foreground p-2 rounded-xl shadow-md">
            <Armchair size={22} strokeWidth={2.5} />
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground">Reroom</span>
        </div>

        <div className="flex items-center gap-3">
           {loadingState === 'generating' && (
                <div className="hidden md:flex items-center gap-2 text-xs font-medium text-primary bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full animate-pulse">
                    <RefreshCcw size={12} className="animate-spin" />
                    <span>GENERATING</span>
                </div>
            )}
            
            {originalImage && (
              <>
                <button 
                  onClick={resetApp}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                  title="Start over with a new room"
                >
                  <ArrowLeft size={16} />
                  <span className="hidden sm:inline">Start Over</span>
                </button>

                {currentImage && (
                    <a 
                    href={currentImage} 
                    download="reroom-design.png"
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg shadow-sm hover:bg-primary/90 hover:shadow transition-all text-sm font-medium"
                    >
                    <Download size={16} />
                    <span className="hidden sm:inline">Download</span>
                    </a>
                )}
              </>
            )}
        </div>
      </header>

      {/* Main Content Area */}
      {!originalImage ? (
        <div className="flex-1 relative flex items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-muted/50 via-background to-background overflow-hidden">
           <Meteors number={20} />
           
           {/* Gradient Overlay */}
           <div className="pointer-events-none absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-background to-transparent z-0" />

           <div className="relative z-10 max-w-md w-full h-96 animate-in fade-in zoom-in duration-500">
              <div className="text-center mb-8">
                 <h2 className="text-2xl font-semibold mb-2">Reimagine your space</h2>
                 <p className="text-muted-foreground">Upload a photo to see it in a new light.</p>
              </div>
              <ImageUploader onUpload={handleImageUpload} />
           </div>
        </div>
      ) : (
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Left/Top: Visualization Area */}
          <div className="flex-[3] flex flex-col min-h-[50%] md:min-h-0 bg-muted/20 relative">
              {/* Style Selector Overlay/Bar */}
              <div className="flex-none bg-background/80 backdrop-blur-sm z-10 border-b border-border shadow-sm">
                   <StyleSelector 
                      onSelect={handleStyleSelect} 
                      disabled={loadingState !== 'idle'} 
                      suggestedStyleIds={suggestedStyles}
                   />
              </div>

              {/* Canvas */}
              <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-muted/10">
                 {currentImage ? (
                     <CompareSlider 
                        original={originalImage} 
                        modified={currentImage} 
                        className="w-full h-full mx-auto"
                     />
                 ) : (
                     <div className="text-muted-foreground">Image Error</div>
                 )}
              </div>
          </div>

          {/* Right/Bottom: Chat Area */}
          <div className="flex-[2] md:max-w-xl w-full flex flex-col h-full border-l border-border z-20 shadow-2xl shadow-black/5">
             <ChatInterface 
                messages={messages}
                onSendMessage={handleChatMessage}
                isLoading={loadingState === 'chatting'}
             />
          </div>

        </div>
      )}

      {/* Prompt Editor Modal */}
      {isPromptModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-card w-full max-w-lg p-6 rounded-2xl shadow-2xl border border-border flex flex-col gap-4 animate-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                          <Sparkles size={18} className="text-primary" />
                          Refine Generation Prompt
                      </h3>
                      <button onClick={() => setIsPromptModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                          <X size={20} />
                      </button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                      Edit the prompt below to control exactly how the AI reimagines your room.
                  </p>
                  <textarea
                      value={promptText}
                      onChange={(e) => setPromptText(e.target.value)}
                      className="w-full h-32 bg-muted/50 border border-input rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none resize-none"
                  />
                  <div className="flex justify-end gap-3 pt-2">
                      <button 
                          onClick={() => setIsPromptModalOpen(false)}
                          className="px-4 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-lg transition-colors"
                      >
                          Cancel
                      </button>
                      <button 
                          onClick={handleConfirmGeneration}
                          className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg shadow-sm flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
                      >
                          <Wand2 size={16} />
                          Generate
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default App;
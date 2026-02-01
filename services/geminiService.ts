import { GoogleGenAI, Type, FunctionDeclaration, Tool } from "@google/genai";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Constants for Models
const MODEL_CHAT = 'gemini-3-pro-preview';
const MODEL_IMAGE = 'gemini-2.5-flash-image';
const MODEL_ANALYSIS = 'gemini-2.5-flash';

// --- Image Generation / Editing ---

/**
 * edits or generates a new version of the image based on the prompt.
 * Uses Gemini 2.5 Flash Image.
 */
export const generateRoomDesign = async (
  imageBase64: string,
  prompt: string
): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_IMAGE,
      contents: {
        parts: [
          {
            text: prompt,
          },
          {
            inlineData: {
              mimeType: 'image/png', // Assuming PNG for canvas exports, but API handles common types
              data: imageBase64,
            },
          },
        ],
      },
      // Config specific to image generation if needed
    });

    // Extract image
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return part.inlineData.data;
      }
    }
    
    throw new Error("No image data returned from Gemini.");

  } catch (error) {
    console.error("Gemini Image Gen Error:", error);
    throw error;
  }
};

/**
 * Analyzes the room image and suggests appropriate styles.
 */
export const analyzeRoomForStyles = async (
  imageBase64: string,
  availableStyles: { id: string; name: string }[]
): Promise<string[]> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_ANALYSIS,
      contents: {
        parts: [
          {
            text: `Analyze this interior design room photo. Identify the room type (e.g., living room, bedroom) and its structural features. 
            Based on the analysis, recommend exactly 3 design styles from the following list that would be the most interesting and suitable transformations for this specific space.
            
            Available Styles:
            ${availableStyles.map(s => `- ${s.name} (ID: ${s.id})`).join('\n')}
            
            Return ONLY a valid JSON array of strings containing the 'ID's of the 3 selected styles. Do not return markdown formatting.
            Example: ["scandi", "boho", "industrial"]`,
          },
          {
            inlineData: {
              mimeType: 'image/png',
              data: imageBase64,
            },
          },
        ],
      },
      config: {
        responseMimeType: 'application/json',
      }
    });

    const text = response.text;
    if (!text) return [];
    
    // Attempt to parse JSON
    try {
      const ids = JSON.parse(text);
      if (Array.isArray(ids)) {
        return ids;
      }
    } catch (e) {
      console.warn("Failed to parse style analysis JSON", e);
    }
    
    return [];
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return [];
  }
};


// --- Chat with Function Calling ---

const updateDesignTool: FunctionDeclaration = {
  name: 'update_design',
  description: 'Update or modify the visual design of the room based on user instructions. Use this when the user asks to change colors, furniture styles, lighting, or layout.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      editInstruction: {
        type: Type.STRING,
        description: 'A precise, descriptive prompt for an image generation model to apply the requested changes (e.g., "Make the rug blue and textured", "Add a floor lamp next to the sofa").',
      },
    },
    required: ['editInstruction'],
  },
};

const tools: Tool[] = [
  { functionDeclarations: [updateDesignTool] },
  { googleSearch: {} } // Enable Google Search for shopping links
];

export const createChatSession = () => {
  return ai.chats.create({
    model: MODEL_CHAT,
    config: {
      systemInstruction: `You are an expert Interior Design Consultant. 
      Your goal is to help users redesign their rooms.
      
      Capabilities:
      1. VISUAL UPDATES: If the user wants to visually change the room (e.g., "change style to boho", "make walls green", "remove the chair"), you MUST call the 'update_design' tool with a specific prompt describing the desired image.
      2. INFORMATION & SHOPPING: If the user asks for product recommendations, prices, or where to buy items seen in the design, use the 'googleSearch' tool to find real-world items and provide links.
      
      Tone:
      Be helpful, encouraging, and concise. Focus on design aesthetics and practical advice.
      `,
      tools: tools,
    },
  });
};
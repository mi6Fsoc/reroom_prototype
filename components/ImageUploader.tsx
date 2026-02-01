import React, { useRef, useState } from 'react';
import { Upload, Image as ImageIcon } from 'lucide-react';
import { BorderBeam } from './BorderBeam';

interface ImageUploaderProps {
  onUpload: (base64: string) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onUpload }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64Data = result.split(',')[1];
      onUpload(base64Data);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div 
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      className={`relative flex flex-col items-center justify-center h-full w-full p-8 border border-dashed rounded-xl transition-all duration-300 cursor-pointer overflow-hidden group
        ${isDragging 
          ? 'border-primary/50 bg-primary/10 backdrop-blur-md' 
          : 'border-white/10 bg-gradient-to-br from-card/30 to-background/10 backdrop-blur-xl hover:bg-card/40'
        }
      `}
    >
      <div className={`p-4 rounded-full mb-4 transition-colors z-10 ${isDragging ? 'bg-primary/20' : 'bg-secondary/50 backdrop-blur-sm'}`}>
        <ImageIcon size={48} className={isDragging ? 'text-primary' : 'text-muted-foreground'} />
      </div>
      <h3 className="text-xl font-semibold mb-2 text-foreground z-10">Upload your room</h3>
      <p className="text-muted-foreground mb-6 text-center max-w-xs transition-colors z-10">
        {isDragging ? 'Drop the image here to upload' : 'Drag & drop your photo here, or click to upload'}
      </p>
      
      <button 
        onClick={(e) => {
           e.stopPropagation();
           fileInputRef.current?.click();
        }}
        className="relative z-10 flex items-center space-x-2 px-6 py-3 bg-primary text-primary-foreground font-medium rounded-lg transition-all duration-300 shadow-lg border-2 border-transparent hover:bg-white hover:text-primary hover:border-[#ffaa40] hover:scale-110"
      >
        <Upload size={20} />
        <span>Choose Photo</span>
      </button>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      <BorderBeam size={250} duration={12} delay={9} />
    </div>
  );
};

export default ImageUploader;
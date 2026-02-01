import React from 'react';
import { DesignStyle } from '../types';
import { Sparkles } from 'lucide-react';

interface StyleSelectorProps {
  onSelect: (style: DesignStyle) => void;
  disabled?: boolean;
  suggestedStyleIds?: string[];
}

export const STYLES: DesignStyle[] = [
  { id: 'mcm', name: 'Mid-Century Modern', prompt: 'Mid-Century Modern interior design style, 1950s aesthetic, teak wood furniture, tapered legs, organic curves, clean lines, atomic age accents', thumbnailClass: 'bg-orange-600' },
  { id: 'scandi', name: 'Scandinavian', prompt: 'Scandinavian interior design, minimalism, white walls, light wood, cozy textiles', thumbnailClass: 'bg-stone-300' },
  { id: 'industrial', name: 'Industrial', prompt: 'Industrial interior design, exposed brick, metal accents, raw materials, loft style', thumbnailClass: 'bg-zinc-600' },
  { id: 'boho', name: 'Bohemian', prompt: 'Bohemian interior design, eclectic patterns, plants, rattan, warm earthy tones', thumbnailClass: 'bg-orange-400' },
  { id: 'japandi', name: 'Japandi', prompt: 'Japandi style, fusion of Japanese rustic minimalism and Scandinavian functionality', thumbnailClass: 'bg-neutral-200' },
  { id: 'glam', name: 'Hollywood Glam', prompt: 'Hollywood Glam interior design, velvet furniture, gold accents, luxurious, jewel tones', thumbnailClass: 'bg-rose-900' },
  { id: 'minimalist', name: 'Minimalist', prompt: 'Minimalist interior design, ultra-clean lines, monochromatic color palette, decluttered, functional, open spaces', thumbnailClass: 'bg-gray-200' },
  { id: 'art_deco', name: 'Art Deco', prompt: 'Art Deco interior design, geometric patterns, rich colors, gold and brass accents, velvet, luxurious and ornamental', thumbnailClass: 'bg-teal-800' },
  { id: 'rustic', name: 'Rustic', prompt: 'Rustic interior design, natural wood beams, stone walls, warm earthy tones, cozy, farmhouse aesthetic', thumbnailClass: 'bg-yellow-900' },
  { id: 'coastal', name: 'Coastal', prompt: 'Coastal interior design, breezy atmosphere, light blues and whites, natural rattan, linen fabrics, beach house vibe', thumbnailClass: 'bg-cyan-200' },
  { id: 'farmhouse', name: 'Modern Farmhouse', prompt: 'Modern Farmhouse interior design, white shiplap, black metal accents, rustic wood elements, cozy and clean aesthetic', thumbnailClass: 'bg-stone-400' },
  { id: 'cyberpunk', name: 'Cyberpunk', prompt: 'Cyberpunk interior design, neon lights, futuristic technology, dark aesthetics, high contrast, synthwave vibe', thumbnailClass: 'bg-purple-900' },
  { id: 'mediterranean', name: 'Mediterranean', prompt: 'Mediterranean interior design, terracotta tiles, warm earth tones, arches, wrought iron details, rustic elegance', thumbnailClass: 'bg-orange-700' },
  { id: 'biophilic', name: 'Biophilic', prompt: 'Biophilic interior design, abundant indoor plants, natural light, organic materials, living walls, nature-inspired elements', thumbnailClass: 'bg-green-600' },
];

const StyleSelector: React.FC<StyleSelectorProps> = ({ onSelect, disabled, suggestedStyleIds = [] }) => {
  return (
    <div className="w-full overflow-x-auto py-4 scrollbar-hide">
      <div className="flex space-x-4 px-4 min-w-max">
        {STYLES.map((style) => {
          const isSuggested = suggestedStyleIds.includes(style.id);
          
          return (
            <button
              key={style.id}
              onClick={() => onSelect(style)}
              disabled={disabled}
              className={`
                relative group flex flex-col items-center justify-center w-32 h-20 rounded-xl overflow-hidden shadow-sm transition-all border 
                ${isSuggested 
                  ? 'border-primary ring-2 ring-primary/50 ring-offset-1 ring-offset-background' 
                  : 'border-border'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95 cursor-pointer hover:shadow-md'}
              `}
            >
              <div className={`absolute inset-0 ${style.thumbnailClass} opacity-80 group-hover:opacity-100 transition-opacity`} />
              
              {/* Suggestion Badge */}
              {isSuggested && (
                <div className="absolute top-1 right-1 z-20 flex items-center gap-0.5 bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-lg animate-pulse">
                   <Sparkles size={8} />
                   <span>BEST</span>
                </div>
              )}

              <span className="relative z-10 text-white font-semibold text-sm text-center px-2 drop-shadow-md">
                {style.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default StyleSelector;
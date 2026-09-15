import React, { RefObject } from "react";
import { Image as ImageIcon, X } from "lucide-react";

interface ImageUploadAreaProps {
  imagePreview: string | null;
  fileInputRef: RefObject<HTMLInputElement | null>;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
  onUrlChange: (url: string) => void;
}

export default function ImageUploadArea({
  imagePreview,
  fileInputRef,
  handleImageUpload,
  onClear,
  onUrlChange
}: ImageUploadAreaProps) {
  if (!imagePreview) {
    return (
      <div 
        className="border-2 border-dashed border-white/20 rounded-xl p-6 text-center hover:border-primary/50 transition-colors cursor-pointer bg-black/20 relative"
        onClick={() => fileInputRef.current?.click()}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleImageUpload} 
          className="hidden" 
          accept="image/*" 
        />
        <div className="flex justify-center mb-4">
          <div className="p-4 bg-white/5 rounded-full text-primary-light">
            <ImageIcon size={32} />
          </div>
        </div>
        <p className="text-white font-medium mb-1">Cliquez pour ajouter une image</p>
        <p className="text-sm text-gray-400">PNG, JPG ou WEBP (Max 5MB)</p>
        
        <div className="mt-4 pt-4 border-t border-white/10" onClick={(e) => e.stopPropagation()}>
          <p className="text-xs text-gray-500 mb-2">Ou utiliser une URL d'image existante :</p>
          <input 
            type="url" 
            placeholder="https://..." 
            onChange={(e) => {
              if (e.target.value) onUrlChange(e.target.value);
            }}
            className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-primary"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative rounded-xl overflow-hidden h-40 bg-black/40 flex items-center justify-center border border-white/10">
         <img src={imagePreview} alt="Preview" className="max-h-full max-w-full object-contain" />
      </div>
      <div className="flex justify-center">
         <button 
           type="button"
           onClick={onClear}
           className="flex items-center space-x-2 text-sm text-red-400 hover:text-red-300 bg-red-400/10 px-4 py-2 rounded-lg transition"
         >
           <X size={16} />
           <span>Supprimer et changer d'image</span>
         </button>
      </div>
    </div>
  );
}

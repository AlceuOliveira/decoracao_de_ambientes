// Caminho: src/steps/UploadStep.tsx

import React, { useState } from 'react';
import { ArrowRight, Trash2 } from 'lucide-react';
import { FileUpload } from '../components/FileUpload';
import { Button } from '../components/Button';

// As props que este componente precisa receber
interface UploadStepProps {
  onContinue: (images: string[]) => void; // Para enviar as imagens para o App.tsx
  onBack: () => void;                     // Para voltar para a tela de Welcome
}

export const UploadStep: React.FC<UploadStepProps> = ({ onContinue, onBack }) => {
  // O estado das imagens agora vive dentro deste componente
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);

  const handleFilesSelect = (newBase64s: string[]) => {
    setUploadedImages(prev => [...prev, ...newBase64s]);
  };

  const removeUploadedImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  // O JSX é o mesmo da sua função renderUpload original
  return (
    <div className="max-w-xl mx-auto pt-12 px-4 pb-24">
      <button onClick={onBack} className="mb-6 text-stone-400 hover:text-stone-900 text-sm">← Voltar</button>
      <h2 className="text-3xl font-serif text-stone-900 mb-2">O ambiente</h2>
      <p className="text-stone-500 mb-8">Envie imagens ou um vídeo curto do espaço que deseja transformar.</p>
      
      <div className="space-y-6">
        <FileUpload onFilesSelected={handleFilesSelect} />

        {uploadedImages.length > 0 && (
            <div className="space-y-3 animate-fade-in">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wide">
                        Capturas Selecionadas ({uploadedImages.length})
                    </h3>
                    <button onClick={() => setUploadedImages([])} className="text-xs text-red-500 hover:text-red-700">
                        Limpar tudo
                    </button>
                </div>
                
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {uploadedImages.map((img, idx) => (
                        <div key={idx} className="relative aspect-square group">
                            <img src={img} alt={`Upload ${idx}`} className="w-full h-full object-cover rounded-lg border border-stone-200" />
                            <button 
                                onClick={() => removeUploadedImage(idx)}
                                className="absolute top-1 right-1 bg-white/90 p-1 rounded-full text-stone-900 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Trash2 className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        )}
      </div>

      {uploadedImages.length > 0 && (
          <div className="fixed bottom-6 left-0 right-0 px-4 z-50 animate-fade-in">
             <div className="max-w-md mx-auto">
                <Button 
                    fullWidth 
                    onClick={() => onContinue(uploadedImages)} // Chama a função onContinue com as imagens
                    className="shadow-xl"
                    icon={<ArrowRight className="w-4 h-4" />}
                >
                    Continuar
                </Button>
             </div>
          </div>
      )}
    </div>
  );
};

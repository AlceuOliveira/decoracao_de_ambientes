// Caminho: src/steps/GeneratingStep.tsx

import React from 'react';
import { Loader2, Images } from 'lucide-react';

interface GeneratingStepProps {
  loadingStage: string;
  imageCount: number;
}

export const GeneratingStep: React.FC<GeneratingStepProps> = ({ loadingStage, imageCount }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center animate-pulse">
        <div className="relative">
            <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-20"></div>
            <div className="w-20 h-20 bg-white rounded-full border-4 border-stone-100 flex items-center justify-center relative z-10 shadow-xl">
                <Loader2 className="w-8 h-8 text-stone-900 animate-spin" />
            </div>
        </div>
        
        <h3 className="text-2xl font-serif text-stone-900 mt-8 mb-2">Criando seu espaço</h3>
        <p className="text-stone-500 font-medium">{loadingStage}</p>
        
        {imageCount > 1 && (
             <div className="flex gap-2 mt-4 justify-center opacity-50">
                <Images className="w-4 h-4 text-stone-400" />
                <span className="text-xs text-stone-400">Processando {imageCount} imagens</span>
             </div>
        )}

        <div className="mt-12 w-64 h-1 bg-stone-100 rounded-full overflow-hidden">
            <div className="h-full bg-stone-900 animate-[loading_2s_ease-in-out_infinite]" style={{width: '50%'}}></div>
        </div>
    </div>
  );
};

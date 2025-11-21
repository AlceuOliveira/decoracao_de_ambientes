// Caminho do arquivo: src/steps/WelcomeStep.tsx

import React from 'react';
import { LayoutTemplate, ArrowRight } from 'lucide-react';
import { Button } from '../../components/Button';

// 1. Definimos as "props" que este componente vai receber.
//    Neste caso, ele precisa de uma função para ser executada quando o botão "Começar" for clicado.
interface WelcomeStepProps {
  onStart: () => void;
}

// 2. Criamos o componente. Ele recebe as props como argumento.
export const WelcomeStep: React.FC<WelcomeStepProps> = ({ onStart }) => {
  // 3. Retornamos o mesmo JSX que estava na sua função `renderWelcome` original.
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-6 animate-fade-in">
      <div className="w-24 h-24 bg-stone-900 rounded-full flex items-center justify-center mb-8 shadow-2xl shadow-stone-400">
        <LayoutTemplate className="w-10 h-10 text-white" />
      </div>
      <h1 className="text-5xl md:text-6xl font-serif text-stone-900 mb-6 leading-tight">
        Lumina <span className="italic text-stone-500">Interiors</span>
      </h1>
      <p className="text-xl text-stone-500 max-w-md mb-10 leading-relaxed">
        A inteligência artificial que reinventa seu espaço. Envie fotos ou vídeos e receba o projeto.
      </p>
      <Button 
        onClick={onStart} // 4. O onClick do botão agora chama a função `onStart` que veio das props.
        className="text-lg px-10 py-4"
        icon={<ArrowRight className="w-5 h-5" />}
      >
        Começar Agora
      </Button>
    </div>
  );
};

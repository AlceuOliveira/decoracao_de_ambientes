// Caminho: src/steps/RoomDetailsStep.tsx

import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { StepWizard } from '../components/StepWizard';
import { Button } from '../components/Button';
import { DesignPreferences } from '../types';

// Constantes que estavam no App.tsx
const ROOM_TYPES = ['Sala de Estar', 'Quarto', 'Cozinha', 'Escritório', 'Banheiro', 'Varanda'];

interface RoomDetailsStepProps {
  preferences: DesignPreferences;
  updatePref: (key: keyof DesignPreferences, value: any) => void;
  onNext: () => void;
  onBack: () => void;
}

export const RoomDetailsStep: React.FC<RoomDetailsStepProps> = ({
  preferences,
  updatePref,
  onNext,
  onBack,
}) => {
  // O estado para o input customizado agora vive aqui
  const [isCustomRoomType, setIsCustomRoomType] = useState(false);
  const [customRoomTypeText, setCustomRoomTypeText] = useState('');

  return (
    <StepWizard 
      stepIndex={1} 
      totalSteps={2} 
      title="Detalhes do Espaço" 
      description="Ajude a IA a entender o contexto do seu ambiente."
      onBack={onBack}
    >
      <div className="space-y-8">
        {/* Room Type */}
        <div>
            <label className="block text-sm font-bold text-stone-900 uppercase tracking-wide mb-3">Tipo de Ambiente</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {ROOM_TYPES.map(type => (
                    <button
                        key={type}
                        onClick={() => {
                          setIsCustomRoomType(false);
                          updatePref('roomType', type);
                        }}
                        className={`py-3 px-4 rounded-xl text-sm font-medium transition-all border ${
                            preferences.roomType === type && !isCustomRoomType
                            ? 'bg-stone-900 text-white border-stone-900 shadow-md' 
                            : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'
                        }`}
                    >
                        {type}
                    </button>
                ))}
                <button
                    onClick={() => {
                        setIsCustomRoomType(true);
                        updatePref('roomType', customRoomTypeText);
                    }}
                    className={`py-3 px-4 rounded-xl text-sm font-medium transition-all border ${
                        isCustomRoomType
                        ? 'bg-stone-900 text-white border-stone-900 shadow-md' 
                        : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'
                    }`}
                >
                    Outros
                </button>
            </div>
            
            {isCustomRoomType && (
                <div className="mt-3 animate-fade-in">
                    <input 
                        type="text" 
                        value={customRoomTypeText}
                        onChange={(e) => {
                            setCustomRoomTypeText(e.target.value);
                            updatePref('roomType', e.target.value);
                        }}
                        placeholder="Digite o tipo de ambiente (ex: Estúdio de Música, Adega...)"
                        className="w-full p-3 rounded-xl border border-stone-300 focus:border-stone-900 outline-none bg-white text-sm"
                        autoFocus
                    />
                </div>
            )}
        </div>

        {/* Functionality */}
        <div>
            <label className="block text-sm font-bold text-stone-900 uppercase tracking-wide mb-3">Objetivo Principal</label>
            <textarea 
                rows={4}
                value={preferences.functionality}
                onChange={(e) => updatePref('functionality', e.target.value)}
                placeholder="Ex: Relaxar após o trabalho, receber amigos para jantar, espaço criativo para as crianças..."
                className="w-full p-4 rounded-xl border border-stone-200 focus:border-stone-900 focus:ring-0 outline-none bg-white transition-all min-h-[120px] resize-y"
            />
        </div>

         {/* Continue Button */}
         <div className="pt-6">
            <Button 
                fullWidth 
                onClick={onNext} 
                disabled={!preferences.roomType || !preferences.functionality}
                icon={<ArrowRight className="w-4 h-4"/>}
            >
                Próximo
            </Button>
        </div>
      </div>
    </StepWizard>
  );
};

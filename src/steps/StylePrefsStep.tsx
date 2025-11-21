// Caminho: src/steps/StylePrefsStep.tsx

import React, { useState } from 'react';
import { Palette, Armchair, DollarSign, CheckCircle2, Wand2 } from 'lucide-react';
import { StepWizard } from '../components/StepWizard'; // Corrigido para um '..'
import { Button } from '../components/Button';       // Corrigido para um '..'
import { DesignPreferences } from '../types';         // Corrigido para um '..'

// Constantes
const STYLES = ['Escandinavo', 'Industrial', 'Minimalista', 'Boho', 'Clássico', 'Moderno', 'Rústico', 'Japandi'];
const BUDGETS = ['Econômico', 'Intermediário', 'Alto Padrão'] as const;
const PRESET_COLORS = [
  { name: 'Neutros', hex: '#e5e5e5' },
  { name: 'Terrosos', hex: '#a05a2c' },
  { name: 'Escuros', hex: '#1a1a1a' },
  { name: 'Pastéis', hex: '#bfdbfe' },
  { name: 'Vibrantes', hex: '#ef4444' },
  { name: 'Verdes', hex: '#15803d' },
];

interface StylePrefsStepProps {
  preferences: DesignPreferences;
  updatePref: (key: keyof DesignPreferences, value: any) => void;
  onNext: () => void;
  onBack: () => void;
}

export const StylePrefsStep: React.FC<StylePrefsStepProps> = ({
  preferences,
  updatePref,
  onNext,
  onBack,
}) => {
  const [isCustomStyle, setIsCustomStyle] = useState(false);
  const [customStyleText, setCustomStyleText] = useState('');

  return (
    <StepWizard 
      stepIndex={2} 
      totalSteps={2} 
      title="Estilo & Vibe" 
      description="Defina a personalidade da sua nova decoração."
      onBack={onBack}
    >
      <div className="space-y-8">
        {/* Style */}
        <div>
            <label className="flex items-center gap-2 text-sm font-bold text-stone-900 uppercase tracking-wide mb-3">
                <Armchair className="w-4 h-4" /> Estilo Decorativo
            </label>
            <div className="flex flex-wrap gap-2">
                {STYLES.map(style => (
                    <button
                        key={style}
                        onClick={() => {
                            setIsCustomStyle(false);
                            updatePref('style', style);
                        }}
                        className={`py-2 px-4 rounded-full text-sm font-medium transition-all border ${
                            preferences.style === style && !isCustomStyle
                            ? 'bg-stone-900 text-white border-stone-900' 
                            : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'
                        }`}
                    >
                        {style}
                    </button>
                ))}
                <button
                    onClick={() => {
                        setIsCustomStyle(true);
                        updatePref('style', customStyleText);
                    }}
                    className={`py-2 px-4 rounded-full text-sm font-medium transition-all border ${
                        isCustomStyle
                        ? 'bg-stone-900 text-white border-stone-900' 
                        : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'
                    }`}
                >
                    Outros
                </button>
            </div>
            
            {isCustomStyle && (
                <div className="mt-3 animate-fade-in">
                    <input 
                        type="text" 
                        value={customStyleText}
                        onChange={(e) => {
                            setCustomStyleText(e.target.value);
                            updatePref('style', e.target.value);
                        }}
                        placeholder="Descreva o estilo (ex: Cyberpunk, Vitoriano, Casa de Praia...)"
                        className="w-full p-3 rounded-xl border border-stone-300 focus:border-stone-900 outline-none bg-white text-sm"
                        autoFocus
                    />
                </div>
            )}
        </div>

        {/* Colors */}
        <div>
            <label className="flex items-center gap-2 text-sm font-bold text-stone-900 uppercase tracking-wide mb-3">
                <Palette className="w-4 h-4" /> Preferência de Cores
            </label>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                <button
                    onClick={() => {
                        const isAuto = preferences.colors.includes('Automática');
                        updatePref('colors', isAuto ? [] : ['Automática']);
                    }}
                    className={`flex-shrink-0 w-16 flex flex-col items-center gap-2 group`}
                >
                    <div 
                        className={`w-12 h-12 rounded-full border-2 transition-all flex items-center justify-center overflow-hidden relative ${preferences.colors.includes('Automática') ? 'border-stone-900 scale-110' : 'border-transparent group-hover:scale-105'}`}
                    >
                         <div className="absolute inset-0 bg-gradient-to-tr from-blue-400 via-purple-400 to-orange-400 opacity-80"></div>
                         <Wand2 className={`w-5 h-5 relative z-10 ${preferences.colors.includes('Automática') ? 'text-white' : 'text-white/90'}`} />
                    </div>
                    <span className="text-xs font-medium text-stone-600">Automática</span>
                </button>

                {PRESET_COLORS.map(color => {
                    const isSelected = preferences.colors.includes(color.name);
                    return (
                        <button
                            key={color.name}
                            onClick={() => {
                                const currentColors = preferences.colors.filter(c => c !== 'Automática');
                                const newColors = isSelected 
                                    ? currentColors.filter(c => c !== color.name)
                                    : [...currentColors, color.name];
                                updatePref('colors', newColors);
                            }}
                            className={`flex-shrink-0 w-16 flex flex-col items-center gap-2 group`}
                        >
                            <div 
                                className={`w-12 h-12 rounded-full border-2 transition-all flex items-center justify-center ${isSelected ? 'border-stone-900 scale-110' : 'border-transparent group-hover:scale-105'}`}
                                style={{ backgroundColor: color.hex }}
                            >
                                {isSelected && <CheckCircle2 className={`w-6 h-6 ${color.name === 'Escuros' || color.name === 'Vibrantes' || color.name === 'Verdes' ? 'text-white' : 'text-stone-900'}`} />}
                            </div>
                            <span className="text-xs font-medium text-stone-600">{color.name}</span>
                        </button>
                    );
                })}
            </div>
        </div>

        {/* Budget */}
        <div>
            <label className="flex items-center gap-2 text-sm font-bold text-stone-900 uppercase tracking-wide mb-3">
                <DollarSign className="w-4 h-4" /> Orçamento Estimado
            </label>
            <div className="grid grid-cols-3 gap-3">
                {BUDGETS.map(budget => (
                    <button
                        key={budget}
                        onClick={() => updatePref('budget', budget)}
                        className={`py-3 px-2 rounded-xl text-xs sm:text-sm font-medium transition-all border ${
                            preferences.budget === budget 
                            ? 'bg-stone-100 text-stone-900 border-stone-900 ring-1 ring-stone-900' 
                            : 'bg-white text-stone-500 border-stone-200 hover:bg-stone-50'
                        }`}
                    >
                        {budget}
                    </button>
                ))}
            </div>
        </div>

        {/* Generate Button */}
        <div className="pt-6 pb-20">
            <Button 
                fullWidth 
                onClick={onNext} 
                disabled={!preferences.style || preferences.colors.length === 0}
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200"
                icon={<Palette className="w-4 h-4"/>}
            >
                Gerar Decoração
            </Button>
        </div>
      </div>
    </StepWizard>
  );
};

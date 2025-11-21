import React from 'react';

interface StepWizardProps {
    stepIndex: number;
    totalSteps: number;
    title: string;
    description?: string;
    children: React.ReactNode;
    onBack?: () => void;
}

export const StepWizard: React.FC<StepWizardProps> = ({ 
    stepIndex, 
    totalSteps, 
    title, 
    description, 
    children,
    onBack
}) => {
    const progress = ((stepIndex) / (totalSteps)) * 100;

    return (
        <div className="w-full max-w-xl mx-auto min-h-[60vh] flex flex-col animate-fade-in">
            <div className="mb-8">
                <div className="h-1 w-full bg-stone-200 rounded-full overflow-hidden mb-8">
                    <div 
                        className="h-full bg-stone-900 transition-all duration-500 ease-out rounded-full" 
                        style={{ width: `${progress}%` }}
                    />
                </div>
                
                <div className="flex items-center gap-4 mb-2">
                    {onBack && (
                         <button onClick={onBack} className="text-stone-400 hover:text-stone-900 transition-colors text-sm">
                             Voltar
                         </button>
                    )}
                    <span className="text-xs font-bold text-stone-400 tracking-widest uppercase">
                        Passo {stepIndex} de {totalSteps}
                    </span>
                </div>
                
                <h2 className="text-3xl md:text-4xl font-serif text-stone-900 mb-3">
                    {title}
                </h2>
                {description && (
                    <p className="text-stone-500 text-lg">
                        {description}
                    </p>
                )}
            </div>

            <div className="flex-1">
                {children}
            </div>
        </div>
    );
};
// Caminho: src/App.tsx

// --- Imports Corrigidos ---
import React, { useState } from 'react';
import { LayoutTemplate, ArrowRight } from 'lucide-react';

// Tipos
import { 
  AppStep, 
  AppState, 
  INITIAL_PREFERENCES, 
  DesignPreferences,
  ImageVariation 
} from './types';

// Serviços
import { analyzeRoomStructure, generateDecoratedRoom, getDesignDetailsAndShopping } from './services/geminiService';

// Componentes de Passo (Views)
import { WelcomeStep } from './steps/WelcomeStep';
import { UploadStep } from './steps/UploadStep';
import { RoomDetailsStep } from './steps/RoomDetailsStep';
import { StylePrefsStep } from './steps/StylePrefsStep';
import { GeneratingStep } from './steps/GeneratingStep';
import { ResultView } from './components/ResultView'; // ResultView é um componente final, pode ficar em components

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    step: AppStep.WELCOME,
    preferences: INITIAL_PREFERENCES,
    result: {
      variations: [],
      structuralAnalysis: '',
      designConcept: '',
      shoppingList: []
    },
    isProcessing: false,
    loadingStage: ''
  });

  // --- Funções de Lógica (Handlers) ---

  const updatePref = (key: keyof DesignPreferences, value: any) => {
    setState(prev => ({
      ...prev,
      preferences: { ...prev.preferences, [key]: value }
    }));
  };

  const handleNext = () => {
    if (state.step === AppStep.ROOM_DETAILS) setState(prev => ({ ...prev, step: AppStep.STYLE_PREFS }));
    else if (state.step === AppStep.STYLE_PREFS) runAiPipeline();
  };

  const handleBack = () => {
    if (state.step === AppStep.ROOM_DETAILS) setState(prev => ({ ...prev, step: AppStep.UPLOAD }));
    if (state.step === AppStep.STYLE_PREFS) setState(prev => ({ ...prev, step: AppStep.ROOM_DETAILS }));
  };

  const handleRestart = () => {
    setState({
        step: AppStep.WELCOME,
        preferences: INITIAL_PREFERENCES,
        result: {
            variations: [],
            structuralAnalysis: '',
            designConcept: '',
            shoppingList: []
        },
        isProcessing: false,
        loadingStage: ''
    });
  };

  // --- AI PIPELINE ---

  const runAiPipeline = async () => {
    const currentVariations = state.result.variations;
    if (currentVariations.length === 0) return;

    setState(prev => ({ ...prev, step: AppStep.GENERATING, isProcessing: true }));

    try {
      setState(prev => ({ ...prev, loadingStage: 'Analisando estrutura do ambiente...' }));
      const structuralAnalysis = await analyzeRoomStructure(currentVariations[0].original);
      
      setState(prev => ({ 
        ...prev, 
        result: { ...prev.result, structuralAnalysis },
        loadingStage: `Gerando ${currentVariations.length} variações decorativas...` 
      }));
      
      const generatedResults = await Promise.all(
        currentVariations.map(async (v) => {
          try {
            const generated = await generateDecoratedRoom(v.original, state.preferences, structuralAnalysis);
            return { ...v, generated };
          } catch (err) {
            console.error("Failed to generate variation for one image", err);
            return v;
          }
        })
      );

      const validGeneratedResults = generatedResults.filter(r => r.generated !== null);
      if (validGeneratedResults.length === 0) {
          throw new Error("Falha ao gerar imagens.");
      }

      setState(prev => ({ 
        ...prev, 
        result: { ...prev.result, variations: generatedResults },
        loadingStage: 'Curadoria de produtos e conceitos...' 
      }));

      const firstSuccess = validGeneratedResults[0];
      const details = await getDesignDetailsAndShopping(
        firstSuccess.original,
        firstSuccess.generated!,
        state.preferences
      );

      setState(prev => ({
        ...prev,
        result: {
          ...prev.result,
          designConcept: details.concept,
          shoppingList: details.items
        },
        isProcessing: false,
        step: AppStep.RESULT
      }));

    } catch (error) {
      console.error(error);
      alert("Ocorreu um erro ao gerar a decoração. Por favor tente novamente.");
      setState(prev => ({ ...prev, step: AppStep.STYLE_PREFS, isProcessing: false }));
    }
  };

  // --- RENDERIZADOR PRINCIPAL ---

  return (
    <div className="min-h-screen bg-stone-50 font-sans selection:bg-stone-200 text-stone-900 pb-12">
      <header className="p-6 flex justify-between items-center max-w-6xl mx-auto">
        <div className="flex items-center gap-2 font-serif font-bold text-xl tracking-tight cursor-pointer" onClick={handleRestart}>
            <div className="w-3 h-3 bg-stone-900 rounded-full"></div>
            Lumina
        </div>
        {state.step !== AppStep.WELCOME && (
            <button onClick={handleRestart} className="text-xs font-bold uppercase tracking-widest text-stone-400 hover:text-stone-900">
                Início
            </button>
        )}
      </header>

      <main className="max-w-6xl mx-auto px-4">
        {state.step === AppStep.WELCOME && (
          <WelcomeStep 
            onStart={() => setState(prev => ({ ...prev, step: AppStep.UPLOAD }))} 
          />
        )}

        {state.step === AppStep.UPLOAD && (
          <UploadStep
            onBack={() => setState(prev => ({ ...prev, step: AppStep.WELCOME }))}
            onContinue={(images) => {
              const initialVariations: ImageVariation[] = images.map((img, idx) => ({
                id: `var-${idx}-${Date.now()}`,
                original: img,
                generated: null
              }));
              setState(prev => ({
                ...prev,
                result: { ...prev.result, variations: initialVariations },
                step: AppStep.ROOM_DETAILS
              }));
            }}
          />
        )}

        {state.step === AppStep.ROOM_DETAILS && (
          <RoomDetailsStep
            preferences={state.preferences}
            updatePref={updatePref}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}

        {state.step === AppStep.STYLE_PREFS && (
          <StylePrefsStep
            preferences={state.preferences}
            updatePref={updatePref}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}

        {state.step === AppStep.GENERATING && (
          <GeneratingStep 
            loadingStage={state.loadingStage}
            imageCount={state.result.variations.length}
          />
        )}

        {state.step === AppStep.RESULT && (
            <ResultView result={state.result} onRestart={handleRestart} />
        )}
      </main>

      <style>{`
        @keyframes fade-in {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
            animation: fade-in 0.5s ease-out forwards;
        }
        @keyframes loading {
            0% { transform: translateX(-100%); }
            50% { transform: translateX(100%); }
            100% { transform: translateX(-100%); }
        }
      `}</style>
    </div>
  );
};

export default App;

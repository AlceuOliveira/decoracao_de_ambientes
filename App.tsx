import React, { useState } from 'react';
import { LayoutTemplate, ArrowRight, CheckCircle2, Palette, Armchair, DollarSign, Loader2, Trash2, Images, Wand2 } from 'lucide-react';
import { 
  AppStep, 
  AppState, 
  INITIAL_PREFERENCES, 
  DesignResult, 
  DesignPreferences,
  ImageVariation 
} from './types';
import { analyzeRoomStructure, generateDecoratedRoom, getDesignDetailsAndShopping } from './services/geminiService';

// Components
import { Button } from './components/Button';
import { FileUpload } from './components/FileUpload';
import { ResultView } from './components/ResultView';
import { StepWizard } from './components/StepWizard';

// --- OPTIONS CONSTANTS ---
const ROOM_TYPES = ['Sala de Estar', 'Quarto', 'Cozinha', 'Escritório', 'Banheiro', 'Varanda'];
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

  // Temporary state for file upload step before proceeding
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  
  // State for custom inputs
  const [isCustomStyle, setIsCustomStyle] = useState(false);
  const [customStyleText, setCustomStyleText] = useState('');
  
  const [isCustomRoomType, setIsCustomRoomType] = useState(false);
  const [customRoomTypeText, setCustomRoomTypeText] = useState('');

  // --- ACTIONS ---

  const updatePref = (key: keyof DesignPreferences, value: any) => {
    setState(prev => ({
      ...prev,
      preferences: { ...prev.preferences, [key]: value }
    }));
  };

  const handleFilesSelect = (newBase64s: string[]) => {
    setUploadedImages(prev => [...prev, ...newBase64s]);
  };

  const removeUploadedImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleContinueFromUpload = () => {
    if (uploadedImages.length > 0) {
      // Initialize variations
      const initialVariations: ImageVariation[] = uploadedImages.map((img, idx) => ({
        id: `var-${idx}-${Date.now()}`,
        original: img,
        generated: null
      }));

      setState(prev => ({
        ...prev,
        result: { ...prev.result, variations: initialVariations },
        step: AppStep.ROOM_DETAILS
      }));
    }
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
    setUploadedImages([]);
    setIsCustomStyle(false);
    setCustomStyleText('');
    setIsCustomRoomType(false);
    setCustomRoomTypeText('');
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
      // Step 1: Analysis
      // We analyze only the first image to save time/tokens and establish a baseline context for the room.
      setState(prev => ({ ...prev, loadingStage: 'Analisando estrutura do ambiente...' }));
      const structuralAnalysis = await analyzeRoomStructure(currentVariations[0].original);
      
      // Step 2: Generation (Parallel for all images)
      setState(prev => ({ 
        ...prev, 
        result: { ...prev.result, structuralAnalysis },
        loadingStage: `Gerando ${currentVariations.length} variações decorativas...` 
      }));
      
      // Process all images
      const generatedResults = await Promise.all(
        currentVariations.map(async (v) => {
          try {
            const generated = await generateDecoratedRoom(v.original, state.preferences, structuralAnalysis);
            return { ...v, generated };
          } catch (err) {
            console.error("Failed to generate variation for one image", err);
            return v; // Return original if failed
          }
        })
      );

      const validGeneratedResults = generatedResults.filter(r => r.generated !== null);

      if (validGeneratedResults.length === 0) {
          throw new Error("Falha ao gerar imagens.");
      }

      // Step 3: Details & Shopping
      // We analyze the first successfully generated image for the shopping list concept
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

  // --- RENDERERS ---

  const renderWelcome = () => (
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
        onClick={() => setState(prev => ({ ...prev, step: AppStep.UPLOAD }))}
        className="text-lg px-10 py-4"
        icon={<ArrowRight className="w-5 h-5" />}
      >
        Começar Agora
      </Button>
    </div>
  );

  const renderUpload = () => (
    <div className="max-w-xl mx-auto pt-12 px-4 pb-24">
       <button onClick={() => setState(prev => ({ ...prev, step: AppStep.WELCOME }))} className="mb-6 text-stone-400 hover:text-stone-900 text-sm">← Voltar</button>
      <h2 className="text-3xl font-serif text-stone-900 mb-2">O ambiente</h2>
      <p className="text-stone-500 mb-8">Envie imagens ou um vídeo curto do espaço que deseja transformar.</p>
      
      <div className="space-y-6">
        <FileUpload onFilesSelected={handleFilesSelect} />

        {/* Image Grid Preview */}
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

      {/* Floating Continue Button */}
      {uploadedImages.length > 0 && (
          <div className="fixed bottom-6 left-0 right-0 px-4 z-50 animate-fade-in">
             <div className="max-w-md mx-auto">
                <Button 
                    fullWidth 
                    onClick={handleContinueFromUpload}
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

  const renderRoomDetails = () => (
    <StepWizard 
      stepIndex={1} 
      totalSteps={2} 
      title="Detalhes do Espaço" 
      description="Ajude a IA a entender o contexto do seu ambiente."
      onBack={handleBack}
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
                            state.preferences.roomType === type && !isCustomRoomType
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
            
            {/* Custom Room Type Input */}
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
                value={state.preferences.functionality}
                onChange={(e) => updatePref('functionality', e.target.value)}
                placeholder="Ex: Relaxar após o trabalho, receber amigos para jantar, espaço criativo para as crianças..."
                className="w-full p-4 rounded-xl border border-stone-200 focus:border-stone-900 focus:ring-0 outline-none bg-white transition-all min-h-[120px] resize-y"
            />
        </div>

         {/* Continue Button */}
         <div className="pt-6">
            <Button 
                fullWidth 
                onClick={handleNext} 
                disabled={!state.preferences.roomType || !state.preferences.functionality}
                icon={<ArrowRight className="w-4 h-4"/>}
            >
                Próximo
            </Button>
        </div>
      </div>
    </StepWizard>
  );

  const renderStylePrefs = () => (
    <StepWizard 
      stepIndex={2} 
      totalSteps={2} 
      title="Estilo & Vibe" 
      description="Defina a personalidade da sua nova decoração."
      onBack={handleBack}
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
                            state.preferences.style === style && !isCustomStyle
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
            
            {/* Custom Style Input */}
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
                {/* Automatic Option */}
                <button
                    onClick={() => {
                        const isAuto = state.preferences.colors.includes('Automática');
                        updatePref('colors', isAuto ? [] : ['Automática']);
                    }}
                    className={`flex-shrink-0 w-16 flex flex-col items-center gap-2 group`}
                >
                    <div 
                        className={`w-12 h-12 rounded-full border-2 transition-all flex items-center justify-center overflow-hidden relative ${state.preferences.colors.includes('Automática') ? 'border-stone-900 scale-110' : 'border-transparent group-hover:scale-105'}`}
                    >
                         <div className="absolute inset-0 bg-gradient-to-tr from-blue-400 via-purple-400 to-orange-400 opacity-80"></div>
                         <Wand2 className={`w-5 h-5 relative z-10 ${state.preferences.colors.includes('Automática') ? 'text-white' : 'text-white/90'}`} />
                    </div>
                    <span className="text-xs font-medium text-stone-600">Automática</span>
                </button>

                {/* Preset Colors */}
                {PRESET_COLORS.map(color => {
                    const isSelected = state.preferences.colors.includes(color.name);
                    return (
                        <button
                            key={color.name}
                            onClick={() => {
                                // Remove "Automática" if specific color selected
                                const currentColors = state.preferences.colors.filter(c => c !== 'Automática');
                                
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
                            state.preferences.budget === budget 
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
                onClick={handleNext} 
                disabled={!state.preferences.style || state.preferences.colors.length === 0}
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200"
                icon={<Palette className="w-4 h-4"/>}
            >
                Gerar Decoração
            </Button>
        </div>
      </div>
    </StepWizard>
  );

  const renderLoading = () => (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center animate-pulse">
        <div className="relative">
            <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-20"></div>
            <div className="w-20 h-20 bg-white rounded-full border-4 border-stone-100 flex items-center justify-center relative z-10 shadow-xl">
                <Loader2 className="w-8 h-8 text-stone-900 animate-spin" />
            </div>
        </div>
        
        <h3 className="text-2xl font-serif text-stone-900 mt-8 mb-2">Criando seu espaço</h3>
        <p className="text-stone-500 font-medium">{state.loadingStage}</p>
        
        {state.result.variations.length > 1 && (
             <div className="flex gap-2 mt-4 justify-center opacity-50">
                <Images className="w-4 h-4 text-stone-400" />
                <span className="text-xs text-stone-400">Processando {state.result.variations.length} imagens</span>
             </div>
        )}

        <div className="mt-12 w-64 h-1 bg-stone-100 rounded-full overflow-hidden">
            <div className="h-full bg-stone-900 animate-[loading_2s_ease-in-out_infinite]" style={{width: '50%'}}></div>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-stone-50 font-sans selection:bg-stone-200 text-stone-900 pb-12">
      {/* Simple Header */}
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
        {state.step === AppStep.WELCOME && renderWelcome()}
        {state.step === AppStep.UPLOAD && renderUpload()}
        {state.step === AppStep.ROOM_DETAILS && renderRoomDetails()}
        {state.step === AppStep.STYLE_PREFS && renderStylePrefs()}
        {state.step === AppStep.GENERATING && renderLoading()}
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
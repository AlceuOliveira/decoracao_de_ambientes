import React, { useState } from 'react';
import { DesignResult } from '../types';
import { ShoppingBag, RefreshCw, ExternalLink, Layers, Download } from 'lucide-react';
import { Button } from './Button';

interface ResultViewProps {
  result: DesignResult;
  onRestart: () => void;
}

export const ResultView: React.FC<ResultViewProps> = ({ result, onRestart }) => {
  const [activeTab, setActiveTab] = useState<'visual' | 'details'>('visual');
  const [activeVariationIndex, setActiveVariationIndex] = useState(0);
  const [sliderValue, setSliderValue] = useState(50);

  const activeVariation = result.variations[activeVariationIndex];
  
  // Fallback if something goes wrong with index
  if (!activeVariation) return null;

  const displayOriginal = activeVariation.original;
  const displayGenerated = activeVariation.generated || activeVariation.original;

  const handleDownload = () => {
    if (!activeVariation.generated) return;
    
    const link = document.createElement('a');
    link.href = activeVariation.generated;
    link.download = `lumina-design-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full max-w-4xl mx-auto pb-24 animate-fade-in">
      {/* Header */}
      <div className="text-center mb-8">
        <span className="inline-block px-3 py-1 rounded-full bg-green-100 text-green-800 text-xs font-bold tracking-wider mb-3">
          TRANSFORMAÇÃO CONCLUÍDA
        </span>
        <h2 className="text-3xl font-serif text-stone-900">Seu novo ambiente</h2>
      </div>

      {/* Image Compare / Visualizer */}
      <div className="bg-white rounded-3xl shadow-2xl shadow-stone-200 overflow-hidden border border-stone-100 mb-6 relative group">
        
        {activeTab === 'visual' && (
          <div className="relative w-full aspect-[4/3] sm:aspect-[16/9] select-none">
             {/* The generated image (background) */}
            <img 
              src={displayGenerated} 
              alt="New Design" 
              className="absolute inset-0 w-full h-full object-cover" 
            />

            {/* The original image (foreground, clipped) */}
            {activeVariation.generated && (
              <div 
                className="absolute inset-0 w-full h-full overflow-hidden border-r-2 border-white/80"
                style={{ width: `${sliderValue}%` }}
              >
                <img 
                  src={displayOriginal} 
                  alt="Original" 
                  className="absolute inset-0 w-full h-full object-cover max-w-none"
                  style={{ width: `${100 / (sliderValue / 100)}%` }} // Counteract container shrink
                />
                <div className="absolute bottom-4 left-4 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-md">
                  Original
                </div>
              </div>
            )}

            {activeVariation.generated && (
               <div className="absolute bottom-4 right-4 bg-white/90 text-stone-900 text-xs px-2 py-1 rounded backdrop-blur-md font-medium shadow-sm">
                  IA Design
               </div>
            )}

            {/* Slider Control */}
            {activeVariation.generated && (
              <input
                type="range"
                min="0"
                max="100"
                value={sliderValue}
                onChange={(e) => setSliderValue(Number(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20"
              />
            )}
            
            {/* Slider Handle Visual */}
            {activeVariation.generated && (
              <div 
                className="absolute inset-y-0 z-10 pointer-events-none"
                style={{ left: `${sliderValue}%` }}
              >
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 bg-white rounded-full shadow-xl flex items-center justify-center">
                  <Layers className="w-4 h-4 text-stone-900" />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Thumbnail Selector (if multiple images) */}
      {result.variations.length > 1 && activeTab === 'visual' && (
        <div className="flex gap-3 justify-center mb-8 overflow-x-auto py-2 px-4">
            {result.variations.map((variation, idx) => (
                <button 
                    key={variation.id}
                    onClick={() => setActiveVariationIndex(idx)}
                    className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
                        idx === activeVariationIndex 
                        ? 'border-stone-900 ring-2 ring-stone-200 scale-105 z-10' 
                        : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                >
                    <img src={variation.generated || variation.original} className="w-full h-full object-cover" alt={`View ${idx + 1}`} />
                </button>
            ))}
        </div>
      )}

      {/* Content Tabs */}
      <div className="flex justify-center mb-8">
        <div className="bg-white p-1.5 rounded-xl shadow-sm border border-stone-200 inline-flex">
          <button 
            onClick={() => setActiveTab('visual')}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'visual' ? 'bg-stone-900 text-white shadow-md' : 'text-stone-500 hover:text-stone-900'}`}
          >
            Visualização
          </button>
          <button 
            onClick={() => setActiveTab('details')}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'details' ? 'bg-stone-900 text-white shadow-md' : 'text-stone-500 hover:text-stone-900'}`}
          >
            Conceito e Compras
          </button>
        </div>
      </div>

      {/* Details Section */}
      <div className={`grid md:grid-cols-2 gap-8 ${activeTab === 'details' ? 'block' : 'hidden md:grid'}`}>
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm">
                <h3 className="font-serif text-xl text-stone-900 mb-3">O Conceito</h3>
                <p className="text-stone-600 leading-relaxed">
                    {result.designConcept}
                </p>
            </div>
            
            <div className="bg-stone-50 p-6 rounded-2xl border border-stone-200/60">
                <h3 className="text-sm font-bold uppercase tracking-wider text-stone-400 mb-3">Análise Estrutural</h3>
                <p className="text-xs text-stone-500 leading-relaxed font-mono">
                    {result.structuralAnalysis}
                </p>
            </div>
        </div>

        <div className="space-y-4">
            <h3 className="font-serif text-xl text-stone-900 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5" />
                Sugestões de Compra
            </h3>
            
            <div className="grid gap-3">
                {result.shoppingList.map((item, idx) => (
                    <a 
                        key={idx}
                        href={`https://www.google.com/search?q=${encodeURIComponent(item.queryTerm)}&tbm=shop`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group bg-white p-4 rounded-xl border border-stone-200 hover:border-stone-400 hover:shadow-md transition-all flex justify-between items-center"
                    >
                        <div>
                            <h4 className="font-medium text-stone-900 group-hover:text-blue-600 transition-colors">
                                {item.name}
                            </h4>
                            <p className="text-sm text-stone-500 mt-0.5">{item.description}</p>
                            <span className="inline-block mt-2 text-xs font-bold bg-stone-100 px-2 py-1 rounded text-stone-600">
                                Est. {item.estimatedPrice}
                            </span>
                        </div>
                        <ExternalLink className="w-4 h-4 text-stone-300 group-hover:text-blue-600" />
                    </a>
                ))}
            </div>
        </div>
      </div>

      {/* Sticky Footer Actions */}
      <div className="fixed bottom-6 left-0 right-0 px-4 z-50">
        <div className="max-w-md mx-auto flex gap-3">
          <Button 
             onClick={onRestart} 
             variant="secondary" 
             className="flex-1 shadow-xl border border-white/20 backdrop-blur-md bg-white/80"
             icon={<RefreshCw className="w-4 h-4" />}
            >
            Novo
          </Button>
          
          <Button 
             onClick={handleDownload} 
             variant="primary" 
             className="flex-1 shadow-xl shadow-stone-900/20"
             icon={<Download className="w-4 h-4" />}
             disabled={!activeVariation.generated}
            >
            Salvar
          </Button>
        </div>
      </div>
    </div>
  );
};
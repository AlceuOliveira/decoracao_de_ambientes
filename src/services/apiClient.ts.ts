// Caminho: src/services/apiClient.ts
// Este arquivo é SEGURO para rodar no frontend.
// Ele apenas chama a nossa própria API interna.

import { DesignPreferences } from '../types';

// Função para chamar a rota de análise
export const analyzeRoomStructure = async (base64Image: string): Promise<string> => {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: base64Image }),
  });
  if (!response.ok) throw new Error('Falha na análise da API');
  const data = await response.json();
  return data.analysis;
};

// Função para chamar a rota de geração
export const generateDecoratedRoom = async (
  base64Image: string,
  preferences: DesignPreferences,
  structuralAnalysis: string
): Promise<string> => {
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: base64Image, preferences, analysis: structuralAnalysis }),
  });
  if (!response.ok) throw new Error('Falha na geração da API');
  const data = await response.json();
  return data.image;
};

// Função para chamar a rota de detalhes/compras
export const getDesignDetailsAndShopping = async (
  originalImage: string,
  generatedImage: string,
  preferences: DesignPreferences
) => {
  const response = await fetch('/api/details', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ originalImage, generatedImage, preferences }),
  });
  if (!response.ok) throw new Error('Falha na obtenção de detalhes da API');
  return await response.json();
};

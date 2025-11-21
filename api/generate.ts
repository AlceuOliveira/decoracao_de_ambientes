// Caminho: api/generate.ts (Backend)

import { GoogleGenerativeAI } from "@google/generative-ai";

// Aumenta o tempo limite, pois a geração de imagem pode demorar
export const config = {
  maxDuration: 60, 
};

export default async function handler(req: any, res: any) {
  // 1. Garante que o método é POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 2. Extrai os dados do corpo da requisição
    const { image, preferences, analysis } = req.body;

    // 3. Inicializa a API da Gemini com a chave secreta
    const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    // Usamos o modelo 'gemini-1.5-flash' que é rápido e bom com imagens
    const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });

    // 4. Constrói o prompt detalhado para a IA
    const prompt = `
      Transforme a imagem deste ambiente com base nas seguintes preferências de design.
      Mantenha a estrutura original do cômodo (janelas, portas, layout geral) que foi analisada como: "${analysis}".
      
      Preferências do Usuário:
      - Estilo de Decoração: ${preferences.style}
      - Paleta de Cores: ${preferences.colors.join(', ')}
      - Orçamento: ${preferences.budget}
      - Objetivo do Ambiente: ${preferences.functionality}

      Seja criativo e gere uma imagem fotorrealista da nova decoração. A imagem de saída deve ser apenas a imagem decorada, sem texto ou outros artefatos.
    `;

    // 5. Prepara a imagem para enviar para a API
    const imagePart = { inlineData: { data: image.split(',')[1], mimeType: 'image/jpeg' } };

    // 6. Chama a API da Gemini para gerar a nova imagem
    const result = await model.generateContent([prompt, imagePart]);
    
    // 7. A API de imagem retorna os dados da imagem diretamente no primeiro bloco
    const generatedImagePart = result.response.candidates![0].content.parts[0];
    if ('inlineData' in generatedImagePart) {
        const base64Image = generatedImagePart.inlineData.data;
        const mimeType = generatedImagePart.inlineData.mimeType;
        
        // 8. Envia a imagem gerada (em base64) de volta para o frontend
        res.status(200).json({ image: `data:${mimeType};base64,${base64Image}` });
    } else {
        throw new Error("A resposta da API não continha uma imagem.");
    }

  } catch (error) {
    // 9. Em caso de erro, registra no console do servidor e envia uma resposta de erro
    console.error("Error in /api/generate:", error);
    res.status(500).json({ error: 'Failed to generate image' });
  }
}

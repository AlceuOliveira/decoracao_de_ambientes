// Dentro de /api/analyze.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from "@google/generative-ai";

// A lógica da sua função foi movida para cá
async function analyzeOnServer(base64Image: string): Promise<string> {
  // Inicializa a Gemini de forma segura no servidor
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  // Remove o cabeçalho do base64, se houver
  const cleanBase64 = base64Image.split(',')[1] || base64Image;

  const response = await model.generateContent({
    contents: [{
      parts: [
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: cleanBase64,
          },
        },
        {
          text: 'Você é um especialista em arquitetura. Analise esta imagem de um ambiente e descreva objetivamente APENAS os elementos estruturais visíveis como: 1. Janelas e iluminação natural. 2. Portas e passagens. 3. Formato aparente do espaço. 4. Piso e teto (materiais visíveis). 5. Limitações físicas (pilastras, vigas). Seja conciso. Não sugira decoração ainda.'
        }
      ]
    }]
  });

  return response.response.text();
}

// O "handler" da Vercel que executa a função
export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  // Pega a imagem em base64 que o frontend enviou
  const { image } = request.body;

  if (!image) {
    return response.status(400).json({ error: 'Image base64 is required' });
  }

  try {
    // Chama a nossa função de análise segura
    const analysisText = await analyzeOnServer(image);
    // Devolve o texto da análise para o frontend
    return response.status(200).json({ text: analysisText });
  } catch (error) {
    console.error("Error in Gemini API call:", error);
    return response.status(500).json({ error: 'Failed to analyze image' });
  }
}

// Caminho: api/analyze.ts (Backend)
import { GoogleGenerativeAI } from "@google/generative-ai";

export const config = {
  maxDuration: 30, // 30 segundos de timeout
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { image } = req.body;
    const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = "Analise a estrutura desta imagem de um cômodo. Descreva os pontos principais como layout, janelas, portas e quaisquer móveis existentes em uma frase curta e direta.";
    const imagePart = { inlineData: { data: image.split(',')[1], mimeType: 'image/jpeg' } };
    
    const result = await model.generateContent([prompt, imagePart]);
    res.status(200).json({ analysis: result.response.text() });

  } catch (error) {
    console.error("Error in /api/analyze:", error);
    res.status(500).json({ error: 'Failed to analyze image' });
  }
}

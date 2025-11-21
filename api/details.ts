// Caminho: api/details.ts (Backend)

import { GoogleGenerativeAI } from "@google/generative-ai";

// Aumenta o tempo limite da função, pois esta chamada pode demorar
export const config = {
  maxDuration: 60, 
};

// Define a estrutura da resposta JSON para garantir consistência
interface DesignDetails {
  concept: string;
  items: {
    name: string;
    description: string;
    category: 'Móveis' | 'Iluminação' | 'Decoração' | 'Têxteis' | 'Outros';
  }[];
}

export default async function handler(req: any, res: any) {
  // 1. Garante que o método da requisição é POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 2. Extrai os dados do corpo da requisição
    const { originalImage, generatedImage, preferences } = req.body;

    // 3. Inicializa a API da Gemini com a chave secreta do ambiente
    const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });

    // 4. Constrói o prompt para a IA
    const prompt = `
      Analise a imagem original e a imagem gerada de um ambiente decorado.
      Com base nas preferências do usuário, forneça um conceito de design e uma lista de compras.
      
      Preferências do Usuário:
      - Estilo: ${preferences.style}
      - Cores: ${preferences.colors.join(', ')}
      - Orçamento: ${preferences.budget}
      - Objetivo: ${preferences.functionality}

      Sua resposta DEVE ser um objeto JSON válido, sem nenhum texto ou formatação adicional (como \`\`\`json).
      O JSON deve seguir EXATAMENTE esta estrutura:
      {
        "concept": "Um breve parágrafo descrevendo o conceito de design, o sentimento e a atmosfera do ambiente gerado.",
        "items": [
          { "name": "Nome do item 1", "description": "Descrição breve do item e por que ele se encaixa no design.", "category": "Móveis | Iluminação | Decoração | Têxteis | Outros" },
          { "name": "Nome do item 2", "description": "Descrição breve do item e por que ele se encaixa no design.", "category": "Móveis | Iluminação | Decoração | Têxteis | Outros" }
        ]
      }
      Crie entre 3 e 5 itens para a lista de compras.
    `;

    // 5. Prepara as imagens para enviar para a API
    const originalImagePart = { inlineData: { data: originalImage.split(',')[1], mimeType: 'image/jpeg' } };
    const generatedImagePart = { inlineData: { data: generatedImage.split(',')[1], mimeType: 'image/jpeg' } };

    // 6. Chama a API da Gemini
    const result = await model.generateContent([prompt, originalImagePart, generatedImagePart]);
    const jsonText = result.response.text();

    // 7. Limpa e converte a resposta de texto para um objeto JSON
    // Às vezes, a IA pode retornar o JSON dentro de um bloco de código markdown.
    const cleanedJsonText = jsonText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsedResult: DesignDetails = JSON.parse(cleanedJsonText);

    // 8. Envia a resposta JSON de volta para o frontend
    res.status(200).json(parsedResult);

  } catch (error) {
    // 9. Em caso de erro, registra no console do servidor e envia uma resposta de erro
    console.error("Error in /api/details:", error);
    res.status(500).json({ error: 'Failed to get design details' });
  }
}

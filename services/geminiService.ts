import { GoogleGenAI, Type, Schema } from "@google/genai";
import { DesignPreferences, ShoppingItem } from "../types";

// Initialize the client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Step 1: Analyze the structural elements of the room.
 */
export const analyzeRoomStructure = async (base64Image: string): Promise<string> => {
  try {
    // Remove header if present (data:image/jpeg;base64,)
    const cleanBase64 = base64Image.split(',')[1] || base64Image;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: cleanBase64
            }
          },
          {
            text: `Você é um especialista em arquitetura. Analise esta imagem de um ambiente. 
            Identifique e descreva objetivamente APENAS os elementos estruturais visíveis:
            1. Janelas e iluminação natural.
            2. Portas e passagens.
            3. Formato aparente do espaço.
            4. Piso e teto (materiais visíveis).
            5. Limitações físicas (pilastras, vigas).
            Seja conciso. Não sugira decoração ainda.`
          }
        ]
      }
    });

    return response.text || "Não foi possível analisar a estrutura do ambiente.";
  } catch (error) {
    console.error("Error analyzing room:", error);
    throw new Error("Falha ao analisar a estrutura do ambiente.");
  }
};

/**
 * Step 2: Generate the decorated image.
 * Uses the image editing capabilities (Input Image + Prompt -> Output Image).
 */
export const generateDecoratedRoom = async (
  base64Image: string,
  prefs: DesignPreferences,
  analysis: string
): Promise<string> => {
  try {
    const cleanBase64 = base64Image.split(',')[1] || base64Image;

    const isAutoColor = prefs.colors.includes('Automática');
    const colorsPrompt = isAutoColor 
      ? "ESCOLHA AUTOMÁTICA DE CORES: Selecione a paleta de cores mais harmoniosa e profissional que combine perfeitamente com o estilo escolhido e a iluminação do ambiente."
      : `Cores principais: ${prefs.colors.join(', ')}.`;

    const prompt = `
      Transforme esta imagem de ambiente interior.
      Estilo: ${prefs.style}.
      ${colorsPrompt}
      Função do espaço: ${prefs.functionality}.
      Orçamento visual: ${prefs.budget}.
      
      Considere esta estrutura existente: ${analysis}.
      
      A imagem deve ser fotorrealista, alta resolução, mantendo a perspectiva exata da sala original, mas totalmente decorada e mobiliada de acordo com o estilo solicitado. Iluminação cinematográfica e aconchegante.
    `;

    // Using gemini-2.5-flash-image for editing/generation tasks as per guidelines for general image tasks
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image', 
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: cleanBase64
            }
          },
          {
            text: prompt
          }
        ]
      }
    });

    // Extract image from response
    // The model returns the image in inlineData within candidates
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData && part.inlineData.data) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    
    throw new Error("Nenhuma imagem foi gerada.");
  } catch (error) {
    console.error("Error generating design:", error);
    throw new Error("Falha ao gerar a decoração.");
  }
};

/**
 * Step 3: Describe the design and suggest products (JSON output).
 */
export const getDesignDetailsAndShopping = async (
  originalImage: string,
  generatedImage: string,
  prefs: DesignPreferences
): Promise<{ concept: string; items: ShoppingItem[] }> => {
  try {
    const cleanGenerated = generatedImage.split(',')[1] || generatedImage;

    const prompt = `
      Atue como um designer de interiores de luxo. Analise esta imagem recém-decorada.
      Estilo aplicado: ${prefs.style}.
      
      1. Escreva um parágrafo curto e inspirador sobre o conceito do design (harmonia, texturas, escolha de móveis).
      2. Liste 4 a 6 itens principais visíveis na imagem para compra.
      3. IMPORTANT: All estimated prices MUST be in Brazilian Real (R$). Format example: "R$ 2.500".
      
      Responda EXCLUSIVAMENTE em JSON.
    `;

    const responseSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        concept: { type: Type.STRING, description: "A short, inspiring paragraph about the design concept." },
        items: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              description: { type: Type.STRING },
              estimatedPrice: { type: Type.STRING, description: "Estimated price range in Brazilian Real (R$), e.g., 'R$ 1.200'" },
              queryTerm: { type: Type.STRING, description: "Search term to find this product online" }
            },
            required: ["name", "description", "estimatedPrice", "queryTerm"]
          }
        }
      },
      required: ["concept", "items"]
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/png',
              data: cleanGenerated // Analyze the result image
            }
          },
          {
            text: prompt
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No JSON returned");

    return JSON.parse(jsonText);

  } catch (error) {
    console.error("Error getting details:", error);
    return {
      concept: "Um design moderno focado em conforto e estética.",
      items: []
    };
  }
};
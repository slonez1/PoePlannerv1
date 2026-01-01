import { GoogleGenAI, Type } from "@google/genai";
import { Recipe } from "../types";

const recipeSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    ingredients: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          item: { type: Type.STRING },
          amount: { type: Type.STRING }
        },
        required: ["item", "amount"]
      }
    },
    instructions: {
      type: Type.ARRAY,
      items: { type: Type.STRING }
    },
    prepTime: { type: Type.STRING },
    cookTime: { type: Type.STRING },
    servings: { type: Type.STRING },
    imageUrl: { type: Type.STRING, description: "A DIRECT link to a high-quality JPG/PNG image of the final cooked, plated dish found in the content. Do not use author photos or step-by-step images." },
    sourceUrl: { type: Type.STRING, description: "The original URL of the recipe source if provided." },
    tags: {
      type: Type.ARRAY,
      items: { type: Type.STRING }
    },
    category: { type: Type.STRING }
  },
  required: ["title", "ingredients", "instructions"]
};

/**
 * Generates a high-quality dish image using gemini-3-pro-image-preview.
 * This model is used because the prompt requests 4K resolution.
 */
export const generateDishImage = async (dishTitle: string): Promise<string> => {
  // Create a new instance to ensure we use the latest API key from potential user selection
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [
          {
            text: `High-quality, professional food photography of the completed final dish: ${dishTitle}. Close up, shallow depth of field, natural lighting, elegantly plated. Only the food, no interface elements, no text.`,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
          imageSize: "4K"
        }
      }
    });
    
    // Iterate through all parts to find the image part as per guidelines
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image generated");
  } catch (error: any) {
    console.error("Error generating dish image:", error);
    // Graceful fallback to a high-quality placeholder
    return `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800&auto=format&fit=crop`;
  }
};

/**
 * Extracts structured recipe data from unstructured text using Gemini 3 Flash.
 */
export const extractRecipeFromText = async (input: string): Promise<Partial<Recipe>> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Extract the following recipe data from this input: ${input}.
      
      STRICT IMAGE SELECTION RULES:
      1.  Prioritize OpenGraph images (<meta property="og:image">) or JSON-LD Recipe Schema images.
      2.  Look for the largest, high-resolution image on the page showing the FINISHED dish.
      3.  Keywords to LOOK FOR in image URLs/Alt text: "plated", "finished", "serving", "hero", "main".
      4.  Keywords to AVOID: "process", "step", "raw", "ingredient", "chopping", "mixing", "profile", "banner".
      
      Return strictly valid JSON matching the schema provided.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: recipeSchema
      }
    });

    const data = JSON.parse(response.text || "{}");
    
    // Safety check: Ensure arrays are actually arrays to prevent UI crashes
    return {
      title: data.title || "Untitled Recipe",
      ingredients: Array.isArray(data.ingredients) ? data.ingredients : [],
      instructions: Array.isArray(data.instructions) ? data.instructions : [],
      tags: Array.isArray(data.tags) ? data.tags : [],
      rating: 0,
      notes: "",
      imageUrl: data.imageUrl,
      category: data.category || "General",
      prepTime: data.prepTime,
      cookTime: data.cookTime,
      servings: data.servings,
      sourceUrl: data.sourceUrl,
      id: crypto.randomUUID(),
    };
  } catch (error) {
    console.error("Error extracting recipe:", error);
    throw error;
  }
};

/**
 * Discovers recipes using Google Search grounding.
 */
export const discoverRecipes = async (query: string): Promise<any[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Find 5 excellent recipes for: ${query}. Provide a brief summary for each.`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    // Always extract grounding chunks to display source links as per guidelines
    return [{ 
      text: response.text, 
      links: response.candidates?.[0]?.groundingMetadata?.groundingChunks || [] 
    }];
  } catch (error) {
    console.error("Error discovering recipes:", error);
    throw error;
  }
};
import { GoogleGenAI } from "@google/genai";
import { products } from '../constants';

const getGeminiService = () => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY is not configured in environment variables.");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const getAIStyleAdvice = async (userPrompt: string): Promise<string> => {
  const ai = getGeminiService();

  const productList = products.map(p => `${p.name} (${p.category}, ₹${p.price.toLocaleString('en-IN')})`).join(', ');

  const fullPrompt = `Based on the user's request: "${userPrompt}", recommend jewellery from the following list: ${productList}.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: fullPrompt,
      config: {
        systemInstruction: `You are an expert jewellery stylist for a luxury brand named 'Blessing Ornaments'. Your tone is elegant, helpful, and sophisticated.
        - Analyze the user's request for an occasion, style preference, or recipient.
        - Recommend 2-3 specific pieces from the provided list that are a perfect match.
        - For each recommendation, briefly explain *why* it fits the user's request in a sentence or two.
        - Format your response as clean, readable text. Use markdown for bolding product names. Do not use headings or lists.
        - If the user's request is irrelevant to jewellery, politely decline and steer them back to seeking style advice.
        - Keep your entire response concise and under 100 words.`,
        temperature: 0.7,
      }
    });
    return response.text;
  } catch (error) {
    console.error("Error fetching AI style advice:", error);
    return "I'm sorry, I'm having trouble connecting to my creative circuits at the moment. Please try again shortly.";
  }
};
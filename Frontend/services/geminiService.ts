import { GoogleGenAI, FunctionDeclaration, Type } from "@google/genai";
import { SalesDataPoint, NavigationAction } from '../types';

const getSalesSummary = async (salesData: SalesDataPoint[]): Promise<string> => {
  if (!process.env.API_KEY) {
    return Promise.resolve("This is a mock AI insight. In a real application, Gemini would analyze your sales data to provide a summary and actionable advice. For example, it might notice a dip in mid-week sales and suggest a targeted promotion.");
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const formattedData = salesData.map(d => `${d.name}: $${d.sales}`).join(', ');
    const prompt = `
      Analyze the following weekly sales data for an e-commerce store and provide a concise summary of the trend.
      Based on the trend, suggest one actionable business insight to help increase sales.
      Keep the tone professional and helpful for a business administrator.
      Format the response as two paragraphs: one for the summary and one for the insight.

      Sales Data: ${formattedData}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return "There was an error generating insights. Please try again later.";
  }
};

const navigateFunctionDeclaration: FunctionDeclaration = {
  name: 'navigate',
  description: 'Navigates the user to a specific page in the admin dashboard and applies optional filters, search terms, or sorting.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      page: {
        type: Type.STRING,
        description: 'The page to navigate to.',
        // Fix: Expanded enum to include all possible navigation pages.
        enum: ['dashboard', 'inventory', 'orders', 'customers', 'analytics', 'discounts', 'banners', 'profile', 'settings', 'rich-content', 'logs'],
      },
      searchTerm: {
        type: Type.STRING,
        description: 'A term to search for on the specified page.',
      },
      statusFilter: {
        type: Type.STRING,
        description: 'A status to filter by on the specified page (e.g., "Pending", "Active", "Out of Stock").',
      },
      sortBy: {
          type: Type.STRING,
          description: 'The field to sort by (e.g., "totalSpend", "registrationDate").'
      },
      sortDirection: {
          type: Type.STRING,
          description: 'The direction to sort in.',
          enum: ['asc', 'desc']
      }
    },
    required: ['page'],
  },
};

export const getIntelligentSearchResult = async (query: string): Promise<NavigationAction | null> => {
  if (!process.env.API_KEY) {
    return null;
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `You are a helpful assistant for an e-commerce admin dashboard. Your task is to interpret user search queries and translate them into structured navigation commands.
    Analyze the user's query and call the "navigate" function with the appropriate parameters.
    
    Examples:
    - "show me all pending orders" -> navigate({ page: 'orders', statusFilter: 'Pending' })
    - "find customer Rohan Sharma" -> navigate({ page: 'customers', searchTerm: 'Rohan Sharma' })
    - "products that are out of stock" -> navigate({ page: 'inventory', statusFilter: 'Out of Stock' })
    - "which customers spent the most" -> navigate({ page: 'customers', sortBy: 'totalSpend', sortDirection: 'desc' })
    - "active discount codes" -> navigate({ page: 'discounts', statusFilter: 'Active' })
    - "show me my dashboard" -> navigate({ page: 'dashboard' })

    User query: "${query}"`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ functionDeclarations: [navigateFunctionDeclaration] }],
      },
    });

    if (response.functionCalls && response.functionCalls.length > 0) {
      const functionCall = response.functionCalls[0];
      if (functionCall.name === 'navigate') {
        return functionCall.args as NavigationAction;
      }
    }
    
    return null;
  } catch (error) {
    console.error("Error calling Gemini API for intelligent search:", error);
    return null;
  }
};


export { getSalesSummary };

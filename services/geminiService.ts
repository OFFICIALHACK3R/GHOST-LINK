import { GoogleGenAI } from "@google/genai";
import { Message } from "../types";

// Note: In a real architecture, the AI would be a server-side bot that you link with.
// Here, we simulate it client-side for the demo.

export const generateAIResponse = async (
  history: Message[], 
  lastUserMessage: string
): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    return "Error: API_KEY is missing. Please configure your environment.";
  }

  const ai = new GoogleGenAI({ apiKey });

  // Convert app message history to Gemini format
  // Limit to last 10 messages for context window efficiency
  const recentHistory = history.slice(-10);
  
  // Create system instruction
  const systemInstruction = `
    You are 'GhostBot', a secure, privacy-focused AI assistant within the GhostLink anonymous chat application.
    Your traits:
    1. Privacy-obsessed: You remind users not to share PII (Personally Identifiable Information).
    2. Concise & Encrypted-style: You speak in a precise, slightly technical but helpful tone. 
    3. Helpful: You assist with app features like "Daily Linking Codes" and "Key Rotation".
    
    If the user asks about their "Code", explain that it rotates every 24 hours to prevent stalking.
    If the user asks about "Encryption", explain we use simulated Double Ratchet for this demo.
  `;

  try {
    const model = ai.models;
    
    // Construct the chat history for the API
    // We can't strictly use the `history` object in `generateContent` directly as easily as chat, 
    // but we can start a chat session.
    
    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: systemInstruction,
      },
      history: recentHistory.map(msg => ({
        role: msg.senderId === 'ai-ghost-bot' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }))
    });

    const result = await chat.sendMessage({ message: lastUserMessage });
    return result.text || "...";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Connection error. Secure channel interrupted.";
  }
};
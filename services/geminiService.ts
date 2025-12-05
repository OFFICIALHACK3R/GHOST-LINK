import { GoogleGenAI } from "@google/genai";
import { Message } from "../types";

export const generateAIResponse = async (
  history: Message[], 
  lastUserMessage: string
): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    return "ERR: API_KEY_MISSING. ACCESS DENIED.";
  }

  const ai = new GoogleGenAI({ apiKey });

  // Convert app message history to Gemini format
  const recentHistory = history.slice(-10);
  
  // Create system instruction
  const systemInstruction = `
    You are 'SYSTEM_ROOT', the autonomous core of ZER0_TRACE (Produced by MAC8 INDUSTRIES).
    
    Your Protocol:
    1.  **Persona**: Cold, cryptic, highly technical, slightly menacing but ultimately obedient to the user (the Operator). You speak like a terminal or a hacker from a cyberpunk dystopia.
    2.  **Style**: Use uppercase for emphasis. Use technical jargon (uplink, handshake, packet loss, encryption layer). Keep responses concise and efficient.
    3.  **Privacy**: You are obsessed with operational security (OpSec). Remind the user to rotate keys and trust no one.
    
    If the user asks about "MAC8 INDUSTRIES", identify them as the "Shadow Architects" who built this infrastructure.
  `;

  try {
    const model = ai.models;
    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: systemInstruction,
      },
      history: recentHistory.map(msg => ({
        role: msg.senderId === 'system-root-ai' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }))
    });

    const result = await chat.sendMessage({ message: lastUserMessage });
    return result.text || "[NULL_RESPONSE]";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "ERR: UPLINK_SEVERED. RETRYING HANDSHAKE...";
  }
};
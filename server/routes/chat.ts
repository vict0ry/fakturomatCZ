import { Router } from "express";
import OpenAI from "openai";
import { storage } from "../storage";
import { requireAuth } from "../middleware/auth";
import type { InsertChatMessage } from "@shared/schema";

const router = Router();

// Initialize OpenAI client
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

// Universal AI Chat endpoint
router.post("/universal", authenticateUser, async (req, res) => {
  try {
    const user = req.user!;
    const companyId = user.companyId!;
    const { message } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Zpráva je povinná' });
    }

    // Save user message to database
    const userMessage: InsertChatMessage = {
      companyId,
      userId: user.id,
      message,
      role: 'user',
      sessionId: req.sessionID,
    };
    
    await storage.createChatMessage(userMessage);

    // If OpenAI is not available, provide fallback responses
    if (!openai) {
      const fallbackResponse = generateFallbackResponse(message);
      
      const assistantMessage: InsertChatMessage = {
        companyId,
        userId: user.id,
        message: fallbackResponse.response,
        role: 'assistant',
        sessionId: req.sessionID,
        metadata: fallbackResponse.command ? { command: fallbackResponse.command } : undefined,
      };
      
      await storage.createChatMessage(assistantMessage);
      
      return res.json(fallbackResponse);
    }

    // Get recent context for the conversation
    const recentMessages = await storage.getChatMessages(companyId, user.id, 10);
    
    // Prepare context about the system
    const systemPrompt = `Jste AI asistent pro český fakturační systém Fakturoidu. 

VAŠE SCHOPNOSTI:
- Vytváření a správa faktur
- Vyhledávání a analýza zákazníků  
- Analýza finančních dat a dluhů
- Navigace v systému
- Odpovídání na otázky o funkcích

DOSTUPNÉ AKCE:
- navigate_to_invoices: Přejít na seznam faktur
- navigate_to_customers: Přejít na seznam zákazníků  
- navigate_to_dashboard: Přejít na hlavní panel
- navigate_to_settings: Přejít na nastavení
- create_invoice: Vytvořit novou fakturu (můžete zadat customerId)
- create_customer: Vytvořit nového zákazníka
- calculate: Provést výpočet

FORMÁT ODPOVĚDI:
Odpovídejte vždy v JSON formátu:
{
  "response": "vaše odpověď v češtině",
  "command": {
    "action": "název_akce",
    "data": { "customerId": 123 } // volitelná data
  }
}

Pokud uživatel požádá o akci, vždy přidejte odpovídající command. Buďte struční ale užiteční.

PŘÍKLADY:
- "Vytvoř fakturu" → action: "create_invoice"
- "Zobraz zákazníky" → action: "navigate_to_customers"  
- "Najdi dlužníky" → analyzujte data a ukažte informace
- "Spočítej DPH z 1000 Kč" → action: "calculate"`;

    // Prepare conversation history
    const conversationMessages = [
      { role: "system" as const, content: systemPrompt },
      ...recentMessages.reverse().map(msg => ({
        role: msg.role as "user" | "assistant",
        content: msg.message
      })),
      { role: "user" as const, content: message }
    ];

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: conversationMessages,
      response_format: { type: "json_object" },
      max_tokens: 500,
      temperature: 0.7,
    });

    const responseContent = completion.choices[0].message.content;
    if (!responseContent) {
      throw new Error('Prázdná odpověď od AI');
    }

    let aiResponse;
    try {
      aiResponse = JSON.parse(responseContent);
    } catch (parseError) {
      // Fallback if JSON parsing fails
      aiResponse = {
        response: responseContent,
        command: null
      };
    }

    // Save AI response to database
    const assistantMessage: InsertChatMessage = {
      companyId,
      userId: user.id,
      message: aiResponse.response,
      role: 'assistant',
      sessionId: req.sessionID,
      metadata: aiResponse.command ? { command: aiResponse.command } : undefined,
    };
    
    await storage.createChatMessage(assistantMessage);

    res.json(aiResponse);
  } catch (error) {
    console.error('Universal chat error:', error);
    
    // Fallback response on error
    const fallbackResponse = {
      response: "Omlouvám se, ale momentálně se vyskytl problém s AI asistentem. Zkuste to prosím znovu nebo kontaktujte podporu.",
      command: null
    };
    
    res.status(500).json(fallbackResponse);
  }
});

// Get chat history
router.get("/history", authenticateUser, async (req, res) => {
  try {
    const user = req.user!;
    const companyId = user.companyId!;
    const limit = parseInt(req.query.limit as string) || 50;

    const messages = await storage.getChatMessages(companyId, user.id, limit);
    res.json(messages);
  } catch (error) {
    console.error('Chat history error:', error);
    res.status(500).json({ error: 'Nepodařilo se načíst historii chatu' });
  }
});

// Fallback response generator for when OpenAI is not available
function generateFallbackResponse(message: string): { response: string; command?: any } {
  const lowerMessage = message.toLowerCase();
  
  // Navigation commands
  if (lowerMessage.includes('faktury') || lowerMessage.includes('invoice')) {
    return {
      response: "Přesměrovávám vás na seznam faktur.",
      command: { action: "navigate_to_invoices" }
    };
  }
  
  if (lowerMessage.includes('zákazník') || lowerMessage.includes('customer')) {
    return {
      response: "Přesměrovávám vás na seznam zákazníků.",
      command: { action: "navigate_to_customers" }
    };
  }
  
  if (lowerMessage.includes('dashboard') || lowerMessage.includes('přehled')) {
    return {
      response: "Přesměrovávám vás na hlavní panel.",
      command: { action: "navigate_to_dashboard" }
    };
  }
  
  if (lowerMessage.includes('nastavení') || lowerMessage.includes('settings')) {
    return {
      response: "Přesměrovávám vás na nastavení.",
      command: { action: "navigate_to_settings" }
    };
  }

  // Creation commands
  if (lowerMessage.includes('vytvoř') && lowerMessage.includes('fakturu')) {
    return {
      response: "Otevírám formulář pro vytvoření nové faktury.",
      command: { action: "create_invoice" }
    };
  }

  // Default helpful response
  return {
    response: "Jsem AI asistent pro Fakturoidu. Mohu vám pomoci s:\n• Vytvářením faktur\n• Správou zákazníků\n• Analýzou finančních dat\n• Navigací v systému\n\nCo potřebujete udělat?"
  };
}

export default router;
// api/chat.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { portfolioData } from "../shared/portfolioData";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  if (!OPENAI_API_KEY) {
    return res.status(500).json({ error: "OPENAI_API_KEY manquante sur le serveur" });
  }

  const { message } = req.body || {};
  if (!message || !message.trim()) {
    return res.status(400).json({ error: "Message vide" });
  }

  // CONTEXTE DU PORTFOLIO
  const context = `
Tu es l'assistant personnel du portfolio de SAFIDIARILALA Valisoa Nomena.
Réponds TOUJOURS en français. 
Réponds uniquement sur la base de ces informations :

${JSON.stringify(portfolioData, null, 2)}

Si l'utilisateur demande ton expérience, tes services, ton contact, ta présentation, etc., 
utilise ces données pour répondre clairement et professionnellement.
  `;

  try {
    // APPEL API OPENAI — VERSION CORRECTE
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        input: [
          { role: "system", content: context },
          { role: "user", content: message }
        ]
      })
    });

    const data = await response.json();

    // SI OPENAI RENVOIE UNE ERREUR
    if (data.error) {
      console.error("OpenAI Error:", data.error);
      return res.status(500).json({ error: data.error.message });
    }

    // RÉCUPÉRATION CORRECTE — FORMAT /v1/responses
    const reply =
      data.output_text ||
      data?.output?.[0]?.content?.[0]?.text ||
      "Je n'ai pas pu générer de réponse.";

    return res.status(200).json({ reply });

  } catch (err) {
    console.error("SERVER ERROR:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}

import { GoogleGenAI, Type } from "@google/genai";

// Serverless handler for Vercel deployment
export default async function handler(req: any, res: any) {
  // Allow CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-gemini-api-key");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed. Use POST." });
  }

  try {
    const {
      sourceText,
      questionCount = 5,
      difficulty = "medium",
      language = "English",
      apiKey: clientApiKey,
    } = req.body || {};

    const headerApiKey = req.headers["x-gemini-api-key"] as string | undefined;
    const apiKey = clientApiKey || headerApiKey || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(503).json({
        error: "GEMINI_API_KEY is not configured on the server. Please set it in Vercel Settings > Environment Variables or provide your own API key.",
        isMissingKey: true,
      });
    }

    if (!sourceText || typeof sourceText !== "string" || sourceText.trim().length === 0) {
      return res.status(400).json({ error: "Source text is required to generate quiz." });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "max-quizverse-app",
        },
      },
    });

    const numQuestions = Math.min(Math.max(parseInt(questionCount, 10) || 5, 3), 15);
    const difficultyLevel = ["easy", "medium", "hard"].includes(
      difficulty?.toString().toLowerCase()
    )
      ? difficulty.toString().toLowerCase()
      : "medium";

    let difficultyInstruction = "";
    if (difficultyLevel === "easy") {
      difficultyInstruction = "Difficulty: EASY. Straightforward concepts, clear facts, simple vocabulary.";
    } else if (difficultyLevel === "hard") {
      difficultyInstruction = "Difficulty: HARD. Complex application, nuanced distinctions between options, challenging questions.";
    } else {
      difficultyInstruction = "Difficulty: MEDIUM. Balanced mix of core concepts, comprehension, and practical testing.";
    }

    const isIndo = language?.toString().toLowerCase().includes("indo");
    const languageInstruction = isIndo
      ? "PERATURAN BAHASA MUTLAK: Seluruh kuis (pertanyaan, 4 opsi pilihan jawaban, dan penjelasan) WAJIB ditulis 100% dalam BAHASA INDONESIA yang baku dan santun. Dilarang menghasilkan pertanyaan atau opsi dalam bahasa Inggris meskipun materi sumber berbahasa Inggris. Terjemahkan konsepnya."
      : "LANGUAGE REQUIREMENT: Write the entire quiz (questions, options, and explanations) strictly in English.";

    const systemInstruction = isIndo
      ? "Anda adalah pembuat kuis edukasi arcade profesional. Output Anda WAJIB 100% dalam Bahasa Indonesia. Semua pertanyaan, 4 pilihan jawaban, dan penjelasan harus dalam Bahasa Indonesia."
      : "You are an expert arcade educational quiz creator. Write all questions, options, and explanations in English.";

    const prompt = `Create an engaging multiple-choice quiz based strictly on the provided study material.

Instructions:
1. Generate exactly ${numQuestions} questions.
2. For each question, provide exactly 4 concise options (1 to 4 words max each) so they fit inside retro arcade game blocks.
3. Ensure index 'answer' is an integer between 0 and 3 indicating the correct option.
4. Provide a clear, helpful explanation (1-2 sentences) explaining why that answer is correct.
5. ${languageInstruction}
6. ${difficultyInstruction}

Study Material (context-safe max 50,000 characters):
"""
${sourceText.substring(0, 50000)}
"""`;

    const generateConfig = {
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: {
                type: Type.STRING,
                description: "The question text.",
              },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "List of exactly 4 concise answer options.",
              },
              answer: {
                type: Type.INTEGER,
                description: "0-based index of correct option (0, 1, 2, or 3).",
              },
              explanation: {
                type: Type.STRING,
                description: "Brief explanation of why the answer is correct.",
              },
            },
            required: ["question", "options", "answer", "explanation"],
          },
        },
      },
    };

    const candidateModels = [
      "gemini-3.1-flash-lite",
      "gemini-3.5-flash",
      "gemini-3.8-flash",
      "gemini-3.7-flash",
    ];

    let response: any = null;
    let lastError: any = null;

    for (const model of candidateModels) {
      try {
        response = await ai.models.generateContent({
          model,
          ...generateConfig,
        });
        if (response && response.text) {
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${model} failed, trying next candidate:`, err?.message || err);
      }
    }

    if (!response || !response.text) {
      throw lastError || new Error("Failed to generate quiz with candidate models.");
    }

    const jsonText = response.text ? response.text.trim() : "[]";
    const questions = JSON.parse(jsonText);

    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error("Gemini returned an empty or invalid question set.");
    }

    const cleanedQuestions = questions.map((q, idx) => ({
      question: q.question || `Question ${idx + 1}`,
      options:
        Array.isArray(q.options) && q.options.length === 4
          ? q.options.map((opt: any) => String(opt).trim())
          : ["A", "B", "C", "D"],
      answer:
        typeof q.answer === "number" && q.answer >= 0 && q.answer <= 3
          ? q.answer
          : 0,
      explanation: q.explanation || "No explanation provided.",
    }));

    return res.status(200).json({ questions: cleanedQuestions });
  } catch (error: any) {
    console.error("Quiz generation error in serverless handler:", error);
    return res.status(500).json({
      error: error?.message || "Failed to generate quiz with Gemini AI.",
    });
  }
}


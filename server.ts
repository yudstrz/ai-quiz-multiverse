import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Server-side Gemini initialization
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", hasApiKey: !!process.env.GEMINI_API_KEY });
});

// Default pre-packaged quizzes for instant play or fallback
const DEFAULT_PRESETS = {
  general: [
    {
      question: "What is the capital city of France?",
      options: ["Berlin", "Paris", "Madrid", "Rome"],
      answer: 1,
      explanation: "Paris is the capital and largest city of France.",
    },
    {
      question: "Which element has the chemical symbol 'O'?",
      options: ["Gold", "Osmium", "Oxygen", "Zinc"],
      answer: 2,
      explanation: "Oxygen is a chemical element with symbol O and atomic number 8.",
    },
    {
      question: "What is 12 x 12?",
      options: ["120", "144", "132", "154"],
      answer: 1,
      explanation: "12 multiplied by 12 equals 144.",
    },
    {
      question: "Which planet is known as the Red Planet?",
      options: ["Venus", "Jupiter", "Mars", "Saturn"],
      answer: 2,
      explanation: "Mars appears reddish due to iron oxide (rust) on its surface.",
    },
    {
      question: "Primary color created by mixing Blue + Yellow?",
      options: ["Purple", "Green", "Orange", "Brown"],
      answer: 1,
      explanation: "Mixing blue and yellow pigments yields green.",
    },
  ],
  programming: [
    {
      question: "Which language runs natively in web browsers?",
      options: ["Python", "Java", "JavaScript", "C++"],
      answer: 2,
      explanation: "JavaScript is the native scripting language of all modern web browsers.",
    },
    {
      question: "What does HTML stand for?",
      options: ["Hyper Text Markup Language", "High Tech Modern Language", "Hyperlink Text Mode Link", "Home Tool Markup Language"],
      answer: 0,
      explanation: "HTML stands for HyperText Markup Language, the standard document format for web pages.",
    },
    {
      question: "In CSS, which keyword selects elements by class?",
      options: ["#hashtag", ".dot", ":colon", "@at"],
      answer: 1,
      explanation: "The dot (.) prefix selects HTML elements by class name in CSS.",
    },
    {
      question: "Which method converts a JSON string into a JS object?",
      options: ["JSON.stringify()", "JSON.parse()", "JSON.toObject()", "Object.parse()"],
      answer: 1,
      explanation: "JSON.parse() parses a JSON string into a JavaScript value/object.",
    },
    {
      question: "What is the primary function of Vite in modern web development?",
      options: ["Database ORM", "Frontend Build Tool", "CSS Compiler Only", "Version Control"],
      answer: 1,
      explanation: "Vite is a fast modern frontend build tool and dev server.",
    },
  ],
  space: [
    {
      question: "Which is the largest planet in our Solar System?",
      options: ["Saturn", "Jupiter", "Neptune", "Uranus"],
      answer: 1,
      explanation: "Jupiter is more than twice as massive as all the other planets combined.",
    },
    {
      question: "What force keeps planets in orbit around the Sun?",
      options: ["Magnetism", "Gravity", "Friction", "Centrifugal Force"],
      answer: 1,
      explanation: "Gravity is the attractive force that keeps astronomical bodies in orbit.",
    },
    {
      question: "What galaxy is Earth located in?",
      options: ["Andromeda", "Milky Way", "Sombrero", "Triangulum"],
      answer: 1,
      explanation: "Earth is located in the Orion Arm of the Milky Way galaxy.",
    },
    {
      question: "How long does light take to travel from Sun to Earth?",
      options: ["8 Seconds", "8 Minutes", "8 Hours", "8 Days"],
      answer: 1,
      explanation: "Light traveling at 300,000 km/s takes roughly 8 minutes and 20 seconds from the Sun to Earth.",
    },
    {
      question: "Which celestial body causes ocean tides on Earth?",
      options: ["The Sun", "The Moon", "Mars", "Asteroids"],
      answer: 1,
      explanation: "The Moon's gravitational pulling force creates ocean tides on Earth.",
    },
  ],
};

app.get("/api/preset-quiz", (req, res) => {
  const category = (req.query.category as string) || "general";
  const questions = DEFAULT_PRESETS[category as keyof typeof DEFAULT_PRESETS] || DEFAULT_PRESETS.general;
  res.json({ questions });
});

// Endpoint to generate quiz using Gemini 3.6 Flash
app.post("/api/generate-quiz", async (req, res) => {
  try {
    const { sourceText, questionCount = 5, difficulty = "medium", language = "auto" } = req.body;

    if (!sourceText || typeof sourceText !== "string" || sourceText.trim().length === 0) {
      return res.status(400).json({ error: "Source text is required to generate quiz." });
    }

    const ai = getGeminiClient();
    if (!ai) {
      // Fallback response with notice if API key is missing
      return res.status(503).json({
        error: "GEMINI_API_KEY environment variable is missing on the server. Please check Settings > Secrets.",
        isMissingKey: true
      });
    }

    const numQuestions = Math.min(Math.max(parseInt(questionCount) || 5, 3), 15);

    const difficultyLevel = ["easy", "medium", "hard"].includes(difficulty?.toString().toLowerCase())
      ? difficulty.toString().toLowerCase()
      : "medium";

    let difficultyInstruction = "";
    if (difficultyLevel === "easy") {
      difficultyInstruction = "7. Difficulty Level: EASY. Focus on basic facts, straightforward questions, clear concepts, and simple vocabulary.";
    } else if (difficultyLevel === "hard") {
      difficultyInstruction = "7. Difficulty Level: HARD. Focus on complex analysis, fine distinctions between options, challenging application scenarios, and rigorous distractors.";
    } else {
      difficultyInstruction = "7. Difficulty Level: MEDIUM. Balanced mix of core concepts, practical comprehension, and standard knowledge testing.";
    }

    const prompt = `You are an expert educational quiz author and game master.
Create an engaging multiple-choice quiz based strictly on the provided study materials or notes.

Instructions:
1. Generate exactly ${numQuestions} questions.
2. For each question, provide exactly 4 options.
3. Option strings MUST be concise (1 to 4 words max) so they fit inside animated arcade game blocks.
4. Ensure index 'answer' is an integer between 0 and 3 indicating the correct option.
5. Provide a clear, friendly explanation (1-2 sentences) explaining why that answer is correct.
6. Write the quiz in the same language as the study material provided (e.g., if input is in Indonesian, output Indonesian; if English, output English).
${difficultyInstruction}

Study Material:
"""
${sourceText.substring(0, 12000)}
"""`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
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
                description: "List of 4 short answer options.",
              },
              answer: {
                type: Type.INTEGER,
                description: "Index of the correct answer (0, 1, 2, or 3).",
              },
              explanation: {
                type: Type.STRING,
                description: "Brief explanation of the correct answer.",
              },
            },
            required: ["question", "options", "answer", "explanation"],
          },
        },
      },
    });

    const jsonText = response.text ? response.text.trim() : "[]";
    const questions = JSON.parse(jsonText);

    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error("Generated content did not return valid quiz questions.");
    }

    // Validate options count and format
    const cleanedQuestions = questions.map((q, idx) => ({
      question: q.question || `Question ${idx + 1}`,
      options: Array.isArray(q.options) && q.options.length === 4 ? q.options : ["Option A", "Option B", "Option C", "Option D"],
      answer: typeof q.answer === "number" && q.answer >= 0 && q.answer <= 3 ? q.answer : 0,
      explanation: q.explanation || "No detailed explanation provided.",
    }));

    return res.json({ questions: cleanedQuestions });
  } catch (err: any) {
    console.error("Error generating quiz with Gemini:", err);
    return res.status(500).json({
      error: err.message || "An unexpected error occurred while generating quiz.",
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AI Quiz Multiverse server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

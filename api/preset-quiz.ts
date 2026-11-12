import { getPresetQuestions } from "../src/utils/presets";
import { Language } from "../src/types";

export default function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");

  const category = (req.query?.category as string) || "general";
  const language = (req.query?.language as Language) || "English";
  const questions = getPresetQuestions(category, language);

  return res.status(200).json({ questions });
}


import {
  LanguageInputId,
  LanguageOutputId,
  getSupportedInputLanguages,
  getSupportedOutputLanguages,
} from "~/types/language.type";
import Groq from "groq-sdk";

if (typeof process.env.GROQ_API_KEY !== "string") {
  throw new Error("Missing env: GROQ_API_KEY");
}

const GROQ_API_KEY = process.env.GROQ_API_KEY;

export async function translateText(
  fromLanguageId: LanguageInputId,
  toLanguageId: LanguageOutputId,
  inputText: string
) {
  if (fromLanguageId === toLanguageId) {
    return inputText;
  }

  const groq = new Groq({
    apiKey: GROQ_API_KEY,
  });

  const fromLanguage = getSupportedInputLanguages().find(
    (lang) => lang.id === fromLanguageId
  )?.name;

  const toLanguage = getSupportedOutputLanguages().find(
    (lang) => lang.id === toLanguageId
  )?.name;

  try {
    const result = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "You are an AI that translates text. You receive a text from the user. Do not answer, just translate the text. The original language is surrounded by `{{` and `}}`. You can also receive {{auto}} wich means that you have to detect the language. The language you translate to is surrounded by `[[` and `]]`.",
        },
        {
          role: "user",
          content: "Hola mundo {{Español}} [[English]]",
        },
        {
          role: "assistant",
          content: "Hello world",
        },
        {
          role: "user",
          content: "How are you? {{Auto}} [[Deutsch]]",
        },
        {
          role: "assistant",
          content: "Wie geht es dir?",
        },
        {
          role: "user",
          content: "Buen día, como estás? {{Auto}} [[English]]",
        },
        {
          role: "assistant",
          content: "Good morning, how are you?",
        },
        {
          role: "user",
          content: `${inputText} {{${fromLanguage}}} [[${toLanguage}]]`,
        },
      ],
      model: "llama3-70b-8192",
    });

    return result.choices[0].message.content || "";
  } catch (error) {
    return "Error translating text";
  }
}

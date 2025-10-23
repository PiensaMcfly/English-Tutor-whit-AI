import { GoogleGenAI, Type, Chat } from "@google/genai";
import { EnglishLevel, Lesson, FillInTheBlankExercise, MultipleChoiceExercise, TranslationResult } from '../types';

// Assume API_KEY is set in the environment
const ai = new GoogleGenAI({apiKey: process.env.API_KEY!});

const exerciseSchema = {
    fillInTheBlankExercises: {
      type: Type.ARRAY,
      description: "An array of 2-3 fill-in-the-blank exercises. The question should contain a blank space represented by '____'.",
      items: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING },
          correctAnswer: { type: Type.STRING }
        },
        required: ['question', 'correctAnswer']
      }
    },
    multipleChoiceExercises: {
      type: Type.ARRAY,
      description: "An array of 2-3 multiple-choice questions. Provide 4 options for each.",
      items: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING },
          options: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          correctAnswer: { type: Type.STRING }
        },
        required: ['question', 'options', 'correctAnswer']
      }
    }
};

const lessonSchema = {
  type: Type.OBJECT,
  properties: {
    grammarAndUsage: {
      type: Type.STRING,
      description: "A comprehensive and clear explanation of the grammar topic. Use Markdown for formatting. Use bold titles for sub-sections (e.g., **First Conditional**). Explain all relevant sub-topics (e.g., if the topic is 'conditionals', explain zero, first, second, third, and mixed conditionals). Provide at least one clear example sentence for each point explained. Ensure ample line breaks between topics for readability."
    },
    ...exerciseSchema,
    dialogue: {
      type: Type.STRING,
      description: "A short, natural-sounding dialogue between two people (e.g., A and B) on the given topic. Use the provided vocabulary. Ensure there is a double newline character ('\\n\\n') after each speaker's line to create a proper line break. For example: A: Hello!\\n\\nB: Hi there!."
    },
    paragraph: {
      type: Type.STRING,
      description: "A short paragraph on the given topic, using the provided vocabulary. The paragraph should be approximately the specified word count and suitable for the learner's level."
    },
    vocabularyDefinitions: {
      type: Type.ARRAY,
      description: "An array of objects, where each object contains a vocabulary word from the user's list and its corresponding simple definition, appropriate for the user's English level.",
      items: {
          type: Type.OBJECT,
          properties: {
              word: { type: Type.STRING, description: "A vocabulary word from the user's list." },
              definition: { type: Type.STRING, description: "The definition of the word." }
          },
          required: ['word', 'definition']
      }
    }
  },
  required: ['grammarAndUsage', 'fillInTheBlankExercises', 'multipleChoiceExercises', 'dialogue', 'paragraph', 'vocabularyDefinitions']
};

const parseJsonResponse = <T>(jsonText: string): T => {
  try {
    const data = JSON.parse(jsonText);
    return data as T;
  } catch (e) {
    console.error("Failed to parse JSON response from AI:", jsonText, e);
    throw new Error("The AI returned an invalid format. Please try again.");
  }
};

export const generateLesson = async (
  level: EnglishLevel,
  topic: string,
  vocabulary: string,
  wordCount: number
): Promise<Lesson> => {
  const prompt = `
    Generate a custom English lesson for a student with level ${level}.
    The topic is: "${topic}".
    The vocabulary to focus on is: "${vocabulary}".
    The paragraph should be about ${wordCount} words.
    
    Follow these specific instructions for each section:
    - **grammarAndUsage**: Provide a comprehensive and clear explanation of the topic. If the topic has sub-types (like different conditional clauses), explain each one. Use Markdown for formatting. Use bold titles for sub-sections (e.g., **First Conditional**). For each grammar point, provide a clear example sentence. Ensure there are double line breaks between different topics for clear separation.
    - **exercises**: Create a mix of fill-in-the-blank and multiple-choice exercises as per the schema. The fill-in-the-blank question must include '____' as a placeholder.
    - **dialogue**: Write a natural dialogue. Each speaker's turn must be followed by a double newline to ensure proper separation (e.g., A: ...\\n\\nB: ...).
    - **vocabularyDefinitions**: For each word in the provided vocabulary list ("${vocabulary}"), provide a simple, concise definition suitable for a ${level} learner. Structure this as an array of objects, where each object has a "word" and a "definition" key.
    
    Please structure the entire output according to the provided JSON schema.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-pro',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: lessonSchema,
    }
  });
  
  return parseJsonResponse<Lesson>(response.text.trim());
};

export const generateMoreExercises = async (
  level: EnglishLevel,
  topic: string,
  vocabulary: string
): Promise<{ fillInTheBlankExercises: FillInTheBlankExercise[], multipleChoiceExercises: MultipleChoiceExercise[] }> => {
    const prompt = `
    Generate a new set of English exercises for a student with level ${level}.
    The topic is: "${topic}".
    The exercises should be related to the vocabulary: "${vocabulary}".
    Generate 2 new fill-in-the-blank exercises and 2 new multiple-choice exercises.
    The fill-in-the-blank question must include '____' as a placeholder.
  `;

  const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', // Flash is sufficient for this smaller task
      contents: prompt,
      config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: exerciseSchema,
            required: ['fillInTheBlankExercises', 'multipleChoiceExercises']
          }
      }
  });

  return parseJsonResponse<{ fillInTheBlankExercises: FillInTheBlankExercise[], multipleChoiceExercises: MultipleChoiceExercise[] }>(response.text.trim());
}

export const getWordDefinition = async (word: string): Promise<string> => {
  const prompt = `Provide a simple, clear definition for the English word: "${word}".`;
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
  });
  return response.text;
};

export const translateAndDefine = async (spanishWord: string): Promise<TranslationResult> => {
  const prompt = `Translate the Spanish word "${spanishWord}" into English. Then, provide a simple definition for the English translation.`;
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          translation: { type: Type.STRING },
          definition: { type: Type.STRING }
        },
        required: ['translation', 'definition']
      }
    }
  });
  return parseJsonResponse<TranslationResult>(response.text.trim());
};


export const createChat = (): Chat => {
  const chat = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
        systemInstruction: `You are Lexi, a friendly and patient AI English tutor. Your goal is to help the user practice their English conversation skills.
- Keep your responses concise and easy to understand.
- Gently correct any significant grammatical mistakes the user makes, but do it in a natural, conversational way. For example, instead of "That's wrong," you could say, "That's a great point! Another way to say that could be...".
- Ask open-ended questions to encourage the user to speak more.
- Be encouraging and positive.`,
    }
  });
  return chat;
};
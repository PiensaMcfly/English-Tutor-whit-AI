export enum EnglishLevel {
  A1 = 'A1 - Beginner',
  A2 = 'A2 - Elementary',
  B1 = 'B1 - Intermediate',
  B2 = 'B2 - Upper-Intermediate',
  C1 = 'C1 - Advanced',
  C2 = 'C2 - Proficient',
}

export interface FillInTheBlankExercise {
  question: string; // e.g., "I went to the ____ yesterday."
  correctAnswer: string;
}

export interface MultipleChoiceExercise {
  question: string;
  options: string[];
  correctAnswer: string;
}

export interface VocabularyDefinition {
  word: string;
  definition: string;
}

export interface Lesson {
  grammarAndUsage: string;
  fillInTheBlankExercises: FillInTheBlankExercise[];
  multipleChoiceExercises: MultipleChoiceExercise[];
  dialogue: string;
  paragraph: string;
  vocabularyDefinitions: VocabularyDefinition[];
}

export interface LessonParams {
  level: EnglishLevel;
  topic: string;
  vocabulary: string;
  wordCount: number;
}

export interface SavedLesson {
  id: string;
  params: LessonParams;
  lesson: Lesson;
}

export interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
}

export interface TranslationResult {
  translation: string;
  definition: string;
}
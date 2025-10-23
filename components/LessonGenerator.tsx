import React, { useState, useEffect } from 'react';
import { EnglishLevel, Lesson, SavedLesson } from '../types';
import { generateLesson, generateMoreExercises } from '../services/geminiService';
import Spinner from './common/Spinner';
import LessonDisplay from './LessonDisplay';
import LessonHistory from './LessonHistory';

const LessonGenerator: React.FC = () => {
  const [level, setLevel] = useState<EnglishLevel>(EnglishLevel.B1);
  const [topic, setTopic] = useState('');
  const [vocabulary, setVocabulary] = useState('');
  const [wordCount, setWordCount] = useState(100);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [lessonParamsForDisplay, setLessonParamsForDisplay] = useState<{level: EnglishLevel; topic: string; vocabulary: string} | null>(null);
  const [history, setHistory] = useState<SavedLesson[]>([]);

  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem('lessonHistory');
      if (storedHistory) {
        setHistory(JSON.parse(storedHistory));
      }
    } catch (e) {
      console.error("Failed to parse lesson history from localStorage", e);
      localStorage.removeItem('lessonHistory');
    }
  }, []);

  const updateHistory = (updatedLesson: Lesson, paramsToSave: { level: EnglishLevel; topic: string; vocabulary: string; wordCount: number }) => {
    const newSavedLesson: SavedLesson = {
      id: Date.now().toString(),
      params: paramsToSave,
      lesson: updatedLesson,
    };

    // Find if a lesson with the same topic exists and replace it, otherwise add new
    const existingIndex = history.findIndex(item => item.params.topic === paramsToSave.topic);
    let updatedHistory: SavedLesson[];

    if (existingIndex > -1) {
        updatedHistory = [...history];
        updatedHistory[existingIndex] = newSavedLesson;
    } else {
        updatedHistory = [newSavedLesson, ...history];
    }
    
    const finalHistory = updatedHistory.slice(0, 5);
    setHistory(finalHistory);
    localStorage.setItem('lessonHistory', JSON.stringify(finalHistory));
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic || !vocabulary) {
      setError("Please fill in both Topic and Vocabulary fields.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setLesson(null);
    setLessonParamsForDisplay(null);

    try {
      const generatedLesson = await generateLesson(level, topic, vocabulary, wordCount);
      setLesson(generatedLesson);
      const currentParams = { level, topic, vocabulary, wordCount };
      setLessonParamsForDisplay({ level, topic, vocabulary });
      updateHistory(generatedLesson, currentParams);
    } catch (err) {
      console.error(err);
      setError("Failed to generate lesson. The AI might be busy. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleGenerateMoreExercises = async () => {
    if (!lesson || !lessonParamsForDisplay) return;

    setIsLoadingMore(true);
    setError(null);

    try {
        const moreExercises = await generateMoreExercises(lessonParamsForDisplay.level, lessonParamsForDisplay.topic, lessonParamsForDisplay.vocabulary);
        const updatedLesson = {
            ...lesson,
            fillInTheBlankExercises: [...lesson.fillInTheBlankExercises, ...moreExercises.fillInTheBlankExercises],
            multipleChoiceExercises: [...lesson.multipleChoiceExercises, ...moreExercises.multipleChoiceExercises],
        };
        setLesson(updatedLesson);
        // Find the full params from history to update it correctly
        const currentSavedLesson = history.find(h => h.params.topic === lessonParamsForDisplay.topic);
        if(currentSavedLesson) {
           updateHistory(updatedLesson, currentSavedLesson.params);
        }
    } catch (err) {
        console.error(err);
        setError("Failed to generate more exercises. Please try again.");
    } finally {
        setIsLoadingMore(false);
    }
  };


  const handleSelectFromHistory = (savedLesson: SavedLesson) => {
    setLesson(savedLesson.lesson);
    setLevel(savedLesson.params.level);
    setTopic(savedLesson.params.topic);
    setVocabulary(savedLesson.params.vocabulary);
    setWordCount(savedLesson.params.wordCount);
    setLessonParamsForDisplay({
      level: savedLesson.params.level,
      topic: savedLesson.params.topic,
      vocabulary: savedLesson.params.vocabulary,
    });
    // Scroll to the lesson display smoothly
    document.getElementById('lesson-display')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleClearHistory = () => {
    setHistory([]);
    localStorage.removeItem('lessonHistory');
  };

  return (
    <div className="space-y-8">
      <div className="bg-white dark:bg-slate-800/50 rounded-xl shadow-lg p-6 md:p-8">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Create Your Custom Lesson</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label htmlFor="topic" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Topic</label>
            <input
              type="text"
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Traveling to a new country"
              className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg p-3 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
            />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="vocabulary" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Vocabulary</label>
            <textarea
              id="vocabulary"
              value={vocabulary}
              onChange={(e) => setVocabulary(e.target.value)}
              placeholder="e.g., passport, booking, destination, explore"
              rows={3}
              className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg p-3 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
            />
          </div>
          <div>
            <label htmlFor="level" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Your English Level</label>
            <select
              id="level"
              value={level}
              onChange={(e) => setLevel(e.target.value as EnglishLevel)}
              className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg p-3 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
            >
              {Object.values(EnglishLevel).map((lvl) => (
                <option key={lvl} value={lvl}>{lvl}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="wordCount" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Paragraph Word Count</label>
            <input
              type="number"
              id="wordCount"
              value={wordCount}
              onChange={(e) => setWordCount(Number(e.target.value))}
              min="50"
              step="10"
              className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg p-3 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
            />
          </div>
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:bg-slate-400 dark:disabled:bg-slate-500 disabled:cursor-not-allowed"
            >
              {isLoading && <Spinner className="w-5 h-5 mr-3" />}
              {isLoading ? 'Generating Your Lesson...' : 'Generate Lesson'}
            </button>
          </div>
        </form>
      </div>
      
      <LessonHistory history={history} onSelect={handleSelectFromHistory} onClear={handleClearHistory} />

      {error && <div className="bg-red-100 dark:bg-red-900/50 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-center">{error}</div>}
      
      {isLoading && (
        <div className="flex flex-col items-center justify-center bg-white dark:bg-slate-800/50 rounded-xl p-8 min-h-[300px]">
          <Spinner className="w-12 h-12 mb-4" />
          <p className="text-slate-500 dark:text-slate-400">Lexi is crafting your lesson...</p>
        </div>
      )}

      {lesson && lessonParamsForDisplay && (
          <LessonDisplay 
            lesson={lesson} 
            lessonParams={lessonParamsForDisplay}
            onGenerateMoreExercises={handleGenerateMoreExercises}
            isLoadingMore={isLoadingMore}
          />
      )}
    </div>
  );
};

export default LessonGenerator;

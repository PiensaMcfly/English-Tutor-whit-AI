import React, { useState } from 'react';
import { getWordDefinition, translateAndDefine } from '../services/geminiService';
import { TranslationResult, VocabularyDefinition } from '../types';
import Spinner from './common/Spinner';

interface VocabularyPracticeProps {
  initialDefinitions: VocabularyDefinition[];
}

const VocabularyPractice: React.FC<VocabularyPracticeProps> = ({ initialDefinitions }) => {
  const [wordToDefine, setWordToDefine] = useState('');
  const [definition, setDefinition] = useState<string | null>(null);
  const [isDefining, setIsDefining] = useState(false);
  const [defineError, setDefineError] = useState<string | null>(null);

  const [wordToTranslate, setWordToTranslate] = useState('');
  const [translation, setTranslation] = useState<TranslationResult | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translateError, setTranslateError] = useState<string | null>(null);

  const handleDefine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wordToDefine.trim()) return;
    setIsDefining(true);
    setDefinition(null);
    setDefineError(null);
    try {
      const result = await getWordDefinition(wordToDefine);
      setDefinition(result);
    } catch (err) {
      console.error(err);
      setDefineError('Sorry, I couldn\'t find a definition for that word.');
    } finally {
      setIsDefining(false);
    }
  };

  const handleTranslate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wordToTranslate.trim()) return;
    setIsTranslating(true);
    setTranslation(null);
    setTranslateError(null);
    try {
      const result = await translateAndDefine(wordToTranslate);
      setTranslation(result);
    } catch (err) {
      console.error(err);
      setTranslateError('Sorry, I couldn\'t translate that word.');
    } finally {
      setIsTranslating(false);
    }
  };


  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-bold text-teal-500 dark:text-teal-400 mb-4">Lesson Vocabulary</h3>
        <div className="bg-slate-100 dark:bg-slate-700/50 p-4 rounded-lg space-y-3">
          {initialDefinitions.map(({ word, definition }) => (
            <div key={word}>
              <p className="font-bold text-slate-800 dark:text-slate-200 capitalize">{word}</p>
              <p className="text-slate-600 dark:text-slate-300">{definition}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-6 pt-6 border-t border-slate-200 dark:border-slate-700">
        {/* Define Word */}
        <div>
            <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3">Look up an English word</h4>
            <form onSubmit={handleDefine} className="flex items-center gap-3">
                <input
                    type="text"
                    value={wordToDefine}
                    onChange={(e) => setWordToDefine(e.target.value)}
                    placeholder="e.g., explore"
                    className="flex-1 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg p-3 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                    disabled={isDefining}
                />
                <button type="submit" disabled={isDefining || !wordToDefine.trim()} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-5 rounded-lg transition-colors disabled:bg-slate-400 dark:disabled:bg-slate-500 disabled:cursor-not-allowed">
                    {isDefining ? <Spinner className="w-5 h-5"/> : 'Define'}
                </button>
            </form>
            {defineError && <p className="text-sm text-red-500 mt-2">{defineError}</p>}
            {definition && (
                <div className="mt-4 bg-slate-100 dark:bg-slate-700/50 p-4 rounded-lg">
                    <p className="text-slate-700 dark:text-slate-300">{definition}</p>
                </div>
            )}
        </div>

        {/* Translate Word */}
        <div>
            <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3">Translate from Spanish</h4>
            <form onSubmit={handleTranslate} className="flex items-center gap-3">
                <input
                    type="text"
                    value={wordToTranslate}
                    onChange={(e) => setWordToTranslate(e.target.value)}
                    placeholder="e.g., explorar"
                    className="flex-1 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg p-3 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                    disabled={isTranslating}
                />
                <button type="submit" disabled={isTranslating || !wordToTranslate.trim()} className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-bold py-3 px-5 rounded-lg transition-colors disabled:bg-slate-400 dark:disabled:bg-slate-500 disabled:cursor-not-allowed">
                    {isTranslating ? <Spinner className="w-5 h-5"/> : 'Translate'}
                </button>
            </form>
            {translateError && <p className="text-sm text-red-500 mt-2">{translateError}</p>}
            {translation && (
                <div className="mt-4 bg-slate-100 dark:bg-slate-700/50 p-4 rounded-lg">
                    <p><span className="font-bold text-slate-800 dark:text-slate-200">English:</span> {translation.translation}</p>
                    <p><span className="font-bold text-slate-800 dark:text-slate-200">Definition:</span> {translation.definition}</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default VocabularyPractice;
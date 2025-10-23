import React from 'react';
import { SavedLesson } from '../types';

interface LessonHistoryProps {
  history: SavedLesson[];
  onSelect: (lesson: SavedLesson) => void;
  onClear: () => void;
}

const LessonHistory: React.FC<LessonHistoryProps> = ({ history, onSelect, onClear }) => {
  if (history.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-slate-800/50 rounded-xl shadow-lg p-6 md:p-8">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Your Recent Lessons</h3>
        <button
          onClick={onClear}
          className="text-sm text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
          aria-label="Clear lesson history"
        >
          Clear History
        </button>
      </div>
      <ul className="space-y-3">
        {history.map((item) => (
          <li key={item.id}>
            <button
              onClick={() => onSelect(item)}
              className="w-full text-left bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700 p-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <p className="font-semibold text-teal-600 dark:text-teal-400">{item.params.topic}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Level: {item.params.level} &middot; Vocabulary: {item.params.vocabulary.split(',').slice(0, 3).join(', ')}{item.params.vocabulary.split(',').length > 3 ? '...' : ''}
              </p>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default LessonHistory;
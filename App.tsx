import React, { useState, useEffect } from 'react';
import LessonGenerator from './components/LessonGenerator';
import ChatPractice from './components/ChatPractice';
import ThemeToggle from './components/common/ThemeToggle';
import VoiceChatPractice from './components/VoiceChatPractice';

type View = 'lesson' | 'chat' | 'voice';
type Theme = 'light' | 'dark' | 'system';

const App: React.FC = () => {
  const [view, setView] = useState<View>('lesson');
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const storedTheme = window.localStorage.getItem('theme');
      if (storedTheme === 'light' || storedTheme === 'dark' || storedTheme === 'system') {
        return storedTheme;
      }
    }
    return 'system';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      if (localStorage.getItem('theme') === 'system') {
        root.classList.toggle('dark', e.matches);
      }
    };

    localStorage.setItem('theme', theme);
    if (theme === 'light') {
      root.classList.remove('dark');
    } else if (theme === 'dark') {
      root.classList.add('dark');
    } else { 
      root.classList.toggle('dark', mediaQuery.matches);
    }
    
    mediaQuery.addEventListener('change', handleSystemThemeChange);

    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, [theme]);
  
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-sans transition-colors duration-300">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        
        <div className="absolute top-4 right-4">
            <ThemeToggle theme={theme} setTheme={setTheme} />
        </div>

        <header className="text-center mb-8">
            <div className="flex items-center justify-center gap-2">
                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 text-teal-500 dark:text-teal-400">
                    <path d="M11.25 4.533A9.707 9.707 0 0 0 6 3a9.735 9.735 0 0 0-3.25.555.75.75 0 0 0-.5.707v1.586l-.297.297A1.5 1.5 0 0 0 1.5 7.5v12a1.5 1.5 0 0 0 1.5 1.5h15a1.5 1.5 0 0 0 1.5-1.5v-3.379a1.5 1.5 0 0 0-.44-1.06L16.5 12.5l-1.94-1.94a1.5 1.5 0 0 0-2.12 0l-.88.88a.75.75 0 0 1-1.06 0l-1.192-1.192a.75.75 0 0 0-1.06 0l-.174.174a.75.75 0 0 1-1.06 0l-1.414-1.414a.75.75 0 0 0-1.06 0l-.88.88a.75.75 0 0 1-1.06 0l-.53-.53V7.5a.75.75 0 0 1 .75-.75h3.379a.75.75 0 0 0 .53-.22L11.25 4.533ZM12.75 21a.75.75 0 0 1-.75-.75v-3a.75.75 0 0 1 1.5 0v3a.75.75 0 0 1-.75.75ZM10.5 18a.75.75 0 0 1-.75-.75v-3a.75.75 0 0 1 1.5 0v3a.75.75 0 0 1-.75.75ZM15 18a.75.75 0 0 1-.75-.75v-3a.75.75 0 0 1 1.5 0v3a.75.75 0 0 1-.75.75Z" />
                    <path d="M13.5 3a.75.75 0 0 0 0 1.5h4.5a.75.75 0 0 0 0-1.5h-4.5Z" />
                </svg>
                <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white">AI English Tutor</h1>
            </div>
          <p className="mt-2 text-slate-500 dark:text-slate-400">Your personal AI-powered guide to mastering English.</p>
        </header>

        <nav className="flex justify-center mb-8 bg-slate-200 dark:bg-slate-800 p-2 rounded-xl shadow-md">
          <button
            onClick={() => setView('lesson')}
            className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
              view === 'lesson' ? 'bg-teal-600 text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            Lesson Generator
          </button>
          <button
            onClick={() => setView('chat')}
            className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
              view === 'chat' ? 'bg-teal-600 text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            Chat Practice
          </button>
          <button
            onClick={() => setView('voice')}
            className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
              view === 'voice' ? 'bg-teal-600 text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            Voice Chat
          </button>
        </nav>

        <main>
          {view === 'lesson' ? <LessonGenerator /> : view === 'chat' ? <ChatPractice /> : <VoiceChatPractice />}
        </main>

        <footer className="text-center mt-12 text-slate-500 dark:text-slate-500 text-sm">
            <p>Powered by Tincho Merino.</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
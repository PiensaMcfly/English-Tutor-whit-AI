import React from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeToggleProps {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const iconProps = {
  className: "w-5 h-5",
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 20 20",
  fill: "currentColor"
};

const icons: { [key in Theme]: React.ReactNode } = {
  light: (
    <svg {...iconProps} aria-hidden="true">
      <path d="M10 2a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 2zM10 15a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 15zM10 7a3 3 0 100 6 3 3 0 000-6zM15.657 4.343a.75.75 0 010 1.06l-1.06 1.06a.75.75 0 01-1.06-1.06l1.06-1.06a.75.75 0 011.06 0zM6.464 13.536a.75.75 0 010 1.06l-1.06 1.06a.75.75 0 01-1.06-1.06l1.06-1.06a.75.75 0 011.06 0zM18 10a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0118 10zM5 10a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 015 10zM14.596 15.657a.75.75 0 01-1.06 0l-1.06-1.06a.75.75 0 011.06-1.06l1.06 1.06a.75.75 0 010 1.06zM5.394 6.464a.75.75 0 01-1.06 0L3.272 5.404a.75.75 0 011.06-1.06l1.061 1.06a.75.75 0 010 1.06z" />
    </svg>
  ),
  dark: (
    <svg {...iconProps} aria-hidden="true">
      <path d="M7.455 2.104a.75.75 0 00-.965.965 5.5 5.5 0 006.405 6.405.75.75 0 00.965-.965A5.5 5.5 0 007.455 2.104z" />
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-1.5a6.5 6.5 0 110-13 6.5 6.5 0 010 13z" clipRule="evenodd" />
    </svg>
  ),
  system: (
    <svg {...iconProps} aria-hidden="true">
      <path fillRule="evenodd" d="M2 5.5a3.5 3.5 0 013.5-3.5h9A3.5 3.5 0 0118 5.5v5A3.5 3.5 0 0114.5 14H12v1.5a.5.5 0 01-.5.5h-3a.5.5 0 01-.5-.5V14H5.5A3.5 3.5 0 012 10.5v-5zm3.5-2A2.5 2.5 0 003 5.5v5A2.5 2.5 0 005.5 13h9a2.5 2.5 0 002.5-2.5v-5A2.5 2.5 0 0014.5 3h-9z" clipRule="evenodd" />
    </svg>
  )
};

const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme, setTheme }) => {
  const options: Theme[] = ['light', 'dark', 'system'];

  return (
    <div className="bg-slate-200 dark:bg-slate-800 p-1 rounded-full flex items-center space-x-1">
      {options.map((option) => (
        <button
          key={option}
          onClick={() => setTheme(option)}
          className={`p-2 rounded-full transition-colors duration-200 ${
            theme === option
              ? 'bg-white dark:bg-slate-950 text-teal-500'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
          aria-label={`Switch to ${option} theme`}
        >
          {icons[option]}
        </button>
      ))}
    </div>
  );
};

export default ThemeToggle;
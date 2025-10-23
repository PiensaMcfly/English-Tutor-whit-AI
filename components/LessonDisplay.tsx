import React, { useState } from 'react';
import { Lesson, EnglishLevel, FillInTheBlankExercise, MultipleChoiceExercise } from '../types';
import Spinner from './common/Spinner';
import VocabularyPractice from './VocabularyPractice';

// To inform TypeScript that 'marked' is available globally from the script tag in index.html
declare const marked: {
  parse(markdown: string): string;
};

interface LessonDisplayProps {
  lesson: Lesson;
  lessonParams: {
    level: EnglishLevel;
    topic: string;
    vocabulary: string;
  };
  onGenerateMoreExercises: () => Promise<void>;
  isLoadingMore: boolean;
}

const LessonSection: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-slate-100 dark:bg-slate-700/50 p-6 rounded-lg">
    <h3 className="text-xl font-bold text-teal-500 dark:text-teal-400 mb-4 border-b border-slate-200 dark:border-slate-600 pb-2">{title}</h3>
    <div className="prose prose-slate dark:prose-invert max-w-none">
      {children}
    </div>
  </div>
);

const FillInTheBlankItem: React.FC<{ exercise: FillInTheBlankExercise, index: number }> = ({ exercise, index }) => {
    const [userInput, setUserInput] = useState('');
    const [status, setStatus] = useState<'unchecked' | 'correct' | 'incorrect'>('unchecked');

    const handleCheck = () => {
        if (userInput.trim().toLowerCase() === exercise.correctAnswer.toLowerCase()) {
            setStatus('correct');
        } else {
            setStatus('incorrect');
        }
    };

    const statusRingColor = {
        unchecked: 'focus:ring-teal-500 dark:border-slate-600',
        correct: 'ring-2 ring-green-500 border-green-500',
        incorrect: 'ring-2 ring-red-500 border-red-500',
    };

    const questionParts = exercise.question.split('____');

    return (
        <div className="bg-slate-100 dark:bg-slate-700/50 p-4 rounded-lg">
            <label htmlFor={`fill-blank-${index}`} className="block text-sm text-slate-700 dark:text-slate-300 mb-2">
                {index + 1}. {questionParts[0]}
                <input
                    id={`fill-blank-${index}`}
                    type="text"
                    value={userInput}
                    onChange={(e) => {
                        setUserInput(e.target.value);
                        setStatus('unchecked');
                    }}
                    className={`inline-block mx-2 w-40 bg-white dark:bg-slate-800 border rounded-md p-1 text-center transition-all ${statusRingColor[status]}`}
                />
                {questionParts[1]}
            </label>
            <div className="text-right mt-2">
                 <button onClick={handleCheck} className="text-sm bg-teal-600 hover:bg-teal-700 text-white font-semibold py-1 px-3 rounded-md transition">Check</button>
            </div>
        </div>
    );
};

const MultipleChoiceItem: React.FC<{ exercise: MultipleChoiceExercise, index: number }> = ({ exercise, index }) => {
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [showAnswer, setShowAnswer] = useState(false);

    const getOptionClass = (option: string) => {
        if (!showAnswer) {
            return selectedOption === option
                ? 'bg-teal-200 dark:bg-teal-800 ring-2 ring-teal-500'
                : 'bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700';
        }
        if (option === exercise.correctAnswer) {
            return 'bg-green-200 dark:bg-green-800 ring-2 ring-green-600';
        }
        if (option === selectedOption && option !== exercise.correctAnswer) {
            return 'bg-red-200 dark:bg-red-800 ring-2 ring-red-600 line-through';
        }
        return 'bg-slate-100 dark:bg-slate-700/50';
    };

    return (
         <div className="bg-slate-100 dark:bg-slate-700/50 p-4 rounded-lg">
            <p className="font-medium text-slate-800 dark:text-slate-200 mb-3">{index + 1}. {exercise.question}</p>
            <div className="space-y-2">
                {exercise.options.map((option, i) => (
                    <button
                        key={i}
                        onClick={() => !showAnswer && setSelectedOption(option)}
                        className={`w-full text-left p-3 rounded-md transition-all text-slate-700 dark:text-slate-300 ${getOptionClass(option)}`}
                        disabled={showAnswer}
                    >
                        {option}
                    </button>
                ))}
            </div>
            <div className="text-right mt-3">
                <button
                    onClick={() => setShowAnswer(true)}
                    disabled={!selectedOption || showAnswer}
                    className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-1 px-3 rounded-md transition disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed"
                >
                    Show Answer
                </button>
            </div>
        </div>
    );
};


const LessonDisplay: React.FC<LessonDisplayProps> = ({ lesson, lessonParams, onGenerateMoreExercises, isLoadingMore }) => {
  const [activeTab, setActiveTab] = useState<'content' | 'exercises' | 'vocabulary'>('content');
  const createMarkup = (text: string) => ({ __html: marked.parse(text || '') });

  return (
    <div id="lesson-display" className="bg-white dark:bg-slate-800/50 rounded-xl shadow-lg p-6 md:p-8">
      <header className="border-b border-slate-200 dark:border-slate-700 pb-4 mb-4">
        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">{lessonParams.topic}</h2>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500 dark:text-slate-400 mt-2">
            <span>Level: <span className="font-semibold text-slate-600 dark:text-slate-300">{lessonParams.level}</span></span>
            <span>Vocabulary: <span className="font-semibold text-slate-600 dark:text-slate-300">{lessonParams.vocabulary}</span></span>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="flex space-x-2 border-b border-slate-200 dark:border-slate-700" role="tablist" aria-label="Lesson sections">
          <button 
            onClick={() => setActiveTab('content')}
            className={`py-3 px-4 font-semibold border-b-2 transition-colors ${activeTab === 'content' ? 'border-teal-500 text-teal-600 dark:text-teal-500' : 'border-transparent text-slate-500 hover:border-slate-300 dark:hover:border-slate-600 hover:text-slate-700 dark:hover:text-slate-300'}`}
            aria-selected={activeTab === 'content'}
            role="tab"
          >
            Lesson Content
          </button>
          <button 
            onClick={() => setActiveTab('exercises')}
            className={`py-3 px-4 font-semibold border-b-2 transition-colors ${activeTab === 'exercises' ? 'border-teal-500 text-teal-600 dark:text-teal-500' : 'border-transparent text-slate-500 hover:border-slate-300 dark:hover:border-slate-600 hover:text-slate-700 dark:hover:text-slate-300'}`}
            aria-selected={activeTab === 'exercises'}
            role="tab"
          >
            Exercises
          </button>
          <button 
            onClick={() => setActiveTab('vocabulary')}
            className={`py-3 px-4 font-semibold border-b-2 transition-colors ${activeTab === 'vocabulary' ? 'border-teal-500 text-teal-600 dark:text-teal-500' : 'border-transparent text-slate-500 hover:border-slate-300 dark:hover:border-slate-600 hover:text-slate-700 dark:hover:text-slate-300'}`}
            aria-selected={activeTab === 'vocabulary'}
            role="tab"
          >
            Vocabulary
          </button>
        </div>
      </div>

      {/* Tab Content Panels */}
      <div>
        <div role="tabpanel" hidden={activeTab !== 'content'}>
            <div className="space-y-6">
                <LessonSection title="Grammar & Usage">
                    <div dangerouslySetInnerHTML={createMarkup(lesson.grammarAndUsage)} />
                </LessonSection>
                <LessonSection title="Dialogue Practice">
                    <div dangerouslySetInnerHTML={createMarkup(lesson.dialogue)} />
                </LessonSection>
                <LessonSection title="Reading Paragraph">
                    <div dangerouslySetInnerHTML={createMarkup(lesson.paragraph)} />
                </LessonSection>
            </div>
        </div>

        <div role="tabpanel" hidden={activeTab !== 'exercises'}>
             <div className="space-y-8">
                <div>
                    <h3 className="text-xl font-bold text-teal-500 dark:text-teal-400 mb-4">Fill in the Blank</h3>
                    <div className="space-y-4">
                        {lesson.fillInTheBlankExercises.map((ex, i) => <FillInTheBlankItem key={i} exercise={ex} index={i} />)}
                    </div>
                </div>
                 <div>
                    <h3 className="text-xl font-bold text-teal-500 dark:text-teal-400 mb-4">Multiple Choice</h3>
                    <div className="space-y-4">
                        {lesson.multipleChoiceExercises.map((ex, i) => <MultipleChoiceItem key={i} exercise={ex} index={i} />)}
                    </div>
                </div>

                <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
                    <button
                        onClick={onGenerateMoreExercises}
                        disabled={isLoadingMore}
                        className="w-full flex items-center justify-center bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:bg-slate-400 dark:disabled:bg-slate-500 disabled:cursor-not-allowed"
                    >
                        {isLoadingMore && <Spinner className="w-5 h-5 mr-3" />}
                        {isLoadingMore ? 'Generating More...' : 'Generate More Exercises'}
                    </button>
                </div>
            </div>
        </div>

        <div role="tabpanel" hidden={activeTab !== 'vocabulary'}>
            <VocabularyPractice initialDefinitions={lesson.vocabularyDefinitions} />
        </div>
      </div>
    </div>
  );
};

export default LessonDisplay;
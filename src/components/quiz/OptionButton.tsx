import React from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

interface OptionButtonProps {
  label: string;
  isSelected: boolean;
  onClick: () => void;
  isCorrect?: boolean;
  isRevealed?: boolean;
  hasSelectedAnswer: boolean;
  disabled?: boolean;
  index: number;
}

const OptionButton: React.FC<OptionButtonProps> = ({
  label,
  isSelected,
  onClick,
  isCorrect,
  isRevealed,
  hasSelectedAnswer,
  disabled = false,
  index
}) => {
  const getOptionLabel = (index: number) => {
    return String.fromCharCode(65 + index); // A, B, C, D...
  };

  // Determine the background, border, and text colors based on state
  const getOptionClasses = () => {
    // Base classes
    let classes = 'w-full flex items-center p-4 border rounded-lg transition-all duration-200 focus:outline-none';
    
    // When answer is revealed
    if (isRevealed) {
      if (isCorrect) {
        // Correct answer: always highlight in green
        classes += ' bg-green-100 dark:bg-green-900 border-green-500 dark:border-green-700 text-green-900 dark:text-green-100';
      } else if (isSelected && hasSelectedAnswer) {
        // Selected but incorrect: highlight in red only if an answer was selected
        classes += ' bg-red-100 dark:bg-red-900 border-red-500 dark:border-red-700 text-red-900 dark:text-red-100';
      } else {
        // Not selected and not correct: keep default styling (white background)
        classes += ' bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200';
      }
    } else {
      // Not revealed
      if (isSelected) {
        classes += ' bg-indigo-100 dark:bg-indigo-900 border-indigo-500 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300';
      } else {
        classes += ' bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200';
        classes += ' hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500';
      }
    }
    
    if (disabled) {
      classes += ' opacity-70 cursor-not-allowed';
    } else {
      classes += ' cursor-pointer';
    }
    
    return classes;
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={getOptionClasses()}
    >
      <div className="flex items-center justify-center w-8 h-8 mr-3 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold">
        {getOptionLabel(index)}
      </div>
      
      <span className="flex-grow text-left">{label}</span>
      
      {isRevealed && (
        <div className="ml-2">
          {isCorrect ? (
            <CheckCircle size={20} className="text-green-600 dark:text-green-400" />
          ) : (
            isSelected && hasSelectedAnswer && <XCircle size={20} className="text-red-600 dark:text-red-400" />
          )}
        </div>
      )}
    </button>
  );
};

export default OptionButton;
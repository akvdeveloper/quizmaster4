import React, { useState, useEffect } from 'react';
import { X, PlusCircle, Trash2 } from 'lucide-react';
import { Question } from '../../types';

interface QuestionFormProps {
  question?: Question;
  categories: string[];
  onSave: (question: Omit<Question, 'id'>) => void;
  onCancel: () => void;
}

const QuestionForm: React.FC<QuestionFormProps> = ({ 
  question, 
  categories, 
  onSave, 
  onCancel 
}) => {
  const [text, setText] = useState(question?.text || '');
  const [options, setOptions] = useState<string[]>(question?.options || ['', '', '', '']);
  const [correctAnswer, setCorrectAnswer] = useState(question?.correctAnswer || '');
  const [timeLimit, setTimeLimit] = useState(question?.timeLimit || 30);
  const [category, setCategory] = useState(question?.category || categories[0] || '');
  const [shuffleOptions, setShuffleOptions] = useState(question?.shuffleOptions || false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Validate form before submission
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!text.trim()) {
      newErrors.text = 'Question text is required';
    }
    
    // Check if we have at least 2 options
    const filledOptions = options.filter(opt => opt.trim() !== '');
    if (filledOptions.length < 2) {
      newErrors.options = 'At least 2 options are required';
    }
    
    // Check for duplicate options
    const uniqueOptions = new Set(filledOptions);
    if (uniqueOptions.size !== filledOptions.length) {
      newErrors.options = 'All options must be unique';
    }
    
    // Check if correct answer is set and valid
    if (!correctAnswer) {
      newErrors.correctAnswer = 'Please select the correct answer';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Filter out empty options
      const filteredOptions = options.filter(opt => opt.trim() !== '');
      
      onSave({
        text,
        options: filteredOptions,
        correctAnswer,
        timeLimit,
        category,
        shuffleOptions
      });
    }
  };

  const handleAddOption = () => {
    setOptions([...options, '']);
  };

  const handleRemoveOption = (index: number) => {
    // Don't allow removing if we have only 2 options
    if (options.length <= 2) return;
    
    const newOptions = [...options];
    newOptions.splice(index, 1);
    setOptions(newOptions);
    
    // If the correct answer was the removed option, reset it
    if (correctAnswer === options[index]) {
      setCorrectAnswer('');
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
    
    // If this was the correct answer, update it
    if (correctAnswer === options[index]) {
      setCorrectAnswer(value);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {question ? 'Edit Question' : 'Add New Question'}
        </h2>
        <button
          type="button"
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          aria-label="Close"
        >
          <X size={24} />
        </button>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Question Text */}
          <div>
            <label htmlFor="questionText" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Question Text*
            </label>
            <textarea
              id="questionText"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className={`w-full px-3 py-2 border ${errors.text ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white`}
              rows={3}
              placeholder="Enter your question here..."
            />
            {errors.text && (
              <p className="mt-1 text-sm text-red-500">{errors.text}</p>
            )}
          </div>
          
          {/* Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Answer Options*
            </label>
            {errors.options && (
              <p className="mb-2 text-sm text-red-500">{errors.options}</p>
            )}
            
            <div className="space-y-3">
              {options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id={`option-${index}`}
                    name="correctAnswer"
                    checked={correctAnswer === option}
                    onChange={() => setCorrectAnswer(option)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600"
                  />
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveOption(index)}
                    className="text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                    disabled={options.length <= 2}
                    aria-label="Remove option"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
              
              <button
                type="button"
                onClick={handleAddOption}
                className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                <PlusCircle size={18} className="mr-1" />
                Add Option
              </button>
            </div>
            
            {errors.correctAnswer && (
              <p className="mt-1 text-sm text-red-500">{errors.correctAnswer}</p>
            )}
          </div>
          
          {/* Time Limit */}
          <div>
            <label htmlFor="timeLimit" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Time Limit (seconds)
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="range"
                id="timeLimit"
                min="15"
                max="60"
                step="5"
                value={timeLimit}
                onChange={(e) => setTimeLimit(parseInt(e.target.value))}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
              <span className="w-12 text-center text-gray-700 dark:text-gray-300">{timeLimit}s</span>
            </div>
          </div>
          
          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Category
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          
          {/* Shuffle Options */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="shuffleOptions"
              checked={shuffleOptions}
              onChange={(e) => setShuffleOptions(e.target.checked)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded dark:border-gray-600"
            />
            <label htmlFor="shuffleOptions" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
              Shuffle options for this question
            </label>
          </div>
        </div>
        
        <div className="mt-8 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            Save Question
          </button>
        </div>
      </form>
    </div>
  );
};

export default QuestionForm;
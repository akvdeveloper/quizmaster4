import React, { useState } from 'react';
import { Edit, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Question } from '../../types';

interface QuestionsListProps {
  questions: Question[];
  onEdit: (question: Question) => void;
  onDelete: (questionId: string) => void;
}

const QuestionsList: React.FC<QuestionsListProps> = ({ questions, onEdit, onDelete }) => {
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);

  const toggleExpand = (questionId: string) => {
    setExpandedQuestionId(expandedQuestionId === questionId ? null : questionId);
  };

  if (questions.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
        <p className="text-gray-500 dark:text-gray-400">No questions added yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {questions.map((question) => (
        <div 
          key={question.id} 
          className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-all duration-200"
        >
          <div 
            className="p-4 flex justify-between items-start cursor-pointer" 
            onClick={() => toggleExpand(question.id)}
          >
            <div className="flex-grow pr-4">
              <div className="flex items-center">
                <div 
                  className="inline-flex text-xs font-medium mr-2 px-2.5 py-0.5 rounded"
                  style={{
                    backgroundColor: getCategoryColor(question.category),
                    color: 'white'
                  }}
                >
                  {question.category}
                </div>
                <span className="text-gray-500 dark:text-gray-400 text-sm">
                  {question.timeLimit}s
                </span>
              </div>
              
              <h3 className="text-lg text-gray-900 dark:text-white mt-1">
                {question.text.length > 100 
                  ? `${question.text.substring(0, 100)}...` 
                  : question.text}
              </h3>
            </div>
            
            <div className="flex items-center">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(question);
                }}
                className="p-1.5 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
                aria-label="Edit question"
              >
                <Edit size={18} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(question.id);
                }}
                className="p-1.5 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                aria-label="Delete question"
              >
                <Trash2 size={18} />
              </button>
              {expandedQuestionId === question.id ? (
                <ChevronUp size={20} className="text-gray-500 dark:text-gray-400" />
              ) : (
                <ChevronDown size={20} className="text-gray-500 dark:text-gray-400" />
              )}
            </div>
          </div>
          
          {expandedQuestionId === question.id && (
            <div className="px-4 pb-4 pt-2 border-t border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Options:
              </h4>
              <ul className="space-y-2">
                {question.options.map((option, index) => (
                  <li 
                    key={index} 
                    className={`p-2 rounded-md ${
                      option === question.correctAnswer 
                        ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                    }`}
                  >
                    {option}
                    {option === question.correctAnswer && (
                      <span className="ml-2 text-xs font-medium">(Correct)</span>
                    )}
                  </li>
                ))}
              </ul>
              
              <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                {question.shuffleOptions && (
                  <p>Options will be shuffled during the quiz.</p>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// Helper function
const getCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    'General Knowledge': '#4F46E5', // indigo
    'Science': '#0D9488', // teal
    'Technology': '#2563EB', // blue
    'History': '#B45309', // amber
    'Geography': '#059669', // emerald
    'Sports': '#DC2626', // red
    'Entertainment': '#7C3AED', // violet
    'Art': '#EC4899', // pink
    'Literature': '#8B5CF6', // purple
    'Music': '#F59E0B', // amber
  };
  
  return colors[category] || '#6B7280'; // gray if category not found
};

export default QuestionsList;
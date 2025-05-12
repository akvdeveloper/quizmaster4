import React from 'react';
import { FileQuestion, Clock, User, Edit, Trash2 } from 'lucide-react';
import { Quiz } from '../../types';

interface QuizCardProps {
  quiz: Quiz;
  onSelect: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

const QuizCard: React.FC<QuizCardProps> = ({ quiz, onSelect, onEdit, onDelete }) => {
  return (
    <div 
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden"
      onClick={onSelect}
    >
      <div className="p-6">
        <div className="flex justify-between items-start">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {quiz.title}
          </h3>
          
          <div 
            className="inline-flex items-center justify-center rounded-full text-xs font-medium px-2.5 py-1"
            style={{
              backgroundColor: getCategoryColor(quiz.category),
              color: 'white'
            }}
          >
            {quiz.category}
          </div>
        </div>
        
        <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
          {quiz.description.length > 100 
            ? `${quiz.description.substring(0, 100)}...` 
            : quiz.description}
        </p>
        
        <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center">
            <FileQuestion size={16} className="mr-1" />
            <span>{quiz.questions.length} questions</span>
          </div>
          
          <div className="flex items-center">
            <Clock size={16} className="mr-1" />
            <span>{getEstimatedTime(quiz)} mins</span>
          </div>
        </div>
      </div>
      
      <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-6 py-3 flex justify-between items-center">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Created {formatDate(quiz.createdAt)}
        </span>
        
        {(onEdit || onDelete) && (
          <div className="flex space-x-2">
            {onEdit && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                aria-label="Edit quiz"
              >
                <Edit size={18} className="text-gray-600 dark:text-gray-400" />
              </button>
            )}
            
            {onDelete && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                aria-label="Delete quiz"
              >
                <Trash2 size={18} className="text-red-500" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Helper functions
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

const getEstimatedTime = (quiz: Quiz): number => {
  // Calculate estimated time to complete the quiz in minutes
  const totalSeconds = quiz.questions.reduce((total, q) => total + q.timeLimit, 0);
  return Math.ceil(totalSeconds / 60);
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
};

export default QuizCard;
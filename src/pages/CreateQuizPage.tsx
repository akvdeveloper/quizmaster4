import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Save, Plus, Upload, Settings, AlertCircle, X } from 'lucide-react';
import { useQuiz } from '../contexts/QuizContext';
import QuestionForm from '../components/quiz/QuestionForm';
import QuestionsList from '../components/quiz/QuestionsList';
import { Quiz, Question } from '../types';

const CreateQuizPage: React.FC = () => {
  const { state, createQuiz, updateQuiz } = useQuiz();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Parse query params to check if we're editing an existing quiz
  const queryParams = new URLSearchParams(location.search);
  const editQuizId = queryParams.get('edit');
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('General Knowledge');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [defaultTimeLimit, setDefaultTimeLimit] = useState(30);
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isImporting, setIsImporting] = useState(false);
  const [importText, setImportText] = useState('');
  
  // Available categories
  const categories = [
    'Computer Science',
    'General Knowledge',
    'Science',
    'Technology',
    'History',
    'Geography',
    'Sports',
    'Entertainment',
    'Art',
    'Literature',
    'Music',
  ];

  // Load quiz data if editing
  useEffect(() => {
    if (editQuizId) {
      const quizToEdit = state.quizzes.find(q => q.id === editQuizId);
      if (quizToEdit) {
        setTitle(quizToEdit.title);
        setDescription(quizToEdit.description);
        setCategory(quizToEdit.category);
        setQuestions(quizToEdit.questions);
        setDefaultTimeLimit(quizToEdit.settings.defaultTimeLimit);
        setShuffleQuestions(quizToEdit.settings.shuffleQuestions);
      }
    }
  }, [editQuizId, state.quizzes]);

  const handleSaveQuiz = () => {
    // Validate form
    const newErrors: Record<string, string> = {};
    
    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (questions.length === 0) {
      newErrors.questions = 'At least one question is required';
    }
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      // Scroll to first error
      const firstErrorId = Object.keys(newErrors)[0];
      const element = document.getElementById(firstErrorId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    
    // Create or update quiz
    const quizData = {
      title,
      description,
      category,
      questions,
      settings: {
        defaultTimeLimit,
        shuffleQuestions,
      }
    };
    
    if (editQuizId) {
      updateQuiz({ ...quizData, id: editQuizId, createdAt: state.quizzes.find(q => q.id === editQuizId)?.createdAt || new Date().toISOString() });
    } else {
      createQuiz(quizData);
    }
    
    navigate('/');
  };

  const handleAddQuestion = (questionData: Omit<Question, 'id'>) => {
    const newQuestion: Question = {
      ...questionData,
      id: Math.random().toString(36).substring(2, 15),
    };
    
    setQuestions([...questions, newQuestion]);
    setShowAddQuestion(false);
  };

  const handleUpdateQuestion = (questionData: Omit<Question, 'id'>) => {
    if (!editingQuestion) return;
    
    const updatedQuestion: Question = {
      ...questionData,
      id: editingQuestion.id,
    };
    
    setQuestions(questions.map(q => 
      q.id === editingQuestion.id ? updatedQuestion : q
    ));
    
    setEditingQuestion(null);
  };

  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question);
    setShowAddQuestion(true);
  };

  const handleDeleteQuestion = (questionId: string) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      setQuestions(questions.filter(q => q.id !== questionId));
    }
  };

  const handleImport = () => {
    try {
      const importData = JSON.parse(importText);
      
      if (Array.isArray(importData)) {
        // Map imported data to our Question format
        const newQuestions = importData.map(item => {
          // Check required fields
          if (!item.text || !Array.isArray(item.options) || !item.correctAnswer) {
            throw new Error('Invalid question format');
          }
          
          return {
            id: Math.random().toString(36).substring(2, 15),
            text: item.text,
            options: item.options,
            correctAnswer: item.correctAnswer,
            timeLimit: item.timeLimit || defaultTimeLimit,
            category: item.category || category,
            shuffleOptions: item.shuffleOptions || false,
          };
        });
        
        setQuestions([...questions, ...newQuestions]);
        setIsImporting(false);
        setImportText('');
      } else {
        throw new Error('Imported data must be an array');
      }
    } catch (error) {
      alert(`Import failed: ${error instanceof Error ? error.message : 'Invalid JSON format'}`);
    }
  };

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel? All unsaved changes will be lost.')) {
      navigate('/');
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        {editQuizId ? 'Edit Quiz' : 'Create New Quiz'}
      </h1>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
        <div className="space-y-6">
          {/* Basic Info */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Quiz Title*
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`w-full px-3 py-2 border ${errors.title ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white`}
              placeholder="Enter quiz title"
            />
            {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title}</p>}
          </div>
          
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description*
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`w-full px-3 py-2 border ${errors.description ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white`}
              rows={3}
              placeholder="Enter a description for your quiz"
            />
            {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description}</p>}
          </div>
          
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
          
          {/* Settings Button */}
          <div>
            <button
              type="button"
              onClick={() => setShowSettings(!showSettings)}
              className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              <Settings size={18} className="mr-1" />
              {showSettings ? 'Hide Quiz Settings' : 'Show Quiz Settings'}
            </button>
            
            {showSettings && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Quiz Settings
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="defaultTimeLimit" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Default Time Limit (seconds)
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="range"
                        id="defaultTimeLimit"
                        min="15"
                        max="60"
                        step="5"
                        value={defaultTimeLimit}
                        onChange={(e) => setDefaultTimeLimit(parseInt(e.target.value))}
                        className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-600"
                      />
                      <span className="w-12 text-center text-gray-700 dark:text-gray-300">{defaultTimeLimit}s</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="shuffleQuestions"
                      checked={shuffleQuestions}
                      onChange={(e) => setShuffleQuestions(e.target.checked)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded dark:border-gray-600"
                    />
                    <label htmlFor="shuffleQuestions" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                      Shuffle questions for each player
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Questions Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Questions
          </h2>
          
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => setIsImporting(true)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              <Upload size={18} className="mr-1" />
              Import
            </button>
            <button
              type="button"
              onClick={() => setShowAddQuestion(true)}
              className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              <Plus size={18} className="mr-1" />
              Add Question
            </button>
          </div>
        </div>
        
        {errors.questions && (
          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 mb-4">
            <div className="flex">
              <AlertCircle size={20} className="text-red-500 mr-2" />
              <p className="text-sm text-red-700 dark:text-red-300">{errors.questions}</p>
            </div>
          </div>
        )}
        
        {/* Questions List */}
        <QuestionsList
          questions={questions}
          onEdit={handleEditQuestion}
          onDelete={handleDeleteQuestion}
        />
      </div>
      
      {/* Add/Edit Question Dialog */}
      {showAddQuestion && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75 flex items-center justify-center z-50">
          <div className="max-w-3xl w-full mx-4">
            <QuestionForm
              question={editingQuestion || undefined}
              categories={categories}
              onSave={editingQuestion ? handleUpdateQuestion : handleAddQuestion}
              onCancel={() => {
                setShowAddQuestion(false);
                setEditingQuestion(null);
              }}
            />
          </div>
        </div>
      )}
      
      {/* Import Questions Dialog */}
      {isImporting && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75 flex items-center justify-center z-50">
          <div className="max-w-3xl w-full mx-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Import Questions
              </h2>
              <button
                type="button"
                onClick={() => setIsImporting(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X size={24} />
              </button>
            </div>
            
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Paste your questions in JSON format below. Each question should have the following structure:
            </p>
            
            <pre className="bg-gray-100 dark:bg-gray-700 p-3 rounded-md text-sm text-gray-800 dark:text-gray-200 mb-4 overflow-auto">
{`[
  {
    "text": "Question text",
    "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
    "correctAnswer": "Option 2",
    "timeLimit": 30,
    "category": "General Knowledge",
    "shuffleOptions": true
  },
  // More questions...
]`}
            </pre>
            
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white mb-4"
              rows={10}
              placeholder="Paste JSON here..."
            />
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setIsImporting(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleImport}
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                Import Questions
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Action Buttons */}
      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={handleCancel}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSaveQuiz}
          className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
        >
          <Save size={18} className="inline mr-1" />
          Save Quiz
        </button>
      </div>
    </div>
  );
};

export default CreateQuizPage;
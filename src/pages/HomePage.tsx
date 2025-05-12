import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Users, User, Library, FileQuestion, Award, ArrowRight } from 'lucide-react';
import { useQuiz } from '../contexts/QuizContext';
import QuizCard from '../components/quiz/QuizCard';

const HomePage: React.FC = () => {
  const { state, deleteQuiz } = useQuiz();
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const navigate = useNavigate();
  
  // Get unique categories
  const categories = ['All Categories', ...new Set(state.quizzes.map(quiz => quiz.category))];
  
  // Filter quizzes based on category
  const filteredQuizzes = categoryFilter && categoryFilter !== 'All Categories'
    ? state.quizzes.filter(quiz => quiz.category === categoryFilter)
    : state.quizzes;

  // Group quizzes by category for the featured section
  const quizzesByCategory = state.quizzes.reduce((acc, quiz) => {
    if (!acc[quiz.category]) {
      acc[quiz.category] = [];
    }
    acc[quiz.category].push(quiz);
    return acc;
  }, {} as Record<string, typeof state.quizzes>);
  
  // Pick featured categories (up to 3)
  const featuredCategories = Object.keys(quizzesByCategory).slice(0, 3);

  const handleDeleteQuiz = (quizId: string) => {
    if (window.confirm('Are you sure you want to delete this quiz?')) {
      deleteQuiz(quizId);
    }
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-indigo-600 to-teal-500 rounded-xl p-8 mb-12 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4">Create, Share, and Play Amazing Quizzes</h1>
          <p className="text-lg mb-8 opacity-90">
            Build engaging quizzes for friends, students, or colleagues with our easy-to-use platform.
            Play solo or host multiplayer competitions!
          </p>
          
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 justify-center">
            <button
              onClick={() => navigate('/create')}
              className="inline-flex items-center px-6 py-3 bg-white text-indigo-700 rounded-lg font-medium shadow-lg hover:bg-indigo-50 transition-colors focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-indigo-600"
            >
              <PlusCircle size={20} className="mr-2" />
              Create New Quiz
            </button>
            <button
              onClick={() => navigate('/join')}
              className="inline-flex items-center px-6 py-3 bg-indigo-700 text-white rounded-lg font-medium shadow-lg hover:bg-indigo-800 transition-colors focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-indigo-600"
            >
              <Users size={20} className="mr-2" />
              Join Quiz
            </button>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Why Choose QuizMaster?
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center mb-4">
              <FileQuestion size={24} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Easy Creation</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Create professional quizzes in minutes with our intuitive editor. Import questions or create them from scratch.
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center mb-4">
              <Users size={24} className="text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Multiplayer Support</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Host live quiz sessions with real-time scoring. Perfect for classrooms, team building, or friendly competitions.
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="w-12 h-12 rounded-full bg-teal-100 dark:bg-teal-900 flex items-center justify-center mb-4">
              <Award size={24} className="text-teal-600 dark:text-teal-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Detailed Analytics</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Get comprehensive insights on quiz performance. Track scores, timing, and accuracy with exportable results.
            </p>
          </div>
        </div>
      </section>
      
      {/* Featured Categories Section */}
      {featuredCategories.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Featured Categories
          </h2>
          
          <div className="space-y-8">
            {featuredCategories.map(category => (
              <div key={category}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{category}</h3>
                  <button
                    onClick={() => setCategoryFilter(category)}
                    className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
                  >
                    View All <ArrowRight size={16} className="ml-1" />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {quizzesByCategory[category].slice(0, 3).map(quiz => (
                    <QuizCard
                      key={quiz.id}
                      quiz={quiz}
                      onSelect={() => navigate(`/lobby/${quiz.id}`)}
                      onEdit={() => navigate(`/create?edit=${quiz.id}`)}
                      onDelete={() => handleDeleteQuiz(quiz.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
      
      {/* All Quizzes Section */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            All Quizzes
          </h2>
          
          <div className="flex items-center space-x-2">
            <label htmlFor="categoryFilter" className="text-sm text-gray-700 dark:text-gray-300">
              Filter by:
            </label>
            <select
              id="categoryFilter"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-sm border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {filteredQuizzes.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
            <Library size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
              No Quizzes Found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {state.quizzes.length === 0
                ? "You haven't created any quizzes yet."
                : "No quizzes found in this category."}
            </p>
            <button
              onClick={() => navigate('/create')}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded font-medium hover:bg-indigo-700 transition-colors"
            >
              <PlusCircle size={20} className="mr-2" />
              Create Your First Quiz
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredQuizzes.map(quiz => (
              <QuizCard
                key={quiz.id}
                quiz={quiz}
                onSelect={() => navigate(`/lobby/${quiz.id}`)}
                onEdit={() => navigate(`/create?edit=${quiz.id}`)}
                onDelete={() => handleDeleteQuiz(quiz.id)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default HomePage;
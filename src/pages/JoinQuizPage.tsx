import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogIn, User, AlertCircle } from 'lucide-react';
import { useQuiz } from '../contexts/QuizContext';
import { useSocket } from '../contexts/SocketContext';

const JoinQuizPage: React.FC = () => {
  const { state } = useQuiz();
  const { joinRoom } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Parse query params to check for quiz ID
  const queryParams = new URLSearchParams(location.search);
  const quizIdParam = queryParams.get('id');
  
  const [quizId, setQuizId] = useState(quizIdParam || '');
  const [playerName, setPlayerName] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const handleJoin = () => {
    if (!quizId.trim()) {
      setError('Please enter a valid quiz ID');
      return;
    }
    
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }
    
    // Check if quiz exists
    const quiz = state.quizzes.find(q => q.id === quizId);
    if (!quiz) {
      setError('Quiz not found. Please check the ID and try again.');
      return;
    }
    
    // For now, simulate a successful join and redirect to the lobby
    // In a real app with socket.io, we would actually join the room here
    const participantId = joinRoom(quizId, playerName);
    
    navigate(`/lobby/${quizId}`);
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
          Join a Quiz
        </h1>
        
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 mb-6">
            <div className="flex">
              <AlertCircle size={20} className="text-red-500 mr-2" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        )}
        
        <div className="space-y-6">
          <div>
            <label htmlFor="quizId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Quiz ID
            </label>
            <input
              id="quizId"
              type="text"
              value={quizId}
              onChange={(e) => setQuizId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
              placeholder="Enter quiz ID or paste full URL"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              You can enter the quiz ID or paste the full invitation URL.
            </p>
          </div>
          
          <div>
            <label htmlFor="playerName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Your Name
            </label>
            <div className="flex">
              <div className="bg-gray-100 dark:bg-gray-600 flex items-center justify-center px-3 rounded-l-md border border-r-0 border-gray-300 dark:border-gray-600">
                <User size={18} className="text-gray-500 dark:text-gray-300" />
              </div>
              <input
                id="playerName"
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="flex-grow px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-r-md shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter your name"
              />
            </div>
          </div>
          
          <button
            onClick={handleJoin}
            disabled={!quizId.trim() || !playerName.trim()}
            className={`w-full flex items-center justify-center px-4 py-3 rounded-md font-medium text-white ${
              quizId.trim() && playerName.trim()
                ? 'bg-indigo-600 hover:bg-indigo-700' 
                : 'bg-gray-400 cursor-not-allowed'
            } transition-colors`}
          >
            <LogIn size={18} className="mr-2" />
            Join Quiz
          </button>
        </div>
      </div>
    </div>
  );
};

export default JoinQuizPage;
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Users, User, Share2, Copy, Check, ArrowRight, AlertCircle } from 'lucide-react';
import { useQuiz } from '../contexts/QuizContext';
import { useSocket } from '../contexts/SocketContext';

const QuizLobbyPage: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const { state, startSession } = useQuiz();
  const { socket, joinRoom } = useSocket();
  const navigate = useNavigate();
  
  const [playerName, setPlayerName] = useState('');
  const [participants, setParticipants] = useState<string[]>([]);
  const [isCopied, setIsCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const quiz = state.quizzes.find(q => q.id === quizId);
  
  useEffect(() => {
    if (!quiz) {
      setError('Quiz not found');
    }
  }, [quiz]);

  const getShareableURL = () => {
    return `${window.location.origin}/join?id=${quizId}`;
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(getShareableURL());
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleStartSolo = async () => {
    if (!quizId) return;
    try {
      const sessionId = await startSession(quizId, true);
      if (sessionId) {
        navigate(`/play/${sessionId}`);
      }
    } catch (error) {
      setError('Failed to start session');
    }
  };

  const handleStartMultiplayer = async () => {
    if (!quizId || !playerName.trim()) return;
    try {
      const sessionId = await startSession(quizId, false);
      if (sessionId) {
        joinRoom(sessionId, playerName);
        navigate(`/play/${sessionId}`);
      }
    } catch (error) {
      setError('Failed to start session');
    }
  };

  if (error) {
    return (
      <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
        <div className="text-red-500 mb-4">
          <AlertCircle size={48} className="mx-auto" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          {error}
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          The quiz you're looking for couldn't be found.
        </p>
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
        >
          Return to Home
        </button>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden mb-8">
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-400 p-6 text-white">
          <h1 className="text-2xl font-bold mb-2">{quiz.title}</h1>
          <p className="opacity-90">{quiz.description}</p>
        </div>
        
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <span className="font-medium text-gray-700 dark:text-gray-300">Category:</span>
              <span 
                className="inline-flex items-center justify-center rounded-full text-xs font-medium px-2.5 py-1 text-white"
                style={{
                  backgroundColor: getCategoryColor(quiz.category)
                }}
              >
                {quiz.category}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="font-medium text-gray-700 dark:text-gray-300">Questions:</span>
              <span className="text-gray-900 dark:text-white">{quiz.questions.length}</span>
            </div>
          </div>
          
          <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-medium text-indigo-800 dark:text-indigo-200 mb-2">
              How would you like to play?
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button 
                className="bg-white dark:bg-gray-700 rounded-lg p-4 border-2 border-transparent hover:border-indigo-500 cursor-pointer transition-all text-left"
                onClick={handleStartSolo}
              >
                <div className="flex items-center mb-2">
                  <User size={20} className="text-indigo-600 dark:text-indigo-400 mr-2" />
                  <h4 className="font-medium text-gray-900 dark:text-white">Solo Play</h4>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Play by yourself to practice or test your knowledge.
                </p>
              </button>
              
              <button 
                className="bg-white dark:bg-gray-700 rounded-lg p-4 border-2 border-transparent hover:border-indigo-500 cursor-pointer transition-all text-left"
                onClick={handleStartMultiplayer}
              >
                <div className="flex items-center mb-2">
                  <Users size={20} className="text-indigo-600 dark:text-indigo-400 mr-2" />
                  <h4 className="font-medium text-gray-900 dark:text-white">Multiplayer</h4>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Host a game for friends, students, or colleagues.
                </p>
              </button>
            </div>
          </div>
          
          <div className="mb-6">
            <label htmlFor="playerName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Your Name
            </label>
            <input
              type="text"
              id="playerName"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
              placeholder="Enter your name"
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Share with Others
            </label>
            <div className="flex">
              <input
                type="text"
                value={getShareableURL()}
                readOnly
                className="flex-grow px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-l-md shadow-sm bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-300"
              />
              <button
                onClick={handleCopyLink}
                className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 border-l-0 rounded-r-md bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors"
              >
                {isCopied ? (
                  <><Check size={16} className="text-green-500" /> Copied</>
                ) : (
                  <><Copy size={16} /> Copy</>
                )}
              </button>
            </div>
          </div>
          
          <div className="text-center">
            <button
              onClick={handleStartMultiplayer}
              disabled={!playerName.trim()}
              className={`inline-flex items-center px-6 py-3 rounded-lg font-medium shadow-md text-white ${
                playerName.trim() 
                  ? 'bg-indigo-600 hover:bg-indigo-700' 
                  : 'bg-gray-400 cursor-not-allowed'
              } transition-colors`}
            >
              Start Quiz <ArrowRight size={18} className="ml-2" />
            </button>
            {!playerName.trim() && (
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Please enter your name to start
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const getCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    'General Knowledge': '#4F46E5',
    'Science': '#0D9488',
    'Technology': '#2563EB',
    'History': '#B45309',
    'Geography': '#059669',
    'Sports': '#DC2626',
    'Entertainment': '#7C3AED',
    'Art': '#EC4899',
    'Literature': '#8B5CF6',
    'Music': '#F59E0B',
  };
  
  return colors[category] || '#6B7280';
};

export default QuizLobbyPage;
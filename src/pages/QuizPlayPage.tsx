import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertTriangle, Users, User, Award } from 'lucide-react';
import { useQuiz } from '../contexts/QuizContext';
import { useSocket } from '../contexts/SocketContext';
import Timer from '../components/quiz/Timer';
import OptionButton from '../components/quiz/OptionButton';
import { Question } from '../types';

const QuizPlayPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { state, submitAnswer, endSession } = useQuiz();
  const { socket } = useSocket();
  const navigate = useNavigate();
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);
  const [startTime, setStartTime] = useState(Date.now());
  const [isTimerActive, setIsTimerActive] = useState(true);
  const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);

  if (!state.isContextLoaded) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  
  const session = sessionId ? state.sessions.find(s => s.id === sessionId) : null;
  const quiz = session ? state.quizzes.find(q => q.id === session.quizId) : null;
  
  console.log('Session in QuizPlayPage:', session);

  const getCurrentQuestion = useCallback((): Question | null => {
    if (!quiz || !quiz.questions || quiz.questions.length === 0) return null;
    
    const questionsToUse = quiz.settings.shuffleQuestions 
      ? [...quiz.questions].sort(() => Math.random() - 0.5)
      : quiz.questions;
    
    if (currentQuestionIndex >= questionsToUse.length) return null;
    return questionsToUse[currentQuestionIndex];
  }, [quiz, currentQuestionIndex]);
  
  useEffect(() => {
    const question = getCurrentQuestion();
    if (question) {
      if (question.shuffleOptions) {
        setShuffledOptions([...question.options].sort(() => Math.random() - 0.5));
      } else {
        setShuffledOptions([...question.options]);
      }
      
      setSelectedAnswer(null);
      setIsRevealed(false);
      setTimeSpent(0);
      setStartTime(Date.now());
      setIsTimerActive(true);
      console.log('Reset for question', currentQuestionIndex + 1, ': selectedAnswer:', null, 'startTime:', Date.now());
    }
  }, [getCurrentQuestion, currentQuestionIndex]);

  if (!session || !quiz) {
    return (
      <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
        <div className="text-red-500 mb-4">
          <AlertTriangle size={48} className="mx-auto" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Session Not Found
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          The quiz session you're looking for couldn't be found.
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

  const currentQuestion = getCurrentQuestion();

  const participantId = session.isSolo ? 'solo-player' : 'multiplayer-player';

  const proceedToNextQuestion = useCallback(() => {
    if (!currentQuestion || !sessionId) return;
    
    const finalAnswer = selectedAnswer || ''; // Ensure answer is not null
    const finalTimeSpent = timeSpent || Math.round((Date.now() - startTime) / 1000); // Fallback if timeSpent not set
    
    console.log('Proceeding to next question:', {
      questionIndex: currentQuestionIndex + 1,
      selectedAnswer: finalAnswer,
      timeSpent: finalTimeSpent,
      participantId
    });
    
    console.log('Results before submitAnswer in QuizPlayPage:', session.results);
    
    submitAnswer(
      sessionId,
      participantId,
      currentQuestion.id,
      finalAnswer,
      finalTimeSpent
    );

    console.log('Results after submitAnswer in QuizPlayPage:', session.results);

    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      endSession(sessionId);
      console.log('Results after endSession in QuizPlayPage:', session.results);
      setTimeout(() => {
        console.log('Navigating to results page, final results:', session.results);
        navigate(`/results/${sessionId}`);
      }, 500); // Increased delay to ensure state persistence
    }
  }, [currentQuestion, sessionId, selectedAnswer, timeSpent, startTime, currentQuestionIndex, quiz, endSession, navigate, submitAnswer, session.results, participantId]);

  const handleSelectAnswer = (answer: string) => {
    if (isRevealed) return;
    
    const calculatedTimeSpent = Math.round((Date.now() - startTime) / 1000);
    setSelectedAnswer(answer);
    setTimeSpent(calculatedTimeSpent);
    setIsTimerActive(false);
    
    console.log('Answer selected:', {
      answer,
      timeSpent: calculatedTimeSpent,
      startTime,
      currentTime: Date.now()
    });
    
    setTimeout(() => {
      setIsRevealed(true);
      if (session.isSolo) {
        setTimeout(() => {
          proceedToNextQuestion();
        }, 1500);
      }
    }, 500);
  };

  const handleTimeUp = () => {
    if (isRevealed) return;
    
    const calculatedTimeSpent = currentQuestion?.timeLimit || 30;
    setTimeSpent(calculatedTimeSpent);
    setSelectedAnswer(selectedAnswer || ''); // Ensure answer is recorded even if null
    setIsTimerActive(false);
    setIsRevealed(true);
    
    console.log('Timer expired:', {
      selectedAnswer: selectedAnswer || '',
      timeSpent: calculatedTimeSpent
    });
    
    if (session.isSolo) {
      setTimeout(() => {
        proceedToNextQuestion();
      }, 1500);
    }
  };

  const handleNextQuestion = () => {
    proceedToNextQuestion();
  };

  if (!currentQuestion) {
    return (
      <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
        <div className="text-yellow-500 mb-4">
          <AlertTriangle size={48} className="mx-auto" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          No Questions Available
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          This quiz doesn't have any questions yet.
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

  const hasSelectedAnswer = selectedAnswer !== null;

  const currentScore = session.results
    .filter(result => result.participantId === participantId)
    .reduce((total, result) => total + result.score, 0);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            {quiz.title}
          </h1>
          
          <div className="flex items-center space-x-4">
            {session.isSolo ? (
              <div className="flex items-center text-gray-700 dark:text-gray-300">
                <User size={18} className="mr-1" />
                <span>Solo Mode</span>
              </div>
            ) : (
              <div className="flex items-center text-gray-700 dark:text-gray-300">
                <Users size={18} className="mr-1" />
                <span>Multiplayer</span>
              </div>
            )}
            <div className="flex items-center text-gray-700 dark:text-gray-300">
              <Award size={18} className="mr-1" />
              <span>Score: {currentScore}</span>
            </div>
          </div>
        </div>
        
        <div className="mb-2">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
            <span>Question {currentQuestionIndex + 1} of {quiz.questions.length}</span>
            <span>Progress: {Math.round(((currentQuestionIndex) / quiz.questions.length) * 100)}%</span>
          </div>
          <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 to-indigo-700 transition-all duration-300"
              style={{ width: `${((currentQuestionIndex) / quiz.questions.length) * 100}%` }}
            />
          </div>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <div className="mb-6">
            <Timer 
              key={currentQuestionIndex}
              duration={currentQuestion.timeLimit} 
              onTimeUp={handleTimeUp}
              isActive={isTimerActive}
            />
          </div>
          
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            {currentQuestion.text}
          </h2>
          
          <div className="space-y-3 mb-8">
            {shuffledOptions.map((option, index) => (
              <OptionButton
                key={index}
                label={option}
                index={index}
                isSelected={selectedAnswer === option}
                onClick={() => handleSelectAnswer(option)}
                isCorrect={option === currentQuestion.correctAnswer}
                isRevealed={isRevealed}
                hasSelectedAnswer={hasSelectedAnswer}
                disabled={isRevealed}
              />
            ))}
          </div>
          
          {isRevealed && !session.isSolo && (
            <div className="text-center">
              <button
                onClick={handleNextQuestion}
                className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
              >
                {currentQuestionIndex < quiz.questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizPlayPage;
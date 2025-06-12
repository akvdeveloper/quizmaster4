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
  const [shuffledQuestions, setShuffledQuestions] = useState<Question[]>([]);
  const [currentScore, setCurrentScore] = useState(0);

  if (!state.isContextLoaded) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  
  const session = sessionId ? state.sessions.find(s => s.id === sessionId) : null;
  const quiz = session ? state.quizzes.find(q => q.id === session.quizId) : null;
  
  // Initialize shuffled questions once when component mounts
  useEffect(() => {
    if (quiz && quiz.questions && shuffledQuestions.length === 0) {
      const questionsToUse = quiz.settings.shuffleQuestions 
        ? [...quiz.questions].sort(() => Math.random() - 0.5)
        : quiz.questions;
      setShuffledQuestions(questionsToUse);
    }
  }, [quiz, shuffledQuestions.length]);

  // Update current score whenever session results change
  useEffect(() => {
    if (session) {
      const participantId = session.isSolo ? 'solo-player' : 'multiplayer-player';
      const newScore = session.results
        .filter(result => result.participantId === participantId)
        .reduce((total, result) => total + result.score, 0);
      setCurrentScore(newScore);
    }
  }, [session?.results, session?.isSolo]);

  const getCurrentQuestion = useCallback((): Question | null => {
    if (!shuffledQuestions || shuffledQuestions.length === 0) return null;
    if (currentQuestionIndex >= shuffledQuestions.length) return null;
    return shuffledQuestions[currentQuestionIndex];
  }, [shuffledQuestions, currentQuestionIndex]);
  
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

  const calculateScore = (answer: string, timeSpent: number, question: Question): number => {
    const isCorrect = question.correctAnswer === answer;
    const baseScore = isCorrect ? 100 : 0;
    const timeBonus = isCorrect ? Math.max(0, Math.floor((1 - timeSpent / question.timeLimit) * 50)) : 0;
    return baseScore + timeBonus;
  };

  const proceedToNextQuestion = useCallback(async () => {
    if (!currentQuestion || !sessionId) return;
    
    const finalAnswer = selectedAnswer || ''; 
    const finalTimeSpent = timeSpent || Math.round((Date.now() - startTime) / 1000);
    
    // Calculate the score for this question
    const questionScore = calculateScore(finalAnswer, finalTimeSpent, currentQuestion);
    
    // Update the current score immediately for visual feedback
    setCurrentScore(prevScore => prevScore + questionScore);
    
    try {
      // Submit the answer and wait for it to complete
      await submitAnswer(
        sessionId,
        participantId,
        currentQuestion.id,
        finalAnswer,
        finalTimeSpent
      );

      // Move to next question or finish quiz
      if (currentQuestionIndex < shuffledQuestions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        // End the session and navigate to results
        await endSession(sessionId);
        // Small delay to ensure state is updated
        setTimeout(() => {
          navigate(`/results/${sessionId}`);
        }, 100);
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      // Revert the score if submission failed
      setCurrentScore(prevScore => prevScore - questionScore);
    }
  }, [
    currentQuestion, 
    sessionId, 
    selectedAnswer, 
    timeSpent, 
    startTime, 
    currentQuestionIndex, 
    shuffledQuestions.length, 
    endSession, 
    navigate, 
    submitAnswer, 
    participantId
  ]);

  const handleSelectAnswer = (answer: string) => {
    if (isRevealed) return;
    
    const calculatedTimeSpent = Math.round((Date.now() - startTime) / 1000);
    setSelectedAnswer(answer);
    setTimeSpent(calculatedTimeSpent);
    setIsTimerActive(false);
    
    // Show the correct answer after a brief delay
    setTimeout(() => {
      setIsRevealed(true);
      // For solo mode, automatically proceed to next question
      if (session.isSolo) {
        setTimeout(() => {
          proceedToNextQuestion();
        }, 2000); // Give user time to see the correct answer
      }
    }, 500);
  };

  const handleTimeUp = () => {
    if (isRevealed) return;
    
    const calculatedTimeSpent = currentQuestion?.timeLimit || 30;
    setTimeSpent(calculatedTimeSpent);
    setSelectedAnswer(selectedAnswer || ''); 
    setIsTimerActive(false);
    setIsRevealed(true);
    
    // For solo mode, automatically proceed to next question
    if (session.isSolo) {
      setTimeout(() => {
        proceedToNextQuestion();
      }, 2000);
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
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                Score: {currentScore}
              </span>
            </div>
          </div>
        </div>
        
        <div className="mb-2">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
            <span>Question {currentQuestionIndex + 1} of {shuffledQuestions.length}</span>
            <span>Progress: {Math.round(((currentQuestionIndex) / shuffledQuestions.length) * 100)}%</span>
          </div>
          <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 to-indigo-700 transition-all duration-300"
              style={{ width: `${((currentQuestionIndex) / shuffledQuestions.length) * 100}%` }}
            />
          </div>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <div className="mb-6">
            <Timer 
              key={`${currentQuestionIndex}-${startTime}`}
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
                key={`${currentQuestionIndex}-${index}-${option}`}
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
                {currentQuestionIndex < shuffledQuestions.length - 1 ? 'Next Question' : 'Finish Quiz'}
              </button>
            </div>
          )}
          
          {isRevealed && session.isSolo && (
            <div className="text-center">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="mb-2">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {selectedAnswer === currentQuestion.correctAnswer ? (
                      <span className="text-green-600 dark:text-green-400 font-medium">
                        ✓ Correct! +{calculateScore(selectedAnswer, timeSpent, currentQuestion)} points
                      </span>
                    ) : (
                      <span className="text-red-600 dark:text-red-400 font-medium">
                        ✗ Incorrect. The correct answer was: {currentQuestion.correctAnswer}
                      </span>
                    )}
                  </p>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Moving to next question...
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizPlayPage;
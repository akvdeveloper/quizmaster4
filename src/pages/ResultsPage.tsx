import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Trophy, Medal, Share2, Home, BarChart2, AlertTriangle } from 'lucide-react';
import { useQuiz } from '../contexts/QuizContext';
import ResultSummary from '../components/quiz/ResultSummary';

const ResultsPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { state } = useQuiz();
  const navigate = useNavigate();
  
  const session = sessionId ? state.sessions.find(s => s.id === sessionId) : null;
  const quiz = session ? state.quizzes.find(q => q.id === session.quizId) : null;
  
  const [leaderboard, setLeaderboard] = useState<{id: string, name: string, score: number, correct: number}[]>([]);

  console.log('Session in ResultsPage:', session);

  useEffect(() => {
    if (!state.isContextLoaded) return;

    if (!session || !quiz) {
      navigate('/');
      return;
    }

    if (session.isSolo) {
      const results = session.results.filter(r => r.participantId === 'solo-player');
      console.log('Solo mode results for leaderboard:', results);
      const totalScore = results.reduce((sum, r) => sum + r.score, 0);
      const correctAnswers = results.filter(r => r.isCorrect).length;
      
      setLeaderboard([
        {
          id: 'solo-player',
          name: 'You',
          score: totalScore,
          correct: correctAnswers
        }
      ]);
    } else {
      const participantScores = new Map<string, {score: number, correct: number}>();
      
      session.results.forEach(result => {
        if (!participantScores.has(result.participantId)) {
          participantScores.set(result.participantId, {score: 0, correct: 0});
        }
        
        const current = participantScores.get(result.participantId)!;
        participantScores.set(result.participantId, {
          score: current.score + result.score,
          correct: current.correct + (result.isCorrect ? 1 : 0)
        });
      });
      
      const leaderboardData = session.participants.map(participant => ({
        id: participant.id,
        name: participant.name,
        ...participantScores.get(participant.id) || {score: 0, correct: 0}
      }));
      
      leaderboardData.sort((a, b) => b.score - a.score);
      setLeaderboard(leaderboardData);
    }
  }, [state.isContextLoaded, session, quiz, navigate]);

  if (!state.isContextLoaded) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!session || !quiz) {
    return (
      <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
        <div className="text-red-500 mb-4">
          <AlertTriangle size={48} className="mx-auto" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Results Not Found
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          The quiz results you're looking for couldn't be found.
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

  const soloParticipantId = 'solo-player';

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-lg shadow-lg p-8 mb-8 text-white text-center">
        <div className="mb-4">
          <Trophy size={48} className="mx-auto" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Quiz Complete!</h1>
        <p className="text-lg opacity-90 mb-4">{quiz.title}</p>
        
        {session.isSolo ? (
          <div className="mt-6">
            <div className="bg-white/20 rounded-lg p-4 inline-block">
              <div className="text-3xl font-bold mb-1">
                {leaderboard[0]?.score || 0}
              </div>
              <div className="text-sm opacity-80">Your Score</div>
            </div>
          </div>
        ) : (
          <div className="mt-6 flex justify-center space-x-4">
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center px-4 py-2 bg-white text-indigo-700 rounded-lg font-medium hover:bg-indigo-50 transition-colors"
            >
              <Home size={18} className="mr-2" />
              Home
            </button>
            <button
              onClick={() => {
                const url = window.location.href;
                navigator.clipboard.writeText(url);
                alert('Result link copied to clipboard!');
              }}
              className="inline-flex items-center px-4 py-2 bg-indigo-700 text-white rounded-lg font-medium hover:bg-indigo-800 transition-colors"
            >
              <Share2 size={18} className="mr-2" />
              Share Results
            </button>
          </div>
        )}
      </div>
      
      {!session.isSolo && leaderboard.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
            <Medal size={24} className="text-amber-500 mr-2" />
            Leaderboard
          </h2>
          
          <div className="space-y-4">
            {leaderboard.map((player, index) => (
              <div 
                key={player.id}
                className="flex items-center p-3 rounded-lg bg-gray-50 dark:bg-gray-700"
              >
                <div className="w-8 h-8 flex items-center justify-center rounded-full mr-3 text-white font-bold text-sm"
                  style={{
                    backgroundColor: 
                      index === 0 ? '#F59E0B' : 
                      index === 1 ? '#94A3B8' : 
                      index === 2 ? '#B45309' : 
                      '#6B7280'
                  }}
                >
                  {index + 1}
                </div>
                
                <div className="flex-grow">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {player.name}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {player.correct} correct answers
                  </div>
                </div>
                
                <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                  {player.score}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <ResultSummary
        key={session.id}
        quiz={quiz}
        session={session}
        participantId={session.isSolo ? soloParticipantId : undefined}
      />
      
      <div className="mt-8 flex justify-center space-x-4">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          <Home size={20} className="mr-2" />
          Return Home
        </button>
        <button
          onClick={() => navigate(`/lobby/${quiz.id}`)}
          className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
        >
          <BarChart2 size={20} className="mr-2" />
          Play Again
        </button>
      </div>
    </div>
  );
};

export default ResultsPage;
import React from 'react';
import {
  CheckCircle,
  XCircle,
  Clock,
  DownloadCloud,
  AlertTriangle,
} from 'lucide-react';
import { Quiz, QuizSession, Question, ParticipantResult } from '../../types';

interface ResultSummaryProps {
  quiz: Quiz;
  session: QuizSession;
  participantId?: string;
}

const ResultSummary: React.FC<ResultSummaryProps> = ({
  quiz,
  session,
  participantId,
}) => {
  const relevantResults = participantId
    ? session.results.filter((r) => r.participantId === participantId)
    : session.results;

  if (relevantResults.length === 0 && participantId) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
        <div className="text-yellow-500 mb-4">
          <AlertTriangle size={48} className="mx-auto" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          No Results Found
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          No results were recorded for this participant. Please ensure answers
          were submitted correctly.
        </p>
      </div>
    );
  }

  const totalQuestions = quiz.questions.length;
  const answeredQuestions = new Set(
    relevantResults.filter((r) => r.answer !== '').map((r) => r.questionId)
  ).size;
  const correctAnswers = relevantResults.filter((r) => r.isCorrect).length;
  const totalScore = relevantResults.reduce((sum, r) => sum + r.score, 0);
  const accuracyPercentage =
    totalQuestions > 0
      ? Math.round((correctAnswers / totalQuestions) * 100)
      : 0;
  const avgTimePerQuestion =
    relevantResults.length > 0
      ? Math.round(
          relevantResults.reduce((sum, r) => sum + r.timeSpent, 0) /
            relevantResults.length
        )
      : 0;

  const resultsMap = new Map<string, ParticipantResult[]>();
  relevantResults.forEach((result) => {
    if (!resultsMap.has(result.questionId)) {
      resultsMap.set(result.questionId, []);
    }
    resultsMap.get(result.questionId)?.push(result);
  });

  const exportResults = () => {
    let csv =
      'Question,Your Answer,Correct Answer,Result,Time Spent,Score\n';

    quiz.questions.forEach((question) => {
      const result = relevantResults.find((r) => r.questionId === question.id);
      if (result) {
        csv += `"${question.text.replace(/"/g, '""')}","${result.answer.replace(
          /"/g,
          '""'
        )}","${question.correctAnswer.replace(
          /"/g,
          '""'
        )}","${result.isCorrect ? 'Correct' : 'Incorrect'}",${
          result.timeSpent
        }s,${result.score}\n`;
      } else {
        csv += `"${question.text.replace(/"/g, '""')}","Not answered","${question.correctAnswer.replace(
          /"/g,
          '""'
        )}","Incorrect",0,0\n`;
      }
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `quiz_results_${new Date().toISOString().slice(0, 10)}.csv`
    );
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const shareResults = async () => {
    const shareData = {
      title: 'QuizMaster Results',
      text: 'Check out my quiz results!',
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error('Sharing failed:', err);
      }
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href).then(() => {
        alert('Link copied to clipboard! You can paste it to share.');
      });
    } else {
      alert('Sharing not supported on this browser.');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Quiz Results Summary
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-indigo-50 dark:bg-indigo-900/30 p-4 rounded-lg text-center">
            <p className="text-sm text-indigo-700 dark:text-indigo-300 mb-1">
              Score
            </p>
            <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">
              {totalScore}
            </p>
          </div>

          <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg text-center">
            <p className="text-sm text-green-700 dark:text-green-300 mb-1">
              Accuracy
            </p>
            <p className="text-2xl font-bold text-green-700 dark:text-green-300">
              {accuracyPercentage}%
            </p>
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/30 p-4 rounded-lg text-center">
            <p className="text-sm text-amber-700 dark:text-amber-300 mb-1">
              Avg Time
            </p>
            <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">
              {avgTimePerQuestion}s
            </p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg text-center">
            <p className="text-sm text-blue-700 dark:text-blue-300 mb-1">
              Answered
            </p>
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
              {answeredQuestions}/{totalQuestions}
            </p>
          </div>
        </div>

        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Overall Performance
            </h3>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {correctAnswers} correct, {totalQuestions - correctAnswers}{' '}
              incorrect
            </span>
          </div>

          <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500"
              style={{ width: `${accuracyPercentage}%` }}
            ></div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:justify-end gap-2 mb-8">
          <button
            onClick={exportResults}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 transition"
          >
            <DownloadCloud size={18} className="mr-2" />
            Export Results
          </button>
          <button
            onClick={shareResults}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-500 hover:bg-blue-600 transition"
          >
            Share Results
          </button>
        </div>

        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Question Breakdown
        </h3>

        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
          {quiz.questions.map((question) => {
            const questionResults = resultsMap.get(question.id) || [];
            const result = questionResults[0];

            return (
              <div
                key={question.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-grow">
                    <p className="text-gray-900 dark:text-white font-medium">
                      {question.text}
                    </p>

                    <div className="mt-2 space-y-1">
                      {question.options.map((option, idx) => (
                        <div
                          key={idx}
                          className={`px-3 py-2 rounded ${getOptionClass(
                            option,
                            question,
                            result
                          )}`}
                        >
                          {option}
                          {option === question.correctAnswer && (
                            <span className="ml-2 text-xs font-medium text-green-700 dark:text-green-300">
                              (Correct Answer)
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="ml-4 flex flex-col items-center">
                    {result ? (
                      <>
                        {result.isCorrect ? (
                          <CheckCircle
                            size={24}
                            className="text-green-500 mb-1"
                          />
                        ) : (
                          <XCircle size={24} className="text-red-500 mb-1" />
                        )}
                        <span className="text-sm font-medium">
                          {result.score} pts
                        </span>
                        <div className="flex items-center mt-1 text-xs text-gray-500 dark:text-gray-400">
                          <Clock size={12} className="mr-1" />
                          {result.timeSpent}s
                        </div>
                      </>
                    ) : (
                      <>
                        <XCircle size={24} className="text-gray-400 mb-1" />
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          No answer
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const getOptionClass = (
  option: string,
  question: Question,
  result?: ParticipantResult
): string => {
  if (!result) {
    return option === question.correctAnswer
      ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200'
      : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
  }

  if (option === question.correctAnswer) {
    return 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200';
  }

  if (option === result.answer && !result.isCorrect) {
    return 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200';
  }

  return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
};

export default ResultSummary;

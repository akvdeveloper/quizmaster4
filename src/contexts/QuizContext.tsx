import React, { createContext, useContext, useReducer, useEffect } from 'react';
import axios from 'axios';
import { Quiz, Question, QuizSession, ParticipantResult } from '../types';

interface QuizState {
  quizzes: Quiz[];
  currentQuiz: Quiz | null;
  sessions: QuizSession[];
  currentSession: QuizSession | null;
  isLoading: boolean;
  error: string | null;
  isContextLoaded: boolean;
}

type QuizAction =
  | { type: 'SET_QUIZZES'; payload: Quiz[] }
  | { type: 'ADD_QUIZ'; payload: Quiz }
  | { type: 'UPDATE_QUIZ'; payload: Quiz }
  | { type: 'DELETE_QUIZ'; payload: string }
  | { type: 'SET_CURRENT_QUIZ'; payload: Quiz | null }
  | { type: 'SET_SESSIONS'; payload: QuizSession[] }
  | { type: 'ADD_SESSION'; payload: QuizSession }
  | { type: 'UPDATE_SESSION'; payload: QuizSession }
  | { type: 'SET_CURRENT_SESSION'; payload: QuizSession | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_CONTEXT_LOADED'; payload: boolean };

interface QuizContextType {
  state: QuizState;
  dispatch: React.Dispatch<QuizAction>;
  createQuiz: (quiz: Omit<Quiz, 'id' | 'createdAt'>) => Promise<string>;
  updateQuiz: (quiz: Quiz) => Promise<void>;
  deleteQuiz: (quizId: string) => Promise<void>;
  startSession: (quizId: string, isSolo: boolean) => Promise<string>;
  submitAnswer: (sessionId: string, participantId: string, questionId: string, answer: string, timeSpent: number) => Promise<void>;
  endSession: (sessionId: string) => Promise<void>;
  importQuestions: (quizId: string, questions: Omit<Question, 'id'>[]) => Promise<void>;
}

const initialState: QuizState = {
  quizzes: [],
  currentQuiz: null,
  sessions: [],
  currentSession: null,
  isLoading: false,
  error: null,
  isContextLoaded: false
};

const quizReducer = (state: QuizState, action: QuizAction): QuizState => {
  switch (action.type) {
    case 'SET_QUIZZES':
      return { ...state, quizzes: action.payload };
    case 'ADD_QUIZ':
      return { ...state, quizzes: [...state.quizzes, action.payload] };
    case 'UPDATE_QUIZ':
      return {
        ...state,
        quizzes: state.quizzes.map(quiz =>
          quiz.id === action.payload.id ? action.payload : quiz
        ),
        currentQuiz: state.currentQuiz?.id === action.payload.id ? action.payload : state.currentQuiz
      };
    case 'DELETE_QUIZ':
      return {
        ...state,
        quizzes: state.quizzes.filter(quiz => quiz.id !== action.payload),
        currentQuiz: state.currentQuiz?.id === action.payload ? null : state.currentQuiz
      };
    case 'SET_CURRENT_QUIZ':
      return { ...state, currentQuiz: action.payload };
    case 'SET_SESSIONS':
      return { ...state, sessions: action.payload };
    case 'ADD_SESSION':
      return { ...state, sessions: [...state.sessions, action.payload] };
    case 'UPDATE_SESSION':
      return {
        ...state,
        sessions: state.sessions.map(session =>
          session.id === action.payload.id ? action.payload : session
        ),
        currentSession: state.currentSession?.id === action.payload.id ? action.payload : state.currentSession
      };
    case 'SET_CURRENT_SESSION':
      return { ...state, currentSession: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_CONTEXT_LOADED':
      return { ...state, isContextLoaded: action.payload };
    default:
      return state;
  }
};

const QuizContext = createContext<QuizContextType | undefined>(undefined);

export const QuizProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(quizReducer, initialState);

  const API_BASE_URL = 'https://quizappserver-six.vercel.app/api'; // Centralized API URL

  useEffect(() => {
    const loadData = async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });

        // Fetch quizzes from the backend
        const quizzesResponse = await axios.get(`${API_BASE_URL}/quizzes`);
        dispatch({ type: 'SET_QUIZZES', payload: quizzesResponse.data });

        // Fetch sessions from the backend
        const sessionsResponse = await axios.get(`${API_BASE_URL}/sessions`);
        dispatch({ type: 'SET_SESSIONS', payload: sessionsResponse.data });
      } catch (error) {
        console.error('Error loading data from backend:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to load initial data.' });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
        dispatch({ type: 'SET_CONTEXT_LOADED', payload: true });
      }
    };

    loadData();
  }, []);

  const generateId = () => Math.random().toString(36).substring(2, 15);

  const createQuiz = async (quiz: Omit<Quiz, 'id' | 'createdAt'>): Promise<string> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    try {
      const newQuiz: Quiz = {
        ...quiz,
        id: generateId(),
        createdAt: new Date().toISOString()
      };

      const response = await axios.post(`${API_BASE_URL}/quizzes`, newQuiz);
      dispatch({ type: 'ADD_QUIZ', payload: response.data });
      return newQuiz.id;
    } catch (error) {
      console.error('Error creating quiz:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to create quiz.' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const updateQuiz = async (quiz: Quiz) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    try {
      const response = await axios.put(`${API_BASE_URL}/quizzes/${quiz.id}`, quiz);
      dispatch({ type: 'UPDATE_QUIZ', payload: response.data });
    } catch (error) {
      console.error('Error updating quiz:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update quiz.' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const deleteQuiz = async (quizId: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    try {
      await axios.delete(`${API_BASE_URL}/quizzes/${quizId}`);
      dispatch({ type: 'DELETE_QUIZ', payload: quizId });
    } catch (error) {
      console.error('Error deleting quiz:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to delete quiz.' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const startSession = async (quizId: string, isSolo: boolean): Promise<string> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    try {
      const quiz = state.quizzes.find(q => q.id === quizId);
      if (!quiz) {
        throw new Error('Quiz not found');
      }

      const sessionId = generateId();
      const newSession: QuizSession = {
        id: sessionId,
        quizId,
        startedAt: new Date().toISOString(),
        endedAt: null,
        isSolo,
        participants: [],
        currentQuestionIndex: -1,
        status: 'waiting',
        results: []
      };

      const response = await axios.post(`${API_BASE_URL}/sessions`, newSession);
      dispatch({ type: 'ADD_SESSION', payload: response.data });
      dispatch({ type: 'SET_CURRENT_SESSION', payload: response.data });

      return sessionId;
    } catch (error: any) { // Explicitly type error as 'any' for now, or use 'unknown' and narrow
      console.error('Error starting session:', error);
      dispatch({ type: 'SET_ERROR', payload: `Failed to start session: ${error.message || 'Unknown error'}` });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const submitAnswer = async (
    sessionId: string,
    participantId: string,
    questionId: string,
    answer: string,
    timeSpent: number
  ) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    try {
      const session = state.sessions.find(s => s.id === sessionId);
      const quiz = session ? state.quizzes.find(q => q.id === session.quizId) : null;

      if (!session || !quiz) {
        throw new Error('Session or quiz not found');
      }

      const question = quiz.questions.find(q => q.id === questionId);
      if (!question) {
        throw new Error('Question not found');
      }

      const isCorrect = question.correctAnswer === answer;
      const baseScore = isCorrect ? 100 : 0;
      const timeBonus = isCorrect ? Math.max(0, Math.floor((1 - timeSpent / question.timeLimit) * 50)) : 0;
      const totalScore = baseScore + timeBonus;

      let updatedResults = [...session.results];
      const existingResultIndex = updatedResults.findIndex(
        r => r.participantId === participantId && r.questionId === questionId
      );

      const answerResult: ParticipantResult = {
        participantId,
        questionId,
        answer,
        isCorrect,
        timeSpent,
        score: totalScore,
        submittedAt: new Date().toISOString()
      };

      if (existingResultIndex >= 0) {
        updatedResults[existingResultIndex] = answerResult;
      } else {
        updatedResults.push(answerResult);
      }

      const updatedSession = {
        ...session,
        results: updatedResults
      };

      const response = await axios.put(`${API_BASE_URL}/sessions/${sessionId}`, updatedSession);
      dispatch({ type: 'UPDATE_SESSION', payload: response.data });
    } catch (error: any) {
      console.error('Error submitting answer:', error);
      dispatch({ type: 'SET_ERROR', payload: `Failed to submit answer: ${error.message || 'Unknown error'}` });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const endSession = async (sessionId: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    try {
      const session = state.sessions.find(s => s.id === sessionId);

      if (!session) {
        throw new Error('Session not found');
      }

      const updatedSession = {
        ...session,
        endedAt: new Date().toISOString(),
        status: 'completed'
      };

      const response = await axios.put(`${API_BASE_URL}/sessions/${sessionId}`, updatedSession);
      dispatch({ type: 'UPDATE_SESSION', payload: response.data });
    } catch (error: any) {
      console.error('Error ending session:', error);
      dispatch({ type: 'SET_ERROR', payload: `Failed to end session: ${error.message || 'Unknown error'}` });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const importQuestions = async (quizId: string, questions: Omit<Question, 'id'>[]) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    try {
      const quiz = state.quizzes.find(q => q.id === quizId);

      if (!quiz) {
        throw new Error('Quiz not found');
      }

      const newQuestions: Question[] = questions.map(q => ({
        ...q,
        id: generateId()
      }));

      const updatedQuiz = {
        ...quiz,
        questions: [...quiz.questions, ...newQuestions]
      };

      const response = await axios.put(`${API_BASE_URL}/quizzes/${quizId}`, updatedQuiz);
      dispatch({ type: 'UPDATE_QUIZ', payload: response.data });
    } catch (error: any) {
      console.error('Error importing questions:', error);
      dispatch({ type: 'SET_ERROR', payload: `Failed to import questions: ${error.message || 'Unknown error'}` });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  return (
    <QuizContext.Provider value={{
      state,
      dispatch,
      createQuiz,
      updateQuiz,
      deleteQuiz,
      startSession,
      submitAnswer,
      endSession,
      importQuestions
    }}>
      {children}
    </QuizContext.Provider>
  );
};

export const useQuiz = (): QuizContextType => {
  const context = useContext(QuizContext);
  if (context === undefined) {
    throw new Error('useQuiz must be used within a QuizProvider');
  }
  return context;
};
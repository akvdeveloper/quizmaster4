import React, { createContext, useContext, useReducer, useEffect } from 'react';
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
  createQuiz: (quiz: Omit<Quiz, 'id'>) => void;
  updateQuiz: (quiz: Quiz) => void;
  deleteQuiz: (quizId: string) => void;
  startSession: (quizId: string, isSolo: boolean) => Promise<string>;
  submitAnswer: (sessionId: string, participantId: string, questionId: string, answer: string, timeSpent: number) => void;
  endSession: (sessionId: string) => void;
  importQuestions: (quizId: string, questions: Omit<Question, 'id'>[]) => void;
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

  useEffect(() => {
    const loadData = () => {
      try {
        const savedQuizzes = localStorage.getItem('quizzes');
        const savedSessions = localStorage.getItem('sessions');
        
        if (savedQuizzes) {
          dispatch({ type: 'SET_QUIZZES', payload: JSON.parse(savedQuizzes) });
        }
        
        if (savedSessions) {
          dispatch({ type: 'SET_SESSIONS', payload: JSON.parse(savedSessions) });
        }
      } catch (error) {
        console.error('Error loading data from localStorage:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to load saved quizzes' });
      } finally {
        dispatch({ type: 'SET_CONTEXT_LOADED', payload: true });
      }
    };
    
    loadData();
  }, []);

  useEffect(() => {
    localStorage.setItem('quizzes', JSON.stringify(state.quizzes));
    console.log('Saved quizzes to localStorage:', state.quizzes);
  }, [state.quizzes]);

  useEffect(() => {
    localStorage.setItem('sessions', JSON.stringify(state.sessions));
    console.log('Saved sessions to localStorage:', state.sessions);
  }, [state.sessions]);

  const generateId = () => Math.random().toString(36).substring(2, 15);

  const createQuiz = (quiz: Omit<Quiz, 'id'>) => {
    const newQuiz: Quiz = {
      ...quiz,
      id: generateId(),
      createdAt: new Date().toISOString()
    };
    
    dispatch({ type: 'ADD_QUIZ', payload: newQuiz });
    return newQuiz.id;
  };

  const updateQuiz = (quiz: Quiz) => {
    dispatch({ type: 'UPDATE_QUIZ', payload: quiz });
  };

  const deleteQuiz = (quizId: string) => {
    dispatch({ type: 'DELETE_QUIZ', payload: quizId });
  };

  const startSession = (quizId: string, isSolo: boolean): Promise<string> => {
    return new Promise((resolve, reject) => {
      const quiz = state.quizzes.find(q => q.id === quizId);
      if (!quiz) {
        dispatch({ type: 'SET_ERROR', payload: 'Quiz not found' });
        reject(new Error('Quiz not found'));
        return;
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
  
      dispatch({ type: 'ADD_SESSION', payload: newSession });
      dispatch({ type: 'SET_CURRENT_SESSION', payload: newSession });
  
      resolve(sessionId);
    });
  };

  const submitAnswer = (
    sessionId: string, 
    participantId: string, 
    questionId: string, 
    answer: string, 
    timeSpent: number
  ) => {
    const session = state.sessions.find(s => s.id === sessionId);
    const quiz = session ? state.quizzes.find(q => q.id === session.quizId) : null;
    
    if (!session || !quiz) {
      dispatch({ type: 'SET_ERROR', payload: 'Session or quiz not found' });
      return;
    }
    
    const question = quiz.questions.find(q => q.id === questionId);
    if (!question) {
      dispatch({ type: 'SET_ERROR', payload: 'Question not found' });
      return;
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
    
    dispatch({ type: 'UPDATE_SESSION', payload: updatedSession });
    console.log('After submitAnswer, updated session:', updatedSession);
  };

  const endSession = (sessionId: string) => {
    const session = state.sessions.find(s => s.id === sessionId);
    
    if (!session) {
      dispatch({ type: 'SET_ERROR', payload: 'Session not found' });
      return;
    }
    
    const updatedSession = {
      ...session,
      endedAt: new Date().toISOString(),
      status: 'completed' as const
    };
    
    dispatch({ type: 'UPDATE_SESSION', payload: updatedSession });
    console.log('After endSession, updated session:', updatedSession);
  };

  const importQuestions = (quizId: string, questions: Omit<Question, 'id'>[]) => {
    const quiz = state.quizzes.find(q => q.id === quizId);
    
    if (!quiz) {
      dispatch({ type: 'SET_ERROR', payload: 'Quiz not found' });
      return;
    }
    
    const newQuestions: Question[] = questions.map(q => ({
      ...q,
      id: generateId()
    }));
    
    const updatedQuiz = {
      ...quiz,
      questions: [...quiz.questions, ...newQuestions]
    };
    
    dispatch({ type: 'UPDATE_QUIZ', payload: updatedQuiz });
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
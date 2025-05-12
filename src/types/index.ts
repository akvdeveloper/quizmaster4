// Quiz Types
export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: string;
  timeLimit: number; // in seconds
  category: string;
  shuffleOptions: boolean;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  category: string;
  createdAt: string;
  questions: Question[];
  settings: {
    shuffleQuestions: boolean;
    defaultTimeLimit: number;
  };
}

// Session Types
export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
}

export interface ParticipantResult {
  participantId: string;
  questionId: string;
  answer: string;
  isCorrect: boolean;
  timeSpent: number; // in seconds
  score: number;
  submittedAt: string;
}

export type SessionStatus = 'waiting' | 'active' | 'completed';

export interface QuizSession {
  id: string;
  quizId: string;
  startedAt: string;
  endedAt: string | null;
  isSolo: boolean;
  participants: Participant[];
  currentQuestionIndex: number;
  status: SessionStatus;
  results: ParticipantResult[];
}

// Component Props Types
export interface QuizCardProps {
  quiz: Quiz;
  onSelect: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export interface QuestionFormProps {
  question?: Question;
  onSave: (question: Omit<Question, 'id'>) => void;
  onCancel: () => void;
}

export interface TimerProps {
  duration: number;
  onTimeUp: () => void;
  isActive: boolean;
}

export interface OptionButtonProps {
  label: string;
  isSelected: boolean;
  onClick: () => void;
  isCorrect?: boolean;
  isRevealed?: boolean;
}

export interface ResultItemProps {
  question: Question;
  result: ParticipantResult | null;
}
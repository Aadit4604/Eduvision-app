export enum Difficulty {
  EASY = 'Easy',
  MEDIUM = 'Medium',
  HARD = 'Hard',
  OLYMPIAD = 'Olympiad/Competitive'
}

export enum ProfessorLevel {
  ELEMENTARY = 'Elementary (Grade 1-5)',
  MIDDLE = 'Middle School (Grade 6-8)',
  HIGH = 'High School (Grade 9-12)',
  COLLEGE = 'College (Undergrad)',
  PHD = 'PhD (Research/Expert)'
}

export interface ExamAnalysis {
  marksDistribution: {
    chapter: string;
    marks: number;
  }[];
  topicAnalysis: {
    topic: string;
    frequency: string; // e.g., "High", "Low"
  }[];
  difficultyMap: {
    level: string;
    percentage: number;
  }[];
  weakAreas: string[];
  revisionPlan: string[];
  solutions: string; // Markdown content
}

export interface Question {
  id: number;
  question: string;
  answer: string;
  explanation: string;
  difficulty: string;
  topic: string;
}

export interface Worksheet {
  title: string;
  questions: Question[];
}

export interface CameraAnalysisResult {
  solvedEquation?: string;
  steps?: string[];
  hint?: string;
  errorDetected?: string;
  rawTextResponse: string;
}

export interface GroundingMetadata {
  groundingChunks?: {
    web?: {
      uri?: string;
      title?: string;
    }
  }[];
  webSearchQueries?: string[];
}

export interface ProfessorResponse {
  text: string;
  groundingMetadata?: GroundingMetadata;
}

export interface ChatAttachment {
  type: 'image' | 'audio';
  data: string; // base64
  mimeType: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  attachments?: ChatAttachment[];
  timestamp: number;
}

export interface ThemeConfig {
  id: string;
  name: string;
  colors: {
    primary: string;   // Maps to Indigo
    secondary: string; // Maps to Purple
    accent: string;    // Maps to Pink
    info: string;      // Maps to Cyan
    success: string;   // Maps to Emerald
  };
  gradient: string;
}

export interface Flashcard {
  front: string;
  back: string;
  mastered: boolean;
}

export interface NotebookAnalysis {
  transcription: string;
  summary: string;
  keyConcepts: { 
    name: string; 
    definition: string;
    category: string;
  }[];
  connections: {
    source: string;
    target: string;
    relationship: string;
  }[];
  actionPlan: string[];
  flashcards?: Flashcard[];
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string; // The correct option string
  explanation: string;
}

export interface HistoryItem {
  id: string;
  title: string;
  timestamp: number;
  type: 'exam' | 'notebook' | 'prof' | 'solver' | 'sheet'; 
}
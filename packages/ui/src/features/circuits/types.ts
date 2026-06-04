/**
 * Circuit & Lesson types — matches MyCircuitsFeature + ActiveCircuitFeature models
 */

export type ChapterType = 'learn' | 'practice' | 'challenge' | 'quiz';

export interface CircuitDetails {
  id: string;
  title: string;
  description: string;
  coverImageUrl: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  isPreview: boolean;
  progress: number; // 0-100
  isFavorite: boolean;
  isCompleted: boolean;
  lessonsCount: number;
  completedLessonsCount: number;
  trophies?: string;
}

export interface LearningPathDetails {
  id: string;
  title: string;
  coverImageUrl?: string;
  circuits: CircuitDetails[];
}

export interface LessonDetails {
  id: string;
  title: string;
  description: string;
  chapters: ChapterDetails[];
  isCompleted: boolean;
}

export interface ChapterDetails {
  id: string;
  title: string;
  type: ChapterType;
  isCompleted: boolean;
  steps: ChapterStep[];
}

export interface ChapterStep {
  id: string;
  title: string;
  contentBlocks: ContentBlock[];
}

export type ContentBlockType =
  | 'text'
  | 'image'
  | 'video'
  | 'audio'
  | 'pianoRoll'
  | 'pianoKeys'
  | 'drumPads'
  | 'question';

export interface ContentBlock {
  id: string;
  type: ContentBlockType;
  // Text block
  text?: string;
  // Image block
  imageUrl?: string;
  // Video block
  videoUrl?: string;
  // Question block
  question?: string;
  answers?: { id: string; text: string; isCorrect: boolean }[];
}

export interface MyCircuitsState {
  status: 'loading' | 'error' | 'loaded';
  recommended?: CircuitDetails;
  inProgress: CircuitDetails[];
  learningPaths: LearningPathDetails[];
}

export interface Trophy {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  achieved: boolean;
  achievedAt?: string;
}

export type TrophySize = 'small' | 'medium' | 'large';

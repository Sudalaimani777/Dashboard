export interface BookItem {
  id: string;
  title: string;
  author: string;
  tag: string;
  isFinished?: boolean;
  coverGradient: string;
}

export interface ReadingProgress {
  currentPage: number;
  totalPages: number;
  estimatedFinishDays: number;
  dailyPace: number;
}

export interface ReaderCadence {
  annualGoalRead: number;
  annualGoalTotal: number;
  streakDays: number;
  totalAnnualPages: number;
}

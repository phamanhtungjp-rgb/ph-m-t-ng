export interface Chapter {
  id: string;
  title: string;
  content: string;
  publishDate: string;
  chapterNumber: number;
}

export interface Novel {
  id: string;
  title: string;
  author: string;
  authorId: string;
  description: string;
  coverUrl: string;
  bannerUrl: string;
  genres: string[];
  status: 'Đang ra' | 'Hoàn thành';
  chapters: Chapter[];
  views: string;
  rating: number;
  lastUpdated: string;
  isHot?: boolean;
  isFull?: boolean;
  translationGroup?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface UserProgress {
  novelId: string;
  lastChapterId: string;
  progressPercent: number;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  coins: number;
  level: number;
  exp: number;
  badges: string[];
  lastCheckIn?: string;
}

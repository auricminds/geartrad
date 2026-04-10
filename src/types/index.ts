export type UserType = 'buyer' | 'seller';
export type ListingType = 'account' | 'skin' | 'weapon' | 'bundle' | 'ticket';
export type BoostType = 'weekly' | 'monthly' | null;
export type AccountRank = 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond' | 'Master' | 'Grandmaster' | 'Challenger';

export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  type: UserType;
  rating: number;
  totalSales: number;
  joinedAt: Date;
  isVerified: boolean;
}

export interface Listing {
  id: string;
  title: string;
  titleAr?: string;
  description: string;
  descriptionAr?: string;
  price: number;
  game: string;
  type: ListingType;
  coverImage: string;
  images?: string[];
  rank?: AccountRank;
  seller: User;
  likes: number;
  isLiked?: boolean;
  isBoosted: boolean;
  boostType?: BoostType;
  boostExpiresAt?: Date;
  createdAt: Date;
  isAvailable: boolean;
  stats?: {
    level?: number;
    hoursPlayed?: number;
    achievements?: number;
    winRate?: number;
  };
}

export interface CartItem {
  listing: Listing;
  addedAt: Date;
}

export interface Message {
  id: string;
  senderId: string;
  content: string;
  createdAt: Date;
  isRead: boolean;
}

export interface Chat {
  id: string;
  listing: Listing;
  buyer: User;
  seller: User;
  messages: Message[];
  lastMessage?: Message;
  createdAt: Date;
}

export interface AdBanner {
  id: string;
  imageUrl: string;
  linkUrl: string;
  advertiserName: string;
  expiresAt: Date;
}

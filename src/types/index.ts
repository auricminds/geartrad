export type UserType = 'buyer' | 'seller';
export type ListingType = 'account' | 'skin' | 'weapon' | 'bundle' | 'ticket';
export type BoostType = 'weekly' | 'monthly' | null;
export type AccountRank = 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond' | 'Master' | 'Grandmaster' | 'Challenger';

export interface PaymentMethods {
  vodafone?: string | null;
  orange?: string | null;
  instapay?: string | null;
  paypal?: string | null;
  usdt?: string | null;
  btc?: string | null;
  eth?: string | null;
}

export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  type: UserType;
  role?: 'user' | 'moderator' | 'admin';
  rating: number;
  totalSales: number;
  joinedAt: Date;
  isVerified: boolean;
  paymentMethods?: PaymentMethods;
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

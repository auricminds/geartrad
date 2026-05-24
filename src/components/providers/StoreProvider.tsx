'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { getWishlistIds, addToWishlist, removeFromWishlist, ensureProfile, getNotifications, markNotificationRead, markAllNotificationsRead, getMyRole } from '@/lib/api';
import { Listing, CartItem } from '@/types';

export interface Notification {
  id: string;
  type: 'sale' | 'message' | 'system';
  title: string;
  body: string;
  time: string;
  read: boolean;
}

interface StoreContextType {
  // Auth
  user: User | null;
  userRole: string;
  authLoading: boolean;
  signOut: () => Promise<void>;
  // Cart
  cartItems: CartItem[];
  addToCart: (listing: Listing) => void;
  removeFromCart: (listingId: string) => void;
  isInCart: (listingId: string) => boolean;
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  // Liked / Wishlist
  likedIds: string[];
  toggleLike: (listingId: string) => void;
  isLiked: (listingId: string) => boolean;
  // Notifications
  notifications: Notification[];
  notifOpen: boolean;
  setNotifOpen: (open: boolean) => void;
  markOneRead: (id: string) => void;
  markAllRead: () => void;
  unreadCount: number;
}

const StoreContext = createContext<StoreContextType | null>(null);

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  // ── Auth ───────────────────────────────────────────────────
  const [user, setUser]               = useState<User | null>(null);
  const [userRole, setUserRole]       = useState<string>('user');
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    // Restore cached user instantly so the navbar never flashes away on refresh
    try {
      const cached = sessionStorage.getItem('gt_user');
      if (cached) {
        setUser(JSON.parse(cached));
        setAuthLoading(false);
      }
    } catch {}

    // Safety timeout — if Supabase doesn't respond in 4s, stop the skeleton
    const timeout = setTimeout(() => setAuthLoading(false), 4000);

    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        clearTimeout(timeout);
        setUser(session?.user ?? null);
        setAuthLoading(false);
      })
      .catch(() => {
        clearTimeout(timeout);
        setAuthLoading(false);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  // Persist user to sessionStorage
  useEffect(() => {
    try {
      if (user) {
        sessionStorage.setItem('gt_user', JSON.stringify(user));
        // Ensure profile row exists (handles existing users from before DB was set up)
        const username    = user.user_metadata?.username ?? user.email?.split('@')[0] ?? 'user';
        const accountType = user.user_metadata?.account_type ?? 'buyer';
        ensureProfile(user.id, username, accountType).catch(() => {});
      } else {
        sessionStorage.removeItem('gt_user');
      }
    } catch {}
  }, [user]);

  // Fetch role when user changes
  useEffect(() => {
    if (!user) { setUserRole('user'); return; }
    getMyRole(user.id).then(setUserRole).catch(() => {});
  }, [user]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserRole('user');
    setLikedIds([]);
  };

  // ── Cart ────────────────────────────────────────────────────
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen]   = useState(false);

  const addToCart = (listing: Listing) => {
    if (cartItems.some((i) => i.listing.id === listing.id)) return;
    setCartItems((prev) => [...prev, { listing, addedAt: new Date() }]);
    setCartOpen(true);
    setNotifOpen(false);
  };
  const removeFromCart = (listingId: string) =>
    setCartItems((prev) => prev.filter((i) => i.listing.id !== listingId));
  const isInCart = (listingId: string) =>
    cartItems.some((i) => i.listing.id === listingId);

  // ── Wishlist (synced with Supabase when logged in) ─────────
  const [likedIds, setLikedIds] = useState<string[]>([]);

  // Load wishlist from Supabase when user signs in
  useEffect(() => {
    if (!user) { setLikedIds([]); return; }
    getWishlistIds(user.id)
      .then(setLikedIds)
      .catch(() => {});
  }, [user]);

  const toggleLike = useCallback((listingId: string) => {
    const isCurrentlyLiked = likedIds.includes(listingId);

    // Optimistic update
    setLikedIds((prev) =>
      isCurrentlyLiked ? prev.filter((id) => id !== listingId) : [...prev, listingId]
    );

    // Persist to Supabase if logged in
    if (user) {
      if (isCurrentlyLiked) {
        removeFromWishlist(user.id, listingId).catch(() => {
          // Revert on error
          setLikedIds((prev) => [...prev, listingId]);
        });
      } else {
        addToWishlist(user.id, listingId).catch(() => {
          // Revert on error
          setLikedIds((prev) => prev.filter((id) => id !== listingId));
        });
      }
    }
  }, [user, likedIds]);

  const isLiked = (listingId: string) => likedIds.includes(listingId);

  // ── Notifications ───────────────────────────────────────────
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notifOpen, setNotifOpen]         = useState(false);

  // Load from DB + subscribe to real-time inserts
  useEffect(() => {
    if (!user) { setNotifications([]); return; }
    getNotifications(user.id).then((rows) => {
      setNotifications(rows.map((r: { id: string; type: string; title: string; body: string; created_at: string; is_read: boolean }) => ({
        id: r.id,
        type: r.type as Notification['type'],
        title: r.title,
        body: r.body,
        time: r.created_at,
        read: r.is_read,
      })));
    }).catch(() => {});

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const r = payload.new as { id: string; type: string; title: string; body: string; created_at: string; is_read: boolean };
          setNotifications((prev) => [{
            id: r.id,
            type: r.type as Notification['type'],
            title: r.title,
            body: r.body,
            time: r.created_at,
            read: false,
          }, ...prev]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const markOneRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
    markNotificationRead(id).catch(() => {});
  };
  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    if (user) markAllNotificationsRead(user.id).catch(() => {});
  };
  const unreadCount  = notifications.filter((n) => !n.read).length;

  return (
    <StoreContext.Provider value={{
      user, userRole, authLoading, signOut,
      cartItems, addToCart, removeFromCart, isInCart, cartOpen, setCartOpen,
      likedIds, toggleLike, isLiked,
      notifications, notifOpen, setNotifOpen, markOneRead, markAllRead, unreadCount,
    }}>
      {children}
    </StoreContext.Provider>
  );
}

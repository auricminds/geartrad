'use client';

import { Suspense, useState, useRef, useEffect, useCallback } from 'react';
import { useLocale } from 'next-intl';
import { useSearchParams, useRouter } from 'next/navigation';
import { Send, Search, ArrowLeft, Star, Shield, MessageCircle, Lock, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { cn, formatPrice } from '@/lib/utils';
import { useStore } from '@/components/providers/StoreProvider';
import {
  getUserChats, findOrCreateChat, getChatMessages, sendMessage,
  markMessagesRead, getListing, ChatRow, pingModerator,
} from '@/lib/api';
import { supabase } from '@/lib/supabase';

interface LocalMessage {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

interface ConvDisplay {
  chatId: string;
  listingId: string;
  listingTitle: string;
  listingImage: string;
  listingPrice: number;
  listingGame: string;
  otherUserId: string;
  otherUsername: string;
  otherRating: number;
  otherVerified: boolean;
  lastMessage: string;
  lastTime: string;
  unread: number;
  messages: LocalMessage[];
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function ChatApp() {
  const locale      = useLocale();
  const router      = useRouter();
  const searchParams = useSearchParams();
  const { user, authLoading } = useStore();
  const isRTL = locale === 'ar';

  const [convs, setConvs]         = useState<ConvDisplay[]>([]);
  const [loading, setLoading]     = useState(true);
  const [activeId, setActiveId]   = useState<string | null>(null);
  const [input, setInput]         = useState('');
  const [sending, setSending]     = useState(false);
  const [search, setSearch]       = useState('');
  const [pinging, setPinging]     = useState(false);
  const bottomRef   = useRef<HTMLDivElement>(null);
  const inputRef    = useRef<HTMLInputElement>(null);
  const subRef      = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Load conversations
  const loadChats = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const rows: ChatRow[] = await getUserChats(user.id);
      const displays: ConvDisplay[] = await Promise.all(rows.map(async (row) => {
        const msgs = await getChatMessages(row.id);
        const isUserBuyer = row.buyer_id === user.id;
        const other = isUserBuyer ? row.seller : row.buyer;
        const lastMsg = msgs[msgs.length - 1];
        const unread  = msgs.filter((m) => !m.is_read && m.sender_id !== user.id).length;
        return {
          chatId: row.id,
          listingId: row.listing_id,
          listingTitle:  row.listing?.title ?? '',
          listingImage:  row.listing?.cover_image ?? '',
          listingPrice:  row.listing?.price ?? 0,
          listingGame:   row.listing?.game ?? '',
          otherUserId:   other?.id ?? '',
          otherUsername: other?.username ?? 'Unknown',
          otherRating:   Number(other?.rating) ?? 0,
          otherVerified: other?.is_verified ?? false,
          lastMessage:   lastMsg?.content ?? '',
          lastTime:      lastMsg ? timeAgo(lastMsg.created_at) : timeAgo(row.created_at),
          unread,
          messages:      msgs as LocalMessage[],
        };
      }));
      setConvs(displays);
    } catch {
      // Network error — show empty state
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) loadChats();
  }, [authLoading, loadChats]);

  // Handle ?listing= param — open or create chat
  useEffect(() => {
    if (!user || loading) return;
    const listingId = searchParams.get('listing');
    if (!listingId) {
      if (convs.length > 0 && typeof window !== 'undefined' && window.innerWidth >= 640) {
        setActiveId(convs[0].chatId);
      }
      return;
    }
    const existing = convs.find((c) => c.listingId === listingId);
    if (existing) { setActiveId(existing.chatId); return; }

    // Create new chat for this listing
    getListing(listingId).then(async (listing) => {
      if (!listing) return;
      const chatId = await findOrCreateChat(listingId, user.id, listing.seller.id);
      if (!chatId) return;
      const newConv: ConvDisplay = {
        chatId,
        listingId,
        listingTitle:  listing.title,
        listingImage:  listing.coverImage,
        listingPrice:  listing.price,
        listingGame:   listing.game,
        otherUserId:   listing.seller.id,
        otherUsername: listing.seller.username,
        otherRating:   listing.seller.rating,
        otherVerified: listing.seller.isVerified,
        lastMessage:   '',
        lastTime:      'Just now',
        unread:        0,
        messages:      [],
      };
      setConvs((prev) => [newConv, ...prev.filter((c) => c.chatId !== chatId)]);
      setActiveId(chatId);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading, searchParams]);

  // Subscribe to real-time messages for active chat
  useEffect(() => {
    if (subRef.current) { supabase.removeChannel(subRef.current); subRef.current = null; }
    if (!activeId || !user) return;

    // Mark existing as read
    markMessagesRead(activeId, user.id).catch(() => {});

    const channel = supabase
      .channel(`chat:${activeId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${activeId}` },
        (payload) => {
          const msg = payload.new as LocalMessage;
          setConvs((prev) => prev.map((c) => {
            if (c.chatId !== activeId) return c;
            const alreadyHas = c.messages.some((m) => m.id === msg.id);
            if (alreadyHas) return c;
            return {
              ...c,
              messages: [...c.messages, msg],
              lastMessage: msg.content,
              lastTime: 'Just now',
              unread: 0,
            };
          }));
        }
      )
      .subscribe();

    subRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [activeId, user]);

  // Scroll to bottom only when a new message is added to the active chat
  const activeMessageCount = convs.find((c) => c.chatId === activeId)?.messages.length ?? 0;
  useEffect(() => {
    if (activeMessageCount > 0) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMessageCount]);

  // Scroll to bottom when switching to a different chat
  useEffect(() => {
    if (activeId) {
      bottomRef.current?.scrollIntoView({ behavior: 'instant' });
    }
  }, [activeId]);

  const sendMsg = useCallback(async () => {
    const text = input.trim();
    if (!text || !activeId || !user || sending) return;

    setSending(true);
    setInput('');

    try {
      const ok = await sendMessage(activeId, user.id, text);
      // Do NOT add the message to state here — the realtime subscription
      // is the single source of truth and will add it when the INSERT fires.
      if (!ok) {
        setInput(text);
      }
    } catch {
      setInput(text);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }, [input, activeId, user, sending]);

  // ── Not logged in ──────────────────────────────────────────
  if (!authLoading && !user) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-surface border border-border flex items-center justify-center mx-auto mb-4">
          <Lock className="w-7 h-7 text-muted/30" />
        </div>
        <p className="text-white font-semibold text-lg mb-2">
          {isRTL ? 'سجّل دخولك للوصول للرسائل' : 'Sign in to access messages'}
        </p>
        <p className="text-muted text-sm mb-6">
          {isRTL ? 'تحدث مع البائعين بشكل مباشر وآمن' : 'Chat directly and securely with sellers'}
        </p>
        <Link
          href={`/${locale}/auth/sign-in`}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-purple hover:bg-purple-light text-white font-semibold transition-all"
        >
          {isRTL ? 'تسجيل الدخول' : 'Sign In'}
        </Link>
      </div>
    );
  }

  const active = convs.find((c) => c.chatId === activeId) ?? null;
  const filtered = search.trim()
    ? convs.filter((c) =>
        c.otherUsername.toLowerCase().includes(search.toLowerCase()) ||
        c.listingTitle.toLowerCase().includes(search.toLowerCase()) ||
        c.lastMessage.toLowerCase().includes(search.toLowerCase())
      )
    : convs;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex items-center gap-3 mb-5">
        <Link href={`/${locale}`} className="flex items-center gap-1.5 text-muted hover:text-white transition-colors text-sm">
          <ArrowLeft className={cn('w-4 h-4', isRTL && 'rotate-180')} />
          {locale === 'ar' ? 'الرئيسية' : 'Home'}
        </Link>
        <span className="text-border/60">·</span>
        <h1 className="text-lg font-bold text-white">{locale === 'ar' ? 'الرسائل' : 'Messages'}</h1>
      </div>

      <div className="bg-surface border border-border rounded-2xl overflow-hidden flex h-[calc(100dvh-292px)] md:h-[calc(100dvh-236px)] min-h-[400px]">
        {/* Sidebar */}
        <div className={cn(
          'flex flex-col shrink-0 border-border bg-surface',
          isRTL ? 'border-l' : 'border-r',
          'w-full sm:w-72 lg:w-80',
          active ? 'hidden sm:flex' : 'flex',
        )}>
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={locale === 'ar' ? 'بحث...' : 'Search...'}
                className="w-full bg-background border border-border rounded-xl ps-9 pe-4 py-2 text-sm text-white placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-purple/40 transition-all"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="space-y-0">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-3 px-4 py-3 border-b border-border/40 animate-pulse">
                    <div className="w-9 h-9 rounded-xl bg-white/5 shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 bg-white/5 rounded-full w-2/3" />
                      <div className="h-2 bg-white/5 rounded-full w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6">
                <MessageCircle className="w-10 h-10 text-muted/20" />
                <p className="text-muted text-sm">
                  {locale === 'ar' ? 'لا توجد محادثات' : 'No conversations yet'}
                </p>
              </div>
            ) : (
              filtered.map((c) => (
                <button
                  key={c.chatId}
                  type="button"
                  onClick={() => setActiveId(c.chatId)}
                  className={cn(
                    'w-full flex items-start gap-3 px-4 py-3 transition-colors border-b border-border/40 text-start',
                    c.chatId === activeId ? 'bg-purple/10 border-s-2 border-s-purple' : 'hover:bg-white/5'
                  )}
                >
                  <div className="w-9 h-9 rounded-xl bg-purple/20 flex items-center justify-center text-sm font-bold text-purple shrink-0">
                    {c.otherUsername.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <p className="text-sm font-semibold text-white truncate">{c.otherUsername}</p>
                      <span className="text-[10px] text-muted/60 shrink-0">{c.lastTime}</span>
                    </div>
                    <p className="text-xs text-muted truncate">{c.listingTitle}</p>
                    <p className="text-xs text-muted/60 truncate mt-0.5">{c.lastMessage}</p>
                  </div>
                  {c.unread > 0 && (
                    <span className="w-5 h-5 rounded-full bg-purple flex items-center justify-center text-[10px] text-white font-bold shrink-0 mt-0.5">
                      {c.unread}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat panel */}
        {active ? (
          <div className="flex-1 flex flex-col min-w-0">
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-surface shrink-0">
              <button
                type="button"
                className="sm:hidden p-1.5 rounded-lg text-muted hover:text-white hover:bg-white/5 transition-colors"
                onClick={() => setActiveId(null)}
              >
                <ArrowLeft className={cn('w-4 h-4', isRTL && 'rotate-180')} />
              </button>

              <Link href={`/${locale}/listing/${active.listingId}`} className="w-10 h-10 rounded-xl overflow-hidden shrink-0 block">
                <img src={active.listingImage} alt="" className="w-full h-full object-cover" />
              </Link>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold text-white">{active.otherUsername}</span>
                  {active.otherVerified && <Shield className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                </div>
                <p className="text-xs text-muted truncate">{active.listingTitle}</p>
              </div>

              <div className="shrink-0 text-end flex flex-col items-end gap-1">
                <p className="text-sm font-bold text-white">{formatPrice(active.listingPrice, locale)}</p>
                <div className="flex items-center gap-0.5 justify-end">
                  <Star className="w-3 h-3 fill-gold text-gold" />
                  <span className="text-xs text-muted">{active.otherRating}</span>
                </div>
                <button
                  type="button"
                  disabled={pinging}
                  onClick={async () => {
                    if (!user || pinging) return;
                    setPinging(true);
                    const username = user.user_metadata?.username ?? 'User';
                    await pingModerator(active.chatId, user.id, username);
                    setPinging(false);
                    alert(locale === 'ar' ? 'تم تنبيه المشرف، سيتواصل معك قريباً' : 'Moderator has been notified. They will join shortly.');
                  }}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-[10px] font-medium transition-all disabled:opacity-50"
                >
                  <ShieldAlert className="w-3 h-3" />
                  {pinging ? '…' : (locale === 'ar' ? 'استدعاء مشرف' : 'Ping Mod')}
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-5 space-y-3 bg-background/30">
              {active.messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center gap-3 text-center">
                  <MessageCircle className="w-10 h-10 text-muted/20" />
                  <p className="text-muted text-sm">
                    {locale === 'ar' ? 'ابدأ المحادثة مع البائع' : 'Start the conversation with the seller'}
                  </p>
                </div>
              ) : (
                active.messages.map((msg) => {
                  const isMe = msg.sender_id === user?.id;
                  return (
                    <div key={msg.id} className={cn('flex', isMe ? 'justify-end' : 'justify-start')}>
                      <div className={cn(
                        'max-w-[72%] sm:max-w-[60%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed',
                        isMe ? 'bg-purple text-white rounded-br-none' : 'bg-surface border border-border text-white rounded-bl-none'
                      )}>
                        <p className="break-words">{msg.content}</p>
                        <p className={cn('text-[10px] mt-1.5 select-none', isMe ? 'text-white/50 text-end' : 'text-muted/60')}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t border-border bg-surface shrink-0">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); } }}
                  placeholder={locale === 'ar' ? 'اكتب رسالتك...' : 'Type your message...'}
                  maxLength={500}
                  className="flex-1 bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-purple/40 focus:border-purple transition-all"
                />
                <button
                  type="button"
                  onClick={sendMsg}
                  disabled={!input.trim() || sending}
                  className="w-10 h-10 rounded-xl bg-purple hover:bg-purple-light disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-white transition-all shrink-0"
                >
                  <Send className={cn('w-4 h-4', isRTL && 'rotate-180')} />
                </button>
              </div>
              <p className="text-[10px] text-muted/40 mt-1.5 text-center">
                {locale === 'ar' ? 'نصوص فقط — لا صور أو روابط مشبوهة' : 'Text only — no images or suspicious links'}
              </p>
            </div>
          </div>
        ) : (
          <div className="hidden sm:flex flex-1 flex-col items-center justify-center gap-4 text-center px-8">
            <div className="w-16 h-16 rounded-2xl bg-background border border-border flex items-center justify-center">
              <MessageCircle className="w-7 h-7 text-muted/30" />
            </div>
            <div>
              <p className="text-white font-semibold mb-1">{locale === 'ar' ? 'اختر محادثة' : 'Select a conversation'}</p>
              <p className="text-muted text-sm">{locale === 'ar' ? 'اختر من القائمة على اليسار للبدء' : 'Pick one from the list to start'}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-96 text-muted text-sm">Loading...</div>}>
      <ChatApp />
    </Suspense>
  );
}

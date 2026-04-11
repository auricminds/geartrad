'use client';

import { useEffect, useState, useRef } from 'react';
import { useLocale } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Send, Shield, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useStore } from '@/components/providers/StoreProvider';
import { getTicketMessages, sendTicketMessage, updateTicketStatus, getMyRole, joinChatAsModerator } from '@/lib/api';
import { supabase } from '@/lib/supabase';

type TicketMsg = {
  id: string; sender_id: string; content: string; created_at: string;
  sender: { id: string; username: string; role: string } | null;
};

export default function TicketDetailPage() {
  const locale = useLocale();
  const router = useRouter();
  const params = useParams();
  const ticketId = params.id as string;
  const { user, authLoading } = useStore();

  const [role, setRole] = useState<string | null>(null);
  const [messages, setMessages] = useState<TicketMsg[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [chatId, setChatId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const subRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!user) return;
    getMyRole(user.id).then(setRole);
  }, [user]);

  useEffect(() => {
    if (!ticketId) return;
    // Fetch ticket info to get chat_id
    supabase.from('support_tickets').select('chat_id, status').eq('id', ticketId).single()
      .then(({ data }) => { if (data?.chat_id) setChatId(data.chat_id); });

    getTicketMessages(ticketId).then((msgs) => {
      setMessages(msgs as TicketMsg[]);
    }).finally(() => setLoading(false));
  }, [ticketId]);

  // Real-time subscription
  useEffect(() => {
    if (!ticketId) return;
    if (subRef.current) { supabase.removeChannel(subRef.current); }
    const ch = supabase.channel(`ticket:${ticketId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ticket_messages', filter: `ticket_id=eq.${ticketId}` },
        (payload) => {
          const msg = payload.new as TicketMsg;
          setMessages((prev) => prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]);
        }
      ).subscribe();
    subRef.current = ch;
    return () => { supabase.removeChannel(ch); };
  }, [ticketId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMsg = async () => {
    const text = input.trim();
    if (!text || !user || sending) return;
    setSending(true);
    setInput('');
    await sendTicketMessage(ticketId, user.id, text);
    setSending(false);
  };

  const handleJoinChat = async () => {
    if (!chatId || !user) return;
    await joinChatAsModerator(chatId, user.id);
    router.push(`/${locale}/chat?listing=mod`);
  };

  if (authLoading || role === null) return null;
  if (!user) return <div className="p-8 text-muted text-center">Sign in required.</div>;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <Link href={`/${locale}/mod`} className="inline-flex items-center gap-1.5 text-muted hover:text-white transition-colors text-sm mb-8">
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <Shield className="w-5 h-5 text-purple" />
        <h1 className="text-xl font-bold text-white">Support Ticket</h1>
        {chatId && (role === 'moderator' || role === 'admin') && (
          <button onClick={handleJoinChat}
            className="ms-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple/20 text-purple text-xs font-medium hover:bg-purple/30 transition-all">
            <ExternalLink className="w-3.5 h-3.5" />
            Join Chat
          </button>
        )}
      </div>

      <div className="bg-surface border border-border rounded-2xl overflow-hidden flex flex-col" style={{ height: '60vh' }}>
        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-3 bg-background/30">
          {loading ? (
            <div className="text-center text-muted text-sm py-8">Loading…</div>
          ) : messages.length === 0 ? (
            <div className="text-center text-muted text-sm py-8">No messages yet. Describe your issue below.</div>
          ) : messages.map((msg) => {
            const isMe = msg.sender_id === user.id;
            const isMod = msg.sender?.role === 'moderator' || msg.sender?.role === 'admin';
            return (
              <div key={msg.id} className={cn('flex', isMe ? 'justify-end' : 'justify-start')}>
                <div className={cn(
                  'max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed',
                  isMe ? 'bg-purple text-white rounded-br-none' : 'bg-surface border border-border text-white rounded-bl-none'
                )}>
                  {!isMe && (
                    <p className={cn('text-[10px] font-semibold mb-1', isMod ? 'text-purple' : 'text-muted')}>
                      {msg.sender?.username ?? 'Unknown'}{isMod ? ' · Moderator' : ''}
                    </p>
                  )}
                  <p className="break-words">{msg.content}</p>
                  <p className={cn('text-[10px] mt-1 select-none', isMe ? 'text-white/50 text-end' : 'text-muted/60')}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-border bg-surface shrink-0">
          <div className="flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); } }}
              placeholder="Type your message…"
              maxLength={1000}
              className="flex-1 bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-purple/40 focus:border-purple transition-all"
            />
            <button type="button" onClick={sendMsg} disabled={!input.trim() || sending}
              className="w-10 h-10 rounded-xl bg-purple hover:bg-purple-light disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-white transition-all shrink-0">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

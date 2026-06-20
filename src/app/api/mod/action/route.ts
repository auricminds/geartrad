import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSessionUserId } from '@/lib/auth-server';

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// Verify the requester is actually a mod/admin
async function verifyMod(userId: string): Promise<string | null> {
  const db = getServiceClient();
  const { data } = await db.from('profiles').select('role').eq('id', userId).single();
  return data?.role ?? null;
}

export async function POST(req: NextRequest) {
  const requesterId = await getSessionUserId(req);
  if (!requesterId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { type } = body;

  const requesterRole = await verifyMod(requesterId);
  if (requesterRole !== 'moderator' && requesterRole !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const db = getServiceClient();

  // ── Ban / Unban ──────────────────────────────────────────────
  if (type === 'ban') {
    const { userId, banned } = body;
    const { error } = await db.from('profiles')
      .update({ is_banned: banned, banned_until: null })
      .eq('id', userId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  // ── Timeout ──────────────────────────────────────────────────
  if (type === 'timeout') {
    const { userId, hours } = body;
    const bannedUntil = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
    const { error } = await db.from('profiles')
      .update({ is_banned: true, banned_until: bannedUntil })
      .eq('id', userId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  // ── Role change — admin only ─────────────────────────────────
  if (type === 'role') {
    if (requesterRole !== 'admin') {
      return NextResponse.json({ error: 'Only admins can change roles' }, { status: 403 });
    }
    const { userId, role } = body;
    if (!['user', 'moderator', 'admin'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }
    const { error } = await db.from('profiles').update({ role }).eq('id', userId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  // ── Cancel order ─────────────────────────────────────────────
  if (type === 'cancel-order') {
    const { orderId, listingId } = body;
    const { error: e1 } = await db.from('orders')
      .update({ status: 'cancelled', payment_status: 'cancelled' })
      .eq('id', orderId);
    if (e1) return NextResponse.json({ error: e1.message }, { status: 500 });
    if (listingId) {
      await db.from('listings').update({ is_available: true }).eq('id', listingId);
    }
    return NextResponse.json({ success: true });
  }

  // ── Resolve order ────────────────────────────────────────────
  if (type === 'resolve-order') {
    const { orderId, resolution } = body; // resolution: 'complete' | 'refund' | 'dispute'
    const update = resolution === 'complete'
      ? { status: 'completed', payment_status: 'paid' }
      : resolution === 'dispute'
        ? { status: 'disputed' }
        : { status: 'refunded', payment_status: 'refunded' };
    const { error } = await db.from('orders').update(update).eq('id', orderId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  // ── Take down listing ────────────────────────────────────────
  if (type === 'takedown-listing') {
    const { listingId } = body;
    const { error } = await db.from('listings').update({ is_available: false }).eq('id', listingId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  // ── Update ticket status ─────────────────────────────────────
  if (type === 'ticket-status') {
    const { ticketId, status } = body;
    const { error } = await db.from('support_tickets')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', ticketId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  // ── Review verification ──────────────────────────────────────
  if (type === 'review-verification') {
    const { verifId, status, notes } = body;
    const { error } = await db.from('seller_verifications')
      .update({ status, reviewed_by: requesterId, reviewed_at: new Date().toISOString(), notes: notes ?? null })
      .eq('id', verifId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  // ── Confirm email — admin only ───────────────────────────────
  if (type === 'confirm-email') {
    if (requesterRole !== 'admin') {
      return NextResponse.json({ error: 'Only admins can force-confirm emails' }, { status: 403 });
    }
    const { userId } = body;
    const { error } = await db.auth.admin.updateUserById(userId, { email_confirm: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  // ── Delete user — admin only ─────────────────────────────────
  if (type === 'delete-user') {
    if (requesterRole !== 'admin') {
      return NextResponse.json({ error: 'Only admins can delete users' }, { status: 403 });
    }
    const { userId } = body;
    if (!userId || userId === requesterId) {
      return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 });
    }
    // Delete from Supabase Auth (cascades to profile via FK if set, otherwise clean up manually)
    const { error: authErr } = await db.auth.admin.deleteUser(userId);
    if (authErr) return NextResponse.json({ error: authErr.message }, { status: 500 });
    // Ensure profile row is removed even without cascade
    await db.from('profiles').delete().eq('id', userId);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Unknown action type' }, { status: 400 });
}

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

// Fire-and-forget audit log — never lets a logging failure block the action.
function logModAction(
  db: ReturnType<typeof getServiceClient>,
  actorId: string,
  actionType: string,
  targetId: string | null,
  metadata?: Record<string, unknown>,
) {
  void db.from('mod_audit_log').insert({
    actor_id:    actorId,
    action_type: actionType,
    target_id:   targetId ?? null,
    metadata:    metadata ?? null,
  });
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
    logModAction(db, requesterId, 'ban', userId, { banned });
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
    logModAction(db, requesterId, 'timeout', userId, { hours, banned_until: bannedUntil });
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
    logModAction(db, requesterId, 'role_change', userId, { new_role: role });
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
    logModAction(db, requesterId, 'cancel_order', orderId, { listing_id: listingId });
    return NextResponse.json({ success: true });
  }

  // ── Resolve order ────────────────────────────────────────────
  if (type === 'resolve-order') {
    const { orderId, resolution } = body;
    const update = resolution === 'complete'
      ? { status: 'completed', payment_status: 'paid' }
      : resolution === 'dispute'
        ? { status: 'disputed' }
        : { status: 'refunded', payment_status: 'refunded' };
    const { error } = await db.from('orders').update(update).eq('id', orderId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    logModAction(db, requesterId, 'resolve_order', orderId, { resolution });
    return NextResponse.json({ success: true });
  }

  // ── Take down listing ────────────────────────────────────────
  if (type === 'takedown-listing') {
    const { listingId } = body;
    const { error } = await db.from('listings').update({ is_available: false }).eq('id', listingId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    logModAction(db, requesterId, 'takedown_listing', listingId);
    return NextResponse.json({ success: true });
  }

  // ── Update ticket status ─────────────────────────────────────
  if (type === 'ticket-status') {
    const { ticketId, status } = body;
    const { error } = await db.from('support_tickets')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', ticketId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    logModAction(db, requesterId, 'ticket_status', ticketId, { status });
    return NextResponse.json({ success: true });
  }

  // ── Review verification ──────────────────────────────────────
  if (type === 'review-verification') {
    const { verifId, status, notes } = body;
    const { error } = await db.from('seller_verifications')
      .update({ status, reviewed_by: requesterId, reviewed_at: new Date().toISOString(), notes: notes ?? null })
      .eq('id', verifId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    logModAction(db, requesterId, 'review_verification', verifId, { status, notes });
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
    logModAction(db, requesterId, 'confirm_email', userId);
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
    const { error: authErr } = await db.auth.admin.deleteUser(userId);
    if (authErr) return NextResponse.json({ error: authErr.message }, { status: 500 });
    await db.from('profiles').delete().eq('id', userId);
    logModAction(db, requesterId, 'delete_user', userId);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Unknown action type' }, { status: 400 });
}

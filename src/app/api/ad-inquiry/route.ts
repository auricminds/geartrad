import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { emailAdInquiry } from '@/lib/email';

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      name?: string;
      company?: string;
      email?: string;
      phone?: string;
      message?: string;
    };

    const { name, company, email, phone, message } = body;

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return NextResponse.json({ error: 'Name, email and message are required' }, { status: 400 });
    }

    const admin = getAdmin();

    // Save to DB
    const { error } = await admin.from('ad_inquiries').insert({
      name: name.trim(),
      company: company?.trim() || null,
      email: email.trim(),
      phone: phone?.trim() || null,
      message: message.trim(),
    });

    if (error) {
      console.error('[ad-inquiry] DB insert error:', error);
      return NextResponse.json({ error: 'Failed to save inquiry' }, { status: 500 });
    }

    // Send email notification to admin
    await emailAdInquiry({ name: name.trim(), company: company?.trim() || null, email: email.trim(), phone: phone?.trim() || null, message: message.trim() });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[ad-inquiry]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

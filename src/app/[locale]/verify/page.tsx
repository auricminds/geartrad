'use client';

import { useState, useRef } from 'react';
import { useLocale } from 'next-intl';
import { Shield, Upload, X, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useStore } from '@/components/providers/StoreProvider';
import { submitVerification, getMyVerification } from '@/lib/api';
import { useEffect } from 'react';

const inputCls = 'w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-purple/40 focus:border-purple transition-all';

type VerifStatus = { status: 'pending' | 'approved' | 'rejected'; notes: string | null } | null;

export default function VerifyPage() {
  const locale = useLocale();
  const { user, authLoading } = useStore();
  const isRTL = locale === 'ar';

  const [idFile, setIdFile]           = useState<File | null>(null);
  const [selfieFile, setSelfieFile]   = useState<File | null>(null);
  const [idPreview, setIdPreview]     = useState('');
  const [selfiePreview, setSelfiePreview] = useState('');
  const [loading, setLoading]         = useState(false);
  const [submitted, setSubmitted]     = useState(false);
  const [error, setError]             = useState('');
  const [existing, setExisting]       = useState<VerifStatus>(null);
  const [checkingExisting, setCheckingExisting] = useState(true);

  const idRef     = useRef<HTMLInputElement>(null);
  const selfieRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) { setCheckingExisting(false); return; }
    getMyVerification(user.id).then((data) => {
      if (data) setExisting({ status: data.status, notes: data.notes });
    }).catch(() => {}).finally(() => setCheckingExisting(false));
  }, [user]);

  if (authLoading || checkingExisting) return null;

  if (!user) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <p className="text-white font-semibold text-lg mb-4">
          {isRTL ? 'يجب تسجيل الدخول للتحقق من الهوية' : 'Sign in to submit verification'}
        </p>
        <Link href={`/${locale}/auth/sign-in`} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-purple hover:bg-purple-light text-white font-semibold transition-all">
          {isRTL ? 'تسجيل الدخول' : 'Sign In'}
        </Link>
      </div>
    );
  }

  if (existing) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        {existing.status === 'pending' && (
          <>
            <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-5">
              <Clock className="w-8 h-8 text-amber-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-3">Verification Pending</h1>
            <p className="text-muted text-sm">Your verification is under review. We'll notify you within 24–48 hours.</p>
          </>
        )}
        {existing.status === 'approved' && (
          <>
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="w-8 h-8 text-emerald-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-3">You're Verified!</h1>
            <p className="text-muted text-sm">Your identity has been verified. The verified badge is now on your profile.</p>
          </>
        )}
        {existing.status === 'rejected' && (
          <>
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-5">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-3">Verification Rejected</h1>
            {existing.notes && <p className="text-muted text-sm mb-4">Reason: {existing.notes}</p>}
            <p className="text-muted text-sm">Please resubmit with clearer images.</p>
          </>
        )}
        <Link href={`/${locale}`} className="inline-flex items-center gap-2 px-5 py-2.5 mt-6 rounded-xl bg-surface border border-border text-white text-sm hover:bg-surface-light transition-all">
          Back to Home
        </Link>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-5">
          <CheckCircle className="w-8 h-8 text-emerald-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-3">Submitted!</h1>
        <p className="text-muted text-sm">Your verification documents have been submitted. We'll review them within 24–48 hours and notify you.</p>
        <Link href={`/${locale}`} className="inline-flex items-center gap-2 px-5 py-2.5 mt-6 rounded-xl bg-purple hover:bg-purple-light text-white text-sm font-medium transition-all">
          Back to Home
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idFile || !selfieFile) {
      setError('Please upload both your ID and selfie.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const ok = await submitVerification(user.id, idFile, selfieFile);
      if (ok) {
        setSubmitted(true);
      } else {
        setError('Failed to submit. Please try again.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const ImageUploadBox = ({
    file, preview, inputRef, label, hint, onChange, onClear,
  }: {
    file: File | null;
    preview: string;
    inputRef: React.RefObject<HTMLInputElement | null>;
    label: string;
    hint: string;
    onChange: (f: File) => void;
    onClear: () => void;
  }) => (
    <div>
      <p className="text-xs text-muted mb-1.5">{label}</p>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onChange(f); }} />
      {preview ? (
        <div className="relative w-full h-44 rounded-xl overflow-hidden border border-border">
          <img src={preview} alt="" className="w-full h-full object-cover" />
          <button type="button" onClick={onClear}
            className="absolute top-2 end-2 w-7 h-7 rounded-full bg-black/70 flex items-center justify-center text-white hover:bg-black transition-all">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => inputRef.current?.click()}
          className="w-full h-44 rounded-xl border-2 border-dashed border-border hover:border-purple/50 hover:bg-purple/5 flex flex-col items-center justify-center gap-2 text-muted hover:text-white transition-all">
          <Upload className="w-6 h-6" />
          <span className="text-sm font-medium">{label}</span>
          <span className="text-xs text-muted/50">{hint}</span>
        </button>
      )}
    </div>
  );

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-10">
      <Link href={`/${locale}/profile`} className="inline-flex items-center gap-1.5 text-muted hover:text-white transition-colors text-sm mb-8">
        ← Back
      </Link>

      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
          <Shield className="w-5 h-5 text-emerald-400" />
        </div>
        <h1 className="text-2xl font-bold text-white">Identity Verification</h1>
      </div>
      <p className="text-muted text-sm mb-8 leading-relaxed">
        Verify your identity to get a Verified badge on your profile. This builds trust with buyers and sellers.
        Your documents are stored securely and reviewed only by GearTrad moderators.
      </p>

      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 mb-8 text-sm text-amber-200/80 leading-relaxed">
        <p className="font-semibold text-amber-300 mb-1">Requirements:</p>
        <ul className="space-y-1 list-disc list-inside">
          <li>A clear photo of your government-issued ID (national ID or passport)</li>
          <li>A selfie of you <strong>holding</strong> the ID next to your face</li>
          <li>Both images must be clear, unblurred, and unedited</li>
        </ul>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 mb-5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <ImageUploadBox
          file={idFile}
          preview={idPreview}
          inputRef={idRef}
          label="Government ID (National ID or Passport)"
          hint="JPG, PNG, WEBP — max 5MB"
          onChange={(f) => { setIdFile(f); setIdPreview(URL.createObjectURL(f)); }}
          onClear={() => { setIdFile(null); setIdPreview(''); if (idRef.current) idRef.current.value = ''; }}
        />
        <ImageUploadBox
          file={selfieFile}
          preview={selfiePreview}
          inputRef={selfieRef}
          label="Selfie holding your ID"
          hint="Your face and ID must both be visible"
          onChange={(f) => { setSelfieFile(f); setSelfiePreview(URL.createObjectURL(f)); }}
          onClear={() => { setSelfieFile(null); setSelfiePreview(''); if (selfieRef.current) selfieRef.current.value = ''; }}
        />

        <button
          type="submit"
          disabled={!idFile || !selfieFile || loading}
          className={cn(
            'w-full py-3 rounded-xl font-semibold text-white transition-all',
            loading || !idFile || !selfieFile
              ? 'bg-purple/40 cursor-not-allowed'
              : 'bg-purple hover:bg-purple-light shadow-lg shadow-purple/25'
          )}
        >
          {loading ? 'Submitting…' : 'Submit for Verification'}
        </button>
      </form>
    </div>
  );
}

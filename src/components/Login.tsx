import { useState, useRef, useEffect, FormEvent, KeyboardEvent, ClipboardEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { usernameToEmail } from '../lib/username';

const PIN_LENGTH = 6;

function WalletDoodle() {
  return (
    <svg viewBox="0 0 200 170" className="mx-auto h-36 w-auto text-slate-800" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M25 60 h120 a14 14 0 0 1 14 14 v55 a14 14 0 0 1 -14 14 H25 a14 14 0 0 1 -14 -14 V74 a14 14 0 0 1 14 -14 Z" />
      <path d="M11 78 h150" />
      <circle cx="140" cy="100" r="11" />
      <circle cx="140" cy="100" r="3" fill="currentColor" stroke="none" />
      <path d="M55 60 V40 a20 20 0 0 1 20 -20 h55" strokeDasharray="1 8" opacity="0.5" />
      <circle cx="152" cy="24" r="16" />
      <path d="M144 24 h16 M152 16 v16" opacity="0.7" />
      <path d="M6 145 c30 10 130 10 165 0" opacity="0.35" />
    </svg>
  );
}

export default function Login() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [username, setUsername] = useState('');
  const [digits, setDigits] = useState<string[]>(Array(PIN_LENGTH).fill(''));
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const boxRefs = useRef<(HTMLInputElement | null)[]>([]);

  const setDigit = (i: number, value: string) => {
    const clean = value.replace(/\D/g, '').slice(-1);
    setDigits(prev => {
      const next = [...prev];
      next[i] = clean;
      return next;
    });
    if (clean && i < PIN_LENGTH - 1) boxRefs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      boxRefs.current[i - 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, PIN_LENGTH);
    if (!text) return;
    e.preventDefault();
    setDigits(Array.from({ length: PIN_LENGTH }, (_, i) => text[i] ?? ''));
    boxRefs.current[Math.min(text.length, PIN_LENGTH - 1)]?.focus();
  };

  const toggleMode = () => {
    setMode(m => (m === 'signin' ? 'signup' : 'signin'));
    setError(null);
  };

  useEffect(() => {
    const prevBody = document.body.style.background;
    const prevHtml = document.documentElement.style.background;
    document.body.style.background = '#f0fdfa';
    document.documentElement.style.background = '#f0fdfa';
    return () => {
      document.body.style.background = prevBody;
      document.documentElement.style.background = prevHtml;
    };
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const pin = digits.join('');
    if (!username.trim()) {
      setError('Enter a username');
      return;
    }
    if (pin.length < PIN_LENGTH) {
      setError('Enter all 6 digits of your PIN');
      return;
    }
    setSubmitting(true);
    const email = usernameToEmail(username);
    const message = mode === 'signin' ? await signIn(email, pin) : await signUp(email, pin);
    setSubmitting(false);
    if (message) setError(message);
  };

  return (
    <div className="min-h-screen bg-teal-50 px-6 py-8">
      <div className="mx-auto max-w-sm">
        <div className="mt-6 mb-4">
          <WalletDoodle />
        </div>

        <h1 className="text-center text-2xl font-extrabold tracking-wide text-slate-900">
          {mode === 'signin' ? 'LOGIN' : 'SIGN UP'}
        </h1>
        <p className="mt-2 text-center text-sm text-slate-500">
          {mode === 'signin' ? 'Sign in with your username.' : 'Choose a username and PIN.'}
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <input
            type="text"
            required
            autoCapitalize="none"
            autoCorrect="off"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-full border border-slate-300 bg-white px-5 py-3.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-teal-700"
          />

          <div>
            <div className="flex justify-between gap-2">
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => { boxRefs.current[i] = el; }}
                  type="password"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={(e) => setDigit(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  onPaste={handlePaste}
                  className="h-14 w-full rounded-2xl border border-slate-300 bg-white text-center text-lg text-slate-900 outline-none focus:border-teal-700"
                />
              ))}
            </div>
            <p className="mt-2 text-xs text-slate-400">PIN — 6 digits</p>
          </div>

          {error && <p className="text-center text-xs text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-teal-800 py-3.5 text-sm font-semibold text-white hover:bg-teal-900 disabled:opacity-60"
          >
            {submitting ? 'Please wait…' : 'Next'}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-slate-500">
          {mode === 'signin' ? (
            <>New here? <button onClick={toggleMode} className="font-medium text-teal-800">Create an account.</button></>
          ) : (
            <>Already have an account? <button onClick={toggleMode} className="font-medium text-teal-800">Sign in.</button></>
          )}
        </p>
      </div>
    </div>
  );
}

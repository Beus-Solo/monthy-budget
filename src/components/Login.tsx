import { useState, FormEvent } from 'react';
import { Wallet } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setSubmitting(true);
    const message = mode === 'signin'
      ? await signIn(email, password)
      : await signUp(email, password);
    setSubmitting(false);
    if (message) {
      setError(message);
    } else if (mode === 'signup') {
      setInfo('Check your email to confirm your account, then sign in.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-orange-50 via-rose-50/40 to-white px-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
            <Wallet className="h-4.5 w-4.5" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-slate-900">Budget</span>
        </div>

        <div className="mb-5 flex gap-1 rounded-full bg-slate-100 p-1 text-sm font-medium">
          <button
            type="button"
            onClick={() => { setMode('signin'); setError(null); setInfo(null); }}
            className={`flex-1 rounded-full py-1.5 transition-colors ${mode === 'signin' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setError(null); setInfo(null); }}
            className={`flex-1 rounded-full py-1.5 transition-colors ${mode === 'signup' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
          >
            Sign up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-2.5">
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
          />

          {error && <p className="text-xs text-red-600">{error}</p>}
          {info && <p className="text-xs text-emerald-600">{info}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-slate-900 py-3 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {submitting ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  );
}

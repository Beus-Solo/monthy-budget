import { useState, FormEvent } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usernameToEmail } from '../lib/username';

type Stage = 'landing' | 'signin' | 'signup';

function Ripples() {
  return (
    <svg viewBox="0 0 200 200" className="pointer-events-none absolute -right-8 -top-8 h-56 w-56 text-white/15" fill="none">
      <circle cx="100" cy="100" r="90" stroke="currentColor" strokeWidth="2" />
      <circle cx="100" cy="100" r="65" stroke="currentColor" strokeWidth="2" />
      <circle cx="100" cy="100" r="40" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export default function Login() {
  const { signIn, signUp } = useAuth();
  const [stage, setStage] = useState<Stage>('landing');
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const goTo = (s: Stage) => {
    setStage(s);
    setError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!username.trim()) {
      setError('Enter a username');
      return;
    }
    setSubmitting(true);
    const email = usernameToEmail(username);
    const message = stage === 'signin'
      ? await signIn(email, pin)
      : await signUp(email, pin);
    setSubmitting(false);
    if (message) setError(message);
  };

  const headerTitle = stage === 'signin' ? 'Welcome\nBack' : stage === 'signup' ? 'Create\nAccount' : 'Hello,\nBudget';

  return (
    <div className="min-h-screen bg-cyan-50/60">
      <div className="relative z-0 overflow-hidden rounded-b-[2.5rem] bg-gradient-to-br from-teal-600 to-cyan-800 px-6 pb-14 pt-10 text-white">
        <Ripples />
        {stage !== 'landing' && (
          <button
            onClick={() => goTo('landing')}
            aria-label="Back"
            className="mb-6 flex h-9 w-9 items-center justify-center rounded-full bg-white/15 hover:bg-white/25"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}
        <h1 className="whitespace-pre-line text-4xl font-bold leading-tight">{headerTitle}</h1>
      </div>

      <div className="relative z-10 mx-auto -mt-8 w-full max-w-sm px-6 pb-10">
        {stage === 'landing' ? (
          <div className="space-y-3 rounded-3xl bg-white p-5 shadow-lg shadow-teal-900/5">
            <p className="px-1 pb-1 text-sm text-slate-500">Keep track of what you owe, together.</p>
            <button
              onClick={() => goTo('signin')}
              className="w-full rounded-full bg-teal-700 py-3 text-sm font-semibold text-white hover:bg-teal-800"
            >
              Sign in
            </button>
            <button
              onClick={() => goTo('signup')}
              className="w-full rounded-full bg-teal-50 py-3 text-sm font-semibold text-teal-800 hover:bg-teal-100"
            >
              Create account
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3 rounded-3xl bg-white p-5 shadow-lg shadow-teal-900/5">
            <input
              type="text"
              required
              autoFocus
              autoCapitalize="none"
              autoCorrect="off"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-full border border-slate-200 px-4 py-3 text-sm outline-none focus:border-teal-500"
            />
            <input
              type="password"
              required
              minLength={6}
              inputMode="numeric"
              placeholder="PIN (6+ digits)"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full rounded-full border border-slate-200 px-4 py-3 text-sm outline-none focus:border-teal-500"
            />

            {error && <p className="px-1 text-xs text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-full bg-teal-700 py-3 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
            >
              {submitting ? 'Please wait…' : stage === 'signin' ? 'Sign in' : 'Sign up'}
            </button>

            <p className="pt-1 text-center text-xs text-slate-500">
              {stage === 'signin' ? (
                <>Need an account? <button type="button" onClick={() => goTo('signup')} className="font-semibold text-teal-700">Sign up</button></>
              ) : (
                <>Already have an account? <button type="button" onClick={() => goTo('signin')} className="font-semibold text-teal-700">Sign in</button></>
              )}
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

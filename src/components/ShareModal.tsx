import { useState, FormEvent } from 'react';
import { X, Trash2, UserPlus, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Viewer {
  id: string;
  viewer_email: string;
  viewer_id: string | null;
}

interface Props {
  onClose: () => void;
  canEdit: boolean;
  viewers: Viewer[];
  inviteViewer: (email: string) => Promise<string | null>;
  revokeViewer: (id: string) => Promise<void>;
}

export default function ShareModal({ onClose, canEdit, viewers, inviteViewer, revokeViewer }: Props) {
  const { user, signOut, secureAccount } = useAuth();
  const isAnonymous = (user as any)?.is_anonymous === true;

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteBusy, setInviteBusy] = useState(false);

  const [secureEmail, setSecureEmail] = useState('');
  const [securePassword, setSecurePassword] = useState('');
  const [secureError, setSecureError] = useState<string | null>(null);
  const [secureInfo, setSecureInfo] = useState<string | null>(null);
  const [secureBusy, setSecureBusy] = useState(false);

  const handleInvite = async () => {
    setInviteError(null);
    setInviteBusy(true);
    const err = await inviteViewer(inviteEmail);
    setInviteBusy(false);
    if (err) {
      setInviteError(err);
    } else {
      setInviteEmail('');
    }
  };

  const handleSecure = async (e: FormEvent) => {
    e.preventDefault();
    setSecureError(null);
    setSecureInfo(null);
    setSecureBusy(true);
    const err = await secureAccount(secureEmail, securePassword);
    setSecureBusy(false);
    if (err) {
      setSecureError(err);
    } else {
      setSecureInfo('Account secured. Check your email to confirm the address.');
    }
  };

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-slate-900/30 sm:items-center" onClick={onClose}>
      <div className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-5 shadow-xl sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h4 className="text-base font-semibold text-slate-900">Account</h4>
          <button onClick={onClose} aria-label="Close" className="rounded-full p-1 text-slate-400 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mb-4 truncate text-xs text-slate-500">Signed in as {user?.email ?? 'anonymous session'}</p>

        {isAnonymous && (
          <div className="mb-5 rounded-2xl bg-amber-50 p-4">
            <p className="mb-3 text-sm font-medium text-amber-800">Secure your account</p>
            <p className="mb-3 text-xs text-amber-700">Add an email and password so you can sign in from other devices and this data is never lost.</p>
            <form onSubmit={handleSecure} className="space-y-2">
              <input
                type="email"
                required
                placeholder="Your email"
                value={secureEmail}
                onChange={(e) => setSecureEmail(e.target.value)}
                className="w-full rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm outline-none focus:border-amber-400"
              />
              <input
                type="password"
                required
                minLength={6}
                placeholder="Choose a password"
                value={securePassword}
                onChange={(e) => setSecurePassword(e.target.value)}
                className="w-full rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm outline-none focus:border-amber-400"
              />
              {secureError && <p className="text-xs text-red-600">{secureError}</p>}
              {secureInfo && <p className="text-xs text-emerald-600">{secureInfo}</p>}
              <button
                type="submit"
                disabled={secureBusy}
                className="w-full rounded-xl bg-amber-600 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-60"
              >
                {secureBusy ? 'Saving…' : 'Secure account'}
              </button>
            </form>
          </div>
        )}

        {canEdit ? (
          <div className="mb-5">
            <p className="mb-2 text-sm font-medium text-slate-800">Share view-only access</p>
            <p className="mb-3 text-xs text-slate-500">Invite someone to see this budget without being able to edit it.</p>
            <div className="mb-3 flex gap-2">
              <input
                type="email"
                placeholder="Their email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
              />
              <button
                onClick={handleInvite}
                disabled={inviteBusy}
                className="flex items-center gap-1 rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
              >
                <UserPlus className="h-3.5 w-3.5" /> Invite
              </button>
            </div>
            {inviteError && <p className="mb-2 text-xs text-red-600">{inviteError}</p>}

            {viewers.length > 0 && (
              <div className="space-y-1.5">
                {viewers.map(v => (
                  <div key={v.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm">
                    <span className="truncate text-slate-700">{v.viewer_email}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[11px] font-medium ${v.viewer_id ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {v.viewer_id ? 'Active' : 'Pending'}
                      </span>
                      <button onClick={() => revokeViewer(v.id)} aria-label="Revoke access" className="text-slate-400 hover:text-red-500">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="mb-5 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
            You have view-only access to this budget.
          </div>
        )}

        <button
          onClick={signOut}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          <LogOut className="h-3.5 w-3.5" /> Sign out
        </button>
      </div>
    </div>
  );
}

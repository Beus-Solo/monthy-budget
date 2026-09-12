import { useState, FormEvent } from 'react';
import { X, Trash2, UserPlus, LogOut, Pencil, Eye } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usernameToEmail, emailToUsername } from '../lib/username';

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
  viewMode: boolean;
  onChangeViewMode: (viewMode: boolean) => void;
}

export default function ShareModal({ onClose, canEdit, viewers, inviteViewer, revokeViewer, viewMode, onChangeViewMode }: Props) {
  const { user, signOut, secureAccount } = useAuth();
  const isAnonymous = (user as any)?.is_anonymous === true;

  const [inviteUsername, setInviteUsername] = useState('');
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteBusy, setInviteBusy] = useState(false);

  const [secureUsername, setSecureUsername] = useState('');
  const [securePin, setSecurePin] = useState('');
  const [secureError, setSecureError] = useState<string | null>(null);
  const [secureInfo, setSecureInfo] = useState<string | null>(null);
  const [secureBusy, setSecureBusy] = useState(false);

  const handleInvite = async () => {
    setInviteError(null);
    if (!inviteUsername.trim()) {
      setInviteError('Enter a username');
      return;
    }
    setInviteBusy(true);
    const err = await inviteViewer(usernameToEmail(inviteUsername));
    setInviteBusy(false);
    if (err) {
      setInviteError(err);
    } else {
      setInviteUsername('');
    }
  };

  const handleSecure = async (e: FormEvent) => {
    e.preventDefault();
    setSecureError(null);
    setSecureInfo(null);
    if (!secureUsername.trim()) {
      setSecureError('Enter a username');
      return;
    }
    setSecureBusy(true);
    const err = await secureAccount(usernameToEmail(secureUsername), securePin);
    setSecureBusy(false);
    if (err) {
      setSecureError(err);
    } else {
      setSecureInfo('Account secured. Sign in with this username and PIN next time.');
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

        <p className="mb-4 truncate text-xs text-slate-500">
          Signed in as {user?.email ? emailToUsername(user.email) : 'anonymous session'}
        </p>

        {canEdit && (
          <div className="mb-5">
            <p className="mb-2 text-sm font-medium text-slate-800">Mode</p>
            <p className="mb-3 text-xs text-slate-500">
              Switch to View mode to browse this device without accidentally adding, editing, or deleting anything.
            </p>
            <div className="flex gap-1 rounded-full bg-slate-100 p-1 text-sm font-medium">
              <button
                type="button"
                onClick={() => onChangeViewMode(false)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-full py-1.5 transition-colors ${
                  !viewMode ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Pencil className="h-3.5 w-3.5" /> Edit mode
              </button>
              <button
                type="button"
                onClick={() => onChangeViewMode(true)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-full py-1.5 transition-colors ${
                  viewMode ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Eye className="h-3.5 w-3.5" /> View mode
              </button>
            </div>
          </div>
        )}

        {isAnonymous && (
          <div className="mb-5 rounded-2xl bg-amber-50 p-4">
            <p className="mb-3 text-sm font-medium text-amber-800">Secure your account</p>
            <p className="mb-3 text-xs text-amber-700">Pick a username and PIN so you can sign in from other devices and this data is never lost.</p>
            <form onSubmit={handleSecure} className="space-y-2">
              <input
                type="text"
                required
                autoCapitalize="none"
                autoCorrect="off"
                placeholder="Username"
                value={secureUsername}
                onChange={(e) => setSecureUsername(e.target.value)}
                className="w-full rounded-xl border border-amber-200 bg-white px-3 py-2 text-base outline-none focus:border-amber-400 sm:text-sm"
              />
              <input
                type="password"
                required
                minLength={6}
                inputMode="numeric"
                placeholder="Choose a PIN (6+ digits)"
                value={securePin}
                onChange={(e) => setSecurePin(e.target.value)}
                className="w-full rounded-xl border border-amber-200 bg-white px-3 py-2 text-base outline-none focus:border-amber-400 sm:text-sm"
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
            <p className="mb-3 text-xs text-slate-500">Give someone a username and PIN to see this budget without being able to edit it.</p>
            <div className="mb-3 flex gap-2">
              <input
                type="text"
                autoCapitalize="none"
                autoCorrect="off"
                placeholder="Their username"
                value={inviteUsername}
                onChange={(e) => setInviteUsername(e.target.value)}
                className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-base outline-none focus:border-slate-400 sm:text-sm"
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
            <p className="mb-3 text-xs text-slate-400">
              They'll sign up on their own device with this exact username and a PIN of their choice.
            </p>

            {viewers.length > 0 && (
              <div className="space-y-1.5">
                {viewers.map(v => (
                  <div key={v.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm">
                    <span className="truncate text-slate-700">{emailToUsername(v.viewer_email)}</span>
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

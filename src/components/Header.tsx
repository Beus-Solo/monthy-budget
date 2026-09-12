import { Wallet, Settings, Eye } from 'lucide-react';

interface Props {
  onOpenSettings: () => void;
  viewMode?: boolean;
}

export default function Header({ onOpenSettings, viewMode }: Props) {
  return (
    <header className="px-4 pt-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-3xl items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
            <Wallet className="h-4.5 w-4.5" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-slate-900">TRAKMTRX</span>
          {viewMode && (
            <span className="flex items-center gap-1 rounded-full bg-slate-900/5 px-2 py-0.5 text-[11px] font-medium text-slate-500">
              <Eye className="h-3 w-3" /> View mode
            </span>
          )}
        </div>
        <button
          onClick={onOpenSettings}
          aria-label="Account settings"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/70 text-slate-500 hover:bg-white hover:text-slate-800"
        >
          <Settings className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}

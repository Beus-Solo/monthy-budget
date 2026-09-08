import { Wallet } from 'lucide-react';

export default function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-5xl items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 shadow-lg shadow-indigo-200 text-white">
            <Wallet className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-800">Budget</span>
        </div>
      </div>
    </header>
  );
}

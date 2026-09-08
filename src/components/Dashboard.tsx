import { useState } from 'react';
import Header from './Header';
import MonthlyChecklist from './MonthlyChecklist';
import ShareModal from './ShareModal';
import { useBudgetData } from '../hooks/useBudgetData';
import { useBudgetOwner } from '../hooks/useBudgetOwner';

export default function Dashboard() {
  const { ownerId, canEdit, loading: ownerLoading, viewers, inviteViewer, revokeViewer } = useBudgetOwner();
  const {
    transactions,
    loading,
    addTransaction,
    deleteTransaction,
    toggleChecked,
    updateTransaction
  } = useBudgetData(ownerId, canEdit);
  const [showSettings, setShowSettings] = useState(false);

  if (loading || ownerLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-gradient-to-b from-orange-50 via-rose-50/40 to-white">
        <Header onOpenSettings={() => setShowSettings(true)} />
        <main className="flex flex-1 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900"></div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-rose-50/40 to-white">
      <Header onOpenSettings={() => setShowSettings(true)} />
      <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
        <MonthlyChecklist
          transactions={transactions}
          onAdd={addTransaction}
          onDelete={deleteTransaction}
          onToggleChecked={toggleChecked}
          onUpdate={updateTransaction}
          canEdit={canEdit}
        />
      </main>
      {showSettings && (
        <ShareModal
          onClose={() => setShowSettings(false)}
          canEdit={canEdit}
          viewers={viewers}
          inviteViewer={inviteViewer}
          revokeViewer={revokeViewer}
        />
      )}
    </div>
  );
}

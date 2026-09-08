import Header from './Header';
import MonthlyChecklist from './MonthlyChecklist';
import { useBudgetData } from '../hooks/useBudgetData';

export default function Dashboard() {
  const {
    transactions,
    loading,
    addTransaction,
    deleteTransaction,
    toggleChecked,
    updateTransaction
  } = useBudgetData();

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-gradient-to-b from-orange-50 via-rose-50/40 to-white">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900"></div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-rose-50/40 to-white">
      <Header />
      <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
        <MonthlyChecklist
          transactions={transactions}
          onAdd={addTransaction}
          onDelete={deleteTransaction}
          onToggleChecked={toggleChecked}
          onUpdate={updateTransaction}
        />
      </main>
    </div>
  );
}

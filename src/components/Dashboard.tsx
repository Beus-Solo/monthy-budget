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
      <div className="flex min-h-screen flex-col bg-slate-50">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600"></div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
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

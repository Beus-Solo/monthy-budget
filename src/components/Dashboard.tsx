import Header from './Header';
import Summary from './Summary';
import MonthlyChecklist from './MonthlyChecklist';
import { useBudgetData } from '../hooks/useBudgetData';

export default function Dashboard() {
  const {
    transactions,
    budgetConfig,
    loading,
    addTransaction,
    deleteTransaction,
    toggleChecked,
    updateTransaction,
    updateStartingBalance
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

  const income = transactions
    .filter((t) => t.checked && t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const expenses = transactions
    .filter((t) => t.checked && t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const startingBalance = budgetConfig?.startingBalance || 0;
  const currentBalance = startingBalance + income - expenses;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-8">
          <Summary
            startingBalance={startingBalance}
            currentBalance={currentBalance}
            income={income}
            expenses={expenses}
            updateStartingBalance={updateStartingBalance}
          />

          <MonthlyChecklist
            transactions={transactions}
            onAdd={addTransaction}
            onDelete={deleteTransaction}
            onToggleChecked={toggleChecked}
            onUpdate={updateTransaction}
          />
        </div>
      </main>
    </div>
  );
}

import { useState, useMemo } from 'react';
import { Trash2, Plus, Check } from 'lucide-react';
import { Transaction, TransactionType } from '../types';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

interface Props {
  transactions: Transaction[];
  onAdd: (data: Omit<Transaction, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'checked'>) => void;
  onDelete: (id: string) => void;
  onToggleChecked: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Pick<Transaction, 'name' | 'category' | 'amount'>>) => void;
}

export default function MonthlyChecklist({ transactions, onAdd, onDelete, onToggleChecked, onUpdate }: Props) {
  const now = new Date();
  const [activeMonth, setActiveMonth] = useState(now.getMonth());
  const [activeYear] = useState(now.getFullYear());
  const [type, setType] = useState<TransactionType>('expense');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');

  const knownCategories = useMemo(() => {
    return Array.from(new Set(transactions.map(t => t.category).filter(Boolean)));
  }, [transactions]);

  const monthTransactions = useMemo(() => {
    return transactions.filter(t => {
      const d = new Date(t.date + 'T00:00:00');
      return d.getMonth() === activeMonth && d.getFullYear() === activeYear;
    });
  }, [transactions, activeMonth, activeYear]);

  const checkedTotal = monthTransactions
    .filter(t => t.checked)
    .reduce((sum, t) => sum + (t.type === 'expense' ? t.amount : -t.amount), 0);

  const categoryTotals = useMemo(() => {
    const map: Record<string, number> = {};
    monthTransactions.filter(t => t.checked).forEach(t => {
      map[t.category] = (map[t.category] || 0) + t.amount;
    });
    return Object.entries(map);
  }, [monthTransactions]);

  const fmt = (n: number) => `$${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const handleAdd = () => {
    if (!name.trim()) return;
    const day = Math.min(now.getDate(), 28);
    const date = new Date(activeYear, activeMonth, day).toISOString().split('T')[0];
    onAdd({
      amount: parseFloat(amount) || 0,
      date,
      category: category.trim() || 'Uncategorized',
      name: name.trim(),
      type,
      note: ''
    });
    setName('');
    setCategory('');
    setAmount('');
  };

  return (
    <div className="space-y-4">
      {/* Month tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-slate-200 pb-px">
        {MONTHS.map((m, i) => (
          <button
            key={m}
            onClick={() => setActiveMonth(i)}
            className={`whitespace-nowrap px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
              i === activeMonth
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {m.slice(0, 3)}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        {/* Checklist */}
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <h3 className="text-sm font-semibold text-slate-800">
              {MONTHS[activeMonth]} {activeYear} — {monthTransactions.length} item{monthTransactions.length !== 1 ? 's' : ''}
            </h3>
          </div>

          {monthTransactions.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-slate-400">
              No items yet. Add one using the form.
            </div>
          ) : (
            <div>
              {monthTransactions.map(t => (
                <div
                  key={t.id}
                  className={`flex items-center gap-3 border-b border-slate-100 px-4 py-2.5 last:border-b-0 hover:bg-slate-50 ${
                    t.checked ? 'opacity-60' : ''
                  }`}
                >
                  <button
                    onClick={() => onToggleChecked(t.id)}
                    aria-label={t.checked ? 'Mark as unpaid' : 'Mark as paid'}
                    className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded border-[1.5px] ${
                      t.checked ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300 bg-white'
                    }`}
                  >
                    {t.checked && <Check className="h-3 w-3 text-white" />}
                  </button>

                  <input
                    defaultValue={t.name}
                    onBlur={(e) => onUpdate(t.id, { name: e.target.value })}
                    className={`min-w-0 flex-1 border-none bg-transparent text-sm outline-none ${
                      t.checked ? 'text-slate-400 line-through' : 'text-slate-800'
                    }`}
                  />

                  <input
                    defaultValue={t.category}
                    onBlur={(e) => onUpdate(t.id, { category: e.target.value })}
                    list="category-suggestions"
                    className="w-24 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600 outline-none focus:border-indigo-400"
                  />

                  <input
                    type="number"
                    step="0.01"
                    defaultValue={t.amount}
                    onBlur={(e) => onUpdate(t.id, { amount: parseFloat(e.target.value) || 0 })}
                    className="w-20 border-none bg-transparent text-right text-sm font-medium text-slate-800 outline-none"
                  />

                  <button
                    onClick={() => onDelete(t.id)}
                    aria-label="Delete item"
                    className="shrink-0 rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <datalist id="category-suggestions">
            {knownCategories.map(c => <option key={c} value={c} />)}
          </datalist>
        </div>

        {/* Right panel */}
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Month summary</h4>
            {categoryTotals.length === 0 ? (
              <p className="text-sm text-slate-400">Check items to see totals</p>
            ) : (
              <div className="space-y-1.5">
                {categoryTotals.map(([cat, amt]) => (
                  <div key={cat} className="flex justify-between text-sm">
                    <span className="text-slate-600">{cat}</span>
                    <span className="font-medium text-slate-800">{fmt(amt)}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3">
              <span className="text-sm font-semibold text-slate-800">Net</span>
              <span className={`text-lg font-semibold ${checkedTotal >= 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                {checkedTotal < 0 ? '+' : ''}{fmt(checkedTotal)}
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h4 className="mb-3 text-sm font-semibold text-slate-800">Add item</h4>
            <div className="mb-3 grid grid-cols-2 gap-1.5">
              <button
                onClick={() => setType('income')}
                className={`rounded-lg border py-1.5 text-xs font-medium ${
                  type === 'income' ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-500'
                }`}
              >
                Income
              </button>
              <button
                onClick={() => setType('expense')}
                className={`rounded-lg border py-1.5 text-xs font-medium ${
                  type === 'expense' ? 'border-red-300 bg-red-50 text-red-700' : 'border-slate-200 text-slate-500'
                }`}
              >
                Expense
              </button>
            </div>

            <div className="space-y-2">
              <input
                placeholder="Item name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm outline-none focus:border-indigo-400"
              />
              <input
                placeholder="Category (type your own)"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                list="category-suggestions"
                className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm outline-none focus:border-indigo-400"
              />
              <input
                type="number"
                step="0.01"
                placeholder="Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm outline-none focus:border-indigo-400"
              />
              <button
                onClick={handleAdd}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                <Plus className="h-3.5 w-3.5" /> Add to list
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useMemo, useEffect, useRef } from 'react';
import { Trash2, Plus, Check, Repeat, ChevronLeft, ChevronRight } from 'lucide-react';
import { Transaction } from '../types';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

type NewTransaction = Omit<Transaction, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'checked'>;

interface Props {
  transactions: Transaction[];
  onAdd: (data: NewTransaction) => void;
  onDelete: (id: string) => void;
  onToggleChecked: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Pick<Transaction, 'name' | 'category' | 'amount' | 'recurring'>>) => void;
}

const itemKey = (name: string, category: string) => `${name.trim().toLowerCase()}|${category.trim().toLowerCase()}`;

const toDateStr = (year: number, month: number, day: number) =>
  `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

export default function MonthlyChecklist({ transactions, onAdd, onDelete, onToggleChecked, onUpdate }: Props) {
  const now = new Date();
  const [activeMonth, setActiveMonth] = useState(now.getMonth());
  const [activeYear, setActiveYear] = useState(now.getFullYear());
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [recurring, setRecurring] = useState(false);

  const knownCategories = useMemo(() => {
    return Array.from(new Set(transactions.map(t => t.category).filter(Boolean)));
  }, [transactions]);

  const monthTransactions = useMemo(() => {
    return transactions.filter(t => {
      const d = new Date(t.date + 'T00:00:00');
      return d.getMonth() === activeMonth && d.getFullYear() === activeYear;
    });
  }, [transactions, activeMonth, activeYear]);

  const monthTotal = monthTransactions
    .filter(t => t.checked)
    .reduce((sum, t) => sum + t.amount, 0);

  const fmt = (n: number) => `$${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Auto-copy recurring items into the active month if they aren't there yet.
  const seededMonths = useRef(new Set<string>());
  useEffect(() => {
    const monthKey = `${activeYear}-${activeMonth}`;
    if (seededMonths.current.has(monthKey)) return;

    const byKey = new Map<string, Transaction[]>();
    transactions.filter(t => t.recurring).forEach(t => {
      const key = itemKey(t.name, t.category);
      byKey.set(key, [...(byKey.get(key) ?? []), t]);
    });

    const recurringTemplates = new Map<string, { tx: Transaction; earliestDate: string }>();
    byKey.forEach((txs, key) => {
      const latest = txs.reduce((a, b) => (b.date > a.date ? b : a));
      const earliestDate = txs.reduce((min, t) => (t.date < min ? t.date : min), txs[0].date);
      recurringTemplates.set(key, { tx: latest, earliestDate });
    });

    const presentKeys = new Set(monthTransactions.map(t => itemKey(t.name, t.category)));
    const activeMonthStart = toDateStr(activeYear, activeMonth, 1);

    recurringTemplates.forEach(({ tx, earliestDate }, key) => {
      if (presentKeys.has(key)) return;
      if (activeMonthStart < earliestDate) return;
      onAdd({
        amount: tx.amount,
        date: activeMonthStart,
        category: tx.category,
        name: tx.name,
        type: 'expense',
        recurring: true,
        note: ''
      });
    });

    seededMonths.current.add(monthKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMonth, activeYear, transactions]);

  const handleAdd = () => {
    if (!name.trim()) return;
    const day = Math.min(now.getDate(), 28);
    const date = toDateStr(activeYear, activeMonth, day);
    onAdd({
      amount: parseFloat(amount) || 0,
      date,
      category: category.trim() || 'Uncategorized',
      name: name.trim(),
      type: 'expense',
      recurring,
      note: ''
    });
    setName('');
    setCategory('');
    setAmount('');
    setRecurring(false);
  };

  const goToPrevYear = () => setActiveYear(y => y - 1);
  const goToNextYear = () => setActiveYear(y => y + 1);

  return (
    <div className="space-y-4">
      {/* Year switcher */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={goToPrevYear}
          aria-label="Previous year"
          className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold text-slate-700">{activeYear}</span>
        <button
          onClick={goToNextYear}
          aria-label="Next year"
          className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

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

      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-800">
          {MONTHS[activeMonth]} {activeYear} — {monthTransactions.length} item{monthTransactions.length !== 1 ? 's' : ''}
        </h3>
        <span className="text-sm font-semibold text-slate-800">
          Total: {fmt(monthTotal)}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        {/* Checklist */}
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
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
                    onClick={() => onUpdate(t.id, { recurring: !t.recurring })}
                    aria-label={t.recurring ? 'Stop repeating monthly' : 'Repeat every month'}
                    title={t.recurring ? 'Repeats every month' : 'Repeat every month'}
                    className={`shrink-0 rounded p-1 ${
                      t.recurring ? 'text-indigo-600' : 'text-slate-300 hover:text-slate-500'
                    }`}
                  >
                    <Repeat className="h-3.5 w-3.5" />
                  </button>

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

        {/* Add item panel */}
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h4 className="mb-3 text-sm font-semibold text-slate-800">Add item</h4>
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
              <label className="flex items-center gap-2 px-0.5 text-xs text-slate-600">
                <input
                  type="checkbox"
                  checked={recurring}
                  onChange={(e) => setRecurring(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-400"
                />
                Repeat every month
              </label>
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

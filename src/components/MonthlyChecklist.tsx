import { useState, useMemo, useEffect, useRef } from 'react';
import { Trash2, Plus, Check, Repeat, ChevronLeft, ChevronRight, X, Wallet2, ListChecks } from 'lucide-react';
import { Transaction } from '../types';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const CATEGORY_COLORS = [
  { dot: 'bg-emerald-400', bar: 'bg-emerald-400', chip: 'bg-emerald-50 text-emerald-700' },
  { dot: 'bg-indigo-400', bar: 'bg-indigo-400', chip: 'bg-indigo-50 text-indigo-700' },
  { dot: 'bg-orange-400', bar: 'bg-orange-400', chip: 'bg-orange-50 text-orange-700' },
  { dot: 'bg-rose-400', bar: 'bg-rose-400', chip: 'bg-rose-50 text-rose-700' },
  { dot: 'bg-sky-400', bar: 'bg-sky-400', chip: 'bg-sky-50 text-sky-700' },
  { dot: 'bg-amber-400', bar: 'bg-amber-400', chip: 'bg-amber-50 text-amber-700' },
  { dot: 'bg-fuchsia-400', bar: 'bg-fuchsia-400', chip: 'bg-fuchsia-50 text-fuchsia-700' },
];

const colorFor = (category: string) => {
  let hash = 0;
  for (let i = 0; i < category.length; i++) hash = (hash * 31 + category.charCodeAt(i)) >>> 0;
  return CATEGORY_COLORS[hash % CATEGORY_COLORS.length];
};

type NewTransaction = Omit<Transaction, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'checked'>;

interface Props {
  transactions: Transaction[];
  onAdd: (data: NewTransaction) => void;
  onDelete: (id: string) => void;
  onToggleChecked: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Pick<Transaction, 'name' | 'category' | 'amount' | 'recurring'>>) => void;
  canEdit: boolean;
}

const itemKey = (name: string, category: string) => `${name.trim().toLowerCase()}|${category.trim().toLowerCase()}`;

const MONTH_PILL_W = 56;
const MONTH_GAP = 10;
const MONTH_VISIBLE = 5;
const MONTH_STRIP_W = MONTH_VISIBLE * MONTH_PILL_W + (MONTH_VISIBLE - 1) * MONTH_GAP;

const toDateStr = (year: number, month: number, day: number) =>
  `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

export default function MonthlyChecklist({ transactions, onAdd, onDelete, onToggleChecked, onUpdate, canEdit }: Props) {
  const now = new Date();
  const [activeMonth, setActiveMonth] = useState(now.getMonth());
  const [activeYear, setActiveYear] = useState(now.getFullYear());
  const [activeTab, setActiveTab] = useState<'checklist' | 'category'>('checklist');
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [recurring, setRecurring] = useState(false);

  const knownCategories = useMemo(() => {
    return Array.from(new Set(transactions.map(t => t.category).filter(Boolean)));
  }, [transactions]);

  const monthTransactions = useMemo(() => {
    return transactions
      .filter(t => {
        const d = new Date(t.date + 'T00:00:00');
        return d.getMonth() === activeMonth && d.getFullYear() === activeYear;
      })
      .sort((a, b) => Number(a.checked) - Number(b.checked));
  }, [transactions, activeMonth, activeYear]);

  const paidTotal = monthTransactions
    .filter(t => t.checked)
    .reduce((sum, t) => sum + t.amount, 0);

  const unpaidTotal = monthTransactions
    .filter(t => !t.checked)
    .reduce((sum, t) => sum + t.amount, 0);

  const unpaidCount = monthTransactions.filter(t => !t.checked).length;
  const recurringCount = monthTransactions.filter(t => t.recurring).length;

  const categoryTotals = useMemo(() => {
    const map = new Map<string, number>();
    monthTransactions.filter(t => t.checked).forEach(t => {
      const cat = t.category.trim() || 'Uncategorized';
      map.set(cat, (map.get(cat) ?? 0) + t.amount);
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [monthTransactions]);

  const fmt = (n: number) => `$${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Auto-copy recurring items into the active month if they aren't there yet.
  const seededMonths = useRef(new Set<string>());
  useEffect(() => {
    if (!canEdit) return;
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
    setShowAddModal(false);
  };

  const goToPrevYear = () => setActiveYear(y => y - 1);
  const goToNextYear = () => setActiveYear(y => y + 1);

  return (
    <div className="space-y-5 pb-24">
      {/* Year switcher */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={goToPrevYear}
          aria-label="Previous year"
          className="rounded-full p-1.5 text-slate-400 hover:bg-white hover:text-slate-700"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold text-slate-700">{activeYear}</span>
        <button
          onClick={goToNextYear}
          aria-label="Next year"
          className="rounded-full p-1.5 text-slate-400 hover:bg-white hover:text-slate-700"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Month carousel */}
      <div className="overflow-hidden" style={{ width: MONTH_STRIP_W, margin: '0 auto' }}>
        <div
          className="flex items-center transition-transform duration-300 ease-out"
          style={{
            gap: MONTH_GAP,
            transform: `translateX(${MONTH_STRIP_W / 2 - MONTH_PILL_W / 2 - activeMonth * (MONTH_PILL_W + MONTH_GAP)}px)`
          }}
        >
          {MONTHS.map((m, i) => {
            const distance = Math.abs(i - activeMonth);
            return (
              <button
                key={m}
                onClick={() => setActiveMonth(i)}
                className={`shrink-0 whitespace-nowrap rounded-full py-1.5 text-sm font-medium transition-all duration-300 ${
                  i === activeMonth
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-white/70 text-slate-500 hover:bg-white'
                }`}
                style={{
                  width: MONTH_PILL_W,
                  opacity: i === activeMonth ? 1 : distance === 1 ? 0.75 : distance === 2 ? 0.45 : 0.2,
                  transform: `scale(${i === activeMonth ? 1 : 0.9})`
                }}
              >
                {m.slice(0, 3)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Gradient summary card */}
      <div className="rounded-3xl bg-gradient-to-br from-emerald-200 via-teal-100 to-emerald-50 p-5 shadow-sm">
        <div className="flex items-center gap-2 text-slate-700">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/60">
            <Wallet2 className="h-4 w-4" />
          </div>
          <span className="text-sm font-medium">{MONTHS[activeMonth]} {activeYear}</span>
        </div>
        <p className="mt-4 text-4xl font-bold tracking-tight text-slate-900">{fmt(paidTotal)}</p>
        <p className="mt-1 text-xs font-medium text-slate-500">PAID SO FAR</p>

        <div className="mt-5 flex items-center gap-6 border-t border-white/50 pt-4">
          <div>
            <p className="text-xs text-slate-500">Unpaid</p>
            <p className="text-sm font-semibold text-slate-800">{fmt(unpaidTotal)}</p>
          </div>
          <div className="h-8 w-px bg-white/60" />
          <div>
            <p className="text-xs text-slate-500">Items</p>
            <p className="text-sm font-semibold text-slate-800">{monthTransactions.length}</p>
          </div>
        </div>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-gradient-to-br from-orange-100 to-amber-50 p-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/60">
            <ListChecks className="h-4 w-4 text-slate-700" />
          </div>
          <p className="mt-3 text-xl font-bold text-slate-900">{unpaidCount}</p>
          <p className="text-xs text-slate-500">Unpaid item{unpaidCount !== 1 ? 's' : ''}</p>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-50 p-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/60">
            <Repeat className="h-4 w-4 text-slate-700" />
          </div>
          <p className="mt-3 text-xl font-bold text-slate-900">{recurringCount}</p>
          <p className="text-xs text-slate-500">Recurring</p>
        </div>
      </div>

      {/* View tabs */}
      <div className="flex gap-1 rounded-full bg-white/70 p-1 text-sm font-medium">
        <button
          onClick={() => setActiveTab('checklist')}
          className={`flex-1 rounded-full py-1.5 transition-colors ${
            activeTab === 'checklist' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Checklist
        </button>
        <button
          onClick={() => setActiveTab('category')}
          className={`flex-1 rounded-full py-1.5 transition-colors ${
            activeTab === 'category' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          By Category
        </button>
      </div>

      {activeTab === 'category' ? (
        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <h4 className="mb-4 text-sm font-semibold text-slate-800">Spending by category</h4>
          {categoryTotals.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-slate-400">
              No paid items yet this month. Check items off to see the breakdown.
            </div>
          ) : (
            <div className="space-y-4">
              {categoryTotals.map(([cat, amt]) => {
                const pct = paidTotal > 0 ? (amt / paidTotal) * 100 : 0;
                const c = colorFor(cat);
                return (
                  <div key={cat}>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 font-medium text-slate-700">
                        <span className={`h-2 w-2 rounded-full ${c.dot}`} />
                        {cat}
                      </span>
                      <span className="font-semibold text-slate-800">{fmt(amt)}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div className={`h-full rounded-full ${c.bar}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {monthTransactions.length === 0 ? (
            <div className="rounded-3xl bg-white px-4 py-12 text-center text-sm text-slate-400 shadow-sm">
              No items yet. Tap + to add one.
            </div>
          ) : (
            monthTransactions.map(t => {
              const c = colorFor(t.category);
              return (
                <div
                  key={t.id}
                  className={`flex items-center gap-3 rounded-2xl bg-white p-3.5 shadow-sm ${t.checked ? 'opacity-60' : ''}`}
                >
                  <button
                    onClick={() => canEdit && onToggleChecked(t.id)}
                    disabled={!canEdit}
                    aria-label={t.checked ? 'Mark as unpaid' : 'Mark as paid'}
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                      t.checked ? 'border-slate-900 bg-slate-900' : 'border-slate-200 bg-white'
                    } ${!canEdit ? 'cursor-default' : ''}`}
                  >
                    {t.checked && <Check className="h-3.5 w-3.5 text-white" />}
                  </button>

                  <div className="min-w-0 flex-1">
                    {canEdit ? (
                      <input
                        defaultValue={t.name}
                        onBlur={(e) => onUpdate(t.id, { name: e.target.value })}
                        className={`w-full border-none bg-transparent p-0 text-sm font-medium outline-none ${
                          t.checked ? 'text-slate-400 line-through' : 'text-slate-800'
                        }`}
                      />
                    ) : (
                      <p className={`truncate text-sm font-medium ${t.checked ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                        {t.name}
                      </p>
                    )}
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${c.chip}`}>
                        {t.category}
                      </span>
                      {t.recurring && <Repeat className="h-3 w-3 text-slate-400" />}
                    </div>
                  </div>

                  {canEdit ? (
                    <input
                      type="number"
                      step="0.01"
                      defaultValue={t.amount}
                      onBlur={(e) => onUpdate(t.id, { amount: parseFloat(e.target.value) || 0 })}
                      className="w-16 shrink-0 border-none bg-transparent text-right text-sm font-semibold text-slate-800 outline-none"
                    />
                  ) : (
                    <span className="shrink-0 text-sm font-semibold text-slate-800">{t.amount}</span>
                  )}

                  {canEdit && (
                    <>
                      <button
                        onClick={() => onUpdate(t.id, { recurring: !t.recurring })}
                        aria-label={t.recurring ? 'Stop repeating monthly' : 'Repeat every month'}
                        title={t.recurring ? 'Repeats every month' : 'Repeat every month'}
                        className={`shrink-0 rounded-full p-1.5 ${t.recurring ? 'text-indigo-500' : 'text-slate-300 hover:text-slate-500'}`}
                      >
                        <Repeat className="h-3.5 w-3.5" />
                      </button>

                      <button
                        onClick={() => onDelete(t.id)}
                        aria-label="Delete item"
                        className="shrink-0 rounded-full p-1.5 text-slate-300 hover:bg-red-50 hover:text-red-500"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}
                </div>
              );
            })
          )}

          <datalist id="category-suggestions">
            {knownCategories.map(c => <option key={c} value={c} />)}
          </datalist>
        </div>
      )}

      {/* Floating add button */}
      {canEdit && (
        <button
          onClick={() => setShowAddModal(true)}
          aria-label="Add expense"
          className="fixed bottom-6 left-1/2 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg shadow-slate-900/20 hover:bg-slate-800"
        >
          <Plus className="h-6 w-6" />
        </button>
      )}

      {/* Add item bottom sheet */}
      {canEdit && showAddModal && (
        <div className="fixed inset-0 z-20 flex items-end justify-center bg-slate-900/30 sm:items-center" onClick={() => setShowAddModal(false)}>
          <div
            className="w-full max-w-md rounded-t-3xl bg-white p-5 shadow-xl sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-base font-semibold text-slate-900">Add expense</h4>
              <button onClick={() => setShowAddModal(false)} aria-label="Close" className="rounded-full p-1 text-slate-400 hover:bg-slate-100">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-2.5">
              <input
                placeholder="Item name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
              />
              <input
                placeholder="Category (type your own)"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                list="category-suggestions"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
              />
              <input
                type="number"
                step="0.01"
                placeholder="Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
              />
              <label className="flex items-center gap-2 px-0.5 py-1 text-xs text-slate-600">
                <input
                  type="checkbox"
                  checked={recurring}
                  onChange={(e) => setRecurring(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
                />
                Repeat every month
              </label>
              <button
                onClick={handleAdd}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-900 py-3 text-sm font-medium text-white hover:bg-slate-800"
              >
                <Plus className="h-3.5 w-3.5" /> Add to list
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

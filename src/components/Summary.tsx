import React, { useState } from 'react';
import { formatCurrency } from '../lib/utils';
import { TrendingDown, TrendingUp, Wallet, Check, Pencil } from 'lucide-react';

interface SummaryProps {
  startingBalance: number;
  currentBalance: number;
  income: number;
  expenses: number;
  updateStartingBalance: (amount: number) => void;
}

export default function Summary({ 
  startingBalance, 
  currentBalance, 
  income, 
  expenses,
  updateStartingBalance
}: SummaryProps) {
  const [isEditingBalance, setIsEditingBalance] = useState(false);
  const [balanceInput, setBalanceInput] = useState(startingBalance.toString());

  const handleBalanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(balanceInput);
    if (!isNaN(val)) {
      updateStartingBalance(val);
    }
    setIsEditingBalance(false);
  };

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {/* Current Balance */}
      <div className="col-span-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:col-span-1">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600">
            <Wallet className="h-5 w-5" />
          </div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-widest">Current Balance</p>
        </div>
        <p className="mt-4 text-3xl font-bold tracking-tight text-slate-800">
          {formatCurrency(currentBalance)}
        </p>
        
        {isEditingBalance ? (
          <form onSubmit={handleBalanceSubmit} className="mt-3 flex items-center gap-2">
            <input
              type="number"
              step="0.01"
              value={balanceInput}
              onChange={(e) => setBalanceInput(e.target.value)}
              className="w-24 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              autoFocus
              onBlur={handleBalanceSubmit}
            />
            <button
              type="submit"
              className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
            >
              <Check className="h-4 w-4" />
            </button>
          </form>
        ) : (
          <div className="mt-3 flex items-center gap-2">
            <p className="text-xs font-bold text-slate-400">
              STARTS AT {formatCurrency(startingBalance)}
            </p>
            <button
              onClick={() => {
                setBalanceInput(startingBalance.toString());
                setIsEditingBalance(true);
              }}
              className="text-slate-400 hover:text-slate-600"
              aria-label="Edit starting balance"
            >
              <Pencil className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>

      {/* Income */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-50 text-green-600">
            <TrendingUp className="h-5 w-5" />
          </div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-widest">Total Income</p>
        </div>
        <p className="mt-4 text-3xl font-bold tracking-tight text-slate-800">
          {formatCurrency(income)}
        </p>
      </div>

      {/* Expenses */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
            <TrendingDown className="h-5 w-5" />
          </div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-widest">Total Expenses</p>
        </div>
        <p className="mt-4 text-3xl font-bold tracking-tight text-slate-800">
          {formatCurrency(expenses)}
        </p>
      </div>
    </div>
  );
}

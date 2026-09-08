import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Transaction, BudgetConfig } from '../types';

const mapTransactionFromDB = (row: any): Transaction => ({
  id: row.id,
  amount: row.amount,
  date: row.date,
  category: row.category,
  name: row.name || row.category,
  type: row.type,
  checked: row.checked ?? false,
  note: row.note,
  userId: row.user_id,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

export const useBudgetData = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgetConfig, setBudgetConfig] = useState<BudgetConfig | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!user) return;
    try {
      const [txRes, configRes] = await Promise.all([
        supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false })
          .order('created_at', { ascending: false }),
        supabase
          .from('budget_configs')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle()
      ]);

      if (txRes.data) {
        setTransactions(txRes.data.map(mapTransactionFromDB));
      }

      if (configRes.data) {
        setBudgetConfig({
          id: configRes.data.id,
          startingBalance: configRes.data.starting_balance,
          userId: configRes.data.user_id,
          createdAt: configRes.data.created_at,
          updatedAt: configRes.data.updated_at
        });
      } else {
        setBudgetConfig({
          id: user.id,
          startingBalance: 0,
          userId: user.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      setTransactions([]);
      setBudgetConfig(null);
      setLoading(false);
      return;
    }

    fetchData();

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${user.id}` },
        () => { fetchData(); }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'budget_configs', filter: `user_id=eq.${user.id}` },
        () => { fetchData(); }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const addTransaction = async (data: Omit<Transaction, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'checked'>) => {
    if (!user) return;

    const tempId = crypto.randomUUID();
    const now = new Date().toISOString();
    const newTx: Transaction = {
      ...data,
      id: tempId,
      checked: false,
      userId: user.id,
      createdAt: now,
      updatedAt: now
    };

    setTransactions(prev => [newTx, ...prev].sort((a, b) => {
       if (a.date !== b.date) return b.date.localeCompare(a.date);
       return b.createdAt.localeCompare(a.createdAt);
    }));

    await supabase.from('transactions').insert({
      amount: data.amount,
      date: data.date,
      category: data.category,
      name: data.name,
      type: data.type,
      checked: false,
      note: data.note,
      user_id: user.id
    });
  };

  const deleteTransaction = async (id: string) => {
    if (!user) return;
    setTransactions(prev => prev.filter(t => t.id !== id));
    await supabase.from('transactions').delete().eq('id', id).eq('user_id', user.id);
  };

  const toggleChecked = async (id: string) => {
    if (!user) return;
    const tx = transactions.find(t => t.id === id);
    if (!tx) return;
    const newChecked = !tx.checked;
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, checked: newChecked } : t));
    await supabase.from('transactions').update({ checked: newChecked }).eq('id', id).eq('user_id', user.id);
  };

  const updateTransaction = async (id: string, updates: Partial<Pick<Transaction, 'name' | 'category' | 'amount'>>) => {
    if (!user) return;
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    await supabase.from('transactions').update(updates).eq('id', id).eq('user_id', user.id);
  };

  const updateStartingBalance = async (balance: number) => {
    if (!user) return;

    setBudgetConfig(prev => prev ? { ...prev, startingBalance: balance } : null);

    const { data } = await supabase.from('budget_configs').select('id').eq('user_id', user.id).maybeSingle();

    if (data) {
      await supabase.from('budget_configs').update({ starting_balance: balance }).eq('user_id', user.id);
    } else {
      await supabase.from('budget_configs').insert({
        starting_balance: balance,
        user_id: user.id
      });
    }
  };

  return {
    transactions,
    budgetConfig,
    loading,
    addTransaction,
    deleteTransaction,
    toggleChecked,
    updateTransaction,
    updateStartingBalance
  };
};

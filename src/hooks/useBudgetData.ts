import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Transaction } from '../types';

const mapTransactionFromDB = (row: any): Transaction => ({
  id: row.id,
  amount: row.amount,
  date: row.date,
  category: row.category,
  name: row.name || row.category,
  type: row.type,
  kind: row.kind ?? 'bill',
  checked: row.checked ?? false,
  recurring: row.recurring ?? false,
  note: row.note,
  userId: row.user_id,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

export const useBudgetData = (ownerId: string | null, canEdit: boolean) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!ownerId) return;
    try {
      const { data } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', ownerId)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (data) {
        setTransactions(data.map(mapTransactionFromDB));
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!ownerId) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    fetchData();

    const channel = supabase
      .channel(`transactions-${ownerId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${ownerId}` },
        () => { fetchData(); }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownerId]);

  const addTransaction = async (data: Omit<Transaction, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'checked'>) => {
    if (!ownerId || !canEdit) return;

    const tempId = crypto.randomUUID();
    const now = new Date().toISOString();
    const checked = data.kind === 'shopping';
    const newTx: Transaction = {
      ...data,
      id: tempId,
      checked,
      userId: ownerId,
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
      kind: data.kind,
      checked,
      recurring: data.recurring,
      note: data.note,
      user_id: ownerId
    });
  };

  const deleteTransaction = async (id: string) => {
    if (!ownerId || !canEdit) return;
    setTransactions(prev => prev.filter(t => t.id !== id));
    await supabase.from('transactions').delete().eq('id', id).eq('user_id', ownerId);
  };

  const toggleChecked = async (id: string) => {
    if (!ownerId || !canEdit) return;
    const tx = transactions.find(t => t.id === id);
    if (!tx) return;
    const newChecked = !tx.checked;
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, checked: newChecked } : t));
    await supabase.from('transactions').update({ checked: newChecked }).eq('id', id).eq('user_id', ownerId);
  };

  const updateTransaction = async (id: string, updates: Partial<Pick<Transaction, 'name' | 'category' | 'amount' | 'recurring'>>) => {
    if (!ownerId || !canEdit) return;
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    await supabase.from('transactions').update(updates).eq('id', id).eq('user_id', ownerId);
  };

  return {
    transactions,
    loading,
    addTransaction,
    deleteTransaction,
    toggleChecked,
    updateTransaction
  };
};

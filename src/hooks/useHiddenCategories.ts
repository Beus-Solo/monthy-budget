import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const useHiddenCategories = (ownerId: string | null) => {
  const [hiddenCategories, setHiddenCategories] = useState<string[]>([]);

  const fetchHidden = async () => {
    if (!ownerId) return;
    const { data } = await supabase.from('hidden_categories').select('category').eq('user_id', ownerId);
    if (data) setHiddenCategories(data.map(r => r.category));
  };

  useEffect(() => {
    if (!ownerId) {
      setHiddenCategories([]);
      return;
    }

    fetchHidden();

    const channel = supabase
      .channel(`hidden-categories-${ownerId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'hidden_categories', filter: `user_id=eq.${ownerId}` },
        () => { fetchHidden(); }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownerId]);

  const hideCategory = async (category: string) => {
    if (!ownerId) return;
    setHiddenCategories(prev => (prev.includes(category) ? prev : [...prev, category]));
    await supabase.from('hidden_categories').insert({ user_id: ownerId, category });
  };

  return { hiddenCategories, hideCategory };
};

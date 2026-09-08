import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface ViewerInfo {
  id: string;
  viewer_email: string;
  viewer_id: string | null;
}

export const useBudgetOwner = () => {
  const { user } = useAuth();
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [canEdit, setCanEdit] = useState(true);
  const [viewers, setViewers] = useState<ViewerInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshViewers = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('shared_access')
      .select('id, viewer_email, viewer_id')
      .eq('owner_id', user.id);
    if (data) setViewers(data);
  };

  useEffect(() => {
    if (!user) {
      setOwnerId(null);
      setCanEdit(true);
      setViewers([]);
      setLoading(false);
      return;
    }

    let mounted = true;

    const resolve = async () => {
      // Already a claimed viewer for someone else's budget?
      const { data: claimed } = await supabase
        .from('shared_access')
        .select('owner_id')
        .eq('viewer_id', user.id)
        .maybeSingle();

      if (claimed) {
        if (mounted) {
          setOwnerId(claimed.owner_id);
          setCanEdit(false);
          setLoading(false);
        }
        return;
      }

      // An invite waiting for this email that hasn't been claimed yet?
      if (user.email) {
        const { data: pending } = await supabase
          .from('shared_access')
          .select('id, owner_id')
          .eq('viewer_email', user.email.toLowerCase())
          .is('viewer_id', null)
          .maybeSingle();

        if (pending) {
          await supabase.from('shared_access').update({ viewer_id: user.id }).eq('id', pending.id);
          if (mounted) {
            setOwnerId(pending.owner_id);
            setCanEdit(false);
            setLoading(false);
          }
          return;
        }
      }

      // Otherwise this user owns their own budget.
      if (mounted) {
        setOwnerId(user.id);
        setCanEdit(true);
        setLoading(false);
      }
    };

    resolve();
    refreshViewers();

    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const inviteViewer = async (email: string) => {
    if (!user) return 'Not signed in';
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return 'Enter an email address';
    const { error } = await supabase.from('shared_access').insert({
      owner_id: user.id,
      viewer_email: trimmed
    });
    if (error) return error.message;
    await refreshViewers();
    return null;
  };

  const revokeViewer = async (id: string) => {
    await supabase.from('shared_access').delete().eq('id', id);
    await refreshViewers();
  };

  return { ownerId, canEdit, loading, viewers, inviteViewer, revokeViewer };
};

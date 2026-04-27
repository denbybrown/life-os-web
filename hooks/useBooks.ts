'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useBooks() {
  const qc = useQueryClient();
  const { data: books = [], isLoading } = useQuery({
    queryKey: ['books'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('books').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const byStatus = {
    reading:      books.filter(b => b.status === 'reading'),
    want_to_read: books.filter(b => b.status === 'want_to_read'),
    read:         books.filter(b => b.status === 'read'),
  };

  const addBook = useMutation({
    mutationFn: async (input: { title: string; author?: string; status: string; genres?: string[] }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('books').insert({ ...input, user_id: user.id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['books'] }),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updates: Record<string, unknown> = { status };
      if (status === 'reading')      updates.started_at  = new Date().toISOString();
      if (status === 'read')         updates.finished_at = new Date().toISOString();
      const { error } = await supabase.from('books').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['books'] }),
  });

  const deleteBook = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('books').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['books'] }),
  });

  const getRecommendations = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase.functions.invoke('claude-proxy', {
        body: { feature: 'book_recommendations', payload: { read_books: books.filter(b => b.status === 'read' || b.status === 'reading'), learning_topics: [] } },
      });
      if (error) throw new Error(error.message);
      const recs = (data.data as { recommendations: Array<{ title: string; author?: string; reason?: string; genres?: string[] }> }).recommendations;
      await supabase.from('book_recommendations').update({ dismissed: true }).eq('user_id', user.id).eq('dismissed', false);
      const { error: insertErr } = await supabase.from('book_recommendations').insert(
        recs.map(r => ({ ...r, user_id: user.id, generated_at: new Date().toISOString(), dismissed: false, added_to_list: false }))
      );
      if (insertErr) throw insertErr;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['book-recs'] }),
  });

  return { books, byStatus, isLoading, addBook, updateStatus, deleteBook, getRecommendations };
}

export function useBookRecs() {
  const qc = useQueryClient();
  const { data: recs = [], isLoading } = useQuery({
    queryKey: ['book-recs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('book_recommendations').select('*').eq('dismissed', false).order('generated_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const addToList = useMutation({
    mutationFn: async (rec: { id: string; title: string; author?: string; genres?: string[] }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      await supabase.from('books').insert({ user_id: user.id, title: rec.title, author: rec.author, status: 'want_to_read', genres: rec.genres ?? [] });
      await supabase.from('book_recommendations').update({ added_to_list: true }).eq('id', rec.id);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['books'] }); qc.invalidateQueries({ queryKey: ['book-recs'] }); },
  });

  const dismiss = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('book_recommendations').update({ dismissed: true }).eq('id', id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['book-recs'] }),
  });

  return { recs, isLoading, addToList, dismiss };
}

export function useLearning() {
  const qc = useQueryClient();
  const { data: topics = [], isLoading } = useQuery({
    queryKey: ['learning'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('learning_topics').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const addTopic = useMutation({
    mutationFn: async (input: { name: string; description?: string; status: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('learning_topics').insert({ ...input, user_id: user.id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['learning'] }),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from('learning_topics').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['learning'] }),
  });

  const deleteTopic = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('learning_topics').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['learning'] }),
  });

  return { topics, isLoading, addTopic, updateStatus, deleteTopic };
}

'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useMealPlan() {
  const qc = useQueryClient();
  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['meal-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meal_plans').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const latestPlan = plans[0] ?? null;

  const importPlan = useMutation({
    mutationFn: async (rawText: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase.functions.invoke('claude-proxy', {
        body: { feature: 'meal_plan_parse', payload: { raw_text: rawText } },
      });
      if (error) throw new Error(error.message);
      const { error: insertErr } = await supabase.from('meal_plans').insert({
        user_id: user.id, title: 'My Meal Plan',
        plan_json: data.data, week_start: new Date().toISOString().slice(0, 10),
      });
      if (insertErr) throw insertErr;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['meal-plans'] }),
  });

  return { plans, latestPlan, isLoading, importPlan };
}

export function usePantry() {
  const qc = useQueryClient();
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['pantry'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pantry_items').select('*').order('name');
      if (error) throw error;
      return data;
    },
  });

  const addItem = useMutation({
    mutationFn: async (input: { name: string; quantity: number; unit: string; category: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('pantry_items').insert({ ...input, user_id: user.id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pantry'] }),
  });

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('pantry_items').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pantry'] }),
  });

  return { items, isLoading, addItem, deleteItem };
}

export function useShoppingList() {
  const qc = useQueryClient();
  const { data: lists = [], isLoading } = useQuery({
    queryKey: ['shopping-lists'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shopping_lists').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const latest = lists[0] ?? null;

  const generate = useMutation({
    mutationFn: async (payload: { meal_plan: unknown; pantry: unknown[] }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase.functions.invoke('claude-proxy', {
        body: { feature: 'shopping_list', payload },
      });
      if (error) throw new Error(error.message);
      const { error: insertErr } = await supabase.from('shopping_lists').insert({
        user_id: user.id, items: data.data.items,
      });
      if (insertErr) throw insertErr;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shopping-lists'] }),
  });

  const toggleItem = useMutation({
    mutationFn: async ({ listId, items }: { listId: string; items: unknown[] }) => {
      const { error } = await supabase.from('shopping_lists').update({ items }).eq('id', listId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shopping-lists'] }),
  });

  return { lists, latest, isLoading, generate, toggleItem };
}

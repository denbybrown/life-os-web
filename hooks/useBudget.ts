'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { supabase } from '@/lib/supabase';

export function useBudgetCategories() {
  const qc = useQueryClient();
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['budget-categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('budget_categories').select('*').order('name');
      if (error) throw error;
      return data;
    },
  });

  const addCategory = useMutation({
    mutationFn: async (input: { name: string; type: string; icon?: string; color?: string; monthly_target?: number }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('budget_categories').insert({ ...input, user_id: user.id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['budget-categories'] }),
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('budget_categories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['budget-categories'] }),
  });

  return { categories, isLoading, addCategory, deleteCategory };
}

export function useTransactions() {
  const qc = useQueryClient();
  const now = new Date();
  const from = format(startOfMonth(now), 'yyyy-MM-dd');
  const to   = format(endOfMonth(now),   'yyyy-MM-dd');

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['transactions', from],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*, budget_categories(name, icon, color)')
        .gte('date', from).lte('date', to)
        .order('date', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const totalIncome   = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const saved         = totalIncome - totalExpenses;
  const spendByCategory = transactions.reduce<Record<string, number>>((acc, t) => {
    if (t.category_id) acc[t.category_id] = (acc[t.category_id] ?? 0) + t.amount;
    return acc;
  }, {});

  const addTransaction = useMutation({
    mutationFn: async (input: { type: string; amount: number; description?: string; category_id?: string; date: string; recurring: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('transactions').insert({ ...input, user_id: user.id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['transactions'] }),
  });

  const deleteTransaction = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['transactions'] }),
  });

  return { transactions, isLoading, totalIncome, totalExpenses, saved, spendByCategory, addTransaction, deleteTransaction };
}

export function useBudgetForecast() {
  const qc = useQueryClient();
  const month = format(new Date(), 'yyyy-MM');

  const { data: forecast, isLoading } = useQuery({
    queryKey: ['budget-forecast', month],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budget_forecasts').select('*').eq('month', month).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const generate = useMutation({
    mutationFn: async (payload: { transactions: unknown[]; categories: unknown[] }) => {
      const { data, error } = await supabase.functions.invoke('claude-proxy', {
        body: { feature: 'budget_forecast', payload },
      });
      if (error) throw new Error(error.message);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { error: upsertErr } = await supabase.from('budget_forecasts').upsert({
        user_id: user.id, month,
        forecast_json: data.data,
        generated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,month' });
      if (upsertErr) throw upsertErr;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['budget-forecast'] }),
  });

  return { forecast, isLoading, generate };
}

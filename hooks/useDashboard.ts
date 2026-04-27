'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';

export function useDailyBrief() {
  const qc = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: brief, isLoading } = useQuery({
    queryKey: ['daily-brief', today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_briefs').select('*').eq('date', today).maybeSingle();
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 30,
  });

  const generate = useMutation({
    mutationFn: async () => {
      const [ouraRes, todosRes, transRes, mealRes, bookRes] = await Promise.allSettled([
        supabase.from('oura_daily_data').select('*').eq('date', today).maybeSingle(),
        supabase.from('todos').select('title,priority,due_date').eq('completed', false).order('priority'),
        supabase.from('transactions').select('amount,type,date').gte('date', today.slice(0, 7) + '-01').lte('date', today),
        supabase.from('meal_plans').select('plan_json,title').order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('books').select('title,author').eq('status', 'reading').limit(1).maybeSingle(),
      ]);

      const context = {
        date: today,
        oura_today:          ouraRes.status === 'fulfilled' ? ouraRes.value.data : null,
        open_todos:          todosRes.status === 'fulfilled' ? todosRes.value.data ?? [] : [],
        current_meal_plan:   mealRes.status === 'fulfilled'  ? mealRes.value.data  : null,
        current_book:        bookRes.status === 'fulfilled'   ? bookRes.value.data  : null,
        recent_transactions: transRes.status === 'fulfilled'  ? transRes.value.data ?? [] : [],
      };

      const { data, error } = await supabase.functions.invoke('daily-brief', { body: { context } });
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['daily-brief', today] }),
  });

  return { brief, isLoading, generate };
}

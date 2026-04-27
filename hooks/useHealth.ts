'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';

export function useWeightLog() {
  const qc = useQueryClient();
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['weight-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('weight_logs').select('*').order('logged_at', { ascending: false }).limit(90);
      if (error) throw error;
      return data;
    },
  });

  const latestWeight = logs[0]?.weight_kg ?? null;
  const chartData = [...logs].reverse().map(l => ({ date: l.logged_at.slice(0, 10), weight: l.weight_kg }));

  const addWeight = useMutation({
    mutationFn: async (weight_kg: number) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('weight_logs').insert({
        user_id: user.id, weight_kg, logged_at: new Date().toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['weight-logs'] }),
  });

  return { logs, latestWeight, chartData, isLoading, addWeight };
}

export function useOuraToday() {
  const today = format(new Date(), 'yyyy-MM-dd');
  return useQuery({
    queryKey: ['oura-today', today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('oura_daily_data').select('*').eq('date', today).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useWorkoutPlan() {
  const qc = useQueryClient();
  const { data: plan, isLoading } = useQuery({
    queryKey: ['workout-plan'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workout_plans').select('*').eq('active', true).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const generate = useMutation({
    mutationFn: async (payload: { profile: unknown; oura_history: unknown[] }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase.functions.invoke('claude-proxy', {
        body: { feature: 'workout_plan', payload },
      });
      if (error) throw new Error(error.message);
      await supabase.from('workout_plans').update({ active: false }).eq('user_id', user.id);
      const { error: insertErr } = await supabase.from('workout_plans').insert({
        user_id: user.id, title: 'My Workout Plan',
        plan_json: data.data, active: true,
      });
      if (insertErr) throw insertErr;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workout-plan'] }),
  });

  return { plan, isLoading, generate };
}

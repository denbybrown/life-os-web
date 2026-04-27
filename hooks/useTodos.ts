'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';

export function useTodos() {
  const qc = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: todos = [], isLoading } = useQuery({
    queryKey: ['todos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('todos').select('*')
        .order('priority').order('due_date', { ascending: true, nullsFirst: false });
      if (error) throw error;
      return data;
    },
  });

  const open    = todos.filter(t => !t.completed);
  const done    = todos.filter(t =>  t.completed);
  const overdue = open.filter(t => t.due_date && t.due_date < today);

  const addTodo = useMutation({
    mutationFn: async (input: { title: string; notes?: string; due_date?: string; priority?: number }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('todos').insert({
        ...input, user_id: user.id, priority: input.priority ?? 2,
        source_module: 'manual', completed: false,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['todos'] }),
  });

  const completeTodo = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('todos').update({ completed: true, completed_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['todos'] }),
  });

  const uncompleteTodo = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('todos').update({ completed: false, completed_at: null }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['todos'] }),
  });

  const deleteTodo = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('todos').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['todos'] }),
  });

  return { todos, open, done, overdue, isLoading, addTodo, completeTodo, uncompleteTodo, deleteTodo };
}

'use client';
import { useEffect } from 'react';
import { cn } from '@/lib/utils';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Sheet */}
      <div className={cn(
        'relative bg-surface rounded-t-3xl px-5 pt-3 pb-safe',
        'max-h-[92dvh] overflow-y-auto',
        'animate-in slide-in-from-bottom duration-300',
      )}>
        {/* Handle */}
        <div className="w-9 h-1 bg-border rounded-full mx-auto mb-4" />
        <h2 className="text-tx text-lg font-bold mb-5">{title}</h2>
        {children}
        <div className="h-6" />
      </div>
    </div>
  );
}

import React from 'react';
import { cn } from '../../lib/utils';

interface KbdProps {
  children: React.ReactNode;
  className?: string;
}

export const Kbd = ({ children, className }: KbdProps) => {
  return (
    <kbd className={cn(
      "bg-slate-100 px-1 rounded border border-slate-300 font-sans shadow-sm text-slate-700 mx-0.5",
      className
    )}>
      {children}
    </kbd>
  );
};

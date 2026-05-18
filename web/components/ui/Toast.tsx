"use client";

import { useEffect, useState } from "react";

let nextId = 0;
type ToastEntry = { id: number; message: string };

const listeners = new Set<(toasts: ToastEntry[]) => void>();
let toasts: ToastEntry[] = [];

function emit() {
  listeners.forEach((l) => l([...toasts]));
}

export function showToast(message: string, durationMs = 2000) {
  const id = nextId++;
  toasts = [...toasts, { id, message }];
  emit();
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    emit();
  }, durationMs);
}

export function ToastHost() {
  const [items, setItems] = useState<ToastEntry[]>([]);
  useEffect(() => {
    listeners.add(setItems);
    return () => {
      listeners.delete(setItems);
    };
  }, []);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[400] flex flex-col gap-2">
      {items.map((t) => (
        <div
          key={t.id}
          className="bg-text-primary text-white text-[13px] px-4 py-2 rounded-[10px] shadow-lg"
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}

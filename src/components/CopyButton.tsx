"use client";
import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CopyButton({ text, label, className = "btn btn-ghost btn-sm" }: { text: string; label: string; className?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className={className}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1800);
        } catch {
          window.prompt("Copy this:", text);
        }
      }}
    >
      {done ? <Check size={15} /> : <Copy size={15} />} {done ? "Copied" : label}
    </button>
  );
}

"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";

export function HeroCapsule() {
  const router = useRouter();
  const [id, setId] = useState("");
  const valid = /^[1-9]\d{0,17}$/.test(id.trim());
  return (
    <form
      className="capsule max-w-[520px]"
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) router.push(`/s/${id.trim()}`);
      }}
    >
      <Search size={18} className="shrink-0 text-stone" aria-hidden />
      <input inputMode="numeric" placeholder="Split id, e.g. 2" aria-label="Split id" value={id} onChange={(e) => setId(e.target.value.replace(/\D/g, ""))} />
      <button type="submit" className="btn btn-primary shrink-0" disabled={!valid}>Open</button>
    </form>
  );
}

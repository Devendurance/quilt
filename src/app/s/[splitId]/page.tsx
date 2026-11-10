import { Suspense } from "react";
import { SplitClient } from "./SplitClient";

export default function SplitPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-[760px] px-5 py-16"><div className="skeleton h-64" /></div>}>
      <SplitClient />
    </Suspense>
  );
}

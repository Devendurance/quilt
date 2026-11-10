import type { Metadata } from "next";
import { CreateClient } from "./CreateClient";

export const metadata: Metadata = { title: "Create a split | Quilt" };

export default function CreatePage() {
  return <CreateClient />;
}

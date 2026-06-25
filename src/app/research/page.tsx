import { Suspense } from "react";
import { ResearchView } from "@/components/research/research-view";

export const metadata = { title: "Company Research – AlphaEdge" };

export default function ResearchPage() {
  return (
    <Suspense fallback={null}>
      <ResearchView />
    </Suspense>
  );
}

import { Suspense } from "react";
import { TrackerView } from "@/components/tracker/tracker-view";

export const metadata = { title: "News Tracker – AlphaEdge" };

export default function TrackerPage() {
  return (
    <Suspense fallback={null}>
      <TrackerView />
    </Suspense>
  );
}

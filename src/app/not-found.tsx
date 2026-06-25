import Link from "next/link";
import { Search, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <div className="bg-gradient-to-b from-accent to-transparent bg-clip-text text-7xl font-black text-transparent">
        404
      </div>
      <h1 className="mt-2 text-xl font-bold">Security not found</h1>
      <p className="mt-1 max-w-sm text-sm text-muted">
        We couldn&rsquo;t find that ticker or page. It may be delisted, or the URL is off.
      </p>
      <div className="mt-5 flex gap-2">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-accent-dim"
        >
          <Home className="h-4 w-4" /> Dashboard
        </Link>
        <Link
          href="/search"
          className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium transition-colors hover:border-[#3a3a3a]"
        >
          <Search className="h-4 w-4" /> Search
        </Link>
      </div>
    </div>
  );
}

import Link from "next/link";
import { Mountain } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border bg-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 sm:grid-cols-2 sm:px-8 lg:grid-cols-[1fr_auto_auto] lg:px-10">
        <div>
          <Link href="/" className="inline-flex items-center gap-2 font-semibold tracking-tight" aria-label="GoChitral home">
            <Mountain size={18} className="text-primary" aria-hidden="true" /> GoChitral
          </Link>
          <p className="mt-3 max-w-sm text-sm leading-6 text-muted">Made for discovering Chitral, one journey at a time.</p>
        </div>
        <div className="grid content-start gap-3 text-sm">
          <p className="font-semibold text-foreground">Explore</p>
          <Link className="text-muted hover:text-primary" href="/places">Destinations & places</Link>
          <Link className="text-muted hover:text-primary" href="/activities">Experiences</Link>
          <Link className="text-muted hover:text-primary" href="/places?category=FOOD">Food & dining</Link>
          <Link className="text-muted hover:text-primary" href="/tourist">Plan a trip</Link>
        </div>
        <div className="grid content-start gap-3 text-sm">
          <p className="font-semibold text-foreground">For providers</p>
          <Link className="text-muted hover:text-primary" href="/register/guide">Become a guide</Link>
          <Link className="text-muted hover:text-primary" href="/register/hotel">List a hotel</Link>
        </div>
      </div>
      <div className="border-t border-border px-5 py-4 text-center text-xs text-muted sm:px-8 lg:px-10">© GoChitral</div>
    </footer>
  );
}

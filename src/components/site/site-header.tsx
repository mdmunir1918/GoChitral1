import Link from "next/link";
import { Mountain, Menu } from "lucide-react";
import { connection } from "next/server";
import { auth } from "@/auth";
import { accountHome } from "@/lib/authz";

const publicLinks = [
  { href: "/places", label: "Destinations" },
  { href: "/activities", label: "Experiences" },
  { href: "/hotels", label: "Hotels" },
  { href: "/guides", label: "Local guides" },
];

function Brand() {
  return (
    <Link href="/" className="inline-flex items-center gap-3" aria-label="GoChitral home">
      <span className="flex size-10 items-center justify-center rounded-full bg-primary text-white"><Mountain size={20} aria-hidden="true" /></span>
      <span className="text-lg font-semibold tracking-tight">Go<span className="text-primary">Chitral</span></span>
    </Link>
  );
}

export function SiteHeaderFallback() {
  return <header className="relative z-20 border-b border-border/80 bg-background/95"><div className="mx-auto flex min-h-18 max-w-7xl items-center px-5 sm:px-8 lg:px-10"><Brand /></div></header>;
}

export async function SiteHeader() {
  await connection();
  const session = await auth();
  const signedIn = Boolean(session?.user);
  const profileHref = session?.user ? accountHome(session.user.accountType) : "/login";
  const planHref = "/tourist/trips";
  return (
    <header className="relative z-20 border-b border-border/80 bg-background/95">
      <div className="mx-auto flex min-h-18 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8 lg:px-10">
        <Brand />
        <nav className="hidden items-center gap-6 text-sm text-muted lg:flex" aria-label="Main navigation">
          {publicLinks.map((link) => <Link key={link.label} href={link.href} className="transition-colors hover:text-primary">{link.label}</Link>)}
          <Link href={planHref} className="font-semibold text-primary">Plan a trip</Link>
        </nav>
        <div className="hidden items-center gap-4 lg:flex">
          {signedIn ? <Link href={profileHref} className="text-sm font-semibold text-primary hover:underline">Profile</Link> : <><Link href="/login" className="text-sm font-medium text-muted transition-colors hover:text-primary">Sign in</Link><Link href="/register" className="inline-flex h-9 items-center justify-center rounded-full bg-primary px-4 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90">Create account</Link></>}
        </div>
        <details className="group relative lg:hidden">
          <summary className="flex size-10 cursor-pointer list-none items-center justify-center rounded-full border border-border text-foreground marker:hidden" aria-label="Toggle navigation menu"><Menu size={19} aria-hidden="true" /></summary>
          <nav className="absolute right-0 top-12 z-30 grid w-56 gap-1 rounded-2xl border border-border bg-white p-2 shadow-xl" aria-label="Main navigation menu">
            {publicLinks.map((link) => <Link key={link.label} href={link.href} className="rounded-xl px-3 py-2.5 text-sm text-foreground hover:bg-background">{link.label}</Link>)}
            <Link href={planHref} className="rounded-xl px-3 py-2.5 text-sm font-semibold text-primary hover:bg-background">Plan a trip</Link>
            <div className="my-1 border-t border-border" />
            {signedIn ? <Link href={profileHref} className="rounded-xl bg-primary px-3 py-2.5 text-sm font-medium text-white">Profile</Link> : <><Link href="/login" className="rounded-xl px-3 py-2.5 text-sm text-foreground hover:bg-background">Sign in</Link><Link href="/register" className="rounded-xl bg-primary px-3 py-2.5 text-sm font-medium text-white">Create account</Link></>}
          </nav>
        </details>
      </div>
    </header>
  );
}

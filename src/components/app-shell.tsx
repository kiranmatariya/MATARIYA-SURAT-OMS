"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { authClient } from "@/lib/auth-client";

const navItems = [
  { label: "Dashboard", href: "/", icon: "grid", enabled: true },
  { label: "Dealers", href: "/dealers", icon: "users", enabled: true },
  { label: "Products", href: "/products", icon: "box", enabled: true },
  { label: "Orders", href: "/orders", icon: "file", enabled: true },
  { label: "Master Areas", href: "/settings/areas", icon: "map", enabled: true, adminOnly: true },
  { label: "Production Planning", href: "/production-planning", icon: "chart", enabled: true },
  { label: "Fan Rod Planning", href: "/fan-rod-planning", icon: "settings", enabled: true },
  { label: "Dispatch", href: "/dispatches", icon: "truck", enabled: true },
  { label: "Settings", href: "/settings/users", icon: "settings", enabled: true, adminOnly: true },
] as const;

function Icon({ name }: { name: string }) {
  const paths: Record<string, ReactNode> = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,
    box: <><path d="m21 8-9-5-9 5 9 5 9-5Z"/><path d="m3 8 9 5 9-5v8l-9 5-9-5Z"/></>,
    file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 13h8M8 17h6"/></>,
    chart: <><path d="M3 3v18h18"/><path d="m7 16 4-5 4 3 5-7"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V21h-4v-.09A1.7 1.7 0 0 0 9 19.37a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.63 15 1.7 1.7 0 0 0 3.09 14H3v-4h.09A1.7 1.7 0 0 0 4.63 9a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.63h.01A1.7 1.7 0 0 0 10 3.09V3h4v.09A1.7 1.7 0 0 0 15 4.63a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.37 9v.01A1.7 1.7 0 0 0 20.91 10H21v4h-.09A1.7 1.7 0 0 0 19.4 15Z"/></>,
    truck: <><path d="M3 6h11v10H3zM14 10h4l3 3v3h-7z"/><circle cx="7" cy="18" r="2"/><circle cx="18" cy="18" r="2"/></>,
    map: <><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3Z"/><path d="M9 3v15M15 6v15"/></>,
  };
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const reviewMode = process.env.NEXT_PUBLIC_DATA_PROVIDER !== "postgres";
  if (pathname === "/login") return <>{children}</>;

  return (
    <div className="min-h-screen min-w-0 bg-slate-50 lg:grid lg:grid-cols-[260px_1fr]">
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-800 bg-slate-950 px-4 text-white print:hidden lg:hidden"><Link href="/" className="flex min-w-0 items-center gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-blue-600 text-sm font-bold">M</span><span className="truncate font-bold">Matariya OMS</span></Link><button type="button" aria-label="Open navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen((value) => !value)} className="grid h-11 w-11 place-items-center rounded-lg border border-slate-700 text-2xl">{menuOpen ? "×" : "☰"}</button></header>
      {menuOpen && <button aria-label="Close navigation" onClick={() => setMenuOpen(false)} className="fixed inset-0 z-40 bg-slate-950/60 print:hidden lg:hidden"/>}
      <aside className={`fixed inset-y-0 left-0 z-50 w-[min(86vw,320px)] overflow-y-auto border-r border-slate-800 bg-slate-950 px-5 py-5 text-white transition-transform duration-200 print:hidden ${menuOpen ? "translate-x-0" : "-translate-x-full"} lg:w-[260px] lg:translate-x-0`}>
        <Link href="/" className="flex items-center gap-3 px-2">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600 text-sm font-bold">M</span>
          <span><strong className="block text-base">Matariya Surat OMS</strong><small className="text-xs text-slate-400">Surat City · Independent</small></span>
        </Link>
        <div className="mt-5 flex items-center justify-between border-y border-slate-800 py-4 lg:hidden"><div><p className="text-sm font-semibold">{session?.user.name ?? "Signed in"}</p><p className="text-xs text-slate-400">{session?.user.role === "ADMIN" ? "Admin" : "Office Staff"}</p></div><button type="button" onClick={() => setMenuOpen(false)} className="h-10 rounded-lg border border-slate-700 px-3 text-sm font-bold">Close</button></div>
        <nav className="mt-6 grid grid-cols-1 gap-1 lg:mt-10" aria-label="Main navigation">
          {navItems.filter((item) => reviewMode || !("adminOnly" in item && item.adminOnly && session?.user.role !== "ADMIN")).map((item) => {
            const active = item.enabled && (pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href)));
            return item.enabled ? (
              <Link key={item.label} href={item.href} onClick={() => setMenuOpen(false)} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${active ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"}`}>
                <Icon name={item.icon}/><span>{item.label}</span>
              </Link>
            ) : (
              <span key={item.label} title="Coming in a future phase" className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600">
                <Icon name={item.icon}/><span>{item.label}</span>
              </span>
            );
          })}
        </nav>
        <div className="mt-6 grid gap-2 border-t border-slate-800 pt-5 lg:hidden"><Link href="/settings/account" onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-800">My Account</Link><button className="rounded-lg border border-slate-700 px-3 py-2.5 text-left text-sm font-semibold text-slate-300" onClick={async()=>{await authClient.signOut();router.push("/login");router.refresh();}}>Logout</button></div>
        <div className="mt-8 hidden border-t border-slate-800 pt-5 text-xs text-slate-500 lg:block">Phase 6 · Production Planning</div>
      </aside>
      <main className="min-w-0 overflow-hidden p-4 sm:p-6 lg:col-start-2 lg:p-10">
        <div className="mb-6 hidden justify-end print:hidden lg:flex">
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2 shadow-sm">
            <div><p className="text-sm font-semibold text-slate-900">{session?.user.name ?? "Signed in"}</p><p className="text-xs text-slate-500">{session?.user.role === "ADMIN" ? "Admin" : "Office Staff"}</p></div>
            <Link href="/settings/account" className="text-xs font-semibold text-blue-700">My Account</Link><button className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50" onClick={async()=>{await authClient.signOut();router.push("/login");router.refresh();}}>Logout</button>
          </div>
        </div>
        {children}
      </main>
    </div>
  );
}

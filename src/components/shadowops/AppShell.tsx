import { BrandMark, Wordmark } from "@/components/shadowops/brand";
import { ToneDot } from "@/components/shadowops/primitives";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { LogOut } from "lucide-react";
import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router";

const NAV = [
  { to: "/dashboard", label: "Command Center" },
  { to: "/intelligence", label: "Intelligence" },
  { to: "/memory", label: "Memory" },
  { to: "/workflows", label: "Workflows" },
  { to: "/organization-3d", label: "3D Twin" },
  { to: "/ingest", label: "Ingest" },
  { to: "/system", label: "System" },
];

export function AppShell() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link to="/dashboard" className="flex items-center gap-2.5">
            <BrandMark size={30} />
            <Wordmark compact />
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors",
                    isActive
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-2 rounded-full border border-border bg-card px-3 py-1 lg:inline-flex">
              <ToneDot tone="success" pulse />
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Memory engine connected
              </span>
            </span>
            <div className="relative">
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent/60"
              >
                <span className="flex size-7 items-center justify-center rounded-full bg-primary/20 font-mono text-xs font-bold text-[#8B93F8]">
                  {(user?.name ?? user?.email ?? "S")[0].toUpperCase()}
                  {menuOpen ? "▾" : ""}
                </span>
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-10 w-48 rounded-lg border border-border bg-popover p-1 shadow-xl">
                  <div className="px-3 py-2">
                    <p className="truncate text-xs font-medium">{user?.name ?? "Analyst"}</p>
                    <p className="truncate font-mono text-[10px] text-muted-foreground">{user?.email}</p>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
                  >
                    <LogOut className="size-3.5" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* mobile nav */}
        <nav className="flex gap-1 overflow-x-auto border-t border-border/60 px-3 py-1.5 md:hidden">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-medium",
                  isActive ? "bg-accent text-foreground" : "text-muted-foreground",
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-border/60 py-4">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 font-mono text-[10px] text-muted-foreground/70 sm:px-6">
          <span>SHADOWOPS · WORKFLOW THROUGH MEMORY</span>
          <span className="flex items-center gap-1.5">
            Powered by hindsight memory
            <ToneDot tone="memory" pulse />
          </span>
        </div>
      </footer>
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 pb-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-discovery/80">{eyebrow}</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">{title}</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

export function AskButton({ label = "Ask ShadowOps" }: { label?: string }) {
  return (
    <Button asChild className="bg-discovery text-[#06222B] hover:bg-discovery/85">
      <Link to="/intelligence">
        {label}
      </Link>
    </Button>
  );
}

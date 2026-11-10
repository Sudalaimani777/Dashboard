import React, { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, ChevronDown, Menu, X } from "lucide-react";
import { useAuth } from "../../auth/hooks/useAuth";

export type NavItem = {
  label: string;
  href?: string;
  panelId?: "workflows" | "governance" | "portals";
};

export type FeatureCard = {
  title: string;
  description?: string;
  mediaType?: "component" | "image";
  imageSrc?: string;
  component?: ReactNode;
  href?: string;
};

export type MenuPanel = {
  id: NonNullable<NavItem["panelId"]>;
  items: FeatureCard[];
};

const navItems: NavItem[] = [
  { label: "Governance", panelId: "governance" },
  { label: "Portals", panelId: "portals" },
  { label: "Overview", href: "#budgets" },
];

const menuPanels: MenuPanel[] = [
  {
    id: "governance",
    items: [
      {
        title: "₹35L Fiscal Safeguards",
        description: "Real-time headroom monitoring across departments preventing budget overruns before approval.",
        href: "#budgets",
      },
      {
        title: "Dual-Route Revisions",
        description: "Admin dispatches to Manager (Route A) or direct to Employee (Route B) with zero manager bypass.",
        href: "#governance",
      },
      {
        title: "Immutable 10-State Ledger",
        description: "Auditable timeline records tracking every approval, revision remark, and settlement timestamp.",
        href: "#audit",
      },
    ],
  },
  {
    id: "portals",
    items: [
      {
        title: "Employee Portal",
        description: "Itemized expense table in ₹, quote/tax uploads, and 1-click resubmission with correction notes.",
        href: "/signin",
      },
      {
        title: "Line Manager Queue",
        description: "Tier 1 review drawer, direct reports filter, policy checklists, and forward actions.",
        href: "/signin",
      },
      {
        title: "Admin Governance Hub",
        description: "Tier 2 executive clearance, ₹35L headroom tracking, and payroll disbursement settlement.",
        href: "/signin",
      },
    ],
  },
];

function getPanel(panelId: string | null) {
  return menuPanels.find((panel) => panel.id === panelId);
}

export function TripFlowLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2B231D] text-white shadow-sm ring-1 ring-[#8A582B]/20">
        <span className="font-bold text-sm tracking-tight text-[#FAF8F5]">TF</span>
      </div>
      <div className="flex flex-col">
        <span className="font-bold text-base leading-none tracking-tight text-[#2B231D]">TripFlow</span>
      </div>
    </div>
  );
}

function PanelCard({ item, compact = false }: { item: FeatureCard; compact?: boolean }) {
  if (item.component || item.imageSrc) {
    return (
      <div className="group relative flex h-[180px] flex-col justify-between overflow-hidden rounded-xl border border-[#3E342B] bg-[#261E18]/80 p-3 transition-all duration-300 hover:border-[#8A582B]/60 hover:bg-[#2D241E]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(138,88,43,0.12),transparent_60%)] opacity-0 transition-opacity group-hover:opacity-100" />
        {item.component}
        <span className="relative z-10 mt-auto block text-center text-xs font-medium text-[#C8BDB0] transition-colors group-hover:text-white">
          {item.title}
        </span>
      </div>
    );
  }

  return (
    <a
      href={item.href || "#"}
      className={
        compact
          ? "group relative flex h-[86px] flex-col justify-center overflow-hidden rounded-xl border border-[#3E342B] bg-[#261E18]/80 p-3 transition-all hover:border-[#8A582B]/60 hover:bg-[#2D241E]"
          : "group relative flex min-h-[132px] flex-col justify-between overflow-hidden rounded-xl border border-[#3E342B] bg-[#261E18]/80 p-4 transition-all hover:border-[#8A582B]/60 hover:bg-[#2D241E]"
      }
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(138,88,43,0.08),transparent_60%)] opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="relative z-10">
        <h4 className={compact ? "text-sm font-semibold text-[#FAF8F5]" : "text-base font-semibold text-[#FAF8F5]"}>
          {item.title}
        </h4>
        <p className="mt-1 text-[11px] leading-relaxed text-[#A59B90] transition-colors group-hover:text-[#DCD3C5]">
          {item.description}
        </p>
      </div>
      {!compact && (
        <span className="relative z-10 mt-4 text-[11px] font-medium text-[#D4A373] flex items-center gap-1 group-hover:text-white transition-colors">
          Explore workflow <ArrowRight className="size-3" />
        </span>
      )}
    </a>
  );
}

function DropdownPanel({ panel }: { panel: MenuPanel }) {
  return (
    <div className="grid grid-cols-3 gap-4 bg-[#231C17] p-5">
      {panel.items.map((item) => (
        <PanelCard key={item.title} item={item} />
      ))}
    </div>
  );
}

export const TripFlowNavbar: React.FC = () => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileActiveMenu, setMobileActiveMenu] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();
  const activePanel = getPanel(activeMenu);

  const toggleMenu = (menuName: string) =>
    setActiveMenu(activeMenu === menuName ? null : menuName);

  return (
    <header className="sticky top-0 z-50 w-full bg-[#F7F4EE]/90 backdrop-blur-md transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center">
          <TripFlowLogo />
        </Link>

        {/* Desktop Dynamic Island Floating Menu */}
        <div
          className="absolute left-1/2 top-0 hidden w-[720px] -translate-x-1/2 lg:block"
          style={{ filter: "drop-shadow(0 10px 24px rgba(43, 35, 29, 0.22))" }}
        >
          {/* SVG Notch Curved Corners matching #2B231D */}
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="pointer-events-none absolute -left-[19px] top-0 z-10 text-[#2B231D]"
          >
            <path d="M 20 20 L 20 0 L 0 0 C 11.046 0 20 11.046 20 20 Z" fill="currentColor" />
          </svg>
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="pointer-events-none absolute -right-[19px] top-0 z-10 text-[#2B231D]"
          >
            <path d="M 0 0 L 20 0 C 8.954 0 0 8.954 0 20 Z" fill="currentColor" />
          </svg>

          <motion.div
            animate={{ height: activePanel ? 275 : 48 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="relative flex w-full flex-col justify-start overflow-hidden bg-[#2B231D] border-x border-b border-[#3D332B]"
            style={{ borderBottomLeftRadius: "18px", borderBottomRightRadius: "18px" }}
          >
            <div className="z-20 flex h-12 items-center justify-center px-6">
              <nav className="flex w-full items-center justify-center gap-5 text-xs font-medium text-[#C8BDB0]">
                {navItems.map((item) =>
                  item.panelId ? (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => toggleMenu(item.panelId!)}
                      className={`flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1 outline-none transition-all hover:text-white ${
                        activeMenu === item.panelId ? "bg-[#3D332B] text-white font-semibold" : "text-[#C8BDB0]"
                      }`}
                    >
                      {item.label}
                      <ChevronDown
                        className={`size-3.5 opacity-75 transition-transform duration-300 ${
                          activeMenu === item.panelId ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                  ) : (
                    <a
                      key={item.label}
                      href={item.href}
                      className="px-2 py-1 text-[#C8BDB0] transition-colors duration-200 hover:text-white"
                    >
                      {item.label}
                    </a>
                  )
                )}
              </nav>
            </div>

            <AnimatePresence mode="wait">
              {activePanel && (
                <motion.div
                  key={activePanel.id}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18 }}
                  className="overflow-hidden border-t border-[#3E342B] bg-[#231C17]"
                >
                  <DropdownPanel panel={activePanel} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Right CTA / Auth Status */}
        <div className="hidden lg:flex items-center gap-3">
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="group flex items-center gap-1.5 rounded-xl bg-[#8A582B] px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#754820]"
            >
              Go to Portal
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          ) : (
            <>
              <Link
                to="/signin"
                className="text-xs font-semibold text-[#2B231D] hover:text-[#8A582B] px-3 py-2 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="group flex items-center gap-1.5 rounded-xl bg-[#8A582B] px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#754820]"
              >
                Create Account
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </>
          )}
        </div>

        {/* Mobile Toggle Button */}
        <div className="flex items-center gap-2 lg:hidden">
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="rounded-lg bg-[#8A582B] px-3 py-1.5 text-xs font-semibold text-white"
            >
              Portal
            </Link>
          ) : (
            <Link
              to="/signin"
              className="rounded-lg bg-[#8A582B] px-3 py-1.5 text-xs font-semibold text-white"
            >
              Sign In
            </Link>
          )}
          <button
            onClick={() => setMobileOpen((open) => !open)}
            aria-label="Toggle mobile menu"
            className="grid size-9 place-items-center rounded-xl border border-[#E8DFD3] bg-[#FAF8F5] text-[#2B231D]"
          >
            {mobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="relative z-40 w-full overflow-hidden border-b border-[#3D332B] bg-[#2B231D] text-[#FAF8F5] shadow-xl lg:hidden"
          >
            <div className="grid gap-1.5 p-5">
              {navItems.map((item) => {
                const panel = item.panelId ? getPanel(item.panelId) : null;
                const isOpen = mobileActiveMenu === item.panelId;

                if (!item.panelId) {
                  return (
                    <a
                      key={item.label}
                      href={item.href || "#"}
                      className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-[#C8BDB0] hover:bg-white/10 hover:text-white"
                    >
                      {item.label}
                    </a>
                  );
                }

                return (
                  <div key={item.label}>
                    <button
                      type="button"
                      onClick={() => setMobileActiveMenu(isOpen ? null : item.panelId!)}
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-[#C8BDB0] hover:bg-white/10 hover:text-white"
                    >
                      {item.label}
                      <ChevronDown
                        className={`size-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
                      />
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen && panel && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="mx-2 mb-2 grid gap-2 border-l border-[#8A582B]/30 pl-3 pt-1">
                            {panel.items.map((panelItem) => (
                              <a
                                key={panelItem.title}
                                href={panelItem.href || "#"}
                                className="rounded-md px-3 py-2 hover:bg-white/5"
                              >
                                <span className="block text-sm font-medium text-white">
                                  {panelItem.title}
                                </span>
                                {panelItem.description && (
                                  <span className="mt-0.5 block text-xs leading-relaxed text-[#A59B90]">
                                    {panelItem.description}
                                  </span>
                                )}
                              </a>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export const Navbar = TripFlowNavbar;
export default Navbar;

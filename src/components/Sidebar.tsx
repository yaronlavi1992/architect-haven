import { Link, useLocation } from "react-router-dom";
import { useConvexAuth } from "convex/react";
import { Drawer } from "vaul";
import { useState, useEffect } from "react";
import { PanelLeft } from "lucide-react";
import { SignOutButton } from "../SignOutButton";
import { useSidebar } from "../contexts/SidebarContext";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: "dashboard" },
  { name: "Buildings", href: "/buildings", icon: "buildings" },
  { name: "Settings", href: "/settings", icon: "settings" },
];

function getIcon(iconName: string, className = "w-5 h-5") {
  switch (iconName) {
    case "dashboard":
      return (
        <svg
          className={className}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z"
          />
        </svg>
      );
    case "buildings":
      return (
        <svg
          className={className}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        </svg>
      );
    case "settings":
      return (
        <svg
          className={className}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-1.065-2.572c1.756-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-1.065-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      );
    default:
      return null;
  }
}

function SidebarContent({
  onNavigate,
  showTitle = true,
}: {
  onNavigate?: () => void;
  showTitle?: boolean;
}) {
  const location = useLocation();
  const { isAuthenticated } = useConvexAuth();

  const linkClass = (isActive: boolean) =>
    `flex items-center px-4 py-3 rounded-lg transition-colors ${
      isActive
        ? "bg-blue-600 text-white"
        : "text-gray-300 hover:bg-gray-700 hover:text-white"
    }`;

  return (
    <>
      {showTitle && (
        <div className="p-6">
          <h1
            className="text-xl font-bold pl-8"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            Architect Haven
          </h1>
        </div>
      )}
      <nav className="flex-1 px-4 min-w-0">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <li key={item.name}>
                <Link
                  to={item.href}
                  className={linkClass(isActive)}
                  onClick={onNavigate}
                >
                  {getIcon(item.icon)}
                  <span className="ml-3">{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      {isAuthenticated && (
        <div className="p-4 border-t border-gray-700">
          <SignOutButton />
        </div>
      )}
    </>
  );
}

const iconClass = "w-5 h-5";

const topSafeOffset = "top-[max(0.5rem,env(safe-area-inset-top,0px))]";

const MD_BREAKPOINT = 768;

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth >= MD_BREAKPOINT : true,
  );
  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${MD_BREAKPOINT}px)`);
    const fn = () => setIsDesktop(mq.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);
  return isDesktop;
}

export default function Sidebar() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { collapsed, setCollapsed } = useSidebar();
  const isDesktop = useIsDesktop();

  const sidebarVisible = isDesktop ? !collapsed : drawerOpen;

  useEffect(() => {
    if (isDesktop) setDrawerOpen(false);
  }, [isDesktop]);

  const handleToggle = () => {
    if (isDesktop) {
      setCollapsed(!collapsed);
    } else {
      setDrawerOpen((d) => !d);
    }
  };

  return (
    <>
      {/* Fixed icons bar at top-left on all screen sizes (t3 pattern); same position for expand/collapse */}
      <div
        className={`flex pointer-events-auto fixed ${topSafeOffset} left-2 z-[100] flex-row gap-0.5 p-1 rounded-lg bg-[#111827]/90 border border-gray-700/50 backdrop-blur-sm`}
      >
        <button
          type="button"
          onClick={handleToggle}
          className="inline-flex items-center justify-center rounded-md size-8 text-gray-400 hover:text-white hover:bg-gray-700/80 transition-colors flex-shrink-0"
          aria-label={sidebarVisible ? "Collapse sidebar" : "Expand sidebar"}
        >
          {sidebarVisible ? (
            <PanelLeft className={iconClass} />
          ) : (
            <PanelLeft className={iconClass} />
          )}
        </button>
      </div>
      {/* Desktop: sidebar panel when expanded */}
      <aside
        aria-hidden={collapsed}
        className={`hidden md:flex bg-[#111827] text-white flex-col flex-shrink-0 overflow-hidden transition-[width] duration-200 ease-out ${
          collapsed ? "w-0" : "w-64"
        }`}
      >
        <div className="flex items-center flex-shrink-0 min-h-[57px] pl-14 pr-4 pt-2">
          <h1
            className="text-xl font-bold truncate min-w-0 flex-1"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            Architect Haven
          </h1>
        </div>
        <SidebarContent showTitle={false} />
      </aside>

      {/* Mobile: Vaul drawer (opened by same bar button) */}
      <Drawer.Root
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        direction="left"
      >
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40" />
          <Drawer.Content className="fixed inset-y-0 left-0 w-64 bg-[#111827] text-white flex flex-col outline-none">
            <SidebarContent onNavigate={() => setDrawerOpen(false)} />
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </>
  );
}

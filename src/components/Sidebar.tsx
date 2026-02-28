import { Link, useLocation } from "react-router-dom";
import { useConvexAuth } from "convex/react";
import { SignOutButton } from "../SignOutButton";

export default function Sidebar() {
  const location = useLocation();
  const { isAuthenticated } = useConvexAuth();

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: "dashboard" },
    { name: "Buildings", href: "/buildings", icon: "buildings" },
    { name: "Settings", href: "/settings", icon: "settings" },
  ];

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "dashboard":
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
          </svg>
        );
      case "buildings":
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        );
      case "settings":
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-1.065-2.572c1.756-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-1.065-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-64 bg-[#111827] text-white flex flex-col">
      <div className="p-6">
        <h1 className="text-xl font-bold" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          Architect Haven
        </h1>
      </div>

      <nav className="flex-1 px-4">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <li key={item.name}>
                <Link
                  to={item.href}
                  className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-gray-300 hover:bg-gray-700 hover:text-white"
                  }`}
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
    </div>
  );
}

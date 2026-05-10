"use client";

import { Menu, Sun, Moon, Bell } from "lucide-react";
import { useTheme } from "@/lib/theme";
import { usePathname } from "next/navigation";
import { adminNavItems } from "@/lib/admin-nav";

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();

  const currentPage = adminNavItems.find(
    (item) =>
      pathname === item.href ||
      (item.href !== "/admin/dashboard" && pathname.startsWith(item.href))
  );

  return (
    <header className="sticky top-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 md:px-6 h-20 flex items-center gap-4">
      <button
        onClick={onMenuClick}
        className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        <Menu className="w-5 h-5" />
      </button>

      <h1 className="font-semibold text-gray-900 dark:text-white flex-1">
        {currentPage?.label ?? "Dashboard"}
      </h1>

      <div className="flex items-center gap-2">
        <button
          onClick={toggleTheme}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? (
            <Sun className="w-4 h-4" />
          ) : (
            <Moon className="w-4 h-4" />
          )}
        </button>

        <button
          className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors relative"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}

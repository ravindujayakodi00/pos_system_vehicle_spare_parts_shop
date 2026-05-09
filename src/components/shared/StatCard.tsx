import { LucideIcon } from "lucide-react";

type Color = "blue" | "green" | "red" | "purple" | "indigo" | "teal" | "amber";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color?: Color;
  change?: number;
}

const colorMap: Record<Color, { bg: string; text: string; icon: string }> = {
  blue: {
    bg: "bg-blue-50 dark:bg-blue-900/20",
    text: "text-blue-700 dark:text-blue-400",
    icon: "text-blue-600 dark:text-blue-400",
  },
  green: {
    bg: "bg-green-50 dark:bg-green-900/20",
    text: "text-green-700 dark:text-green-400",
    icon: "text-green-600 dark:text-green-400",
  },
  red: {
    bg: "bg-red-50 dark:bg-red-900/20",
    text: "text-red-700 dark:text-red-400",
    icon: "text-red-600 dark:text-red-400",
  },
  purple: {
    bg: "bg-purple-50 dark:bg-purple-900/20",
    text: "text-purple-700 dark:text-purple-400",
    icon: "text-purple-600 dark:text-purple-400",
  },
  indigo: {
    bg: "bg-indigo-50 dark:bg-indigo-900/20",
    text: "text-indigo-700 dark:text-indigo-400",
    icon: "text-indigo-600 dark:text-indigo-400",
  },
  teal: {
    bg: "bg-teal-50 dark:bg-teal-900/20",
    text: "text-teal-700 dark:text-teal-400",
    icon: "text-teal-600 dark:text-teal-400",
  },
  amber: {
    bg: "bg-amber-50 dark:bg-amber-900/20",
    text: "text-amber-700 dark:text-amber-400",
    icon: "text-amber-600 dark:text-amber-400",
  },
};

export function StatCard({
  title,
  value,
  icon: Icon,
  color = "blue",
  change,
}: StatCardProps) {
  const c = colorMap[color];

  return (
    <div className="surface-panel p-6 flex items-center gap-4">
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${c.bg}`}
      >
        <Icon className={`w-6 h-6 ${c.icon}`} />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
          {title}
        </p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">
          {value}
        </p>
        {change !== undefined && (
          <p
            className={`text-xs mt-0.5 ${change >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
          >
            {change >= 0 ? "+" : ""}
            {change}% vs last month
          </p>
        )}
      </div>
    </div>
  );
}

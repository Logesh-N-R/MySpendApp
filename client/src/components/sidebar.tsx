import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";

interface SidebarItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  badge?: number;
}

const sidebarItems: SidebarItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: "fas fa-chart-line",
    path: "/",
  },
  {
    id: "expenses",
    label: "Expenses",
    icon: "fas fa-receipt",
    path: "/expenses",
  },
  {
    id: "groups",
    label: "Groups",
    icon: "fas fa-users",
    path: "/groups",
  },
  {
    id: "reports",
    label: "Reports",
    icon: "fas fa-chart-bar",
    path: "/reports",
  },
  {
    id: "categories",
    label: "Categories",
    icon: "fas fa-tags",
    path: "/categories",
  },
  {
    id: "settings",
    label: "Settings",
    icon: "fas fa-cog",
    path: "/settings",
  },
];

function UserProfile() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <Card className="bg-slate-700/50 border-slate-600 p-4">
      <div className="flex items-center space-x-3 mb-3">
        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
          <i className="fas fa-user text-white text-sm"></i>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{user.name || user.username}</p>
          <p className="text-xs text-slate-400 truncate">{user.email}</p>
        </div>
      </div>
      <Button
        onClick={logout}
        variant="ghost"
        className="w-full justify-start text-left h-10 px-3 text-slate-300 hover:text-white hover:bg-slate-600/50 transition-colors"
      >
        <i className="fas fa-sign-out-alt mr-3 text-sm"></i>
        <span className="text-sm">Sign Out</span>
      </Button>
    </Card>
  );
}

export function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="w-64 h-screen bg-slate-800 text-white fixed left-0 top-0 z-40 flex flex-col">
      {/* Logo/Brand */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <i className="fas fa-wallet text-white text-sm"></i>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-white">ExpenseOut</h1>
            <p className="text-xs text-slate-400">Smart Expense Tracker</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {sidebarItems.map((item) => {
          const isActive = location === item.path || (item.path !== "/" && location.startsWith(item.path));
          
          return (
            <Link key={item.id} href={item.path}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start text-left h-12 px-4 text-slate-300 hover:text-white hover:bg-slate-700/50 transition-colors",
                  isActive && "bg-blue-600 text-white hover:bg-blue-600/90"
                )}
              >
                <i className={cn(item.icon, "mr-3 text-base")}></i>
                <span className="font-medium">{item.label}</span>
                {item.badge && (
                  <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Button>
            </Link>
          );
        })}
      </nav>

      {/* User Profile Section */}
      <div className="p-4 border-t border-slate-700">
        <UserProfile />
      </div>
    </div>
  );
}
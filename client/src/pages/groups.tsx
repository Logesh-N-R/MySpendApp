import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/sidebar";
import { GroupList } from "@/components/group-list";
import { NotificationBell } from "@/components/notification-bell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { User } from "@shared/schema";

export default function Groups() {
  const { data: user } = useQuery<User>({
    queryKey: ["/api/user"],
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex transition-colors">
      <Sidebar />
      
      <div className="flex-1 ml-64">
        <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30 transition-colors">
          <div className="px-6 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Groups</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Manage expense groups and bill splitting</p>
              </div>
              
              <div className="flex items-center space-x-4">
                <NotificationBell />
              </div>
            </div>
          </div>
        </nav>

        <div className="p-6">
          <GroupList />
        </div>
      </div>
    </div>
  );
}
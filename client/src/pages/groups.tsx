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
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      
      <div className="flex-1 ml-64">
        <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
          <div className="px-6 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Groups</h1>
                <p className="text-sm text-gray-600 mt-1">Manage expense groups and bill splitting</p>
              </div>
              
              <div className="flex items-center space-x-4">
                <Button variant="outline" size="sm" className="text-blue-600 border-blue-600 hover:bg-blue-50">
                  <i className="fas fa-users mr-2"></i>
                  Join Group
                </Button>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                  <i className="fas fa-plus mr-2"></i>
                  Create Group
                </Button>
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
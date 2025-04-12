
import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import useTaskStore from '@/stores/taskStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import TaskCard from '@/components/TaskCard';
import AddTaskDialog from '@/components/AddTaskDialog';
import { PlusCircle, LogOut, Clock, ArrowUpCircle, CheckCircle2, X } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Status } from '@/types/task';

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const { tasks, getTasksByStatus } = useTaskStore();
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<Status | null>(null);
  const isMobile = useIsMobile();
  
  const pendingTasks = getTasksByStatus('Pending');
  const inProgressTasks = getTasksByStatus('In Progress');
  const closedTasks = getTasksByStatus('Closed');

  // Extract user display information safely
  const userEmail = user?.email || '';
  
  // Map specific emails to names
  const emailToNameMap = useMemo(() => ({
    'wyd.eng@malabarmilma.coop': 'Sarath',
    'wyd.de.mrcmpu@gmail.com': 'Ameen',
    'wyd.tsengg@gmail.com': 'Dineesh',
    'wyd.eng.mrcmpu@gmail.com': 'Akhil'
  }), []);
  
  // Get user name from email mapping or metadata or default to email username
  const userName = emailToNameMap[userEmail] || 
                  user?.user_metadata?.name || 
                  userEmail.split('@')[0] || 
                  '';

  // Filter tasks by status if a filter is active
  const filteredTasks = statusFilter ? getTasksByStatus(statusFilter) : tasks;

  // Handle clicking on a status box to filter tasks
  const handleStatusFilterClick = (status: Status) => {
    if (statusFilter === status) {
      setStatusFilter(null); // Clicking the same filter again clears it
    } else {
      setStatusFilter(status);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-milma-blue">Milma Maintenance</h1>
            <p className="text-sm text-gray-500">Maintenance Management System</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium">{userName || userEmail}</p>
              <p className="text-xs text-gray-500">Maintenance Manager</p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={signOut}
              className="flex items-center gap-1"
            >
              <LogOut className="h-4 w-4" />
              {!isMobile && "Sign Out"}
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <h2 className="text-xl font-semibold">Task Dashboard</h2>
          <Button 
            onClick={() => setIsAddTaskOpen(true)}
            className="bg-milma-blue hover:bg-milma-blue/90 text-white flex items-center gap-1 w-full sm:w-auto"
          >
            <PlusCircle className="h-4 w-4" />
            Add New Task
          </Button>
        </div>

        {/* Status Summary Boxes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8">
          {/* Pending Box */}
          <Card 
            className={`bg-red-100 border-red-500 border cursor-pointer ${statusFilter === 'Pending' ? 'ring-2 ring-red-500' : ''}`}
            onClick={() => handleStatusFilterClick('Pending')}
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="h-6 w-6 text-red-500" />
                <h3 className="font-medium text-gray-800">Pending</h3>
              </div>
              <div className="text-2xl font-bold text-black rounded-full bg-white w-10 h-10 flex items-center justify-center">
                {pendingTasks.length}
              </div>
            </CardContent>
          </Card>

          {/* In Progress Box */}
          <Card 
            className={`bg-amber-100 border-amber-500 border cursor-pointer ${statusFilter === 'In Progress' ? 'ring-2 ring-amber-500' : ''}`}
            onClick={() => handleStatusFilterClick('In Progress')}
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ArrowUpCircle className="h-6 w-6 text-amber-500" />
                <h3 className="font-medium text-gray-800">In Progress</h3>
              </div>
              <div className="text-2xl font-bold text-black rounded-full bg-white w-10 h-10 flex items-center justify-center">
                {inProgressTasks.length}
              </div>
            </CardContent>
          </Card>

          {/* Closed Box */}
          <Card 
            className={`bg-green-100 border-green-500 border cursor-pointer ${statusFilter === 'Closed' ? 'ring-2 ring-green-500' : ''}`}
            onClick={() => handleStatusFilterClick('Closed')}
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
                <h3 className="font-medium text-gray-800">Closed</h3>
              </div>
              <div className="text-2xl font-bold text-black rounded-full bg-white w-10 h-10 flex items-center justify-center">
                {closedTasks.length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active filter indicator */}
        {statusFilter && (
          <div className="mb-4 flex items-center">
            <div className="bg-gray-100 py-1 px-3 rounded-full flex items-center gap-2">
              <span className="text-sm">Filtering by: <span className="font-medium">{statusFilter}</span></span>
              <Button 
                variant="ghost" 
                size="icon"
                className="h-6 w-6"
                onClick={() => setStatusFilter(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* All Tasks Grid */}
        <div className="mt-8">
          <h3 className="text-lg font-medium mb-4">
            {statusFilter ? `${statusFilter} Tasks` : 'All Tasks'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTasks.length === 0 ? (
              <p className="text-gray-500 col-span-full text-center py-12">No tasks found</p>
            ) : (
              filteredTasks.map(task => (
                <TaskCard key={task.id} task={task} />
              ))
            )}
          </div>
        </div>
      </main>

      {/* Add Task Dialog */}
      <AddTaskDialog open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen} />
    </div>
  );
};

export default Dashboard;

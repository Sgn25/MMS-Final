
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import useTaskStore from '@/stores/taskStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import TaskCard from '@/components/TaskCard';
import AddTaskDialog from '@/components/AddTaskDialog';
import { PlusCircle, LogOut } from 'lucide-react';

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const { tasks, getTasksByStatus } = useTaskStore();
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  
  const pendingTasks = getTasksByStatus('Pending');
  const inProgressTasks = getTasksByStatus('In Progress');
  const closedTasks = getTasksByStatus('Closed');

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
              <p className="text-sm font-medium">{user?.name || user?.email}</p>
              <p className="text-xs text-gray-500">Maintenance Manager</p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={signOut}
              className="flex items-center gap-1"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Task Dashboard</h2>
          <Button 
            onClick={() => setIsAddTaskOpen(true)}
            className="bg-milma-blue hover:bg-milma-blue/90 text-white flex items-center gap-1"
          >
            <PlusCircle className="h-4 w-4" />
            Add New Task
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Pending Tasks Column */}
          <div className="space-y-4">
            <Card className="border-t-4 border-t-milma-pending">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium flex justify-between">
                  <span>Pending</span>
                  <span className="bg-milma-pending/20 text-milma-pending px-2 py-1 text-xs rounded-full font-normal">
                    {pendingTasks.length}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pendingTasks.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-6">No pending tasks</p>
                  ) : (
                    pendingTasks.map(task => (
                      <TaskCard key={task.id} task={task} />
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* In Progress Tasks Column */}
          <div className="space-y-4">
            <Card className="border-t-4 border-t-milma-progress">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium flex justify-between">
                  <span>In Progress</span>
                  <span className="bg-milma-progress/20 text-milma-progress px-2 py-1 text-xs rounded-full font-normal">
                    {inProgressTasks.length}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {inProgressTasks.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-6">No tasks in progress</p>
                  ) : (
                    inProgressTasks.map(task => (
                      <TaskCard key={task.id} task={task} />
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Closed Tasks Column */}
          <div className="space-y-4">
            <Card className="border-t-4 border-t-milma-closed">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium flex justify-between">
                  <span>Closed</span>
                  <span className="bg-milma-closed/20 text-milma-closed px-2 py-1 text-xs rounded-full font-normal">
                    {closedTasks.length}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {closedTasks.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-6">No closed tasks</p>
                  ) : (
                    closedTasks.map(task => (
                      <TaskCard key={task.id} task={task} />
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Add Task Dialog */}
      <AddTaskDialog open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen} />
    </div>
  );
};

export default Dashboard;

import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import useTaskStore from '@/stores/taskStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import TaskCard from '@/components/TaskCard';
import AddTaskDialog from '@/components/AddTaskDialog';
import { PlusCircle, LogOut, Clock, ArrowUpCircle, CheckCircle2, X } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Status } from '@/types/task';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const { tasks, loading, error, fetchTasks } = useTaskStore();
  const [selectedStatus, setSelectedStatus] = useState<Status | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddTaskDialogOpen, setIsAddTaskDialogOpen] = useState(false);
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  
  // Fetch tasks on initial load
  useEffect(() => {
    console.log('Dashboard mounted, fetching tasks');
    fetchTasks();
    // We don't need to put fetchTasks in the dependency array as it's a stable function reference
  }, []);

  // Filter tasks based on selected status and search query
  const filteredTasks = useMemo(() => {
    let filtered = tasks;
    
    // Apply status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(task => task.status === selectedStatus);
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(query) || 
        task.description.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [tasks, selectedStatus, searchQuery]);

  // Compute counts from the current state instead of using getState
  const pendingTasks = useMemo(() => 
    tasks.filter(task => task.status === 'Pending'), 
    [tasks]
  );
  
  const inProgressTasks = useMemo(() => 
    tasks.filter(task => task.status === 'In Progress'), 
    [tasks]
  );
  
  const closedTasks = useMemo(() => 
    tasks.filter(task => task.status === 'Closed'), 
    [tasks]
  );

  // Extract user display information safely
  const userEmail = user?.email || '';
  
  // Map specific emails to names
  const emailToNameMap = useMemo(() => ({
    'wyd.eng@malabarmilma.coop': 'Sarath DE',
    'wyd.de.mrcmpu@gmail.com': 'Ameen DE',
    'wyd.tsengg@gmail.com': 'Dineesh AE',
    'wyd.eng.mrcmpu@gmail.com': 'Subin DE'
  }), []);
  
  // Get user name from email mapping or metadata or default to email username
  const userName = emailToNameMap[userEmail] || 
                  user?.user_metadata?.name || 
                  userEmail.split('@')[0] || 
                  '';

  // Handle clicking on a status box to filter tasks
  const handleStatusFilterClick = (status: Status) => {
    if (selectedStatus === status) {
      setSelectedStatus('all'); // Clicking the same filter again clears it
    } else {
      setSelectedStatus(status);
    }
  };

  // Handle sign out with improved error handling
  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out. Please try again.');
    }
  };

  // Log when tasks change for debugging purposes
  useEffect(() => {
    console.log('Tasks updated in Dashboard, count:', tasks.length);
  }, [tasks]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-milma-blue">MainTMan</h1>
            <p className="text-sm text-gray-500">Maintenance Management System</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium">{userName}</p>
              <p className="text-xs text-gray-500">Maintenance Manager</p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSignOut}
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
            onClick={() => setIsAddTaskDialogOpen(true)}
            className="bg-milma-blue hover:bg-milma-blue/90 text-white flex items-center gap-1 w-full sm:w-auto"
          >
            <PlusCircle className="h-4 w-4" />
            Add New Task
          </Button>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-milma-blue focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Status Summary Boxes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8">
          {/* Pending Box */}
          <Card 
            className={`bg-red-100 border-red-500 border cursor-pointer ${selectedStatus === 'Pending' ? 'ring-2 ring-red-500' : ''}`}
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
            className={`bg-amber-100 border-amber-500 border cursor-pointer ${selectedStatus === 'In Progress' ? 'ring-2 ring-amber-500' : ''}`}
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
            className={`bg-green-100 border-green-500 border cursor-pointer ${selectedStatus === 'Closed' ? 'ring-2 ring-green-500' : ''}`}
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
        {selectedStatus !== 'all' && (
          <div className="mb-4 flex items-center">
            <div className="bg-gray-100 py-1 px-3 rounded-full flex items-center gap-2">
              <span className="text-sm">Filtering by: <span className="font-medium">{selectedStatus}</span></span>
              <Button 
                variant="ghost" 
                size="icon"
                className="h-6 w-6"
                onClick={() => setSelectedStatus('all')}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* All Tasks Grid */}
        <div className="mt-8">
          <h3 className="text-lg font-medium mb-4">
            {selectedStatus !== 'all' ? `${selectedStatus} Tasks` : 'All Tasks'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? (
              <p className="text-gray-500 col-span-full text-center py-12">Loading tasks...</p>
            ) : filteredTasks.length === 0 ? (
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
      <AddTaskDialog open={isAddTaskDialogOpen} onOpenChange={setIsAddTaskDialogOpen} />
    </div>
  );
};

export default Dashboard;

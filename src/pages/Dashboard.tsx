import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import useTaskStore from '@/stores/taskStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import TaskCard from '@/components/TaskCard';
import AddTaskDialog from '@/components/AddTaskDialog';
import DateRangeFilter from '@/components/DateRangeFilter';
import { PlusCircle, LogOut, Clock, ArrowUpCircle, CheckCircle2, X, RefreshCw, User as UserIcon } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Status } from '@/types/task';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { isWithinInterval, parseISO, startOfDay, endOfDay } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const { tasks, loading, error, fetchTasks } = useTaskStore();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<Status | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<DateRange>({ from: undefined, to: undefined });
  const [isAddTaskDialogOpen, setIsAddTaskDialogOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<{ name: string, designation: string, unit_name: string } | null>(null);
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  // Fetch tasks and user profile on initial load
  useEffect(() => {
    console.log('Dashboard mounted, fetching tasks and profile');
    fetchTasks();

    const fetchProfile = async () => {
      if (!user) return;

      const { data, error: profileError } = await supabase
        .from('profiles')
        .select(`
          name, 
          designation, 
          units (name)
        `)
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
      }

      // Prioritize profile table data over session metadata for accuracy
      const name = (data?.name && data.name.trim() !== '')
        ? data.name
        : (user.user_metadata?.name && user.user_metadata.name.trim() !== '')
          ? user.user_metadata.name
          : user.email?.split('@')[0] || 'User';

      const designation = data?.designation || (data as any)?.subname || user.user_metadata?.designation || 'Maintenance Personnel';
      const unitName = (data?.units as any)?.name || 'Unknown Unit';

      setUserProfile({
        name,
        designation,
        unit_name: unitName
      });
    };

    fetchProfile();
  }, [user]);

  // Handle date range change
  const handleDateRangeChange = (newDateRange: DateRange) => {
    setDateRange(newDateRange);
  };

  // Filter tasks based on selected status, search query, and date range
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

    // Apply date range filter
    if (dateRange.from || dateRange.to) {
      filtered = filtered.filter(task => {
        const taskDate = parseISO(task.createdAt);

        if (dateRange.from && dateRange.to) {
          // Both dates selected - filter within range
          return isWithinInterval(taskDate, {
            start: startOfDay(dateRange.from),
            end: endOfDay(dateRange.to)
          });
        } else if (dateRange.from) {
          // Only start date selected - filter from that date onwards
          return taskDate >= startOfDay(dateRange.from);
        } else if (dateRange.to) {
          // Only end date selected - filter up to that date
          return taskDate <= endOfDay(dateRange.to);
        }

        return true;
      });
    }

    return filtered;
  }, [tasks, selectedStatus, searchQuery, dateRange]);

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
      // AuthContext will handle state clearing, we just redirect
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out. Please try again.');
    }
  };

  // Handle refresh with loading state
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchTasks();
      toast.success('Tasks refreshed successfully');
    } catch (error) {
      console.error('Error refreshing tasks:', error);
      toast.error('Failed to refresh tasks');
    } finally {
      setIsRefreshing(false);
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
            <p className="text-xs font-semibold text-milma-blue/70 px-2 py-0.5 bg-milma-blue/5 rounded inline-block">
              {userProfile?.unit_name || "Loading Unit..."}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="text-right mr-2 hidden sm:block">
              <p className="text-sm font-medium">{userProfile?.name || "User"}</p>
              <p className="text-xs text-gray-500">{userProfile?.designation || "Maintenance"}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/profile')}
              className="flex items-center gap-1"
            >
              <UserIcon className="h-4 w-4" />
              {!isMobile && "Profile"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing || loading}
              className="flex items-center gap-1"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {!isMobile && "Refresh"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="flex items-center gap-1 text-red-600 border-red-100 hover:bg-red-50 hover:text-red-700 hover:border-red-200"
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
        <div className="mb-4">
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

        {/* Date Range Filter */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Filter by creation date:</label>
            <DateRangeFilter
              dateRange={dateRange}
              onDateRangeChange={handleDateRangeChange}
            />
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

        {/* Active filter indicators */}
        {(selectedStatus !== 'all' || dateRange.from || dateRange.to) && (
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {selectedStatus !== 'all' && (
              <div className="bg-gray-100 py-1 px-3 rounded-full flex items-center gap-2">
                <span className="text-sm">Status: <span className="font-medium">{selectedStatus}</span></span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setSelectedStatus('all')}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            {(dateRange.from || dateRange.to) && (
              <div className="bg-gray-100 py-1 px-3 rounded-full flex items-center gap-2">
                <span className="text-sm">
                  Date: <span className="font-medium">
                    {dateRange.from && dateRange.to
                      ? `${dateRange.from.toLocaleDateString()} - ${dateRange.to.toLocaleDateString()}`
                      : dateRange.from
                        ? `From ${dateRange.from.toLocaleDateString()}`
                        : `Until ${dateRange.to?.toLocaleDateString()}`
                    }
                  </span>
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setDateRange({ from: undefined, to: undefined })}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )}

        {/* All Tasks Grid */}
        <div className="mt-8">
          <h3 className="text-lg font-medium mb-4">
            {selectedStatus !== 'all' ? `${selectedStatus} Tasks` : 'All Tasks'}
            {filteredTasks.length !== tasks.length && (
              <span className="text-sm font-normal text-gray-500 ml-2">
                ({filteredTasks.length} of {tasks.length})
              </span>
            )}
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

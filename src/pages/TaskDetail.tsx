
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import useTaskStore from '@/stores/taskStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { ChevronLeft, Save, Trash2, Calendar, UserCircle, Clock } from 'lucide-react';
import { StatusChange, Task } from '@/types/task';

const TaskDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getTaskById, updateTask, deleteTask } = useTaskStore();
  
  const [task, setTask] = useState<Task | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  
  useEffect(() => {
    if (id) {
      const foundTask = getTaskById(id);
      if (foundTask) {
        setTask(foundTask);
        setTitle(foundTask.title);
        setDescription(foundTask.description);
        setStatus(foundTask.status);
        setPriority(foundTask.priority);
        setAssignedTo(foundTask.assignedTo);
      } else {
        toast.error('Task not found');
        navigate('/dashboard');
      }
    }
  }, [id, getTaskById, navigate]);

  const handleSave = () => {
    if (id && user) {
      updateTask(
        id,
        {
          title,
          description,
          status: status as any,
          priority: priority as any,
          assignedTo
        },
        user.id
      );
      
      toast.success('Task updated successfully');
      setIsEditing(false);
      
      // Refresh task data
      const updatedTask = getTaskById(id);
      if (updatedTask) {
        setTask(updatedTask);
      }
    }
  };

  const handleDelete = () => {
    if (id) {
      if (window.confirm('Are you sure you want to delete this task?')) {
        deleteTask(id);
        toast.success('Task deleted successfully');
        navigate('/dashboard');
      }
    }
  };

  // Function to determine priority badge color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-milma-high/20 text-milma-high';
      case 'Medium':
        return 'bg-milma-medium/20 text-milma-medium';
      case 'Low':
        return 'bg-milma-low/20 text-milma-low';
      default:
        return 'bg-gray-200 text-gray-800';
    }
  };

  // Function to determine status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-milma-pending/20 text-milma-pending';
      case 'In Progress':
        return 'bg-milma-progress/20 text-milma-progress';
      case 'Closed':
        return 'bg-milma-closed/20 text-milma-closed';
      default:
        return 'bg-gray-200 text-gray-800';
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (!task) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading task details...</p>
      </div>
    );
  }

  // Sort status history in reverse chronological order
  const sortedStatusHistory = [...task.statusHistory].sort((a, b) => {
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Link to="/dashboard">
              <Button variant="ghost" size="icon" className="rounded-full">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold text-gray-900">Task Details</h1>
          </div>
          <div className="flex items-center space-x-2">
            {isEditing ? (
              <>
                <Button 
                  onClick={() => setIsEditing(false)}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSave}
                  className="bg-milma-blue hover:bg-milma-blue/90 flex items-center gap-1"
                >
                  <Save className="h-4 w-4" />
                  Save Changes
                </Button>
              </>
            ) : (
              <>
                <Button 
                  onClick={() => setIsEditing(true)}
                  variant="outline"
                >
                  Edit Task
                </Button>
                <Button 
                  onClick={handleDelete} 
                  variant="destructive"
                  className="flex items-center gap-1"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main task details */}
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Task Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  /* Editable Form */
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="title">Task Title</Label>
                      <Input
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={4}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Select value={status} onValueChange={setStatus}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="In Progress">In Progress</SelectItem>
                            <SelectItem value="Closed">Closed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="priority">Priority</Label>
                        <Select value={priority} onValueChange={setPriority}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Low">Low</SelectItem>
                            <SelectItem value="Medium">Medium</SelectItem>
                            <SelectItem value="High">High</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="assignedTo">Assigned To</Label>
                      <Input
                        id="assignedTo"
                        value={assignedTo}
                        onChange={(e) => setAssignedTo(e.target.value)}
                      />
                    </div>
                  </>
                ) : (
                  /* View Mode */
                  <>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">{task.title}</h2>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge className={getStatusColor(task.status)}>
                          {task.status}
                        </Badge>
                        <Badge className={getPriorityColor(task.priority)}>
                          {task.priority} Priority
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="pt-2">
                      <h3 className="text-sm font-medium text-gray-700 mb-1">Description</h3>
                      <p className="text-gray-600 whitespace-pre-line">{task.description}</p>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                          <UserCircle className="h-4 w-4" />
                          Assigned To
                        </h3>
                        <p className="text-gray-600">{task.assignedTo}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Created At
                        </h3>
                        <p className="text-gray-600">{formatDate(task.createdAt)}</p>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Status History */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Status History</CardTitle>
              </CardHeader>
              <CardContent>
                {sortedStatusHistory.length === 0 ? (
                  <p className="text-gray-500 text-sm py-4 text-center">No status changes recorded yet</p>
                ) : (
                  <div className="space-y-4">
                    {sortedStatusHistory.map((change: StatusChange, index) => (
                      <div key={change.id} className="relative">
                        {index !== sortedStatusHistory.length - 1 && (
                          <div className="absolute left-3 top-5 w-0.5 h-full -ml-px bg-gray-200 z-0"></div>
                        )}
                        <div className="flex items-start gap-3 relative z-10">
                          <div className="rounded-full w-6 h-6 bg-milma-blue/20 flex items-center justify-center">
                            <Clock className="h-3 w-3 text-milma-blue" />
                          </div>
                          <div className="flex-1">
                            <div className="text-sm">
                              Status changed from <span className="font-medium">{change.previousStatus}</span> to <span className="font-medium">{change.newStatus}</span>
                            </div>
                            <div className="text-xs text-gray-500 mt-1 flex items-center justify-between">
                              <span>{formatDate(change.timestamp)}</span>
                              <span className="font-medium">by {change.changedBy}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Task Details</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">ID:</span>
                  <span className="font-mono text-xs">{task.id.substring(0, 8)}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-gray-500">Created:</span>
                  <span>{formatDate(task.createdAt)}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-gray-500">Last Updated:</span>
                  <span>{formatDate(task.updatedAt)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TaskDetail;

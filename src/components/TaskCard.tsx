import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Task } from '@/types/task';
import { CalendarClock, User, Clock, RefreshCcw, Trash2 } from 'lucide-react';
import StatusUpdateMenu from './StatusUpdateMenu';
import { formatDistanceToNow } from 'date-fns';
import useTaskStore from '@/stores/taskStore';
import { toast } from 'sonner';
import { useState } from 'react';

interface TaskCardProps {
  task: Task;
}

const TaskCard = ({ task }: TaskCardProps) => {
  const { deleteTask } = useTaskStore();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Function to determine priority badge color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-milma-high/20 text-milma-high hover:bg-milma-high/30';
      case 'Medium':
        return 'bg-milma-medium/20 text-milma-medium hover:bg-milma-medium/30';
      case 'Low':
        return 'bg-milma-low/20 text-milma-low hover:bg-milma-low/30';
      default:
        return 'bg-gray-200 text-gray-800';
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Function to determine status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'border-l-red-500';
      case 'In Progress':
        return 'border-l-amber-500';
      case 'Closed':
        return 'border-l-green-500';
      default:
        return 'border-l-gray-300';
    }
  };

  // Function to determine status background glow
  const getStatusGlow = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'before:bg-red-500/10';
      case 'In Progress':
        return 'before:bg-amber-500/10';
      case 'Closed':
        return 'before:bg-green-500/10';
      default:
        return 'before:bg-gray-300/10';
    }
  };

  // Get the creator email (first status history entry)
  const getCreatedBy = () => {
    if (task.statusHistory && task.statusHistory.length > 0) {
      // Get the earliest entry
      const sortedHistory = [...task.statusHistory].sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      return sortedHistory[0].changedBy;
    }
    return 'Unknown';
  };

  // Get the last updater email (most recent status history entry)
  const getLastUpdatedBy = () => {
    if (task.statusHistory && task.statusHistory.length > 0) {
      // Get the most recent entry
      const sortedHistory = [...task.statusHistory].sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      return sortedHistory[0].changedBy;
    }
    return 'Unknown';
  };

  // Get relative time for last update
  const getTimeAgo = () => {
    return formatDistanceToNow(new Date(task.updatedAt), { addSuffix: true });
  };

  const handleDelete = async () => {
    try {
      await deleteTask(task.id);
      toast.success('Task deleted successfully');
      setIsDeleteDialogOpen(false);
    } catch (error: any) {
      toast.error(`Failed to delete task: ${error.message}`);
    }
  };

  return (
    <>
      <Card 
        className={`
          border-l-4 ${getStatusColor(task.status)} 
          hover:shadow-md transition-all duration-200 
          transform hover:-translate-y-1 
          relative overflow-hidden 
          before:content-[''] before:absolute before:inset-0 
          before:opacity-30 ${getStatusGlow(task.status)} before:rounded-lg before:z-0
        `}
      >
        <CardContent className="p-4 relative z-10">
          <div className="flex flex-col h-full">
            <div className="flex justify-between items-start mb-2">
              <Link to={`/task/${task.id}`} className="hover:underline flex-grow mr-2">
                <h3 className="font-medium text-gray-900 truncate">{task.title}</h3>
              </Link>
              <div className="flex gap-2 items-center">
                <Badge className={getStatusColor(task.status).replace('border-l-', 'bg-').replace('500', '100') + ' text-' + getStatusColor(task.status).replace('border-l-', '').replace('500', '700')}>
                  {task.status}
                </Badge>
                <Badge className={`shrink-0 whitespace-nowrap ${getPriorityColor(task.priority)}`}>
                  {task.priority}
                </Badge>
              </div>
            </div>
            
            <p className="text-sm text-gray-500 line-clamp-2 mb-3">{task.description}</p>
            
            <div className="text-xs text-gray-500 mb-1">
              <div className="flex items-center gap-1 mb-1">
                <User className="h-3 w-3" />
                <span>Assigned to: <span className="font-medium">{task.assignedTo}</span></span>
              </div>
              <div className="flex items-center gap-1 mb-1">
                <Clock className="h-3 w-3" />
                <span>Created by: <span className="font-medium">{getCreatedBy()}</span></span>
              </div>
              <div className="flex items-center gap-1 mb-1">
                <RefreshCcw className="h-3 w-3" />
                <span>Updated by: <span className="font-medium">{getLastUpdatedBy()}</span></span>
              </div>
              <div className="flex items-center gap-1">
                <CalendarClock className="h-3 w-3" />
                <span>{getTimeAgo()}</span>
              </div>
            </div>
            
            <div className="mt-2 pt-2 border-t flex gap-2">
              <StatusUpdateMenu taskId={task.id} currentStatus={task.status} />
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsDeleteDialogOpen(true)}
                className="w-full flex items-center justify-center gap-2 text-red-500 hover:text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Task</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this task? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-500">
              Task: <span className="font-medium">{task.title}</span>
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
            >
              Delete Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TaskCard;

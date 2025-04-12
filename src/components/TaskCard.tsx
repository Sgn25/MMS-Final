
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Task } from '@/types/task';
import { CalendarClock, User, Clock, RefreshCcw } from 'lucide-react';
import StatusUpdateMenu from './StatusUpdateMenu';
import { formatDistanceToNow } from 'date-fns';

interface TaskCardProps {
  task: Task;
}

const TaskCard = ({ task }: TaskCardProps) => {
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

  return (
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
          
          <div className="mt-2 pt-2 border-t">
            <StatusUpdateMenu taskId={task.id} currentStatus={task.status} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TaskCard;

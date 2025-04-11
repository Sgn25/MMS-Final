
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Task } from '@/types/task';
import { CalendarClock, User } from 'lucide-react';
import StatusUpdateMenu from './StatusUpdateMenu';

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
        return 'border-l-milma-pending';
      case 'In Progress':
        return 'border-l-milma-progress';
      case 'Closed':
        return 'border-l-milma-closed';
      default:
        return 'border-l-gray-300';
    }
  };

  // Function to determine status background glow
  const getStatusGlow = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'before:bg-milma-pending/10';
      case 'In Progress':
        return 'before:bg-milma-progress/10';
      case 'Closed':
        return 'before:bg-milma-closed/10';
      default:
        return 'before:bg-gray-300/10';
    }
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
            <Badge className={`shrink-0 whitespace-nowrap ${getPriorityColor(task.priority)}`}>
              {task.priority}
            </Badge>
          </div>
          
          <p className="text-sm text-gray-500 line-clamp-2 mb-3">{task.description}</p>
          
          <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span>{task.assignedTo}</span>
            </div>
            <div className="flex items-center gap-1">
              <CalendarClock className="h-3 w-3" />
              <span>{formatDate(task.updatedAt)}</span>
            </div>
          </div>
          
          <div className="mt-auto pt-2 border-t">
            <StatusUpdateMenu taskId={task.id} currentStatus={task.status} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TaskCard;

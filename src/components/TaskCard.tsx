
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Task } from '@/types/task';
import { CalendarClock, User, MoreHorizontal } from 'lucide-react';
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

  return (
    <div className="relative">
      <Link to={`/task/${task.id}`}>
        <Card className="hover:shadow-md transition-shadow cursor-pointer border-gray-200">
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-medium text-gray-900 truncate flex-1">{task.title}</h3>
              <Badge className={`ml-2 ${getPriorityColor(task.priority)}`}>
                {task.priority}
              </Badge>
            </div>
            
            <p className="text-sm text-gray-500 line-clamp-2 mb-3">{task.description}</p>
            
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <span>{task.assignedTo}</span>
              </div>
              <div className="flex items-center gap-1">
                <CalendarClock className="h-3 w-3" />
                <span>{formatDate(task.updatedAt)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
      
      {/* Status Update Button - positioned absolutely to avoid interfering with the Link */}
      <div 
        className="absolute top-2 right-2 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <StatusUpdateMenu taskId={task.id} currentStatus={task.status} />
      </div>
    </div>
  );
};

export default TaskCard;

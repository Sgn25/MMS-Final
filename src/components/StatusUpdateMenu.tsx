
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Status } from '@/types/task';
import useTaskStore from '@/stores/taskStore';
import { useAuth } from '@/contexts/AuthContext';
import { MoreHorizontal, ArrowUpCircle, Clock, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface StatusUpdateMenuProps {
  taskId: string;
  currentStatus: Status;
}

const StatusUpdateMenu = ({ taskId, currentStatus }: StatusUpdateMenuProps) => {
  const { updateTask } = useTaskStore();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  
  const handleStatusChange = (newStatus: Status) => {
    if (user && newStatus !== currentStatus) {
      updateTask(taskId, { status: newStatus }, user.id);
      toast.success(`Task status updated to ${newStatus}`);
      setOpen(false);
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0 rounded-full" 
          onClick={(e) => e.preventDefault()}
        >
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Update Status</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem 
          disabled={currentStatus === 'Pending'}
          onClick={() => handleStatusChange('Pending')}
          className="flex items-center gap-2"
        >
          <Clock className="h-4 w-4 text-milma-pending" />
          <span>Set to Pending</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          disabled={currentStatus === 'In Progress'}
          onClick={() => handleStatusChange('In Progress')}
          className="flex items-center gap-2"
        >
          <ArrowUpCircle className="h-4 w-4 text-milma-progress" />
          <span>Set to In Progress</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          disabled={currentStatus === 'Closed'}
          onClick={() => handleStatusChange('Closed')}
          className="flex items-center gap-2"
        >
          <CheckCircle2 className="h-4 w-4 text-milma-closed" />
          <span>Set to Closed</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default StatusUpdateMenu;

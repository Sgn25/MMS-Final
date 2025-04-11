
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Status } from '@/types/task';
import useTaskStore from '@/stores/taskStore';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowUpCircle, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface StatusUpdateMenuProps {
  taskId: string;
  currentStatus: Status;
}

const StatusUpdateMenu = ({ taskId, currentStatus }: StatusUpdateMenuProps) => {
  const { updateTask } = useTaskStore();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<Status | "">("");
  const [remarks, setRemarks] = useState("");
  
  const handleOpenChange = (open: boolean) => {
    setOpen(open);
    if (!open) {
      // Reset form when closing
      setSelectedStatus("");
      setRemarks("");
    }
  };

  const handleStatusChange = () => {
    if (!selectedStatus || selectedStatus === currentStatus) {
      toast.error("Please select a different status");
      return;
    }
    
    if (!remarks.trim()) {
      toast.error("Please provide remarks for the status change");
      return;
    }
    
    if (user) {
      updateTask(
        taskId, 
        { 
          status: selectedStatus as Status,
          remarks: remarks
        }, 
        user.id
      );
      
      toast.success(`Task status updated to ${selectedStatus}`);
      setOpen(false);
      setSelectedStatus("");
      setRemarks("");
    } else {
      toast.error("You must be logged in to update task status");
    }
  };

  const getStatusIcon = (status: Status) => {
    switch (status) {
      case 'Pending':
        return <Clock className="h-4 w-4 text-milma-pending" />;
      case 'In Progress':
        return <ArrowUpCircle className="h-4 w-4 text-milma-progress" />;
      case 'Closed':
        return <CheckCircle2 className="h-4 w-4 text-milma-closed" />;
      default:
        return null;
    }
  };

  return (
    <>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2"
      >
        {getStatusIcon(currentStatus)}
        <span>Update Status</span>
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Task Status</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="status">New Status</Label>
              <Select 
                value={selectedStatus} 
                onValueChange={(value) => setSelectedStatus(value as Status)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select new status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending" disabled={currentStatus === 'Pending'}>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-milma-pending" />
                      <span>Pending</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="In Progress" disabled={currentStatus === 'In Progress'}>
                    <div className="flex items-center gap-2">
                      <ArrowUpCircle className="h-4 w-4 text-milma-progress" />
                      <span>In Progress</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="Closed" disabled={currentStatus === 'Closed'}>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-milma-closed" />
                      <span>Closed</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="remarks">Remarks <span className="text-red-500">*</span></Label>
              <Textarea 
                id="remarks" 
                placeholder="Why are you changing the status?"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="min-h-[100px]"
              />
              <p className="text-sm text-muted-foreground">
                Please provide a reason for this status change
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleStatusChange}>
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default StatusUpdateMenu;

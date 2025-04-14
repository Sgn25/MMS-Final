
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
import { useAuth } from '@/contexts/AuthContext';
import { ArrowUpCircle, Clock, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import useTaskStore from '@/stores/taskStore';

interface StatusUpdateMenuProps {
  taskId: string;
  currentStatus: Status;
}

const StatusUpdateMenu = ({ taskId, currentStatus }: StatusUpdateMenuProps) => {
  const { user } = useAuth();
  const { updateTask } = useTaskStore();
  const [open, setOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<Status | "">("");
  const [remarks, setRemarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleOpenChange = (open: boolean) => {
    setOpen(open);
    if (!open) {
      // Reset form when closing
      setSelectedStatus("");
      setRemarks("");
    }
  };

  const handleStatusChange = async () => {
    if (!selectedStatus || selectedStatus === currentStatus) {
      toast.error("Please select a different status");
      return;
    }
    
    if (!remarks.trim()) {
      toast.error("Please provide remarks for the status change");
      return;
    }
    
    if (!user) {
      toast.error("You must be logged in to update task status");
      return;
    }

    setIsSubmitting(true);
    
    try {
      console.log(`Updating task ${taskId} status to ${selectedStatus}`);
      await updateTask(taskId, { 
        status: selectedStatus,
        remarks: remarks
      }, user.email || 'Unknown User');
      
      console.log(`Task status updated to ${selectedStatus}`);
      toast.success(`Task status updated to ${selectedStatus}`);
      setOpen(false);
      setSelectedStatus("");
      setRemarks("");
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast.error(`Failed to update status: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusIcon = (status: Status) => {
    switch (status) {
      case 'Pending':
        return <Clock className="h-4 w-4 text-red-500" />;
      case 'In Progress':
        return <ArrowUpCircle className="h-4 w-4 text-amber-500" />;
      case 'Closed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
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
            <DialogDescription>Change the status and provide remarks for the update</DialogDescription>
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
                      <Clock className="h-4 w-4 text-red-500" />
                      <span>Pending</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="In Progress" disabled={currentStatus === 'In Progress'}>
                    <div className="flex items-center gap-2">
                      <ArrowUpCircle className="h-4 w-4 text-amber-500" />
                      <span>In Progress</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="Closed" disabled={currentStatus === 'Closed'}>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
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
            <Button 
              onClick={handleStatusChange}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Updating...' : 'Update Status'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default StatusUpdateMenu;

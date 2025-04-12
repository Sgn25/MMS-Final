
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import useTaskStore from '@/stores/taskStore';

interface AddTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AddTaskDialog = ({ open, onOpenChange }: AddTaskDialogProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { addTask } = useTaskStore();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('Pending');
  const [priority, setPriority] = useState('Medium');
  const [assignedTo, setAssignedTo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error('Task title is required');
      return;
    }
    
    if (!user) {
      toast.error('You must be logged in to add a task');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Use both Supabase and local state management
      // First add to Supabase
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          title,
          description,
          status,
          priority,
          assigned_to: assignedTo || 'Unassigned',
          user_id: user.id
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Add the initial status history entry for task creation
      // Using "Pending" as the previous status since "Created" violates the constraint
      const { error: historyError } = await supabase
        .from('status_history')
        .insert({
          task_id: data.id,
          previous_status: 'Pending', // Changed from 'Created' to 'Pending'
          new_status: 'Pending',
          user_id: user.id,
          user_name: user.email || 'Unknown User',
          remarks: 'Task created'
        });
      
      if (historyError) throw historyError;
      
      // Also update local state using zustand store
      addTask({
        title,
        description,
        status: status as any,
        priority: priority as any,
        assignedTo: assignedTo || 'Unassigned'
      });
      
      toast.success('Task added successfully');
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      
      resetForm();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error adding task:', error);
      toast.error(`Failed to add task: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const resetForm = () => {
    setTitle('');
    setDescription('');
    setStatus('Pending');
    setPriority('Medium');
    setAssignedTo('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Maintenance Task</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Task Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide details about the task"
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
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
                  <SelectValue placeholder="Select priority" />
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
              placeholder="Enter person's name"
            />
          </div>
          
          <DialogFooter className="pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-milma-blue hover:bg-milma-blue/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Adding...' : 'Add Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddTaskDialog;

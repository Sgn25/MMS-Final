
import { supabase } from '@/integrations/supabase/client';
import { Task, Status, Priority } from '@/types/task';
import { toast } from 'sonner';
import { mapDbTaskToTask } from '@/utils/taskMappers';

/**
 * Service for handling task-related API operations
 */
export const taskService = {
  /**
   * Fetches all tasks from the database
   */
  fetchTasks: async (): Promise<Task[]> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No active session');

      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (tasksError) throw tasksError;

      const { data: statusHistoryData, error: historyError } = await supabase
        .from('status_history')
        .select('*');

      if (historyError) throw historyError;

      // Map database tasks to frontend tasks with proper type casting
      const tasks = tasksData.map(task => {
        return mapDbTaskToTask(
          {
            ...task,
            status: task.status as Status,
            priority: task.priority as Priority
          }, 
          statusHistoryData.filter(history => history.task_id === task.id)
        );
      });

      return tasks;
    } catch (error: any) {
      console.error('Error fetching tasks:', error);
      toast.error(`Failed to fetch tasks: ${error.message}`);
      throw error;
    }
  },

  /**
   * Fetches a single task by its ID
   */
  getTaskById: async (taskId: string): Promise<Task | null> => {
    try {
      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .maybeSingle();

      if (taskError) throw taskError;
      if (!taskData) return null;

      const { data: statusHistoryData, error: historyError } = await supabase
        .from('status_history')
        .select('*')
        .eq('task_id', taskId);

      if (historyError) throw historyError;

      // Cast the status and priority to their enum types
      return mapDbTaskToTask(
        {
          ...taskData,
          status: taskData.status as Status,
          priority: taskData.priority as Priority
        }, 
        statusHistoryData
      );
    } catch (error: any) {
      console.error('Error fetching task by ID:', error);
      toast.error(`Failed to fetch task: ${error.message}`);
      return null;
    }
  },

  /**
   * Adds a new task to the database
   */
  addTask: async (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'statusHistory'>): Promise<void> => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session) throw new Error('No active session');

      const { data, error } = await supabase
        .from('tasks')
        .insert({
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          assigned_to: task.assignedTo,
          user_id: session.user.id
        })
        .select()
        .single();

      if (error) throw error;

      // Add initial status history entry
      const { error: historyError } = await supabase
        .from('status_history')
        .insert({
          task_id: data.id,
          previous_status: task.status,
          new_status: task.status,
          user_id: session.user.id,
          user_name: session.user.email,
          remarks: 'Task created'
        });

      if (historyError) throw historyError;

      toast.success('Task created successfully');
    } catch (error: any) {
      console.error('Error adding task:', error);
      toast.error(`Failed to create task: ${error.message}`);
      throw error;
    }
  },

  /**
   * Updates an existing task in the database
   */
  updateTask: async (taskId: string, updatedTask: Partial<Task> & { remarks?: string }, userId: string): Promise<void> => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session) throw new Error('No active session');

      // First get the current task
      const { data: currentTask, error: fetchError } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .maybeSingle();

      if (fetchError) throw fetchError;
      if (!currentTask) throw new Error('Task not found');

      // Update the task
      const { error: updateError } = await supabase
        .from('tasks')
        .update({
          title: updatedTask.title,
          description: updatedTask.description,
          status: updatedTask.status,
          priority: updatedTask.priority,
          assigned_to: updatedTask.assignedTo,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId);

      if (updateError) throw updateError;

      // If status is being updated, record the change in history
      if (updatedTask.status && updatedTask.status !== currentTask.status) {
        const { error: historyError } = await supabase
          .from('status_history')
          .insert({
            task_id: taskId,
            previous_status: currentTask.status,
            new_status: updatedTask.status,
            user_id: session.user.id,
            user_name: session.user.email,
            remarks: updatedTask.remarks || 'No remarks provided'
          });

        if (historyError) throw historyError;
      }

      toast.success('Task updated successfully');
    } catch (error: any) {
      console.error('Error updating task:', error);
      toast.error(`Failed to update task: ${error.message}`);
      throw error;
    }
  },

  /**
   * Deletes a task from the database
   */
  deleteTask: async (taskId: string): Promise<void> => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session) throw new Error('No active session');

      // First delete status history
      const { error: historyError } = await supabase
        .from('status_history')
        .delete()
        .eq('task_id', taskId);

      if (historyError) throw historyError;

      // Then delete the task
      const { error: taskError } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (taskError) throw taskError;

      toast.success('Task deleted successfully');
    } catch (error: any) {
      console.error('Error deleting task:', error);
      toast.error(`Failed to delete task: ${error.message}`);
      throw error;
    }
  }
};


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
            .map(history => ({
              ...history,
              previous_status: history.previous_status as Status,
              new_status: history.new_status as Status
            }))
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
        statusHistoryData.map(history => ({
          ...history,
          previous_status: history.previous_status as Status,
          new_status: history.new_status as Status
        }))
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
  addTask: async (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'statusHistory'>): Promise<Task> => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session) throw new Error('No active session');

      // Fetch the user's unit_id from their profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('unit_id')
        .eq('id', session.user.id)
        .single();

      if (profileError) throw profileError;
      if (!profileData?.unit_id) throw new Error('User does not have an assigned unit');

      // Fetch the user's name and designation for status history
      const { data: userData } = await supabase
        .from('profiles')
        .select('name, designation')
        .eq('id', session.user.id)
        .maybeSingle();

      const userName = session.user.user_metadata?.name || userData?.name || session.user.email || 'Unknown User';
      const userDesignation = session.user.user_metadata?.designation || userData?.designation || '';
      const fullDisplayName = userDesignation ? `${userName} (${userDesignation})` : userName;

      const { data, error } = await supabase
        .from('tasks')
        .insert({
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          assigned_to: task.assignedTo,
          user_id: session.user.id,
          unit_id: profileData.unit_id
        })
        .select()
        .single();

      if (error) throw error;

      // Add initial status history entry with "Task created" remarks
      const { error: historyError } = await supabase
        .from('status_history')
        .insert({
          task_id: data.id,
          previous_status: task.status,
          new_status: task.status,
          user_id: session.user.id,
          user_name: fullDisplayName,
          remarks: 'Task created'
        });

      if (historyError) throw historyError;

      // Send notification for new task
      try {
        await sendNotification({
          taskId: data.id,
          title: 'New Task Created',
          body: `A new task "${data.title}" has been created`,
          type: 'task_created'
        });
      } catch (notificationError) {
        console.error('Failed to send notification:', notificationError);
        // We don't throw here to avoid breaking the task creation flow
      }

      toast.success('Task created successfully');

      // Return the newly created task with proper mapping
      return mapDbTaskToTask(
        {
          ...data,
          status: data.status as Status,
          priority: data.priority as Priority
        },
        [{
          id: 'initial',
          task_id: data.id,
          previous_status: data.status as Status,
          new_status: data.status as Status,
          user_id: session.user.id,
          user_name: fullDisplayName,
          remarks: 'Task created',
          created_at: data.created_at
        }]
      );
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

      // Update the task - only include fields that are actually provided to avoid clearing data
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (updatedTask.title !== undefined) updateData.title = updatedTask.title;
      if (updatedTask.description !== undefined) updateData.description = updatedTask.description;
      if (updatedTask.status !== undefined) updateData.status = updatedTask.status;
      if (updatedTask.priority !== undefined) updateData.priority = updatedTask.priority;
      if (updatedTask.assignedTo !== undefined) updateData.assigned_to = updatedTask.assignedTo;

      const { error: updateError } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId);

      if (updateError) throw updateError;

      // If status is being updated, record the change in history
      if (updatedTask.status && updatedTask.status !== currentTask.status) {
        // Fetch the user's name and designation for status history
        const { data: userData } = await supabase
          .from('profiles')
          .select('name, designation')
          .eq('id', session.user.id)
          .maybeSingle();

        const userName = session.user.user_metadata?.name || userData?.name || session.user.email || 'Unknown User';
        const userDesignation = session.user.user_metadata?.designation || userData?.designation || '';
        const fullDisplayName = userDesignation ? `${userName} (${userDesignation})` : userName;

        const { error: historyError } = await supabase
          .from('status_history')
          .insert({
            task_id: taskId,
            previous_status: currentTask.status,
            new_status: updatedTask.status,
            user_id: session.user.id,
            user_name: fullDisplayName,
            remarks: updatedTask.remarks || 'No remarks provided'
          });

        if (historyError) throw historyError;

        // Send notification if status is changed to Closed
        if (updatedTask.status === 'Closed') {
          try {
            await sendNotification({
              taskId,
              title: 'Task Closed',
              body: `Task "${currentTask.title}" has been closed`,
              type: 'task_closed'
            });
          } catch (notificationError) {
            console.error('Failed to send notification:', notificationError);
            // We don't throw here to avoid breaking the task update flow
          }
        }
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

/**
 * Send a notification through the Supabase edge function
 */
const sendNotification = async (payload: {
  taskId: string;
  title: string;
  body: string;
  type: 'task_created' | 'task_closed' | 'task_updated';
}) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('No active session');

    const { data, error } = await supabase.functions.invoke('send-notification', {
      body: payload
    });

    if (error) throw error;
    console.log('Notification sent successfully:', data);
    return data;
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
};

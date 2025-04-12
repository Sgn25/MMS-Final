import { create } from 'zustand';
import { Status, Priority, Task, StatusChange } from '@/types/task';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TaskState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  fetchTasks: () => Promise<void>;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'statusHistory'>) => Promise<void>;
  updateTask: (taskId: string, updatedTask: Partial<Task> & { remarks?: string }, userId: string) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  getTaskById: (taskId: string) => Promise<Task | null>;
  getTasksByStatus: (status: Status) => Task[];
}

const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  loading: false,
  error: null,

  fetchTasks: async () => {
    set({ loading: true, error: null });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No active session');

      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false }); // Order by creation date, newest first

      if (tasksError) throw tasksError;

      const { data: statusHistoryData, error: historyError } = await supabase
        .from('status_history')
        .select('*');

      if (historyError) throw historyError;

      // Map database tasks to frontend tasks
      const tasks = tasksData.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description || '',
        status: task.status as Status,
        priority: task.priority as Priority,
        assignedTo: task.assigned_to,
        createdAt: task.created_at,
        updatedAt: task.updated_at,
        userId: task.user_id,
        statusHistory: statusHistoryData
          .filter(history => history.task_id === task.id)
          .map(history => ({
            id: history.id,
            taskId: history.task_id,
            previousStatus: history.previous_status as Status,
            newStatus: history.new_status as Status,
            changedBy: history.user_name,
            remarks: history.remarks,
            timestamp: history.created_at
          }))
      }));

      set({ tasks, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      toast.error(`Failed to fetch tasks: ${error.message}`);
    }
  },

  addTask: async (task) => {
    set({ loading: true, error: null });
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

      // Fetch updated tasks list
      await get().fetchTasks();

      set({ loading: false });
      toast.success('Task created successfully');
    } catch (error: any) {
      set({ error: error.message, loading: false });
      toast.error(`Failed to create task: ${error.message}`);
    }
  },

  updateTask: async (taskId, updatedTask, userId) => {
    set({ loading: true, error: null });
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session) throw new Error('No active session');

      // First get the current task
      const { data: currentTask, error: fetchError } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single();

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

      set({ loading: false });
      toast.success('Task updated successfully');
    } catch (error: any) {
      set({ error: error.message, loading: false });
      toast.error(`Failed to update task: ${error.message}`);
    }
  },

  deleteTask: async (taskId) => {
    set({ loading: true, error: null });
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

      set({ loading: false });
      toast.success('Task deleted successfully');
    } catch (error: any) {
      set({ error: error.message, loading: false });
      toast.error(`Failed to delete task: ${error.message}`);
    }
  },

  getTaskById: async (taskId) => {
    try {
      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single();

      if (taskError) throw taskError;
      if (!taskData) return null;

      const { data: statusHistoryData, error: historyError } = await supabase
        .from('status_history')
        .select('*')
        .eq('task_id', taskId);

      if (historyError) throw historyError;

      return {
        id: taskData.id,
        title: taskData.title,
        description: taskData.description || '',
        status: taskData.status as Status,
        priority: taskData.priority as Priority,
        assignedTo: taskData.assigned_to,
        createdAt: taskData.created_at,
        updatedAt: taskData.updated_at,
        userId: taskData.user_id,
        statusHistory: statusHistoryData.map(history => ({
          id: history.id,
          taskId: history.task_id,
          previousStatus: history.previous_status as Status,
          newStatus: history.new_status as Status,
          changedBy: history.user_name,
          remarks: history.remarks,
          timestamp: history.created_at
        }))
      };
    } catch (error: any) {
      set({ error: error.message });
      toast.error(`Failed to fetch task: ${error.message}`);
      return null;
    }
  },

  getTasksByStatus: (status) => {
    return get().tasks.filter(task => task.status === status);
  }
}));

// Set up real-time subscription
let channel: any = null;

const setupRealtimeSubscription = () => {
  if (channel) {
    channel.unsubscribe();
  }

  channel = supabase
    .channel('tasks_channel')
    .on(
      'postgres_changes',
      { 
        event: '*', 
        schema: 'public', 
        table: 'tasks'
      },
      async (payload) => {
        console.log('Tasks table change:', payload);
        // Always fetch the latest tasks list
        await useTaskStore.getState().fetchTasks();
      }
    )
    .on(
      'postgres_changes',
      { 
        event: '*', 
        schema: 'public', 
        table: 'status_history'
      },
      async (payload) => {
        console.log('Status history change:', payload);
        // Always fetch the latest tasks list
        await useTaskStore.getState().fetchTasks();
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('Real-time subscription established');
      } else {
        console.log('Subscription status:', status);
      }
    });

  return channel;
};

// Initialize store and subscription
const initializeStore = async () => {
  try {
    await useTaskStore.getState().fetchTasks();
    setupRealtimeSubscription();
  } catch (error) {
    console.error('Failed to initialize store:', error);
  }
};

// Initialize store when the module is loaded
initializeStore();

// Cleanup function
export const cleanupRealtimeSubscription = () => {
  if (channel) {
    channel.unsubscribe();
    channel = null;
  }
};

// Add cleanup on window unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', cleanupRealtimeSubscription);
}

export default useTaskStore;

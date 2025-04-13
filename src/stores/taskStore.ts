
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
  setTasks: (tasks: Task[]) => void;
  upsertTask: (task: Task) => void;
  removeTask: (taskId: string) => void;
}

const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  loading: false,
  error: null,

  setTasks: (tasks) => set({ tasks }),
  
  upsertTask: (newTask) => {
    const currentTasks = get().tasks;
    const taskIndex = currentTasks.findIndex(task => task.id === newTask.id);
    
    if (taskIndex >= 0) {
      // Update existing task
      const updatedTasks = [...currentTasks];
      updatedTasks[taskIndex] = newTask;
      set({ tasks: updatedTasks });
    } else {
      // Add new task
      set({ tasks: [newTask, ...currentTasks] });
    }
  },
  
  removeTask: (taskId) => {
    const currentTasks = get().tasks;
    const updatedTasks = currentTasks.filter(task => task.id !== taskId);
    set({ tasks: updatedTasks });
  },

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

      // NOTE: we do NOT manually update the store here
      // We will let the realtime subscription handle this
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

      // NOTE: we do NOT manually update the store here
      // We will let the realtime subscription handle this
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

      // NOTE: we do NOT manually update the store here
      // We will let the realtime subscription handle this
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
        .maybeSingle();

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

// Improved real-time subscription handling
let channel: ReturnType<typeof supabase.channel> | null = null;

const setupRealtimeSubscription = () => {
  // Clean up any existing subscription to prevent duplicates
  cleanupRealtimeSubscription();

  console.log('Setting up new real-time subscription');

  channel = supabase
    .channel('tasks-realtime-channel')
    .on(
      'postgres_changes',
      { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'tasks'
      },
      async (payload) => {
        console.log('Task inserted:', payload);
        if (!payload.new || typeof payload.new.id !== 'string') {
          console.error('Invalid payload in INSERT event:', payload);
          return;
        }

        // Get the newly inserted task
        const { data: taskData, error: taskError } = await supabase
          .from('tasks')
          .select('*')
          .eq('id', payload.new.id)
          .maybeSingle();
        
        if (taskError || !taskData) {
          console.error('Error fetching inserted task:', taskError);
          return;
        }
        
        // Get status history for this task
        const { data: statusHistoryData, error: historyError } = await supabase
          .from('status_history')
          .select('*')
          .eq('task_id', payload.new.id);
          
        if (historyError) {
          console.error('Error fetching status history:', historyError);
          return;
        }
        
        // Map to our task format
        const newTask: Task = {
          id: taskData.id,
          title: taskData.title,
          description: taskData.description || '',
          status: taskData.status as Status,
          priority: taskData.priority as Priority,
          assignedTo: taskData.assigned_to,
          createdAt: taskData.created_at,
          updatedAt: taskData.updated_at,
          userId: taskData.user_id,
          statusHistory: (statusHistoryData || []).map(history => ({
            id: history.id,
            taskId: history.task_id,
            previousStatus: history.previous_status as Status,
            newStatus: history.new_status as Status,
            changedBy: history.user_name,
            remarks: history.remarks,
            timestamp: history.created_at
          }))
        };
        
        // Update the store
        useTaskStore.getState().upsertTask(newTask);
      }
    )
    .on(
      'postgres_changes',
      { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'tasks'
      },
      async (payload) => {
        console.log('Task updated:', payload);
        if (!payload.new || typeof payload.new.id !== 'string') {
          console.error('Invalid payload in UPDATE event:', payload);
          return;
        }

        // Get the updated task with all fields
        const { data: taskData, error: taskError } = await supabase
          .from('tasks')
          .select('*')
          .eq('id', payload.new.id)
          .maybeSingle();
        
        if (taskError || !taskData) {
          console.error('Error fetching updated task:', taskError);
          return;
        }
        
        // Get status history for this task
        const { data: statusHistoryData, error: historyError } = await supabase
          .from('status_history')
          .select('*')
          .eq('task_id', payload.new.id);
          
        if (historyError) {
          console.error('Error fetching status history:', historyError);
          return;
        }
        
        // Map to our task format
        const updatedTask: Task = {
          id: taskData.id,
          title: taskData.title,
          description: taskData.description || '',
          status: taskData.status as Status,
          priority: taskData.priority as Priority,
          assignedTo: taskData.assigned_to,
          createdAt: taskData.created_at,
          updatedAt: taskData.updated_at,
          userId: taskData.user_id,
          statusHistory: (statusHistoryData || []).map(history => ({
            id: history.id,
            taskId: history.task_id,
            previousStatus: history.previous_status as Status,
            newStatus: history.new_status as Status,
            changedBy: history.user_name,
            remarks: history.remarks,
            timestamp: history.created_at
          }))
        };
        
        // Update the store
        useTaskStore.getState().upsertTask(updatedTask);
      }
    )
    .on(
      'postgres_changes',
      { 
        event: 'DELETE', 
        schema: 'public', 
        table: 'tasks'
      },
      (payload) => {
        console.log('Task deleted:', payload);
        if (!payload.old || typeof payload.old.id !== 'string') {
          console.error('Invalid payload in DELETE event:', payload);
          return;
        }
        
        // Remove task from store
        useTaskStore.getState().removeTask(payload.old.id);
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
        // When status history changes, fetch the related task
        if (payload.new && 'task_id' in payload.new && typeof payload.new.task_id === 'string') {
          const taskId = payload.new.task_id;
          
          // Get the updated task
          const { data: taskData, error: taskError } = await supabase
            .from('tasks')
            .select('*')
            .eq('id', taskId)
            .maybeSingle();
          
          if (taskError || !taskData) {
            console.error('Error fetching task for history update:', taskError);
            return;
          }
          
          // Get all status history for this task
          const { data: statusHistoryData, error: historyError } = await supabase
            .from('status_history')
            .select('*')
            .eq('task_id', taskId);
            
          if (historyError) {
            console.error('Error fetching status history:', historyError);
            return;
          }
          
          // Map to our task format
          const updatedTask: Task = {
            id: taskData.id,
            title: taskData.title,
            description: taskData.description || '',
            status: taskData.status as Status,
            priority: taskData.priority as Priority,
            assignedTo: taskData.assigned_to,
            createdAt: taskData.created_at,
            updatedAt: taskData.updated_at,
            userId: taskData.user_id,
            statusHistory: (statusHistoryData || []).map(history => ({
              id: history.id,
              taskId: history.task_id,
              previousStatus: history.previous_status as Status,
              newStatus: history.new_status as Status,
              changedBy: history.user_name,
              remarks: history.remarks,
              timestamp: history.created_at
            }))
          };
          
          // Update the store
          useTaskStore.getState().upsertTask(updatedTask);
        }
      }
    )
    .subscribe((status) => {
      console.log('Real-time subscription status:', status);
    });

  return channel;
};

// Clean up function to prevent duplicate subscriptions
export const cleanupRealtimeSubscription = () => {
  if (channel) {
    console.log('Cleaning up existing real-time subscription');
    channel.unsubscribe();
    channel = null;
  }
};

// Initialize store and subscription
const initializeStore = async () => {
  try {
    console.log('Initializing task store');
    
    // First load tasks
    await useTaskStore.getState().fetchTasks();
    
    // Then set up realtime subscription
    setupRealtimeSubscription();
    
    console.log('Task store initialized successfully');
  } catch (error) {
    console.error('Failed to initialize store:', error);
  }
};

// Initialize store when the module is loaded
initializeStore();

// Add cleanup on window unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', cleanupRealtimeSubscription);
}

export default useTaskStore;

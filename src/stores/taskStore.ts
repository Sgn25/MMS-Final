
import { create } from 'zustand';
import { Status, Task } from '@/types/task';
import { taskService } from '@/services/taskService';
import { realtimeService } from '@/services/realtimeService';

interface TaskState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  
  // Core state setters
  setTasks: (tasks: Task[]) => void;
  upsertTask: (task: Task) => void;
  removeTask: (taskId: string) => void;
  
  // API actions
  fetchTasks: () => Promise<Task[]>;
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

  // Core state setters
  setTasks: (tasks) => {
    console.log(`Setting ${tasks.length} tasks in store`);
    set({ tasks });
  },
  
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
    console.log(`Removing task ${taskId} from store`);
    const currentTasks = get().tasks;
    const updatedTasks = currentTasks.filter(task => task.id !== taskId);
    set({ tasks: updatedTasks });
  },

  // API actions
  fetchTasks: async () => {
    set({ loading: true, error: null });
    try {
      const tasks = await taskService.fetchTasks();
      console.log(`Fetched ${tasks.length} tasks in fetchTasks()`);
      set({ tasks, loading: false });
      return tasks;
    } catch (error: any) {
      console.error('Error in fetchTasks:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  addTask: async (task) => {
    set({ loading: true, error: null });
    try {
      await taskService.addTask(task);
      console.log('Task added successfully');
      
      // We'll let the realtime service handle the update, rather than
      // duplicating the task addition locally
      set({ loading: false });
    } catch (error: any) {
      console.error('Error in addTask:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateTask: async (taskId, updatedTask, userId) => {
    set({ loading: true, error: null });
    try {
      console.log(`Updating task ${taskId} with data:`, updatedTask);
      await taskService.updateTask(taskId, updatedTask, userId);
      console.log('Task update request sent successfully');
      
      // If this is a status update, update the local state immediately
      if (updatedTask.status) {
        const currentTasks = get().tasks;
        const taskIndex = currentTasks.findIndex(task => task.id === taskId);
        
        if (taskIndex >= 0) {
          // Create a shallow copy of the task
          const updatedTaskCopy = {
            ...currentTasks[taskIndex],
            ...updatedTask,
            updatedAt: new Date().toISOString()
          };
          
          // Create a new tasks array with the updated task
          const updatedTasks = [...currentTasks];
          updatedTasks[taskIndex] = updatedTaskCopy;
          
          // Update the store
          set({ tasks: updatedTasks, loading: false });
        } else {
          set({ loading: false });
        }
      } else {
        set({ loading: false });
      }
    } catch (error: any) {
      console.error('Error in updateTask:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  deleteTask: async (taskId) => {
    set({ loading: true, error: null });
    try {
      console.log(`Deleting task ${taskId}`);
      await taskService.deleteTask(taskId);
      console.log('Task deleted successfully');
      
      // Update the local state immediately for better UX
      get().removeTask(taskId);
      set({ loading: false });
    } catch (error: any) {
      console.error('Error in deleteTask:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  getTaskById: async (taskId) => {
    try {
      return await taskService.getTaskById(taskId);
    } catch (error: any) {
      set({ error: error.message });
      return null;
    }
  },

  getTasksByStatus: (status) => {
    return get().tasks.filter(task => task.status === status);
  }
}));

// Set up realtime subscription when the store is initialized
const initializeRealtimeSubscription = () => {
  console.log('Initializing realtime subscription in taskStore');
  
  const updateStoreFromRealtime = (tasks: Task[]) => {
    console.log('Received realtime update, updating store with tasks:', tasks.length);
    useTaskStore.getState().setTasks(tasks);
  };

  // Add a small delay to prevent initial duplicate fetches
  setTimeout(() => {
    realtimeService.setupTaskSubscription(updateStoreFromRealtime);
  }, 100);
};

// Initialize store and subscription
const initializeStore = async () => {
  try {
    console.log('Initializing task store');
    
    // First load tasks
    await useTaskStore.getState().fetchTasks();
    
    // Then set up realtime subscription
    initializeRealtimeSubscription();
    
    console.log('Task store initialized successfully');
  } catch (error) {
    console.error('Failed to initialize store:', error);
  }
};

// Initialize store when the module is loaded
initializeStore();

// Export cleanup function for use in App.tsx
export const cleanupRealtimeSubscription = () => {
  realtimeService.cleanupSubscription();
};

export default useTaskStore;

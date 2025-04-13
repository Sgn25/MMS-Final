
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

  // Core state setters
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

  // API actions
  fetchTasks: async () => {
    set({ loading: true, error: null });
    try {
      const tasks = await taskService.fetchTasks();
      set({ tasks, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  addTask: async (task) => {
    set({ loading: true, error: null });
    try {
      await taskService.addTask(task);
      set({ loading: false });
      // We don't update the state here - the realtime subscription will handle it
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  updateTask: async (taskId, updatedTask, userId) => {
    set({ loading: true, error: null });
    try {
      await taskService.updateTask(taskId, updatedTask, userId);
      set({ loading: false });
      // We don't update the state here - the realtime subscription will handle it
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  deleteTask: async (taskId) => {
    set({ loading: true, error: null });
    try {
      await taskService.deleteTask(taskId);
      set({ loading: false });
      // We don't update the state here - the realtime subscription will handle it
    } catch (error: any) {
      set({ error: error.message, loading: false });
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

  realtimeService.setupTaskSubscription(updateStoreFromRealtime);
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

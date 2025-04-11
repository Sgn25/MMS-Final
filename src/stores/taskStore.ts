
import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { Status, Priority, Task, StatusChange } from '@/types/task';

interface TaskState {
  tasks: Task[];
  loading: boolean;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'statusHistory'>) => void;
  updateTask: (taskId: string, updatedTask: Partial<Task> & { remarks?: string }, userId: string) => void;
  deleteTask: (taskId: string) => void;
  getTaskById: (taskId: string) => Task | undefined;
  getTasksByStatus: (status: Status) => Task[];
}

// Mock data for initial tasks
const generateMockTasks = (): Task[] => {
  return [
    {
      id: uuidv4(),
      title: 'Replace cooling fan in server room',
      description: 'The cooling fan in the server room is making noise and needs replacement.',
      status: 'Pending' as Status,
      priority: 'High' as Priority,
      assignedTo: 'John Smith',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      statusHistory: []
    },
    {
      id: uuidv4(),
      title: 'Update security cameras firmware',
      description: 'All security cameras need firmware updates for latest security patches.',
      status: 'In Progress' as Status,
      priority: 'Medium' as Priority,
      assignedTo: 'Sarah Jones',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      statusHistory: [
        {
          id: uuidv4(),
          taskId: uuidv4(),
          previousStatus: 'Pending',
          newStatus: 'In Progress',
          changedBy: 'Sarah Jones',
          remarks: 'Starting work on the firmware updates',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    },
    {
      id: uuidv4(),
      title: 'Fix leaking pipe in bathroom',
      description: 'There is a leaking pipe in the ground floor bathroom that needs immediate attention.',
      status: 'Pending' as Status,
      priority: 'High' as Priority,
      assignedTo: 'Mike Thompson',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      statusHistory: []
    },
    {
      id: uuidv4(),
      title: 'Clean air conditioning vents',
      description: 'Regular maintenance cleaning of all AC vents throughout the building.',
      status: 'Closed' as Status,
      priority: 'Low' as Priority,
      assignedTo: 'Lisa Andrews',
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
      statusHistory: [
        {
          id: uuidv4(),
          taskId: '4',
          previousStatus: 'Pending',
          newStatus: 'In Progress',
          changedBy: 'John Doe',
          remarks: 'Beginning the cleaning process',
          timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: uuidv4(),
          taskId: '4',
          previousStatus: 'In Progress',
          newStatus: 'Closed',
          changedBy: 'Lisa Andrews',
          remarks: 'All vents have been cleaned and inspected',
          timestamp: new Date().toISOString()
        }
      ]
    }
  ];
};

// Initialize the store with mock data
const useTaskStore = create<TaskState>((set, get) => ({
  tasks: generateMockTasks(),
  loading: false,
  
  addTask: (task) => {
    const newTask: Task = {
      id: uuidv4(),
      ...task,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      statusHistory: []
    };
    
    set((state) => ({
      tasks: [...state.tasks, newTask]
    }));
  },
  
  updateTask: (taskId, updatedTask, userId) => {
    set((state) => {
      const taskIndex = state.tasks.findIndex(task => task.id === taskId);
      
      if (taskIndex !== -1) {
        const currentTask = state.tasks[taskIndex];
        const newStatusHistory = [...currentTask.statusHistory];
        
        // If status is being updated, record the change in status history
        if (updatedTask.status && updatedTask.status !== currentTask.status) {
          const statusChange: StatusChange = {
            id: uuidv4(),
            taskId,
            previousStatus: currentTask.status,
            newStatus: updatedTask.status,
            changedBy: userId,
            remarks: updatedTask.remarks || 'No remarks provided',
            timestamp: new Date().toISOString()
          };
          
          newStatusHistory.push(statusChange);
        }
        
        const updatedTasks = [...state.tasks];
        updatedTasks[taskIndex] = {
          ...currentTask,
          ...updatedTask,
          updatedAt: new Date().toISOString(),
          statusHistory: newStatusHistory
        };
        
        return { tasks: updatedTasks };
      }
      
      return state;
    });
  },
  
  deleteTask: (taskId) => {
    set((state) => ({
      tasks: state.tasks.filter(task => task.id !== taskId)
    }));
  },
  
  getTaskById: (taskId) => {
    return get().tasks.find(task => task.id === taskId);
  },
  
  getTasksByStatus: (status) => {
    return get().tasks.filter(task => task.status === status);
  }
}));

export default useTaskStore;

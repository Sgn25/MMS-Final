
import { supabase } from '@/integrations/supabase/client';
import { taskService } from './taskService';
import { Task } from '@/types/task';
import { mapDbTaskToTask } from '@/utils/taskMappers';

type RealtimeCallback = (tasks: Task[]) => void;
let channel: ReturnType<typeof supabase.channel> | null = null;
let stateCallback: RealtimeCallback | null = null;

/**
 * Service for handling real-time updates from Supabase
 */
export const realtimeService = {
  /**
   * Set up real-time subscription to task-related database changes
   */
  setupTaskSubscription: (callback: RealtimeCallback): void => {
    // Store the callback
    stateCallback = callback;
    
    // Clean up any existing subscription to prevent duplicates
    realtimeService.cleanupSubscription();

    console.log('Setting up new real-time task subscription');

    // Create and configure channel
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

          // After an insert, fetch all tasks to ensure we have the latest data
          try {
            const tasks = await taskService.fetchTasks();
            if (stateCallback) stateCallback(tasks);
          } catch (error) {
            console.error('Error fetching tasks after insert:', error);
          }
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

          // After an update, fetch all tasks to ensure we have the latest data
          try {
            const tasks = await taskService.fetchTasks();
            if (stateCallback) stateCallback(tasks);
          } catch (error) {
            console.error('Error fetching tasks after update:', error);
          }
        }
      )
      .on(
        'postgres_changes',
        { 
          event: 'DELETE', 
          schema: 'public', 
          table: 'tasks'
        },
        async (payload) => {
          console.log('Task deleted:', payload);
          if (!payload.old || typeof payload.old.id !== 'string') {
            console.error('Invalid payload in DELETE event:', payload);
            return;
          }
          
          // After a delete, fetch all tasks to ensure we have the latest data
          try {
            const tasks = await taskService.fetchTasks();
            if (stateCallback) stateCallback(tasks);
          } catch (error) {
            console.error('Error fetching tasks after delete:', error);
          }
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
          
          // When status history changes, fetch all tasks again
          try {
            const tasks = await taskService.fetchTasks();
            if (stateCallback) stateCallback(tasks);
          } catch (error) {
            console.error('Error fetching tasks after status history change:', error);
          }
        }
      )
      .subscribe((status) => {
        console.log('Real-time subscription status:', status);
      });

    return;
  },

  /**
   * Clean up real-time subscription
   */
  cleanupSubscription: (): void => {
    if (channel) {
      console.log('Cleaning up existing real-time subscription');
      channel.unsubscribe();
      channel = null;
    }
    stateCallback = null;
  }
};

// Add cleanup on window unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    realtimeService.cleanupSubscription();
  });
}

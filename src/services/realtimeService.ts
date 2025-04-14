
import { supabase } from '@/integrations/supabase/client';
import { taskService } from './taskService';
import { Task } from '@/types/task';

type RealtimeCallback = (tasks: Task[]) => void;
let channel: ReturnType<typeof supabase.channel> | null = null;
let stateCallback: RealtimeCallback | null = null;
let isFirstSubscription = true;

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
          console.log('Task inserted event received:', payload);
          if (!payload.new || typeof payload.new.id !== 'string') {
            console.error('Invalid payload in INSERT event:', payload);
            return;
          }

          // After an insert, fetch all tasks immediately to ensure we have the latest data
          try {
            if (isFirstSubscription) {
              isFirstSubscription = false;
              console.log('Skipping initial subscription event');
              return;
            }
            console.log('Fetching tasks after INSERT event');
            const tasks = await taskService.fetchTasks();
            console.log(`Received ${tasks.length} tasks after INSERT`);
            if (stateCallback) {
              console.log('Calling stateCallback with updated tasks after INSERT');
              stateCallback(tasks);
            }
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
          console.log('Task updated event received:', payload);
          if (!payload.new || typeof payload.new.id !== 'string') {
            console.error('Invalid payload in UPDATE event:', payload);
            return;
          }

          try {
            console.log('Fetching tasks after UPDATE event');
            const tasks = await taskService.fetchTasks();
            console.log(`Received ${tasks.length} tasks after UPDATE`);
            if (stateCallback) {
              console.log('Calling stateCallback with updated tasks after UPDATE');
              stateCallback(tasks);
            }
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
          console.log('Task deleted event received:', payload);
          if (!payload.old || typeof payload.old.id !== 'string') {
            console.error('Invalid payload in DELETE event:', payload);
            return;
          }
          
          try {
            console.log('Fetching tasks after DELETE event');
            const tasks = await taskService.fetchTasks();
            console.log(`Received ${tasks.length} tasks after DELETE`);
            if (stateCallback) {
              console.log('Calling stateCallback with updated tasks after DELETE');
              stateCallback(tasks);
            }
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
          console.log('Status history change event received:', payload);
          
          try {
            console.log('Fetching tasks after status history change');
            const tasks = await taskService.fetchTasks();
            console.log(`Received ${tasks.length} tasks after status history change`);
            if (stateCallback) {
              console.log('Calling stateCallback with updated tasks after status history change');
              stateCallback(tasks);
            }
          } catch (error) {
            console.error('Error fetching tasks after status history change:', error);
          }
        }
      )
      .subscribe((status) => {
        console.log('Real-time subscription status:', status);
        
        // Fetch initial tasks when the subscription is established
        if (status === 'SUBSCRIBED') {
          console.log('Subscription established, fetching initial tasks');
          taskService.fetchTasks().then(tasks => {
            console.log(`Initially fetched ${tasks.length} tasks`);
            if (stateCallback) stateCallback(tasks);
          }).catch(error => {
            console.error('Error fetching initial tasks:', error);
          });
        }
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
    isFirstSubscription = true;
  }
};

// Add cleanup on window unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    realtimeService.cleanupSubscription();
  });
}

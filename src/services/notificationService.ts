
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { toast } from 'sonner';

export const notificationService = {
  /**
   * Initialize push notifications
   */
  initialize: async (): Promise<void> => {
    if (!Capacitor.isNativePlatform()) {
      console.log('Push notifications only work on native platforms');
      return;
    }

    try {
      // Request permission
      const permissionStatus = await PushNotifications.requestPermissions();
      
      if (permissionStatus.receive === 'granted') {
        // Register with FCM
        await PushNotifications.register();
        console.log('Push notification registration successful');
        
        // Set up listeners
        setupNotificationListeners();
      } else {
        console.warn('Push notification permission denied');
        toast.error('Notification permission denied. You will not receive task updates.');
      }
    } catch (error) {
      console.error('Error initializing push notifications:', error);
    }
  }
};

/**
 * Set up notification event listeners
 */
const setupNotificationListeners = () => {
  // On registration success
  PushNotifications.addListener('registration', token => {
    console.log('Push notification token:', token.value);
    // We'll need to send this token to our backend
    saveTokenToSupabase(token.value);
  });

  // On registration error
  PushNotifications.addListener('registrationError', err => {
    console.error('Push notification registration error:', err);
    toast.error('Failed to register for notifications');
  });

  // On notification received
  PushNotifications.addListener('pushNotificationReceived', notification => {
    console.log('Push notification received:', notification);
    toast.info(`${notification.title}: ${notification.body}`);
  });

  // On notification clicked
  PushNotifications.addListener('pushNotificationActionPerformed', action => {
    console.log('Push notification action performed:', action);
    // Handle navigation if needed based on the notification
  });
};

/**
 * Save FCM token to Supabase for this user
 */
const saveTokenToSupabase = async (token: string) => {
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session || !session.user) {
      console.error('No authenticated user found');
      return;
    }
    
    // Use the device_tokens table that we just created
    const { error } = await supabase
      .from('device_tokens')
      .upsert({
        user_id: session.user.id,
        token: token,
        device_type: 'android',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,token'
      });
    
    if (error) {
      console.error('Error saving token to Supabase:', error);
    } else {
      console.log('FCM token saved to Supabase');
    }
  } catch (error) {
    console.error('Error saving token:', error);
  }
};

export default notificationService;

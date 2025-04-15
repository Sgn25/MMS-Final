
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.6362a784225c4a509f46be52f5230450',
  appName: 'milma-task-flow-control',
  webDir: 'dist',
  server: {
    url: "https://6362a784-225c-4a50-9f46-be52f5230450.lovableproject.com?forceHideBadge=true",
    cleartext: true
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    }
  }
};

export default config;

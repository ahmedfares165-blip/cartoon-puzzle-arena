import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.puzzlearena.ar',
  appName: 'ساحة الألغاز',
  webDir: 'public',
  server: { androidScheme: 'https', cleartext: true }
};

export default config;

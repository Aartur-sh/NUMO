import { registerPlugin, Capacitor } from '@capacitor/core';

export interface NativeAppUpdatePlugin {
  canInstall(): Promise<{ canInstall: boolean }>;
  openInstallSettings(): Promise<void>;
  downloadAndInstall(options: { url: string; version: string }): Promise<{ success: boolean }>;
  openExternalUrl(options: { url: string }): Promise<void>;
  addListener(
    eventName: 'downloadProgress',
    listenerFunc: (data: { progress: number; total: number; downloaded: number }) => void
  ): Promise<any>;
}

// Register native plugin for Capacitor Android
const AppUpdateNative = registerPlugin<NativeAppUpdatePlugin>('AppUpdate');

export const NativeUpdate = {
  isNative(): boolean {
    return Capacitor.isNativePlatform();
  },

  async canInstall(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      return true;
    }
    try {
      const res = await AppUpdateNative.canInstall();
      return res?.canInstall ?? true;
    } catch (e) {
      console.warn('Native canInstall check failed:', e);
      return true;
    }
  },

  async openInstallSettings(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    try {
      await AppUpdateNative.openInstallSettings();
    } catch (e) {
      console.warn('Native openInstallSettings failed:', e);
    }
  },

  async downloadAndInstall(
    url: string,
    version: string,
    onProgress?: (percent: number) => void
  ): Promise<{ success: boolean; error?: string }> {
    if (!Capacitor.isNativePlatform()) {
      // In web browser, direct download
      window.open(url, '_blank');
      return { success: true };
    }

    try {
      let listener: any = null;
      if (onProgress) {
        try {
          listener = await AppUpdateNative.addListener('downloadProgress', (data) => {
            if (typeof data?.progress === 'number') {
              onProgress(data.progress);
            }
          });
        } catch (e) {
          console.warn('Could not register progress listener:', e);
        }
      }

      const res = await AppUpdateNative.downloadAndInstall({ url, version });

      if (listener && typeof listener.remove === 'function') {
        listener.remove();
      }

      return { success: res?.success ?? true };
    } catch (err: any) {
      console.error('downloadAndInstall error:', err);
      return {
        success: false,
        error: err?.message || 'Помилка при завантаженні або встановленні APK',
      };
    }
  },

  /**
   * Open an external link.
   * On Android: fires ACTION_VIEW intent so if Monobank app is installed,
   * Android opens the Monobank app directly. If not installed, it opens in
   * the user's default browser (Chrome, etc.) without any WebView errors!
   */
  async openExternalUrl(url: string): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      try {
        await AppUpdateNative.openExternalUrl({ url });
        return;
      } catch (e) {
        console.warn('Native openExternalUrl failed, falling back:', e);
      }
    }

    // Web / browser fallback
    try {
      const win = window.open(url, '_system');
      if (!win) {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    } catch {
      window.location.href = url;
    }
  },
};

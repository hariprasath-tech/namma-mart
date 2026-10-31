/**
 * PWA Service Worker & Installability Manager
 * Manages service worker lifecycle, offline/online status, and installation prompts
 */

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

let deferredInstallPrompt: InstallPromptEvent | null = null;
const installListeners = new Set<(canInstall: boolean) => void>();
const onlineListeners = new Set<(isOnline: boolean) => void>();
const updateListeners = new Set<() => void>();

export function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      console.log('[PWA] ServiceWorker registered with scope:', registration.scope);

      // Check for updates
      registration.addEventListener('updatefound', () => {
        const installingWorker = registration.installing;
        if (!installingWorker) return;
        installingWorker.addEventListener('statechange', () => {
          if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('[PWA] New version available! Ready to refresh.');
            updateListeners.forEach((fn) => fn());
          }
        });
      });
    } catch (err) {
      console.warn('[PWA] ServiceWorker registration failed:', err);
    }
  });

  // Capture install prompt
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e as InstallPromptEvent;
    installListeners.forEach((fn) => fn(true));
  });

  // Track appinstalled
  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    installListeners.forEach((fn) => fn(false));
    console.log('[PWA] LocalKart was successfully installed on the device!');
  });

  // Online / Offline tracking
  window.addEventListener('online', () => {
    onlineListeners.forEach((fn) => fn(true));
  });
  window.addEventListener('offline', () => {
    onlineListeners.forEach((fn) => fn(false));
  });
}

export function promptPwaInstall(): Promise<boolean> {
  if (!deferredInstallPrompt) {
    return Promise.resolve(false);
  }
  return deferredInstallPrompt.prompt().then(() => {
    return deferredInstallPrompt!.userChoice.then((choice) => {
      deferredInstallPrompt = null;
      installListeners.forEach((fn) => fn(false));
      return choice.outcome === 'accepted';
    });
  });
}

export function isPwaInstallable(): boolean {
  return deferredInstallPrompt !== null;
}

export function subscribeToInstallable(fn: (canInstall: boolean) => void): () => void {
  installListeners.add(fn);
  fn(deferredInstallPrompt !== null);
  return () => installListeners.delete(fn);
}

export function subscribeToOnline(fn: (isOnline: boolean) => void): () => void {
  onlineListeners.add(fn);
  fn(typeof navigator !== 'undefined' ? navigator.onLine : true);
  return () => onlineListeners.delete(fn);
}

export function subscribeToUpdate(fn: () => void): () => void {
  updateListeners.add(fn);
  return () => updateListeners.delete(fn);
}

export function skipWaitingAndReload() {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
  }
  window.location.reload();
}

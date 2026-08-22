// Web Push Notification & Scheduled Reminder Service

export interface NotificationSettings {
  enabled: boolean;
  dailyReminderTime: string; // '21:00'
  recurringDebitWarnings: boolean;
  budgetThresholdAlerts: boolean;
}

const NOTIF_STORAGE_KEY = 'clearspend_notif_settings_v1';

export function loadNotificationSettings(): NotificationSettings {
  try {
    const raw = localStorage.getItem(NOTIF_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}

  return {
    enabled: false,
    dailyReminderTime: '21:00',
    recurringDebitWarnings: true,
    budgetThresholdAlerts: true,
  };
}

export function saveNotificationSettings(settings: NotificationSettings): void {
  try {
    localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(settings));
  } catch {}
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      return reg;
    } catch (err) {
      console.warn('Service worker registration failed:', err);
    }
  }
  return null;
}

export function sendLocalNotification(title: string, body: string, url: string = '/'): void {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  try {
    new Notification(title, {
      body,
      icon: '/icons/icon-192.png',
      data: url,
    });
  } catch (err) {
    console.warn('Failed to dispatch notification:', err);
  }
}

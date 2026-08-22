// Daily Logging Streaks & No-Spend Engine
import { Transaction } from '../types';

export interface StreakState {
  currentStreak: number;
  longestStreak: number;
  lastLoggedDate: string | null;
  noSpendDates: string[]; // Dates where user marked "No spend today"
  freezesRemaining: number;
  lastFreezeMonth: string | null;
  loggedToday: boolean;
  milestoneReached: number | null;
}

const STREAK_KEY = 'clearspend_streaks_v1';

export function loadStreakState(): StreakState {
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}

  return {
    currentStreak: 0,
    longestStreak: 0,
    lastLoggedDate: null,
    noSpendDates: [],
    freezesRemaining: 1,
    lastFreezeMonth: null,
    loggedToday: false,
    milestoneReached: null,
  };
}

export function saveStreakState(state: StreakState): void {
  try {
    localStorage.setItem(STREAK_KEY, JSON.stringify(state));
  } catch {}
}

export function calculateStreaks(transactions: Transaction[], currentState: StreakState): StreakState {
  const today = new Date().toISOString().split('T')[0];
  const activeDates = new Set<string>();

  // Collect all dates with active transactions
  transactions.forEach((t) => {
    if (t.status === 'active' && t.txn_date) {
      activeDates.add(t.txn_date);
    }
  });

  // Also include "No spend today" logged dates
  currentState.noSpendDates.forEach((d) => activeDates.add(d));

  const sortedDates = Array.from(activeDates).sort().reverse();
  const loggedToday = activeDates.has(today);

  let currentStreak = 0;
  let checkDate = new Date();

  // If not logged today, check if yesterday was logged (streak still active today)
  if (!loggedToday) {
    const yesterday = new Date(checkDate);
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = yesterday.toISOString().split('T')[0];
    if (!activeDates.has(yStr)) {
      currentStreak = 0;
    } else {
      checkDate = yesterday;
    }
  }

  // Count consecutive backwards days
  while (true) {
    const dateStr = checkDate.toISOString().split('T')[0];
    if (activeDates.has(dateStr)) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  const longestStreak = Math.max(currentState.longestStreak || 0, currentStreak);

  // Check milestones (7, 14, 30, 60, 100)
  const milestones = [7, 14, 30, 60, 100];
  let milestoneReached: number | null = null;
  if (milestones.includes(currentStreak) && currentStreak !== currentState.milestoneReached) {
    milestoneReached = currentStreak;
  }

  const updated: StreakState = {
    ...currentState,
    currentStreak,
    longestStreak,
    lastLoggedDate: sortedDates[0] || null,
    loggedToday,
    milestoneReached,
  };

  saveStreakState(updated);
  return updated;
}

export function recordNoSpendToday(currentState: StreakState): StreakState {
  const today = new Date().toISOString().split('T')[0];
  const noSpendDates = Array.from(new Set([...currentState.noSpendDates, today]));

  const updated: StreakState = {
    ...currentState,
    noSpendDates,
    currentStreak: currentState.currentStreak + (currentState.loggedToday ? 0 : 1),
    loggedToday: true,
  };

  saveStreakState(updated);
  return updated;
}

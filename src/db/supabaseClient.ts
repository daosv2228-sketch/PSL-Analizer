import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface ScanRecord {
  id: string;
  date: string;
  score: number;
  scoreMargin: number; // 0.1
  fwhr?: number;
  midface?: number;
  canthalTilt?: number;
  symmetry?: number;
  jawAngle?: number;
  chinRatio?: number;
  photoThumbnail?: string; // downscaled base64 image (<=960px JPEG, ~80-120KB)
  modelName?: string;
  verdict?: string;
}

export interface UserRecord {
  id: number;
  firstName?: string;
  username?: string;
  timeZone?: string;
  isPro?: boolean;
  has30DayPlan?: boolean;
  planStartDate?: string;
  starsBalance?: number;
  purchases: Array<{ type: string; stars: number; date: string }>;
  scansCount: number;
  referrals: number;
  referredBy?: string;
  scans: ScanRecord[];
  completedHabits: { [day: number]: boolean };
  lastMorningNotificationDaySent?: number;
  lastEveningNotificationDaySent?: number;
}

let supabase: SupabaseClient | null = null;

const SUPABASE_URL = process.env.SUPABASE_URL || '';
// Prefer service_role key on backend to bypass RLS safely and reliably
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || '';

if (SUPABASE_URL && SUPABASE_KEY) {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    console.log('⚡ Supabase Client initialized successfully with server-side credentials');
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
  }
}

export function isSupabaseEnabled(): boolean {
  return !!supabase;
}

export async function fetchUserFromSupabase(id: number): Promise<UserRecord | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('telegram_users')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.warn(`Supabase fetchUser error for user ${id}:`, error.message);
      return null;
    }
    if (!data) return null;

    return {
      id: Number(data.id),
      firstName: data.first_name,
      username: data.username,
      timeZone: data.timezone || 'Europe/Moscow',
      isPro: !!data.is_pro,
      has30DayPlan: !!data.has_30_day_plan,
      planStartDate: data.plan_start_date,
      starsBalance: data.stars_balance || 0,
      purchases: Array.isArray(data.purchases) ? data.purchases : [],
      scansCount: data.scans_count || 0,
      referrals: data.referrals || 0,
      referredBy: data.referred_by,
      scans: Array.isArray(data.scans) ? data.scans : [],
      completedHabits: (typeof data.completed_habits === 'object' && data.completed_habits !== null)
        ? data.completed_habits
        : {},
      lastMorningNotificationDaySent: data.last_morning_notification_day_sent,
      lastEveningNotificationDaySent: data.last_evening_notification_day_sent,
    };
  } catch (e: any) {
    console.error(`Unexpected error fetching user ${id} from Supabase:`, e.message);
    return null;
  }
}

export async function persistUserToSupabase(user: UserRecord): Promise<boolean> {
  if (!supabase) return false;
  try {
    const payload = {
      id: user.id,
      first_name: user.firstName || null,
      username: user.username || null,
      timezone: user.timeZone || 'Europe/Moscow',
      is_pro: !!user.isPro,
      has_30_day_plan: !!user.has30DayPlan,
      plan_start_date: user.planStartDate || null,
      stars_balance: user.starsBalance || 0,
      purchases: user.purchases || [],
      scans_count: (user.scans && user.scans.length) || user.scansCount || 0,
      referrals: user.referrals || 0,
      referred_by: user.referredBy || null,
      scans: user.scans || [],
      completed_habits: user.completedHabits || {},
      last_morning_notification_day_sent: user.lastMorningNotificationDaySent || null,
      last_evening_notification_day_sent: user.lastEveningNotificationDaySent || null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('telegram_users')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.error(`Supabase persistUser error for user ${user.id}:`, error.message);
      return false;
    }
    return true;
  } catch (e: any) {
    console.error(`Unexpected error persisting user ${user.id} to Supabase:`, e.message);
    return false;
  }
}

export async function fetchAllUsersFromSupabase(): Promise<UserRecord[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('telegram_users')
      .select('*');

    if (error) {
      console.warn('Supabase fetchAllUsers error:', error.message);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: Number(row.id),
      firstName: row.first_name,
      username: row.username,
      timeZone: row.timezone || 'Europe/Moscow',
      isPro: !!row.is_pro,
      has30DayPlan: !!row.has_30_day_plan,
      planStartDate: row.plan_start_date,
      starsBalance: row.stars_balance || 0,
      purchases: Array.isArray(row.purchases) ? row.purchases : [],
      scansCount: row.scans_count || 0,
      referrals: row.referrals || 0,
      referredBy: row.referred_by,
      scans: Array.isArray(row.scans) ? row.scans : [],
      completedHabits: (typeof row.completed_habits === 'object' && row.completed_habits !== null)
        ? row.completed_habits
        : {},
      lastMorningNotificationDaySent: row.last_morning_notification_day_sent,
      lastEveningNotificationDaySent: row.last_evening_notification_day_sent,
    }));
  } catch (e: any) {
    console.error('Unexpected error fetching all users from Supabase:', e.message);
    return [];
  }
}

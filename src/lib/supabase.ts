import { createClient } from '@supabase/supabase-js';
import { Participant, Prize, StoreSettings, WheelState, CurrentPrize } from '../types';

export const SUPABASE_URL =
  (typeof process !== 'undefined' && process.env?.SUPABASE_URL) ||
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  'https://wrfbukhfjwdrfvbscfub.supabase.co';

export const SUPABASE_ANON_KEY =
  (typeof process !== 'undefined' && process.env?.SUPABASE_ANON_KEY) ||
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyZmJ1a2hmandkcmZ2YnNjZnViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkzMjAzNjgsImV4cCI6MjEwNDg5NjM2OH0.wj6cF8k4Wr6Fpw92HLCRI3Yy5VpPf9XvYLZW7Jg_L0s';

// Initialize Supabase Client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Map Supabase DB Row to Participant Interface
export function mapRowToParticipant(row: Record<string, any>): Participant {
  return {
    id: row.id,
    ticketNumber: Number(row.ticket_number ?? row.ticketNumber ?? 1000),
    name: String(row.name || ''),
    phone: String(row.phone || ''),
    registeredAt: String(row.registered_at ?? row.registeredAt ?? row.created_at ?? new Date().toISOString()),
    hasWon: Boolean(row.has_won ?? row.hasWon ?? false),
    wonAt: row.won_at ?? row.wonAt ?? undefined,
    prizeWon: row.prize_won ?? row.prizeWon ?? undefined,
  };
}

// Map Participant to Supabase DB Row
export function mapParticipantToRow(p: Participant): Record<string, any> {
  return {
    id: p.id,
    ticket_number: p.ticketNumber,
    ticketNumber: p.ticketNumber,
    name: p.name,
    phone: p.phone,
    registered_at: p.registeredAt,
    registeredAt: p.registeredAt,
    has_won: p.hasWon,
    hasWon: p.hasWon,
    won_at: p.wonAt || null,
    wonAt: p.wonAt || null,
    prize_won: p.prizeWon || null,
    prizeWon: p.prizeWon || null,
  };
}

// Map Supabase DB Row to Prize Interface
export function mapRowToPrize(row: Record<string, any>): Prize {
  return {
    id: row.id,
    title: String(row.title || ''),
    quantity: Number(row.quantity ?? 1),
    icon: String(row.icon || 'Trophy'),
    color: String(row.color || '#F59E0B'),
  };
}

// Fetch all participants directly from Supabase
export async function getParticipantsFromSupabase(): Promise<Participant[]> {
  try {
    const { data, error } = await supabase
      .from('participants')
      .select('*')
      .order('ticket_number', { ascending: true });

    if (error) {
      console.error('Error fetching participants from Supabase:', error);
      return [];
    }
    return (data || []).map(mapRowToParticipant);
  } catch (err) {
    console.error('Exception fetching participants from Supabase:', err);
    return [];
  }
}

// Fetch all prizes directly from Supabase
export async function getPrizesFromSupabase(): Promise<Prize[]> {
  try {
    const { data, error } = await supabase
      .from('prizes')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching prizes from Supabase:', error);
      return [];
    }
    return (data || []).map(mapRowToPrize);
  } catch (err) {
    console.error('Exception fetching prizes from Supabase:', err);
    return [];
  }
}

// Fetch giveaway settings directly from Supabase
export async function getSettingsFromSupabase(): Promise<{
  settings: Partial<StoreSettings>;
  currentPrize: CurrentPrize;
  wheelState: WheelState;
} | null> {
  try {
    const { data, error } = await supabase
      .from('giveaway_settings')
      .select('*')
      .eq('id', 'default')
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    const currentPrize: CurrentPrize = {
      title: data.current_prize?.title || '',
      details: data.current_prize?.details || '',
    };

    const wheelState: WheelState = {
      isSpinning: Boolean(data.wheel_state?.isSpinning),
      winnerName: data.wheel_state?.winnerName || undefined,
      winnerId: data.wheel_state?.winnerId || undefined,
      winnerTicket: data.wheel_state?.winnerTicket ? Number(data.wheel_state.winnerTicket) : undefined,
      prizeTitle: data.wheel_state?.prizeTitle || undefined,
      spunAt: data.wheel_state?.spunAt || undefined,
    };

    const settings: Partial<StoreSettings> = {
      storeName: data.store_name || 'سحب وقيف اوي المتاجر',
      storeTagline: data.store_tagline || 'سحب حصري وعجلة الحظ الكبرى للمشاركين الكرام',
      giveawayTitle: data.giveaway_title || 'السحب الكبير وعجلة الحظ',
      giveawayDescription: data.giveaway_description || '',
      logoUrl: data.logo_url || '',
      themeId: data.theme_id || 'r3d-turquoise',
      isRegistrationOpen: data.is_registration_open ?? true,
      allowDuplicates: Boolean(data.allow_duplicates),
      maskPhoneNumbers: data.mask_phone_numbers ?? true,
      adminPin: data.admin_pin || 'Alrneem9@1',
      currentPrize,
      wheelState,
    };

    return { settings, currentPrize, wheelState };
  } catch (err) {
    console.error('Exception fetching settings from Supabase:', err);
    return null;
  }
}

// Save or update prize directly in Supabase
export async function savePrizeToSupabase(prize: Prize): Promise<boolean> {
  try {
    const { error } = await supabase.from('prizes').upsert({
      id: prize.id,
      title: prize.title,
      quantity: prize.quantity,
      icon: prize.icon || 'Trophy',
      color: prize.color || '#F59E0B',
    });
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Failed to save prize to Supabase:', err);
    return false;
  }
}

// Delete prize directly from Supabase
export async function deletePrizeFromSupabase(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('prizes').delete().eq('id', id);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Failed to delete prize from Supabase:', err);
    return false;
  }
}

// Check Supabase connection status
export async function checkSupabaseConnection(): Promise<{
  ok: boolean;
  participantsCount: number;
  prizesCount: number;
  error?: string;
}> {
  try {
    const [{ count: pCount, error: pErr }, { count: prCount, error: prErr }] = await Promise.all([
      supabase.from('participants').select('*', { count: 'exact', head: true }),
      supabase.from('prizes').select('*', { count: 'exact', head: true }),
    ]);

    if (pErr || prErr) {
      return {
        ok: false,
        participantsCount: 0,
        prizesCount: 0,
        error: pErr?.message || prErr?.message,
      };
    }

    return {
      ok: true,
      participantsCount: pCount ?? 0,
      prizesCount: prCount ?? 0,
    };
  } catch (err: any) {
    return {
      ok: false,
      participantsCount: 0,
      prizesCount: 0,
      error: err.message,
    };
  }
}

// Cloud Lookup for Participant (Replaces localStorage for instant multi-device / cloud sync)
export async function lookupParticipantFromCloud(query: string): Promise<Participant | null> {
  if (!query || !query.trim()) return null;
  const clean = query.trim();

  try {
    // Try matching ID
    const { data: byId } = await supabase
      .from('participants')
      .select('*')
      .eq('id', clean)
      .maybeSingle();
    if (byId) return mapRowToParticipant(byId);

    // Try matching phone
    const { data: byPhone } = await supabase
      .from('participants')
      .select('*')
      .eq('phone', clean)
      .order('registered_at', { ascending: false })
      .limit(1);
    if (byPhone && byPhone.length > 0) return mapRowToParticipant(byPhone[0]);

    // Try matching ticket number if integer
    const ticketNum = parseInt(clean, 10);
    if (!isNaN(ticketNum)) {
      const { data: byTicket } = await supabase
        .from('participants')
        .select('*')
        .eq('ticket_number', ticketNum)
        .maybeSingle();
      if (byTicket) return mapRowToParticipant(byTicket);
    }
  } catch (err) {
    console.error('Error looking up participant in cloud:', err);
  }

  return null;
}

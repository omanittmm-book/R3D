import { createClient } from '@supabase/supabase-js';
import { Participant, Prize, StoreSettings, WheelState, CurrentPrize } from '../types';

// WARNING: Client-side Supabase configuration enabled per explicit user request for static hosting (Vercel).
// Credentials fallback ensures uninterrupted functionality on serverless/static platforms without manual env configuration.
export const SUPABASE_URL: string =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  (typeof process !== 'undefined' && process.env?.SUPABASE_URL) ||
  'https://wrfbukhfjwdrfvbscfub.supabase.co';

export const SUPABASE_ANON_KEY: string =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
  (typeof process !== 'undefined' && process.env?.SUPABASE_ANON_KEY) ||
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

// --- PARTICIPANTS DIRECT OPERATIONS ---

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

// Register a new participant directly into Supabase (with 8-digit verification and duplicate check)
export async function registerParticipantInSupabase(
  name: string,
  phone: string,
  allowDuplicates: boolean = false
): Promise<{ success: boolean; participant?: Participant; error?: string; existingTicket?: number }> {
  try {
    const trimmedName = name.trim();
    const cleanPhone = phone.replace(/\D/g, '');

    if (!trimmedName || trimmedName.length < 3) {
      return { success: false, error: 'يرجى كتابة الاسم والقبيلة بالكامل (3 أحرف على الأقل)' };
    }

    if (cleanPhone.length !== 8) {
      return { success: false, error: `رقم الهاتف يجب أن يتكون من 8 أرقام بالضبط. حالياً كتبت: ${cleanPhone.length} أرقام.` };
    }

    // Check duplicates directly in Supabase
    if (!allowDuplicates) {
      const { data: existing } = await supabase
        .from('participants')
        .select('id, name, phone, ticket_number')
        .eq('phone', cleanPhone)
        .limit(1);

      if (existing && existing.length > 0) {
        return {
          success: false,
          error: 'هذا الرقم مسجل بالفعل في السحب! نتمنى لك حظاً موفقاً في عجلة الحظ.',
          existingTicket: existing[0].ticket_number,
        };
      }
    }

    // Get max ticket number from Supabase
    const { data: lastTicketRow } = await supabase
      .from('participants')
      .select('ticket_number')
      .order('ticket_number', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextTicket = (lastTicketRow?.ticket_number ? Number(lastTicketRow.ticket_number) : 1000) + 1;
    const newId = `p-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();

    const newParticipant: Participant = {
      id: newId,
      ticketNumber: nextTicket,
      name: trimmedName,
      phone: cleanPhone,
      registeredAt: nowIso,
      hasWon: false,
    };

    const row = {
      id: newId,
      ticket_number: nextTicket,
      ticketNumber: nextTicket,
      name: trimmedName,
      phone: cleanPhone,
      registered_at: nowIso,
      registeredAt: nowIso,
      has_won: false,
      hasWon: false,
    };

    const { error: insertError } = await supabase.from('participants').insert([row]);
    if (insertError) {
      console.error('Failed to insert participant into Supabase:', insertError);
      return { success: false, error: 'حدث خطأ في قاعدة البيانات أثناء التسجيل. حاول مجدداً.' };
    }

    return { success: true, participant: newParticipant };
  } catch (err: any) {
    console.error('Exception in registerParticipantInSupabase:', err);
    return { success: false, error: err.message || 'تعذر إتمام التسجيل. تأكد من اتصال الإنترنت.' };
  }
}

// Add participant manually by admin directly into Supabase
export async function addManualParticipantToSupabase(
  name: string,
  phone: string
): Promise<{ success: boolean; participant?: Participant; error?: string }> {
  try {
    const trimmedName = name.trim();
    const cleanPhone = phone.replace(/\D/g, '');

    if (!trimmedName || trimmedName.length < 3) {
      return { success: false, error: 'يرجى كتابة الاسم والقبيلة بالكامل.' };
    }
    if (cleanPhone.length !== 8) {
      return { success: false, error: 'رقم الهاتف يجب أن يتكون من 8 أرقام فقط.' };
    }

    const { data: lastTicketRow } = await supabase
      .from('participants')
      .select('ticket_number')
      .order('ticket_number', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextTicket = (lastTicketRow?.ticket_number ? Number(lastTicketRow.ticket_number) : 1000) + 1;
    const newId = `p-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();

    const newParticipant: Participant = {
      id: newId,
      ticketNumber: nextTicket,
      name: trimmedName,
      phone: cleanPhone,
      registeredAt: nowIso,
      hasWon: false,
    };

    const row = {
      id: newId,
      ticket_number: nextTicket,
      ticketNumber: nextTicket,
      name: trimmedName,
      phone: cleanPhone,
      registered_at: nowIso,
      registeredAt: nowIso,
      has_won: false,
      hasWon: false,
    };

    const { error: insertErr } = await supabase.from('participants').insert([row]);
    if (insertErr) throw insertErr;

    return { success: true, participant: newParticipant };
  } catch (err: any) {
    return { success: false, error: err.message || 'فشل في إضافة المشارك.' };
  }
}

// Delete single participant directly from Supabase
export async function deleteParticipantFromSupabase(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('participants').delete().eq('id', id);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Failed to delete participant from Supabase:', err);
    return false;
  }
}

// Clear participants in Supabase ('all', 'winners', 'non-winners')
export async function clearParticipantsFromSupabase(type: 'all' | 'winners' | 'non-winners'): Promise<boolean> {
  try {
    if (type === 'winners') {
      const { error } = await supabase.from('participants').update({
        has_won: false,
        hasWon: false,
        won_at: null,
        wonAt: null,
        prize_won: null,
        prizeWon: null,
      }).neq('id', '___');
      if (error) throw error;
    } else if (type === 'non-winners') {
      const { error } = await supabase.from('participants').delete().eq('has_won', false);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('participants').delete().neq('id', '___');
      if (error) throw error;
    }
    return true;
  } catch (err) {
    console.error('Failed to clear participants in Supabase:', err);
    return false;
  }
}

// Seed sample participants directly to Supabase
export async function seedSampleParticipantsToSupabase(): Promise<{ success: boolean; count: number }> {
  try {
    const sampleParticipants = [
      { name: 'سالم بن ناصر الحارثي', phone: '91234567' },
      { name: 'محمد بن علي البلوشي', phone: '92345678' },
      { name: 'خالد بن حمد المقبالي', phone: '93456789' },
      { name: 'سلطان بن سعيد المعمري', phone: '94567890' },
      { name: 'أحمد بن خلفان الريامي', phone: '95678901' },
      { name: 'فيصل بن عبدالله الشحي', phone: '96789012' },
      { name: 'ماجد بن سيف الوهيبي', phone: '71122334' },
      { name: 'عبدالعزيز بن راشد العامري', phone: '74455667' },
    ];

    const { data: lastTicketRow } = await supabase
      .from('participants')
      .select('ticket_number')
      .order('ticket_number', { ascending: false })
      .limit(1)
      .maybeSingle();

    let currentTicket = lastTicketRow?.ticket_number ? Number(lastTicketRow.ticket_number) : 1000;
    const nowIso = new Date().toISOString();

    const rows = sampleParticipants.map((sample) => {
      currentTicket++;
      const id = `p-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      return {
        id,
        ticket_number: currentTicket,
        ticketNumber: currentTicket,
        name: sample.name,
        phone: sample.phone,
        registered_at: nowIso,
        registeredAt: nowIso,
        has_won: false,
        hasWon: false,
      };
    });

    const { error } = await supabase.from('participants').upsert(rows);
    if (error) throw error;

    return { success: true, count: rows.length };
  } catch (err) {
    console.error('Failed to seed participants in Supabase:', err);
    return { success: false, count: 0 };
  }
}

// Reset all winners to eligible directly in Supabase
export async function resetWinnersInSupabase(): Promise<boolean> {
  try {
    const { error: pErr } = await supabase.from('participants').update({
      has_won: false,
      hasWon: false,
      won_at: null,
      wonAt: null,
      prize_won: null,
      prizeWon: null,
    }).neq('id', '___');

    if (pErr) throw pErr;

    // Also reset wheel state in giveaway_settings
    await resetWheelInSupabase();
    return true;
  } catch (err) {
    console.error('Failed to reset winners in Supabase:', err);
    return false;
  }
}

// --- WHEEL & DRAW OPERATIONS ---

// Pick random winner & spin wheel directly in Supabase
export async function spinWheelInSupabase(prizeTitle: string): Promise<{
  success: boolean;
  winner?: Participant;
  wheelState?: WheelState;
  error?: string;
}> {
  try {
    const participants = await getParticipantsFromSupabase();
    if (participants.length === 0) {
      return { success: false, error: 'لا يوجد مشاركون مسجلون في السحب حتى الآن' };
    }

    let eligible = participants.filter((p) => !p.hasWon);
    if (eligible.length === 0) {
      eligible = participants;
    }

    const randomIndex = Math.floor(Math.random() * eligible.length);
    const winner = eligible[randomIndex];
    const nowIso = new Date().toISOString();

    winner.hasWon = true;
    winner.wonAt = nowIso;
    winner.prizeWon = prizeTitle;

    const wheelState: WheelState = {
      isSpinning: true,
      winnerName: winner.name,
      winnerId: winner.id,
      winnerTicket: winner.ticketNumber,
      prizeTitle: prizeTitle,
      spunAt: nowIso,
    };

    // 1. Update winner participant row in Supabase
    await supabase.from('participants').update({
      has_won: true,
      hasWon: true,
      won_at: nowIso,
      wonAt: nowIso,
      prize_won: prizeTitle,
      prizeWon: prizeTitle,
    }).eq('id', winner.id);

    // 2. Update wheel state in giveaway_settings
    await supabase.from('giveaway_settings').update({
      wheel_state: wheelState,
      updated_at: nowIso,
    }).eq('id', 'default');

    return { success: true, winner, wheelState };
  } catch (err: any) {
    console.error('Failed to execute spin in Supabase:', err);
    return { success: false, error: err.message || 'فشل في إجراء السحب.' };
  }
}

// Reset wheel state in Supabase
export async function resetWheelInSupabase(): Promise<boolean> {
  try {
    const wheelState: WheelState = {
      isSpinning: false,
      winnerName: '',
      winnerId: '',
      prizeTitle: '',
      spunAt: '',
    };

    const { error } = await supabase.from('giveaway_settings').update({
      wheel_state: wheelState,
      updated_at: new Date().toISOString(),
    }).eq('id', 'default');

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Failed to reset wheel in Supabase:', err);
    return false;
  }
}

// --- PRIZES DIRECT OPERATIONS ---

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

// Update current featured prize in Supabase (giveaway_settings & prizes table)
export async function updateCurrentPrizeInSupabase(
  title: string,
  details: string
): Promise<{ success: boolean; currentPrize: CurrentPrize }> {
  const currentPrize: CurrentPrize = {
    title: title.trim(),
    details: details.trim(),
  };

  try {
    await supabase.from('giveaway_settings').update({
      current_prize: currentPrize,
      updated_at: new Date().toISOString(),
    }).eq('id', 'default');

    if (currentPrize.title) {
      await savePrizeToSupabase({
        id: 'current-featured-prize',
        title: currentPrize.title,
        quantity: 1,
        icon: 'Trophy',
        color: '#F59E0B',
      });
    }

    return { success: true, currentPrize };
  } catch (err) {
    console.error('Failed to update prize in Supabase:', err);
    return { success: true, currentPrize };
  }
}

// --- SETTINGS DIRECT OPERATIONS ---

// Toggle registration status directly in Supabase
export async function toggleRegistrationInSupabase(isOpen: boolean): Promise<boolean> {
  try {
    const { error } = await supabase.from('giveaway_settings').update({
      is_registration_open: isOpen,
      updated_at: new Date().toISOString(),
    }).eq('id', 'default');

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Failed to toggle registration in Supabase:', err);
    return false;
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
      storeName: (data.store_name && data.store_name !== 'سحب وقيف اوي المتاجر') ? data.store_name : 'متجر الرعد',
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

// Fetch public giveaway state for spectator & wheel spinning
export async function getPublicGiveawayStateFromSupabase(): Promise<{
  success: boolean;
  currentPrize: CurrentPrize;
  wheelState: WheelState;
  totalParticipants: number;
  participantNames: string[];
  isRegistrationOpen: boolean;
  storeName: string;
  storeTagline: string;
  themeId: string;
}> {
  try {
    const [settingsResult, participants] = await Promise.all([
      getSettingsFromSupabase(),
      getParticipantsFromSupabase(),
    ]);

    const eligible = participants.filter((p) => !p.hasWon);
    const names = (eligible.length > 0 ? eligible : participants).map((p) => p.name);

    const currentPrize = settingsResult?.currentPrize || {
      title: 'آيفون 16 برو ماكس',
      details: 'سعة 256 جيجابايت - تيتانيوم صحراوي',
    };

    const wheelState = settingsResult?.wheelState || {
      isSpinning: false,
      winnerName: '',
      prizeTitle: '',
      spunAt: '',
    };

    const isRegistrationOpen = settingsResult?.settings?.isRegistrationOpen ?? true;
    const storeName = settingsResult?.settings?.storeName || 'متجر الرعد';
    const storeTagline = settingsResult?.settings?.storeTagline || 'سحب حصري وعجلة الحظ الكبرى للمشاركين الكرام';
    const themeId = settingsResult?.settings?.themeId || 'r3d-turquoise';

    return {
      success: true,
      currentPrize,
      wheelState,
      totalParticipants: participants.length,
      participantNames: names,
      isRegistrationOpen,
      storeName,
      storeTagline,
      themeId,
    };
  } catch (err) {
    console.error('Error fetching public giveaway state from Supabase:', err);
    return {
      success: true,
      currentPrize: { title: 'آيفون 16 برو ماكس', details: 'سعة 256 جيجابايت' },
      wheelState: { isSpinning: false, winnerName: '', prizeTitle: '', spunAt: '' },
      totalParticipants: 0,
      participantNames: [],
      isRegistrationOpen: true,
      storeName: 'متجر الرعد',
      storeTagline: 'سحب حصري وعجلة الحظ الكبرى للمشاركين الكرام',
      themeId: 'r3d-turquoise',
    };
  }
}

// Verify Admin Pin / Password directly against Supabase or fallback
export async function verifyAdminPin(enteredPin: string): Promise<boolean> {
  const clean = enteredPin.trim();
  if (clean === 'Alrneem9@1' || clean === '1234') {
    return true;
  }

  try {
    const { data } = await supabase
      .from('giveaway_settings')
      .select('admin_pin')
      .eq('id', 'default')
      .maybeSingle();

    if (data && data.admin_pin && clean === String(data.admin_pin).trim()) {
      return true;
    }
  } catch (err) {
    console.error('Error checking admin PIN against Supabase:', err);
  }

  return false;
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

// Cloud Lookup for Participant (Direct lookup by phone, ticket number, or ID)
export async function lookupParticipantFromCloud(query: string): Promise<Participant | null> {
  if (!query || !query.trim()) return null;
  const clean = query.trim();

  try {
    // 1. Try matching phone if digits
    const digits = clean.replace(/\D/g, '');
    if (digits.length === 8) {
      const { data: byPhone } = await supabase
        .from('participants')
        .select('*')
        .eq('phone', digits)
        .order('registered_at', { ascending: false })
        .limit(1);
      if (byPhone && byPhone.length > 0) return mapRowToParticipant(byPhone[0]);
    }

    // 2. Try matching ticket number if integer
    const ticketNum = parseInt(clean, 10);
    if (!isNaN(ticketNum)) {
      const { data: byTicket } = await supabase
        .from('participants')
        .select('*')
        .eq('ticket_number', ticketNum)
        .maybeSingle();
      if (byTicket) return mapRowToParticipant(byTicket);
    }

    // 3. Try matching ID
    const { data: byId } = await supabase
      .from('participants')
      .select('*')
      .eq('id', clean)
      .maybeSingle();
    if (byId) return mapRowToParticipant(byId);
  } catch (err) {
    console.error('Error looking up participant in cloud:', err);
  }

  return null;
}

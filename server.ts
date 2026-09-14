import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { createClient } from '@supabase/supabase-js';

const PORT = 3000;
const DB_FILE = path.join(process.cwd(), 'giveaway_data.json');
const ADMIN_PASSWORD = 'Alrneem9@1';

// Supabase Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://wrfbukhfjwdrfvbscfub.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyZmJ1a2hmandkcmZ2YnNjZnViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkzMjAzNjgsImV4cCI6MjEwNDg5NjM2OH0.wj6cF8k4Wr6Fpw92HLCRI3Yy5VpPf9XvYLZW7Jg_L0s';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});

// Types
export interface CurrentPrize {
  title: string;
  details: string;
}

export interface WheelState {
  isSpinning: boolean;
  winnerName?: string;
  winnerId?: string;
  winnerTicket?: number;
  prizeTitle?: string;
  spunAt?: string;
}

export interface Prize {
  id: string;
  title: string;
  quantity: number;
  icon: string;
  color: string;
}

export interface StoreSettings {
  storeName: string;
  storeTagline: string;
  giveawayTitle: string;
  giveawayDescription: string;
  logoUrl: string;
  logoType: 'url' | 'upload' | 'preset';
  logoPreset: string;
  themeId: string;
  customColors?: {
    primary: string;
    secondary: string;
    bgDark: string;
  };
  isRegistrationOpen: boolean;
  allowDuplicates: boolean;
  maskPhoneNumbers: boolean;
  adminPin?: string;
  adminPassword?: string;
  currentPrize: CurrentPrize;
  wheelState: WheelState;
  prizes: Prize[];
}

export interface Participant {
  id: string;
  ticketNumber: number;
  name: string; // الاسم والقبيلة
  phone: string; // 8 digits strictly
  registeredAt: string;
  hasWon: boolean;
  wonAt?: string;
  prizeWon?: string;
}

interface DatabaseState {
  settings: StoreSettings;
  participants: Participant[];
  nextTicketNumber: number;
}

const DEFAULT_PRIZES: Prize[] = [];

const DEFAULT_STATE: DatabaseState = {
  settings: {
    storeName: 'متجر الرعد',
    storeTagline: 'سحب حصري وعجلة الحظ الكبرى للمشاركين الكرام',
    giveawayTitle: 'السحب الكبير وعجلة الحظ',
    giveawayDescription: 'سجل اسمك وقبيلتك ورقم هاتفك (8 أرقام) للدخول في السحب المباشر وعجلة الحظ للفوز بجوائز قيمة!',
    logoUrl: '',
    logoType: 'preset',
    logoPreset: 'r3d',
    themeId: 'r3d-turquoise',
    isRegistrationOpen: true,
    allowDuplicates: false,
    maskPhoneNumbers: true,
    adminPassword: ADMIN_PASSWORD,
    currentPrize: {
      title: '',
      details: '',
    },
    wheelState: {
      isSpinning: false,
      winnerName: '',
      prizeTitle: '',
      spunAt: '',
    },
    prizes: [],
  },
  participants: [],
  nextTicketNumber: 1001,
};

let db: DatabaseState = { ...DEFAULT_STATE };

// Helper: Normalize Arabic-Indic digits to ASCII and validate 8 digits strictly
export function normalizeAndValidatePhone(raw: string): { isValid: boolean; normalized: string; error?: string } {
  if (!raw || typeof raw !== 'string') {
    return { isValid: false, normalized: '', error: 'يرجى إدخال رقم الهاتف' };
  }

  // Convert Arabic-Indic numerals ٠-٩ to 0-9
  const arabicIndicMap: Record<string, string> = {
    '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
    '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
  };
  let cleaned = raw.replace(/[٠-٩]/g, (d) => arabicIndicMap[d] || d);

  // Remove whitespace, dashes, plus, parentheses
  cleaned = cleaned.replace(/[\s\-\(\)\+]/g, '').trim();

  // Strip international prefixes if user included country code (e.g. +968 or 00968)
  if (cleaned.startsWith('00968') && cleaned.length === 13) {
    cleaned = cleaned.slice(5);
  } else if (cleaned.startsWith('968') && cleaned.length === 11) {
    cleaned = cleaned.slice(3);
  }

  // Must be strictly 8 digits
  if (!/^[0-9]{8}$/.test(cleaned)) {
    return {
      isValid: false,
      normalized: cleaned,
      error: 'رقم الهاتف يجب أن يتكون من 8 أرقام فقط (مثال: 91234567)',
    };
  }

  return { isValid: true, normalized: cleaned };
}

// Load persistent DB
try {
  if (fs.existsSync(DB_FILE)) {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    db = {
      ...DEFAULT_STATE,
      ...parsed,
      settings: {
        ...DEFAULT_STATE.settings,
        ...(parsed.settings || {}),
        adminPassword: ADMIN_PASSWORD,
        currentPrize: parsed.settings?.currentPrize || DEFAULT_STATE.settings.currentPrize,
        wheelState: parsed.settings?.wheelState || DEFAULT_STATE.settings.wheelState,
      },
    };
    // Ensure initial participants have valid 8-digit phones
    if (db.participants && db.participants.length > 0) {
      db.participants = db.participants.map((p, idx) => {
        const check = normalizeAndValidatePhone(p.phone);
        return {
          ...p,
          phone: check.isValid ? check.normalized : (91000000 + idx).toString(),
        };
      });
    } else {
      db.participants = DEFAULT_STATE.participants;
    }
  } else {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  }
} catch (err) {
  console.error('Error loading DB file, fallback to defaults:', err);
  db = { ...DEFAULT_STATE };
}

function saveDb() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save DB file:', err);
  }
}

// --- SUPABASE CLOUD PERSISTENCE HELPERS ---

function mapParticipantRow(row: any): Participant {
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

function mapPrizeRow(row: any): Prize {
  return {
    id: row.id,
    title: String(row.title || ''),
    quantity: Number(row.quantity ?? 1),
    icon: String(row.icon || 'Trophy'),
    color: String(row.color || '#F59E0B'),
  };
}

async function fetchCloudParticipants(): Promise<Participant[]> {
  try {
    const { data, error } = await supabase
      .from('participants')
      .select('*')
      .order('ticket_number', { ascending: true });

    if (!error && data) {
      db.participants = data.map(mapParticipantRow);
      const maxTicket = db.participants.reduce((max, p) => Math.max(max, p.ticketNumber || 0), 1000);
      db.nextTicketNumber = maxTicket + 1;
      saveDb();
      return db.participants;
    }
  } catch (err) {
    console.error('[Supabase] Error fetching cloud participants:', err);
  }
  return db.participants;
}

async function fetchCloudSettings(): Promise<StoreSettings> {
  try {
    const { data, error } = await supabase
      .from('giveaway_settings')
      .select('*')
      .eq('id', 'default')
      .maybeSingle();

    if (!error && data) {
      if (data.store_name) {
        db.settings.storeName = (data.store_name === 'سحب وقيف اوي المتاجر' || !data.store_name.trim()) ? 'متجر الرعد' : data.store_name;
      }
      if (data.store_tagline) db.settings.storeTagline = data.store_tagline;
      if (data.giveaway_title) db.settings.giveawayTitle = data.giveaway_title;
      if (data.giveaway_description) db.settings.giveawayDescription = data.giveaway_description;
      if (data.logo_url) db.settings.logoUrl = data.logo_url;
      if (data.theme_id) db.settings.themeId = data.theme_id;
      if (typeof data.is_registration_open === 'boolean') db.settings.isRegistrationOpen = data.is_registration_open;
      if (typeof data.allow_duplicates === 'boolean') db.settings.allowDuplicates = data.allow_duplicates;
      if (typeof data.mask_phone_numbers === 'boolean') db.settings.maskPhoneNumbers = data.mask_phone_numbers;
      if (data.admin_pin) db.settings.adminPin = data.admin_pin;
      if (data.current_prize && (data.current_prize.title || data.current_prize.details)) {
        db.settings.currentPrize = {
          title: data.current_prize.title || db.settings.currentPrize.title,
          details: data.current_prize.details || db.settings.currentPrize.details,
        };
      }
      if (data.wheel_state) {
        db.settings.wheelState = {
          isSpinning: Boolean(data.wheel_state.isSpinning),
          winnerName: data.wheel_state.winnerName || '',
          winnerId: data.wheel_state.winnerId || '',
          winnerTicket: data.wheel_state.winnerTicket ? Number(data.wheel_state.winnerTicket) : undefined,
          prizeTitle: data.wheel_state.prizeTitle || '',
          spunAt: data.wheel_state.spunAt || '',
        };
      }
      saveDb();
    }
  } catch (err) {
    console.error('[Supabase] Error fetching cloud settings:', err);
  }
  return db.settings;
}

async function fetchCloudPrizes(): Promise<Prize[]> {
  try {
    const { data, error } = await supabase
      .from('prizes')
      .select('*')
      .order('created_at', { ascending: true });

    if (!error && data && data.length > 0) {
      db.settings.prizes = data.map(mapPrizeRow);
      saveDb();
      return db.settings.prizes;
    }
  } catch (err) {
    console.error('[Supabase] Error fetching cloud prizes:', err);
  }
  return db.settings.prizes || [];
}

async function syncFromSupabase() {
  try {
    console.log('[Supabase] Initializing sync with cloud database (participants, prizes, settings)...');
    await Promise.all([
      fetchCloudParticipants(),
      fetchCloudPrizes(),
      fetchCloudSettings(),
    ]);

    // If Supabase table is empty but local had participants, seed Supabase
    if (db.participants.length > 0) {
      const { count } = await supabase.from('participants').select('*', { count: 'exact', head: true });
      if (count === 0) {
        console.log(`[Supabase] Seeding ${db.participants.length} initial participants to Supabase...`);
        const rows = db.participants.map((p) => ({
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
        }));
        await supabase.from('participants').upsert(rows);
      }
    }

    console.log(`[Supabase] Cloud database synced: ${db.participants.length} participants, ${db.settings.prizes?.length || 0} prizes, store: ${db.settings.storeName}`);
  } catch (err) {
    console.error('[Supabase] Sync error, operating with local fallback cache:', err);
  }
}

async function saveParticipantToCloud(p: Participant): Promise<boolean> {
  try {
    const { error } = await supabase.from('participants').upsert({
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
    });
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('[Supabase] Failed to save participant to cloud:', err);
    return false;
  }
}

async function deleteParticipantFromCloud(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('participants').delete().eq('id', id);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('[Supabase] Failed to delete participant from cloud:', err);
    return false;
  }
}

async function clearParticipantsFromCloud(type: string): Promise<boolean> {
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
    console.error('[Supabase] Failed to clear participants in cloud:', err);
    return false;
  }
}

async function savePrizeToCloud(prize: Prize): Promise<boolean> {
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
    console.error('[Supabase] Failed to save prize to cloud:', err);
    return false;
  }
}

async function deletePrizeFromCloud(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('prizes').delete().eq('id', id);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('[Supabase] Failed to delete prize from cloud:', err);
    return false;
  }
}

async function saveSettingsToCloud(settingsUpdates?: Partial<StoreSettings>): Promise<boolean> {
  try {
    const updated = {
      ...db.settings,
      ...(settingsUpdates || {}),
    };
    const { error } = await supabase.from('giveaway_settings').upsert({
      id: 'default',
      store_name: updated.storeName || 'متجر الرعد',
      store_tagline: updated.storeTagline,
      giveaway_title: updated.giveawayTitle,
      giveaway_description: updated.giveawayDescription,
      logo_url: updated.logoUrl,
      theme_id: updated.themeId,
      is_registration_open: updated.isRegistrationOpen,
      allow_duplicates: updated.allowDuplicates,
      mask_phone_numbers: updated.maskPhoneNumbers,
      admin_pin: updated.adminPin || 'Alrneem9@1',
      current_prize: updated.currentPrize,
      wheel_state: updated.wheelState,
      custom_colors: updated.customColors || {},
      raw_settings: updated,
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('[Supabase] Failed to save settings to cloud:', err);
    return false;
  }
}

async function saveWheelStateToCloud(wheelState: WheelState): Promise<boolean> {
  try {
    const { error } = await supabase.from('giveaway_settings').update({
      wheel_state: wheelState,
      updated_at: new Date().toISOString(),
    }).eq('id', 'default');
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('[Supabase] Failed to update wheel_state in cloud:', err);
    return false;
  }
}

// Admin Auth Middleware
function checkAdminAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers['x-admin-password'] || req.headers['authorization'];
  const pass = (authHeader || '').toString().replace(/^Bearer\s+/i, '').trim();

  if (pass === ADMIN_PASSWORD) {
    return next();
  }
  return res.status(401).json({
    success: false,
    error: 'غير مصرح: يجب تسجيل الدخول بكلمة مرور المشرف الصحيحة',
  });
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '15mb' }));

  // Initialize Supabase sync on server start
  await syncFromSupabase();

  // Enable CORS headers
  app.use((_req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-admin-password');
    if (_req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // --- PUBLIC APIS ---

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Supabase Cloud Status
  app.get('/api/supabase/status', async (_req, res) => {
    try {
      const { count: pCount, error: pErr } = await supabase.from('participants').select('*', { count: 'exact', head: true });
      const { count: prCount, error: prErr } = await supabase.from('prizes').select('*', { count: 'exact', head: true });
      const { data: sData, error: sErr } = await supabase.from('giveaway_settings').select('id, updated_at').eq('id', 'default').maybeSingle();

      res.json({
        success: true,
        connected: !pErr && !prErr && !sErr,
        supabaseUrl: SUPABASE_URL,
        participantsCount: pCount ?? db.participants.length,
        prizesCount: prCount ?? (db.settings.prizes?.length || 0),
        settingsSynced: Boolean(sData),
      });
    } catch (err: any) {
      res.json({
        success: false,
        connected: false,
        error: err.message,
      });
    }
  });

  // Public Giveaway & Spectator State (Strict privacy: NO phone numbers or participant personal info)
  app.get('/api/public/giveaway', async (_req, res) => {
    try {
      const eligibleParticipants = db.participants.filter(p => !p.hasWon);
      const namesToSpin = eligibleParticipants.length > 0
        ? eligibleParticipants.map(p => p.name)
        : db.participants.map(p => p.name);

      res.json({
        success: true,
        currentPrize: db.settings.currentPrize || DEFAULT_STATE.settings.currentPrize,
        wheelState: db.settings.wheelState || DEFAULT_STATE.settings.wheelState,
        totalParticipants: db.participants.length,
        participantNames: namesToSpin, // Only names for wheel spinning, NO phones
        isRegistrationOpen: db.settings.isRegistrationOpen,
        storeName: db.settings.storeName,
        storeTagline: db.settings.storeTagline,
        themeId: db.settings.themeId,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Participant Cloud Lookup (Direct lookup from Supabase by phone or ticket)
  app.get('/api/participants/lookup', async (req, res) => {
    try {
      const query = (req.query.q || req.query.phone || '').toString().trim();
      if (!query) {
        return res.status(400).json({ success: false, error: 'يرجى إدخال رقم الهاتف أو رقم التذكرة للبحث' });
      }

      const digits = query.replace(/\D/g, '');
      let queryBuilder = supabase.from('participants').select('*');

      if (digits.length === 8) {
        queryBuilder = queryBuilder.eq('phone', digits);
      } else {
        const tNum = parseInt(query, 10);
        if (!isNaN(tNum)) {
          queryBuilder = queryBuilder.eq('ticket_number', tNum);
        } else {
          queryBuilder = queryBuilder.eq('id', query);
        }
      }

      const { data, error } = await queryBuilder.order('registered_at', { ascending: false }).limit(1);

      if (error || !data || data.length === 0) {
        return res.status(404).json({ success: false, error: 'لم يتم العثور على تذكرة مسجلة بهذا الرقم في السحب السحابي' });
      }

      const p = mapParticipantRow(data[0]);
      res.json({
        success: true,
        participant: {
          id: p.id,
          ticketNumber: p.ticketNumber,
          name: p.name,
          phone: p.phone,
          registeredAt: p.registeredAt,
          hasWon: p.hasWon,
          prizeWon: p.prizeWon,
          wonAt: p.wonAt,
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Register New Participant (Direct Supabase Cloud Registration with 8-digit Phone)
  app.post('/api/participants', async (req, res) => {
    try {
      const { name, phone } = req.body;

      if (!db.settings.isRegistrationOpen) {
        return res.status(403).json({
          success: false,
          error: 'عذراً، تم إغلاق باب التسجيل في السحب والاكتفاء بالعدد الموجود.',
        });
      }

      if (!name || typeof name !== 'string' || name.trim().length < 2) {
        return res.status(400).json({
          success: false,
          error: 'يرجى إدخال الاسم والقبيلة بشكل كامل.',
        });
      }

      const phoneCheck = normalizeAndValidatePhone(phone);
      if (!phoneCheck.isValid) {
        return res.status(400).json({
          success: false,
          error: phoneCheck.error || 'رقم الهاتف يجب أن يتكون من 8 أرقام فقط.',
        });
      }

      const cleanPhone = phoneCheck.normalized;

      // Check duplicates in Supabase database directly
      if (!db.settings.allowDuplicates) {
        const { data: existing } = await supabase
          .from('participants')
          .select('id, name, phone, ticket_number')
          .eq('phone', cleanPhone)
          .limit(1);

        if (existing && existing.length > 0) {
          return res.status(409).json({
            success: false,
            error: 'هذا الرقم مسجل بالفعل في السحب! نتمنى لك حظاً موفقاً في عجلة الحظ.',
            existingTicket: existing[0].ticket_number,
          });
        }
      }

      // Query latest max ticket number from Supabase
      const { data: lastTicketRow } = await supabase
        .from('participants')
        .select('ticket_number')
        .order('ticket_number', { ascending: false })
        .limit(1)
        .maybeSingle();

      const nextTicket = Math.max(
        (lastTicketRow?.ticket_number ? Number(lastTicketRow.ticket_number) : 1000) + 1,
        db.nextTicketNumber++
      );

      const newParticipant: Participant = {
        id: `p-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        ticketNumber: nextTicket,
        name: name.trim(),
        phone: cleanPhone,
        registeredAt: new Date().toISOString(),
        hasWon: false,
      };

      // Persist directly to Supabase Cloud Database
      await saveParticipantToCloud(newParticipant);

      // Update in-memory cache
      db.participants.push(newParticipant);
      db.nextTicketNumber = nextTicket + 1;
      saveDb();

      res.json({
        success: true,
        participant: {
          id: newParticipant.id,
          ticketNumber: newParticipant.ticketNumber,
          name: newParticipant.name,
          phone: newParticipant.phone,
          registeredAt: newParticipant.registeredAt,
        },
        totalEntries: db.participants.length,
      });
    } catch {
      res.status(500).json({ success: false, error: 'حدث خطأ أثناء تسجيل المشارك' });
    }
  });

  // --- ADMIN AUTHENTICATION ---

  // Admin Login
  app.post('/api/admin/login', (req, res) => {
    const { password } = req.body;
    const inputPass = (password || '').toString().trim();

    if (inputPass === ADMIN_PASSWORD) {
      return res.json({ success: true, message: 'تم تسجيل الدخول بنجاح' });
    }
    return res.status(401).json({ success: false, error: 'كلمة المرور غير صحيحة! يرجى التأكد والمحاولة مجدداً.' });
  });

  // Verify PIN (kept for backward compatibility)
  app.post('/api/admin/verify', (req, res) => {
    const { pin } = req.body;
    const input = (pin || '').toString().trim();
    if (input === ADMIN_PASSWORD || input === (db.settings.adminPin || '1234')) {
      return res.json({ success: true });
    }
    return res.status(401).json({ success: false, error: 'رمز الدخول غير صحيح' });
  });

  // --- ADMIN PROTECTED ROUTES ---

  // Admin: Get Full Participants List (Directly from Supabase Cloud)
  app.get('/api/admin/participants', checkAdminAuth, async (_req, res) => {
    try {
      const list = await fetchCloudParticipants();
      res.json({
        success: true,
        participants: list,
        totalCount: list.length,
        winnersCount: list.filter(p => p.hasWon).length,
      });
    } catch (err: any) {
      res.json({
        success: true,
        participants: db.participants,
        totalCount: db.participants.length,
        winnersCount: db.participants.filter(p => p.hasWon).length,
      });
    }
  });

  // Admin: Update Current Prize Title & Details (Saves to Supabase giveaway_settings & prizes)
  app.post('/api/admin/prize', checkAdminAuth, async (req, res) => {
    try {
      const { title, details } = req.body;

      db.settings.currentPrize = {
        title: (title || '').toString().trim(),
        details: (details || '').toString().trim(),
      };
      saveDb();

      // Persist to Supabase giveaway_settings
      await saveSettingsToCloud({ currentPrize: db.settings.currentPrize });

      // If a title exists, upsert into Supabase prizes table
      if (db.settings.currentPrize.title) {
        await savePrizeToCloud({
          id: 'current-featured-prize',
          title: db.settings.currentPrize.title,
          quantity: 1,
          icon: 'Trophy',
          color: '#F59E0B',
        });
      }

      res.json({
        success: true,
        currentPrize: db.settings.currentPrize,
        message: 'تم حفظ وتحديث الجائزة الحالية بنجاح ومزامنتها سحابياً مع Supabase',
      });
    } catch {
      res.status(500).json({ success: false, error: 'فشل في حفظ بيانات الجائزة' });
    }
  });

  // Admin: Manage Prizes in Supabase (table 'prizes')
  app.get('/api/admin/prizes', checkAdminAuth, async (_req, res) => {
    try {
      const prizes = await fetchCloudPrizes();
      res.json({ success: true, prizes });
    } catch {
      res.json({ success: true, prizes: db.settings.prizes || [] });
    }
  });

  app.post('/api/admin/prizes', checkAdminAuth, async (req, res) => {
    try {
      const { id, title, quantity, icon, color } = req.body;
      const prizeId = id || `prize-${Date.now()}`;
      const newPrize: Prize = {
        id: prizeId,
        title: (title || '').toString().trim(),
        quantity: Number(quantity || 1),
        icon: icon || 'Trophy',
        color: color || '#F59E0B',
      };

      if (!db.settings.prizes) db.settings.prizes = [];
      const idx = db.settings.prizes.findIndex(p => p.id === prizeId);
      if (idx >= 0) {
        db.settings.prizes[idx] = newPrize;
      } else {
        db.settings.prizes.push(newPrize);
      }
      saveDb();

      // Direct Cloud save to Supabase
      await savePrizeToCloud(newPrize);

      res.json({ success: true, prize: newPrize });
    } catch {
      res.status(500).json({ success: false, error: 'فشل حفظ الجائزة في قاعدة البيانات' });
    }
  });

  app.delete('/api/admin/prizes/:id', checkAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      db.settings.prizes = (db.settings.prizes || []).filter(p => p.id !== id);
      saveDb();

      // Direct Cloud delete from Supabase
      await deletePrizeFromCloud(id);

      res.json({ success: true, message: 'تم حذف الجائزة من قاعدة البيانات السحابية' });
    } catch {
      res.status(500).json({ success: false, error: 'فشل حذف الجائزة' });
    }
  });

  // Admin: Toggle or Set Registration Status (Direct update to Supabase giveaway_settings)
  app.post('/api/admin/toggle-registration', checkAdminAuth, async (req, res) => {
    try {
      const { isOpen } = req.body;
      if (typeof isOpen === 'boolean') {
        db.settings.isRegistrationOpen = isOpen;
      } else {
        db.settings.isRegistrationOpen = !db.settings.isRegistrationOpen;
      }
      saveDb();

      // Persist to Supabase
      await saveSettingsToCloud({ isRegistrationOpen: db.settings.isRegistrationOpen });

      res.json({
        success: true,
        isRegistrationOpen: db.settings.isRegistrationOpen,
        totalParticipants: db.participants.length,
        message: db.settings.isRegistrationOpen
          ? 'تم فتح باب التسجيل للمشاركين بنجاح'
          : `تم إغلاق باب التسجيل بنجاح والاكتفاء بالعدد الحالي (${db.participants.length} مشارك)`,
      });
    } catch {
      res.status(500).json({ success: false, error: 'فشل تغيير حالة التسجيل' });
    }
  });

  // Admin: Trigger Wheel Spin & Pick Random Winner (Saved to Supabase participants & wheel_state)
  app.post('/api/admin/spin', checkAdminAuth, async (req, res) => {
    try {
      const { prizeTitle } = req.body;
      const currentPrizeName = prizeTitle || db.settings.currentPrize?.title || 'الجائزة الكبرى';

      // Always read latest participants from Supabase
      const allParticipants = await fetchCloudParticipants();

      // Pick from eligible participants (haven't won yet)
      let eligible = allParticipants.filter(p => !p.hasWon);
      if (eligible.length === 0) {
        if (allParticipants.length === 0) {
          return res.status(400).json({ success: false, error: 'لا يوجد مشاركون مسجلون في السحب حتى الآن' });
        }
        // If all have won, pick from all participants
        eligible = allParticipants;
      }

      const randomIndex = Math.floor(Math.random() * eligible.length);
      const winner = eligible[randomIndex];

      winner.hasWon = true;
      winner.wonAt = new Date().toISOString();
      winner.prizeWon = currentPrizeName;

      // Update wheel state broadcasted to all spectators
      const wheelState: WheelState = {
        isSpinning: true,
        winnerName: winner.name,
        winnerId: winner.id,
        winnerTicket: winner.ticketNumber,
        prizeTitle: currentPrizeName,
        spunAt: new Date().toISOString(),
      };
      db.settings.wheelState = wheelState;
      saveDb();

      // Persist winner in Supabase table 'participants'
      await saveParticipantToCloud(winner);

      // Persist wheel_state in Supabase table 'giveaway_settings'
      await saveWheelStateToCloud(wheelState);

      res.json({
        success: true,
        winner,
        wheelState: db.settings.wheelState,
        remainingEligible: allParticipants.filter(p => !p.hasWon && p.id !== winner.id).length,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: 'فشل في إجراء السحب: ' + err.message });
    }
  });

  // Admin: Reset Wheel State (Clears winner announcement in Supabase)
  app.post('/api/admin/reset-wheel', checkAdminAuth, async (_req, res) => {
    const wheelState: WheelState = {
      isSpinning: false,
      winnerName: '',
      winnerId: '',
      prizeTitle: '',
      spunAt: '',
    };
    db.settings.wheelState = wheelState;
    saveDb();

    // Persist to Supabase
    await saveWheelStateToCloud(wheelState);

    res.json({
      success: true,
      wheelState: db.settings.wheelState,
      message: 'تم إعادة تعيين حالة العجلة ومزامنتها بنجاح مع Supabase',
    });
  });

  // Admin: Add Participant Manually (Direct Insert into Supabase)
  app.post('/api/admin/participants/add', checkAdminAuth, async (req, res) => {
    try {
      const { name, phone } = req.body;
      if (!name || typeof name !== 'string' || name.trim().length < 2) {
        return res.status(400).json({ success: false, error: 'يرجى إدخال الاسم والقبيلة بشكل صحيح' });
      }

      const phoneCheck = normalizeAndValidatePhone(phone);
      if (!phoneCheck.isValid) {
        return res.status(400).json({ success: false, error: phoneCheck.error || 'رقم الهاتف يجب أن يتكون من 8 أرقام فقط' });
      }

      const { data: lastTicketRow } = await supabase
        .from('participants')
        .select('ticket_number')
        .order('ticket_number', { ascending: false })
        .limit(1)
        .maybeSingle();

      const ticketNumber = Math.max(
        (lastTicketRow?.ticket_number ? Number(lastTicketRow.ticket_number) : 1000) + 1,
        db.nextTicketNumber++
      );

      const newParticipant: Participant = {
        id: `p-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        ticketNumber,
        name: name.trim(),
        phone: phoneCheck.normalized,
        registeredAt: new Date().toISOString(),
        hasWon: false,
      };

      // Persist to Supabase
      await saveParticipantToCloud(newParticipant);

      db.participants.push(newParticipant);
      db.nextTicketNumber = ticketNumber + 1;
      saveDb();

      res.json({
        success: true,
        participant: newParticipant,
        totalParticipants: db.participants.length,
      });
    } catch {
      res.status(500).json({ success: false, error: 'فشل في إضافة المشارك' });
    }
  });

  // Admin: Clear Participants (Direct Operation on Supabase)
  app.post('/api/admin/participants/clear', checkAdminAuth, async (req, res) => {
    try {
      const { type } = req.body; // 'all' or 'non-winners' or 'winners'
      if (type === 'winners') {
        db.participants.forEach((p) => {
          p.hasWon = false;
          delete p.wonAt;
          delete p.prizeWon;
        });
      } else if (type === 'non-winners') {
        db.participants = db.participants.filter((p) => p.hasWon);
      } else {
        db.participants = [];
      }

      // Also reset wheel
      const wheelState: WheelState = {
        isSpinning: false,
        winnerName: '',
        winnerId: '',
        prizeTitle: '',
        spunAt: '',
      };
      db.settings.wheelState = wheelState;
      saveDb();

      // Cloud operations on Supabase
      await clearParticipantsFromCloud(type);
      await saveWheelStateToCloud(wheelState);

      res.json({
        success: true,
        participants: db.participants,
        totalParticipants: db.participants.length,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: 'فشل مسح المشاركين: ' + err.message });
    }
  });

  // Admin: Seed Realistic 8-digit Participants (Batch Insert to Supabase)
  app.post('/api/admin/participants/seed', checkAdminAuth, async (_req, res) => {
    try {
      const sampleParticipants = [
        { name: 'سالم بن ناصر الحارثي', phone: '91234567' },
        { name: 'أحمد بن سعيد البلوشي', phone: '79876543' },
        { name: 'فاطمة بنت سالم المعمرية', phone: '98765432' },
        { name: 'خالد بن خلفان الريامي', phone: '71239876' },
        { name: 'مريم بنت عبدالله الشحية', phone: '95544332' },
        { name: 'محمد بن خميس الكعبي', phone: '78899001' },
        { name: 'عائشة بنت هلال الحوسنية', phone: '96655443' },
        { name: 'فيصل بن حمد الدرعي', phone: '72233445' },
        { name: 'روان بنت ناصر الوهيبية', phone: '93344556' },
        { name: 'عبدالعزيز بن راشد العامري', phone: '74455667' },
      ];

      const { data: lastTicketRow } = await supabase
        .from('participants')
        .select('ticket_number')
        .order('ticket_number', { ascending: false })
        .limit(1)
        .maybeSingle();

      let currentTicket = (lastTicketRow?.ticket_number ? Number(lastTicketRow.ticket_number) : 1000);

      const addedList: Participant[] = [];
      for (const sample of sampleParticipants) {
        currentTicket++;
        const newPart: Participant = {
          id: `p-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          ticketNumber: currentTicket,
          name: sample.name,
          phone: sample.phone,
          registeredAt: new Date().toISOString(),
          hasWon: false,
        };
        addedList.push(newPart);
        db.participants.push(newPart);
      }

      db.nextTicketNumber = currentTicket + 1;
      saveDb();

      // Upsert batch to Supabase
      const rows = addedList.map(p => ({
        id: p.id,
        ticket_number: p.ticketNumber,
        ticketNumber: p.ticketNumber,
        name: p.name,
        phone: p.phone,
        registered_at: p.registeredAt,
        registeredAt: p.registeredAt,
        has_won: false,
        hasWon: false,
      }));
      await supabase.from('participants').upsert(rows);

      res.json({
        success: true,
        participants: db.participants,
        totalParticipants: db.participants.length,
      });
    } catch {
      res.status(500).json({ success: false, error: 'فشل إضافة المشاركين التجريبيين' });
    }
  });

  // Admin: Delete Single Participant (Direct from Supabase)
  app.delete('/api/admin/participants/:id', checkAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      db.participants = db.participants.filter((p) => p.id !== id);
      saveDb();

      // Delete from Supabase
      await deleteParticipantFromCloud(id);

      res.json({ success: true, remaining: db.participants.length });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Admin: Reset Winners flag (Direct update in Supabase)
  app.post('/api/admin/reset-winners', checkAdminAuth, async (_req, res) => {
    try {
      db.participants.forEach((p) => {
        p.hasWon = false;
        delete p.wonAt;
        delete p.prizeWon;
      });
      const wheelState: WheelState = {
        isSpinning: false,
        winnerName: '',
        winnerId: '',
        prizeTitle: '',
        spunAt: '',
      };
      db.settings.wheelState = wheelState;
      saveDb();

      // Update in Supabase
      await clearParticipantsFromCloud('winners');
      await saveWheelStateToCloud(wheelState);

      res.json({ success: true, participants: db.participants });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // --- SETTINGS APIS (Admin or Read-Only) ---

  // Get Settings (Refreshed directly from Supabase)
  app.get('/api/settings', async (_req, res) => {
    try {
      await Promise.all([fetchCloudSettings(), fetchCloudParticipants()]);
      res.json({
        success: true,
        settings: db.settings,
        stats: {
          totalParticipants: db.participants.length,
          totalWinners: db.participants.filter((p) => p.hasWon).length,
        },
      });
    } catch {
      res.json({
        success: true,
        settings: db.settings,
        stats: {
          totalParticipants: db.participants.length,
          totalWinners: db.participants.filter((p) => p.hasWon).length,
        },
      });
    }
  });

  // Update Settings (Directly saved to Supabase giveaway_settings)
  app.post('/api/settings', checkAdminAuth, async (req, res) => {
    try {
      const updated = req.body;
      db.settings = {
        ...db.settings,
        ...updated,
        adminPassword: ADMIN_PASSWORD,
      };
      saveDb();

      // Direct save to Supabase
      await saveSettingsToCloud(updated);

      res.json({ success: true, settings: db.settings });
    } catch {
      res.status(500).json({ success: false, error: 'فشل في حفظ إعدادات السحب' });
    }
  });

  // Participants endpoint (Privacy protected: if not admin, mask phone numbers)
  app.get('/api/participants', async (req, res) => {
    const authHeader = req.headers['x-admin-password'] || req.headers['authorization'];
    const pass = (authHeader || '').toString().replace(/^Bearer\s+/i, '').trim();
    const isAdmin = pass === ADMIN_PASSWORD;

    const currentList = await fetchCloudParticipants();

    if (isAdmin) {
      return res.json({ success: true, participants: currentList });
    }

    // Public / Spectator request: Mask phone numbers completely or only return minimal data for privacy
    const masked = currentList.map((p) => ({
      id: p.id,
      ticketNumber: p.ticketNumber,
      name: p.name,
      phone: p.phone ? `${p.phone.slice(0, 2)}****${p.phone.slice(-2)}` : '',
      registeredAt: p.registeredAt,
      hasWon: p.hasWon,
    }));
    res.json({ success: true, participants: masked });
  });

  // Record winner (legacy support)
  app.post('/api/draw/winner', checkAdminAuth, async (req, res) => {
    try {
      const { participantId, prizeWon } = req.body;
      const participant = db.participants.find((p) => p.id === participantId);

      if (!participant) {
        return res.status(404).json({ success: false, error: 'المشارك غير موجود' });
      }

      participant.hasWon = true;
      participant.wonAt = new Date().toISOString();
      participant.prizeWon = prizeWon || db.settings.currentPrize?.title || 'جائزة السحب';

      const wheelState: WheelState = {
        isSpinning: true,
        winnerName: participant.name,
        winnerId: participant.id,
        winnerTicket: participant.ticketNumber,
        prizeTitle: participant.prizeWon,
        spunAt: new Date().toISOString(),
      };
      db.settings.wheelState = wheelState;

      saveDb();
      await saveParticipantToCloud(participant);
      await saveWheelStateToCloud(wheelState);

      res.json({
        success: true,
        winner: participant,
        wheelState: db.settings.wheelState,
      });
    } catch {
      res.status(500).json({ success: false, error: 'فشل تسجيل الفائز' });
    }
  });

  // Reset winners (legacy support)
  app.post('/api/draw/reset-winners', checkAdminAuth, async (_req, res) => {
    db.participants.forEach((p) => {
      p.hasWon = false;
      delete p.wonAt;
      delete p.prizeWon;
    });
    const wheelState: WheelState = {
      isSpinning: false,
      winnerName: '',
      winnerId: '',
      prizeTitle: '',
      spunAt: '',
    };
    db.settings.wheelState = wheelState;
    saveDb();

    await clearParticipantsFromCloud('winners');
    await saveWheelStateToCloud(wheelState);

    res.json({ success: true, participants: db.participants });
  });

  // --- VITE MIDDLEWARE / STATIC SERVING ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

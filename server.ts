import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const PORT = 3000;
const DB_FILE = path.join(process.cwd(), 'giveaway_data.json');

// Types
interface Prize {
  id: string;
  title: string;
  quantity: number;
  icon: string;
  color: string;
}

interface StoreSettings {
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
  prizes: Prize[];
}

interface Participant {
  id: string;
  ticketNumber: number;
  name: string;
  phone: string;
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

const DEFAULT_PRIZES: Prize[] = [
  { id: '1', title: 'آيفون 16 برو ماكس تيتانيوم (iPhone 16 Pro Max)', quantity: 1, icon: 'Smartphone', color: '#06B6D4' },
  { id: '2', title: 'قسيمة شراء R3D بقيمة 1,000 ريال', quantity: 1, icon: 'Gift', color: '#22D3EE' },
  { id: '3', title: 'جهاز بلايستيشن 5 (PlayStation 5)', quantity: 1, icon: 'Package', color: '#38BDF8' },
  { id: '4', title: 'ساعة ذكية فاخرة Apple Watch Ultra', quantity: 2, icon: 'Watch', color: '#E2E8F0' },
  { id: '5', title: 'بوكس هدايا ومنتجات R3D الحصرية', quantity: 5, icon: 'Sparkles', color: '#00F0FF' },
];

const DEFAULT_STATE: DatabaseState = {
  settings: {
    storeName: 'متجر R3D الفاخر',
    storeTagline: 'سحب R3D الحصري وعجلة الحظ الكبرى لعملائنا الكرام',
    giveawayTitle: 'السحب الكبير على هدايا وجوائز R3D الفاخرة',
    giveawayDescription: 'سجل اسمك ورقم جوالك للدخول في سحب وعجلة حظ R3D للفوز بجوائز قيمة وفورية!',
    logoUrl: '',
    logoType: 'preset',
    logoPreset: 'r3d',
    themeId: 'r3d-turquoise',
    isRegistrationOpen: true,
    allowDuplicates: false,
    maskPhoneNumbers: true,
    prizes: DEFAULT_PRIZES,
  },
  participants: [
    {
      id: 'p-1',
      ticketNumber: 1001,
      name: 'عبدالله محمد الشمري',
      phone: '0501234567',
      registeredAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      hasWon: false,
    },
    {
      id: 'p-2',
      ticketNumber: 1002,
      name: 'سارة خالد العتيبي',
      phone: '0559876543',
      registeredAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      hasWon: false,
    },
    {
      id: 'p-3',
      ticketNumber: 1003,
      name: 'فيصل عبدالرحمن الدوسري',
      phone: '0543322110',
      registeredAt: new Date(Date.now() - 3600000 * 3).toISOString(),
      hasWon: false,
    },
    {
      id: 'p-4',
      ticketNumber: 1004,
      name: 'نورة أحمد القحطاني',
      phone: '0567788990',
      registeredAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      hasWon: false,
    },
    {
      id: 'p-5',
      ticketNumber: 1005,
      name: 'عمر سلطان الحربي',
      phone: '0531144778',
      registeredAt: new Date(Date.now() - 3600000 * 1).toISOString(),
      hasWon: false,
    },
    {
      id: 'p-6',
      ticketNumber: 1006,
      name: 'ريم عبدالعزيز الغامدي',
      phone: '0582255881',
      registeredAt: new Date(Date.now() - 1800000).toISOString(),
      hasWon: false,
    },
  ],
  nextTicketNumber: 1007,
};

let db: DatabaseState = { ...DEFAULT_STATE };

// Load persistent DB
try {
  if (fs.existsSync(DB_FILE)) {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    db = JSON.parse(raw);
  } else {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  }
} catch (err) {
  console.error('Error loading DB file, fallback to defaults:', err);
}

function saveDb() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save DB file:', err);
  }
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '15mb' }));

  // Enable CORS headers for cross-origin and iframe requests
  app.use((_req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (_req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // --- API ROUTES ---

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Get Store Settings
  app.get('/api/settings', (_req, res) => {
    res.json({
      success: true,
      settings: db.settings,
      stats: {
        totalParticipants: db.participants.length,
        totalWinners: db.participants.filter((p) => p.hasWon).length,
      },
    });
  });

  // Update Store Settings
  app.post('/api/settings', (req, res) => {
    try {
      const updated = req.body;
      db.settings = {
        ...db.settings,
        ...updated,
      };
      saveDb();
      res.json({ success: true, settings: db.settings });
    } catch (err) {
      res.status(500).json({ success: false, error: 'فشل في حفظ إعدادات المتجر' });
    }
  });

  // Get Participants List
  app.get('/api/participants', (_req, res) => {
    res.json({
      success: true,
      participants: db.participants,
    });
  });

  // Register New Participant
  app.post('/api/participants', (req, res) => {
    try {
      const { name, phone } = req.body;

      if (!db.settings.isRegistrationOpen) {
        return res.status(403).json({
          success: false,
          error: 'عذراً، باب التسجيل في السحب مغلق حالياً من قبل إدارة المتجر.',
        });
      }

      if (!name || typeof name !== 'string' || name.trim().length < 2) {
        return res.status(400).json({
          success: false,
          error: 'يرجى إدخال الاسم الكريم بشكل صحيح (حرفين على الأقل).',
        });
      }

      const cleanPhone = (phone || '').toString().replace(/[\s\-\(\)]/g, '').trim();
      if (!cleanPhone || cleanPhone.length < 7) {
        return res.status(400).json({
          success: false,
          error: 'يرجى إدخال رقم هاتف صحيح للتواصل في حال الفوز.',
        });
      }

      // Check duplicates if not allowed
      if (!db.settings.allowDuplicates) {
        const exists = db.participants.some(
          (p) => p.phone.replace(/[\s\-\(\)]/g, '') === cleanPhone
        );
        if (exists) {
          return res.status(409).json({
            success: false,
            error: 'هذا الرقم مسجل بالفعل في السحب! نتمنى لك حظاً موفقاً في عجلة الحظ.',
          });
        }
      }

      const ticketNumber = db.nextTicketNumber++;
      const newParticipant: Participant = {
        id: `p-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        ticketNumber,
        name: name.trim(),
        phone: cleanPhone,
        registeredAt: new Date().toISOString(),
        hasWon: false,
      };

      db.participants.push(newParticipant);
      saveDb();

      res.json({
        success: true,
        participant: newParticipant,
        totalEntries: db.participants.length,
      });
    } catch (err) {
      res.status(500).json({ success: false, error: 'حدث خطأ أثناء تسجيل المشارك' });
    }
  });

  // Seed Realistic Sample Participants (Convenient for Host Testing)
  app.post('/api/participants/seed', (_req, res) => {
    try {
      const sampleNames = [
        'خالد وليد المنصور',
        'مها ناصر السبيعي',
        'تركي فهد الرويلي',
        'أروى صالح البلوشي',
        'محمد إبراهيم الزهراني',
        'هدى يوسف المالكي',
        'ماجد حمود العنزي',
        'فاطمة سعيد الشهري',
      ];

      sampleNames.forEach((name, i) => {
        const ticketNumber = db.nextTicketNumber++;
        const randomDigits = Math.floor(1000000 + Math.random() * 9000000);
        db.participants.push({
          id: `p-${Date.now()}-${i}`,
          ticketNumber,
          name,
          phone: `05${randomDigits}`,
          registeredAt: new Date().toISOString(),
          hasWon: false,
        });
      });

      saveDb();
      res.json({
        success: true,
        message: 'تم إضافة مشاركين تجريبيين بنجاح',
        participants: db.participants,
      });
    } catch {
      res.status(500).json({ success: false, error: 'فشل في إضافة مشاركين' });
    }
  });

  // Delete Single Participant
  app.delete('/api/participants/:id', (req, res) => {
    const { id } = req.params;
    db.participants = db.participants.filter((p) => p.id !== id);
    saveDb();
    res.json({ success: true, remaining: db.participants.length });
  });

  // Clear Participants
  app.post('/api/participants/clear', (req, res) => {
    const { type } = req.body; // 'all' or 'non-winners' or 'winners'
    if (type === 'all') {
      db.participants = [];
    } else if (type === 'non-winners') {
      db.participants = db.participants.filter((p) => p.hasWon);
    } else if (type === 'winners') {
      db.participants.forEach((p) => {
        p.hasWon = false;
        delete p.wonAt;
        delete p.prizeWon;
      });
    }
    saveDb();
    res.json({ success: true, participants: db.participants });
  });

  // Record a Winner from Wheel of Fortune
  app.post('/api/draw/winner', (req, res) => {
    try {
      const { participantId, prizeWon } = req.body;
      const participant = db.participants.find((p) => p.id === participantId);

      if (!participant) {
        return res.status(404).json({ success: false, error: 'المشارك غير موجود' });
      }

      participant.hasWon = true;
      participant.wonAt = new Date().toISOString();
      participant.prizeWon = prizeWon || 'جائزة السحب الكبرى';

      saveDb();

      res.json({
        success: true,
        winner: participant,
      });
    } catch {
      res.status(500).json({ success: false, error: 'فشل تسجيل الفائز' });
    }
  });

  // Reset Winners to participate again
  app.post('/api/draw/reset-winners', (_req, res) => {
    db.participants.forEach((p) => {
      p.hasWon = false;
      delete p.wonAt;
      delete p.prizeWon;
    });
    saveDb();
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

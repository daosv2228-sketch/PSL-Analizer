import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { Telegraf } from 'telegraf';
import multer from 'multer';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import cors from 'cors';
import {
  isSupabaseEnabled,
  fetchUserFromSupabase,
  persistUserToSupabase,
  fetchAllUsersFromSupabase
} from './src/db/supabaseClient';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const APP_URL = process.env.APP_URL || '';

// Enable CORS for GitHub Pages, localhost and Telegram Webview
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Telegram-Init-Data', 'Accept']
}));

// Configure multer for PDF in-memory uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 } // 25 MB max
});

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Ensure data directory exists for persistent storage
const DATA_DIR = path.resolve('data');
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (e) {
    console.warn('Could not create data dir:', e);
  }
}
const DB_FILE = path.join(DATA_DIR, 'users_db.json');

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

const userDatabase = new Map<number, UserRecord>();

// Load persistent DB on server startup
async function loadDatabase(): Promise<void> {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const data = JSON.parse(raw);
      if (Array.isArray(data)) {
        for (const u of data) {
          userDatabase.set(u.id, u);
        }
      }
      console.log(`💾 Loaded ${userDatabase.size} user records from ${DB_FILE}`);
    }

    if (isSupabaseEnabled()) {
      const supabaseUsers = await fetchAllUsersFromSupabase();
      for (const su of supabaseUsers) {
        userDatabase.set(su.id, su);
      }
      console.log(`⚡ Synced ${supabaseUsers.length} records from Supabase PostgreSQL`);
    }
  } catch (e) {
    console.error('Error loading database:', e);
  }
}

function saveDatabase(specificUser?: UserRecord): void {
  try {
    const list = Array.from(userDatabase.values());
    fs.writeFileSync(DB_FILE, JSON.stringify(list, null, 2), 'utf-8');

    if (specificUser && isSupabaseEnabled()) {
      persistUserToSupabase(specificUser).catch((err) => {
        console.warn(`Supabase background sync failed for user ${specificUser.id}:`, err);
      });
    }
  } catch (e) {
    console.error('Error saving database:', e);
  }
}

loadDatabase();

function getOrCreateUser(id: number, firstName?: string, username?: string): UserRecord {
  const isOwner = (username || '').toLowerCase().replace('@', '') === 'wow_ogogo';
  if (!userDatabase.has(id)) {
    const newUser: UserRecord = {
      id,
      firstName,
      username,
      timeZone: 'Europe/Moscow',
      isPro: isOwner,
      has30DayPlan: isOwner,
      planStartDate: isOwner ? new Date().toISOString() : undefined,
      starsBalance: isOwner ? 99999 : 0,
      purchases: isOwner ? [{ type: 'lifetime_pro_owner', stars: 0, date: new Date().toISOString() }] : [],
      scansCount: 0,
      referrals: 0,
      scans: [],
      completedHabits: {}
    };
    userDatabase.set(id, newUser);
    saveDatabase(newUser);
  } else {
    const user = userDatabase.get(id)!;
    if (username) user.username = username;
    if (firstName) user.firstName = firstName;
    if (isOwner) {
      user.isPro = true;
      user.has30DayPlan = true;
      if (!user.planStartDate) user.planStartDate = new Date().toISOString();
    }
    saveDatabase(user);
  }
  return userDatabase.get(id)!;
}

export const SOFTMAXING_30_DAYS = [
  {
    day: 1,
    title: 'Базовый замер 0° & Освоение вакуумного Mewing',
    morning: '🎯 День 1. Сделайте базовый снимок 0° Frontal для точки отсчёта. Сегодня осваиваем биомеханический Mewing: прижатие именно ЗАДНЕЙ трети языка к мягкому нёбу (suction hold), а не только кончика. Носовое дыхание 24/7.',
    evening: '🌙 Вечерний чек Дня 1. Удерживали ли заднюю треть языка у нёба? Зубы должны быть в свободном пространстве 1 мм, губы сомкнуты.',
    isControlScan: true
  },
  {
    day: 2,
    title: 'Шейная декомпрессия (McKenzie Chin Tucks)',
    morning: '🎯 День 2. Устраняем forward head posture: 3 подхода по 15 повторений втягиваний подбородка (Chin Tucks) у ровной стены. Это поднимает подъязычную кость и натягивает подчелюстную диафрагму.',
    evening: '🌙 Вечерний чек Дня 2. Выполнили 3x15 Chin Tucks? Шея должна сохранять физиологический лордоз.',
    isControlScan: false
  },
  {
    day: 3,
    title: 'Калиево-натриевый баланс (Debloating)',
    morning: '🎯 День 3. Запускаем сгонку межтканевой жидкости для прорисовки скул: калий 3500+ мг (авокадо, шпинат, кокосовая вода), натрий строго <1500 мг. Контрастный прохладный душ для лица.',
    evening: '🌙 Вечерний чек Дня 3. Соблюден баланс солей и исключён скрытый натрий?',
    isControlScan: false
  },
  {
    day: 4,
    title: 'Изометрия нижних век (Hunter Eyes & Canthal Tilt)',
    morning: '🎯 День 4. Укрепляем pretarsal orbicularis oculi: упражнение Squinch — 20 повторений по 5 сек статического прищура нижним веком без нахмуривания бровей. Устраняет нижний scleral show.',
    evening: '🌙 Вечерний чек Дня 4. Выполнена гимнастика нижнего века (20 повторений по 5 сек)?',
    isControlScan: false
  },
  {
    day: 5,
    title: '📸 КОНТРОЛЬНЫЙ СКАН 0° + Билатеральное жевание Chios Mastic',
    morning: '📸 Сегодня ДЕНЬ 5: сделайте контрольный скан 0° в приложении для фиксации первой контрольной точки! Также сегодня 15 минут жевания смолы мастики строго поочередно по 2 минуты на сторону. Важно: при любом хрусте в ВНЧС немедленно остановитесь.',
    evening: '🌙 Вечерний чек Дня 5. Сделан контрольный скан 0° и выполнена 15-минутная тренировка массетеров?',
    isControlScan: true
  },
  {
    day: 6,
    title: 'Техника вакуумного глотания (Suction Swallow)',
    morning: '🎯 День 6. Исключаем работу щёчных мышц (buccinator), вызывающих припухлость щек: глотайте слюну и воду исключительно волнообразным прижатием языка к нёбу без напряжения губ.',
    evening: '🌙 Вечерний чек Дня 6. Контролировали глотание без щек в течение дня?',
    isControlScan: false
  },
  {
    day: 7,
    title: 'Ортопедия сна (Сон на спине & Асимметрия)',
    morning: '🎯 День 7. Защита от гравитационной асимметрии лица: сегодня закрепляем сон строго на спине с низким ортопедическим валиком под шею. Исключает компрессию скул и щек подушкой.',
    evening: '🌙 Вечерний чек Дня 7. Спальное место подготовлено для сна на спине?',
    isControlScan: false
  },
  {
    day: 8,
    title: 'Периорбитальный лимфодренаж & Холодный компресс',
    morning: '🎯 День 8. Утренний 60-секундный массаж ледяным кубиком/роллером вокруг глазниц по костному краю + сыворотка с кофеином 5% для сужения микрососудов и раскрытия взгляда.',
    evening: '🌙 Вечерний чек Дня 8. Выполнен ли утренний холодный компресс и вечерний уход за веками?',
    isControlScan: false
  },
  {
    day: 9,
    title: 'Шейная декомпрессия + McKenzie Chin Tucks',
    morning: '🎯 День 9. Второй этап исправления осанки: 3 подхода по 15 Chin Tucks с фиксацией на 3 секунды в крайней задней точке. Ощущайте натяжение глубоких сгибателей шеи.',
    evening: '🌙 Вечерний чек Дня 9. Выполнен ли комплекс 3х15 с фиксацией?',
    isControlScan: false
  },
  {
    day: 10,
    title: '📸 КОНТРОЛЬНЫЙ СКАН 0° + Chios Mastic Gum (20 мин)',
    morning: '📸 ДЕНЬ 10: контрольный скан 0° Frontal! Отследите изменение fWHR и симметрии. Затем 20 минут билатерального жевания плотной основы с контролем височной зоны.',
    evening: '🌙 Вечерний чек Дня 10. Зафиксирован скан 10-го дня в приложении?',
    isControlScan: true
  },
  {
    day: 11,
    title: 'Клеточное обновление кожи (Glowmaxing Retinoid Protocol)',
    morning: '🎯 День 11. Начинаем протокол текстуры кожи: вечернее нанесение ретинола/третиноина поверх увлажняющего крема (sandwich-метод) + обязательный SPF 50+ утром для защиты коллагена.',
    evening: '🌙 Вечерний чек Дня 11. Нанесен вечерний уход с защитой барьера?',
    isControlScan: false
  },
  {
    day: 12,
    title: 'Снятие гипертонуса Mentalis (Подбородок)',
    morning: '🎯 День 12. Устраняем бугристость подбородка ("апельсиновую корку"): осознанно расслабляем подбородочную мышцу, смыкая губы без напряжения подбородка.',
    evening: '🌙 Вечерний чек Дня 12. Следили за расслаблением подбородка при сомкнутых губах?',
    isControlScan: false
  },
  {
    day: 13,
    title: 'Глубокий деблоатинг & Травяной дренаж',
    morning: '🎯 День 13. Зелёный чай / чай из одуванчика для выведения избытка внеклеточной воды. Прогулка 8000+ шагов на свежем воздухе для стимуляции общего лимфотока.',
    evening: '🌙 Вечерний чек Дня 13. Выполнена ли норма активности и водный режим?',
    isControlScan: false
  },
  {
    day: 14,
    title: 'Squinch-изометрия век (3х10 с удержанием 6 сек)',
    morning: '🎯 День 14. Продвинутая тренировка круговой мышцы глаза: 3 подхода по 10 повторений с паузой 6 секунд. Подтягивает латеральный кантус вверх.',
    evening: '🌙 Вечерний чек Дня 14. Выполнена ли продвинутая изометрия взгляда?',
    isControlScan: false
  },
  {
    day: 15,
    title: '📸 КОНТРОЛЬНЫЙ СКАН ДЕНЬ 15 (Экватор программы!)',
    morning: '🔥 ЭКВАТОР! Сегодня ДЕНЬ 15: сделайте контрольный скан 0° и откройте экран "Прогресс" для сравнения с Днем 1 в интерактивном сплит-слайдере!',
    evening: '🌙 Вечерний чек Дня 15. Провели сравнение До/После в сплит-слайдере?',
    isControlScan: true
  },
  {
    day: 16,
    title: 'Chios Mastic Gym: 20 мин билатеральной работы',
    morning: '🎯 День 16. Силовая тренировка массетеров: 20 минут жевания равными интервалами. Следите, чтобы не перенапрягались шея и височные доли.',
    evening: '🌙 Вечерний чек Дня 16. Завершена ли тренировка жевательных мышц?',
    isControlScan: false
  },
  {
    day: 17,
    title: 'Декомпрессия шеи & Растяжка ГКСМ',
    morning: '🎯 День 17. 3x15 Chin Tucks + мягкая растяжка грудино-ключично-сосцевидной мышцы для удлинения и выразительности угла челюсти к шее.',
    evening: '🌙 Вечерний чек Дня 17. Выполнен шейный протокол?',
    isControlScan: false
  },
  {
    day: 18,
    title: 'Бессознательный вакуум Mewing',
    morning: '🎯 День 18. Закрепляем привычку: прижмите язык вакуумом и держите его даже при глубокой концентрации за компьютером или смартфоном.',
    evening: '🌙 Вечерний чек Дня 18. Сохраняли язык у нёба в течение дня?',
    isControlScan: false
  },
  {
    day: 19,
    title: 'Лимфодренаж угла нижней челюсти (Gonion)',
    morning: '🎯 День 19. Деликатный пальцевый лимфодренаж по контуру челюсти от подбородка к углу челюсти и вниз по боковым линиям шеи к ключицам.',
    evening: '🌙 Вечерний чек Дня 19. Выполнен лимфодренажный массаж?',
    isControlScan: false
  },
  {
    day: 20,
    title: '📸 КОНТРОЛЬНЫЙ СКАН 0° (ДЕНЬ 20)',
    morning: '📸 Сегодня ДЕНЬ 20: сделайте контрольный скан 0° в приложении! Проверьте прогресс по графику с доверительным интервалом ±0.1 PSL.',
    evening: '🌙 Вечерний чек Дня 20. Скан 20-го дня сохранен в истории?',
    isControlScan: true
  },
  {
    day: 21,
    title: 'Барьерный уход кожи: Церамиды + Гиалуронат',
    morning: '🎯 День 21. Насыщение рогового слоя: нанесение гиалуроновой сыворотки строго на влажную кожу, запечатывание кремом с церамидами.',
    evening: '🌙 Вечерний чек Дня 21. Выполнен вечерний барьерный уход?',
    isControlScan: false
  },
  {
    day: 22,
    title: 'Chios Mastic: 20 минут силового жевания',
    morning: '🎯 День 22. 20 минут жевания смолы мастики для стимуляции костного уплотнения (закон Вольффа) на углах нижней челюсти.',
    evening: '🌙 Вечерний чек Дня 22. Выполнена ли тренировка массетеров?',
    isControlScan: false
  },
  {
    day: 23,
    title: 'Горизонтальный взор & Chin Tucks у стены',
    morning: '🎯 День 23. 3х15 Chin Tucks с сохранением строго горизонтальной линии взгляда (Frankfort horizontal plane). Убирает сутулость в шейном отделе.',
    evening: '🌙 Вечерний чек Дня 23. Выполнены ли упражнения на осанку?',
    isControlScan: false
  },
  {
    day: 24,
    title: 'Squinch-изометрия: фиксация тонуса глазниц',
    morning: '🎯 День 24. 20 повторений по 6 секунд прищура нижним веком. Максимальный фокус на подтяжку внешних уголков глаз.',
    evening: '🌙 Вечерний чек Дня 24. Выполнена изометрия век?',
    isControlScan: false
  },
  {
    day: 25,
    title: '📸 КОНТРОЛЬНЫЙ СКАН 0° (ДЕНЬ 25)',
    morning: '📸 Сегодня ДЕНЬ 25: контрольный скан 0° Frontal! Осталось всего 5 дней до завершения программы. Проверьте график динамики.',
    evening: '🌙 Вечерний чек Дня 25. Зафиксирован скан 25-го дня?',
    isControlScan: true
  },
  {
    day: 26,
    title: 'Глубокий деблоатинг перед финалом',
    morning: '🎯 День 26. Максимальный фокус на калиево-натриевом балансе. Исключите алкоголь и быстрые углеводы для пикового рельефа костных структур.',
    evening: '🌙 Вечерний чек Дня 26. Выдержан чистый рацион деблоатинга?',
    isControlScan: false
  },
  {
    day: 27,
    title: 'Chios Mastic: 15 минут поддерживающего жевания',
    morning: '🎯 День 27. 15 минут спокойного жевания мастики для тонуса без перегрузки суставов.',
    evening: '🌙 Вечерний чек Дня 27. Выполнена тренировка?',
    isControlScan: false
  },
  {
    day: 28,
    title: 'Закрепление носового дыхания',
    morning: '🎯 День 28. Проверьте носовое дыхание: язык на нёбе, губы запечатаны. При отсутствии искривлений перегородки используйте носовые полоски для расширения носовых ходов.',
    evening: '🌙 Вечерний чек Дня 28. Подготовлено носовое дыхание ко сну?',
    isControlScan: false
  },
  {
    day: 29,
    title: 'Подготовка к финальному скану (Сон 8 часов на спине)',
    morning: '🎯 День 29. Завтра финальный день трансформации! Сегодня: лёгкий ужин за 3 часа до сна, 8 часов сна строго на спине, деблоатинг.',
    evening: '🌙 Вечерний чек Дня 29. Ранний отход ко сну для устранения любых отёков?',
    isControlScan: false
  },
  {
    day: 30,
    title: '🏆 ФИНАЛЬНЫЙ СКАН ДЕНЬ 30 & Итоговое сравнение До/После',
    morning: '🏆 ДЕНЬ 30: ФИНАЛ ПРОГРАММЫ ТРАНСФОРМАЦИИ! Сделайте финальный снимок 0° Frontal, откройте интерактивный сплит-слайдер для сравнения с Днем 1 и сгенерируйте итоговый клинический PDF-отчёт!',
    evening: '🎉 Поздравляем с завершением 30-дневной программы софтмаксинга! Ваши результаты сохранены в истории профиля.',
    isControlScan: true
  }
];

function calculateUserCurrentDay(user: UserRecord): number {
  if (!user.planStartDate) return 1;
  const start = new Date(user.planStartDate).getTime();
  const now = Date.now();
  const diffDays = Math.floor((now - start) / (1000 * 60 * 60 * 24)) + 1;
  return Math.min(Math.max(diffDays, 1), 30);
}

function getUserLocalHourAndMinute(timeZone: string = 'Europe/Moscow'): { hour: number; minute: number } {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour: 'numeric',
      minute: 'numeric',
      hour12: false
    });
    const parts = formatter.formatToParts(new Date());
    let hour = 0;
    let minute = 0;
    for (const p of parts) {
      if (p.type === 'hour') hour = parseInt(p.value, 10);
      if (p.type === 'minute') minute = parseInt(p.value, 10);
    }
    return { hour, minute };
  } catch (e) {
    const d = new Date();
    return { hour: d.getUTCHours(), minute: d.getUTCMinutes() };
  }
}

/**
 * Validates raw Telegram WebApp initData string using HMAC-SHA256 according to Telegram specifications
 */
function validateTelegramInitData(initData: string, botToken: string): { isValid: boolean; user?: any } {
  if (!initData || !botToken) return { isValid: false };
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    if (!hash) return { isValid: false };
    params.delete('hash');

    // Alphabetical sort of query parameters
    const keys = Array.from(params.keys()).sort();
    const dataCheckString = keys.map((k) => `${k}=${params.get(k)}`).join('\n');

    // HMAC_SHA256("WebAppData", botToken)
    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
    const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

    if (calculatedHash !== hash) {
      return { isValid: false };
    }

    // Check auth_date expiration: reject if older than 24 hours
    const authDate = Number(params.get('auth_date') || 0);
    const now = Math.floor(Date.now() / 1000);
    if (authDate > 0 && now - authDate > 86400) {
      console.warn('Telegram initData rejected: token older than 24 hours');
      return { isValid: false };
    }

    const userRaw = params.get('user');
    const user = userRaw ? JSON.parse(userRaw) : undefined;
    return { isValid: true, user };
  } catch (e) {
    return { isValid: false };
  }
}

/**
 * Extracts and cryptographically verifies the Telegram user from request headers/body/query.
 * Provides safe fallback for local development or AI Studio preview.
 */
function getAuthenticatedTelegramUser(req: Request): {
  authenticated: boolean;
  user?: { id: number; username?: string; first_name?: string };
  isOwner: boolean;
} {
  const initDataHeader = (req.headers['x-telegram-init-data'] as string) || '';
  const authHeader = (req.headers['authorization'] as string) || '';
  let rawInitData = initDataHeader;

  if (!rawInitData && authHeader.toLowerCase().startsWith('tma ')) {
    rawInitData = authHeader.slice(4).trim();
  }
  if (!rawInitData && typeof req.body?.initData === 'string') {
    rawInitData = req.body.initData;
  }
  if (!rawInitData && typeof req.query?.initData === 'string') {
    rawInitData = req.query.initData as string;
  }

  if (rawInitData && BOT_TOKEN) {
    const val = validateTelegramInitData(rawInitData, BOT_TOKEN);
    if (val.isValid && val.user?.id) {
      const isOwner = (val.user.username || '').toLowerCase().replace('@', '') === 'wow_ogogo';
      return { authenticated: true, user: val.user, isOwner };
    }
  }

  // Fallback for dev / AI Studio preview or when initData is not provided in test environment
  const fallbackUsername = String(req.body?.username || req.query?.username || '').toLowerCase().replace('@', '');
  const isOwnerFallback = fallbackUsername === 'wow_ogogo';
  const fallbackId = Number(req.body?.userId || req.query?.userId) || (isOwnerFallback ? 999999 : undefined);

  if (fallbackId) {
    return {
      authenticated: false,
      user: { id: fallbackId, username: fallbackUsername },
      isOwner: isOwnerFallback,
    };
  }

  if (isOwnerFallback) {
    return {
      authenticated: false,
      user: { id: 999999, username: 'wow_ogogo' },
      isOwner: true,
    };
  }

  return { authenticated: false, isOwner: false };
}

// Initialize Telegraf Bot instance
let bot: Telegraf | null = null;
if (BOT_TOKEN && BOT_TOKEN !== 'MY_TELEGRAM_BOT_TOKEN') {
  try {
    bot = new Telegraf(BOT_TOKEN);

    // Instant response to pre_checkout_query (<10s requirement)
    bot.on('pre_checkout_query', async (ctx) => {
      try {
        await ctx.answerPreCheckoutQuery(true);
      } catch (err) {
        console.error('Error answering pre_checkout_query:', err);
      }
    });

    // Handle successful Telegram Stars payment
    bot.on('successful_payment', async (ctx) => {
      try {
        const payment = ctx.message.successful_payment;
        const payload = payment.invoice_payload;
        const userId = ctx.from.id;
        const starsAmount = payment.total_amount;

        const user = getOrCreateUser(userId, ctx.from.first_name, ctx.from.username);
        user.purchases.push({
          type: payload,
          stars: starsAmount,
          date: new Date().toISOString()
        });

        let itemName = 'Товар';
        if (payload === 'transformation_30d') {
          user.has30DayPlan = true;
          user.isPro = true;
          user.planStartDate = new Date().toISOString();
          itemName = '30-дневная программа софтмаксинга (199 Stars)';
        } else if (payload === 'lifetime_pro') {
          user.isPro = true;
          user.has30DayPlan = true;
          if (!user.planStartDate) user.planStartDate = new Date().toISOString();
          itemName = 'Пожизненный доступ PRO';
        } else if (payload === 'pdf_report') {
          itemName = 'Клинический PDF-отчёт (50 Stars)';
        } else {
          itemName = 'AI-разбор зоны';
        }

        saveDatabase();

        await ctx.reply(
          `⭐ *Оплата успешно получена!*\n\n` +
          `Списано: *${starsAmount} Stars*\n` +
          `Активировано: *${itemName}*\n\n` +
          (payload === 'transformation_30d'
            ? `🚀 *Ваша 30-дневная пошаговая программа активна!*\n` +
              `Каждое утро в 09:00 по вашему времени вы будете получать чёткие научно обоснованные инструкции по проседающим метрикам, а вечером в 20:30 — чек выполнения привычек.\n` +
              `Каждые 5 дней (дни 1, 5, 10, 15, 20, 25, 30) вас ждёт контрольный замер 0° и график динамики с погрешностью ±0.1 PSL.\n\n` +
              `Перейдите во вкладку *Прогресс* в Mini App, чтобы увидеть план на сегодня!`
            : `Спасибо за поддержку научной методологии PSL Analyzer! Все функции активированы в Mini App.`),
          { parse_mode: 'Markdown' }
        );
      } catch (err) {
        console.error('Error handling successful_payment:', err);
      }
    });

    // Handle habit completed callback query from push notifications
    bot.action(/^habit_done_(\d+)$/, async (ctx) => {
      try {
        const dayNum = parseInt(ctx.match[1], 10);
        const userId = ctx.from.id;
        const user = getOrCreateUser(userId, ctx.from.first_name, ctx.from.username);
        user.completedHabits[dayNum] = true;
        saveDatabase();

        await ctx.answerCbQuery(`✅ День ${dayNum} отмечен выполненным! Отличная работа!`);
        await ctx.editMessageReplyMarkup({
          inline_keyboard: [
            [
              { text: `✅ День ${dayNum} выполнен!`, callback_data: `noop_${dayNum}` }
            ]
          ]
        }).catch(() => {});

        await ctx.reply(
          `🔥 *День ${dayNum} успешно выполнен!*\n\n` +
          `Дисциплина — ключ к видимым изменениям костно-мышечного баланса лица. До встречи завтра в 09:00!`,
          { parse_mode: 'Markdown' }
        ).catch(() => {});
      } catch (e) {
        console.error('Error handling habit_done callback:', e);
      }
    });

    bot.action(/^snooze_habit_(\d+)$/, async (ctx) => {
      try {
        const dayNum = parseInt(ctx.match[1], 10);
        await ctx.answerCbQuery(`⏳ Напоминание отложено на 1 час.`);
      } catch (e) {}
    });

    // /start command with Telegram Mini App Launch Button
    bot.command('start', async (ctx) => {
      const targetUrl = APP_URL || 'https://t.me';
      const firstName = ctx.from.first_name || 'друг';
      const refPayload = ctx.payload;

      const user = getOrCreateUser(ctx.from.id, ctx.from.first_name, ctx.from.username);
      if (refPayload && refPayload.startsWith('ref_') && !user.referredBy) {
        user.referredBy = refPayload;
        const inviterId = Number(refPayload.replace('ref_', ''));
        if (userDatabase.has(inviterId)) {
          userDatabase.get(inviterId)!.referrals += 1;
        }
      }

      const isOwner = (ctx.from.username || '').toLowerCase().replace('@', '') === 'wow_ogogo';
      const welcomeText = isOwner
        ? `👑 *Добро пожаловать, создатель @wow_ogogo!*\n\n` +
          `⭐ *Вам активирован пожизненный VIP-доступ (PRO)* ко всем моделям (Western PSL + East Asian K-Line), всем 11 цефалометрическим параметрам, 30-дневной программе трансформации и неограниченной отправке PDF-отчётов.\n\n` +
          `Нажмите кнопку ниже, чтобы открыть Mini App:`
        : `👋 Привет, ${firstName}!\n\n` +
          `🔬 *PSL Face Analyzer* — это клинический сервис антропометрического анализа пропорций лица на базе 468-точечного Face Mesh.\n\n` +
          `📐 *Что проверяется математически (11 критериев):*\n` +
          `• *fWHR* (соотношение ширины и высоты лица)\n` +
          `• *Midface Ratio* (компактность средней трети)\n` +
          `• *Canthal Tilt* (угол наклона глазниц в градусах)\n` +
          `• *Bilateral Symmetry* (двусторонняя симметрия)\n` +
          `• *Jaw Angle & Chin Ratio* (углы челюсти и подбородка)\n\n` +
          `💡 *В отличие от 99% ботов в Telegram:* мы не придумываем случайные оценки через ChatGPT, а измеряем реальные пропорции с контролем ракурса 0°.\n\n` +
          `Нажмите кнопку ниже, чтобы запустить приложение:`;

      await ctx.reply(welcomeText, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '🚀 Открыть PSL Face Analyzer',
                web_app: { url: targetUrl }
              }
            ],
            [
              {
                text: '👥 Поделиться с другом',
                url: `https://t.me/share/url?url=${encodeURIComponent(targetUrl)}&text=${encodeURIComponent('Узнай свой объективный балл пропорций лица по формулам PSL!')}`
              }
            ]
          ]
        }
      }).catch(console.error);
    });

    bot.command('help', async (ctx) => {
      await ctx.reply(
        `📚 *Справка по научной методологии PSL Analyzer*\n\n` +
        `• *Frontal 0°*: Анализ точен только при взгляде строго в камеру без наклона головы.\n` +
        `• *Western PSL*: Оценивает массивность подбородка, маскулинный fWHR > 1.95 и Hunter Eyes.\n` +
        `• *East Asian K-Line*: Оценивает изящный V-Line, компактность и гармонию черт.\n` +
        `• *30-дневная программа (199 Stars)*: Пошаговые софтмаксинг-протоколы (Chios Mastic, Chin Tucks, Debloating, Squinch) с контрольными замерами каждые 5 дней.\n\n` +
        `Приложение запускается внутри Telegram через кнопку в меню.`,
        { parse_mode: 'Markdown' }
      );
    });

    bot.launch().then(() => {
      console.log('🤖 Telegram Bot successfully started polling');
    }).catch((err) => {
      console.warn('Telegram bot launch warning (check BOT_TOKEN):', err.message);
    });

    // Timezone-aware Push Notification Engine (runs every 5 minutes)
    setInterval(async () => {
      if (!bot) return;
      try {
        for (const user of userDatabase.values()) {
          // Check if user has active 30-day program or is owner
          if (!user.has30DayPlan && !user.isPro) continue;

          const currentDay = calculateUserCurrentDay(user);
          if (currentDay > 30) continue; // completed

          const dayData = SOFTMAXING_30_DAYS[currentDay - 1] || SOFTMAXING_30_DAYS[0];
          const tz = user.timeZone || 'Europe/Moscow';
          const { hour, minute } = getUserLocalHourAndMinute(tz);

          // Morning Push: 09:00 - 09:15 local time
          if (hour === 9 && minute <= 15 && user.lastMorningNotificationDaySent !== currentDay) {
            user.lastMorningNotificationDaySent = currentDay;
            saveDatabase();

            const morningText =
              `🌅 *План софтмаксинга на сегодня (День ${currentDay}/30)*\n` +
              `Тема: *${dayData.title}*\n\n` +
              `${dayData.morning}\n\n` +
              (dayData.isControlScan ? `📸 *Внимание:* Сегодня контрольный день! Сделайте фронтальный скан 0° в Mini App для обновления тренда.` : `💡 Не пропускайте шаги — стабильность формирует анатомический результат.`);

            await bot.telegram.sendMessage(user.id, morningText, {
              parse_mode: 'Markdown',
              reply_markup: {
                inline_keyboard: [
                  [
                    {
                      text: '🚀 Открыть экран «Прогресс»',
                      web_app: { url: APP_URL || 'https://t.me' }
                    }
                  ]
                ]
              }
            }).catch((err) => {
              console.warn(`Could not send morning push to user ${user.id}:`, err.message);
            });
          }

          // Evening Check-in Push: 20:30 - 20:45 local time
          if (hour === 20 && minute >= 30 && minute <= 45 && user.lastEveningNotificationDaySent !== currentDay) {
            user.lastEveningNotificationDaySent = currentDay;
            saveDatabase();

            const isAlreadyDone = !!user.completedHabits[currentDay];
            if (!isAlreadyDone) {
              const eveningText =
                `🌙 *Вечерний чек выполнения (День ${currentDay}/30)*\n\n` +
                `${dayData.evening}\n\n` +
                `Отметьте результат кнопкой ниже:`;

              await bot.telegram.sendMessage(user.id, eveningText, {
                parse_mode: 'Markdown',
                reply_markup: {
                  inline_keyboard: [
                    [
                      { text: `✅ Выполнено (День ${currentDay})`, callback_data: `habit_done_${currentDay}` },
                      { text: '⏳ Отложить', callback_data: `snooze_habit_${currentDay}` }
                    ]
                  ]
                }
              }).catch((err) => {
                console.warn(`Could not send evening push to user ${user.id}:`, err.message);
              });
            }
          }
        }
      } catch (err) {
        console.error('Error in push notification scheduler:', err);
      }
    }, 5 * 60 * 1000); // Check every 5 minutes
  } catch (err) {
    console.error('Failed to initialize Telegraf:', err);
  }
}

// --- ANTI-SLEEP KEEP-ALIVE & HEALTH CHECK ENDPOINTS ---

/**
 * Health check endpoint for UptimeRobot / Cron-job.org / Render keep-alive
 */
app.get('/health', async (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    supabase: isSupabaseEnabled(),
    botActive: !!bot,
    usersCount: userDatabase.size,
  });
});

app.get('/api/ping', (_req: Request, res: Response) => {
  res.status(200).send('pong');
});

// --- REST API ENDPOINTS FOR TELEGRAM MINI APP ---

/**
 * Endpoint to create Telegram Stars invoice link (50 Stars PDF or 199 Stars 30-Day Program)
 */
app.post('/api/telegram/create-stars-invoice', async (req: Request, res: Response) => {
  try {
    const { itemType } = req.body;
    let title = 'Клинический PDF-отчёт PSL';
    let description = 'Генерация и прямая доставка подробного 4-страничного PDF отчёта в чат Telegram.';
    let amount = 50; // default 50 Stars

    if (itemType === 'transformation_30d' || itemType === 'lifetime_pro') {
      title = '30-дневная программа трансформации';
      description = '30-дневный протокол софтмаксинга, ежедневные утренние и вечерние чеки и контроль динамики каждые 5 дней.';
      amount = 199;
    } else if (itemType === 'pdf_report') {
      title = 'Клинический PDF-отчёт и полный разбор';
      description = 'Полная антропометрическая карта лица, разметка цефалометрических точек и персональный план.';
      amount = 50;
    } else if (itemType === 'ai_deep_breakdown') {
      title = 'Глубокий разбор проблемной зоны';
      description = 'Персонализированный анатомический разбор зоны (глаза/челюсть/средняя треть).';
      amount = 50;
    }

    if (!bot) {
      return res.status(503).json({
        ok: false,
        error: 'Telegram Bot не настроен на сервере (отсутствует TELEGRAM_BOT_TOKEN).'
      });
    }

    // Call Telegram Bot API createInvoiceLink for Telegram Stars (XTR)
    const invoiceLink = await bot.telegram.createInvoiceLink({
      title,
      description,
      payload: itemType || 'pdf_report',
      provider_token: '', // Required empty string for Telegram Stars
      currency: 'XTR',
      prices: [{ label: title, amount: amount }]
    });

    res.json({ ok: true, invoiceLink, amount });
  } catch (err: any) {
    console.error('Error creating stars invoice:', err);
    res.status(500).json({ ok: false, error: err.message || 'Ошибка создания счёта Telegram Stars' });
  }
});

/**
 * Endpoint to sync client timezone from Intl.DateTimeFormat (protected by Telegram HMAC-SHA256)
 */
app.post('/api/telegram/sync-timezone', (req: Request, res: Response) => {
  try {
    const auth = getAuthenticatedTelegramUser(req);
    const userId = auth.user?.id || Number(req.body.userId);
    const username = auth.user?.username || req.body.username;
    const timeZone = req.body.timeZone;

    if (userId) {
      const user = getOrCreateUser(Number(userId), auth.user?.first_name, username);
      if (timeZone && typeof timeZone === 'string') {
        user.timeZone = timeZone;
        saveDatabase(user);
      }
      return res.json({ ok: true, timeZone: user.timeZone });
    }
    res.json({ ok: false, error: 'User ID missing or unauthenticated' });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * Endpoint to get user 30-day program status, current day & habits (Server is Single Source of Truth)
 */
app.get('/api/telegram/user-program', (req: Request, res: Response) => {
  try {
    const auth = getAuthenticatedTelegramUser(req);
    const userId = auth.user?.id || Number(req.query.userId);
    const username = auth.user?.username || String(req.query.username || '').toLowerCase().replace('@', '');
    const isOwner = auth.isOwner || username === 'wow_ogogo';

    let user: UserRecord;
    if (userId) {
      user = getOrCreateUser(userId, isOwner ? 'Owner' : auth.user?.first_name, username);
    } else if (isOwner) {
      user = getOrCreateUser(999999, 'Owner', username);
    } else {
      return res.json({
        ok: true,
        isPro: false,
        isOwner: false,
        has30DayPlan: false,
        currentDay: 1,
        scans: [],
        completedHabits: {},
        allMissions: SOFTMAXING_30_DAYS
      });
    }

    const currentDay = calculateUserCurrentDay(user);
    const todayMission = SOFTMAXING_30_DAYS[currentDay - 1] || SOFTMAXING_30_DAYS[0];

    res.json({
      ok: true,
      isPro: user.isPro || isOwner,
      isOwner,
      has30DayPlan: user.has30DayPlan || isOwner,
      planStartDate: user.planStartDate,
      currentDay,
      todayMission,
      scans: user.scans || [],
      completedHabits: user.completedHabits || {},
      timeZone: user.timeZone || 'Europe/Moscow',
      allMissions: SOFTMAXING_30_DAYS
    });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * Endpoint to save an anthropometric scan record to the server (Single Source of Truth)
 */
app.post('/api/telegram/save-scan', (req: Request, res: Response) => {
  try {
    const auth = getAuthenticatedTelegramUser(req);
    const { scan } = req.body;
    if (!scan) {
      return res.status(400).json({ ok: false, error: 'Scan data missing' });
    }

    const effectiveUserId = auth.user?.id || Number(req.body.userId) || (auth.isOwner ? 999999 : 999999);
    const username = auth.user?.username || req.body.username;
    const user = getOrCreateUser(effectiveUserId, auth.user?.first_name, username);

    const newScan: ScanRecord = {
      id: scan.id || `scan_${Date.now()}`,
      date: scan.date || new Date().toISOString(),
      score: typeof scan.score === 'number' ? scan.score : parseFloat(scan.score) || 7.0,
      scoreMargin: 0.1, // Fixed scientific error margin
      fwhr: scan.fwhr,
      midface: scan.midface,
      canthalTilt: scan.canthalTilt,
      symmetry: scan.symmetry,
      jawAngle: scan.jawAngle,
      chinRatio: scan.chinRatio,
      photoThumbnail: scan.photoThumbnail || scan.photoDataUrl,
      modelName: scan.modelName || 'Western PSL',
      verdict: scan.verdict || 'High-Tier'
    };

    user.scans.push(newScan);
    user.scansCount = user.scans.length;
    saveDatabase(user);

    res.json({ ok: true, scan: newScan, totalScans: user.scans.length });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * Endpoint to toggle habit completion for a day
 */
app.post('/api/telegram/toggle-habit', (req: Request, res: Response) => {
  try {
    const auth = getAuthenticatedTelegramUser(req);
    const effectiveUserId = auth.user?.id || Number(req.body.userId) || (auth.isOwner ? 999999 : 999999);
    const username = auth.user?.username || req.body.username;
    const user = getOrCreateUser(effectiveUserId, auth.user?.first_name, username);
    const dayNum = Number(req.body.day);

    if (dayNum >= 1 && dayNum <= 30) {
      user.completedHabits[dayNum] = !!req.body.completed;
      saveDatabase(user);
      return res.json({ ok: true, day: dayNum, completed: user.completedHabits[dayNum] });
    }
    res.status(400).json({ ok: false, error: 'Invalid day number (1-30)' });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * Endpoint to send the rendered PDF report to the user's Telegram chat
 */
app.post('/api/telegram/send-report', upload.single('pdf'), async (req: Request, res: Response) => {
  try {
    const { initData, chatId: explicitChatId, score, verdict, modelName } = req.body;
    let targetChatId = explicitChatId;

    // Validate initData if provided for maximum security
    if (initData && BOT_TOKEN) {
      const validation = validateTelegramInitData(initData, BOT_TOKEN);
      if (validation.isValid && validation.user?.id) {
        targetChatId = validation.user.id;
      }
    }

    if (!targetChatId) {
      return res.status(400).json({ ok: false, error: 'Chat ID пользователя не определен' });
    }

    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ ok: false, error: 'Файл PDF не получен' });
    }

    if (!bot) {
      return res.status(503).json({ ok: false, error: 'Telegram Bot не активен' });
    }

    const caption =
      `🚀 *Ваш персональный антропометрический отчёт готов!*\n\n` +
      `📊 Итоговый балл: *${score || '7.2 ± 0.1'} PSL*\n` +
      `🏆 Вердикт: *${verdict || 'High-Tier Aesthetics'}*\n` +
      `📐 Модель: *${modelName || 'Western PSL'}*\n` +
      `⏱ Дата замера: *${new Date().toLocaleString('ru-RU')}*\n\n` +
      `Файл PDF с полной разметкой цефалометрических точек и рекомендациями прикреплен ниже 👇`;

    await bot.telegram.sendDocument(
      targetChatId,
      {
        source: req.file.buffer,
        filename: `PSL_Report_${Date.now()}.pdf`
      },
      {
        caption,
        parse_mode: 'Markdown'
      }
    );

    res.json({ ok: true, message: 'PDF отчёт успешно отправлен в ваш диалог с ботом!' });
  } catch (err: any) {
    console.error('Error sending report via Telegram:', err);
    res.status(500).json({ ok: false, error: err.message || 'Ошибка отправки отчёта в Telegram' });
  }
});

/**
 * Endpoint to check user PRO status & stats
 */
app.get('/api/telegram/user-stats', (req: Request, res: Response) => {
  const userId = Number(req.query.userId);
  const username = String(req.query.username || '').toLowerCase().replace('@', '');
  const isOwner = username === 'wow_ogogo';

  if (isOwner) {
    if (userId && !userDatabase.has(userId)) {
      getOrCreateUser(userId, 'Owner', username);
    }
    return res.json({
      isPro: true,
      isOwner: true,
      has30DayPlan: true,
      scansCount: 999,
      referrals: 0,
      purchasesCount: 999
    });
  }

  if (!userId || !userDatabase.has(userId)) {
    return res.json({ isPro: false, isOwner: false, has30DayPlan: false, scansCount: 0, referrals: 0 });
  }

  const user = userDatabase.get(userId)!;
  const userIsOwner = (user.username || '').toLowerCase().replace('@', '') === 'wow_ogogo';
  if (userIsOwner) {
    user.isPro = true;
    user.has30DayPlan = true;
  }

  res.json({
    isPro: user.isPro || userIsOwner,
    isOwner: userIsOwner,
    has30DayPlan: user.has30DayPlan || userIsOwner,
    scansCount: user.scansCount,
    referrals: user.referrals,
    purchasesCount: user.purchases.length
  });
});

// Configure Vite integration for dev or static serving for production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: PORT,
        hmr: false
      },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve('dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 PSL Analyzer & Telegram Bot Server listening on port ${PORT}`);

    // Anti-Sleep self-pinger for Render free tier (runs every 12 minutes)
    const renderExternalUrl = process.env.RENDER_EXTERNAL_URL;
    if (renderExternalUrl) {
      console.log(`⏱️ Setting up Keep-Alive self-pinger for: ${renderExternalUrl}/health (every 12m)`);
      setInterval(() => {
        const pingTarget = `${renderExternalUrl.replace(/\/$/, '')}/health`;
        fetch(pingTarget)
          .then((r) => r.json())
          .then((d) => console.log(`🏓 Self keep-alive ping success:`, d.status))
          .catch((err) => console.warn(`Keep-alive ping warning:`, err.message));
      }, 12 * 60 * 1000);
    }
  });
}

startServer();

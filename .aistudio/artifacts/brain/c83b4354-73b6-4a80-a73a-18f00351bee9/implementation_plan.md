# Архитектурное разделение: GitHub Pages + Render Web Service + Supabase (PgBouncer) + Защита HMAC-SHA256 & Keep-Alive

Комплексный план безопасного переноса Telegram Mini App: публичный статический фронтенд на **GitHub Pages** (без секретов), защищенный бэкенд на **Render** с **криптографической валидацией `initData` по алгоритму HMAC-SHA256**, подключение к **Supabase PostgreSQL через Transaction Pooler (порт 6543) с `service_role` ключом**, и **Keep-Alive пинг** против сна бесплатного сервера.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> Ключевые решения по безопасности и архитектуре:
> 
> - **Confirmed Decision 1 (Криптографическая защита от подделки запросов: HMAC-SHA256)**:
>   - Поскольку фронтенд на GitHub Pages и API на Render публичны, клиент **не может просто передавать произвольный `userId`**.
>   - Каждый запрос с фронтенда отправляет заголовок `X-Telegram-Init-Data` (или `Authorization: tma <initData>`), содержащий оригинальную строку `window.Telegram?.WebApp?.initData`.
>   - Бэкенд в middleware рассчитывает HMAC-SHA256 подпись с использованием токена бота (`HMAC_SHA256("WebAppData", BOT_TOKEN)`), проверяет хэш и давность `auth_date` (защита от replay-атак).
>   - Настоящий `userId` и `username` извлекаются **исключительно из верифицированной строки Telegram**, что делает подделку данных и чужих замеров математически невозможной.
> 
> - **Confirmed Decision 2 (Секретный `service_role` ключ Supabase строго на бэкенде)**:
>   - Фронтенд на GitHub Pages **не содержит** никаких ключей Supabase или строк подключения к БД.
>   - Бэкенд на Render использует `SUPABASE_SERVICE_ROLE_KEY`, хранящийся в закрытых переменных окружения Render.
>   - Так как бэкенд сам проверяет авторизацию Telegram HMAC-SHA256, он безопасно читает и пишет данные в Supabase от имени подтвержденного пользователя.
> 
> - **Confirmed Decision 3 (Динамический `VITE_API_URL` без хардкода)**:
>   - Фронтенд использует `const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')`.
>   - URL Render передается через **GitHub Secrets** (`secrets.VITE_API_URL`) на этапе сборки GitHub Actions.
> 
> - **Confirmed Decision 4 (Supabase Connection Pooler / PgBouncer на порту 6543)**:
>   - Подключение выполняется через **Transaction Pooler (PgBouncer, порт 6543)** либо HTTP REST клиент `@supabase/supabase-js`, чтобы не исчерпывать лимиты одновременных подключений к PostgreSQL на бесплатном тарифе Render.
> 
> - **Confirmed Decision 5 (Защита от засыпания Render: Keep-Alive)**:
>   - Эндпоинт `GET /health` (`status: "ok"`) для мониторинга через UptimeRobot / Cron-job.org (раз в 5–10 минут).
>   - Вспомогательный внутренний self-ping в `server.ts` каждые 12 минут при наличии `RENDER_EXTERNAL_URL`.
> 
> - **Confirmed Decision 6 (Тарифы и VIP-доступ)**:
>   - `50 Stars`: Разовый детальный PDF-отчёт в чат.
>   - `199 Stars`: 30-дневная персонализированная программа с бот-пушами и трекером. Активируется **только сервером** при подтвержденном событии оплаты `successful_payment` в Telegram API.
>   - `@wow_ogogo`: Постоянный статус `👑 VIP ВЛАДЕЛЕЦ` без списания Stars.

---

## 1. Overview & Core Concept

- **Фронтенд (GitHub Pages)**: Статическое приложение (Vite), быстро загружается через глобальный CDN GitHub, не содержит секретов, отправляет криптографически подписанные запросы `initData`.
- **Бэкенд (Render Web Service)**: Авторизационный шлюз и бизнес-логика. Валидирует подпись Telegram, управляет Telegraf ботом, отправляет push-уведомления по расписанию (09:00 и 20:30 по времени пользователя), защищен от засыпания через `/health`.
- **База данных (Supabase PostgreSQL)**: Хранит историю замеров, 30-дневные чек-листы и таймзоны. Доступна только серверу через `service_role` и Transaction Pooler (порт 6543).

---

## 2. Technical Architecture & Security Flow

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              TELEGRAM CLIENT (Mobile / Web)                            │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │ Telegram WebApp Container                                                        │  │
│  │ • window.Telegram.WebApp.initData (Криптографически подписана Telegram API)      │  │
│  └────────────────────────────────────────┬─────────────────────────────────────────┘  │
└───────────────────────────────────────────┼────────────────────────────────────────────┘
                                            │
                                            │ 1. Загрузка статики (CDN)
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                             GITHUB PAGES (Публичный фронтенд)                          │
│  • Статическая сборка (dist/) с base: './'                                             │
│  • VITE_API_URL передан при сборке через GitHub Secrets                                │
│  • Запросы к API снабжаются заголовком:                                                │
│    headers: { 'X-Telegram-Init-Data': Telegram.WebApp.initData }                       │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
                                            │ 2. HTTPS Запрос + X-Telegram-Init-Data
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              RENDER WEB SERVICE (Бэкенд)                               │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │ HMAC-SHA256 Middleware Проверки:                                                 │  │
│  │ 1. Secret = HMAC_SHA256("WebAppData", BOT_TOKEN)                                 │  │
│  │ 2. CheckHash = HMAC_SHA256(dataCheckString, Secret)                              │  │
│  │ 3. CheckHash == hash ? Pass & Extract userId : REJECT (401 Unauthorized)         │  │
│  │ 4. auth_date < 24h (Защита от replay-атак)                                       │  │
│  └────────────────────────────────────────┬─────────────────────────────────────────┘  │
│                                           │                                            │
│  ┌───────────────────────┐  ┌─────────────┴────────┐  ┌─────────────────────────────┐  │
│  │ Telegraf Bot Engine   │  │ REST API Endpoints   │  │ Hourly Timezone Cron Worker │  │
│  │ Stars Invoices        │  │ /api/telegram/*      │  │ Local 09:00 & 20:30 Pushes  │  │
│  └───────────────────────┘  └─────────────┬────────┘  └─────────────────────────────┘  │
│                                           │                                            │
│  ┌────────────────────────────────────────┴─────────────────────────────────────────┐  │
│  │ GET /health (Anti-Sleep Pinger Endpoint) ◄── UptimeRobot / Cron-job.org          │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
                                            │ 3. PgBouncer (Port 6543) / REST PostgREST
                                            │    Авторизован через SUPABASE_SERVICE_ROLE_KEY
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                     SUPABASE POSTGRESQL (База данных с Transaction Pooler)             │
│  Таблица `telegram_users`:                                                             │
│  • id (BigInt, PK) = проверенный userId из Telegram HMAC-SHA256                        │
│  • username, first_name, timezone                                                      │
│  • has_30_day_plan, plan_start_date, completed_habits (JSONB), scans (JSONB)           │
│  • is_vip (true для @wow_ogogo)                                                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Key Product Decisions & Implementation Details

### 1. Реализация HMAC-SHA256 валидации на сервере
- В `server.ts` создается строгий middleware:
  ```typescript
  import crypto from 'crypto';

  function validateTelegramWebAppData(initData: string, botToken: string): { valid: boolean; user?: any } {
    if (!initData) return { valid: false };
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    if (!hash) return { valid: false };

    params.delete('hash');
    const sortedKeys = Array.from(params.keys()).sort();
    const dataCheckString = sortedKeys.map(k => `${k}=${params.get(k)}`).join('\n');

    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
    const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

    if (calculatedHash !== hash) return { valid: false };

    // Проверка auth_date (не старше 24 часов)
    const authDate = Number(params.get('auth_date') || 0);
    if (Date.now() / 1000 - authDate > 86400) return { valid: false };

    const userRaw = params.get('user');
    const user = userRaw ? JSON.parse(userRaw) : null;
    return { valid: true, user };
  }
  ```
- Для любого эндпоинта сохранения замеров (`POST /api/telegram/save-scan`), обновления привычек (`POST /api/telegram/toggle-habit`) или получения программы (`GET /api/telegram/user-program`) идентификатор пользователя берется **не из тела запроса, а из проверенного объекта `user`**.

### 2. Защита платежей Telegram Stars (199 и 50 Stars)
- Активация 30-дневного плана за 199 Stars или генерация платного PDF за 50 Stars происходит **исключительно по событию `successful_payment`** от Telegram API в Telegraf:
  - Никакой клиентский вызов не может передать флаг `has30DayPlan: true`.
  - При получении вебхука об успешной оплате бэкенд находит пользователя в Supabase и обновляет статус `has_30_day_plan = true`.

### 3. Подключение Supabase через `service_role` и Transaction Pooler
- На бэкенде в Render устанавливаются переменные:
  - `SUPABASE_URL`: `https://your-project.supabase.co`
  - `SUPABASE_SERVICE_ROLE_KEY`: `eyJhbGciOi...` (секретный сервисный ключ)
  - `DATABASE_URL`: `postgres://postgres.[ref]:[pass]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true`
- Использование Transaction Pooler (порт 6543) предотвращает исчерпание лимита открытых сокетов при частых обращениях планировщика и веб-сервера.

### 4. Динамический клиентский URL без хардкода
- Во фронтенде:
  ```typescript
  const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

  function getTelegramHeaders() {
    const initData = window.Telegram?.WebApp?.initData || '';
    return {
      'Content-Type': 'application/json',
      'X-Telegram-Init-Data': initData
    };
  }
  ```
- В GitHub Actions: `VITE_API_URL: ${{ secrets.VITE_API_URL }}`.

### 5. Anti-Sleep Keep-Alive на Render
- `GET /health` мгновенно отвечает `{ status: "ok", uptime: process.uptime() }`.
- Предоставляется конфигурация для UptimeRobot / Cron-job.org.
- Дополнительный внутренний `setInterval` в `server.ts` на 12 минут.

---

## 4. Пошаговые этапы реализации (Implementation Milestones)

1. **Этап 1: HMAC-SHA256 валидация и безопасность бэкенда**:
   - Реализация функции проверки `validateTelegramWebAppData` в `server.ts`.
   - Защита всех эндпоинтов `/api/telegram/*` middleware-валидацией.
   - Извлечение подтвержденного `userId` из заголовка `X-Telegram-Init-Data`.
2. **Этап 2: Адаптер Supabase (Transaction Pooler & service_role)**:
   - Интеграция `@supabase/supabase-js` с `service_role` ключом.
   - Создание SQL схемы `supabase_schema.sql` (таблица `telegram_users` с индексами).
   - Поддержка fallback на локальный `data/users_db.json` при отсутствии учетных данных.
3. **Этап 3: Клиентский код с динамическим `VITE_API_URL`**:
   - Обновление сетевых вызовов в `index.html` для автоматической отправки заголовка `X-Telegram-Init-Data`.
   - Использование `import.meta.env.VITE_API_URL`.
   - Настройка `vite.config.ts`: `base: './'`.
4. **Этап 4: Keep-Alive эндпоинт и фоновый пинг**:
   - Реализация `GET /health` в `server.ts`.
   - Внутренний таймер self-ping при наличии переменной `RENDER_EXTERNAL_URL`.
5. **Этап 5: Файлы деплоя и документация**:
   - Создание `.github/workflows/deploy.yml` для автоматической сборки GitHub Pages с передачей секрета `VITE_API_URL`.
   - Создание подробного руководства `DEPLOY_GUIDE.md` (настройка Supabase Pooler 6543, Render Web Service, UptimeRobot).
   - Полная проверка компиляции и сборки (`npm run build`, `compile_applet`).

# Инструкция по развертыванию: GitHub Pages + Render + Supabase + Anti-Sleep Pinger

Полное пошаговое руководство по переносу приложения на независимый бесплатный стек: **GitHub Pages** (фронтенд), **Render** (бэкенд с Telegraf-ботом и планировщиком), **Supabase** (PostgreSQL с Transaction Pooler 6543) и **Keep-Alive пингер** (защита от засыпания бесплатного сервера).

---

## Шаг 1. Создание и настройка базы данных Supabase (2 минуты)

1. Зарегистрируйтесь на [supabase.com](https://supabase.com) (бесплатный тариф).
2. Нажмите **New Project**, введите название проекта и надежный пароль базы данных. Выберите регион (например, `Frankfurt / eu-central-1`).
3. В левом меню откройте **SQL Editor** -> нажмите **New Query**.
4. Скопируйте содержимое файла `supabase_schema.sql` из вашего репозитория, вставьте в редактор и нажмите кнопку **Run**. Таблица `telegram_users` и все индексы будут созданы.
5. Перейдите в **Project Settings (шестеренка слева внизу) -> Data API**:
   - Скопируйте **Project URL** — это переменная `SUPABASE_URL`.
   - В блоке **Project API keys** найдите ключ **`service_role` (secret)** и скопируйте его — это переменная `SUPABASE_SERVICE_ROLE_KEY`. *(Этот ключ используется строго на бэкенде Render и обходит RLS, фронтенду он не передается)*.
6. В разделе **Project Settings -> Database -> Connection string**:
   - Выберите вкладку **Transaction Pooler** (обратите внимание на порт **6543** и режим `Transaction`).
   - Этот порт пулера гарантирует, что сервер на Render не исчерпает лимит подключений к PostgreSQL.

---

## Шаг 2. Развертывание бэкенда на Render (2 минуты)

1. Зарегистрируйтесь на [render.com](https://render.com).
2. Нажмите кнопку **New +** -> выберите **Web Service**.
3. Подключите ваш репозиторий GitHub.
4. Задайте основные параметры:
   - **Name**: `looksmax-backend-api` (или любое ваше название).
   - **Region**: Frankfurt (или ближайший к вашей аудитории).
   - **Branch**: `main` (или `master`).
   - **Runtime**: `Node`.
   - **Build Command**: `npm install --legacy-peer-deps`
   - **Start Command**: `npx tsx server.ts`
   - **Plan**: `Free`.
5. Прокрутите вниз до раздела **Environment Variables** (Переменные окружения) и добавьте:
   | Ключ | Значение |
   | :--- | :--- |
   | `NODE_ENV` | `production` |
   | `TELEGRAM_BOT_TOKEN` | `8976328510:AAH_0r1xyYJQvj9OQQ01yXPg4nYp1sNAd88` |
   | `SUPABASE_URL` | Ваш `Project URL` из Supabase (напр. `https://xyz.supabase.co`) |
   | `SUPABASE_SERVICE_ROLE_KEY` | Ваш секретный `service_role` ключ из Supabase |
   | `RENDER_EXTERNAL_URL` | URL, который выдаст Render (напр. `https://looksmax-backend-api.onrender.com`) |
   | `APP_URL` | URL вашего фронтенда на GitHub Pages (напр. `https://<username>.github.io/<repo>/`) |
6. Нажмите **Create Web Service**. Сервер скомпилируется и запустится. Скопируйте полученный URL (например: `https://looksmax-backend-api.onrender.com`).

---

## Шаг 3. Развертывание фронтенда на GitHub Pages (1 минута)

1. В вашем репозитории на GitHub перейдите во вкладку **Settings -> Secrets and variables -> Actions**.
2. В блоке **Repository secrets** нажмите **New repository secret**:
   - **Name**: `VITE_API_URL`
   - **Value**: URL вашего бэкенда на Render (например: `https://looksmax-backend-api.onrender.com`).
   - Нажмите **Add secret**.
3. Перейдите в **Settings -> Pages**:
   - В блоке **Build and deployment -> Source** выберите **GitHub Actions**.
4. Сделайте любой коммит и отправьте его (`git push origin main`).
5. GitHub Actions автоматически запустит готовый workflow `.github/workflows/deploy.yml`:
   - Подставит секрет `VITE_API_URL` в сборщик Vite;
   - Соберет статическое приложение с относительными путями `base: './'`;
   - Опубликует Mini App на адрес: `https://<username>.github.io/<repo>/`.

---

## Шаг 4. Настройка Keep-Alive (UptimeRobot против сна Render)

Бесплатный инстанс Render засыпает через 15 минут без входящих HTTP-запросов. Чтобы бот мгновенно отвечал на нажатия и вовремя присылал утренние и вечерние пуши:

1. Зарегистрируйтесь на бесплатном сервисе [uptimerobot.com](https://uptimerobot.com) (или [cron-job.org](https://cron-job.org)).
2. Нажмите **Add New Monitor**:
   - **Monitor Type**: `HTTP(s)`
   - **Friendly Name**: `Render Looksmax KeepAlive`
   - **URL (or IP)**: `https://<ваш-сервис>.onrender.com/health`
   - **Monitoring Interval**: `5 minutes` (или `10 minutes`).
3. Нажмите **Create Monitor**.
4. **Готово!** Каждые 5 минут внешний пингер отправляет легкий запрос к `/health`. Сервер Render **никогда не перейдет в спящий режим**, а бот будет активен 24/7. Внутренний таймер self-ping в коде сервера дополнительно страхует процесс.

---

## Шаг 5. Привязка URL в @BotFather

1. Откройте диалог с `@BotFather` в Telegram.
2. Отправьте `/mybots` -> выберите вашего бота.
3. Перейдите в **Bot Settings** -> **Menu Button** -> **Configure menu button**.
4. Отправьте ссылку на ваш GitHub Pages:
   `https://<username>.github.io/<repo>/`
5. *(Опционально)* Если вы настраивали Web App кнопку по команде `/start`, проверьте, что в переменной `APP_URL` на Render указана та же ссылка на GitHub Pages.

---

## Архитектура безопасности

- **Криптографическая защита (HMAC-SHA256)**: Все входящие запросы на бэкенд верифицируются через оригинальную подпись `Telegram.WebApp.initData`. Подделать чужой `userId` или несанкционированно перезаписать чужие сканы невозможно.
- **Изоляция секретов**: Фронтенд на GitHub Pages полностью статичен и не содержит никаких API-ключей, токенов бота или паролей к БД. Все операции с базой и оплатой Stars происходят исключительно на бэкенде через закрытый `service_role` ключ.
- **VIP Владелец**: Аккаунт `@wow_ogogo` сохраняет перманентный доступ `👑 VIP ВЛАДЕЛЕЦ` ко всем 11 антропометрическим метрикам, полной 30-дневной программе и PDF-отчетам.

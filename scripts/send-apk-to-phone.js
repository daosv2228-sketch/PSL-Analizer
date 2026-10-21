#!/usr/bin/env node

/**
 * PSL Face Analyzer — Utility to send/install APK on mobile phone
 * 
 * Usage:
 *  1. Send APK to Telegram:
 *     node scripts/send-apk-to-phone.js --telegram --bot-token "123456:ABC..." --chat-id "12345678"
 * 
 *  2. Install via ADB over USB / Wi-Fi:
 *     node scripts/send-apk-to-phone.js --adb
 * 
 *  3. Serve APK over local Wi-Fi with QR code in terminal:
 *     node scripts/send-apk-to-phone.js --serve
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import http from 'http';
import os from 'os';

const APK_PATH = path.resolve('android/app/build/outputs/apk/debug/app-debug.apk');

function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

async function sendViaTelegram(botToken, chatId, filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Ошибка: Файл APK не найден по пути:\n   ${filePath}`);
    console.log(`💡 Сначала соберите APK командой: npm run build:apk`);
    process.exit(1);
  }

  const fileSize = (fs.statSync(filePath).size / (1024 * 1024)).toFixed(2);
  console.log(`📦 Отправка APK (${fileSize} MB) в Telegram chat: ${chatId}...`);

  const fileData = fs.readFileSync(filePath);
  const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);

  const caption = `🚀 PSL Face Analyzer — Тестовый APK\n\n📦 Размер: ${fileSize} MB\n📅 Время: ${new Date().toLocaleString()}\n\n👉 Откройте файл в Telegram на телефоне для установки!`;

  const payloadHeader = Buffer.from(
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="chat_id"\r\n\r\n` +
    `${chatId}\r\n` +
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="caption"\r\n\r\n` +
    `${caption}\r\n` +
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="document"; filename="PSL_Analyzer_Debug.apk"\r\n` +
    `Content-Type: application/vnd.android.package-archive\r\n\r\n`
  );

  const payloadFooter = Buffer.from(`\r\n--${boundary}--\r\n`);
  const body = Buffer.concat([payloadHeader, fileData, payloadFooter]);

  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendDocument`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length.toString(),
      },
      body: body,
    });

    const result = await res.json();
    if (result.ok) {
      console.log('✅ Успешно! APK отправлен на ваш телефон в Telegram.');
    } else {
      console.error('❌ Ошибка Telegram API:', result.description);
    }
  } catch (err) {
    console.error('❌ Ошибка сети при отправке в Telegram:', err.message);
  }
}

function installViaAdb(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Ошибка: Файл APK не найден:\n   ${filePath}`);
    console.log(`💡 Сначала соберите APK: npm run build:apk`);
    process.exit(1);
  }

  try {
    console.log('📱 Проверка подключенных Android-устройств (ADB)...');
    const devices = execSync('adb devices').toString();
    console.log(devices.trim());

    if (!devices.includes('\tdevice')) {
      console.log('⚠️ Нет подключенных устройств. Подключите телефон по USB с включенной "Отладкой по USB" (USB Debugging) или выполните "adb connect <IP-телефона>:5555"');
      return;
    }

    console.log('🚀 Установка APK на телефон...');
    execSync(`adb install -r "${filePath}"`, { stdio: 'inherit' });
    console.log('✅ Приложение успешно установлено на телефон!');
  } catch (err) {
    console.error('❌ Ошибка ADB:', err.message);
  }
}

function serveApkLocally(filePath) {
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️ Внимание: Файл APK еще не собран по пути ${filePath}`);
    console.warn(`💡 Сервер запущен, но сначала запустите 'npm run build:apk' для появления файла.`);
  }

  const PORT = 3030;
  const ip = getLocalIp();
  const downloadUrl = `http://${ip}:${PORT}/PSL_Analyzer_Debug.apk`;

  const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.url === '/PSL_Analyzer_Debug.apk' || req.url === '/download') {
      if (!fs.existsSync(filePath)) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('APK еще не собран. Запустите: npm run build:apk');
        return;
      }
      res.writeHead(200, {
        'Content-Type': 'application/vnd.android.package-archive',
        'Content-Disposition': 'attachment; filename="PSL_Analyzer_Debug.apk"',
        'Content-Length': fs.statSync(filePath).size,
      });
      fs.createReadStream(filePath).pipe(res);
    } else {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Скачать PSL Analyzer APK</title>
          <style>
            body { font-family: system-ui, sans-serif; background: #0B0F1A; color: #E6EDF7; text-align: center; padding: 40px 20px; }
            .card { background: #131B2E; max-width: 400px; margin: 0 auto; padding: 24px; border-radius: 20px; border: 1px solid #202C45; }
            .btn { display: inline-block; background: #2563EB; color: white; padding: 14px 28px; border-radius: 12px; font-weight: bold; text-decoration: none; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>📱 PSL Face Analyzer</h2>
            <p>Тестовая сборка Android APK</p>
            <a class="btn" href="/PSL_Analyzer_Debug.apk">⬇️ Скачать APK</a>
          </div>
        </body>
        </html>
      `);
    }
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n======================================================`);
    console.log(`🌐 Сервер раздачи APK запущен на порту ${PORT}`);
    console.log(`📲 Ссылка для скачивания с телефона:`);
    console.log(`   ${downloadUrl}`);
    console.log(`======================================================\n`);
  });
}

// Parse command line arguments
const args = process.argv.slice(2);
const botTokenArg = args.find((_, i) => args[i - 1] === '--bot-token') || process.env.TELEGRAM_BOT_TOKEN;
const chatIdArg = args.find((_, i) => args[i - 1] === '--chat-id') || process.env.TELEGRAM_CHAT_ID;

if (args.includes('--adb')) {
  installViaAdb(APK_PATH);
} else if (args.includes('--serve')) {
  serveApkLocally(APK_PATH);
} else if (args.includes('--telegram') || (botTokenArg && chatIdArg)) {
  if (!botTokenArg || !chatIdArg) {
    console.error('❌ Для отправки в Telegram укажите: --bot-token <TOKEN> --chat-id <ID>');
    process.exit(1);
  }
  sendViaTelegram(botTokenArg, chatIdArg, APK_PATH);
} else {
  console.log(`
📱 PSL Face Analyzer — Утилита отправки APK на телефон

Использование:
  1. Отправить в Telegram:
     npm run send:apk -- --telegram --bot-token "12345:ABC..." --chat-id "12345678"

  2. Установить через ADB по кабелю или Wi-Fi:
     npm run send:apk -- --adb

  3. Локальный сервер с QR-кодом для телефона:
     npm run serve:apk
`);
}

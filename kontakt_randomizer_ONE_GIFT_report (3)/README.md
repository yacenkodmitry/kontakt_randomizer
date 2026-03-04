# TARO 8 МАРТА · Kontakt InterSearch (MVP)

Это готовое мини-приложение (одна страница) с рандомайзером «таро-карт».

## Что умеет
- Вытягивать карты бесконечно
- 60 поздравительных карт
- Подарочные карты (с услугами) выпадают редко (по умолчанию 12%)
- Подарок можно получить только один раз (в базовом режиме ограничение держится на localStorage)
- После получения подарка выпадают только поздравительные карты

## Как запустить локально
1) Откройте папку и дважды кликните `index.html`
   - или запустите простой сервер (если браузер блокирует fetch/clipboard):

### Вариант A: Python
```bash
python -m http.server 8000
```
Откройте http://localhost:8000

### Вариант B: Node
```bash
npx serve .
```

## Как задеплоить бесплатно
- Netlify (Drag & Drop) или Vercel (Static)
- GitHub Pages

## Как сделать «навсегда» по-настоящему (по email)
Вариант без разработчика: Google Sheets + Google Apps Script.

### 1) Создайте Google Sheet
Листы:
- `Leads` с колонками: timestamp, name, email, phone, company, title, gift_id, gift_name, user_agent
- `Gifts` с колонками: gift_id, gift_name, limit, issued

Заполните лист `Gifts` текущими подарками, например:
G1 | Бесплатная карьерная консультация | 15 | 0
G2 | Бесплатная оценка резюме | 20 | 0
G3 | Получить исследование ТОП-команд | 15 | 0
G4 | Консультация с коучем | 10 | 0

### 2) Apps Script
Откройте: Extensions → Apps Script и вставьте код из файла `apps_script.gs` (создайте файл вручную).

### 3) Deploy
Deploy → New deployment → Web app
- Execute as: Me
- Who has access: Anyone

Скопируйте URL и вставьте в `app.js` в переменную `BACKEND_CLAIM_URL`.

### Логика
- Если email уже есть в Leads, сервер вернёт ошибку и второй подарок не выдаст.
- Сервер также проверяет лимиты по gift_id и увеличивает issued.

Готово.

# נוכחות צוות הגן — React

React + Vite, מיועד ל-GitHub Pages.

## התקנה
`npm install`

## פיתוח
`npm run dev`

## Build
`npm run build`

## פריסה
הפרויקט כולל GitHub Actions ב-`.github/workflows/deploy.yml`.

החיבור ל-Google Apps Script מרוכז ב-`src/api.js`. אין Cloudflare Worker או שרת נוסף. JSONP משמש רק כדרך תקשורת של הדפדפן מול Apps Script בגלל CORS.

`backend/Code.gs` מיועד להדבקה בפרויקט Apps Script שמחובר לאותו Google Sheet. הקוד אינו מוחק היסטוריה או נתונים קיימים.

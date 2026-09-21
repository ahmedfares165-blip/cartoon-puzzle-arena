# ساحة الألغاز 🧩

لعبة غرف جماعية عربية: يدخل اللاعبون الرمز نفسه، فتظهر لهم الصورة الكرتونية نفسها (18 صورة ممكنة) ويحل كل لاعب اللغز بلا مؤقّت إجباري. أول من يكملها يظهر فائزاً للجميع.

## التشغيل محلياً

```powershell
npm install
npm start
```

افتح `http://localhost:3000` على الهاتف والكمبيوتر. جرّب نافذتين/جهازين: أنشئ غرفة في الأولى وأدخل الرمز في الثانية.

## النشر على Render

1. أنشئ مستودع GitHub جديداً وارفع هذا المجلد إليه.
2. في Render اختر **New → Blueprint** واربط المستودع؛ سيقرأ `render.yaml` تلقائياً.
3. بعد النشر، افتح رابط Render في الهاتف أو أدخله عند إعداد نسخة Android.

## إخراج APK

> يلزم Android Studio وAndroid SDK مثبتين.

```powershell
npm install
npx cap add android
npm run android:apk
```

ستجد النسخة التجريبية في `android/app/build/outputs/apk/debug/app-debug.apk`.

قبل إصدار APK النهائي، عدّل `public/app.js` بحيث يستبدل `io()` بعنوان خادم Render إن كان التطبيق سيعمل خارج نطاق الخادم، مثلاً: `io('https://اسم-خدمتك.onrender.com')`.

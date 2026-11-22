# ניהול תקציב משותף – הנחיות לפרויקט

אפליקציית PWA בעברית (RTL) לניהול הוצאות משותפות של אלירן ודרור: רישום הוצאות, מנויים קבועים, דוחות, מאזן חובות וקיזוז חודשי.
ענה תמיד בעברית. הסבר כל שינוי בקצרה לפני שאתה מבצע אותו. בהקמות והגדרות – צעד אחד בכל פעם, ולעצור כשאני אומר "עצור".

## ארכיטקטורה
- **אתר:** GitHub Pages – https://eliranshmilo-arch.github.io/family-budget/ (repo: `eliranshmilo-arch/family-budget`, מתעדכן אחרי `git push` ל-main)
- **Firebase project:** `home-budget-app-4d311`
  - Authentication – מייל וסיסמה
  - Realtime Database – europe-west1
  - Cloud Messaging – Push
- **פוש חודשי:** GitHub Actions (`.github/workflows/monthly-push.yml`) מריץ את `scripts/monthly-push.js` ב-1 לכל חודש ב-06:00 UTC. דורש secret בשם `FIREBASE_SERVICE_ACCOUNT` ב-GitHub. אפשר להריץ ידנית מלשונית Actions.

## קבצים
| קובץ | תפקיד |
|---|---|
| `index.html` | כל המסכים, ה-CSS וה-JS בקובץ אחד. Firebase compat SDK 10.13.0 מ-CDN |
| `firebase-messaging-sw.js` | קבלת Push ברקע |
| `manifest.json`, `icon.png` | התקנה למסך הבית |
| `scripts/monthly-push.js` | סיכום חובות פתוחים ושליחת פוש חודשי |

## מבנה הנתונים (תחת `budget/`)
- `budget/expenses/{id}` – amount, payer (`eliran`/`dror`), monthKey (`YYYY-MM`), ועוד
- `budget/subscriptions/{id}` – הוצאות קבועות
- `budget/settlements/{monthKey}` – חודשים שקוזזו/נסגרו
- `budget/pushTokens/{token}` – מכשירים לפוש

## לוגיקה חשובה
- חישוב המאזן (`getGlobalOpenBalance` ב-index.html) **חייב להישאר זהה** ל-`computeOpenBalance` ב-`scripts/monthly-push.js`. שינוי באחד מחייב שינוי בשני.
- חודש שמופיע ב-`settlements` לא נכנס למאזן הפתוח; חודשים עתידיים לא נספרים.
- סכומים בש"ח, תצוגה עם `toLocaleString('he-IL')`.

## איך מעלים שינויים
```
git add .
git commit -m "<תיאור>"
git push origin main
```
אחרי עדכון: לסגור את האפליקציה בטלפון ולפתוח מחדש כדי שתיטען הגרסה החדשה.

## כללים
- לא להכניס לקוד את קובץ ה-Service Account ולא סודות אחרים – רק דרך GitHub Secrets.
- לא למחוק נתונים ב-Realtime Database בלי אישור מפורש.
- לא לשדרג את גרסת Firebase SDK בלי לשאול קודם.
- טקסטים בממשק בעברית, בסגנון הקיים (אמוג'י בכותרות).

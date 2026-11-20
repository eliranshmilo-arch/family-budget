// שליחת פוש חודשי עם סיכום החובות הפתוחים.
// רץ מתוך GitHub Actions (ראה .github/workflows/monthly-push.yml).
// דורש secret בשם FIREBASE_SERVICE_ACCOUNT שמכיל את קובץ ה-JSON של Service Account מ-Firebase.

const admin = require('firebase-admin');

const DATABASE_URL = 'https://home-budget-app-4d311-default-rtdb.europe-west1.firebasedatabase.app';
const APP_URL = process.env.APP_URL || 'https://eliranshmilo-arch.github.io/family-budget/';

function israelMonthKey() {
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jerusalem', year: 'numeric', month: '2-digit' }).formatToParts(new Date());
    const y = parts.find(p => p.type === 'year').value;
    const m = parts.find(p => p.type === 'month').value;
    return `${y}-${m}`;
}

const fmt = (n) => '₪' + (Math.round(n * 100) / 100).toLocaleString('he-IL', { maximumFractionDigits: 2 });

// אותה לוגיקה כמו getGlobalOpenBalance באפליקציה
function computeOpenBalance(expenses, settlements, currentMonthKey) {
    let eliranPaid = 0, drorPaid = 0;
    const openMonths = new Set();
    for (const id in expenses) {
        const exp = expenses[id];
        if (!exp || settlements[exp.monthKey] || exp.monthKey > currentMonthKey) continue;
        const amount = Number(exp.amount) || 0;
        if (exp.payer === 'eliran') eliranPaid += amount;
        if (exp.payer === 'dror') drorPaid += amount;
        openMonths.add(exp.monthKey);
    }
    return { eliranPaid, drorPaid, total: eliranPaid + drorPaid, openMonths: [...openMonths].sort() };
}

function buildMessage(bal) {
    const title = '💰 סיכום חובות פתוחים - תחילת חודש';
    const diff = bal.eliranPaid - bal.drorPaid;
    let who;
    if (Math.abs(diff) < 0.01) who = 'אתם מאוזנים לגמרי ✅ אין צורך בהעברה.';
    else if (diff > 0) who = `דרור צריך/ה להעביר לאלירן ${fmt(diff / 2)}`;
    else who = `אלירן צריך להעביר לדרור ${fmt(-diff / 2)}`;

    const months = bal.openMonths.map(m => m.split('-').reverse().join('/')).join(', ');
    const body = bal.total > 0
        ? `${who}\nסה"כ הוצאות בחודשים פתוחים: ${fmt(bal.total)}${months ? ` (${months})` : ''}`
        : 'אין חובות פתוחים ✅';
    return { title, body };
}

async function main() {
    if (!process.env.FIREBASE_SERVICE_ACCOUNT) throw new Error('Missing FIREBASE_SERVICE_ACCOUNT secret');
    admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)),
        databaseURL: DATABASE_URL
    });

    const snap = await admin.database().ref('budget').once('value');
    const data = snap.val() || {};
    const bal = computeOpenBalance(data.expenses || {}, data.settlements || {}, israelMonthKey());
    const { title, body } = buildMessage(bal);
    console.log(title + '\n' + body);

    const tokenEntries = Object.entries(data.pushTokens || {}).filter(([, v]) => v && v.token);
    if (tokenEntries.length === 0) { console.log('No registered devices - nothing to send.'); return; }

    const res = await admin.messaging().sendEachForMulticast({
        tokens: tokenEntries.map(([, v]) => v.token),
        notification: { title, body },
        webpush: {
            notification: { title, body, icon: APP_URL + 'icon.png', dir: 'rtl', lang: 'he' },
            fcmOptions: { link: APP_URL }
        }
    });
    console.log(`Sent: ${res.successCount} ok, ${res.failureCount} failed`);

    // ניקוי טוקנים שכבר לא בתוקף
    const removals = [];
    res.responses.forEach((r, i) => {
        if (!r.success) {
            const code = r.error && r.error.code;
            console.log(`Failed for ${tokenEntries[i][0]}: ${code}`);
            if (code === 'messaging/registration-token-not-registered' || code === 'messaging/invalid-registration-token') {
                removals.push(admin.database().ref('budget/pushTokens/' + tokenEntries[i][0]).remove());
            }
        }
    });
    await Promise.all(removals);
}

main().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });

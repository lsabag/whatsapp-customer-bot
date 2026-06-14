// נקודת הכניסה: מאתחל את חיבור הוואטסאפ ומחבר הודעות נכנסות למוח הבוט.
require('dotenv').config();

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { handleMessage } = require('./bot');
const { MODEL } = require('./claude');

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('❌ חסר ANTHROPIC_API_KEY. צור קובץ .env (ראה .env.example) והכנס את המפתח.');
  process.exit(1);
}

const client = new Client({
  // שומר את ה-session כדי שלא תצטרך לסרוק QR בכל הפעלה
  authStrategy: new LocalAuth({ dataPath: './data/wwebjs_auth' }),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  },
});

client.on('qr', (qr) => {
  console.log('\n📱 סרוק את קוד ה-QR בוואטסאפ (הגדרות → מכשירים מקושרים → קישור מכשיר):\n');
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log(`\n✅ הבוט מחובר ופעיל! מודל: ${MODEL}`);
  console.log('   שלח/י הודעה למספר המחובר כדי לבדוק.\n');
});

client.on('auth_failure', (m) => console.error('❌ כשל אימות:', m));
client.on('disconnected', (r) => console.warn('⚠️  נותק:', r));

client.on('message', async (msg) => {
  try {
    if (msg.isStatus) return; // סטטוסים – להתעלם

    const chat = await msg.getChat();
    if (chat.isGroup) return; // לדמו: מתעלמים מקבוצות

    const text = (msg.body || '').trim();
    if (!text) return; // הודעות ריקות / מדיה בלבד

    await chat.sendStateTyping(); // מציג "מקליד..." ללקוח
    const reply = await handleMessage(msg.from, text);
    await msg.reply(reply);
  } catch (err) {
    console.error('שגיאה בטיפול בהודעה:', err);
    try {
      await msg.reply('מצטער, קרתה תקלה זמנית. נסה/י שוב בעוד רגע 🙏');
    } catch {
      /* אם גם השליחה נכשלה – מתעלמים */
    }
  }
});

client.initialize();

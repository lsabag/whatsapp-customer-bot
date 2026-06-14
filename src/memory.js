// זיכרון שיחה מתמשך פר-לקוח.
// כל לקוח (מזוהה לפי מספר הוואטסאפ) מקבל קובץ JSON משלו תחת data/conversations/.
// הזיכרון שורד גם אם תהליך הבוט נופל ועולה מחדש.
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data', 'conversations');

// כמה הודעות אחרונות לשמור בהקשר שנשלח ל-Claude (משתמש + בוט).
// מספר גבוה = זיכרון ארוך יותר אבל יותר טוקנים (עלות) בכל קריאה.
const MAX_MESSAGES = 40;

function safeId(chatId) {
  // ממיר "972501234567@c.us" לשם קובץ בטוח
  return chatId.replace(/[^a-zA-Z0-9._-]/g, '_');
}

function fileFor(chatId) {
  return path.join(DATA_DIR, safeId(chatId) + '.json');
}

function load(chatId) {
  try {
    const data = JSON.parse(fs.readFileSync(fileFor(chatId), 'utf8'));
    return Array.isArray(data.messages) ? data.messages : [];
  } catch {
    return []; // לקוח חדש / קובץ לא קיים
  }
}

function save(chatId, messages) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const trimmed = messages.slice(-MAX_MESSAGES);
  const payload = {
    chatId,
    updatedAt: new Date().toISOString(),
    messages: trimmed,
  };
  fs.writeFileSync(fileFor(chatId), JSON.stringify(payload, null, 2), 'utf8');
  return trimmed;
}

// מוסיף הודעה אחת לזיכרון הלקוח ומחזיר את ההיסטוריה המעודכנת.
function append(chatId, role, content) {
  const messages = load(chatId);
  messages.push({ role, content });
  return save(chatId, messages);
}

module.exports = { load, append, MAX_MESSAGES };

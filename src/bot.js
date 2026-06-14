// המוח של הבוט: מחבר זיכרון + מידע על העסק + Claude.
const { getReply } = require('./claude');
const memory = require('./memory');
const { loadKnowledge } = require('./knowledge');

// המידע על העסק נטען פעם אחת בעליית הבוט.
const knowledge = loadKnowledge();

const SYSTEM_PROMPT = `את/ה נציג/ת שירות לקוחות וירטואלי/ת של החברה "גאדג'ט פלוס" (Gadget Plus), חנות גאדג'טים ואלקטרוניקה אונליין.

הנחיות התנהגות:
- דבר/י עברית, בנימוס, בחום ובקיצור. תשובות קצרות וברורות שמתאימות לצ'אט בוואטסאפ.
- ענה/י אך ורק על סמך המידע על העסק שמופיע למטה. אל תמציא/י מחירים, מדיניות, מוצרים או הבטחות.
- אם המידע לא קיים אצלך, אמר/י זאת בכנות והצע/י להעביר לנציג אנושי או לתת את פרטי יצירת הקשר.
- אל תבטיח/י דברים שאינם במדיניות (החזרים, מועדי משלוח וכו') – הצמד/י למה שכתוב.
- אם הלקוח מבקש לדבר עם אדם, ספק/י את פרטי יצירת הקשר.
- אל תחשוף/י שאת/ה מודל שפה אלא אם נשאלת ישירות; פשוט עזור/י כמו נציג/ת שירות.

המידע על העסק (מקור האמת היחיד שלך):
${knowledge}`;

/**
 * מטפל בהודעה נכנסת מלקוח: טוען זיכרון, שואל את Claude, שומר ומחזיר תשובה.
 * @param {string} chatId - מזהה הצ'אט בוואטסאפ (משמש כמפתח הזיכרון פר-לקוח)
 * @param {string} userText - תוכן ההודעה של הלקוח
 * @returns {Promise<string>}
 */
async function handleMessage(chatId, userText) {
  // מוסיף את הודעת הלקוח לזיכרון ומקבל את ההיסטוריה המלאה (כולל ההודעה החדשה)
  const history = memory.append(chatId, 'user', userText);

  const reply = await getReply({ system: SYSTEM_PROMPT, messages: history });

  // שומר את תשובת הבוט כדי שתהיה חלק מההקשר בהודעה הבאה
  memory.append(chatId, 'assistant', reply);

  return reply;
}

module.exports = { handleMessage };

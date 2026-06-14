// עטיפה דקה סביב ה-SDK של Anthropic.
const Anthropic = require('@anthropic-ai/sdk');

// הלקוח קורא אוטומטית את ANTHROPIC_API_KEY מהסביבה (.env)
const client = new Anthropic();

const MODEL = process.env.MODEL || 'claude-opus-4-8';

/**
 * שולח את היסטוריית השיחה ל-Claude ומחזיר את תשובת הטקסט.
 * @param {Object} params
 * @param {string} params.system - ה-system prompt (כולל המידע על העסק)
 * @param {Array<{role: 'user'|'assistant', content: string}>} params.messages
 * @returns {Promise<string>}
 */
async function getReply({ system, messages }) {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    // cache_control חוסך עלות: ה-system prompt (המידע על העסק) זהה בכל קריאה,
    // אז הוא נשמר ב-cache ולא מחויב במלוא המחיר בכל הודעה.
    system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
    messages,
  });

  const text = response.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('\n')
    .trim();

  return text || 'מצטער, לא הצלחתי לנסח תשובה כרגע. אפשר לנסות שוב?';
}

module.exports = { getReply, MODEL };

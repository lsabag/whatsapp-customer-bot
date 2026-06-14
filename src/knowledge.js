// טוען את כל מסמכי הידע (knowledge/*.md) ומאחד אותם למחרוזת אחת
// שתוזרק ל-system prompt של הבוט. כדי לעדכן את הבוט – פשוט ערוך/הוסף קבצי .md.
const fs = require('fs');
const path = require('path');

const KNOWLEDGE_DIR = path.join(__dirname, '..', 'knowledge');

function loadKnowledge() {
  let files;
  try {
    files = fs
      .readdirSync(KNOWLEDGE_DIR)
      .filter((f) => f.endsWith('.md'))
      .sort();
  } catch {
    console.warn('אזהרה: לא נמצאה תיקיית knowledge/ או שהיא ריקה.');
    return '';
  }

  return files
    .map((f) => {
      const content = fs.readFileSync(path.join(KNOWLEDGE_DIR, f), 'utf8');
      return `\n\n===== ${f} =====\n${content.trim()}`;
    })
    .join('\n');
}

module.exports = { loadKnowledge };

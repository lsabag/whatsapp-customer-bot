#!/usr/bin/env bash
# deck.sh - ניהול מצגות nextli קיימות (רשימה / קריאה / שינוי-שם / מחיקה)
#
#   bash deck.sh list
#   bash deck.sh get    <deck>            # מדפיס את התוכן הנוכחי (גבה לפני שינוי!)
#   bash deck.sh rename <deck> <new-name>
#   bash deck.sh delete <deck>
#
# סיסמה: $NEXTLI_EDIT_PW או ~/.nextli_pw .  בסיס: $NEXTLI_BASE (ברירת מחדל slide.nextli.co.il)
set -euo pipefail

BASE="${NEXTLI_BASE:-https://slide.nextli.co.il}"
CMD="${1:-}"

_pw() {
  local pw="${NEXTLI_EDIT_PW:-}"
  [ -z "$pw" ] && [ -f "$HOME/.nextli_pw" ] && pw="$(tr -d '\r\n' < "$HOME/.nextli_pw")"
  [ -z "$pw" ] && { echo "❌ missing edit password (NEXTLI_EDIT_PW or ~/.nextli_pw)" >&2; exit 1; }
  printf '%s' "$pw"
}

case "$CMD" in
  list)
    curl -s "$BASE/api/decks?cb=$(date +%s)"
    echo
    ;;
  get)
    DECK="${2:?usage: deck.sh get <deck>}"
    curl -s "$BASE/$DECK/api/content?cb=$(date +%s)"
    ;;
  rename)
    DECK="${2:?usage: deck.sh rename <deck> <new-name>}"
    NEW="${3:?usage: deck.sh rename <deck> <new-name>}"
    code="$(curl -s -o /dev/null -w '%{http_code}' -X POST "$BASE/$DECK/api/rename" \
      -H "x-edit-password: $(_pw)" -H "x-new-name: $NEW")"
    [ "$code" = "200" ] && echo "✅ renamed: $BASE/$NEW" || { echo "❌ rename failed (HTTP $code)" >&2; exit 1; }
    ;;
  delete)
    DECK="${2:?usage: deck.sh delete <deck>}"
    echo "⚠️  backing up '$DECK' to $DECK.bak.html before delete..."
    curl -s "$BASE/$DECK/api/content?cb=$(date +%s)" > "$DECK.bak.html" || true
    code="$(curl -s -o /dev/null -w '%{http_code}' -X DELETE "$BASE/$DECK/api/content" \
      -H "x-edit-password: $(_pw)")"
    [ "$code" = "200" ] && echo "✅ deleted '$DECK' (backup: $DECK.bak.html)" || { echo "❌ delete failed (HTTP $code)" >&2; exit 1; }
    ;;
  *)
    echo "usage: deck.sh {list | get <deck> | rename <deck> <new> | delete <deck>}" >&2
    exit 1
    ;;
esac

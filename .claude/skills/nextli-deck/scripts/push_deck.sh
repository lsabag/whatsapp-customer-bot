#!/usr/bin/env bash
# push_deck.sh - דוחף תוכן מצגת ל-slide.nextli.co.il (Cloudflare KV)
#
# שימוש:
#   bash push_deck.sh <deck-name> <content.html> [dark|light]
#
# הסיסמה נקראת מ-$NEXTLI_EDIT_PW או מהקובץ ~/.nextli_pw (לא צרובה בקובץ הזה).
# בסיס כתובת ניתן לעקוף עם $NEXTLI_BASE (ברירת מחדל: https://slide.nextli.co.il).
set -euo pipefail

DECK="${1:?usage: push_deck.sh <deck-name> <content.html> [dark|light]}"
FILE="${2:?usage: push_deck.sh <deck-name> <content.html> [dark|light]}"
TMPL="${3:-dark}"
BASE="${NEXTLI_BASE:-https://slide.nextli.co.il}"

[ -f "$FILE" ] || { echo "❌ content file not found: $FILE" >&2; exit 1; }
case "$TMPL" in dark|light) ;; *) echo "❌ template must be 'dark' or 'light'" >&2; exit 1;; esac

PW="${NEXTLI_EDIT_PW:-}"
[ -z "$PW" ] && [ -f "$HOME/.nextli_pw" ] && PW="$(tr -d '\r\n' < "$HOME/.nextli_pw")"
[ -z "$PW" ] && { echo "❌ missing edit password: set NEXTLI_EDIT_PW or write it to ~/.nextli_pw" >&2; exit 1; }

# guard: refuse the long em-dash in content (project rule: hyphen only)
if grep -q $'—' "$FILE"; then
  echo "❌ content contains a long em-dash (—). Replace with a regular hyphen (-) before publishing." >&2
  exit 1
fi

code="$(curl -s -o /dev/null -w '%{http_code}' -X POST \
  "$BASE/$DECK/api/content" \
  -H 'content-type: text/plain; charset=utf-8' \
  -H "x-edit-password: $PW" \
  -H "x-template: $TMPL" \
  --data-binary @"$FILE")"

if [ "$code" = "200" ]; then
  echo "✅ published ($TMPL): $BASE/$DECK"
elif [ "$code" = "401" ]; then
  echo "❌ wrong edit password (HTTP 401)" >&2; exit 1
elif [ "$code" = "413" ]; then
  echo "❌ content too large (HTTP 413) - shrink images" >&2; exit 1
else
  echo "❌ publish failed (HTTP $code)" >&2; exit 1
fi

---
name: nextli-deck
description: >
  Author and publish a presentation to the nextli slide system (slide.nextli.co.il) -
  a server-backed (Cloudflare Worker + KV) deck engine with live in-browser editing,
  Hebrew/RTL support, dark/light templates, glossary tooltips, side-drawer navigation,
  swatches, image upload and fullscreen. Use this skill whenever the user asks to
  create/build a new presentation, מצגת, slide deck, or "תבנה לי מצגת" and wants it on
  the nextli system; or to update/rename/delete an existing nextli deck. The skill does
  NOT inject an engine into a file - the engine already lives on the server; the skill
  authors the slide CONTENT and pushes it to KV, then returns the live link.
---

# nextli-deck — author & publish presentations on slide.nextli.co.il

The nextli system is **server-backed**: two editable shells (dark `index.html`,
light `index-light.html`) live on a Cloudflare Worker. Slide **content** is stored
in KV under `deck:<name>`, the template choice under `tmpl:<name>`. A deck is just
the inner HTML of `#mainContainer` (a sequence of `<section class="slide">`).

**Your job in this skill:** given a topic/brief, write that content HTML using the
documented component vocabulary, then POST it to a new (or existing) deck. From then
on the user edits/saves it live in the browser like any other nextli deck.

## Workflow

1. **Clarify** (only if needed): topic, audience, rough number of slides, dark or light.
   Default: dark, ~6-10 slides, Hebrew/RTL.
2. **Author** the content into a single `.html` file (content only - NOT a full HTML
   document; just the `#mainContainer` inner markup). Follow `reference/markup.md`
   for the exact component classes and the hidden config blocks.
3. **Pick a deck name**: short, kebab-case, ASCII (e.g. `roi-workshop`). This becomes
   the URL `slide.nextli.co.il/<name>`.
4. **Publish**:
   ```bash
   bash <skill-dir>/scripts/push_deck.sh <deck-name> path/to/content.html dark
   ```
   The script needs the edit password — set `NEXTLI_EDIT_PW` env var or put it in
   `~/.nextli_pw` (never hardcode it in a file that gets committed).
5. **Report** the live link and tell the user they can now edit it in the browser
   (✏️ button → enter edit code → save to cloud).

## Hard rules (do not break)

1. **Hyphen only.** Never use the long em-dash `—` in content. Always a regular `-`.
2. **Hebrew / RTL.** Content is Hebrew unless the user says otherwise. Don't add a
   `dir` attribute on slides (the shell is already RTL); use `dir="ltr"` only on
   inline English/number runs (phone numbers, code) like the existing decks do.
3. **Content only.** Push the `#mainContainer` inner HTML, never a full
   `<!DOCTYPE html>` document - the shell provides `<head>`, fonts, CSS and the engine.
4. **Per-deck glossary.** If you want tooltips, add a `#deck-glossary` block (see
   markup ref). With NO block the deck would inherit the *default* built-in glossary
   (WhatsApp-bot terms) - usually wrong for other topics, so set your own with
   `"mode":"replace"`.
5. **Don't reference the interactive graph** (`#interactive-graph`) in general decks -
   its data is currently hardcoded in the shell to one specific deck. Skip it.
6. **Back up before destructive ops.** Before overwriting an existing deck, GET its
   current content first (`/<deck>/api/content`) and save a copy.

## Managing existing decks (endpoints already on the Worker)

- List:    `GET  /api/decks`
- Content: `GET  /<deck>/api/content`  ·  `POST` (auth) to save  ·  `DELETE` (auth)
- Rename:  `POST /<deck>/api/rename`  with header `x-new-name: <new>`

Helper wrappers: `scripts/push_deck.sh` (create/update), `scripts/deck.sh` (list / get /
rename / delete).

## Verify after publishing

`curl -s "https://slide.nextli.co.il/<deck>/api/content?cb=$(date +%s)"` should return
your content, and opening `slide.nextli.co.il/<deck>` should render it in the chosen
template with the ✏️ edit button present.

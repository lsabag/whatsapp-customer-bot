# nextli deck — component vocabulary

A deck = the inner HTML of `#mainContainer`: optional hidden config blocks, then a
sequence of `<section class="slide">`. The shell styles these classes in BOTH the
dark and light templates (same class names, different palette), which is why a deck
can switch themes without changing content.

CSS color variables available: `--neon-cyan`, `--neon-emerald`, `--neon-purple`.
Tailwind (CDN) utility classes are available. Font is set by the shell.

---

## 1. Hidden config blocks (place first, before the slides)

All are optional, `hidden`, and persist with the content in KV.

### Navigation labels (`#deck-nav`)
Overrides the auto-generated top-menu / drawer label per slide id. JSON map of
`slide-id → label`:
```html
<div id="deck-nav" hidden data-labels='{"slide-0":"פתיחה","slide-roi":"החזר השקעה"}'></div>
```

### Color swatches (`#deck-swatches`)
The editable color palette offered in edit mode. Comma-separated colors:
```html
<div id="deck-swatches" hidden data-colors="#00f3ff,#00ff9d,#bc13fe,#ffffff,#94a3b8"></div>
```

### Glossary tooltips (`#deck-glossary`)  ← per-deck, IMPORTANT
The shell auto-wraps the **first occurrence per slide** of each `term` and shows `tip`
on hover/tap. Use `"mode":"replace"` so the deck does NOT inherit the default glossary.
```html
<div id="deck-glossary" hidden data-glossary='{"mode":"replace","terms":[
  {"key":"roi","term":"ROI","tip":"Return On Investment - החזר על ההשקעה, כמה הרווחת מול כמה השקעת."},
  {"key":"kpi","term":"KPI","tip":"Key Performance Indicator - מדד מרכזי למדידת הצלחה."}
]}'></div>
```
- `mode`: `"replace"` (only these terms) or `"merge"` (these + the built-in default).
- Tips must use a regular hyphen `-`, never `—`.

---

## 2. Slide skeleton

Every slide is a `.slide` wrapping one `.cyber-panel`. Give each a stable `id`.
```html
<section class="slide" id="slide-roi">
  <div class="cyber-panel">
    <!-- eyebrow -->
    <div class="reveal-content text-[var(--neon-cyan)] font-bold tracking-widest mb-2 text-sm uppercase">קטגוריה // נושא</div>
    <!-- heading: glow-text-cyan or glow-text-emerald -->
    <h2 class="reveal-content delay-1 text-4xl md:text-5xl font-bold mb-6 glow-text-cyan">כותרת השקף</h2>
    <!-- lead paragraph with a side accent border -->
    <p class="reveal-content delay-1 text-lg text-slate-300 mb-8 border-r-4 border-[var(--neon-cyan)] pr-4">
      משפט פתיחה שמסביר את השקף.
    </p>
    <!-- body … -->
  </div>
</section>
```

### Hero / title slide (first)
```html
<section class="slide" id="slide-0">
  <div class="cyber-panel text-center">
    <h1 class="reveal-content delay-1 text-6xl md:text-8xl font-black mb-6 tracking-tight">
      כותרת ראשית <br><span class="glow-text-cyan">שורה מודגשת</span>
    </h1>
    <p class="reveal-content delay-2 text-xl text-slate-400 max-w-3xl mx-auto mb-10 leading-relaxed">תת-כותרת.</p>
    <div class="reveal-content delay-3 text-sm text-slate-500 animate-bounce mt-10">גלול למטה</div>
  </div>
</section>
```

---

## 3. Building blocks

### Entrance animation
Add `reveal-content` to any element; stagger with `delay-1`, `delay-2`, `delay-3`.

### Card / box
```html
<div class="tech-box">
  <h3 class="text-xl font-bold mb-4 text-[var(--neon-cyan)]"><i class="fa-solid fa-bolt ml-2"></i>כותרת כרטיס</h3>
  <p class="text-slate-400 text-sm leading-relaxed">תוכן הכרטיס.</p>
</div>
```
Accent border variants: `tech-box border-[var(--neon-purple)]` / `border-[var(--neon-emerald)]`.

### Grid of cards
```html
<div class="grid md:grid-cols-3 gap-6 reveal-content delay-2">
  <div class="tech-box"> … </div>
  <div class="tech-box"> … </div>
  <div class="tech-box"> … </div>
</div>
```
Use `md:grid-cols-2` for two columns; add `md:col-span-2` on a child to make it span.

### Bullet list (RTL marker)
```html
<ul class="space-y-3 text-slate-300 text-sm leading-relaxed">
  <li><span class="text-[var(--neon-emerald)] mr-2">■</span> <strong>נקודה:</strong> הסבר.</li>
</ul>
```

### Highlight / takeaway box
```html
<div class="reveal-content delay-3 tech-box mt-6 text-center" style="border-color: rgba(0,255,157,0.4);">
  <p class="text-slate-200"><i class="fa-solid fa-lightbulb text-[var(--neon-emerald)] ml-2"></i><strong class="text-[var(--neon-emerald)]">השורה התחתונה:</strong> המסר המרכזי.</p>
</div>
```

### Glow text inline
`<span class="glow-text-cyan">טקסט זוהר</span>` (or `glow-text-emerald`).

### Icons
Font Awesome is loaded: `<i class="fa-solid fa-rocket"></i>`, `<i class="fa-brands fa-whatsapp"></i>`.

### Inline LTR run (English / numbers / phone)
```html
<span dir="ltr" class="text-[var(--neon-cyan)] font-semibold">055-1234567</span>
```

---

## 4. Conventions

- First slide = hero/title. Last slide = CTA / closing / contact.
- Keep one clear idea per slide; prefer 2-3 cards over dense paragraphs.
- Headings alternate `glow-text-cyan` / `glow-text-emerald` for rhythm.
- The shell adds nav, drawer, fullscreen, "back to first", edit mode and theme switch
  automatically - do NOT add navigation/UI chrome to the content.
- Don't add `<style>`/`<script>` to the content; the shell owns presentation logic.

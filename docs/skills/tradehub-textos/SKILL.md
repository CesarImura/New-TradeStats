---
name: tradehub-textos
description: "Use whenever you write or change any text a TradeHub user sees, in code or in Figma: titles, subtitles, buttons, labels, hints, placeholders, empty states, errors, toasts, confirmations, onboarding and tour copy, notifications, sample data shown on screen, and the Portuguese notes on the Figma canvas. Also use to review copy for a generic or AI-made feel."
---

# TradeHub interface copy

Goal: copy that reads like it was written by the TradeHub product team for a trading coach (Admin, Editor) or a student (student site), about this exact screen. Not filler, not marketing, not a chatbot. Built from the UI Skills catalogue (`jakubkrehel/better-writing`, `mrstev3n/balise-ux-writing`, `pbakaus/clarify`, `blader/humanizer`), adapted to TradeHub.

## 1. Before writing
1. Read the whole flow, not the string: the screen, its neighbours in the same Figma section (`docs/maps/screens.md`) and the component that renders it.
2. Check what the product actually does (code, `docs/components.md`, vault decisions). Never promise a feature, limit, timing or guarantee the prototype doesn't have.
3. Reuse the product's words. One noun per object and one verb per action across Admin, Editor and student site: tier (what students pay for; "plan" is only the coach's own subscription in Settings › Plan and invoices), offer (high ticket package; in Partners the term is deal), course / lesson / module, community, livestream, payout, Getting started, Go live, Coming soon. Search `src/` for the term before introducing a synonym.
4. Know who reads it: coaches in the Admin and Editor, students on `/c` and `/site`. Language: English in the product, Portuguese in Figma notes.

## 2. How to write
- Say the one fact the user needs now, then the next action. Cut every word that does no work. A subtitle adds new information or disappears.
- Specific beats general: "Students enter a code at checkout. A wrong code never blocks the purchase." beats "Manage your discounts easily."
- Buttons start with a verb and name the result: Save tier, Send offer link, Open Partners. Never OK, Yes, Submit, Let's go.
- Errors say what failed and how to fix it, next to the field: "That file is over 50 MB. Split it or compress it, then try again." No Oops, no blame, no exclamation marks.
- Empty states say what the place is for and give one next action ("A tier is what students pay to join. Create one to start selling.").
- Success is short and factual ("Changes saved", "Reminder sent"). No "successfully".
- Confirmations name the action and object ("Delete Q3 coupon?") and buttons say verb + object. Prefer undo for reversible actions.
- Toggles describe the ON state. Placeholders show an example, never an instruction.
- Sentence case everywhere. Numbers and dates from the prototype's sample data (today = November 2025, coach Kairo FX); never "TradeStats", never versions ("v2", "beta", "next version"), never "prototype" in product copy.
- Tone follows the stakes: neutral for routine work, calm and explicit for payments, data loss and identity checks, a little warmer only in onboarding success moments.

## 3. Tells to remove (from blader/humanizer, filtered for UI)
Act on one sighting:
- Hype and filler: unlock, seamless, effortless, powerful, supercharge, elevate, journey, all in one place, everything you need, take it to the next level, explore all possibilities.
- Staging: "It's not X, it's Y", "Here's the thing", "Let's…", run-up sentences before the point.
- One-line closers that repeat the point, forced triads ("fast, simple and secure") when the meaning has fewer parts.
- Chatbot residue: "Great!", "Awesome!", "Hope this helps", "Feel free to".
- Dashes as the universal connector in UI strings; use a period, comma or colon.
- Assistant voice for features: "Your AI is learning", "We've got you covered".
Weak alone (act only with other tells): stacked qualifiers, passive voice, a single exclamation in coach-written sample content.

## 4. Figma notes (Portuguese)
- `Note · <screen name>`: 1 to 3 bullets with what this screen is for, its state and the rule that matters (what enables the button, what the student sees). No version history, no "V2:", no praise.

## 5. Check before you finish
- Run `node scripts/maps/copy-scan.mjs` (code) and read every hit in context; for Figma, scan the touched screens' texts for the same patterns.
- Same string in Figma and code? Make them match; the approved meaning wins, not the older text.
- Re-read the full flow after the change: same terms, no repeated sentences, buttons still describe what happens.
- Visual check: text still fits at 390, 768 and 1440 px (`scripts/visual-diff.mjs` shows only the intended change).
- Record content changes that alter wording of messages or names in `docs/maps/CHANGELOG.md` (original → new, where, why).

## 6. What not to do
- Don't rewrite copy only to match your taste; a finding needs a reason from §2 or §3.
- Don't change legal, payment, consent or deletion meaning; flag it to Gustavo.
- Don't translate or "humanize" coach-written sample content into another voice; only remove obvious filler.

## Helper text on sample behaviour (23/11/2026)
- Text that explains a prototype-only behaviour (sample CSV, fake send) says what the screen does, never "Prototype:" ("Any file shows the same sample of 4 students."). The same line goes in Figma and code.
- A validation hint counts what the coach cares about, in plain words: "1 to invite · 1 already a student · 2 not valid".
- `tradehub-anti-ai-look` does not exist as a separate skill: section 3 of this skill (tells to remove) is the anti-AI rule set.

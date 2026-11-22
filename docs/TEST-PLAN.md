# Test plan

Run this before every release. The first column records what was checked in the build on 22 November 2026 (desktop Chromium and a 375 px phone viewport). Repeat it on a real phone and a second browser.

## Automated checks (done in the build)

| Check | Result |
|---|---|
| Every internal link and asset path resolves; no `href="#"` placeholders | Pass |
| `data/*.json` files are valid | Pass |
| Every external source URL returns 200 (Science, Berkeley Lab and Britannica block bots; checked in a browser instead) | Pass |
| No JavaScript console errors on Home, Learn, Heroes, Climate Quest, Join, Thank you | Pass |
| Home page weight under 500 KB (about 124 KB with fonts) | Pass |
| No horizontal scrolling and all tap targets at least 44 px tall at 375 px wide | Pass |

## Flows (done in the build)

| Flow | Result |
|---|---|
| Climate Quest Seedling round: a wrong pair costs 1 energy and shows "Not a pair"; each match shows a fact with its source; the result screen shows matches, accuracy and seeds; the hero dialog opens | Pass |
| Plant two plants, reload the page: the garden, seeds and "Welcome back" message are kept | Pass |
| Timer appears only on Old Growth | Pass (after fixing a CSS bug) |
| Learn: `?q=BLOOM` finds one case study; topic filter; papers tab; empty search shows "Clear filters" | Pass |
| Join: empty submit shows four errors and focuses the first; bad email rejected; `?game=power-shift` prefills; unconnected form refuses to pretend it saved | Pass |
| Join with a test Supabase config (network stubbed): sends the right JSON and headers; 409 shows "already joined"; success goes to the thank-you page | Pass |
| Mobile menu opens, closes with Escape, and closes after choosing a link | Pass |

## Still to do with real people and accounts

- [ ] Connect Supabase (`docs/SIGNUP-SETUP.md`), submit a real test signup, and export it.
- [ ] Confirmation email arrives (needs the email step in `docs/SIGNUP-SETUP.md`).
- [ ] Play a full round on a real phone (iOS Safari and Android Chrome).
- [ ] Keyboard-only pass: Tab through every page and play a round without a mouse.
- [ ] Screen-reader pass (NVDA or VoiceOver) on Climate Quest and the Join form.
- [ ] Turn on browser storage blocking: the game shows its warning and still plays.
- [ ] Slow connection (DevTools "Slow 3G"): loading messages appear, and nothing breaks.
- [ ] Lighthouse on the live URL: above 90 in every category.
- [x] Old links redirect on the live site (for example `/case%20studies.html` → `/learn.html#case-studies`).
- [ ] Hand the site to 3 to 5 students and one teacher (questions in `docs/PLAN.md`) and note where they get stuck.

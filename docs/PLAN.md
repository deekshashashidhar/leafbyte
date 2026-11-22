# LeafByte build plan: decisions

This file records steps 1 to 4b of the build plan ("LeafByte Website: Full Build Plan", 22 Nov 2026) as they apply to this repository. Change it when a decision changes.

## 1. Problem and user

**Problem statement:** LeafByte helps students and early-career developers understand how AI and digital technology affect the climate, so that they make greener choices in what they build and use.

**One-line pitch:** Learn it, play it, build it: the fun way into green computing.

**Who it is for (assumed until interviews confirm it):**

| Audience | What they want |
|---|---|
| Students and early-career developers (primary) | Practical skills and portfolio material |
| Educators and student clubs | Ready-to-use lessons and a game for class |
| Curious visitors | A quick, credible answer to "how bad is tech for the climate?" |
| Hackathon judges and sponsors | A clear problem, a working demo and measurable impact |

### Still to do: talk to 3 to 5 potential users

Ask students from your campus and one teacher, about 10 minutes each, and write down their exact words:

1. How much do you know about the energy and water that AI and data centres use?
2. Where do you currently learn about climate and technology?
3. Would you play a five-minute game to learn this? What would make you stop?
4. What would make you come back to the site a second time?
5. Would you sign up, and for what (updates, volunteering, a contest)?

Any answer that surprises you is a reason to change the MVP below. Record the notes in `docs/interviews.md`.

## 2. MVP scope

The five MVP features. Each already existed in some form, so the work is finishing, not inventing.

| # | Feature | Done when | Status |
|---|---|---|---|
| 1 | Climate Quest, one polished level | A first-time player finishes a round on a phone, sees a sourced fact for every match, and returns to the same garden the next day | Built |
| 2 | Knowledge Grove (Learn hub) with sourced content | Every case study and paper has a working source link and one consistent layout | Built |
| 3 | Meet Our Heroes | Six sourced cards with licensed images, linked from the main navigation | Built |
| 4 | Green Code Movement signup | A test signup is stored and a confirmation email arrives | Form built; needs Supabase project (see `docs/SIGNUP-SETUP.md`) |
| 5 | Clean shared site shell | One header and footer, no dead links, works on a phone | Built |

**Later list** (in rough order): Daily Challenge with streaks, pledge wall, carbon calculator, learning paths with badges, glossary hovers, Power Shift and the other four games, community Hope Garden counter, teacher toolkit and class codes, campus ambassadors, Stories & Sparks, Voices of Tomorrow, Arabic version, site carbon badge, newsletter, accounts and leaderboards, embeddable widget, the full "Future of Green AI" whitepaper.

## 3. Flow and design

Main path: Home → PlayByte hub → Climate Quest → Result → Join → Thank you. Learn hub and Meet Our Heroes branch off it, and the header reaches every page.

| Screen | File | Main button | Goes to |
|---|---|---|---|
| Home | `index.html` | Play now | PlayByte hub |
| PlayByte hub | `playbyte.html` | Play | Climate Quest |
| Climate Quest and Result | `climate-quest.html` | Match cards | Result panel, then Learn hub or Join |
| Learn hub | `learn.html` | Read the source | A case study or paper |
| Meet Our Heroes | `heroes.html` | Related lesson | Learn hub |
| Join form | `join.html` | Join the movement | Thank-you page |
| Thank you | `thank-you.html` | Play again | PlayByte hub |

Supporting pages: `about.html`, `sources.html`, `privacy.html`, `terms.html`, `404.html`.

**Style:** the original LeafByte look from the CodeSandbox site, defined once as CSS variables in `assets/css/site.css`. (The plan proposed a deep-green light theme; the team chose to keep the original design.)

| Role | Value |
|---|---|
| Primary teal | `#00C896` (text links use the darker `#007F65` for readability) |
| Secondary purple | `#5E35B1` |
| Brand gradient | teal to purple, 135 degrees, on buttons, the stats band and page headers |
| Dark (text, footer, overlays) | `#1A2B3C` |
| Light background | `#F8F9FA` |
| Accent | `#FF6B6B` |
| Font | Segoe UI system font stack |
| Shapes | pill buttons, 15 px card corners with soft shadows that lift on hover |
| Layout | fixed header that turns white on scroll; full-width photo hero and Join sections; gradient band at the top of each inner page |
| Icons | Font Awesome 6.4 |

## 4. Tech stack

- **Front end:** plain HTML, CSS and JavaScript, with no build step. The shared header and footer are rendered by `assets/js/site.js`.
- **Game:** vanilla JavaScript (`assets/js/climate-quest.js`), with content in `data/cards.json`.
- **Signup storage:** Supabase (Postgres plus REST), with the table in `supabase/schema.sql`.
- **Hosting:** Vercel, deploying from the GitHub repository on every push.
- **Analytics:** later. Use a cookie-less option such as Vercel Web Analytics or Plausible.

Move to Astro or another component framework only when sharing markup across pages becomes painful.

## 4b. Data design

| Thing | Key fields | Where it lives |
|---|---|---|
| Member (signup) | id, name, email, role, country, interest, volunteer_role, contribution, consent, confirmed, created_at | Supabase `members` table |
| Game save | seeds, plants, level, heroes unlocked, facts seen, best score, last played, settings | Browser `localStorage` (`leafbyte.save.v1`) |
| Card | id, problem, solution, fact, source, topic, difficulty | `data/cards.json` |
| Hero | id, name, field, known for, facts with sources, image and licence, related lesson, related card | `data/heroes.json` |
| Resource (case study, paper) | id, type, title, region, what, how, impact, limitation, source, date, last checked, topics | `data/resources.json` |
| Pledge, vote, story (later) | member id, content, status, created_at | Supabase tables, later |

Cards, resources and heroes share topic tags (`energy`, `data-centres`, `hardware`, `ai`, `nature`, `oceans`, `climate`, `policy`), so a lesson can link to the game and the reverse.

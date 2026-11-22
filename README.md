# LeafByte

**Learn it, play it, build it: the fun way into green computing.**

LeafByte helps students and early-career developers understand how AI and digital technology affect the climate, so they make greener choices in what they build and use. Built for students, by students (Team Ecode).

## What's in it

| Feature | Page | Content file |
|---|---|---|
| Climate Quest: match problems to solutions, one sourced fact per match, three levels, energy and seeds, a Hope Garden saved in the browser, and a result screen | `climate-quest.html` | `data/cards.json` |
| PlayByte hub with five planned games and "Notify me" links | `playbyte.html` | |
| Knowledge Grove: sourced case studies and papers, search and topic filters, green tech basics | `learn.html` | `data/resources.json` |
| Meet Our Heroes: six sourced profiles with licensed photos | `heroes.html` | `data/heroes.json` |
| Green Code Movement signup (connects to Supabase) | `join.html`, `thank-you.html` | `supabase/schema.sql` |
| About and team, sources and methods, privacy, terms, 404 | `about.html` and others | |

The shared header and footer live in `assets/js/site.js`, and the colours and fonts in `assets/css/site.css`.

## Run it locally

Any static file server works. With Python:

```bash
python -m http.server 8000
```

Then open http://localhost:8000. (Opening the HTML files directly does not work, because the pages load JSON files.)

## Adding content

- **A new game card:** add an entry to `data/cards.json` with a problem, solution, fact, source URL, topic and difficulty (1 to 3).
- **A case study or paper:** add an entry to `data/resources.json`, following the template of the existing entries, including a limitation and a `lastChecked` date.
- **A hero:** add an entry to `data/heroes.json` with sourced facts and a Wikimedia Commons image plus its licence and author.

Every fact needs a working source link. See `sources.html` for the rules.

## Deploying

The site deploys to Vercel from the `main` branch. `vercel.json` redirects the old CodeSandbox file names (with spaces) to the new pages.

CSS and JavaScript files are linked with a version tag (for example `site.css?v=2`). When you make a big change to a stylesheet or script, raise the number in every HTML file so returning visitors get the new version straight away.

## Docs

- `docs/PLAN.md`: problem statement, MVP, flow, style, stack and data design
- `docs/SIGNUP-SETUP.md`: connecting the Join form to Supabase
- `docs/TEST-PLAN.md`: the manual test checklist

Originally built on CodeSandbox: https://codesandbox.io/p/sandbox/leafbyte-zphgjj

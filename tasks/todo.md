# Black Belt redesign — vgorla99.github.io

Branch: `feature/black-belt-redesign`

## Concept
"Black Belt Builds": BJJ black belt discipline → production software.
Belt black + gi white, one accent (IBJJF belt-bar red). The nav is the belt: 4 tape stripes fill as you scroll.

## Tasks
- [x] Shared `assets/site.css` + `assets/site.js` (nav, belt stripes, DE/EN toggle, form, quiz)
- [x] Screenshots of live work → `assets/work/*.webp` (desktop + mobile)
- [x] `index.html`: hero, path 2022–2026, products (OktaHub, Original Fighting, PetApp, DianaOS), partner marquee, contact
- [x] `services.html`: hero, live proof (5 sites), 3 ways to work, architecture/security/integrations, quiz with replies, process, FAQ, WhatsApp + call CTAs. No prices. DE + EN.
- [x] Small fixes: photo path (was photo.jpg, file is photo.png → now assets/vitor.webp), duplicate Clerk chip (marquee replaced), DE phone placeholder, timeline to 2026, dead pet links
- [x] Verify: 320/360/390/768/1024/1440, DE/EN, quiz flow, stripes, no console errors, no horizontal overflow
- [x] Commit

## Open (needs Vitor)
- `WHATSAPP_NUMBER` and `BOOKING_URL` in `assets/site.js`: until set, those buttons go to the contact form on index.html
- Push branch + merge to main to publish on GitHub Pages
- Update the Original Fighting row to "Live" + link once originalfighting.de launches

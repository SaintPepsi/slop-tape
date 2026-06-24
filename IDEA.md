# slop-investigators — the idea

> `slop-tape` (this repo) is the rendering engine: physics crime-scene tape you can
> sling across a page and cut through. **slop-investigators** is the product idea that
> engine exists for. This doc captures it so it doesn't evaporate.

## The pitch

A browser extension that lets people slap **"AI SLOP"** crime-scene tape across any
website or piece of content — as a public, community vote that the thing is AI slop.
Open a page enough people have taped, and you see it cordoned off: ribbons stacked on,
"AI SLOP POLICE — INVESTIGATION IN PROGRESS — DO NOT ENTER". You can cut through to read
it anyway. The tape is the verdict of the crowd, not one cranky person.

## The mechanic that makes it interesting

Not a points game. A **calculated aggregate of judgement.**

- **1 ribbon per person, per page** by default. Your one vote.
- You earn the right to place **more ribbons on a page** as your **street cred** rises.
- **Street cred = how many pages you taped that other people independently taped too.**
  When the crowd corroborates your slop-calls, your judgement is worth more. When you tape
  things nobody else thinks are slop, it isn't.

So influence is *earned by being right with the room*, not by grinding. A good
investigator's tape carries more weight because their track record says it should.

## Why slop-tape is the engine

The extension renders every page's verdict as a cordon of ribbons. That's exactly what
`slop-tape` already does — seeded layout, continuous physics ribbons, drag-to-cut,
per-page persistence. The extension swaps the seed for the page URL and the ribbon count
for the crowd's aggregated vote, and reuses the rest.

## Open questions (the hard parts, unsolved)

These are flagged, not answered — the mechanic is the easy half.

- **Backend + identity.** Cross-user aggregation per URL can't be client-only. There's a
  server, a per-URL tally, and some notion of "who." This is the real build.
- **Sybil resistance.** One person spinning up accounts can fake consensus. Identity needs
  a cost or the street-cred number is meaningless.
- **Subjectivity & brigading.** "AI slop" is an opinion. How do we avoid mobbing legit
  content? Precedents worth studying: Community Notes, Stack Overflow rep, Slashdot
  meta-moderation, Reddit downvotes — they all wrestled with this.
- **Reputation feedback loop.** High-cred users place more ribbons → more influence →
  entrenchment. Does the aggregate need a decay or a cap?
- **Privacy.** The set of URLs a person flags is sensitive. What gets stored, and where?

## Status

Idea only. `slop-tape` proceeds as the foundation; slop-investigators gets scoped as its
own thing when we're ready to design the backend and the trust model.

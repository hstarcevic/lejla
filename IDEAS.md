# Feature Ideas & Quality of Life Improvements

Based on similar couple apps (Between, Coupled, Paired, Lovedays) and gaps in the current implementation.

---

## New Features

### Countdown & Anniversaries
- Countdown timer to upcoming dates (next anniversary, birthday, trip)
- "Days together" counter on the home screen
- Auto-generated anniversary reminders (monthly/yearly milestones)

### Shared Bucket List
- Add items you want to do together (travel, experiences, goals)
- Mark as completed with a date and optional photo
- Sort by priority or category

### Daily Question / Prompt
- A new question each day to answer together ("What's your favorite memory of us?", "Where should we travel next?")
- See each other's answers after both have responded
- Archive of past Q&As

### Mood / Emoji Check-in
- Quick daily mood check-in (how are you feeling today?)
- See each other's mood history on a calendar heatmap
- Optional short note with each check-in

### Photo Album / Gallery
- Dedicated gallery page separate from timeline
- Organize photos into albums (trips, dates, everyday)
- Slideshow mode

### Shared Playlist
- Link songs that remind you of each other
- Spotify/Apple Music embed or just title + artist + link
- "Our song of the week" feature

### Wish List / Gift Ideas
- Private list of gift ideas for the other person
- Only visible to the person who wrote it (surprise-safe)
- Mark as purchased/gifted

### Location Memories
- Tag timeline entries with a location
- Map view showing all your shared places
- "We've been to X places together" stat

---

## Quality of Life Improvements

### ~~Error Feedback for the User~~ ✅
- ~~Currently saves fail silently (optimistic update reverts without explanation)~~
- ~~Show a toast/snackbar: "Nije uspjelo sačuvati, pokušaj ponovo" with a retry button~~
- Distinguish between network errors and server errors

### Offline Support
- Service worker for basic offline access
- Queue writes when offline, sync when back online
- Show offline indicator in the header

### Photo Improvements
- Show compression/upload progress indicator
- Allow cropping/rotating before upload
- Support multiple photos per timeline entry
- Tap photo to view fullscreen with pinch-to-zoom

### Password / Auth
- "Stay logged in" toggle (persistent session)
- Password reset flow (currently no recovery if forgotten)
- Optional biometric unlock on supported devices (WebAuthn)

### Timeline UX
- Swipe to delete (mobile gesture)
- Search/filter entries by title or date range
- Group entries by month/year with section headers
- ~~Infinite scroll or pagination for large timelines~~ ✅

### Letters UX
- Envelope opening animation when reading for the first time
- Schedule a letter to "arrive" on a future date
- Rich text or at least basic formatting (bold, italic)

### Garden UX
- Watering animation / daily interaction to keep flowers alive
- Growth stages (seed → sprout → bloom) over time instead of instant
- Garden stats: total flowers planted, most common type
- Seasonal themes (snow in winter, leaves in fall)

### General Polish
- Dark mode
- ~~Pull-to-refresh on mobile~~ ✅
- Haptic feedback on interactions (vibration API)
- ~~Loading skeletons instead of spinners~~ ✅
- Page transition animations between tabs (already partially done)
- ~~Confirmation dialog before deleting entries ("Jesi li siguran/na?")~~ ✅

### Performance
- ~~Paginate timeline/letters fetch instead of loading all at once~~ ✅
- Move photos to Supabase Storage (object storage) instead of base64 in the DB column — much better for large datasets
- Add `updated_at` columns to enable incremental sync instead of full refetch

### Developer Experience
- CI pipeline: run `npm test` and `npm run build` on push
- E2E tests with Playwright for critical flows (login, add entry, add letter)
- Seed script to populate dev database with sample data

# Chitral Tourism Platform — Project Progress

## Current phase

Phase 9: Trip planner and itinerary management. Implementation is ready for the user's review. The user chose to continue before completing pending reviews for earlier phases.

## Phase 1 complete

- Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui configuration, Lucide React, and Prisma foundation.
- Supabase PostgreSQL connectivity verified.
- Development server reported ready; production build, TypeScript, lint, and Prisma Client generation passed.

## Phase 2 complete

- Auth.js Credentials and conditional Google provider with Prisma adapter and JWT sessions.
- Email/password registration and login with bcrypt password hashes.
- Tourist registration and separate tour guide and hotel owner application forms.
- Provider applications are created with `PENDING` status and their details are not exposed on public routes.
- Account types are assigned in server code; there is no public admin, super-admin, or restaurant-owner registration.
- Role-aware redirects, protected tourist/provider/admin routes, session type augmentation, and logout.
- Prisma User, Auth.js adapter, GuideApplication, and HotelApplication models.
- Migration `20261115135519_authentication_and_provider_applications` applied to Supabase.
- `DATABASE_URL` includes `pgbouncer=true` for Prisma with Supabase transaction pooling; `DIRECT_URL` uses the reachable session pooler in this IPv4-restricted environment.
- Google sign-in was completed in the browser and returned to the tourist page. The configured local callback is `http://localhost:3000/api/auth/callback/google`.
- `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` are populated in local `.env`; never copy their values into this document or chat.
- Improved duplicate-email registration feedback across tourist, guide, and hotel owner forms. The message now explains that the account already exists and offers direct Sign in and Forgot password links.
- Added `/forgot-password` and `/reset-password` flows. Reset tokens are random, stored only as SHA-256 hashes, expire after 30 minutes, and are one-time use. Requests are rate-limited per account and use the same response for existing and unknown addresses.
- Added the `PasswordResetToken` Prisma model and applied migration `20261115235555_add_password_reset_tokens` to Supabase project `GoChitral1`. The table has RLS enabled; the migration is recorded in Prisma's migration ledger.
- Password reset email delivery is integrated through Resend. Local `.env` includes `APP_URL`, `RESEND_API_KEY`, and `EMAIL_FROM`; the Resend key and sender address are still blank, so email delivery awaits sender setup.

## Phase 3 complete

- Added a shared responsive site header with desktop navigation, mobile menu, account links, and provider registration links.
- Added a shared footer and applied both across application routes through the root layout.
- Established global color tokens, typography, focus styling, and shared button variants.
- Added reusable `PageContainer`, `Card`, loading, empty, and error state components.
- Updated authentication forms to use shared card and form styles.
- Added root loading and error boundaries.
- No new dependencies were required.

## Phase 4 complete

- Replaced the initial homepage with a responsive travel discovery experience, including a Chitral-inspired generated hero photograph at `public/images/chitral-hindukush-hero.png`.
- Added destination/attraction cards, experience discovery, stay and guide sections, a food and dining section, and provider application links.
- Kept the curated development discovery records in `src/features/homepage/data.ts` rather than scattering example content through components.
- Added functional search over the controlled discovery dataset at `/search`.
- Added destination detail pages at `/places/[slug]`; homepage and search result cards link to those routes.
- Hotel and guide directories currently show clear empty states. No provider listings are fabricated; they will populate when later directory phases add approved records.

## Phase 3 and 4 review

- Shared design tokens, page components, header/footer, responsive navigation, homepage sections, and discovery fixtures are in place.
- Fixed the header destinations and experiences links to open their database-backed directories, kept Stay on the homepage's Stay section, and added a direct Food & Dining link.
- The static homepage and search fixtures remain as a fallback until approved directory records are entered.

## Phase 5 implemented; user review pending

- Added Prisma models and enums for places, place images, activities, activity images, listing status, controlled place/activity categories, listing source, and tourist place suggestions.
- Applied migration `20261115154814_tourism_directory_phase5` to Supabase project `GoChitral1`; the five new directory tables have RLS enabled. Prisma migration tracking was recorded.
- Added public `/places` and `/activities` directories with approved-only visibility, search, category/location filters, and pagination.
- Added database-backed place/activity details, metadata, optional location coordinates, image URLs, provider contact information, and restaurant/food details on Place records.
- Added admin place and activity create/edit pages, listing status controls, guide activity moderation, and tourist place-suggestion approval/rejection.
- Server actions validate inputs and verify account roles. Tourist suggestions remain private until approved; only approved guides can submit activities; admin-created listings publish immediately.
- Added server-side Cloudflare R2 uploads to place and activity forms, including guide activity submissions. The server validates image type and file signatures, limits submissions to five JPEG/PNG/WebP/AVIF images at 5 MB each, and keeps R2 credentials server-only. Existing HTTPS image URLs and `/images/` paths remain supported.
- R2 upload, public read, and cleanup were verified with a temporary test image. The local `.env` has the R2 endpoint, bucket, credentials, and public URL; no secret values are recorded here.
- Phase 5 still needs the user's manual review of an actual place/activity photo upload in the app. No admin account is recorded as set up; listing administration requires an existing `ADMIN` or `SUPER_ADMIN` account.
- No admin user was created or promoted. The admin pages require an existing `ADMIN` or `SUPER_ADMIN` account; guide activity submission requires an approved guide account.

## Verification

- `npm run typecheck` passed.
- `npm run lint` passed.
- `npm run build` passed.
- Prisma schema validation passed. Phase 5 `prisma generate` emitted updated model types, then returned a Windows `EPERM` while renaming an engine binary whose existing and generated checksums matched; `npm run typecheck` passes against the updated types.
- Supabase transaction rollback check verified tourist, guide, and hotel-owner writes; both provider applications started pending, and password hashing verified. The temporary rows were rolled back.
- Credentials sign-in produced a signed session with the stored account type; logout cleared the session. Temporary verification accounts were deleted.
- Login and registration routes responded; an unauthenticated request to `/admin` redirected to `/login`.
- After Phase 3 changes, `npm run typecheck`, `npm run lint`, and `npm run build` passed.
- After Phase 4 changes, `npm run typecheck`, `npm run lint`, and `npm run build` passed. The initial build attempt encountered a Windows `.next` directory permission error; rebuilding after clearing only the verified in-workspace build cache passed.
- After Google OAuth credentials were configured, `npm run typecheck`, `npm run lint`, and `npm run build` passed. A local request to `/login` returned HTTP 200 and included the Google sign-in option.
- After duplicate-email and password-reset changes, `npm run typecheck`, `npm run lint`, and `npx prisma validate` passed. Supabase confirms the reset-token table has RLS enabled and its migration is finished. Email delivery is not yet verified because the local Resend key and sender are blank.
- Phase 5: `npm run typecheck`, `npm run lint`, and `npx prisma validate` passed. Browser smoke checks confirmed `/`, `/places`, and `/activities` render; the database currently has no approved directory records, so the directory pages show their designed empty states.
- R2 upload phase update: `npm run typecheck` and `npm run lint` passed. A temporary PNG upload to the configured R2 bucket, public URL read-back, and cleanup all passed. The local app on port 3000 returned HTTP 200 after integration.
- Phase 5 production build retries were blocked by Windows `EPERM` errors creating generated Next.js output directories in both the default cache and a temporary output directory. The build did not reach code diagnostics; resolve this environment/filesystem issue before deployment.

## Phase 6 implemented; user review pending

- Added `Hotel`, `HotelImage`, and `HotelRoomType` Prisma models. Hotel profiles are linked one-to-one with the owner and their provider application; room prices are fixed PKR per night and do not represent bookings.
- Applied migration `20261116120000_hotel_management_phase6` to Supabase project `GoChitral1` (`akrypqqtnoxahgzrspux`). The three hotel tables have RLS enabled. The migration is recorded in Prisma's migration ledger.
- Added an admin-only hotel application review page. Approval creates the initial hotel profile; rejection keeps it private.
- Replaced the hotel owner status-only screen with a protected profile editor, R2 photo uploads, amenities/contact editing, and room add/edit/delete forms. Every owner mutation checks the signed-in account and ownership server-side.
- Added approved-only `/hotels` discovery with search and location filtering, `/hotels/[slug]` details, contact links, amenities, room occupancy and fixed nightly prices. The homepage stay section now displays approved hotels; the header Stay link opens the directory.
- Hotel itinerary integration is deferred to Phase 9, when private trips and itinerary items are implemented. No booking, availability calendar, or payment features were added.
- Follow-up photo error: enabled path-style R2 requests and safe server-side error-code logging. The hotel photo selector now blocks more than five photos, individual files over 5 MB, and selections over 25 MB before submit. The exact upload failure still needs a fresh owner photo submission after restarting the dev server; this logout fix did not test photo uploads.
- Fixed the local hotel-owner sign-out runtime error: the dev server had blocked local alias origins such as `[::1]` for Server Actions. Added dev-only allowlists for loopback aliases and the machine's current private IPv4 addresses, and switched logout to Auth.js's `redirectTo` flow. A fresh hotel-owner page sign-out was verified in Brave: `POST /hotel-owner` returned 200 and redirected to `/login?loggedOut=1`. TypeScript and lint pass.
- Checks: `npm run db:generate`, `npx prisma validate`, `npm run typecheck`, `npm run lint`, and `npm run build` passed. The build log included database connection warnings because this local environment cannot reach the Supabase pooler; the production build completed and generated the hotel routes. Supabase MCP confirmed the hotel tables exist with RLS enabled.
- User review is still needed for the owner dashboard, photo upload, hotel application approval, public hotel page, and search/contact experience. An existing Admin test account is now available for approving hotel applications.
- For Phase 6 review, the existing account that matches the user's signed-in Google email was assigned `SUPER_ADMIN`, and the existing `admin@gochitral.com` account was assigned `ADMIN` in the GoChitral1 database. Passwords were not changed. Sign out and sign in again so Auth.js refreshes the JWT role claim. Admin role creation/management remains a Phase 13 feature; these initial test roles were assigned directly in the database.

## Phase 7 implemented; user review pending

- Added editable guide profiles for approved tour guides, including biography, experience, languages, regions, specialties, services, optional pricing details, contact information, portfolio image URLs, and R2 photo uploads.
- Guide application approval now creates a public guide profile. The admin review page only shows pending applications; profiles remain private until approval.
- Added approved-only `/guides` search and region filtering, guide detail pages at `/guides/[slug]`, guide cards on the homepage, a shared header link, and the guide dashboard profile editor.
- Guide profile and photo tables were added in migration `20261116150000_guide_profiles_phase7`, applied to GoChitral1, and enabled RLS. The migration is recorded in Prisma's migration ledger.
- Trip itinerary integration remains for Phase 9; this phase adds guide discovery and direct contact only. No booking or payments were added.
- `npx prisma validate`, `npm run typecheck`, and `npm run lint` passed. The guide dashboard initially failed because the old Next dev server kept an old Prisma Client loaded; its open query-engine DLL also caused `prisma generate` to fail with Windows `EPERM`. Stopping the two project-specific Next processes, clearing only `.next/dev` and leftover Prisma temp files, then regenerating fixed it. Prisma Client generation now passes; its runtime model includes the `GuideApplication.guide` relation; and the restarted dev server returned HTTP 200 for `/login` and `/guide` with no stale Prisma relation error in the guide response.
- User review is needed for guide application approval, editing a profile, photo upload, public guide detail/search, and sign out. The database currently has no guide applications, so the directory will show its empty state until an application is approved.

## Phase 8 implemented; user review pending

- Replaced the tourist status-only screen with a private dashboard showing approved places, food spots, activities, hotels, and guides from the database, plus saved-listing and profile shortcuts.
- Added tourist-only personal information and optional travel-preference pages. Personal name, phone, home location, interests, travel style, and preferred pace are editable; profile enrichment remains optional. Account settings show the signed-in email and link to password reset.
- Added private saved listings for approved places and activities, hotels, and guides. Tourists can save from public detail pages and remove items from their saved collection. Server actions verify role, listing visibility, and ownership; target rows cascade on listing/account deletion.
- Added tourist workspace navigation with sign out, a clear empty state for Saved Places, and honest Phase 9/12 placeholders for trips and reviews. Trip planning, messages, notifications, and reviews remain for their planned phases.
- Added Prisma `TouristProfile` and `SavedListing` models and migration `20261116180000_tourist_dashboard_phase8`. Applied the schema to GoChitral1 (`akrypqqtnoxahgzrspux`), enabled RLS on both tables, and recorded the migration in Prisma's migration ledger. Direct Supabase APIs have no policies on these tables; application access goes through authenticated server-side Prisma actions.
- `npm run typecheck`, `npm run lint`, and `npx prisma validate` passed. Supabase confirmed both new tables exist with RLS enabled. Browser-based owner isolation and tourist save/remove flows still need the user's manual review.
- Follow-up stale-client runtime issue: the existing Next dev process on port 3000 had loaded Prisma before Phase 8 and held the query-engine DLL, so `prisma.savedListing` was undefined at runtime. Stopped that verified project process tree, reran `npm run db:generate` successfully, and restarted the dev server on port 3000. Brave confirmed the authenticated tourist dashboard now loads with no runtime error; server log contains no new errors.
- Added `scripts/dev.mjs` as the `npm run dev` entry point. It generates Prisma Client before startup and watches `prisma/schema.prisma`; on schema edits it stops the existing Next process tree, regenerates the client, and restarts Next before serving again. This prevents the stale Prisma Client failure during normal development. The watcher restart was exercised with a temporary schema comment, and the app returned HTTP 200 afterward.

## Phase 9 implemented; user review pending

- Added private trip, trip-day, itinerary-item, and trip-accommodation Prisma models. Trips create one dated day per trip date, with a 30-day maximum. Itinerary entries can point to approved places, activities, hotels, and guides or be personal custom stops; listing details and indicative prices are snapshotted into the plan.
- Applied migration `20261116230000_trip_planner_phase9` to Supabase project `GoChitral1` (`akrypqqtnoxahgzrspux`), enabled RLS on all four new tables, and recorded the migration in Prisma's migration ledger.
- Added tourist-only `/tourist/trips` and `/tourist/trips/[tripId]` pages for creating, editing basic trip details, archiving/restoring, adding days, day notes, adding/editing/removing/reordering itinerary items, and managing separate hotel stay notes. Every mutation checks the signed-in tourist and trip ownership.
- Public place, activity, hotel, and guide pages now offer Add to trip for signed-in tourists. The tourist dashboard links to trip planning and shows active trip count. Trips are private; no sharing, bookings, payments, or reservation claims were added.
- `npx prisma validate`, `npm run typecheck`, and `npm run lint` passed after implementation. Browser spot checks confirmed `/tourist/trips` requires tourist sign-in and public activity details show the trip action to signed-out visitors as a sign-in link. A full authenticated create/edit itinerary flow still needs user review.
- To review: sign in as a tourist, open `/tourist/trips`, create a trip, add an approved listing from its public detail page or the itinerary, try a custom stop and day notes, reorder/edit/remove an item, add an approved hotel stay, then archive and restore the trip. Confirm the listings exist and are approved first; empty directories provide no listings to add.
- Trip dates are currently chosen at creation. The itinerary can be extended by adding days; editing the trip name and description is supported.

## GoChitral usability and stability review

- Renamed visible app branding and metadata to GoChitral. Signed-in navigation now shows Profile without Sign in/Create account; Plan a trip links directly to `/tourist/trips`, and the tourist dashboard retains its trip shortcut.
- Simplified trip creation and day planning. Places/food, activities, hotels, and guides now have separate selectors. Activity choices are suggested when their location matches a place or hotel already on that day; all other approved activities remain selectable.
- Trips with end dates before the current date in Asia/Karachi now appear in Archives automatically. Tourists can also mark a trip complete early. Archived or ended trips are read-only, and server actions enforce the same end-date/ownership checks.
- Added an explicit WhatsApp share link that composes a message containing the itinerary and a GoChitral link. The share is initiated by the user; the trip is not made public in the database.
- Tourists and approved guides can upload a single profile photo to R2. Guide profile photos appear on directory cards and the guide detail page.
- Success/error feedback now appears as a dismissible bottom-screen notification. A site-wide toast covers provider/admin redirects; tourist trip forms retain their specific messages.
- Fixed public visibility checks: tourist recommendations and saved listings now include hotels and guides only after approval. This prevents pending provider records from appearing in tourist-facing screens.
- Added server-side validation to reject malformed add-to-trip listing requests with missing/invalid listing IDs, preventing Prisma from treating an omitted ID as an unfiltered lookup.
- Added `npm run db:seed:demo` for two local demo tourists, a demo hotel owner/listing, restaurant, place, and activity. The seed refuses production mode and non-local database hosts. The current `.env.local` points to the Supabase pooler, so the seed was intentionally not run there and no fake listings were inserted into the live database. Use a local PostgreSQL database to run it.
- `npm run typecheck`, `npm run lint`, and `npx prisma validate` passed. A production build attempt failed on Windows with `EPERM` creating `.next-review-build/types/app/tourist/trips/[tripId]`; this is a filesystem/build-output permission failure, not a TypeScript diagnostic. Browser-driven authenticated flows remain for user review.

## Phase 10 Search and maps implemented; release in progress

- Replaced the global search's static fixture fallback with PostgreSQL full-text search across approved places and restaurants, activities, hotels, and guide profiles. Search supports category, location/region, and PKR per-night hotel price filters.
- Added optional nearby search with browser geolocation requested only after the visitor presses the button. It uses PostGIS distance queries for coordinate-backed places, activities, and hotels; the page discloses that coordinates are present in the URL for that search and are not stored in the profile.
- Added MapLibre maps to global search, the places/activities/hotels directories, public listing detail pages, and tourist itineraries. Maps show only records with stored coordinates; no coordinates are guessed. Admin/provider coordinate fields already exist.
- Added a Prisma SQL migration with PostGIS and GIN full-text/GiST coordinate indexes. Applied to Supabase project `GoChitral1`; verified the extension, seven indexes, a full-text query, and a PostGIS distance query. Prisma's migration ledger is also marked applied.
- Map tiles use OpenFreeMap's public Liberty style and show map attribution. Its terms say the service is free and provided as-is, and it may be discontinued without notice; select an SLA-backed provider before relying on it for a production service.
- Hotel rating filters are not included because the current schema has no persisted review/rating data. Rating search can be added when that data model is ready.
- `npm run typecheck`, `npm run lint`, `npx prisma validate`, and the isolated production build completed successfully. Build required `NEXT_DIST_DIR=.next-phase10-release` because Windows denied directory creation under the existing `.next` folder; build artifacts are temporary and will be removed after publishing.
- User review/testing is pending. The nearby feature needs approved records with verified coordinates to validate Chitral Town, Bumburet, Garam Chashma, Booni, Mastuj, and Shandur Pass against real stored data.

## Known issues

- `npm audit --omit=dev` reports three high-severity advisories through Prisma's config/deepmerge dependency chain. npm recommends a Prisma 7 major upgrade; this was not applied because it would be a breaking ORM change and was not required for this phase. Review the upgrade before production deployment.
- The local `.env` contains credentials and is ignored by Git. Never commit or paste it into chat.
- Supabase security advisors report RLS disabled on the existing `User`, `Account`, `Session`, `VerificationToken`, `GuideApplication`, `HotelApplication`, and `_prisma_migrations` tables. Review exposure and add appropriately scoped policies before exposing database access through Supabase's browser Data API. The Next.js app currently accesses application data through server-side Prisma.
- The five new directory tables have RLS enabled without browser Data API policies; this is intentional because all directory access currently goes through server-side Prisma authorization.

## Verification commands

- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `npx prisma migrate dev`
- `npm run db:generate`

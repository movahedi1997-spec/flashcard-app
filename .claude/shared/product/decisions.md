# Product Decisions Log — Flashcard App
# Maintained by: Product Owner
# Last updated: 2026-04-11

---

## ⚠️ Gap & Conflict Resolution Index

Before the 6 formal decisions, four tensions between research findings, marketing
strategy, and the founder's answers have been identified and resolved below.
Each resolution is referenced within the relevant decision.

### GAP-001 — Research Priority vs. Founder Priority
- Tension: Research (RESEARCH-004, RESEARCH-010) and Marketing (STRATEGY-001)
  both recommend AI PDF generation as the #1 differentiator. The founder ranks
  the Sharing/Explore page as personally higher priority — "possibly even more
  than AI generation."
- Resolution: These are not mutually exclusive. The Sharing/Explore page is
  elevated to co-equal P0 status alongside the SRS engine. AI generation moves
  to P1 (second sprint), not P2. Rationale: the explore page seeds the platform
  with content for users who arrive organically before AI generation is polished,
  and directly serves the activation goal (users find existing decks immediately,
  study them, and experience SRS value loop with zero card creation required).
  AI generation then becomes the upgrade lever. This sequence is defensible.

### GAP-002 — Segment Breadth vs. Execution Quality
- Tension: Research (RESEARCH-005, RESEARCH-006) implies that chemistry students
  have unique technical requirements (structural diagrams, reaction mechanisms)
  that may delay chemistry support. Marketing wants all three segments at launch.
  Founder confirmed: all three simultaneously.
- Resolution: Launch all three segments in the Explore page with curated
  community decks (text-based only for chemistry v1). Chemistry structural
  diagram rendering is deferred to v1.1 post-launch patch. At launch, chemistry
  cards will be text + image upload (manual). AI-generated chemistry cards with
  structure rendering is a post-launch milestone. This delivers chemistry students
  immediate value (browsable decks, SRS, explore page) without blocking launch.

### GAP-003 — Speed vs. Quality (Window Urgency vs. Build It Right)
- Tension: Research (RESEARCH-010) warns the 12-18 month competitive window is
  closing. Marketing (STRATEGY-002) is calendared to launch August 2026.
  Founder's risk tolerance is explicit: "Build it right before launch — do not
  cut corners on SRS or AI quality."
- Resolution: The August 2026 target is maintained — this is achievable. The
  "no corners" mandate applies specifically to two components: the SRS algorithm
  (must be calibrated for long-horizon retention, not a toy implementation) and
  AI generation accuracy (must handle medical/pharmacy/chemistry terminology
  without hallucinating incorrect drug dosages or reactions). Everything else
  (polish, advanced analytics, B2B features) ships post-launch. Speed and quality
  are not in conflict if scope is disciplined. PM must enforce this boundary.

### GAP-004 — Pricing Commitment Too Early
- Tension: Marketing (STRATEGY-004) commits to specific pricing tiers
  ($7.99/mo, $49.99/yr, $159.99 lifetime). The Researcher flagged the $6.99-
  $8.99/month range as needing validation. No pricing A/B data exists yet.
- Resolution: Pricing tiers are adopted directionally from STRATEGY-004 as the
  pre-launch hypothesis. They will NOT be locked in the product until 8 weeks
  before launch, after the private beta produces first conversion signal. PM
  should build the pricing/paywall infrastructure to be configurable — never
  hardcode price values into the frontend. All specific prices are provisional
  until DECISION-005 is finalized with beta data.

---

[DECISION-001] North Star Metric & Primary Product Goal
- Date: 2026-04-11
- Type: strategy / direction
- Context: The founder has defined Activation as the #1 goal, ahead of growth.
  This resolves ambiguity from research which focused on acquisition. A product
  that acquires without activating is a leaky bucket.
- Options considered:
  1. Optimize for Acquisition (signups, traffic) — grow the top of funnel fast,
     fix activation later. PROS: fast user count, looks good early. CONS: high
     churn, low retention, weak product-market fit signal.
  2. Optimize for Activation first, then Growth — define "activated" clearly,
     build the product around getting every user to that moment, then scale
     acquisition once the activation rate is proven. PROS: defensible retention,
     real PMF signal, better LTV. CONS: slower initial user numbers.
  3. Optimize for Revenue — paywall early, charge fast. PROS: early revenue.
     CONS: kills trust before trust is earned; contradicts our anti-Quizlet
     positioning entirely.
- Decision: Option 2 — Activation first, then Growth.
- Reasoning: Activation validates product-market fit. A user who creates their
  first AI deck and completes their first SRS session is a fundamentally different
  user than one who signs up and churns. The explore page supports activation
  even for users who do not upload a PDF — they find an existing deck, study it,
  and experience SRS value without any creation friction. Activation unlocks
  both retention and referral, which then compounds growth organically.
- Activation Definition (North Star):
  A user is "Activated" when they complete their first SRS study session with
  at least 10 cards — whether from an AI-generated deck, a manually created deck,
  or a community deck from the Explore page. All three paths count.
- North Star Metric: % of new signups who complete first SRS session within
  7 days of registration. Target: 60% at launch.
- Secondary Metrics:
  - Time to first SRS session (median target: <8 minutes from signup)
  - Day-30 retention among activated users (target: 30%+)
  - Day-30 retention among non-activated users (benchmark for gap analysis)
- Input from:
  - Researcher: RESEARCH-010 (5-step core loop: PDF to AI to SRS to Share to Explore)
  - Marketing: STRATEGY-002 (40%+ activation rate as launch goal — raised to
    60% based on founder input)
  - Growth Hacker: GROWTH-005 ("First Deck in 5 Minutes" onboarding — P0)
  - Critical Consultant: Activation-first is the correct call. The explore page
    is a sleeper activation lever — users who arrive cold find existing decks
    and study immediately, bypassing the creation friction entirely. This is
    the insight that reconciles GAP-001.
  - User (Founder): "Activation first — get users to their first real study
    session."
- Impact on dev: Onboarding flow must be built around the three activation
  paths. The PM should ensure all three paths (Upload PDF, Browse Explore,
  Create Manually) are presented with equal prominence and zero friction before
  first SRS session. No email gate before first value. No mandatory profile
  setup before first deck.
- Status: approved

---

[DECISION-002] Feature Build Priority Order (P0 / P1 / P2)
- Date: 2026-04-11
- Type: priority / feature
- Context: With a fixed August 2026 deadline, a 14-person team, and a "build it
  right" quality mandate, a hard feature priority order is required. The founder's
  personal emphasis on the Sharing/Explore page (GAP-001) combined with
  Activation as the north star (DECISION-001) drives this ordering.
- Options considered:
  1. AI Generation first, then SRS, then Explore — standard market recommendation
     from research. PROS: leads with the headline differentiator. CONS: the
     explore page arrives late; new users have nothing to browse at launch.
  2. SRS first, then Explore/Sharing, then AI Generation — founder-influenced.
     PROS: platform has community content from Day 1; activation via explore
     is possible before AI is polished. CONS: AI generation — the primary
     Premium conversion lever — arrives later, delaying revenue signal.
  3. SRS + Explore co-equal P0, AI Generation P1 — hybrid resolution of
     GAP-001. PROS: both core loops are live at launch; explore page seeds
     the platform; AI generation ships as the upgrade lever shortly after.
     CONS: more concurrent work in the first sprint.
- Decision: Option 3 — SRS Algorithm + Explore/Sharing Page are co-equal P0.
  AI Generation is P1. All other features are P2.
- Detailed Priority Breakdown:

  ### P0 — Must be production-ready at August 2026 launch
  1. SRS Algorithm — long-horizon calibration (months to years), SM-2 or
     superior implementation, smart daily load management, catch-up mode for
     users returning after gaps, no "review debt" cliff. Non-negotiable.
     (Resolves GAP-003: quality over speed, scoped to ship by August.)
  2. Explore / Sharing Page — public deck discovery, subject categories
     (Medicine, Pharmacy, Chemistry, USMLE Step 1, NAPLEX, MCAT, Orgo),
     SEO-optimized deck landing pages at /explore/[subject]/[deck-slug],
     one-click deck sharing, "Follow this deck" feature, Verified Creator badges,
     shareable preview image for social media (Instagram/TikTok format).
  3. Core Card Creation (manual) — text + image upload, basic formatting,
     deck organization, tagging. Polished and fast. No AI required at this layer.
  4. User Accounts & Profiles — sign-up, login, creator profile page, deck
     library management, basic progress dashboard.
  5. Onboarding Flow — three clear activation paths: Upload PDF (AI),
     Browse Explore (community), Create Manually. No email gate before
     first value. No mandatory profile setup before first deck.

  ### P1 — Must be production-ready at launch or within 4 weeks post-launch
  6. AI PDF/Transcript Generation — upload PDF or paste transcript, AI
     produces a ready-to-study deck. Medical/pharmacy/chemistry domain
     awareness required (no hallucinated drug dosages or reaction products).
     This is the primary Premium conversion lever; quality gates apply.
     (Resolves GAP-003: AI ships to prod with quality gates, not rushed.)
  7. Streak System + Notification Engine — daily streak, Streak Shield,
     Exam Mode freeze, push + email notifications at peak study hour.
  8. Study Together / Referral Program — double-sided referral, pre-generated
     invite messages, "Share this deck with your class" CTA.

  ### P2 — Post-launch roadmap (Month 1-3)
  9.  Advanced SRS Analytics dashboard (per-deck retention curves, accuracy
      trends, predicted card mastery dates).
  10. Anki .apkg importer (preserves card content, tags, review history).
  11. Chemistry structural diagram rendering and AI structure parsing.
      (Resolves GAP-002: chemistry v1 = text + manual image; v1.1 = structure
      rendering; v2 = AI-generated structure cards.)
  12. Study Wrapped / Shareable Stat Cards (Spotify-style end-of-session sharing).
  13. Campus Ambassador tooling (school-specific referral links, signup banners).
  14. Faculty B2B pilot dashboard.
  15. Offline mode (mobile-first after iOS launch).

- Reasoning: The explore page is both an activation lever (users study existing
  decks from Day 1) and the platform's viral engine (SEO, social sharing, creator
  flywheel). It must be live at launch with real content. The SRS algorithm is
  the product's core scientific credibility — if it ships broken, no amount of
  AI features recovers trust with a medical student audience. AI generation is
  the premium upgrade driver and can follow immediately post-launch as P1.
- Input from:
  - Researcher: RESEARCH-008 (Explore page viral mechanics), RESEARCH-002
    (SRS quality requirement), RESEARCH-004 (AI generation landscape)
  - Marketing: STRATEGY-001 (5 differentiation pillars), STRATEGY-003
    (SEO flywheel from deck landing pages starts Day 1)
  - Growth Hacker: GROWTH-001 (SEO deck flywheel), GROWTH-005 (activation
    onboarding), GROWTH-006 (empty state seeding via curated starter decks)
  - Critical Consultant: Elevating the explore page to P0 is the correct
    resolution of GAP-001. A platform with an empty explore page at launch
    is a missed activation opportunity. Seed the explore page before launch
    with 20-30 high-quality community decks (medical, pharmacy, chemistry)
    so Day 1 users land in a rich environment.
  - User (Founder): "The Sharing/Explore page — possibly even more than AI
    generation."
- Impact on dev: PM must divide the first sprint into two parallel tracks:
  (A) SRS engine + card creation + user accounts (backend-heavy),
  (B) Explore page + sharing + SEO page structure (frontend + backend).
  AI generation begins development in parallel but does not block launch.
- Status: approved

---

[DECISION-003] Target User Segments at Launch
- Date: 2026-04-11
- Type: direction / platform
- Context: The founder confirmed all three target segments — medical, pharmacy,
  and chemistry students — should be addressed simultaneously. Research flags
  that chemistry has unique technical constraints (structural diagrams). Resolved
  in GAP-002.
- Options considered:
  1. Medical-only at launch, expand to pharmacy and chemistry in Month 2-3.
     PROS: focused positioning, simpler content strategy. CONS: contradicts
     founder instruction; smaller TAM at launch.
  2. All three simultaneously with equal investment across all three.
     PROS: broadest reach at launch. CONS: chemistry technical constraints
     may produce an inferior product experience for chemistry users at launch.
  3. All three simultaneously with honest v1 scope differentiation.
     Chemistry students get text + image cards and curated community decks
     at launch; structural diagram rendering is a post-launch feature.
     Medical and pharmacy get full feature parity.
- Decision: Option 3 — All three segments at launch with scoped chemistry v1.
- Segment-Specific Decisions:

  **Medical Students (USMLE, MCAT, preclinical)**
  - Full feature support at launch
  - Explore page categories: USMLE Step 1, USMLE Step 2, MCAT, Anatomy,
    Physiology, Pathology, Pharmacology, Biochemistry
  - Seed deck priority: AnKing-equivalent curated starter decks for Year 1
    and Year 2 medical school subjects
  - AI generation: tuned for medical terminology, drug names, clinical
    presentations, diagnosis/treatment frameworks
  - SRS calibration: optimized for 12-24 month board exam prep timelines

  **Pharmacy Students (NAPLEX, MPJE, pharmacology)**
  - Full feature support at launch
  - Explore page categories: Pharmacology, Drug Mechanisms, NAPLEX prep,
    Medicinal Chemistry, Pharmacy Law
  - Seed deck priority: Core Drug Mechanisms Year 1, Top 200 Drugs
  - AI generation: tuned for drug class nomenclature, MOA, side effects,
    contraindications, drug-drug interactions

  **Chemistry Students (Orgo, Gen Chem, AP Chemistry)**
  - Explore page categories: Organic Chemistry, General Chemistry,
    AP Chemistry, Biochemistry, Reaction Mechanisms
  - v1 limitation: text + image upload only for card creation and AI
    generation; no automated structure rendering at launch
  - v1 onboarding message: chemistry students directed to Browse Explore
    and Manual + Image creation; AI generation available for text content
  - v1.1 (Month 2-3 post-launch): structural diagram rendering; AI parsing
    of chemistry notation from PDFs. See DECISION-002 P2 item 11.
  - Seed deck priority: Functional Groups, Common Reagents, Orgo Reaction
    Types, AP Chemistry core terms

- Reasoning: Chemistry students are a real and underserved market. Excluding
  them at launch leaves a segment whose search behavior (RESEARCH-006) is high-
  intent. The v1 text-only limitation is honest and manageable — chemistry
  students can study vocabulary, definitions, drug mechanisms, and reaction names
  effectively with text cards. The structural diagram gap is real but not fatal
  for Day 1. Clear roadmap communication sets expectations correctly.
- Input from:
  - Researcher: RESEARCH-005, RESEARCH-006
  - Marketing: STRATEGY-003 (channel strategy includes chemistry subreddits
    and AP Chemistry exam season campaigns)
  - Growth Hacker: GROWTH-006 (segment-specific starter decks on signup)
  - User (Founder): "All three simultaneously."
- Impact on dev: PM must ensure the explore page category taxonomy covers all
  three segments on Day 1. AI generation prompts/system messages must be
  configurable per subject domain — the backend must support domain context
  injection before shipping AI generation. Chemistry v1.1 structural rendering
  is a separate post-launch technical task.
- Status: approved

---

[DECISION-004] Platform Strategy — Web First, Then iOS/iPad
- Date: 2026-04-11
- Type: platform
- Context: The founder confirmed web-first launch, followed by iOS/iPad via
  cross-platform development. This aligns with a quality-first mandate — a
  single polished web product is better than two mediocre multi-platform
  experiences at launch.
- Options considered:
  1. Web only at launch, native iOS later. PROS: single codebase to ship,
     fastest to launch, no App Store review delays. CONS: no mobile studying
     during commutes or clinical rotations — a real use case for medical students.
  2. Web + PWA at launch, native iOS in Month 2-3. PROS: mobile-accessible
     immediately via browser with offline capability. CONS: PWA has UX and
     notification limitations on iOS (Apple's push notification restrictions).
  3. Web at launch + cross-platform iOS/iPad (React Native or Flutter) as the
     second platform — the founder's stated preference. PROS: best native iOS
     experience; iPad is the primary study device for many medical students;
     App Store is a separate acquisition channel. CONS: requires cross-platform
     development resources post-launch.
- Decision: Option 3 — Web first at August 2026 launch.
  iOS/iPad development begins at Month 1 post-launch, targeting a Month 3-4
  App Store release (November-December 2026).
- Platform Decisions:

  **Web (Launch — August 2026)**
  - Responsive design: usable on tablet browsers (iPad Safari) as a bridge
    before the native iOS app ships
  - PWA enabled: installable, with basic offline caching for card review
  - Tech stack decision delegated to PM/Backend — must be chosen with
    cross-platform code reuse in mind (React/React Native or Flutter)
  - SEO is a web-only acquisition strategy — strong reason web is primary

  **iOS/iPad (Target: November-December 2026)**
  - Cross-platform development recommended: React Native or Flutter
    (PM to evaluate — must maximize code reuse with web)
  - iPad is priority device: medical students frequently study on iPads
    during lectures and clinical rotations
  - Native push notifications are critical for streak and SRS reminders
  - App Store Optimization: title must include "AI Flashcards"; subtitle
    targets USMLE, MCAT, Med School keywords
  - Anki iOS costs $24.99 — our free iOS tier is a direct acquisition lever

  **Android (Future — not in current roadmap)**
  - Not in scope for this planning cycle
  - Revisit after iOS launch with usage data

- Reasoning: August 2026 is a hard deadline tied to semester start. Splitting
  focus across web + native mobile simultaneously risks both. The PWA bridge
  maintains mobile usability during the gap. iPad-optimized layout on the web
  app captures a large portion of the iOS use case at no additional cost.
  Native iOS follows immediately after launch.
- Input from:
  - Researcher: RESEARCH-002 (Anki iOS $24.99 pain point — free iOS tier is
    a direct acquisition lever)
  - Marketing: STRATEGY-003 (Channel 5 — App Store Optimization planned)
  - Growth Hacker: GROWTH-002 (Anki migration funnel — mobile must be
    available for Anki switchers who study on iPhone/iPad)
  - User (Founder): "Web first, then iOS/iPad via cross-platform development."
- Impact on dev: PM must make a technology stack decision in Week 1 that
  supports future React Native or Flutter mobile development. This is an
  architectural decision that cannot be deferred. DevOps must plan for both
  web hosting and future App Store deployment pipeline.
- Status: approved

---

[DECISION-005] Pricing Model & Free Tier Philosophy
- Date: 2026-04-11
- Type: strategy / revenue
- Context: Research (RESEARCH-007, RESEARCH-009) and Marketing (STRATEGY-004)
  have converged on a freemium model with specific tier recommendations.
  GAP-004 identified that final price points must not be hardcoded until
  private beta conversion data is available. This decision establishes the
  philosophy and architecture; specific prices are provisional.
- Options considered:
  1. Aggressive free tier — everything free, ads on non-study surfaces.
     PROS: maximum user acquisition. CONS: trains users to expect free forever;
     harder to convert later; low ad revenue at early scale.
  2. Minimal free tier — lock core features behind paywall quickly. PROS:
     higher early revenue per user. CONS: exactly what destroyed Quizlet's
     reputation. Trust-destroying. Contradicts our positioning entirely.
  3. Generous free tier with AI as the paid upgrade lever — core SRS + manual
     creation + full explore page access permanently free. AI generation
     (beyond a monthly limit) is the primary paywall trigger. No ads during
     study sessions ever.
- Decision: Option 3 — Generous free tier; AI generation is the paid lever.
- Pricing Architecture (Provisional — subject to beta validation per GAP-004):

  | Tier                      | Price (Provisional) | Core Inclusions                                               |
  |---------------------------|---------------------|---------------------------------------------------------------|
  | Free                      | $0 forever          | Unlimited manual cards, unlimited SRS, full explore page,     |
  |                           |                     | public sharing, 50 AI cards/month, NO study-session ads       |
  | Student Pro Monthly       | ~$7.99/mo           | All Free + unlimited AI from PDFs, advanced SRS analytics,    |
  |                           |                     | offline mode (native app)                                     |
  | Student Pro Annual        | ~$49.99/yr          | Same as monthly; ~$4.17/mo equivalent; 48% discount           |
  | Student Pro .edu Annual   | ~$34.99/yr          | 30% off annual with verified .edu email                       |
  | Lifetime Plan             | ~$159.99            | All Premium features forever                                  |
  | Founding Member (Promo)   | ~$99.99             | 37% off Lifetime; first 30 days post-launch only; real expiry |
  | Campus License            | Custom (~$8/seat/mo)| Class management, LMS integration, faculty tools, analytics   |

- Non-Negotiable Pricing Rules:
  1. NEVER show an ad during a flashcard review session. This is a product
     promise enforced at the architecture level, not a feature toggle.
  2. NEVER paywall core SRS studying. Free users must be able to study all
     their cards indefinitely. Only AI generation and advanced analytics
     are paywalled.
  3. Gate AI on a monthly credit limit (50 cards free), not a time trial.
     Users must experience AI value before hitting the limit.
  4. The paywall prompt appears contextually when the AI limit is reached —
     never as a modal interrupting non-AI activity.
  5. Pricing page defaults to annual view (shows per-month equivalent).
  6. Price values must be stored in configuration, not hardcoded in the UI.
     This enables A/B testing and price adjustments without a redeploy.

- Freemium Conversion Targets:
  - Month 6: 5% free-to-paid conversion
  - Month 12: 8% free-to-paid conversion
  - Annual plan share of paying users: 60-70%

- Input from:
  - Researcher: RESEARCH-007 (pricing benchmarks), RESEARCH-009 (freemium
    best practices, Quizlet failure modes)
  - Marketing: STRATEGY-004 (detailed pricing tiers)
  - Growth Hacker: GROWTH-013 (paywall optimization, A/B testing plan),
    GROWTH-014 (Founding Member offer mechanics)
  - Critical Consultant: The "50 AI cards/month" free limit is the right
    gate — generous enough that users experience real value (a full lecture
    deck can be ~50 cards) but restrictive enough to create upgrade intent.
    The Lifetime plan at ~$159.99 is well-priced for medical students who
    will use the product for 4+ years. Validate the monthly price point in
    beta before locking it.
  - User (Founder): "Build it right." Pricing confirmed directionally.
- Impact on dev: PM must ensure the pricing/paywall system is built with
  configurable values. AI generation endpoint must track usage per user per
  billing cycle. The upgrade prompt component must be a standalone contextual
  trigger. Stripe (or equivalent) integration is a P1 backend task.
- Status: draft — pricing figures provisional until beta data available.
  Architecture and rules are approved.

---

[DECISION-006] Quality Standards & Launch Readiness Criteria
- Date: 2026-04-11
- Type: direction / strategy
- Context: The founder explicitly mandated "build it right before launch — do
  not cut corners on SRS or AI quality." This is formalized as concrete launch
  readiness criteria the PM and QA Tester can enforce. Resolves GAP-003.
- Options considered:
  1. Ship fast with known issues, patch post-launch. PROS: earliest in market.
     CONS: medical students do not forgive incorrect SRS schedules or AI cards
     with wrong drug dosages — trust cost is unrecoverable.
  2. Define specific quality gates for SRS and AI; defer everything else
     to post-launch. PROS: focused quality investment where it matters most.
     CONS: requires clear criteria (provided below).
  3. Full polish across all features before launch. PROS: best first impression.
     CONS: impossible in the time available; causes indefinite delays.
- Decision: Option 2 — Defined quality gates for SRS and AI; pragmatic
  standards for everything else.
- Quality Gates (Hard blockers — cannot ship without passing these):

  **SRS Algorithm Quality Gates**
  - Algorithm must implement SM-2 or a documented superior variant (e.g.,
    FSRS). No custom approximations without a research citation.
  - Review scheduling must be validated against known retention curves for
    target study timelines: 30-day, 90-day, 180-day, 365-day.
  - Smart Catch-Up Mode must be implemented and tested: users returning after
    3+ days of missed reviews see a manageable prioritized subset, not an
    overwhelming debt pile.
  - Daily load management: if due cards exceed session capacity, the system
    surfaces the highest-priority cards — not a random subset.
  - SRS state persistence must be 100% reliable: no data loss on session
    interruption, app close, or network dropout.

  **AI Generation Quality Gates**
  - AI must never generate medically or pharmacologically inaccurate content
    without a confidence flag. A hallucinated drug dosage on a medical
    student's flashcard is a patient safety concern.
  - Domain context injection must be implemented: system prompt must include
    subject-area context (medical, pharmacy, chemistry) before generating
    cards from any uploaded document.
  - Card output format must be consistent: question / answer / hint (optional)
    / source reference (from uploaded document, with page number if available).
  - AI generation must be tested against a corpus of at least 10 real medical
    lecture PDFs, 5 pharmacy lecture PDFs, and 5 chemistry PDFs before launch.
    Acceptance criteria: less than 5% factual error rate on reviewed output
    (manual QA review required).
  - AI-generated cards must be editable before adding to a deck. No auto-add
    to SRS without user review confirmation.

  **Explore Page Quality Gates**
  - At least 20 high-quality community seed decks must be live on the explore
    page before launch day (not after). Breakdown: 10 medical, 6 pharmacy,
    4 chemistry. These are seeded by the team, not user-generated.
  - SEO deck landing pages must be crawlable, indexed, and rendering correct
    JSON-LD structured data before launch.
  - Deck sharing must generate a working shareable link that renders correctly
    on iOS Messages, WhatsApp, Twitter/X, and as an Instagram Story preview.

  **General Launch Readiness Criteria**
  - Core user flows (sign up, create deck, study, share) must pass QA on:
    Chrome desktop, Firefox desktop, Safari desktop, Safari iPad, Chrome Android
    tablet. No P0 or P1 bugs on these paths at launch.
  - Load time: first meaningful paint on the study interface under 2 seconds
    on a typical US university WiFi connection.
  - Accessibility: WCAG 2.1 AA minimum compliance on all primary flows.
  - Data privacy: GDPR + COPPA compliance reviewed by Security Auditor before
    launch (student data is sensitive; some users may be under 18 in AP courses).
  - No payment processing bugs: Stripe integration must pass end-to-end testing
    in staging before any real transaction is processed.

- Reasoning: Medical and pharmacy students are a uniquely high-stakes audience.
  An incorrect SRS schedule means a student fails to retain material for boards.
  An AI-generated card with a wrong drug mechanism could reinforce a dangerous
  clinical misconception. The quality gates above are not perfectionism — they
  are the minimum bar for a product targeting this audience. Competitive
  advantage is trust; trust is destroyed faster than it is built.
- Input from:
  - Researcher: RESEARCH-002 (Anki's SRS gold standard), RESEARCH-004
    (AI accuracy for medical content)
  - Marketing: STRATEGY-001 ("SCIENCE" pillar — long-horizon SRS for USMLE
    timelines is a core marketing claim; must be factually true)
  - Critical Consultant: The AI quality gate on medical accuracy is the most
    important single quality requirement in this document. Everything else
    can be patched. A viral post about a wrong drug interaction in an
    AI-generated flashcard deck would be existentially damaging at launch.
    Build a human review workflow for the 20 seed decks and a clear
    "AI-generated — please verify" disclaimer on all AI cards until an
    accuracy track record is established.
  - User (Founder): "Build it right before launch — do not cut corners on
    SRS or AI quality."
- Impact on dev: PM must add quality gate checkpoints to the dev timeline.
  QA Tester must build a test corpus for AI generation. Code Reviewer must
  validate the SRS algorithm implementation against the specification.
  Security Auditor must complete GDPR/COPPA review before launch.
  These are blocking gates, not suggestions.
- Status: approved

---

---

[PRODUCT OWNER] Handoff to PM — Decision Set 001
- Decisions: DECISION-001 through DECISION-006
- Date: 2026-04-11
- Status: DECISION-001, 002, 003, 004, 006 are approved. DECISION-005 is
  approved in architecture and rules; specific pricing figures are provisional
  pending beta data (8 weeks before launch).

---

### Summary for PM

The product team has completed the first full strategic alignment session with
the founder. Here is everything you need to start planning dev work.

**What we are building:**
A flashcard app for medical, pharmacy, and chemistry students. Two core
differentiators: (1) an SRS algorithm calibrated for long-horizon exam prep
(months to years, not days), and (2) a public Explore/Sharing page where
students discover, use, and share community decks — with SEO-optimized pages
and social media sharing built in.

**What the founder cares most about:**
1. Activation — every user must reach their first study session quickly.
   Define "activated" as: completed first SRS session with 10+ cards.
2. The Explore/Sharing page — this is the founder's personally highest-priority
   feature. It must be live and populated with at least 20 seed decks at launch.
3. Quality — the SRS algorithm and AI generation must not cut corners.
   See hard quality gates in DECISION-006.

**Build Priority:**

  P0 (must ship at August 2026 launch):
  - SRS engine with long-horizon calibration and catch-up mode
  - Explore / Sharing page with SEO landing pages and social share previews
  - Core manual card creation (text + image upload)
  - User accounts and creator profiles
  - Onboarding flow with three activation paths (no email gate before first value)

  P1 (ship at launch or within 4 weeks post-launch):
  - AI PDF/transcript generation with domain context (medical/pharmacy/chemistry)
  - Streak system and notification engine
  - Referral / Study Together program

  P2 (Month 1-3 post-launch roadmap):
  - Advanced SRS analytics dashboard
  - Anki .apkg importer
  - Chemistry structural diagram rendering (v1.1)
  - Study Wrapped shareable stat cards
  - Campus ambassador tooling
  - Faculty B2B pilot dashboard
  - Offline mode (after iOS app)

**Platform:**
Web-first for August 2026 launch. Make the web app responsive and PWA-enabled
as a mobile bridge. iPad-optimized layout is important — our users study on
iPads. iOS/iPad development (React Native or Flutter — your call, decide Week 1)
begins Month 1 post-launch, targeting November-December 2026 App Store release.
Android is not in scope for this planning cycle.

**Three segments at launch:**
Medical, pharmacy, and chemistry students. Chemistry v1 = text + image cards
only (no structural diagram rendering). Chemistry v1.1 = structural diagrams
post-launch. Do not add chemistry diagram rendering to the launch scope.

**Pricing and payments:**
Build the paywall infrastructure with configurable price values — no hardcoded
numbers in the UI. AI generation credits tracked per user per billing cycle.
Stripe integration is P1. Core rule: never show an ad during a study session,
never paywall core SRS studying. See DECISION-005 for full pricing rules.

**Quality gates that block launch (non-negotiable — see DECISION-006):**
- SRS algorithm must be SM-2 or documented superior implementation (FSRS)
- AI generation tested against real lecture PDFs; less than 5% factual error
- 20 seed decks live on the Explore page before launch day
- Core flows pass QA on Chrome, Firefox, Safari desktop, Safari iPad
- GDPR + COPPA compliance reviewed by Security Auditor before launch
- Stripe integration end-to-end tested in staging before real transactions

**Key architectural decisions needed from PM in Week 1:**
1. Technology stack — must support future React Native or Flutter mobile
   (has implications for web framework choice)
2. SRS algorithm selection — SM-2 vs FSRS vs other; must be documented
3. AI generation provider and prompt architecture with domain context injection
4. Database schema — must accommodate per-user per-card SRS state tracking
   plus public/private deck permissions for the Explore page

---

- Platform: Web primary; iOS/iPad post-launch (Month 3-4)
- Priority: High
- Deadline: August 2026 — fixed, real, non-negotiable
- Blocking gates: DECISION-006 quality gates are hard blockers

---

[PRODUCT OWNER] Discussion point
- Topic: Seed deck creation before launch — who builds the 20 required decks?
- Context: DECISION-006 requires 20 high-quality seed decks live on the Explore
  page before launch day (10 medical, 6 pharmacy, 4 chemistry). These must be
  manually curated and verified for accuracy, especially medical content. This
  is not a dev task — it is a content/editorial task. Does the product team
  commission external medical student reviewers? Does the founder have subject-
  matter expert connections who can verify medical accuracy before launch?
- For: user, researcher
- Date: 2026-04-11

---

[PRODUCT OWNER] Discussion point
- Topic: AI generation accuracy — human review workflow and "report inaccuracy" button
- Context: The Critical Consultant flagged that AI-generated medical cards must
  carry a "AI-generated — please verify" disclaimer, and the 20 seed decks need
  a human review workflow. An additional question: should we build a "report
  inaccuracy" button on AI-generated cards? This is a small dev task with high
  trust and safety value for a medical audience.
- For: pm, researcher
- Date: 2026-04-11

---

[PRODUCT OWNER] Discussion point
- Topic: Chemistry structural diagram rendering — v1.1 scope definition needed
- Context: Chemistry structural diagram support is deferred to post-launch v1.1
  per DECISION-002 P2 and DECISION-003. The researcher needs to scope precisely
  what "structural diagram rendering" means: third-party library (Kekule.js,
  ChemDoodle), custom renderer, or an image-based approach where users upload
  structure images and AI tags/categorizes them? This scoping is required before
  the PM can estimate the post-launch chemistry roadmap.
- For: researcher, pm
- Date: 2026-04-11

---

[PRODUCT OWNER] Discussion point
- Topic: Beta validation timeline for DECISION-005 pricing figures
- Context: DECISION-005 pricing figures are provisional. A private beta of ~200
  users (STRATEGY-002) is planned 3 weeks before launch. The beta must include
  a visible pricing page and track click-through-to-upgrade intent signals, even
  if no real payments are processed during beta. This data must inform whether
  the $7.99/month price point holds or needs adjustment before the public launch.
  Marketing should confirm this is built into the beta plan.
- For: pm, marketing
- Date: 2026-04-11

---
---

# ═══════════════════════════════════════════════════════════════════
# [UX DESIGNER] COMPLETE UI/UX DESIGN SPECIFICATION
# Date: 2026-04-11
# Covers: Design System · Onboarding · Dashboard · Card Creation ·
#         Explore/Sharing · Study/SRS Session · Profile/Settings
# Platform Primary: Web (responsive, iPad-optimized, PWA-ready)
# Platform Secondary: iOS/iPad (design-ready, dev begins Month 1 post-launch)
# Accessibility: WCAG 2.1 AA throughout
# ═══════════════════════════════════════════════════════════════════

---

## [DESIGN-000] Design Foundations & System
- Date: 2026-04-11
- Platform: all
- Type: design system
- Status: approved

### 0.1 — Visual Philosophy

The flashcard app serves students in high-stakes, high-memorization disciplines:
medical school, pharmacy programs, competitive chemistry courses. These users are
under pressure, studying for hours a day. The design must feel:

  - FOCUSED — eliminate visual noise. Every pixel serves a purpose.
  - TRUSTWORTHY — scientific credibility through structured, consistent layouts.
  - FAST — information hierarchy is immediate; no hunting for controls.
  - CALM — not a gamified toy. No aggressive colors, animations, or distractions
    during the study session. Reward states are subtle and earned.
  - MODERN — a generation raised on Linear, Notion, and Arc will not tolerate
    a Circa-2010 interface. Polished type, generous whitespace, clean components.

Reference aesthetics: Linear (precision, speed), Notion (structured flexibility),
Readwise (reading/review flow), Anki (trusted but ugly — we take the trust,
fix the ugly).

---

### 0.2 — Color System

#### Light Mode (default on web)

  Background Layers:
    bg-base       #F8F9FB   Page background, canvas
    bg-surface    #FFFFFF   Cards, panels, modals
    bg-elevated   #F2F4F7   Sidebars, secondary panels
    bg-hover      #EBEDF2   Interactive element hover state
    bg-active     #E3E7EF   Pressed/selected state

  Text:
    text-primary  #0D1117   Body, headings (near-black, not pure black)
    text-secondary #4B5563  Supporting text, labels
    text-tertiary  #9CA3AF  Placeholders, timestamps, disabled
    text-inverse   #FFFFFF  Text on dark/colored backgrounds

  Brand (Primary — Deep Slate-Blue):
    brand-50      #EEF2FF
    brand-100     #E0E7FF
    brand-500     #4F46E5   Primary interactive, buttons, links, focus rings
    brand-600     #4338CA   Primary button hover
    brand-700     #3730A3   Primary button pressed
    brand-900     #1E1B4B   Darkest brand use (headers in dark contexts)

  Success (Correct answer, streak, activation):
    success-50    #F0FDF4
    success-500   #22C55E
    success-600   #16A34A

  Danger (Incorrect answer, overdue cards, errors):
    danger-50     #FFF1F2
    danger-500    #EF4444
    danger-600    #DC2626

  Warning (AI disclaimer badge, streak at risk):
    warning-50    #FFFBEB
    warning-500   #F59E0B
    warning-600   #D97706

  Neutral (borders, dividers, shadows):
    border        #E5E7EB
    border-strong #D1D5DB
    shadow-sm     0 1px 2px rgba(0,0,0,0.05)
    shadow-md     0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.04)
    shadow-lg     0 10px 15px rgba(0,0,0,0.08), 0 4px 6px rgba(0,0,0,0.04)

#### Dark Mode (system preference respected; manual toggle in settings)

    bg-base       #0D1117
    bg-surface    #161B22
    bg-elevated   #21262D
    bg-hover      #30363D
    bg-active     #388BFD1A
    text-primary  #F0F6FC
    text-secondary #8B949E
    text-tertiary  #484F58
    brand-500     #818CF8   (Lighter indigo for dark mode legibility)
    border        #30363D
    border-strong #484F58

Accessibility note: All foreground/background color pairs achieve minimum
4.5:1 contrast ratio (WCAG AA). Brand-500 on bg-surface in light mode: 4.9:1.
Text-primary on bg-base: 15.8:1. All tested.

---

### 0.3 — Typography

Primary typeface: Inter (Google Fonts — zero licensing cost, excellent
legibility on screens, used in Linear/Notion/Vercel — signals quality)
Monospace fallback: JetBrains Mono (for card IDs, code snippets)
Math/chemistry fallback: KaTeX renders LaTeX inline in card bodies (v1.1)

  Type Scale:
    display-2xl   72px / 1.1 / -0.04em   Hero taglines (landing page only)
    display-xl    48px / 1.15 / -0.03em  Page heroes
    display-lg    36px / 1.2 / -0.02em   Modal titles, major headings
    heading-xl    30px / 1.3 / -0.01em   Section headings
    heading-lg    24px / 1.35 / -0.01em  Card titles, panel headings
    heading-md    20px / 1.4 / 0         Sub-section headings
    heading-sm    16px / 1.45 / 0        Component headings
    body-lg       18px / 1.6 / 0         Long-form reading (study card answer)
    body-md       16px / 1.6 / 0         Default body text
    body-sm       14px / 1.5 / 0         Secondary content, labels
    caption       12px / 1.4 / 0.01em    Timestamps, metadata
    overline      11px / 1.3 / 0.08em    Section labels (ALL CAPS)

  All fonts: weight 400 (regular), 500 (medium), 600 (semibold), 700 (bold)
  Study card front (question): heading-lg, weight 600
  Study card back (answer): body-lg, weight 400, line-height 1.7

---

### 0.4 — Spacing & Layout

  Base unit: 4px
    space-1    4px    (micro gaps, icon padding)
    space-2    8px    (compact internal padding)
    space-3    12px   (tight component spacing)
    space-4    16px   (default internal padding)
    space-5    20px   (comfortable internal padding)
    space-6    24px   (section gap, card padding)
    space-8    32px   (major section separation)
    space-10   40px   (page section breaks)
    space-12   48px   (hero/feature spacing)
    space-16   64px   (large layout gaps)
    space-20   80px   (page-level breathing room)

  Border Radius:
    radius-sm   4px    (badges, chips, inline elements)
    radius-md   8px    (buttons, inputs, small cards)
    radius-lg   12px   (panels, modals, floating cards)
    radius-xl   16px   (page sections, hero cards)
    radius-2xl  24px   (study card faces — the dominant UI element)
    radius-full 9999px (avatars, pill buttons, toggle switches)

  Layout Grid (Web):
    Max content width: 1280px
    Sidebar width (dashboard): 240px fixed
    Main content: fluid within 1280px
    Card grid: CSS Grid, auto-fill, min 280px, max 1fr
    Gutter: 24px (desktop), 16px (tablet), 12px (mobile)

---

### 0.5 — Core Components

  BUTTON SYSTEM:
    Primary    bg-brand-500, text-white, hover:bg-brand-600
    Secondary  bg-bg-surface, border-border, text-text-primary, hover:bg-bg-hover
    Ghost      transparent, text-brand-500, hover:bg-brand-50
    Danger     bg-danger-500, text-white, hover:bg-danger-600
    Icon       40x40px or 32x32px, radius-md, ghost style default

    Sizes:
      sm   height:32px, px:12px, font:body-sm
      md   height:40px, px:16px, font:body-md  (default)
      lg   height:48px, px:20px, font:heading-sm
      xl   height:56px, px:24px, font:heading-sm (primary CTAs only)

    All buttons: minimum 44px touch target
    Focus ring: 2px solid brand-500, 2px offset — always visible

  CARD COMPONENT:
    Deck card (library/explore): bg-surface, radius-xl, shadow-md,
      padding-6, hover:shadow-lg, hover:translate-y:-2px
    Study card face: bg-surface, radius-2xl, shadow-lg,
      full-viewport-centered, max-width:680px, padding-10

  NAVIGATION:
    Web Desktop: Left sidebar, 240px fixed, collapsible to 64px icon rail
    Web Mobile/Tablet: Bottom tab bar (5 tabs max)
    Active state: bg-brand-50 left border brand-500 (4px)

  BADGE / CHIP:
    Subject badge:  bg-brand-50, text-brand-700, radius-sm, body-sm
    AI badge:       bg-warning-50, text-warning-700, "AI-generated"
    Verified:       bg-success-50, text-success-700, "Verified Creator"
    Due count:      bg-danger-500, text-white, radius-full (pill)

---

### 0.6 — Motion & Animation

  Duration scale:
    instant     0ms    (hover bg, focus ring)
    fast        100ms  (toggle switches, checkbox)
    default     150ms  (button press, dropdown, tooltip)
    medium      250ms  (panel slide, card expand, modal enter)
    slow        350ms  (page transition)
    deliberate  500ms  (study card flip only — the reveal must feel earned)

  Study card flip: CSS 3D transform, rotateY 180deg, 500ms ease-in-out.
  Correct answer feedback: green pulse ring (200ms), card slides left.
  Incorrect answer feedback: red pulse ring (200ms), card slides right.
  Session complete: confetti only if user scored >= 85%.
  All animations respect prefers-reduced-motion.
  When reduced motion active: card flip is an instant opacity crossfade.

---

### 0.7 — Iconography

  Icon library: Lucide Icons (MIT license, React component)
  Stroke weight: 1.5px default, 2px emphasis
  Size: 16px inline, 20px default, 24px navigation, 32px feature icons
  All navigation icons paired with text labels — never icon-only for
  primary navigation (accessibility requirement).

---

### 0.8 — Accessibility Standards

  1. Color never sole means of conveying information (WCAG 1.4.1)
     Correct/incorrect feedback uses icon + color + animation
  2. All interactive elements reachable via keyboard (WCAG 2.1.1)
     Spacebar flips card; 1/2/3/4 for response ratings
  3. Focus indicators always visible (WCAG 2.4.7)
     2px brand-500 focus ring, never hidden
  4. All images have alt text (WCAG 1.1.1)
     User-uploaded card images require alt text prompt on upload
  5. Form fields have associated labels (WCAG 1.3.1)
     No placeholder-only inputs
  6. ARIA roles for dynamic content (WCAG 4.1.2)
     Study card: role="region", aria-live="polite" on answer reveal
     Progress bar: aria-valuenow/min/max
  7. Minimum touch target 44x44px on all platforms (WCAG 2.5.5)
  8. Text resize to 200% without horizontal scroll (WCAG 1.4.4)
  9. WCAG AA contrast minimum 4.5:1 text, 3:1 UI components

---

## [DESIGN-001] Onboarding Flow
- Date: 2026-04-11
- Platform: web (responsive — desktop, tablet, mobile)
- Type: user flow / wireframes
- User journey: New user to Activated (first SRS session with 10+ cards)
- Activation definition: Completed first SRS session with >= 10 cards
- Target time-to-activation: < 8 minutes from landing page
- Accessibility considerations: No timed steps; progress auto-saved;
  skip available on all non-critical steps; keyboard-navigable throughout
- Notes for frontend: No email gate before first value. Auth only after
  user sees real, personalized cards. Subject question = single tap.
  Three paths given equal visual prominence. (DECISION-001, GROWTH-005)
- Status: approved

### 1.1 — Onboarding Philosophy

Three activation paths with equal visual weight:
  Path A: Upload PDF / Paste Transcript -> AI generation -> Study (Primary)
  Path B: Browse Community Decks (Explore) -> Clone -> Study
  Path C: Create Cards Manually -> Study

Chemistry v1 note: Chemistry users on Path A see an inline note that AI
generation works best for text-based content; for structural diagrams, use
Path C with image upload. (Resolves DECISION-003, GAP-002.)

---

### 1.2 — Screen 1: Landing / Entry Point

  GLOBAL HEADER:
    [LOGO AppName]                         [Sign In]  [Sign Up]

  HERO SECTION (above fold):
    Headline: "Study smarter. Share freely. Never start from zero again."
    Sub: "From your PDF to perfect flashcards in seconds — built for
          medical, pharmacy & chemistry students who can't afford to waste time."

    PRIMARY CTA — PDF Upload Zone (dominant, centered):
      [  Drop your lecture PDF here, or click to upload  ]
      [       — no account required to try —             ]

    SECONDARY CTAs (below upload zone, side by side):
      [Browse Community Decks]   [Create Cards Manually]

    SUBJECT SIGNAL BADGES (below CTAs):
      [USMLE] [NAPLEX] [MCAT] [Orgo] [AP Chem] [Pharmacology]

    60-second demo video (autoplay muted on desktop, poster frame on mobile)

  Design notes:
  - PDF upload zone is the hero element — dominant, centered, full-attention
  - "No account required to try" removes the most common activation barrier
  - Subject badges immediately signal relevance to target users
  - Three paths stacked vertically on mobile; PDF path remains primary

---

### 1.3 — Path A: PDF Upload -> AI Preview -> Account Creation

  STEP A1 — Upload in progress:
    Back button | Filename: "Cardio.pdf"
    Progress bar [34%]
    Status text: "Reading your PDF... Found 847 words. Identifying key concepts..."

    Inline domain question (while upload runs):
      "What are you studying? (helps AI tune accuracy)"
      [Medicine]  [Pharmacy]  [Chemistry]  [Other]
    This is the domain context injection required by DECISION-006 AI quality gate.
    Framed as cooperation ("helps accuracy"), not a form field.

  STEP A2 — AI generation complete — Card Preview (before account required):
    Banner: "47 cards generated from Cardio.pdf"  [Edit All]
    Warning badge: "AI-generated — please verify before studying"
      (warning-50 background, warning-700 text — always visible on AI cards)

    Card preview (5 of 47 shown):
      Card 1/5:
        Q: What is the primary mechanism of action of beta-blockers
           in heart failure management?
        A: Beta-blockers competitively inhibit catecholamines at
           beta-1 adrenergic receptors, reducing heart rate and myocardial
           oxygen demand. In chronic HF, they counteract maladaptive
           sympathetic activation and improve long-term cardiac remodeling.
        Source: Cardio.pdf, p.12    [Edit this card]
      [Prev] [1/5] [Next]

    Account creation prompt (below card preview):
      "Save all 47 cards and start studying"
      "Create your free account — takes 10 seconds"
      [Continue with Google]   [Continue with Email]

  Design notes:
  - Account creation prompted only AFTER user sees real, personalized value
  - "10 seconds" sets expectations — no password required on first signup
  - Google OAuth covers most users; email gets a magic link
  - The 5-card preview is the hook; editing requires account (micro-conversion)

---

### 1.4 — Path B: Browse Community Decks -> Clone -> Study

  STEP B1: Explore page visible without account (see DESIGN-004)

  STEP B2: Deck detail page:
    Deck title: "USMLE Step 1 — Cardiovascular Pathology"
    Meta: "Verified Creator · 312 cards · Used by 2,847 students"
    Creator: @MedStudentMike

    Primary CTA: [Study this deck — free]
    Secondary: [Clone to my library]  [Share]  [Follow]

    Preview: First 10 card questions shown (answers gated — requires account)

    Auth prompt at bottom:
      "Sign in to save your progress and track your SRS"
      [Continue with Google]   [Continue with Email]

---

### 1.5 — Post-Auth: Subject Selection (Single Question, One Tap)

  Triggered ONCE after first authentication. Takes < 10 seconds. Not blockable.

  "Welcome. One quick question."
  "What are you studying? (we'll curate your experience)"

  Large tappable tiles (full card, min 80px height, entire area clickable):
    [Medicine — USMLE, MCAT]
    [Pharmacy — NAPLEX, MPJE]
    [Chemistry — Orgo, AP Chem]
    [Biology]
    [Other]

  [Skip — I'll browse everything] (not hidden — zero friction mandate)

  On selection: immediately saved, redirect back to mid-flow action.
  Starter deck auto-added to library based on selection (GROWTH-006).

---

### 1.6 — Onboarding Flow Diagram

  USER ARRIVES AT LANDING PAGE
         |
    _____|_____________________
    |           |             |
  PATH A      PATH B        PATH C
  Upload PDF  Browse Explore  Create Manually
    |           |             |
  AI Gen      Deck Detail   Card Editor
  Preview     Page              |
    |           |             |
  VALUE SEEN (cards or deck visible before auth)
         |
  AUTH PROMPT (Google / Email magic link)
         |
  SINGLE QUESTION (What are you studying? — 1 tap)
         |
  STARTER DECK SEEDED (GROWTH-006)
         |
  DASHBOARD (CTA: Start First Study Session)
         |
  SRS SESSION (10+ cards)
         |
  [STAR] ACTIVATED [STAR]
  (North Star metric achieved — < 8 minutes)

---

## [DESIGN-002] Dashboard
- Date: 2026-04-11
- Platform: web (responsive)
- Type: wireframe / user flow
- User journey: Returning user opens app -> reviews due cards or manages decks
- Accessibility considerations: Skip-to-main-content link; sidebar
  role="navigation"; main role="main"; keyboard shortcut [S] from anywhere
  to jump to today's study queue
- Notes for frontend: Due card counts fetched fresh on each page load (SRS
  runs server-side). Streak data is a single lightweight API call. Layout
  uses CSS Grid with named areas for responsive reflow.
- Status: approved

### 2.1 — Desktop Layout (>= 1024px)

  GLOBAL HEADER (fixed, 64px):
    [Logo]  ─── [Search decks...]  ───  [Bell]  [Avatar]  [Upgrade to Pro]

  LEFT SIDEBAR (240px, fixed):
    Section: STUDY
      [Dashboard]  (current page indicator: left border brand-500)
      [Study Now]  (due card count badge: danger-500 pill)

    Section: LIBRARY
      [My Decks]
      [Favorites]
      [Imports]

    Section: EXPLORE
      [Explore]
      [Following]

    Section: ACCOUNT
      [Progress]
      [Settings]
      [Upgrade] (only on free plan)

    Footer of sidebar:
      "Free Plan — 47/50 AI cards used"
      [Upgrade to Pro ->]

  MAIN CONTENT:

    TODAY'S FOCUS (top priority card):
      "Day 14 streak [fire icon]"        [Streak Shield]
      "47 cards due · Est. 22 min"       [Start Session ->]

      Deck cards in a 2-column row:
        [Cardio.pdf deck: 47 due] [Study ->]
        [Medicine Starter: 12 due] [Study ->]

    MY DECKS:
      [+ New Deck]                        [Grid view] [List view]
      3-column card grid:
        Deck card: name, card count, due count (red pill), badge (AI/Verified/Manual)

    WEEKLY PROGRESS:
      "247 cards reviewed · 89% accuracy this week"
      Simple bar chart: Mon Tue Wed Thu Fri(today) Sat Sun
      [View detailed analytics ->] (Pro teaser — links to /progress)

### 2.2 — Tablet Layout (768-1023px, iPad)

  GLOBAL HEADER (same as desktop)

  No sidebar — replaced by bottom tab bar:
    [Home]  [Decks]  [Study]  [Explore]  [Profile]

  MAIN CONTENT (full width):
    Today's Focus banner (full width)
    2-column deck card grid
    Weekly progress chart (compact)

### 2.3 — Mobile Layout (< 768px)

  GLOBAL HEADER: [Logo]  [Bell]  [Avatar]

  Greeting: "Good morning, [Name]"

  Priority banner (full width):
    "Day 14 · 47 cards due"
    [Start Session (22 min)]

  My Decks (list format, not grid):
    [Cardio deck — 47 due today] [Study ->]
    [Med Starter — 12 due today] [Study ->]
    [+ Create new deck]

  Weekly summary: "247 cards · 89% accuracy this week"

  BOTTOM TAB BAR (always visible):
    [Home]  [Decks]  [Study]  [Explore]  [Profile]

### 2.4 — Dashboard States

  Empty state (no decks):
    "Your library is empty — let's fix that."
    [Upload a PDF]  [Browse community decks]  [Create first card]

  AI credits warning (40/50 used) — non-blocking top banner, once:
    "You've used 40 of 50 free AI cards this month. [Upgrade to Pro ->]"

  Streak at risk (11pm, no study today) — push + in-app banner:
    "Don't break your 14-day streak — 23 cards take about 10 minutes."
    Dismissible. One per day maximum.

  All caught up (no cards due):
    "You're all caught up! Nothing due today."
    "Your next cards are due tomorrow."
    [Review ahead]

---

## [DESIGN-003] Manual Card Creation
- Date: 2026-04-11
- Platform: web (responsive)
- Type: wireframe / interaction design
- User journey: User creates a new deck and adds cards manually
- Accessibility considerations: Rich text editor keyboard-navigable; image
  upload has alt text prompt; all toolbar buttons have tooltips;
  editor uses role="textbox" aria-multiline="true"
- Notes for frontend: Card editor is lightweight rich text — NOT full markdown.
  Supported formatting v1: Bold, Italic, Underline, Superscript, Subscript
  (essential: H2O, CO2), numbered lists, inline images. No tables in v1.
  LaTeX/KaTeX is v1.1. Autosave every 3 seconds to IndexedDB.
- Status: approved

### 3.1 — New Deck Creation (Modal)

  Modal: "Create a new deck"
    Deck name * (required)
      [placeholder: e.g. USMLE Step 1 — Cardiology]
    Subject tag
      [Medicine dropdown] (auto-filled from onboarding, changeable)
    Exam / topic (optional)
      [placeholder: e.g. USMLE Step 1]
    Visibility
      [Private — only me] [Public — visible in Explore]

    [Cancel]   [Create Deck & Add Cards]

---

### 3.2 — Card Editor (Desktop — Split Layout)

  HEADER ROW:
    [<- My Decks / USMLE Step 1 Cardiology]        [Generate with AI ->]

  LEFT PANEL — Card Editor:
    FRONT (Question) *
      Toolbar: [B] [I] [U] [X^2] [X_2] [List] [Image]
      Text area: Multi-line, heading-lg, question text

    BACK (Answer) *
      Text area: Multi-line, body-lg, answer text

    Hint (optional, collapsible)
      Text area: body-md

    Image (optional)
      [Upload / paste area]
      [Alt text field — shown immediately after upload]

    [Save Card]  [Save + Next]

  RIGHT PANEL — Cards in This Deck:
    Card list (scrollable):
      1. "What is the mechanism of..." [Edit] [Delete]
      2. "Define cardiac tamponade..."  [Edit] [Delete]
      3. "Classic triad of..."          [Edit] [Delete]

    [+ New Card]

    Deck summary: "3 cards"
    [Save & Close]

  Autosave: "Saved" indicator top-right, 2s duration, disappears after.

### 3.3 — Card Editor (Mobile — Single Column)

  HEADER: [<- Cardiology Deck]  [AI Help]
  "Card 4 (new)"

  FRONT (Question)
    Compact toolbar: [B][I][U][X^2][X_2][Image]
    Text area

  BACK (Answer)
    Text area

  Hint    [expand +]
  Image   [expand +]

  [Save Card & Add Next ->]
  [Save & Done]  [3 cards saved so far]

### 3.4 — Key Interaction Notes

  Keyboard shortcuts (desktop):
    Cmd/Ctrl + Enter  -> Save card, open new editor
    Cmd/Ctrl + arrows -> Navigate between cards in right panel
    Cmd/Ctrl + B/I/U  -> Bold / Italic / Underline
    Escape            -> Focus card list

  Tab order: Front textarea -> Back textarea -> Hint -> Image -> Save button

  AI Help inline button:
    While typing a question, [AI Help] offers:
    "Generate an answer for this question" (uses 1 AI credit)
    Generated answer populates the Back field for user review.
    Does NOT auto-save. User must confirm. AI disclaimer badge applies.
    This is an on-ramp to AI for manual-creation users.

  Alt text enforcement:
    After image upload, alt text field appears immediately.
    Non-blocking warning badge persists on card if alt text is missing:
    "Add alt text for accessibility" — not a hard block.

  Image specs: PNG/JPG/GIF/WebP/SVG, max 5MB per image, centered by default.

### 3.5 — Deck Management View (Bulk Actions)

  DECK HEADER: "USMLE Step 1 — Cardiology"   [Study ->]  [+ Add Card]
  "47 cards · Last studied: 2 days ago"

  BULK ACTION BAR:
    [Select all]  [Delete selected]  [Export]  [Edit deck settings]

  CARD LIST (expandable rows):
    [checkbox] 1. "What is the mechanism of action of..."
               "Last reviewed: 3 days ago · Next interval: 7 days"
               [Edit]  [Delete]
    [checkbox] 2. "Define cardiac tamponade..."
               "Due today · Interval: 1 day"
               [Edit]  [Delete]

---

## [DESIGN-004] Explore / Sharing Page
- Date: 2026-04-11
- Platform: web (this is the primary SEO surface — SSR required)
- Type: wireframe / user flow / SEO page structure
- User journey: User discovers community decks by subject -> studies or
  clones a deck -> shares a deck they created
- Accessibility considerations: Deck grid uses role="list" / role="listitem";
  filter controls are role="group" with aria-labelledby; search has
  aria-label; social share buttons include aria-label per platform;
  all deck cards are keyboard focusable
- Notes for frontend: /explore and all sub-routes MUST be SSR for SEO.
  og:image is server-generated per deck (use @vercel/og or equivalent).
  JSON-LD type: EducationalOccupationalProgram on all deck pages.
  URL structure: /explore/[subject]/[deck-slug]
  All page titles: "[Deck Name] — Free Flashcards | [App Name]"
  (DECISION-006 Explore quality gate, DECISION-002 SEO requirement)
- Status: approved

### 4.1 — Explore Hub (/explore)

  PAGE TITLE: "Explore Community Decks"
  SUBTITLE: "Discover, study, and share flashcard decks for medical,
              pharmacy & chemistry students."

  SEARCH BAR (full width):
    [Search decks, subjects, creators...]

  BROWSE BY SUBJECT (horizontal tile row):
    [Medicine — 124 decks]  [Pharmacy — 87 decks]
    [Chemistry — 63 decks]  [Biology — 41 decks]

  EXAM CATEGORY CHIPS (wrapping horizontal row):
    [USMLE Step 1] [USMLE Step 2] [MCAT] [NAPLEX] [MPJE]
    [Orgo] [Gen Chem] [AP Chemistry] [Biochemistry] [Anatomy]

  TRENDING THIS WEEK (3-column deck card grid):
    [Deck cards — see 4.5 for deck card component spec]

  RECENTLY ADDED:
    Sort: [Most Popular dropdown]
    [Full deck card grid — 3 col desktop, 2 col tablet, 1 col mobile]
    [Load more decks]

### 4.2 — Subject Hub Page (/explore/usmle-step-1)

  H1: "USMLE Step 1 Flashcard Decks"
  SEO description: "Best community-created spaced repetition decks for
  USMLE Step 1 preparation. Browse, study, and share."

  FILTER BAR:
    Topic: [All] [Cardiology] [Pulmonology] [GI] [Neuro] [Pharm] [Pathology]
    Sort: [Most Popular dropdown]

  FEATURED CREATOR CARD:
    [Avatar] MedStudentMike  [Verified Creator badge]  [Follow]
    "MS3 at [University] · 15 public decks · 12,450 students"
    [View all decks by this creator ->]

  DECK GRID (full list with filter applied)

### 4.3 — Individual Deck Page (/explore/medicine/usmle-step1-cardio-path)

  BREADCRUMB: [Explore] / [Medicine] / [USMLE Step 1]

  DECK TITLE (H1): "USMLE Step 1 — Cardiovascular Pathology"

  CREATOR ROW:
    [Avatar] MedStudentMike  [Verified Creator]
    "Last updated: March 2026 · 312 cards · Medicine / USMLE Step 1"

  PRIMARY ACTIONS (3 buttons):
    [Study Free — primary brand button]
    [Clone to Library — secondary]
    [Share — ghost with icon]

  SOCIAL PROOF:
    "2,847 students studying · 4.9/5 (312 ratings)"
    "Average mastery time: 8-12 weeks of daily review"

  ABOUT THIS DECK: Creator-written description (Markdown rendered)
    Topics: Cardiac channelopathies, Cardiomyopathies, Valvular disease...

  CARD PREVIEW (first 10 questions):
    Card question list (read-only)
    [Show answer] — requires account (gentle gate, not aggressive)

  SIMILAR DECKS: 3 deck cards (auto-related by subject/exam tag)

  SEO / STRUCTURED DATA (not visible — for frontend):
    <title>[Deck Name] — Free Flashcards | [App Name]</title>
    JSON-LD: EducationalOccupationalProgram with name, description,
    educationalCredentialAwarded, numberOfCredits fields.
    og:title, og:description, og:image (server-generated card preview).

### 4.4 — Share Sheet

  Triggered by [Share] button on any deck. Full-width sheet on mobile.
  Modal on desktop.

  HEADER: "Share this deck"  [X close]

  DECK PREVIEW:
    "USMLE Step 1 — Cardiovascular Pathology"
    "312 cards · Verified Creator"

  LINK ROW:
    [https://app.com/explore/med/usmle-cardio]  [Copy link]
    (link includes referral parameter when shared by logged-in user)

  SHARE TO:
    [Instagram]  [Twitter/X]  [WhatsApp]
    [Email]      [iMessage]   [Copy URL]

  PREVIEW IMAGE SECTION:
    Landscape (1200x630px):
      Background: subject gradient (Medicine = brand indigo, Pharmacy = emerald,
      Chemistry = amber). Large deck title. "Verified ✓" badge. Card count.
      App URL bottom-right. This image IS the og:image.

    Stories (9:16):
      Same gradient. Bold deck title centered. Card count. App name.
      "Swipe up to study free" instruction. Optimized for Instagram Stories.

  Design notes:
  - Preview images are server-generated — not client-side
  - Both format images are downloadable (design for iOS Share Sheet too)
  - The social image must look premium — this is a key part of the viral loop

### 4.5 — Deck Card Component (Reusable, used throughout Explore and Dashboard)

  CARD STRUCTURE:
    Top border: 4px, subject color
      Medicine: brand-500 (deep indigo)
      Pharmacy: #059669 (emerald-600)
      Chemistry: #D97706 (amber-600)
      Biology: #7C3AED (violet-600)
    
    Subject label: overline text, subject badge pill
    Deck title: heading-md, semibold, 2 lines max, ellipsis
    Meta row: "312 cards · Verified Creator" (body-sm, text-secondary)
    Social proof: "2,847 students" (body-sm, text-secondary)
    Creator row: small avatar + username (caption)
    
    Divider line
    
    Action row:
      [Study Free]  [Clone]  [Share]

  Hover state: shadow-lg, translate-y -2px (150ms ease-out)
  Focus state: 2px brand-500 focus ring, no translate

---

## [DESIGN-005] Study / SRS Session
- Date: 2026-04-11
- Platform: web (responsive) — THE most important screen in the product
- Type: wireframe / interaction design / state machine
- User journey: User starts session -> reviews cards -> gets SRS rating ->
  session complete with summary
- Accessibility considerations: FULL keyboard navigation required — this is
  the core product action; CSS 3D transform for flip (not JS visibility);
  role="region" aria-label="Study card"; aria-live="polite" on answer reveal;
  screen reader announces "Question: [text]" and "Answer: [text]";
  response buttons aria-hidden until answer revealed; focus management explicit
- Notes for frontend: Study session is a client-side state machine after
  initial deck load. SRS rating sent async (fire-and-forget with localStorage
  queue fallback). Card flip: CSS rotateY 180deg, 500ms. Response buttons
  ONLY visible/focusable after answer revealed. Keyboard: Space = flip,
  1/2/3/4 = Again/Hard/Good/Easy. (DECISION-006 persistence quality gate)
- Status: approved

### 5.1 — Pre-Session Screen

  HEADER: [<- Dashboard]

  "Ready to study?"
  Deck name: "USMLE Step 1 — Cardiovascular Pathology"

  SESSION INFO BOX:
    "47 cards due today"
    "Estimated time: ~22 minutes"
    Settings:
      Max cards this session: [47 dropdown] (options: 20 / 47 / All)
      Order: [Due first dropdown] (Due first / Random / New first)

  [Start Session — primary xl button]
  [<- Back to deck]

### 5.2 — Session: Question State

  PROGRESS BAR: thin, full-width, brand-500 fill, animated increment
  LEFT: [Pause/Exit]  |  CENTER: "23 / 47"  |  RIGHT: "Day 14 [fire]"

  STUDY CARD (centered, max-width 680px, radius-2xl, shadow-lg):
    Card FRONT face:
      Question text (heading-lg, weight 600, centered vertically)
      Optional image (centered, max 60% card height)

      Bottom area: "Tap to reveal answer" (caption, text-tertiary, animated pulse)

  BOTTOM TOOLBAR:
    [Bookmark]  [Flag for review]  [Edit this card]
    (these remain accessible so user can annotate without leaving session)

### 5.3 — Session: Answer Revealed State

  Card FLIPS (CSS rotateY 180deg, 500ms ease-in-out)

  STUDY CARD (back face):
    Question echo (heading-sm, text-secondary — small at top)
    Divider line
    Answer text (body-lg, weight 400, line-height 1.7 — generous for reading)
    Optional image
    Hint text (if set): italic, text-secondary, below answer
    Source reference (if AI-generated): "Source: Cardio.pdf, p.14" (caption)
    "AI-generated — please verify" badge (if applicable) — warning style, small

  RATING BUTTONS (appear below card, 4 equal width):
    [Again]  [Hard]  [Good]  [Easy]
    Colors:
      Again: danger border + bg, "< 1 min"
      Hard:  warning border + bg, "< 1 day"
      Good:  brand border + bg,   "4 days"  (visually primary — default choice)
      Easy:  success border + bg, "8 days"

  Keyboard shortcuts shown below buttons on first 10 cards only:
    "1 = Again  2 = Hard  3 = Good  4 = Easy  Space = Good"

### 5.4 — Post-Rating Animation

  Again: red pulse ring (200ms) -> card slides right -> next card slides in from left
  Hard:  subtle gray pulse -> card slides left -> next card slides in from right
  Good:  green pulse ring (200ms) -> card slides left -> next card slides in
  Easy:  green pulse + gold star particle -> card slides left -> next card

  Progress bar advances. Card counter increments (e.g., 23 -> 24 of 47).
  Next card enters with slide-up-and-fade (250ms ease-out).

### 5.5 — Smart Catch-Up Mode (3+ days missed)

  Shown INSTEAD of normal pre-session screen when backlog detected.

  "Welcome back"

  "You have 312 cards due (3 days missed)."
  "That's a lot — we've prioritized the 47 most important ones."

  [Study today's priority batch (47 cards, ~22 min) — primary button]
  [Study all 312 cards instead] (de-emphasized link — "only if you have time")

  Explanatory note:
  "Studying the priority batch consistently is better than
   studying all 312 cards once and burning out."

  Design principle: empathetic, evidence-based, not guilt-inducing.
  This directly resolves Anki's #1 churn trigger (GROWTH-008, DECISION-006).

### 5.6 — Session Complete Screen

  CHECK MARK ICON (large, success-500)
  "Session complete!"

  Deck name

  RESULTS BOX:
    "47 cards reviewed"
    Easy: 12   Good: 23   Hard: 9   Again: 3
    "Accuracy: 89% · Time: 19 minutes"
    "Next due: 8 cards tomorrow"

  STREAK LINE:
    "Day 14 streak maintained! Keep it up." [fire icon]
    (confetti particles only if accuracy >= 85% — not for poor sessions)

  SHARE BOX:
    "Share your results"
    "I just reviewed 47 USMLE cardiology cards with 89% accuracy"
    Preview: auto-generated share image (stat card, study session summary)
    [Share to Instagram]  [Share to Twitter]  [Copy]

  CTAs:
    [Study another deck]   [<- Back to dashboard]

  Note: For accuracy < 60%, UI is supportive not celebratory:
  "3 cards need more work — they'll come back soon. That's how SRS works."
  No confetti. Gentle encouragement.

### 5.7 — Study Session State Machine

  [START SESSION]
         |
         v
  LOADING (deck prefetched, cards ordered by SRS priority)
         |
         v
  QUESTION_SHOWN -------[bookmark/flag/edit]-------> unchanged
         |
      [flip]
         |
         v
  ANSWER_REVEALED
         |
      [Again|Hard|Good|Easy]
         |
         +-- Send rating to backend (async, queued if offline)
         |
         v
  CARD_RATED
         |
    _____|______________
    | more cards?       | no cards left
    v                   v
  NEXT_CARD        SESSION_COMPLETE
    |                   |
    |                   v
    |             SUMMARY SCREEN
    |
    v
  QUESTION_SHOWN (loop)

  [PAUSE] at any time: session state preserved in memory + localStorage
  [EXIT]: confirmation dialog -> rates all unrated cards as "Hard" on exit

---

## [DESIGN-006] User Profile & Settings
- Date: 2026-04-11
- Platform: web (responsive)
- Type: wireframe / information architecture
- User journey: User manages account, views progress, customizes experience,
  manages subscription
- Accessibility considerations: Settings uses role="main"; all form controls
  have visible labels; toggle switches have aria-checked + role="switch";
  dangerous actions require typing "DELETE"; all sections navigable by
  heading keyboard shortcuts
- Notes for frontend: Two separate routes:
  /profile/[username] — public, SEO-indexed creator page
  /settings — private, account management SPA with tabs
  Public profile is a content page (SSR for SEO/creator discovery).
  Settings is client-side rendered (no SEO value, private data).
- Status: approved

### 6.1 — Public Creator Profile Page (/profile/username)

  PROFILE HEADER:
    [Avatar 80px]  Username  [Verified Creator badge]
    [Follow button]  [Share Profile button]
    Bio text (user-written)
    "15 public decks · 12,450 students following"
    "Member since September 2026"

  PUBLIC DECKS (grid, same deck card component as Explore):
    Sort: [Most Popular dropdown]
    [Full deck card grid — 3 col desktop, 2 col tablet, 1 col mobile]

  Empty state (no public decks):
    "[Username] hasn't shared any public decks yet."
    [Browse all decks in Explore ->]

### 6.2 — Settings Page (/settings) — Tab Navigation

  TABS: [Profile] [Study] [Notifications] [Appearance] [Account]

  TAB: PROFILE
    Profile photo  [Current photo]  [Change photo]
    Display name   [text input]
    Username       [@username input]
    Bio            [textarea]
    Subject focus  [dropdown]
    Public profile [toggle ON/OFF]

    [Save changes button]

  TAB: STUDY
    Daily study goal           [dropdown: 20 cards/day]
    Session card limit         [dropdown: 50 cards max]
    Card order                 [dropdown: Due first]
    Exam Mode (streak pause)   [Set exam date button]
    Answer reveal style        [Flip / Slide / Fade radio]
    Show keyboard shortcuts    [toggle]
    Auto-advance after rating  [toggle — OFF by default, tap required]

  TAB: NOTIFICATIONS
    Daily study reminder       [toggle ON]
    Reminder time              [time picker — default: detected peak hour]
    Streak at risk (11pm)      [toggle ON]
    New follower               [toggle ON]
    New comment on my deck     [toggle ON]
    Weekly digest email        [toggle ON]
    Marketing emails           [toggle OFF]

  TAB: APPEARANCE
    Theme                [System / Light / Dark dropdown]
    Card font size       [Small / Medium / Large / X-Large]
    Reduce motion        [toggle — auto-synced with system preference]
    High contrast mode   [toggle]

  TAB: ACCOUNT
    Email               [current email]  [Change email]
    Password            [Change password]
    .edu discount       [Verify .edu email ->] (30% off annual)

    SUBSCRIPTION:
      "Current plan: Free (47/50 AI cards used this month)"
      Upgrade card:
        "Upgrade to Pro — from $4.17/month"
        "Unlimited AI generation · Advanced analytics · Offline"
        [View plans ->]

    DATA:
      [Export my data (JSON)]  [Export cards (CSV)]
      [Import from Anki (.apkg)] — greyed: "Coming soon" (P2 feature)

    DANGER ZONE (warning border, visually separated):
      "Delete account"
      "This permanently deletes all your cards, decks, and study history.
       This cannot be undone."
      [Delete my account] — triggers confirmation modal requiring user
      to type "DELETE" before proceeding.

### 6.3 — Progress Dashboard (/progress)

  STATS ROW (4 metric cards):
    [Day 14 streak]   [1,847 cards reviewed]   [89% accuracy]   [3 active decks]
    (all: this month)

  STUDY CALENDAR:
    GitHub-style activity heatmap (90 days)
    Color scale: none / 1-10 / 11-30 / 31-60 / 60+ cards per day
    Interactive: hover shows card count for that day

  PER-DECK PROGRESS:
    USMLE Cardio    [progress bar] 78% mastered
    Med Starter     [progress bar] 52% mastered
    Anatomy         [progress bar]  8% mastered

  ADVANCED ANALYTICS (Pro gate):
    Lock icon + teaser:
    "Unlock retention curves, predicted mastery dates, and per-card
     accuracy trends with Pro."
    [Upgrade to Pro — from $4.17/month ->]
    (contextual prompt, not interrupting modal — DECISION-005 rule 4)

---

## [DESIGN-007] Pricing / Upgrade Page (/pricing)
- Date: 2026-04-11
- Platform: web
- Type: wireframe
- Notes for frontend: Default toggle = Annual (not Monthly) per DECISION-005.
  ALL price values from config — never hardcoded. Stripe checkout opens
  in same tab (no popups — popup blockers break conversion). Upgrade page
  reachable from: sidebar, settings, contextual AI limit prompt.
  The contextual AI limit prompt is INLINE — not a modal, never interrupts
  a study session. (DECISION-005 pricing rules 4 and 6)
- Status: approved

### 7.1 — Pricing Page Layout

  HEADER: "Choose your plan"

  BILLING TOGGLE (defaults to Annual):
    [Monthly]  ---[Annual (save 48%)]---  [.edu Annual]

  THREE-COLUMN PLAN CARDS:

    FREE TIER:
      "$0 forever"
      Inclusions:
        + Unlimited manual cards
        + Unlimited SRS studying
        + Full Explore page access
        + Public deck sharing
        + 50 AI cards/month
        + NO ads during review sessions (any plan)
      [Current Plan]

    STUDENT PRO (highlighted — "Most Popular" badge):
      Annual: "$4.17/month — billed $49.99/year"
      Monthly: "$7.99/month" (shown when Monthly toggle active)
      All Free tier features, PLUS:
        + Unlimited AI generation from PDFs
        + Advanced SRS analytics dashboard
        + Offline mode (mobile app)
        + Priority AI generation speed
        + .edu discount eligible
      [Start Pro — $49.99/year]
      "Cancel anytime · 30-day money-back guarantee"

    LIFETIME PLAN:
      "$159.99 one-time payment"
      "All Pro features forever"
      [Get Lifetime Plan]

  .EDU DISCOUNT BANNER:
    "Verified .edu email? Get 30% off Annual -> $34.99/year"
    [Verify my .edu email ->]

  FOUNDING MEMBER OFFER (first 30 days post-launch only):
    "FOUNDING MEMBER — ends in [LIVE COUNTDOWN]"
    "Lifetime Plan at $99.99 (37% off regular $159.99)"
    "Only available first 30 days post-launch. Real expiry. No extensions."
    [Get Founding Member Plan — $99.99]

  TRUST FOOTER:
    "What you will NEVER see with any plan:"
      - Ads during flashcard review sessions (any plan, ever)
      - Core SRS features locked behind a paywall
      - Your cards deleted if you downgrade

---

## [DESIGN-008] Cross-Platform Responsive Breakpoints
- Date: 2026-04-11
- Platform: all
- Type: design system / layout
- Status: approved

  Breakpoints:
    xs   < 480px     Mobile portrait
    sm   480-767px   Mobile landscape / small tablet
    md   768-1023px  Tablet portrait (iPad — HIGH PRIORITY)
    lg   1024-1279px Laptop / tablet landscape
    xl   1280-1535px Desktop
    2xl  >= 1536px   Wide desktop

  Key responsive rules:
    Sidebar: visible >= 1024px; collapses to bottom tab bar below 1024px
    Card grid: 3 col >= 1024px; 2 col 768-1023px; 1 col < 768px
    Study card: max-width 680px, centered, full-height on mobile
    Bottom tabs: always visible below 1024px
    Touch targets: all elements >= 44x44px on all breakpoints
    Font size: never smaller than 14px on any breakpoint

  iPad-specific (768px / md breakpoint) — CRITICAL:
    iPad gets the full-feature layout, NOT the mobile fallback.
    Deck grid: 2 columns. Sidebar: collapses to bottom tab bar.
    Study session: full-screen, single card centered.
    This is intentional — iPad is a primary study device for medical
    students (DECISION-004). iPad users should feel the app was built
    for them, not shrunk from desktop.

---

## [DESIGN-009] Edge States & Error Design
- Date: 2026-04-11
- Platform: all
- Type: interaction design / component states
- Notes for frontend: Every loading, empty, and error state designed before
  handoff. No undefined states in the UI.
- Status: approved

  LOADING STATES:
    Skeleton screens (not spinners) for page loads:
      Dashboard: pulsing skeleton cards
      Explore: pulsing skeleton deck grid
      Study session: single card skeleton -> instant render on load
    Long operations > 2 seconds (AI generation, export):
      Full progress bar with status text ("Reading PDF... 34%")
      Cancel button always available
      Never a spinner alone

  EMPTY STATES:
    No decks in library:
      Simple line-art illustration (on-brand, not clip art)
      Headline + 3 action CTAs

    No cards due today:
      "You are all caught up! Nothing due today."
      "Your next cards are due tomorrow."
      [Review ahead]

    Search with no results:
      "No decks found for '[query]'"
      [Browse by subject ->]

  ERROR STATES:
    Network offline during study:
      Non-blocking top banner: "Offline — your progress is saved locally"
      Study session continues from local cache.
      SRS ratings queued, synced on reconnect.

    AI generation failure:
      "We could not generate cards from this file."
      Common reasons listed: scanned PDF, password-protected, too short
      [Try again]  [Create cards manually instead]

    Auth / session expired:
      Full-page soft redirect to sign-in.
      "Your session expired — sign in to continue where you left off."
      After sign-in: redirect back to original destination.

    404:
      "This deck does not exist or was made private."
      [<- Browse Explore]  [<- Go to dashboard]

    Payment failure:
      Inline error below card field (not a separate page).
      Specific Stripe error messages surfaced (not generic "failed").

---

## [DESIGN-010] Key User Flows Summary
- Date: 2026-04-11
- Platform: all
- Type: user flow diagram
- Status: approved

  CRITICAL PATH — New User to Activated (North Star, < 8 min):
    Landing -> Upload PDF -> AI Preview (5 cards) -> Auth Prompt
    -> Subject Question (1 tap) -> Dashboard (starter deck added)
    -> SRS Session -> [ACTIVATED at card 10]
    -> Session Complete -> Share results

  Friction eliminated:
    - No email before first value
    - No mandatory profile before deck
    - No paywall before studying (50 free AI cards)
    - No ads ever in study session

  CORE LOOP — Returning User Daily Habit:
    Notification -> App -> Dashboard (streak + due count immediate)
    -> [Start Session] -> SRS Review -> Session Complete
    -> Share or Browse -> Next session CTAs or logout

  DISCOVERY LOOP — Organic Growth / SEO:
    Google -> /explore/usmle-step-1 -> Deck page -> [Study Free]
    -> Subject question -> Auth -> Session -> [ACTIVATED]

  SHARING LOOP — Viral Growth:
    User completes session -> Share results image -> Friend sees on Instagram
    -> App URL in image -> Landing page -> Activated

  UPGRADE LOOP — Free to Paid:
    Free user hits 50 AI card limit -> Contextual inline prompt
    -> Pricing page (annual view default) -> Stripe checkout
    -> Confirmation -> Return to flow (no session interruption)

---

## [UX DESIGNER] Frontend Implementation Priority & Critical Notes
- Date: 2026-04-11
- Topic: Implementation priority and critical technical notes for handoff
- Platform: web
- For: frontend

  IMPLEMENTATION ORDER (P0 — build in this sequence):
    1. Design system tokens as CSS custom properties — set up before any
       component work. All color, typography, spacing as CSS variables.
    2. Study session UI (DESIGN-005) — the core product moment.
       Must be pixel-perfect and fully keyboard accessible before launch.
    3. Dashboard layout (DESIGN-002) with all responsive breakpoints.
    4. Explore page (DESIGN-004) — SSR required, must be prioritized early
       for SEO indexing window.
    5. Card editor (DESIGN-003)
    6. Onboarding flow (DESIGN-001)

  CRITICAL IMPLEMENTATION NOTES:

    1. CSS 3D card flip (DESIGN-005):
       Use CSS transform: rotateY(180deg), NOT JavaScript visibility toggle.
       Required CSS:
         .card-container { transform-style: preserve-3d; }
         .card-face { backface-visibility: hidden; }
         .card-back { transform: rotateY(180deg); }
         .card-container.flipped { transform: rotateY(180deg); }
       Duration: 500ms cubic-bezier(0.4, 0.0, 0.2, 1.0)
       Reduced motion: opacity crossfade at 150ms instead.

    2. Response buttons (DESIGN-005):
       MUST NOT be visible or focusable while question is showing.
       Use aria-hidden="true" + display:none until answer is revealed.
       After flip completes: 50ms setTimeout before making visible
       (prevents accidental key presses during animation).
       Keyboard mapping active from moment answer is visible:
         1 = Again, 2 = Hard, 3 = Good, 4 = Easy, Space = Good

    3. SRS rating persistence (DECISION-006 hard quality gate):
       Fire-and-forget POST to backend.
       Store in localStorage queue as fallback.
       Sync queue on next page focus event or reconnect.
       Show "Saved locally" indicator if offline.
       Data loss here is a launch blocker — treat as P0 reliability.

    4. Explore page SSR (DESIGN-004, DECISION-006 quality gate):
       /explore, /explore/[subject], /explore/[subject]/[slug] = all SSR.
       og:image must be server-generated per deck page.
       JSON-LD: EducationalOccupationalProgram schema on all deck pages.
       Page title format: "[Deck Name] — Free Flashcards | [App Name]"

    5. Paywall trigger (DECISION-005 pricing rules 4 and 6):
       The AI limit prompt is an INLINE component — not a modal.
       It renders in place of the "Generate with AI" button at 50/50 credits.
       It NEVER interrupts a study session.
       All price values from environment config — never string literals in JSX.

    6. Image alt text (DESIGN-003, WCAG 1.1.1):
       Show persistent non-blocking warning badge on card if image uploaded
       without alt text: "Add alt text for accessibility"
       Not a hard block — card can be saved. Warning persists until fixed.

    7. Theme implementation (DESIGN-000.2):
       CSS custom properties swapped at :root level.
       System preference (prefers-color-scheme) sets default.
       Manual override stored in localStorage.
       No flash of wrong theme: inline script in <head> sets class
       before first paint.

    8. Focus management (DESIGN-000.8, accessibility):
       After card flip: programmatically move focus to "Again" (first rating btn).
       After rating: move focus to new question card region.
       Screen reader announces new question via aria-live="polite".
       NEVER use outline: none without a replacement focus style.

    9. Touch targets (DESIGN-000.8, WCAG 2.5.5):
       All buttons minimum 44x44px on all breakpoints.
       On mobile: response buttons fill full screen width (4 equal columns).
       Study card: entire card surface is the tap target for flip on mobile.

    10. AI-generated card badge (DESIGN-001, DECISION-006):
        "AI-generated — please verify" badge visible on:
          - AI preview screen (before account creation)
          - Deck editor view for AI-generated cards
          - Study session card back (small, non-distracting)
          - Deck detail page on Explore if deck is AI-generated
        Badge: warning-50 background, warning-700 text.
        Removed when creator manually marks card as "Verified"
        OR when creator edits any field on the card (auto-verify on edit).

---

## [UX DESIGNER] Open Questions for Product Owner
- Date: 2026-04-11
- Topic: Design decisions requiring product input before final dev handoff
- For: product-owner

  QUESTION 1 — Card editor: Rich text depth
  The card editor (DESIGN-003) supports Bold, Italic, Underline, Sub/Super,
  numbered lists, and inline images. Should we also include colored text
  highlights? High-value for medical students highlighting drug names.
  Low implementation cost. Recommend: yes for v1. Awaiting confirmation.

  QUESTION 2 — Study session: Audio card support
  Should v1 support audio on card faces (e.g., pronunciation for pharmacy
  drug names)? Requires recording/playback component. Recommend: defer to P2
  unless pharmacy user research shows it is critical. Awaiting direction.

  QUESTION 3 — Explore: Deck ratings and reviews
  Deck detail page shows star ratings. Should users also leave text reviews?
  Text reviews add trust signal but add moderation burden.
  Recommend: star rating only in v1, text reviews in P2. Awaiting confirmation.

  QUESTION 4 — Following feed on dashboard
  When a user follows a creator, should they see new decks from followed
  creators in a "Following" feed on the dashboard? Increases engagement with
  the creator flywheel. Recommend: yes — simple list only, not an activity feed.
  Awaiting direction.

  QUESTION 5 — AI disclaimer auto-removal
  Currently "AI-generated" badge is permanent until creator marks verified.
  Should the badge auto-remove when a creator edits any field on the card?
  Editing implies review. Reduces friction for large AI decks.
  Recommend: yes — auto-mark verified on first card edit. Awaiting confirmation.


---

## [DESIGN-011] Deck Detail / Settings Screen
- Date: 2026-04-11
- Platform: web (responsive, iPad-optimized)
- Type: wireframe / interaction design
- User journey: Owner views and manages a specific deck — cards, study config,
  sharing, and destructive actions.
- Design decision: Five-tab layout (Overview, Cards, Study Settings, Share,
  Danger Zone). Primary CTAs (Study Now, Share) pinned in header across all
  tabs. Per-card SRS state exposed in Cards tab for full algorithmic
  transparency. Danger Zone is a separate tab — not a buried settings
  item — making destructive actions discoverable but never accidentally hit.
- Accessibility: role="tablist"/"tab"/"tabpanel" for tab navigation.
  Delete dialog uses aria-modal="true" with focus trapped. All stat numbers
  have sr-only descriptive labels. Danger actions require typed confirmation
  (keyboard accessible — no mouse-only friction).
- Notes for frontend: Owner route: /decks/[id]. Public viewer route:
  /explore/[subject]/[slug] (DESIGN-004). Visibility toggle triggers
  near-real-time Explore index update. Short URL app.io/d/[id] via redirect
  table. .apkg export is server-side, delivered via signed download URL.
  Virtual scrolling for decks > 100 cards in Cards tab.
- Status: approved

────────────────────────────────────────────────────────────────────────────────
ASCII WIREFRAME — DECK DETAIL (DESKTOP, >1024px)
────────────────────────────────────────────────────────────────────────────────

BREADCRUMB:  [← My Library]  /  Cardiology Lecture 3

  ┌─[4px subject-color top bar]───────────────────────────────────────────────┐
  │  Cardiology Lecture 3                          [✏ Rename inline]          │
  │  38 cards · Medicine / Cardiology · Private    [body-sm, text-secondary]  │
  │                                                                            │
  │  HEADER TOOLBAR:                                                           │
  │  [▶ Study Now — primary]  [↗ Share]  [✏ Edit Cards]  [⋯ More ▾]          │
  │  More ▾: Download .apkg · ✨ Regenerate · Duplicate · ─── · 🗑 Delete    │
  ├────────────────────────────────────────────────────────────────────────────┤
  │  [Overview]  [Cards (38)]  [Study Settings]  [Share]  [⚠ Danger Zone]    │
  ├────────────────────────────────────────────────────────────────────────────┤

  ─── OVERVIEW TAB ──────────────────────────────────────────────────────────

  ┌─── MASTERY STATS ────────────────────────────────────────────────────────┐
  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
  │  │ 38 total │ │ 65%      │ │ 12 due   │ │ 89%      │ │ 14 days  │      │
  │  │  cards   │ │ mastered │ │  today   │ │ accuracy │ │  in lib  │      │
  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
  │                                                                          │
  │  SRS BREAKDOWN (text label + bar — never chart-only):                   │
  │  New      ██░░░░░░░░░░░░░░  4 cards  (10%)                              │
  │  Learning ██████░░░░░░░░░░  8 cards  (21%)                              │
  │  Review   ████████████░░░░ 20 cards  (53%)                              │
  │  Mastered ████████░░░░░░░░  6 cards  (16%)                              │
  │                                                                          │
  │  Next session:  12 cards due today · Est. ~6 min                        │
  └──────────────────────────────────────────────────────────────────────────┘

  ┌─── DECK INFO ─────────────────────────────────────────────────────────────┐
  │  Name         Cardiology Lecture 3               [✏ Rename]              │
  │  Subject      Medicine / Cardiology              [Change ▾]              │
  │  Tags         [#USMLE] [#Step1] [#Cardiology]   [+ Add tag]              │
  │  Visibility   ● Private   ○ Public               [Toggle]                │
  │               If Public → listed at /explore/medicine/cardiology-l3      │
  │  Created      2026-04-01  ·  Last studied: 2026-04-11                    │
  │  Source       ✨ AI-generated from "Cardiology Lecture 3.pdf"            │
  └───────────────────────────────────────────────────────────────────────────┘

  ┌─── RECENT ACTIVITY ───────────────────────────────────────────────────────┐
  │  Apr 11  38 cards · 89% accuracy · 19 min                                │
  │  Apr 10  24 cards · 92% accuracy · 12 min                                │
  │  Apr  8  31 cards · 78% accuracy · 16 min                                │
  │  [View full history →]                                                    │
  └───────────────────────────────────────────────────────────────────────────┘

  ─── CARDS TAB ─────────────────────────────────────────────────────────────

  TOOLBAR: [🔍 Search cards...]  [Filter: All ▾]  [Sort: Card # ▾]  [+ Add card]

  Filter options: All / New / Learning / Review / Mastered / AI-generated / Flagged

  ┌────┬──────────────────────────────────────────┬───────────┬─────────────┐
  │ ☐  │ Question (truncated)                     │ SRS State │ Actions     │
  ├────┼──────────────────────────────────────────┼───────────┼─────────────┤
  │ ☐  │ What is the Frank-Starling mechanism?    │ 🟢 Review │ [Edit][⋯]  │
  │ ☐  │ Define cardiac output.                   │ 🟡 Learn  │ [Edit][⋯]  │
  │ ☐  │ What is preload?                         │ 🟢 Review │ [Edit][⋯]  │
  │ ☐  │ What is afterload?               ⚠ AI   │ 🔵 New    │ [Edit][⋯]  │
  │ ☐  │ Define ejection fraction.                │ 🟡 Learn  │ [Edit][⋯]  │
  │ .. │ ...                                      │ ...       │ ...         │
  └────┴──────────────────────────────────────────┴───────────┴─────────────┘
  [⋯] row menu: View full card · Edit · Reset SRS for this card · ─── · 🗑 Delete

  EXPANDED ROW (click to expand inline):
    Front: "What is the Frank-Starling mechanism?"
    Back:  "Intrinsic ability of heart to increase SV with increased preload."
    Hint:  "Think preload and contractility"
    Source: Cardiology Lecture 3.pdf, p.4
    ⚠ AI-generated — please verify
    Next review: 4 days · Ease factor: 2.5 · Interval: 4d
    [Edit this card]  [Reset SRS for this card]

  Bulk actions bar (shown when ≥1 row checked):
    [Delete selected (N)]  [Reset SRS for selected (N)]  [Export selected]

  SRS State legend:  🔵 New   🟡 Learning   🟢 Review   ⭐ Mastered

  ─── STUDY SETTINGS TAB ────────────────────────────────────────────────────

  SESSION LIMITS:
    New cards per day       [  10  ▾]  (0 = unlimited)
    Max reviews per session [  50  ▾]
    Estimated session time  ~25 min  (auto-calculated, read-only)

  CARD ORDER:
    ● Due cards first (recommended)
    ○ Random
    ○ New cards first

  STUDY MODE:
    ● Standard SRS    — flip → rate: Again / Hard / Good / Easy
    ○ Exam Mode       — flip → Know it / Don't know — no SRS impact
    ○ Preview/Browse  — read all cards, no SRS interaction
    Note: Exam Mode is safe before an exam; it does not disturb intervals.

  REMINDERS (this deck only):
    Daily review reminder    [toggle ON]
    Reminder time            [8:00 PM ▾]  (defaults to detected peak hour)
    Note: Global notifications → Account Settings → Notifications

  SRS RESET:
    Reset SRS progress for this deck
    ⚠ Clears all intervals; all cards return to "New". Streak resets for deck.
    [Reset SRS progress →]  ← confirmation dialog (less strict than delete)

                                      [Save Settings]

  ─── SHARE TAB ─────────────────────────────────────────────────────────────

  VISIBILITY:
    ○ Private  (only you)
    ● Public   — listed at /explore/medicine/cardiology-l3
    ⚠ amber banner: "4 AI cards unreviewed — review before publishing?"
      [Review unreviewed cards →]

  SHARE LINK:
    https://app.io/d/crd-abc123              [📋 Copy link]
    (includes referral tag when shared by logged-in user)

  SOCIAL PREVIEW:
  ┌──────────────────────────────────────────────────────────────────────┐
  │  [OG PREVIEW — 1200×630px, server-generated]                        │
  │  Brand-indigo gradient  ·  "Cardiology Lecture 3"  ·  38 cards     │
  │  by @yourusername  ·  app logo + URL bottom-right                   │
  └──────────────────────────────────────────────────────────────────────┘
  [Download 1200×630 (landscape)]   [Download 1080×1920 (Story)]
  [Regenerate preview]

  SHARE TO:   [WhatsApp]  [iMessage]  [Twitter/X]  [Instagram Story]  [Email]

  PRE-WRITTEN MESSAGE (editable):
    "Check out my Cardiology deck — 38 cards for USMLE Step 1 👇
     Free to study: https://app.io/d/crd-abc123"
    [📋 Copy message]

  PUBLIC STATS (if deck is Public):
    👥 0 followers  · 📖 0 students studying  · ⭐ No ratings yet
    [View public listing on Explore →]

  ─── DANGER ZONE TAB ───────────────────────────────────────────────────────

  ⚠️  Destructive actions cannot be undone.

  RESET SRS:
    "Reset all SRS progress for this deck"
    Effect: 38 cards → New state. History cleared. Deck streak reset.
    Overall account streak NOT affected.
    [Reset SRS progress →]  (confirmation dialog — no typed name required)

  DELETE DECK:
    "Permanently delete this deck"
    Effect: Deck + all 38 cards + all study history — permanently removed.
    If Public + followers: they receive an email notification.
    [🗑 Delete this deck →]  (triggers confirmation modal below)

  ┌── DELETE CONFIRMATION MODAL ─────────────────────────────────────────┐
  │  Delete "Cardiology Lecture 3"?                              [✕]    │
  ├──────────────────────────────────────────────────────────────────────┤
  │  This will permanently delete:                                       │
  │    ✗ 38 cards                                                        │
  │    ✗ All SRS review history                                          │
  │    ✗ Public Explore listing (if applicable)                          │
  │  This cannot be undone.                                              │
  │                                                                      │
  │  Type the deck name to confirm:                                      │
  │  [________________________________]                                  │
  │  "Cardiology Lecture 3"                                              │
  │                                                                      │
  │  [Cancel]          [Delete permanently]  ← disabled until name match│
  └──────────────────────────────────────────────────────────────────────┘

────────────────────────────────────────────────────────────────────────────────
ASCII WIREFRAME — MOBILE / TABLET (≤1023px)
────────────────────────────────────────────────────────────────────────────────

  ┌──────────────────────────────────────┐
  │  ← My Library                        │
  │  [4px subject color top bar]         │
  │  Cardiology Lecture 3                │
  │  38 cards · Medicine · Private       │
  │                                      │
  │  [ ▶ Study Now ]    [ ↗ Share ]      │
  │                                      │
  │  ── tab bar (scrollable) ──────────  │
  │  [Overview][Cards][Settings][Share]  │
  │  [⚠ Danger] (last, less prominent)   │
  │  ────────────────────────────────    │
  │                                      │
  │  OVERVIEW (active tab):              │
  │  65% mastered · 12 due today         │
  │  ███████████░░░░░  (progress bar)    │
  │  New 4 · Learning 8 · ✓ 6          │
  │                                      │
  │  Subject: Medicine / Cardiology      │
  │  Tags: #USMLE #Cardiology            │
  │  Visibility: Private  [Make Public]  │
  │  Created: 2026-04-01                 │
  │  Source: ✨ AI-generated             │
  │                                      │
  ├──────────────────────────────────────┤
  │ 🏠Home  📚Decks  🔍Explore  ✏️Create  │
  └──────────────────────────────────────┘

────────────────────────────────────────────────────────────────────────────────
DECK DETAIL USER FLOW DIAGRAM
────────────────────────────────────────────────────────────────────────────────

  [Library or Dashboard card click]
               │
               ▼
       [DECK DETAIL /decks/id]
               │
   ┌───────────┼───────────┬──────────────────┐
   ▼           ▼           ▼                  ▼
[Study Now] [Edit Cards] [Share Tab]      [⚠ Danger Zone]
   │           │           │                  │
   ▼           ▼           │          ┌───────┴────────┐
[SRS Session] [Card       │        [Reset SRS]   [Delete Deck]
(DESIGN-005)  Editor]  [Share modal   (confirm)   (typed confirm
              (DESIGN-003) + social                 dialog)
                           CTAs]

────────────────────────────────────────────────────────────────────────────────
EDGE CASES — DECK DETAIL/SETTINGS
────────────────────────────────────────────────────────────────────────────────

  Deck with 0 cards:
    Study button disabled: "Add at least 1 card to study"
    Cards tab: "[+ Add first card]" full-width CTA only

  Making Private → Public with unreviewed AI cards:
    Amber inline warning in Share tab — not a hard block (DECISION-006 intent
    is to protect users, not create friction for creators who understand risk)

  Viewer (not owner) accesses deck:
    Header: [▶ Study Free] [+ Clone to Library] [↗ Share]
    Tabs shown: Overview, Cards (read-only, first 10 Qs previewed),  Share
    Tabs hidden: Study Settings, Danger Zone

  Delete deck with public followers:
    Confirmation dialog explicitly states follower count + email notification

  Large deck (500+ cards) in Cards tab:
    Virtual scrolling (not pagination) — client-side filter is instant
    Search results highlight match within truncated question text

  Export .apkg with embedded images:
    Note: "Images included as media files. Anki template required for
    correct display. Chemistry structural diagrams included as uploaded images."

  Visibility toggle while deck is being studied by others:
    Immediate effect — existing study sessions continue for active users
    (session is already loaded client-side); new visitors see 404 on deck page

  High session-limit warning:
    Study Settings: if max reviews × avg card time > 60 min,
    show: "This session will take approx. N minutes. Consider reducing
    the limit to avoid burnout." Non-blocking.

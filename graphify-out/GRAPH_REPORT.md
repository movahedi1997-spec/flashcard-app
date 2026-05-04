# Graph Report - app+components+lib  (2026-05-04)

## Corpus Check
- 137 files · ~68,984 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 323 nodes · 300 edges · 88 communities detected
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Account & Admin API Routes|Account & Admin API Routes]]
- [[_COMMUNITY_Auth & Admin Management API|Auth & Admin Management API]]
- [[_COMMUNITY_Public Content Pages|Public Content Pages]]
- [[_COMMUNITY_PWA Install Prompt|PWA Install Prompt]]
- [[_COMMUNITY_Auth Utilities|Auth Utilities]]
- [[_COMMUNITY_Admin Dashboard|Admin Dashboard]]
- [[_COMMUNITY_AI Generation|AI Generation]]
- [[_COMMUNITY_SRS Engine|SRS Engine]]
- [[_COMMUNITY_Admin Auth|Admin Auth]]
- [[_COMMUNITY_Email Verification Flow|Email Verification Flow]]
- [[_COMMUNITY_Legal Pages|Legal Pages]]
- [[_COMMUNITY_Dashboard & Settings|Dashboard & Settings]]
- [[_COMMUNITY_Auth Pages|Auth Pages]]
- [[_COMMUNITY_Cram Study Session|Cram Study Session]]
- [[_COMMUNITY_OTP System|OTP System]]
- [[_COMMUNITY_Flashcard Study Logic|Flashcard Study Logic]]
- [[_COMMUNITY_Delete Account UI|Delete Account UI]]
- [[_COMMUNITY_Image Upload|Image Upload]]
- [[_COMMUNITY_Database Layer|Database Layer]]
- [[_COMMUNITY_Flashcard Helpers|Flashcard Helpers]]
- [[_COMMUNITY_i18n Layout|i18n Layout]]
- [[_COMMUNITY_2FA Toggle|2FA Toggle]]
- [[_COMMUNITY_Edit Profile Form|Edit Profile Form]]
- [[_COMMUNITY_Offline Page|Offline Page]]
- [[_COMMUNITY_Admin Overview|Admin Overview]]
- [[_COMMUNITY_PWA Install Button|PWA Install Button]]
- [[_COMMUNITY_Bottom Navigation|Bottom Navigation]]
- [[_COMMUNITY_Explore Deck Card|Explore Deck Card]]
- [[_COMMUNITY_App Navigation|App Navigation]]
- [[_COMMUNITY_Explore Grid|Explore Grid]]
- [[_COMMUNITY_Study Session|Study Session]]
- [[_COMMUNITY_Card List|Card List]]
- [[_COMMUNITY_Box List|Box List]]
- [[_COMMUNITY_Share Deck Panel|Share Deck Panel]]
- [[_COMMUNITY_Box Form|Box Form]]
- [[_COMMUNITY_Auth Fetch Helper|Auth Fetch Helper]]
- [[_COMMUNITY_SEO Hreflang|SEO Hreflang]]
- [[_COMMUNITY_Email & OTP Sender|Email & OTP Sender]]
- [[_COMMUNITY_robots.ts|robots.ts]]
- [[_COMMUNITY_sitemap.ts|sitemap.ts]]
- [[_COMMUNITY_SubscriptionSection.tsx|SubscriptionSection.tsx]]
- [[_COMMUNITY_page.tsx|page.tsx]]
- [[_COMMUNITY_CopyDeckButton.tsx|CopyDeckButton.tsx]]
- [[_COMMUNITY_HomeButton.tsx|HomeButton.tsx]]
- [[_COMMUNITY_page.tsx|page.tsx]]
- [[_COMMUNITY_PricingClient.tsx|PricingClient.tsx]]
- [[_COMMUNITY_SRSStatsClient.tsx|SRSStatsClient.tsx]]
- [[_COMMUNITY_page.tsx|page.tsx]]
- [[_COMMUNITY_page.tsx|page.tsx]]
- [[_COMMUNITY_layout.tsx|layout.tsx]]
- [[_COMMUNITY_LocaleSwitcher.tsx|LocaleSwitcher.tsx]]
- [[_COMMUNITY_GoProBanner.tsx|GoProBanner.tsx]]
- [[_COMMUNITY_LogoutButton.tsx|LogoutButton.tsx]]
- [[_COMMUNITY_ProBadge.tsx|ProBadge.tsx]]
- [[_COMMUNITY_LanguageSetting.tsx|LanguageSetting.tsx]]
- [[_COMMUNITY_CookieConsent.tsx|CookieConsent.tsx]]
- [[_COMMUNITY_FlashLogoMark.tsx|FlashLogoMark.tsx]]
- [[_COMMUNITY_NavLogo.tsx|NavLogo.tsx]]
- [[_COMMUNITY_ConfirmDialog.tsx|ConfirmDialog.tsx]]
- [[_COMMUNITY_Button()|Button()]]
- [[_COMMUNITY_Modal.tsx|Modal.tsx]]
- [[_COMMUNITY_EmptyState.tsx|EmptyState.tsx]]
- [[_COMMUNITY_ModeSelector.tsx|ModeSelector.tsx]]
- [[_COMMUNITY_AIImproveModal()|AIImproveModal()]]
- [[_COMMUNITY_CardForm()|CardForm()]]
- [[_COMMUNITY_getPalette()|getPalette()]]
- [[_COMMUNITY_getBlogPost()|getBlogPost()]]
- [[_COMMUNITY_rateLimit.ts|rateLimit.ts]]
- [[_COMMUNITY_pdf.ts|pdf.ts]]
- [[_COMMUNITY_storage.ts|storage.ts]]
- [[_COMMUNITY_layout.tsx|layout.tsx]]
- [[_COMMUNITY_page.tsx|page.tsx]]
- [[_COMMUNITY_route.tsx|route.tsx]]
- [[_COMMUNITY_Hero.tsx|Hero.tsx]]
- [[_COMMUNITY_Navbar.tsx|Navbar.tsx]]
- [[_COMMUNITY_SubjectHubs.tsx|SubjectHubs.tsx]]
- [[_COMMUNITY_Features.tsx|Features.tsx]]
- [[_COMMUNITY_HowItWorks.tsx|HowItWorks.tsx]]
- [[_COMMUNITY_Footer.tsx|Footer.tsx]]
- [[_COMMUNITY_MathContent.tsx|MathContent.tsx]]
- [[_COMMUNITY_CTABanner.tsx|CTABanner.tsx]]
- [[_COMMUNITY_BlogPreview.tsx|BlogPreview.tsx]]
- [[_COMMUNITY_Textarea.tsx|Textarea.tsx]]
- [[_COMMUNITY_Input.tsx|Input.tsx]]
- [[_COMMUNITY_SplashPage.tsx|SplashPage.tsx]]
- [[_COMMUNITY_AIGenerateModal.tsx|AIGenerateModal.tsx]]
- [[_COMMUNITY_CardItem.tsx|CardItem.tsx]]
- [[_COMMUNITY_StudyChart.tsx|StudyChart.tsx]]

## God Nodes (most connected - your core abstractions)
1. `POST()` - 28 edges
2. `GET()` - 24 edges
3. `generateMetadata()` - 9 edges
4. `buildScaffold()` - 8 edges
5. `PATCH()` - 7 edges
6. `handleSubmit()` - 4 edges
7. `toISODate()` - 4 edges
8. `parseCards()` - 4 edges
9. `generateWithGroq()` - 4 edges
10. `generateWithOpenRouter()` - 4 edges

## Surprising Connections (you probably didn't know these)
- `generateMetadata()` --calls--> `getDeckBySlug()`  [EXTRACTED]
  app/[locale]/pricing/page.tsx → app/[locale]/explore/[slug]/page.tsx
- `generateMetadata()` --calls--> `getCreatorByUsername()`  [EXTRACTED]
  app/[locale]/pricing/page.tsx → app/[locale]/creators/[username]/page.tsx
- `POST()` --calls--> `invalidResponse()`  [EXTRACTED]
  app/api/stripe/checkout/route.ts → app/api/auth/refresh/route.ts
- `POST()` --calls--> `clearBothCookies()`  [EXTRACTED]
  app/api/stripe/checkout/route.ts → app/api/auth/refresh/route.ts
- `POST()` --calls--> `issueSession()`  [EXTRACTED]
  app/api/stripe/checkout/route.ts → app/api/auth/login/route.ts

## Communities

### Community 0 - "Account & Admin API Routes"
Cohesion: 0.09
Nodes (15): buildQuery(), buildScaffold(), DELETE(), failRedirect(), formatCard(), formatDayLabel(), formatMonthLabel(), formatWeekLabel() (+7 more)

### Community 1 - "Auth & Admin Management API"
Cohesion: 0.09
Nodes (7): activateSubscription(), clearBothCookies(), deactivateSubscription(), invalidResponse(), issueSession(), POST(), slugify()

### Community 2 - "Public Content Pages"
Cohesion: 0.12
Nodes (4): generateMetadata(), getCreatorByUsername(), getDeckBySlug(), getOptionalUser()

### Community 3 - "PWA Install Prompt"
Cohesion: 0.29
Nodes (5): handleAppInstalled(), handleDismiss(), handleInstall(), saveDismissal(), saveInstalled()

### Community 4 - "Auth Utilities"
Cohesion: 0.24
Nodes (4): getAuthUser(), getClientIp(), isValidIp(), verifyAccessToken()

### Community 5 - "Admin Dashboard"
Cohesion: 0.25
Nodes (0): 

### Community 6 - "AI Generation"
Cohesion: 0.54
Nodes (7): buildUserPrompt(), generateFlashcards(), generateFlashcardsFromPdf(), generateWithGroq(), generateWithOpenRouter(), isRateLimitError(), parseCards()

### Community 7 - "SRS Engine"
Cohesion: 0.38
Nodes (3): previewIntervals(), previewIntervalsFromSrsState(), schedule()

### Community 8 - "Admin Auth"
Cohesion: 0.38
Nodes (4): checkAdminCredentials(), getAdminUser(), safeEqual(), verifyAdminToken()

### Community 9 - "Email Verification Flow"
Cohesion: 0.47
Nodes (3): handleDigit(), handlePaste(), submit()

### Community 10 - "Legal Pages"
Cohesion: 0.33
Nodes (1): Section()

### Community 11 - "Dashboard & Settings"
Cohesion: 0.5
Nodes (3): calculateStreak(), getDashboardData(), getUserFromCookie()

### Community 12 - "Auth Pages"
Cohesion: 0.5
Nodes (2): calculateAge(), handleSubmit()

### Community 13 - "Cram Study Session"
Cohesion: 0.5
Nodes (2): restart(), shuffle()

### Community 14 - "OTP System"
Cohesion: 0.5
Nodes (2): generateOtpCode(), storeAndSendOtp()

### Community 15 - "Flashcard Study Logic"
Cohesion: 0.6
Nodes (3): buildScoreDeck(), buildTurboDeck(), shuffle()

### Community 16 - "Delete Account UI"
Cohesion: 0.5
Nodes (0): 

### Community 17 - "Image Upload"
Cohesion: 0.83
Nodes (3): handleChange(), handleDrop(), processFile()

### Community 18 - "Database Layer"
Cohesion: 0.83
Nodes (3): getDbPool(), getPool(), query()

### Community 19 - "Flashcard Helpers"
Cohesion: 0.5
Nodes (0): 

### Community 20 - "i18n Layout"
Cohesion: 0.67
Nodes (0): 

### Community 21 - "2FA Toggle"
Cohesion: 0.67
Nodes (0): 

### Community 22 - "Edit Profile Form"
Cohesion: 0.67
Nodes (0): 

### Community 23 - "Offline Page"
Cohesion: 0.67
Nodes (0): 

### Community 24 - "Admin Overview"
Cohesion: 1.0
Nodes (2): AdminPage(), getStats()

### Community 25 - "PWA Install Button"
Cohesion: 0.67
Nodes (0): 

### Community 26 - "Bottom Navigation"
Cohesion: 1.0
Nodes (2): BottomNav(), stripLocale()

### Community 27 - "Explore Deck Card"
Cohesion: 1.0
Nodes (2): ExploreDeckCard(), getPalette()

### Community 28 - "App Navigation"
Cohesion: 0.67
Nodes (0): 

### Community 29 - "Explore Grid"
Cohesion: 0.67
Nodes (0): 

### Community 30 - "Study Session"
Cohesion: 0.67
Nodes (0): 

### Community 31 - "Card List"
Cohesion: 0.67
Nodes (0): 

### Community 32 - "Box List"
Cohesion: 0.67
Nodes (0): 

### Community 33 - "Share Deck Panel"
Cohesion: 0.67
Nodes (0): 

### Community 34 - "Box Form"
Cohesion: 0.67
Nodes (0): 

### Community 35 - "Auth Fetch Helper"
Cohesion: 1.0
Nodes (2): fetchWithRefresh(), tryRefresh()

### Community 36 - "SEO Hreflang"
Cohesion: 1.0
Nodes (2): hreflangAlternates(), localeUrl()

### Community 37 - "Email & OTP Sender"
Cohesion: 1.0
Nodes (2): otpHtml(), sendOtpEmail()

### Community 38 - "robots.ts"
Cohesion: 1.0
Nodes (0): 

### Community 39 - "sitemap.ts"
Cohesion: 1.0
Nodes (0): 

### Community 40 - "SubscriptionSection.tsx"
Cohesion: 1.0
Nodes (0): 

### Community 41 - "page.tsx"
Cohesion: 1.0
Nodes (0): 

### Community 42 - "CopyDeckButton.tsx"
Cohesion: 1.0
Nodes (0): 

### Community 43 - "HomeButton.tsx"
Cohesion: 1.0
Nodes (0): 

### Community 44 - "page.tsx"
Cohesion: 1.0
Nodes (0): 

### Community 45 - "PricingClient.tsx"
Cohesion: 1.0
Nodes (0): 

### Community 46 - "SRSStatsClient.tsx"
Cohesion: 1.0
Nodes (0): 

### Community 47 - "page.tsx"
Cohesion: 1.0
Nodes (0): 

### Community 48 - "page.tsx"
Cohesion: 1.0
Nodes (0): 

### Community 49 - "layout.tsx"
Cohesion: 1.0
Nodes (0): 

### Community 50 - "LocaleSwitcher.tsx"
Cohesion: 1.0
Nodes (0): 

### Community 51 - "GoProBanner.tsx"
Cohesion: 1.0
Nodes (0): 

### Community 52 - "LogoutButton.tsx"
Cohesion: 1.0
Nodes (0): 

### Community 53 - "ProBadge.tsx"
Cohesion: 1.0
Nodes (0): 

### Community 54 - "LanguageSetting.tsx"
Cohesion: 1.0
Nodes (0): 

### Community 55 - "CookieConsent.tsx"
Cohesion: 1.0
Nodes (0): 

### Community 56 - "FlashLogoMark.tsx"
Cohesion: 1.0
Nodes (0): 

### Community 57 - "NavLogo.tsx"
Cohesion: 1.0
Nodes (0): 

### Community 58 - "ConfirmDialog.tsx"
Cohesion: 1.0
Nodes (0): 

### Community 59 - "Button()"
Cohesion: 1.0
Nodes (0): 

### Community 60 - "Modal.tsx"
Cohesion: 1.0
Nodes (0): 

### Community 61 - "EmptyState.tsx"
Cohesion: 1.0
Nodes (0): 

### Community 62 - "ModeSelector.tsx"
Cohesion: 1.0
Nodes (0): 

### Community 63 - "AIImproveModal()"
Cohesion: 1.0
Nodes (0): 

### Community 64 - "CardForm()"
Cohesion: 1.0
Nodes (0): 

### Community 65 - "getPalette()"
Cohesion: 1.0
Nodes (0): 

### Community 66 - "getBlogPost()"
Cohesion: 1.0
Nodes (0): 

### Community 67 - "rateLimit.ts"
Cohesion: 1.0
Nodes (0): 

### Community 68 - "pdf.ts"
Cohesion: 1.0
Nodes (0): 

### Community 69 - "storage.ts"
Cohesion: 1.0
Nodes (0): 

### Community 70 - "layout.tsx"
Cohesion: 1.0
Nodes (0): 

### Community 71 - "page.tsx"
Cohesion: 1.0
Nodes (0): 

### Community 72 - "route.tsx"
Cohesion: 1.0
Nodes (0): 

### Community 73 - "Hero.tsx"
Cohesion: 1.0
Nodes (0): 

### Community 74 - "Navbar.tsx"
Cohesion: 1.0
Nodes (0): 

### Community 75 - "SubjectHubs.tsx"
Cohesion: 1.0
Nodes (0): 

### Community 76 - "Features.tsx"
Cohesion: 1.0
Nodes (0): 

### Community 77 - "HowItWorks.tsx"
Cohesion: 1.0
Nodes (0): 

### Community 78 - "Footer.tsx"
Cohesion: 1.0
Nodes (0): 

### Community 79 - "MathContent.tsx"
Cohesion: 1.0
Nodes (0): 

### Community 80 - "CTABanner.tsx"
Cohesion: 1.0
Nodes (0): 

### Community 81 - "BlogPreview.tsx"
Cohesion: 1.0
Nodes (0): 

### Community 82 - "Textarea.tsx"
Cohesion: 1.0
Nodes (0): 

### Community 83 - "Input.tsx"
Cohesion: 1.0
Nodes (0): 

### Community 84 - "SplashPage.tsx"
Cohesion: 1.0
Nodes (0): 

### Community 85 - "AIGenerateModal.tsx"
Cohesion: 1.0
Nodes (0): 

### Community 86 - "CardItem.tsx"
Cohesion: 1.0
Nodes (0): 

### Community 87 - "StudyChart.tsx"
Cohesion: 1.0
Nodes (0): 

## Knowledge Gaps
- **Thin community `robots.ts`** (2 nodes): `robots.ts`, `robots()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `sitemap.ts`** (2 nodes): `sitemap.ts`, `sitemap()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `SubscriptionSection.tsx`** (2 nodes): `SubscriptionSection.tsx`, `openPortal()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `page.tsx`** (2 nodes): `page.tsx`, `FlashcardsPage()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `CopyDeckButton.tsx`** (2 nodes): `CopyDeckButton.tsx`, `handleCopy()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `HomeButton.tsx`** (2 nodes): `HomeButton.tsx`, `HomeButton()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `page.tsx`** (2 nodes): `page.tsx`, `ImpressumPage()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `PricingClient.tsx`** (2 nodes): `PricingClient.tsx`, `handleUpgrade()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `SRSStatsClient.tsx`** (2 nodes): `SRSStatsClient.tsx`, `cellColor()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `page.tsx`** (2 nodes): `page.tsx`, `getUser()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `page.tsx`** (2 nodes): `page.tsx`, `handleContinue()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `layout.tsx`** (2 nodes): `layout.tsx`, `AdminLayout()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `LocaleSwitcher.tsx`** (2 nodes): `LocaleSwitcher.tsx`, `LocaleSwitcher()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `GoProBanner.tsx`** (2 nodes): `GoProBanner.tsx`, `GoProBanner()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `LogoutButton.tsx`** (2 nodes): `LogoutButton.tsx`, `LogoutButton()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `ProBadge.tsx`** (2 nodes): `ProBadge.tsx`, `ProBadge()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `LanguageSetting.tsx`** (2 nodes): `LanguageSetting.tsx`, `switchLocale()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `CookieConsent.tsx`** (2 nodes): `CookieConsent.tsx`, `CookieConsent()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `FlashLogoMark.tsx`** (2 nodes): `FlashLogoMark.tsx`, `FlashLogoMark()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `NavLogo.tsx`** (2 nodes): `NavLogo.tsx`, `NavLogo()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `ConfirmDialog.tsx`** (2 nodes): `ConfirmDialog.tsx`, `ConfirmDialog()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Button()`** (2 nodes): `Button()`, `Button.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Modal.tsx`** (2 nodes): `Modal.tsx`, `Modal()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `EmptyState.tsx`** (2 nodes): `EmptyState.tsx`, `EmptyState()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `ModeSelector.tsx`** (2 nodes): `ModeSelector.tsx`, `ModeSelector()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `AIImproveModal()`** (2 nodes): `AIImproveModal()`, `AIImproveModal.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `CardForm()`** (2 nodes): `CardForm()`, `CardForm.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `getPalette()`** (2 nodes): `getPalette()`, `BoxCard.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `getBlogPost()`** (2 nodes): `getBlogPost()`, `blog.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `rateLimit.ts`** (2 nodes): `rateLimit.ts`, `checkRateLimit()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `pdf.ts`** (2 nodes): `pdf.ts`, `extractTextFromPdf()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `storage.ts`** (2 nodes): `storage.ts`, `safeGet()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `layout.tsx`** (1 nodes): `layout.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `page.tsx`** (1 nodes): `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `route.tsx`** (1 nodes): `route.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Hero.tsx`** (1 nodes): `Hero.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Navbar.tsx`** (1 nodes): `Navbar.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `SubjectHubs.tsx`** (1 nodes): `SubjectHubs.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Features.tsx`** (1 nodes): `Features.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `HowItWorks.tsx`** (1 nodes): `HowItWorks.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Footer.tsx`** (1 nodes): `Footer.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `MathContent.tsx`** (1 nodes): `MathContent.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `CTABanner.tsx`** (1 nodes): `CTABanner.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `BlogPreview.tsx`** (1 nodes): `BlogPreview.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Textarea.tsx`** (1 nodes): `Textarea.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Input.tsx`** (1 nodes): `Input.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `SplashPage.tsx`** (1 nodes): `SplashPage.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `AIGenerateModal.tsx`** (1 nodes): `AIGenerateModal.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `CardItem.tsx`** (1 nodes): `CardItem.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `StudyChart.tsx`** (1 nodes): `StudyChart.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `POST()` connect `Auth & Admin Management API` to `Account & Admin API Routes`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Should `Account & Admin API Routes` be split into smaller, more focused modules?**
  _Cohesion score 0.09 - nodes in this community are weakly interconnected._
- **Should `Auth & Admin Management API` be split into smaller, more focused modules?**
  _Cohesion score 0.09 - nodes in this community are weakly interconnected._
- **Should `Public Content Pages` be split into smaller, more focused modules?**
  _Cohesion score 0.12 - nodes in this community are weakly interconnected._
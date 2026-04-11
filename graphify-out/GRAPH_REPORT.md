# Graph Report - .  (2026-04-12)

## Corpus Check
- Corpus is ~18,944 words - fits in a single context window. You may not need a graph.

## Summary
- 159 nodes · 142 edges · 57 communities detected
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 7 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Multi-Agent Team Structure|Multi-Agent Team Structure]]
- [[_COMMUNITY_React Build & Lint Config|React Build & Lint Config]]
- [[_COMMUNITY_Brand Assets & Visual Identity|Brand Assets & Visual Identity]]
- [[_COMMUNITY_Database User Operations|Database User Operations]]
- [[_COMMUNITY_Flashcard Study Logic|Flashcard Study Logic]]
- [[_COMMUNITY_Image Upload Component|Image Upload Component]]
- [[_COMMUNITY_Study Session UI|Study Session UI]]
- [[_COMMUNITY_Utility Helpers|Utility Helpers]]
- [[_COMMUNITY_Auth Middleware|Auth Middleware]]
- [[_COMMUNITY_Login Page|Login Page]]
- [[_COMMUNITY_Confirm Dialog|Confirm Dialog]]
- [[_COMMUNITY_Button Component|Button Component]]
- [[_COMMUNITY_Modal Component|Modal Component]]
- [[_COMMUNITY_Empty State Component|Empty State Component]]
- [[_COMMUNITY_Study Mode Selector|Study Mode Selector]]
- [[_COMMUNITY_Card Form Component|Card Form Component]]
- [[_COMMUNITY_Box List Component|Box List Component]]
- [[_COMMUNITY_Box Form Component|Box Form Component]]
- [[_COMMUNITY_Boxes Hook|Boxes Hook]]
- [[_COMMUNITY_Cards Hook|Cards Hook]]
- [[_COMMUNITY_Local Storage Layer|Local Storage Layer]]
- [[_COMMUNITY_Next.js Root Layout|Next.js Root Layout]]
- [[_COMMUNITY_Next.js Home Page|Next.js Home Page]]
- [[_COMMUNITY_Flashcards Dashboard|Flashcards Dashboard]]
- [[_COMMUNITY_Logout Button|Logout Button]]
- [[_COMMUNITY_Server-Side Auth|Server-Side Auth]]
- [[_COMMUNITY_JWT Auth Routes|JWT Auth Routes]]
- [[_COMMUNITY_Navigation Bar|Navigation Bar]]
- [[_COMMUNITY_Footer Component|Footer Component]]
- [[_COMMUNITY_Root App Component|Root App Component]]
- [[_COMMUNITY_Next.js Config|Next.js Config]]
- [[_COMMUNITY_Next.js Types|Next.js Types]]
- [[_COMMUNITY_Tailwind Config|Tailwind Config]]
- [[_COMMUNITY_ESLint Config File|ESLint Config File]]
- [[_COMMUNITY_Vite Config|Vite Config]]
- [[_COMMUNITY_PostCSS Config|PostCSS Config]]
- [[_COMMUNITY_Flashcard Types|Flashcard Types]]
- [[_COMMUNITY_Express Server Entry|Express Server Entry]]
- [[_COMMUNITY_Marketing Hero Section|Marketing Hero Section]]
- [[_COMMUNITY_Marketing Features Section|Marketing Features Section]]
- [[_COMMUNITY_CTA Banner|CTA Banner]]
- [[_COMMUNITY_Textarea (Next.js)|Textarea (Next.js)]]
- [[_COMMUNITY_Input (Next.js)|Input (Next.js)]]
- [[_COMMUNITY_Splash Page (Next.js)|Splash Page (Next.js)]]
- [[_COMMUNITY_Card List (Next.js)|Card List (Next.js)]]
- [[_COMMUNITY_Card Item (Next.js)|Card Item (Next.js)]]
- [[_COMMUNITY_Box Card (Next.js)|Box Card (Next.js)]]
- [[_COMMUNITY_Vite Entry Point|Vite Entry Point]]
- [[_COMMUNITY_App Type Definitions|App Type Definitions]]
- [[_COMMUNITY_Textarea (Vite)|Textarea (Vite)]]
- [[_COMMUNITY_Input (Vite)|Input (Vite)]]
- [[_COMMUNITY_Splash Page (Vite)|Splash Page (Vite)]]
- [[_COMMUNITY_Card List (Vite)|Card List (Vite)]]
- [[_COMMUNITY_Card Item (Vite)|Card Item (Vite)]]
- [[_COMMUNITY_Box Card (Vite)|Box Card (Vite)]]
- [[_COMMUNITY_Product Feedback Log|Product Feedback Log]]
- [[_COMMUNITY_React Logo Asset|React Logo Asset]]

## God Nodes (most connected - your core abstractions)
1. `Multi-Agent Product & Development Team` - 17 edges
2. `ESLint Configuration` - 8 edges
3. `Multi-Agent Workflow Order` - 7 edges
4. `Icons SVG Sprite Sheet` - 6 edges
5. `readUsers()` - 5 edges
6. `React + TypeScript + Vite Project` - 5 edges
7. `Critical Consultant Agent` - 5 edges
8. `dev/progress.md (shared file)` - 5 edges
9. `processFile()` - 4 edges
10. `shuffle()` - 4 edges

## Surprising Connections (you probably didn't know these)
- `Technical Writer Agent` --conceptually_related_to--> `React + TypeScript + Vite Project`  [INFERRED]
  CLAUDE.md → README.md
- `App Favicon (Lightning Bolt Logo)` --conceptually_related_to--> `Vite Logo SVG`  [INFERRED]
  public/favicon.svg → src/assets/vite.svg
- `Hero Image - Isometric Flashcard Stack` --conceptually_related_to--> `App Favicon (Lightning Bolt Logo)`  [INFERRED]
  src/assets/hero.png → public/favicon.svg
- `Vite Logo SVG` --conceptually_related_to--> `Purple Brand Color Theme`  [INFERRED]
  src/assets/vite.svg → public/favicon.svg
- `Documentation Icon Symbol` --conceptually_related_to--> `Purple Brand Color Theme`  [INFERRED]
  public/icons.svg → public/favicon.svg

## Hyperedges (group relationships)
- **Product Team Shared Communication Pattern** — claude_product_researcher, claude_marketing_manager, claude_product_owner, claude_critical_consultant, claude_growth_hacker, claude_shared_product_research, claude_shared_product_strategy, claude_shared_product_decisions, claude_shared_product_feedback [EXTRACTED 0.95]
- **Development Team Shared Communication Pattern** — claude_project_manager, claude_backend_developer, claude_frontend_developer, claude_qa_tester, claude_devops, claude_code_reviewer, claude_security_auditor, claude_shared_dev_tasks, claude_shared_dev_progress, claude_shared_dev_decisions [EXTRACTED 0.95]
- **React + TypeScript + Vite + ESLint Tech Stack** — readme_react_typescript_vite, readme_vite_plugin_react, readme_eslint_config, readme_tsconfig_app, readme_tsconfig_node [EXTRACTED 0.90]

## Communities

### Community 0 - "Multi-Agent Team Structure"
Cohesion: 0.14
Nodes (24): .claude/agents/ (agent profiles directory), Backend Developer Agent, Code Reviewer Agent, Critical Consultant Agent, DevOps Agent, Frontend Developer Agent, Graphify Knowledge Graph (graphify-out/), Growth Hacker Agent (+16 more)

### Community 1 - "React Build & Lint Config"
Cohesion: 0.17
Nodes (12): ESLint Configuration, eslint-plugin-react-dom, eslint-plugin-react-x, React Compiler, React + TypeScript + Vite Project, tsconfig.app.json, tsconfig.node.json, tseslint.configs.recommendedTypeChecked (+4 more)

### Community 2 - "Brand Assets & Visual Identity"
Cohesion: 0.22
Nodes (11): Hero Image - Isometric Flashcard Stack, Vite Logo SVG, Purple Brand Color Theme, App Favicon (Lightning Bolt Logo), Bluesky Social Icon Symbol, Discord Icon Symbol, Documentation Icon Symbol, GitHub Icon Symbol (+3 more)

### Community 3 - "Database User Operations"
Cohesion: 0.57
Nodes (6): createUser(), ensureDb(), findByEmail(), findById(), readUsers(), writeUsers()

### Community 4 - "Flashcard Study Logic"
Cohesion: 0.67
Nodes (4): buildScoreDeck(), buildTurboDeck(), exportBoxAsJson(), shuffle()

### Community 5 - "Image Upload Component"
Cohesion: 0.8
Nodes (3): handleChange(), handleDrop(), processFile()

### Community 6 - "Study Session UI"
Cohesion: 0.6
Nodes (3): grade(), restart(), reveal()

### Community 7 - "Utility Helpers"
Cohesion: 0.6
Nodes (3): formatDate(), generateId(), scoreColor()

### Community 8 - "Auth Middleware"
Cohesion: 1.0
Nodes (2): middleware(), verifyToken()

### Community 9 - "Login Page"
Cohesion: 0.67
Nodes (1): handleSubmit()

### Community 10 - "Confirm Dialog"
Cohesion: 0.67
Nodes (1): ConfirmDialog()

### Community 11 - "Button Component"
Cohesion: 0.67
Nodes (1): Button()

### Community 12 - "Modal Component"
Cohesion: 0.67
Nodes (1): Modal()

### Community 13 - "Empty State Component"
Cohesion: 0.67
Nodes (1): EmptyState()

### Community 14 - "Study Mode Selector"
Cohesion: 0.67
Nodes (1): ModeSelector()

### Community 15 - "Card Form Component"
Cohesion: 0.67
Nodes (1): CardForm()

### Community 16 - "Box List Component"
Cohesion: 0.67
Nodes (1): handleImport()

### Community 17 - "Box Form Component"
Cohesion: 0.67
Nodes (1): BoxForm()

### Community 18 - "Boxes Hook"
Cohesion: 0.67
Nodes (1): useBoxes()

### Community 19 - "Cards Hook"
Cohesion: 0.67
Nodes (1): useCards()

### Community 20 - "Local Storage Layer"
Cohesion: 0.67
Nodes (1): safeGet()

### Community 21 - "Next.js Root Layout"
Cohesion: 1.0
Nodes (0): 

### Community 22 - "Next.js Home Page"
Cohesion: 1.0
Nodes (0): 

### Community 23 - "Flashcards Dashboard"
Cohesion: 1.0
Nodes (0): 

### Community 24 - "Logout Button"
Cohesion: 1.0
Nodes (0): 

### Community 25 - "Server-Side Auth"
Cohesion: 1.0
Nodes (0): 

### Community 26 - "JWT Auth Routes"
Cohesion: 1.0
Nodes (0): 

### Community 27 - "Navigation Bar"
Cohesion: 1.0
Nodes (0): 

### Community 28 - "Footer Component"
Cohesion: 1.0
Nodes (0): 

### Community 29 - "Root App Component"
Cohesion: 1.0
Nodes (0): 

### Community 30 - "Next.js Config"
Cohesion: 1.0
Nodes (0): 

### Community 31 - "Next.js Types"
Cohesion: 1.0
Nodes (0): 

### Community 32 - "Tailwind Config"
Cohesion: 1.0
Nodes (0): 

### Community 33 - "ESLint Config File"
Cohesion: 1.0
Nodes (0): 

### Community 34 - "Vite Config"
Cohesion: 1.0
Nodes (0): 

### Community 35 - "PostCSS Config"
Cohesion: 1.0
Nodes (0): 

### Community 36 - "Flashcard Types"
Cohesion: 1.0
Nodes (0): 

### Community 37 - "Express Server Entry"
Cohesion: 1.0
Nodes (0): 

### Community 38 - "Marketing Hero Section"
Cohesion: 1.0
Nodes (0): 

### Community 39 - "Marketing Features Section"
Cohesion: 1.0
Nodes (0): 

### Community 40 - "CTA Banner"
Cohesion: 1.0
Nodes (0): 

### Community 41 - "Textarea (Next.js)"
Cohesion: 1.0
Nodes (0): 

### Community 42 - "Input (Next.js)"
Cohesion: 1.0
Nodes (0): 

### Community 43 - "Splash Page (Next.js)"
Cohesion: 1.0
Nodes (0): 

### Community 44 - "Card List (Next.js)"
Cohesion: 1.0
Nodes (0): 

### Community 45 - "Card Item (Next.js)"
Cohesion: 1.0
Nodes (0): 

### Community 46 - "Box Card (Next.js)"
Cohesion: 1.0
Nodes (0): 

### Community 47 - "Vite Entry Point"
Cohesion: 1.0
Nodes (0): 

### Community 48 - "App Type Definitions"
Cohesion: 1.0
Nodes (0): 

### Community 49 - "Textarea (Vite)"
Cohesion: 1.0
Nodes (0): 

### Community 50 - "Input (Vite)"
Cohesion: 1.0
Nodes (0): 

### Community 51 - "Splash Page (Vite)"
Cohesion: 1.0
Nodes (0): 

### Community 52 - "Card List (Vite)"
Cohesion: 1.0
Nodes (0): 

### Community 53 - "Card Item (Vite)"
Cohesion: 1.0
Nodes (0): 

### Community 54 - "Box Card (Vite)"
Cohesion: 1.0
Nodes (0): 

### Community 55 - "Product Feedback Log"
Cohesion: 1.0
Nodes (1): product/feedback.md (shared file)

### Community 56 - "React Logo Asset"
Cohesion: 1.0
Nodes (1): React Logo SVG

## Knowledge Gaps
- **20 isolated node(s):** `@vitejs/plugin-react (Oxc)`, `@vitejs/plugin-react-swc (SWC)`, `React Compiler`, `tseslint.configs.recommendedTypeChecked`, `tseslint.configs.strictTypeChecked` (+15 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Next.js Root Layout`** (2 nodes): `layout.tsx`, `RootLayout()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Next.js Home Page`** (2 nodes): `page.tsx`, `HomePage()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Flashcards Dashboard`** (2 nodes): `page.tsx`, `handleDeleteBox()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Logout Button`** (2 nodes): `LogoutButton.tsx`, `LogoutButton()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Server-Side Auth`** (2 nodes): `page.tsx`, `getUserFromCookie()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `JWT Auth Routes`** (2 nodes): `signToken()`, `auth.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Navigation Bar`** (2 nodes): `Navbar.tsx`, `Navbar()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Footer Component`** (2 nodes): `Footer.tsx`, `Footer()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Root App Component`** (2 nodes): `handleDeleteBox()`, `App.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Next.js Config`** (1 nodes): `next.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Next.js Types`** (1 nodes): `next-env.d.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Tailwind Config`** (1 nodes): `tailwind.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `ESLint Config File`** (1 nodes): `eslint.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Vite Config`** (1 nodes): `vite.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `PostCSS Config`** (1 nodes): `postcss.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Flashcard Types`** (1 nodes): `flashcard.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Express Server Entry`** (1 nodes): `index.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Marketing Hero Section`** (1 nodes): `Hero.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Marketing Features Section`** (1 nodes): `Features.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `CTA Banner`** (1 nodes): `CTABanner.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Textarea (Next.js)`** (1 nodes): `Textarea.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Input (Next.js)`** (1 nodes): `Input.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Splash Page (Next.js)`** (1 nodes): `SplashPage.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Card List (Next.js)`** (1 nodes): `CardList.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Card Item (Next.js)`** (1 nodes): `CardItem.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Box Card (Next.js)`** (1 nodes): `BoxCard.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Vite Entry Point`** (1 nodes): `main.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `App Type Definitions`** (1 nodes): `index.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Textarea (Vite)`** (1 nodes): `Textarea.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Input (Vite)`** (1 nodes): `Input.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Splash Page (Vite)`** (1 nodes): `SplashPage.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Card List (Vite)`** (1 nodes): `CardList.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Card Item (Vite)`** (1 nodes): `CardItem.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Box Card (Vite)`** (1 nodes): `BoxCard.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Product Feedback Log`** (1 nodes): `product/feedback.md (shared file)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `React Logo Asset`** (1 nodes): `React Logo SVG`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `React + TypeScript + Vite Project` connect `React Build & Lint Config` to `Multi-Agent Team Structure`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **Why does `Technical Writer Agent` connect `Multi-Agent Team Structure` to `React Build & Lint Config`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **What connects `@vitejs/plugin-react (Oxc)`, `@vitejs/plugin-react-swc (SWC)`, `React Compiler` to the rest of the system?**
  _20 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Multi-Agent Team Structure` be split into smaller, more focused modules?**
  _Cohesion score 0.14 - nodes in this community are weakly interconnected._
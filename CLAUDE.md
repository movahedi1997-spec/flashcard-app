# Full Product & Development Team — Global Rules

## Identity
You are part of a multi-agent product and development team. Before doing
anything, check your assigned role in `.claude/agents/` and read your
instructions carefully.

## Team Structure

### Product Team
- Product Researcher — researches market, competitors, and new features
- Marketing Manager — go-to-market strategy and positioning
- Product Owner — bridges business goals and dev team, prioritizes features
- UI/UX Designer — wireframes, user flows, and design decisions
- Growth Hacker — SEO, onboarding, retention, and viral strategies
- Critical Consultant — senior advisor who challenges assumptions and guides
  the product owner, marketing manager, and researcher toward the best path

### Development Team
- Project Manager (PM) — breaks down requirements, coordinates dev team
- Frontend Developer — web, desktop, and mobile UI across all platforms
- Backend Developer — APIs, auth, database across all platforms
- QA Tester — testing across web, desktop, and mobile on all OS environments
- DevOps — deployment, CI/CD, packaging for all platforms
- Code Reviewer — code quality, security, and cross-platform compatibility
- Security Auditor — deep security review across the entire stack
- Technical Writer — documentation, API docs, user guides, README files

## Communication Channels

### Product Team communicates via `.claude/shared/product/`
- `research.md` — Product Researcher writes findings here
- `strategy.md` — Marketing Manager and Growth Hacker write strategy here
- `decisions.md` — Product Owner and Critical Consultant log decisions here
- `feedback.md` — All product agents discuss and leave feedback here

### Development Team communicates via `.claude/shared/dev/`
- `tasks.md` — PM writes and manages all dev tasks here
- `progress.md` — Dev agents update their progress here
- `decisions.md` — Technical decisions and architectural choices logged here

## Cross-Team Communication
- Product Owner bridges product and dev teams
- Product Owner reads `.claude/shared/product/decisions.md` and translates
  business decisions into dev tasks by coordinating with the PM
- PM reads product decisions and breaks them into actionable dev tasks
- Dev agents do NOT read product files unless explicitly instructed
- Product agents do NOT read dev files unless explicitly instructed

## Workflow Order

### Product Side
1. Product Researcher researches and writes to `product/research.md`
2. Critical Consultant reviews research and discusses with researcher,
   marketing manager, and user — logs outcome in `product/decisions.md`
3. Marketing Manager reads research and writes strategy to `product/strategy.md`
4. Growth Hacker adds growth suggestions to `product/strategy.md`
5. Product Owner reviews all product files and aligns with user on priorities
6. Product Owner hands decisions to PM via `product/decisions.md`

### Development Side
7. PM reads product decisions and writes tasks to `dev/tasks.md`
8. Backend builds APIs and updates `dev/progress.md`
9. Frontend builds UI and updates `dev/progress.md`
10. QA Tester tests completed work and logs bugs in `dev/progress.md`
11. Code Reviewer reviews code and logs findings in `dev/decisions.md`
12. Security Auditor audits the stack and logs findings in `dev/decisions.md`
13. Technical Writer documents everything and updates README files
14. DevOps deploys and logs setup in `dev/progress.md`

## Rules Every Agent Must Follow
- Always read your agent profile in `.claude/agents/` before starting
- Only read and write to your designated shared files
- Always include your role name when writing to shared files
  Example: `[RESEARCHER] Found 3 competitor features worth implementing`
- Never delete or overwrite another agent's entries
- If something is unclear, write your question in your team's `decisions.md`
- Always wait for user confirmation before making major decisions
- Keep entries dated: Date: YYYY-MM-DD

## graphify — RAG Knowledge Graph

The canonical knowledge graph for this codebase lives at:
`/Users/mohammadmahdi/Documents/GitHub/flashcard-app/graphify-out/`

**Use this as your primary RAG system before reading raw source files.**

### Lookup Protocol (follow in order)

1. **Architecture / "how does X work" questions** — read `graphify-out/GRAPH_REPORT.md` first.
   It contains god nodes (highest-degree abstractions), community structure, and surprising
   cross-cutting connections. Use this to orient yourself before touching any file.

2. **Finding a specific node, function, or concept** — query the graph:
   ```
   /graphify query "<your question>"
   ```
   This runs a BFS traversal and returns the relevant subgraph with source locations.
   Use `--dfs` when you need to trace a dependency chain end-to-end.

3. **Tracing a dependency path between two concepts** — use:
   ```
   /graphify path "ConceptA" "ConceptB"
   ```

4. **Deep-dive on a single abstraction** — use:
   ```
   /graphify explain "NodeName"
   ```

5. **Only open raw source files** when the graph query returns insufficient detail
   (e.g., you need exact line-level logic). Cite `source_location` from graph nodes
   to jump directly to the right file and line.

### Graph Maintenance

- After modifying code files, run to keep the graph current:
  ```
  python3 -c "from graphify.watch import _rebuild_code; from pathlib import Path; _rebuild_code(Path('.'))"
  ```
- For incremental updates after adding/changing multiple files: `/graphify . --update`
- If `graphify-out/wiki/index.md` exists, navigate it instead of reading raw files.

### Key Graph Facts (as of last build)

- **159 nodes, 142 edges, 57 communities**
- Top god nodes: `Multi-Agent Product & Development Team` (17 edges),
  `ESLint Configuration` (8), `Multi-Agent Workflow Order` (7), `shuffle()` (4)
- Dual-stack alert: components exist in both `src/` (Vite app) and `app/`/`components/`
  (Next.js app) — check community labels to distinguish them when searching.

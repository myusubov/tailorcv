# GitHub Analysis Pipeline

> Hub doc for repository analysis. Start here, then jump to the focused sub-doc that matches the change you are making.

---

## 1. Core Philosophy

### 1.1 Design Pillars

| Pillar                            | Description                                                                                                          |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **Evidence before prose**         | Extract structured repository facts before asking AI to write resume content.                                        |
| **Small number, deeper analysis** | Prefer analyzing a few selected repositories well instead of dumping many shallow repos into AI.                     |
| **Parser first, AI second**       | Use deterministic analyzers for cheap, explainable signals; use AI later for synthesis and ambiguous interpretation. |
| **Degraded but useful output**    | Weak repositories should still produce feedback explaining what is missing and how to improve.                       |

### 1.2 Key Decisions

- **Developer-first entry point**: GitHub is the first external evidence source because developer projects, code structure, tooling, and collaboration artifacts live there.
- **One analyzer per repo signal**: Keep each analyzer focused on one source of evidence, such as structure, dependencies, source code, tests, docs, CI/CD, commits, and PRs.
- **Project Structure Analyzer first**: Start by mapping the repository shape before reading file contents or invoking AI.
- **Structure-inferred stack naming**: The structure analyzer exposes `summary.inferredStack`, not `primaryStack`, because dependency/config analysis will later provide higher-confidence stack confirmation.

---

## 2. Architecture Overview

### 2.1 Read Order

1. [pipeline/README.md](pipeline/README.md) for GitHub API orchestration, protected endpoints, and cross-domain integration.
2. [project-structure/README.md](project-structure/README.md) for the implemented project structure analyzer, score rules, and output contracts.
3. [changelog.md](changelog.md) for historical implementation decisions and dev log entries.

### 2.2 High-Level Map

```text
GitHub repo IDs selected by user
  -> protected temporary analyze endpoint
  -> empty temporary response
  -> future repo-tree retrieval and Project Structure Analyzer
  -> future analyzers
  -> future evidence aggregator + AI resume synthesis
```

---

## 3. Key Files & Entry Points

| File                                                     | Purpose                                                                  | When to Read                              |
| -------------------------------------------------------- | ------------------------------------------------------------------------ | ----------------------------------------- |
| `docs/architecture/github-analysis/pipeline/README.md`          | Endpoint, service, GitHub connection, and orchestration documentation    | GitHub route/service/request changes      |
| `docs/architecture/github-analysis/project-structure/README.md` | Project structure analyzer contracts, modules, scoring rules, and status | Any analyzer summary/detected-area change |
| `docs/architecture/github-analysis/changelog.md`         | Historical dev log for GitHub analysis decisions                         | Understanding why current rules exist     |

---

## 4. Data Flow

### 4.1 Domain Split

- `pipeline/README.md`: GitHub connection boundary, analyze endpoint flow, tree fetching, service orchestration.
- `project-structure/README.md`: normalized tree input, project shape, inferred stack, detected areas, project-structure modules.
- `changelog.md`: implementation history and decision record.

---

## 5. Component / Module Structure

```text
docs/architecture/
├── README.md
└── github-analysis/
    ├── README.md              # This hub doc
    ├── changelog.md           # Historical dev log entries
    ├── adr/                   # Durable GitHub analysis decisions
    ├── pipeline/              # GitHub endpoint/service orchestration
    │   ├── README.md
    │   ├── changelog.md
    │   └── adr/
    └── project-structure/     # Implemented project structure analyzer
        ├── README.md
        ├── changelog.md
        └── adr/
```

---

## 6. Patterns & Conventions

### 6.1 Documentation Pattern

- Keep endpoint/service orchestration in `pipeline/README.md`.
- Keep analyzer internals and scoring rules in `project-structure/README.md`.
- Keep long historical entries in `changelog.md`.
- When a change spans orchestration and analyzer internals, update both focused sub-docs and cross-link them here.

---

## 7. Integration Points

| Domain            | Relationship                                                                                                      | Key Interface                    |
| ----------------- | ----------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| Onboarding        | GitHub repo selection loads installation repositories and calls the temporary analyze endpoint, which currently returns an empty response. | `FetchGithubReposResponse` |
| GitHub service    | Protected GitHub routes refresh a saved installation token before accessing installation repositories. | `GitHubConnection` |
| Resume generation | Future evidence aggregator and AI synthesis should consume analyzer outputs instead of raw repo dumps.            | `ProjectStructureAnalysisResult` |

---

## 8. Implementation Status

### Phase 1: Project Structure Analyzer

- [x] Analyzer file structure created
- [x] Project structure input/output types defined
- [x] Path lookup helper created
- [x] Project shape detector implemented
- [x] Structure-inferred stack detector implemented
- [x] Focused tests added for current detection behavior
- [x] Temporary endpoint logs selected repository summaries
- [x] GitHub connection middleware protects repo/analyze routes
- [x] Detected areas builder
- [ ] Architecture signals builder
- [ ] Maturity signals builder
- [ ] Candidate files builder
- [ ] Resume signal hints builder
- [ ] Feedback builder

### Phase 2: Future Repo Signal Analyzers

- [ ] Dependency/config analyzer
- [ ] Source code analyzer
- [ ] Test quality analyzer
- [ ] README/docs analyzer
- [ ] CI/CD analyzer
- [ ] Commit analyzer
- [ ] Pull request analyzer
- [ ] Evidence aggregator
- [ ] AI resume synthesis

---

## 9. Risks & Mitigations

| Risk                                                     | Mitigation                                                                                             |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| GitHub analysis docs grow too large to retrieve reliably | Keep orchestration, project-structure analyzer details, and history in separate focused sub-docs.      |
| Path-based rules misclassify unusual repo layouts        | Use scoring, return `unknown` for weak evidence, and later compare against dependency/config evidence. |
| `inferredStack` is mistaken for confirmed stack          | Keep the field name explicit and document that dependency/config analysis owns final stack confidence. |
| Weak repos produce bad resume claims                     | Feed gaps, limitations, and improvement suggestions into user-facing feedback before final synthesis.  |

---

## 10. History & Decisions

- **Changelog:** [changelog.md](changelog.md)
- **Architecture decisions:** [adr/](adr/)

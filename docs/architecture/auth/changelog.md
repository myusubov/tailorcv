# Auth Changelog

> Chronological implementation history for Auth. Add new entries at the top.

---

## 2026-04-07

### Auth Doc Split

- **Decision:** Split the oversized auth domain doc into a hub plus focused sub-docs for flows, SSO, and testing.
- **Problem:** `docs/architecture/AUTH.md` had grown to nearly 600 lines and mixed three distinct auth sub-systems, which reduced retrieval quality for both humans and AI and crossed the project's split threshold.
- **Solution:**
  1. **`docs/architecture/auth/README.md`**: Created a hub doc that keeps the high-level auth philosophy, status, and navigation.
  2. **`docs/architecture/auth/flows/README.md` + `docs/architecture/auth/sso/README.md` + `docs/architecture/auth/testing/README.md`**: Moved implementation details into focused sub-docs by concern.
  3. **`docs/architecture/README.md`**: Updated the architecture index so the new auth hub is the single entry point.
- **Outcome:** Auth documentation is now split by concern, below the effective retrieval threshold per file, and easier to update without mixing unrelated flow, SSO, and testing detail.

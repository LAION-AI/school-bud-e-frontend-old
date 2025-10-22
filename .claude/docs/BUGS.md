# Known Bugs and Issues

This document tracks known bugs, issues, and their solutions in the School Bud-E Frontend project.

**Last Updated:** 2025-10-22

---

## Table of Contents

1. [Active Bugs](#active-bugs)
2. [Resolved Bugs](#resolved-bugs)
3. [Bug Reporting Guidelines](#bug-reporting-guidelines)

---

## Active Bugs

*(No active bugs)*

---

## Resolved Bugs

### 1. "API-Schlüssel einrichten" Button Not Working / Sidebar Navigation Not Working

**Status:** Resolved
**Resolved:** 2025-10-22
**Severity:** High
**Reported:** 2025-10-22
**Component:** Routing / Navigation

**Description:**

The "API-Schlüssel einrichten" (Set Up API Key) button in the Welcome Banner does not navigate to the settings page. When users click the button, nothing happens or the navigation fails.

**Affected Areas:**
- Welcome Banner component (`components/WelcomeBanner.tsx:40-44`)
- Initial user onboarding flow
- API key setup process
- New user experience

**Environment:**
- Framework: Fresh 2.1.2 (recently upgraded from alpha.46)
- Runtime: Deno
- Browser: All browsers affected
- Component: WelcomeBanner.tsx with `<a href="/settings">` link

**Reproduction Steps:**
1. Load the application without a configured API key
2. Welcome Banner appears with "API-Schlüssel einrichten" button
3. Click the "API-Schlüssel einrichten" button
4. Observe that navigation to `/settings` does not work

**Expected Behavior:**
- Clicking the button should navigate to the settings page
- User should see the API key configuration interface
- Settings page should load at `/settings` route

**Actual Behavior:**
- Button click does not navigate to settings page
- No visible error in console
- Page does not change or reload
- The `<a>` tag uses `href="/settings"` which should work with server-side navigation

**Possible Causes:**
- **Primary cause:** Client-side navigation not working (directly related to Bug #2)
- The `<a href="/settings">` link relies on browser navigation which may be intercepted
- Fresh framework may be attempting client-side navigation that fails
- JavaScript error preventing default navigation behavior
- Route exists correctly at `routes/(dashboard)/settings.tsx` which maps to `/settings` (route groups with parentheses are invisible in URLs per Fresh documentation)

**Workarounds:**
- Manually type `/settings` in browser address bar (server-side navigation)
- Right-click button and "Open in new tab" (bypasses client-side navigation)
- Use browser console to check for JavaScript errors
- Temporarily use `window.location.href = "/settings"` in onclick handler

**Solution:**

**Root Cause:**
The Fresh framework's Partials feature was not correctly configured. The Partial was initially placed in individual layout files, which prevented proper layout switching when navigating between different route groups (e.g., from homepage with Navbar to dashboard with Sidebar).

**Fix Applied:**
Added `<Partial name="body">` in `routes/_app.tsx` at the root level to wrap the entire `<Component />` tree. This ensures that:
1. **Complete layout switching** - When navigating from homepage to dashboard, the entire layout changes (Navbar → Sidebar)
2. **Proper client-side navigation** - Fresh can update the entire body content including different layouts
3. **No duplicate partials** - Single partial at root level, no partials in individual layouts
4. **Correct hierarchy** - `_app.tsx` → `_layout.tsx` → route group layouts → page components

**Files Modified:**
- `routes/_app.tsx` - Added `<Partial name="body">` wrapper around `<Component />`
- `routes/(dashboard)/_layout.tsx` - Removed `<Partial name="content">` (no longer needed)
- `routes/(homepage)/_layout.tsx` - Removed `<Partial name="content">` (no longer needed)
- `routes/(simple)/_layout.tsx` - Removed `<Partial name="content">` (no longer needed)

**Related Files:**
- `components/WelcomeBanner.tsx:40-44` - Button with non-working navigation
- `routes/(dashboard)/settings.tsx` - Settings page route (correctly maps to `/settings`)
- `routes/(dashboard)/_layout.tsx` - Dashboard layout
- `islands/signin/ApiKeySetup.tsx` - API key setup component
- `fresh.config.ts` - Framework configuration

**Notes:**
- This is a high priority bug as it blocks new users from setting up API keys
- **Directly related to Bug #2 (Client-Side Redirects Not Working)** - same root cause
- Route groups with parentheses `(name)` are invisible in URLs - this is correct Fresh behavior since 1.x
- The route `routes/(dashboard)/settings.tsx` correctly maps to `/settings` URL
- The problem is NOT with route groups, but with navigation/redirects in general
- Testing direct URL navigation will help isolate if it's purely a client-side navigation issue

---

### 2. Client-Side Navigation/Redirects Not Working (Sidebar, Links)

**Status:** Resolved
**Resolved:** 2025-10-22
**Severity:** Medium
**Reported:** 2025-10-22
**Component:** Routing / Fresh Framework

**Description:**

Client-side navigation was not functioning properly throughout the application. All navigation links (sidebar, buttons, `<a>` tags) caused page reloads or didn't navigate at all.

**Affected Areas:**
- Sidebar navigation links
- All `<a>` tag navigation within dashboard
- Navigation between chat routes
- Settings page access
- All dashboard routes

**Environment:**
- Framework: Fresh 2.1.2 (recently upgraded from alpha.46)
- Runtime: Deno
- Browser: All browsers affected

**Root Cause:**

Same as Bug #1 - Fresh Partials misconfiguration. The `_app.tsx` enabled `f-client-nav` and defined `<Partial name="content">`, but the dashboard layout didn't wrap its content in the corresponding `<Partial>` component.

**Solution:**

Same fix as Bug #1 - Added `<Partial name="body">` in `routes/_app.tsx` at the root level. See Bug #1 for detailed solution.

**Files Modified:**
Same as Bug #1

**Related Files:**
- `routes/_app.tsx` - Contains `f-client-nav` and Partial definition
- `islands/sidebar/SidebarLink.tsx` - Sidebar links with `f-client-nav` attribute
- All dashboard routes - Now work with client-side navigation

**Notes:**
- This was the same root cause as Bug #1
- Both bugs resolved with single fix
- Client-side navigation now works correctly throughout the application
- Sidebar remains static while content updates during navigation

---

## Resolved Bugs

See bugs #1 and #2 above for resolved issues.

---

## Bug Reporting Guidelines

### When to Add a Bug

Add a bug to this document when:
- You encounter unexpected behavior during development
- Tests fail due to a defect
- User reports an issue
- Code behaves differently than documented
- Any reproducible problem that needs tracking

### Bug Entry Format

Each bug should include:

1. **Title:** Clear, concise description (e.g., "Client-Side Redirects Not Working")
2. **Status:** Active, Under Investigation, Resolved, Wontfix
3. **Severity:**
   - **Critical:** Blocks core functionality, data loss
   - **High:** Major feature broken, significant impact
   - **Medium:** Feature partially broken, workaround exists
   - **Low:** Minor issue, cosmetic, edge case
4. **Reported:** Date discovered
5. **Component:** Which part of the codebase is affected
6. **Description:** What is the problem
7. **Affected Areas:** Specific features/pages impacted
8. **Environment:** Framework versions, runtime, browser
9. **Reproduction Steps:** How to trigger the bug
10. **Expected Behavior:** What should happen
11. **Actual Behavior:** What actually happens
12. **Possible Causes:** Technical reasons (if known)
13. **Workarounds:** Temporary solutions
14. **Solution:** Final fix (when resolved)
15. **Related Files:** Code locations
16. **Notes:** Additional context

### Updating Bugs

- **When investigating:** Add findings to "Notes" section
- **When implementing fix:** Update "Solution" section with details
- **When resolved:** Move to "Resolved Bugs" section with resolution date
- **Keep history:** Don't delete resolved bugs, they're valuable documentation

### Cross-Referencing

- Reference bug entries in commit messages: "Fix client-side redirects (see .claude/docs/BUGS.md)"
- Link to specific line numbers: `file.ts:123`
- Reference related issues, PRs, or documentation

---

## Bug Priority Guidelines

**Critical (P0):**
- Data loss or corruption
- Security vulnerabilities
- Complete feature failure
- Crashes or unrecoverable errors

**High (P1):**
- Major feature broken
- Significant user impact
- No reasonable workaround

**Medium (P2):**
- Feature partially broken
- Workaround exists
- Affects some users

**Low (P3):**
- Minor issue
- Cosmetic problem
- Edge case
- Minimal user impact

---

## Notes

- This document should be updated whenever bugs are discovered or resolved
- All team members and AI assistants should maintain this documentation
- Include technical details to help future debugging
- Document workarounds even if temporary
- Keep resolved bugs for historical reference and learning

---

*This is a living document. Please keep it updated as bugs are discovered and resolved.*

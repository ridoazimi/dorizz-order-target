# Dorizz Order Target
Static GitHub Pages frontend. All metrics require an active Dorizz Store admin with transaction-view permission. No production data, admin credentials, or tokens are published here.

Period: 29 September 2026 00:00 WIB through 28 October 2026 23:59:59 WIB. Target: 2940 successful transaction records, dated by purchaseDate.

Login opens a Dorizz Store window and grants a scoped read-only token held only in memory for this tab. Reloading requires reconnecting the store session. Data uses authenticated fetch streaming (SSE), driven by committed database transaction notifications. No scheduled count polling. Reconnection always receives a fresh authoritative snapshot, so duplicated events do not increment the total twice.

Deploy main at repository root. Local tests: npm test. Browser security intentionally allows only the production API origin; serve at the published GitHub Pages URL for login E2E testing.

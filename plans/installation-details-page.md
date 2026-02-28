# Implementation Plan: Installation Details Page

**Created:** 2026-03-01
**Status:** Draft
**Estimated Effort:** XS

## Summary

Transform the existing `InstallationPage` from a pure onboarding wizard into a two-state page:
- **Has installation**: Show installation details (machine name, OS, arch, status, last seen, IP, port, version, channel ID) in a detail card, followed by the existing token generator for re-linking.
- **No installation**: Show the current onboarding wizard as-is (instructions + token generator).

No backend changes needed — `GET /installation/me` already returns all fields. No new dependencies.

## Research Findings

### Repository Patterns
- Detail pages use `max-w-4xl mx-auto space-y-8 mt-8` outer wrapper with stacked white cards (`bg-white/90 shadow-2xl rounded-2xl p-8 border border-gray-200`)
- Loading/error guards at the top: `if (loading) return <div>...</div>`
- `useInstallation` hook already fetches from `/installation/me` and returns `{ installation, hasInstallation, loading, checked }`
- Status badges use colored pills: `bg-green-100 text-green-700`, `bg-yellow-100 text-yellow-700`, etc.

### Available Data (from `Installation` interface in api.ts)
- `machine_name` — Machine hostname
- `os` — Operating system
- `arch` — CPU architecture
- `version` — Generator version
- `ip` — IP address
- `port` — Port number
- `status` — e.g. "online"/"offline"
- `last_seen_at` — ISO timestamp
- `created_at` — ISO timestamp
- `channel_id` — RabbitMQ channel

### Gaps Identified
None — all data is already available from the API.

## Questions to Resolve

None — straightforward feature.

## Implementation Order (TDD)

### Step 1: Refactor InstallationPage to show installation details
- **Implement:** `src/pages/settings/InstallationPage.tsx`
  - Import and use `useInstallation` hook
  - Add loading guard at top
  - When `hasInstallation`: render a detail card with all installation fields, status badge (green for online, amber for offline), formatted dates, and channel ID in monospace
  - When `!hasInstallation`: render the existing onboarding wizard (unchanged)
  - Keep the token generator section available in both states (collapsed/secondary when installation exists)
- **Validation:** `npm run build` passes, `npm run lint` clean

### Final: Cleanup
- [ ] Verify lint clean
- [ ] Verify build passes
- **Validation:** `npm run lint && npm run build`

## Acceptance Criteria

- [ ] When user has a linked installation, the page shows all installation details
- [ ] Status is shown as a colored badge (green=online, amber=offline)
- [ ] Dates (`last_seen_at`, `created_at`) are formatted in human-readable locale format
- [ ] When user has no installation, the page shows the setup instructions (current behavior)
- [ ] Token generation still works in both states
- [ ] Lint and build pass

## Security Considerations

None — read-only display of existing data from an authenticated endpoint.

## Performance Considerations

None — single API call already made by the existing hook.

## Related Files

- `src/pages/settings/InstallationPage.tsx` (main change)
- `src/hooks/useInstallation.ts` (reuse, no changes)
- `src/services/api.ts` (reuse `Installation` type and `getMyInstallation`, no changes)

---

## Next Steps

When ready to implement, run:
- `/wiz:work plans/installation-details-page.md` - Execute the plan

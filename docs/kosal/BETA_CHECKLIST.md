# Kosal beta readiness

This is a verification record, not a release approval. Kosal adds a source-adapted
Remocn interface, Codex design chat and architectural concepts to OpenTakeoff.
The original engine remains the source of truth for measurement and review.

## Original feature preservation

The complete source map remains [FEATURES.md](../../FEATURES.md). The takeoff
canvas change is limited to its wordmark import and wordmark rendering. Its
measurement handlers, review authority, file formats and storage have not been
rewritten. The new shell embeds the original App, including local, folder and
configured cloud workspace gates. Scoped CSS changes the interface surfaces,
typography and toolbar geometry; it does not change condition colours or marks.

| Original surface | Current evidence |
| --- | --- |
| PDF/image/ZIP ingestion, multi-page sheets, gallery and side-by-side | Original ingest and canvas remain; generated three-page vector PDF opened in the sheet navigator |
| Scale detection, calibration and metric/imperial display | Browser detected the generated sheet's 1:125 note; metric display verified |
| Area, rectangle, linear, surface, count and deductions | Original tools remain; rectangle measured a 6 × 6 m vault at 36.3 m² via screen clicks (under 1% difference) |
| Undo/redo and persistent takeoff records | Browser test rectangle undone, redone, then undone again; original pure engine tests passed |
| Conditions, materials, waste and roll-goods tools | Quantities panel opened with original controls; report carried 36.3 m² into 38.1 m² with 5% waste and supporting adhesive quantity |
| Report, column/template/theme settings and exports | Report opened with measured totals; toolbar wraps so Close/Export are reachable in the narrower shell |
| Markups, stamps, RFIs, revisions, text extraction, pins and review | Original components and handlers retained; visible in takeoff controls; every individual interaction is not yet manually verified |
| Profiles, archives, takeoff import/export and configured sync | Original File actions retained; underlying original tests passed; external sync needs a configured account and separate verification |
| Search, layouts, focus mode and classic layout | Original actions retained; toolbar scrolls to expose overflow; no options removed |
| Experimental/optional features | Original gates remain. One-Click Area is gated upstream; premium capabilities are labelled in development, not claimed as implemented |

## Added design tools

- Curated bank/café/IT building: 30 × 24 m, three distinct floors, 66 spaces,
  118 openings, 278 fixtures and aligned stair/lift cores.
- Floor plan, elevation, exploded SVG study and interactive Three.js model.
  The model supports orbit, zoom, pan, selected/all floors, explosion and cutaway.
  Shared-wall de-duplication, real apertures and metre/feet world coordinates have
  regression coverage. Orbit was exercised in the browser.
- Authenticated local Codex request produced cross-floor edits. Unapplied proposals
  survive reload, validation precedes application, and interrupted briefs recover.
- Architectural PDF export has three vector A3 pages; editable JSON preserves all
  floors. SVG architectural details now match the selected floor; see verification below.

## Desktop gates

Target runtimes are staged from the pinned Codex npm lockfile. Downloaded archives
must pass SHA-512 integrity before extraction; a Mac build cannot silently reuse
its Mac binary for Windows. The package smoke script checks target metadata,
executes bundled Codex, serves the compiled UI and checks its referenced assets.

Local packaging completed for Apple Silicon Mac and Windows x64. The Mac
package smoke test executed bundled Codex 0.162.1, served the built interface and
verified its assets. The Windows NSIS installer was cross-built on Mac with its
Windows runtime and license files; Windows execution remains unverified.

The workflow builds on native macOS Apple Silicon, macOS Intel and Windows x64
runners ([GitHub runner reference](https://docs.github.com/en/actions/reference/runners/github-hosted-runners)).
It is prepared locally; a checked-in workflow is not evidence that CI has run.
Packaging follows [electron-builder's platform guidance](https://www.electron.build/docs/features/multi-platform-build/).

Before public beta:

- Run the native Windows job and verify installation, login, rendering and exports
  on a real Windows session. A cross-built installer alone is insufficient.
- Exercise Intel Mac package and first-launch authentication without developer tools.
- Sign and notarize Mac installers and sign Windows installers with the product's
  release identity. Current local development packages are unsigned.
- Exercise archive/profile round trips, markups/revisions/RFIs and printed reports
  in the Kosal shell, not just pure-function tests.
- Verify room movement with attached openings/furniture; ownership relationships are not yet modeled.
- Continue quality evaluation of generated designs beyond the two fresh brief tests recorded below.
- Keep concept limitations visible; layouts are not construction approval, structural
  design, fire compliance or surveyed boundaries.

## October 12: editing, reports and walkthrough verification

Architectural SVG now includes every opening and fixture on the selected floor.
Browser verification selected a desk on the drawing, edited its position, rotated
it 90 degrees, cancelled a pending numeric edit and undid the committed move.
Vector PDF and SVG exports were rendered and inspected.

A fresh authenticated Codex generation from an empty plan produced three floors,
47 spaces, 76 openings and 171 fixtures. A second generation using only
“Design a great 3-floor building: bank, cafe and IT company.” produced three
floors, 50 spaces, 76 openings and 173 fixtures, with no rectangle overlap warnings.
This is a design policy/defaults improvement, not model fine-tuning or a guarantee
of architectural quality.

Sidebar width, Projects and Layers heights, and the chat/preview divider support
pointer and keyboard resizing. All four preferences survived reload in isolated
browser verification. Prompt textarea borders and focus styling were corrected.
The connection/license footer labels moved out of the sidebar; source and license
remain in Guide and packaged license files.

The assembled 3D view is now the default. Enter building enables an eye-level
camera, WASD movement, drag to look, room navigation and floor switching. Wall
collision includes low window sills and allows door apertures. Furniture collision,
continuous stair travel and photorealistic materials are not implemented.

Design quantities are computed from editable geometry inside the agent workspace.
Reports include room areas, slabs, partitions, wall finishes, doors, glazing and
fixture counts. Rates remain unpriced until entered by the user. Browser input
of 100 INR/m³ for 432 m³ of slabs produced a 43,200 INR subtotal with other items
explicitly unpriced. The PDF report downloaded in the browser and was rendered
and inspected; CSV includes quantity basis. These concept quantities do not cover
structural sizing, reinforcement, foundations or MEP.

The PDF measurement workspace retains original handlers. Its header groups
advanced actions under More tools, while Open, File, Sheets, search, Quantities
and Report remain directly available. A contextual guide links back to design
quantities, explaining why imported PDFs need measurements before takeoff totals
exist. Full preservation of every original feature remains subject to the manual
verification gates above. Desktop artifacts built before this iteration require
refreshing before distribution.

Production verification also caught and fixed `.mjs` worker MIME delivery: the
packaged server now serves PDF.js workers as JavaScript with `nosniff`. A dedicated
HTTP regression test covers it. The generated three-page drawing subsequently
rendered in the production measurement workspace, and More tools expanded.
Current checks: full web suite 3,449 passing / four skipped / zero failing;
34 studio tests passing; build, lint, typecheck, benchmarks, OCR distribution and
relative documentation links passing.

## Arcloom Mac handoff

The product is now named Arcloom. The built-in imagegen tool produced the folded
architectural logo; the selected transparent PNG drives the sidebar and desktop
icon formats. The Mac bundle uses `com.arcloom.studio` while explicitly retaining
the existing `Kosal Studio` profile directory. Launching the renamed native app
restored the saved 3-Acre Farm Concept and its conversation. The packaged local
API confirmed authenticated ChatGPT access through bundled Codex. The extended
package smoke check passed: native arm64 runtime, compiled assets, PDF module-worker
MIME handling and all six attribution/license files. The refreshed web check and
34 studio tests passed. This package is unsigned and not notarized; distribution
signing remains a beta gate. Windows work is deferred at the user's request.

## Parametric views and room translation

The elevation and exploded study now derive their bounds, floor areas and height
from the actual project. South elevation draws only modelled south-edge openings,
including reverse-hinge coordinates; metre/feet conversions preserve physical
geometry. A 42 × 30 m browser test displayed 1,260 m² per floor.

Room translation has an explicit enabled-by-default scope control: furniture
fully contained by the room and openings on its boundary translate with it.
Shared boundary openings follow the selected room; neighbouring connections must
be checked afterward. Furniture dimensions stay unchanged. Browser verification
moved the manager's room by 12 m, confirmed its desk moved by the same distance,
and undid the change. Persistent ownership relationships and automatic adjacency
repair are still not implemented. New test-build bundle:
`release/arcloom-editor/mac-arm64/Arcloom.app`; its extended smoke check passed.
Full web checks and 36 studio tests passed.

Native Apple Silicon CI passed for the branded build at commit `41a41df4`.
Intel CI failed while detaching a busy DMG volume before its runtime smoke step.
The workflow now verifies the native app directory before creating installers,
and architecture is selected by the command rather than duplicated target lists.
The next native CI run must prove this change; Intel readiness is not yet claimed.

## Site report completeness

Site reports now include building footprints and water areas alongside plots,
roads, parking and landscaping. The boundary area is labelled as site area,
not gross floor area, and slab assumptions are displayed only when slabs are
actually estimated. Site schedules use Plots & areas. Metre/feet regression tests
cover building and water quantities. The browser showed the courtyard's 80 m²
water area, and site report PDFs with ordinary and 120-character unbroken titles
were rendered and inspected. Long report titles wrap within the page width.

Detailed single-floor briefs now request the existing building format with one
floor so openings and fixtures remain editable, without inventing extra storeys.
A live single-floor library generation has been started; its result still needs
verification before claiming that flow passed.

The first live library run failed validation because an opening ended outside the
footprint. This is a confirmed generation failure, not a successful test. The
runtime now allows one minimal geometry repair attempt, keeping the original
brief and unchanged saved drawing. A subprocess regression fixture verifies one
invalid draft is repaired, repeated invalid drafts stop after two attempts, and
input geometry remains unchanged. Studio checks now pass 38 tests. The live
library rerun is still pending and must be inspected before this flow is claimed
as verified.

Native Mac CI at `2b1df949` passed on both Apple Silicon and Intel, including the
native app smoke check and installer creation. Windows execution remains outside
the current Mac-focused work. Signing and notarization remain release gates.

The library rerun completed successfully: one floor, 300 m² footprint, eight spaces,
20 openings and 53 fixtures, with no rectangle overlap warnings. Its vector A3
plan was rendered and inspected. The exported project was imported into isolated
browser storage; its detailed floor plan, 3D interior room navigation and report
quantities were visible. This successful rerun did not need the repair path;
repair behavior remains verified through the subprocess fault-injection tests.
The initial failed run remains evidence that generation quality needs continued
review. Current test-build folder is `release/arcloom-reports/mac-arm64/Arcloom.app`.

## In-app Codex sign-in

The design chat now launches the bundled official CLI's browser sign-in, provides
an allowlisted fallback URL, supports cancellation and reconnects after an
observed authentication failure even when cached login status appears connected.
The connection card stays mounted across project changes. Empty conversations
open at the welcome area rather than scrolling past it.

Isolated browser verification used an injected authentication fixture: the URL
and cancellation controls appeared, cancellation removed the link, successful
completion enabled the composer, and an expired-session response exposed
**Sign in again**. Reauthentication completed despite the fixture's cached
connected status. The final UI clears a stale ready notice on auth failure.
No actual credentials were changed or user projects modified. A fresh live
browser authentication remains a manual beta gate; fixture success does not
prove a real OAuth round trip. Studio tests pass 43 cases; full web checks pass
3,449 tests with four skipped and zero failures. Protocol, tool-count, wiki and
relative documentation-link checks passed.

The refreshed Apple Silicon app in
`release/arcloom-onboarding/mac-arm64/Arcloom.app` passed the packaged runtime
smoke check: bundled Codex 0.162.1, native arm64 metadata, compiled assets,
PDF module-worker MIME handling and six attribution/license files. It remains
unsigned and unnotarized. The user's running app and saved project were preserved.
UI evidence: [signed-out workspace](../../output/ui/arcloom-codex-signin.png).

## Hospitality fixture support

Bed and shower fixture types extend the design building vocabulary without
changing existing records or measurement formats. The AI schema inherits these
types from the model. A rotated fixture regression covers JSON round trips,
metre/feet conversions, targeted edits preserving other fixtures and report
counts. All 44 studio tests and full web checks passed. A synthetic two-bedroom
fixture project was imported into isolated browser storage. Its floor plan
exposed selectable beds/showers, 3D cutaway showed both orientations, and the
inline report displayed two beds and two showers. The vector plan PDF was
rendered and inspected. This fixture study is not evidence of AI quality.
An authenticated eight-floor hotel generation is running separately; its outcome
is pending review. Native CI at `85cca9c3` passed on both Apple Silicon and Intel, including
packaged runtime smoke checks and installer creation. Windows CI failed and
remains deferred under the current Mac focus. Signing, notarization and fresh live OAuth remain gates.

Manual browser placement also verified a new 1.8 × 2 m bed centred in the selected
bedroom; undo restored the original two-bed study. Showers start at 1.2 × 1.2 m.
The refreshed `release/arcloom-hospitality/mac-arm64/Arcloom.app` passed the native
packaged runtime smoke check with Codex 0.162.1, compiled assets, PDF worker
delivery and all six attribution files. It remains unsigned and unnotarized.
[Hospitality 3D evidence](../../output/ui/arcloom-hospitality-3d.png) uses synthetic
fixture data. The user's running app and project were untouched.

## Access diagnostics

Building review now checks modelled boundary access, detached doors/passages and
window placement. Existing bank/café/IT starters have no such warnings. A sealed
vault and detached reverse-hinge opening regression verifies actionable messages,
metre/feet parity and unchanged geometry. Intentional interior glazing remains a
review warning, not a validation error. These diagnostics do not establish route
connectivity or regulatory compliance. All 46 studio tests passed. The live
eight-floor evaluation is still running and has no verified result yet.

The synthetic missing-bathroom-door example displayed its warning beside chat
and in the exported two-page quantity report. The report was rendered and
inspected. Full web checks passed (3,449 passing, four skipped); tool-count, wiki,
protocol and relative doc links passed. The review build at
`release/arcloom-review/mac-arm64/Arcloom.app` passed packaged native runtime,
compiled-asset, PDF worker and license smoke checks. Both native Mac CI jobs
passed for hospitality commit `9032eb06`; Windows is still deferred.
[Access warning UI](../../output/ui/arcloom-access-review.png).

## Eight-floor live evaluation

An authenticated Codex request generated THE ATRIUM in 585 seconds: eight
distinct floors in a 48 × 36 m footprint, 211 spaces, 264 openings and 408
fixtures. The proposal passed structural validation and had no room overlaps.
The new access diagnostics found three partial-wall core openings on each floor
(24 issues): one stair door and two passenger-lift passages extended beyond
their served room edges. A separate targeted AI correction completed in about
24 seconds. Exact object comparison proved only those 24 widths changed to
0.9 m; all other values, furniture, spaces, labels and notes stayed identical.
The corrected proposal has no warnings from current overlap/access diagnostics.
This does not prove connected routes, architectural suitability or compliance.

The model contains 31 beds, 22 showers and 13,824 m² gross floor area, with
20 proposed hotel keys, convention, coworking, services and rooftop uses. It
requires professional development: sparse guest capacity, oversized corridors,
borrowed daylight for some bedrooms, stair/lift lobby arrangements, plant/MEP
and envelope details remain unresolved. Generation latency was nearly the
ten-minute limit, so responsiveness for complex briefs needs improvement.

The full eight-page A3 plan set exported successfully; the level-3 plan was
rendered and inspected. The corrected editable project imported into isolated
browser storage and its report displayed matching totals and unpriced rates.
Large buildings now use a **Building floor** picker above four floors; shorter
buildings retain their tabs. Empty-chat scroll resets when changing projects,
and the drawing footer shows the actual floor elevation instead of a fixed 01.

Browser verification of the corrected model selected level 3 through the new
floor picker, confirmed the `ELEV. +12.0 m` footer, entered the building and
navigated to room 301 Deluxe king. The furnished interior rendered. The
eleven-page quantity report now includes the model's design assumptions and
unresolved issues; its notes page was rendered and inspected. All 46 studio
tests and the final full web check passed. The refreshed review Mac bundle
passed its native runtime smoke check.

Evidence: [original AI proposal](../../output/verification/eight-floor-hotel.arcloom.json),
[corrected editable proposal](../../output/verification/eight-floor-hotel-reviewed.arcloom.json),
[eight-page drawing set](../../output/verification/eight-floor-hotel-reviewed.pdf),
[quantity report](../../output/verification/eight-floor-hotel-reviewed-report.pdf),
and [interior preview](../../output/ui/arcloom-eight-floor-interior.png).

To audit the exact correction from the repository root:

```sh
node --input-type=module - <<'JS'
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {layoutWarnings} from './web/src/studio/model.js';
const read=name=>JSON.parse(fs.readFileSync('output/verification/'+name));
const original=read('eight-floor-hotel.arcloom.json');
const corrected=read('eight-floor-hotel-reviewed.arcloom.json');
for(const floor of original.floors)for(const opening of floor.openings.slice(0,3))opening.width=.9;
assert.deepEqual(corrected,original);
assert.deepEqual(layoutWarnings(corrected),[]);
console.log('Exactly 24 widths corrected; other data unchanged; no current review warnings.');
JS
```

## Rooftop and terrace rendering

The renderer previously capped the entire rooftop and excluded landscaped
terraces from the walkthrough menu. The roof now subtracts the union of
landscape rectangles on the top storey; a higher full-footprint storey still
covers lower terraces. The geometry tests verify expected roof area, no double
coverage, complete outdoor subtraction, physical-unit parity and unchanged
input data. Navigation includes rooms/landscapes and excludes water/parking.
The location selector is controlled by the camera's actual space, including
return-to-entry resets. All 49 studio tests passed. Browser and updated native
package verification are pending for this iteration.

Isolated browser verification navigated to the level-7 landscaped roof terrace,
confirmed the open sky and distinct landscape surface, returned to the guest
core lobby and observed the menu reset, then switched to level 2 and visited
its covered club terrace. Both menu and location badge stayed consistent.
[Open rooftop evidence](../../output/ui/arcloom-rooftop-walkthrough.png).
The full web check passed (3,449 tests, four skipped). Tool-count, wiki, protocol
and relative doc links passed. The new `release/arcloom-terraces/mac-arm64/Arcloom.app`
passed packaged native runtime smoke checks with Codex 0.162.1, compiled assets,
PDF worker delivery and all six attribution files. It remains unsigned and
unnotarized. Both native Mac CI jobs passed for the previous review commit
`8bffa431`; Windows remains deferred.

## Viewed-space agent context

The walkthrough previously changed the camera without informing agent chat of
the viewed space. The composer now shows a **Viewing ·** context chip and sends
that room/landscape ID in the existing selected-ID request field. Manual
selection takes priority. Project/floor identity and saved-preview visibility
guards prevent stale or unapplied-proposal context from leaking into a saved
drawing request. Viewing does not change editor selection or geometry. The
callback is stable, and location reports occur on transitions rather than every
frame. View context remains transient and must be chosen again after reload.

All 52 studio tests passed, including priority, stale identity, preview exclusion
and site-selection regressions. Live browser verification navigated to the
rooftop terrace and sent “Rename this space to Roof garden” without naming the
floor or terrace. The production API received selected ID `r15` on floor `f7`.
Authenticated Codex returned a review proposal; exact object comparison verified
only that label changed. Discard restored the original label; Clear removed the
Viewing chip until deliberate navigation. Temporary request/result capture was
removed after the test, and the normal isolated QA server was restored.

| Boundary | Evidence |
| --- | --- |
| Viewed location → composer | [Viewing chip](../../output/ui/arcloom-viewed-context.png) |
| Composer → local API | Captured request selected `r15`, matching the saved level-7 terrace |
| API → Codex → validated proposal | [Normalized audit hashes and exact comparison](../../output/verification/viewed-context-proof.json) |
| Proposal → review UI | [Review controls](../../output/ui/arcloom-context-proposal.png); proposal remained unapplied |
| Discard / Clear | Original terrace label restored; Clear viewed space button count became zero |

Console inspection also found deprecated Clock and removed PCFSoftShadowMap
usage. The renderer now uses the installed Three.js Timer with Page Visibility
handling and cleanup, plus PCFShadowMap. Final browser and native package checks
are pending for these API updates.

The final viewer was reloaded after the Timer/shadow changes, entered the
rooftop terrace and displayed matching camera/menu/composer context. A held
movement control moved the view without resetting it. No new browser warnings
or errors were captured after this reload.
[Final viewed-space UI](../../output/ui/arcloom-viewed-context-final.png).
The final full web check passed (3,449 tests, four skipped); tool-count, wiki,
protocol and relative doc links passed. Native package verification is pending.

The refreshed `release/arcloom-context/mac-arm64/Arcloom.app` passed packaged
runtime smoke checks: native arm64 metadata, bundled Codex 0.162.1, compiled
assets, PDF worker delivery and all six attribution files. Both native Mac CI
jobs passed for terrace commit `3c974d85`; the context change still needs its
own CI run. Signing/notarization and public-beta manual QA remain open.

## Compact additions and removals

The model previously had to resend a complete building when adding or removing
items. The transient AI response now supports `changes` with add/remove
operations, alongside field edits. The server expands them locally into the
existing project format. A full proposal cannot be mixed with compact operations;
up to 100 combined operations run on a clone and pass final project validation.
Unknown targets, bad collections, out-of-bounds items, duplicate IDs and
conflicting full replacements reject the proposal without mutating input.
Exported project and takeoff schemas remain unchanged.

All 56 studio tests passed, including compound changes, atomic rejection,
site-format preservation and subprocess expansion/conflict handling. Live
authenticated browser/API verification used the eight-floor hotel and viewed
terrace `r15`: two 1 × 1 m planters were proposed via the compact path in
15.33 seconds. They fit within the terrace and did not overlap any existing
fixture footprint. Exact comparison verified every existing value was unchanged.
After applying in isolated QA, the inline report counted six plants instead of
four. The compact removal request completed in 9.868 seconds and returned
exactly the pre-addition project. Applying it restored four plants; the browser's
editable JSON export exactly matched the original request project. These are
measured cases, not a latency guarantee or an architectural certification.

The export test also found the old branded suffix. New design exports now use
`.arcloom.json`; the import validator continues accepting valid older JSON.
Final branded-export and native-package verification are pending.

The rebranded export downloaded as `THE ATRIUM.arcloom.json`; exact comparison
confirmed the data still matched the pre-addition project. The temporary API
recorder was removed and the normal isolated server restored.
[Compact mutation audit](../../output/verification/compact-mutations-proof.json),
[six-plant saved report](../../output/ui/arcloom-compact-addition-report.png),
[four-plant restored report](../../output/ui/arcloom-compact-removal-report.png).
The final full web check passed (3,449 passing, four skipped), and tool-count,
wiki, protocol and relative doc links passed. The new
`release/arcloom-compact/mac-arm64/Arcloom.app` passed native packaged runtime,
compiled-asset, PDF worker and attribution smoke checks. Both native Mac CI
jobs passed for prior context commit `75521709`; compact changes need their
own CI run. Packages remain unsigned/unnotarized, and Windows remains deferred.

## Camera continuity during edits

The 3D scene previously returned to its default camera whenever proposal or
saved geometry changed. It now captures a transient camera pose before scene
cleanup and restores it only for the same project, floor, view settings and
physical extents. Walkthrough restoration additionally checks the new wall
geometry. Explicit reset controls remain unchanged, and no camera fields are
added to persisted projects. Tests cover unit-conversion rounding, identity and
mode/extent changes, invalid poses and newly blocked positions. All 59 studio
tests and the full web check passed. A live camera-continuity UI test is pending.

Live browser verification moved and rotated the camera on the level-7 terrace,
then requested two planters. Proposal preview retained the terrace and look
direction; Discard retained that view. A second proposal was applied and undone
without returning to the entrance. In exterior orbit mode, a deliberately
rotated view remained through Redo and Undo; screenshots were inspected.
The isolated test drawing was restored with Undo. These checks verify same-scene
updates; closing the viewer, opening reports and page reload do not preserve
the component's transient camera state.

Evidence: [before](../../output/ui/arcloom-pose-before.png),
[proposal preview](../../output/ui/arcloom-pose-proposal.png),
[discarded](../../output/ui/arcloom-pose-discard.png),
[applied](../../output/ui/arcloom-pose-applied.png),
[undone](../../output/ui/arcloom-pose-undone.png),
[orbit before](../../output/ui/arcloom-orbit-before.png),
[orbit redo](../../output/ui/arcloom-orbit-redo.png),
[orbit undo](../../output/ui/arcloom-orbit-undone.png).
Tool-count, wiki, protocol and relative doc links passed. Both native Mac CI
jobs passed for prior compact-edit commit `4863ddc9`; the camera change needs
its own native CI run.

The refreshed `release/arcloom-view/mac-arm64/Arcloom.app` passed native
packaged runtime checks for bundled Codex 0.162.1, compiled assets, PDF worker
delivery and six attribution/license files. Packages remain unsigned and
unnotarized; public-beta manual verification remains open.


### Selected-space request recovery — 2026-10-12

New sent requests persist optional selection IDs alongside their existing brief
and drawing snapshot. Recovery validates IDs against that snapshot and requires
the current drawing to match before using them. A current selection or viewed
space takes priority; clearing recovery context retains the brief. Legacy
records without selection keep their original shape. Project exports, takeoff
formats and review authority are unchanged.

The owned localhost test paused its first request with a controlled fixture,
then reloaded to abort it. This first attempt was not a model run. The recovered
composer showed the level-7 rooftop target. Changing the project name showed a
warning and disabled Send; restoring it enabled an explicit retry. The second
attempt used authenticated Codex and sent the identical drawing and target ID
`r15`. The returned proposal differed only in that terrace's label, changing it
to “Roof garden”. Discard kept the saved drawing.

Evidence: [recovered target](../../output/ui/arcloom-retry-restored.png),
[stale context warning](../../output/ui/arcloom-retry-stale.png),
[reviewable proposal](../../output/ui/arcloom-retry-proposal.png),
[exact comparison](../../output/verification/retry-context-proof.json).
All 60 studio tests and the full web check passed before the live verification.
MCP tool-count/wiki checks, all 61 protocol tests, protocol documentation/matrix
checks and relative doc links passed. The isolated
`release/arcloom-recovery/mac-arm64/Arcloom.app` passed native runtime checks
with bundled Codex 0.162.1, compiled assets, PDF worker delivery and six license
files. Its ARM64 DMG passed `hdiutil verify`. Public-beta signing and
notarization remain open.

### Inspectable design checks — 2026-10-12

Structured geometry findings now identify floor and affected item IDs. The
review counts every detected issue while retaining only one bounded page.
The chat's **Design checks** section offers a floor filter, pagination and
navigation to the saved plan. Clicking a finding selects the first affected
item without applying proposals or altering geometry. Existing warning
summaries preserve their limits (15 building findings, 10 site/floor findings)
but now disclose the exact omitted count rather than hiding it. These checks
remain geometry diagnostics, not connected-route or compliance validation.

Tests cover counts beyond the warning limit, stable pagination, floor filtering,
exact targets despite duplicate labels, input preservation and physical-unit
parity. The owned localhost UI test imported an intentionally flawed three-floor
fixture with all openings removed. The section counted 65 issues, displayed
pages 1–25, 26–50 and 51–65, and disabled Next on the last page. Filtering to
the IT floor showed 22 issues. Clicking the Meeting room A finding opened that
floor and selected the matching room in the inspector. Export comparison
preserved every drawing value except the new project ID assigned at import.
This is a navigation test, not evidence of architectural generation quality.

Evidence: [floor filter](../../output/ui/arcloom-design-check-filter.png),
[second issue page](../../output/ui/arcloom-design-check-page.png),
[selected room](../../output/ui/arcloom-design-check-locate.png),
[exact export comparison](../../output/verification/design-check-navigation-proof.json).
The report UI also disclosed 50 additional findings beyond its first 15.
All 62 studio tests, the full web check (3,449 passing, four skipped), MCP
tool-count/wiki checks, all 61 protocol tests and relative doc links passed.
`release/arcloom-checks/mac-arm64/Arcloom.app` passed native runtime checks for
bundled Codex 0.162.1, compiled assets, the PDF worker and six license files.
Its ARM64 DMG passed `hdiutil verify`. Signing/notarization and the wider
public-beta manual checklist remain open.

### Identifiable Mac beta builds — 2026-10-12

Before packaging, a build metadata file records the product version, target,
Electron version, build time and a content-derived build ID. The native About
panel and Guide display the ID. Original takeoff generator versions, schemas,
storage profiles and drawing exports are unchanged. No project, conversation or
credential data enters the fingerprint.

The runtime digest covers compiled web files, studio modules, shipped model
JavaScript, the desktop entry point and the staged Codex runtime. It excludes
its own metadata file to avoid self-reference. Native package smoke verification
recomputes that digest from the packaged files, validates target/Electron/product
versions and checks that the same metadata is served as JSON. This identifies
runtime content, not publisher authenticity or notarization.

Tests prove stable identity across metadata rewrites and changed identity for
UI, server, model, desktop and Codex changes, architecture/version changes and
invalid metadata. All 64 studio tests, the full web check, MCP tool-count/wiki
checks, all 61 protocol tests and relative doc links passed.
The packaged ARM64 runtime's recomputed digest matched metadata, and Guide
showed the same build ID `3a23dfe6046b` with version `0.1.0-beta.1`. A development
view without metadata handled the missing file without breaking Guide. Native
About panel rendering is still a manual verification item.

Evidence: [Guide build identity](../../output/ui/arcloom-build-identity.png),
[verification record](../../output/verification/build-identity-proof.json).
The refreshed ARM64 DMG and ZIP both passed installer verification and were
copied into the isolated release directory’s `verified` folder. No Developer ID
Application certificate is
available in the current signing identities. Packages remain unsigned and
unnotarized; the wider public-beta checklist remains open.


The [prior design-check CI run](https://github.com/buddhathemanoj/opentakeoff/actions/runs/38188245404)
passed Apple silicon packaging. Its Intel native checks passed, but installer
creation failed with `Unable to detach device cleanly` / `Resource busy`.
The packaging wrapper now retries that specific Mac failure once. Other errors
and repeated failures still fail the job. A post-build verification step checks
DMGs with `hdiutil verify` and ZIPs with `unzip -t`, copies only valid files into
a fresh `verified` directory and lets CI retain those verified Mac artifacts
even if another installer failed. Windows upload still requires successful
installer creation. No disks are force-detached by this wrapper.

The wrapper built both local ARM64 installer formats successfully. Both passed
the new verification step. A deliberately corrupt ZIP failed verification and
left its upload directory empty. Tests replay the observed failure, bounded
retries and non-Mac/unrelated-error refusal. Workflow YAML parsed successfully.
Both Mac jobs passed for build-identity commit `d93b3ffb` in
[its CI run](https://github.com/buddhathemanoj/opentakeoff/actions/runs/38188970899).
Windows test-path failures remain outside the current Mac focus.


### Explicit floor openings — 0.1.0-beta.2

A building-only `void` element now represents an opening through its slab.
No existing project fields or machine originals are rewritten; the original
site/floor and takeoff schemas are unchanged. Old building files remain valid.
Older beta readers reject new files containing this kind, so the product beta
version has advanced to 0.1.0-beta.2.

Shared rectangle subtraction computes disjoint floor/ceiling panels and opening
unions. Ceiling geometry uses openings in the nearest upper slab. Buildings
with voids render all storeys during walkthroughs, translated relative to the
active floor, with the ground below the lowest storey. Camera placement,
restoration and movement check void bounds. Unsupported destinations are not
listed. Review diagnostics flag overlapping rooms/surfaces/fixtures and openings
on void boundaries, while accepting glazing on explicit outdoor boundaries.
Slab quantities deduct the union once; schedules identify floor openings.

All 69 studio tests and the full web check passed. Tests cover schema separation,
unit conversion, nested openings, upper-slab selection, bounds, supported camera
points, derived quantities and targeted diagnostics. The authored six-floor
courtyard fixture has five 8 × 8 m upper openings: 320 m² total openings and
320 m³ slab concrete at 0.2 m thickness, compared with 384 m³ before deductions.
The UI displayed those quantities and rendered the courtyard cutaway and
third-floor interior. Console checks found no warnings or errors. This fixture
is geometry verification, not an AI-generated programme or construction approval.
Live AI programme generation remains pending for this capability.


The opening pattern and ceiling height both follow the nearest actual upper
slab, including when its elevation differs from the lower storey height. A top
roof uses its own outdoor areas. Glazing is clearer in the concept viewer.
A controlled proposal changing the footprint from 20 × 16 m to 24 × 16 m showed
384 m² in the viewer footer; Discard restored 320 m². This proposal was a local
fixture, not a model call. Preview drawing now closes the report panel to show
the viewer. The saved design is unchanged by these navigation actions.

Evidence: [cutaway](../../output/ui/arcloom-courtyard-cutaway.png),
[interior](../../output/ui/arcloom-courtyard-walkthrough.png),
[quantities](../../output/ui/arcloom-courtyard-quantities.png),
[proposal footprint](../../output/ui/arcloom-proposal-footprint.png),
[opening audit](../../output/verification/floor-opening-proof.json),
[authored fixture](../../output/verification/courtyard-six-floor-qa.arcloom.json),
[drawing sheets](../../output/verification/courtyard-six-floor-qa.pdf),
[quantity report](../../output/verification/courtyard-six-floor-quantities.pdf).
The final full web check passed, followed by lint/build after the preview
navigation change. Source-backed documentation and repository checks passed.
The final ARM64 app in `release/arcloom-courtyard-final` passed runtime identity,
bundled Codex, assets, PDF worker and six-license checks as version
`0.1.0-beta.2`, build `8f2fd41648c2`. Both its DMG and ZIP passed installer
verification and were copied into its fresh `verified` folder. Signing and
notarization remain open. Its native CI run is still pending.
[Ground courtyard view](../../output/ui/arcloom-courtyard-ground.png).


### Large-programme generation and original workflow regression

The live six-floor NEXUS request exceeded the existing 600-second runtime limit
without returning a proposal. The request was not applied and the exact brief
was retained. Output repetition is a potential bottleneck, not a proven sole
cause. A new `fixturePatterns` response transport lets the model describe grids
that expand into ordinary editable fixtures. Grids require a containing space,
non-overlapping spacing, unique generated IDs, wall margins, valid geometry and
the existing 400-fixture floor limit. Full replacement proposals may use grids;
compact edits/changes may not mix with them. Expansion is atomic, and transport
fields are removed before returning the normal review proposal. Stored schemas
and original takeoff records are unchanged.

Tests cover 150 individual seats, unit parity, collisions, invalid targets,
spacing, bounds, count limits, source preservation and Codex runtime expansion.
All 72 studio tests passed. The unchanged university brief is being retried
through authenticated Codex; its result remains unverified.

Separately, automated manual-tool UI regression opened the public finish sample,
accepted its declared scale, committed one synthetic interior rectangle and
opened the report. This is not a room-accuracy benchmark or human approval.
The report exported 108.7 SF, 5% waste, 114.14 SF order quantity, 12.68 SY and one
gallon of adhesive at 250 SF/gal coverage. CSV and Excel values agreed; the
workbook retained Conditions, By sheet, Materials, Shapes and By floor × room.
Undo changed one shape to zero; Redo restored one. Reload retained both the
shape and scale. No approval stamp was used.

The PDF mode's header now identifies its independent workspace instead of
showing the CAD project name/save badge. Sidebar project navigation returns to
design; returning to PDF mode preserved the measurement. Source-backed evidence:
[original report](../../output/ui/arcloom-original-takeoff-report.png),
[workspace header](../../output/ui/arcloom-pdf-workspace-header.png),
[CSV](../../output/verification/original-takeoff-qa.csv),
[Excel](../../output/verification/original-takeoff-qa.xlsx),
[regression record](../../output/verification/original-takeoff-qa-proof.json).
This verifies the exercised workflow only; the wider original-feature manual
checklist remains open.


The full web check, MCP tool-count/wiki checks, all 61 protocol tests and doc
links passed. The refreshed ARM64 runtime in `release/arcloom-patterns` passed
native identity, bundled Codex, compiled assets, PDF worker and license checks
as beta 2 build `55c2cf04e595`. Its DMG and ZIP passed installer verification.
The compact-grid retry is still active; no claim of improved end-to-end
university generation quality is made yet. Packages remain unsigned and
unnotarized.


### Repairs of unreleased full proposals

The compact-grid NEXUS retry returned a six-floor draft with 125 space entries,
80 grids and 104 individually listed fixtures. It failed opening validation.
The one bounded repair returned edits referencing floors in that new draft;
the runtime incorrectly tried to apply them to the saved fixture and rejected
the missing floor. No proposal was applied. The initial draft was temporary
and was cleaned up, so the invalid opening's exact values were not retained.
These counts were observed during validation, not a completed design result.

Targeted repairs of failed full replacements now use the failed draft's
existing fields and IDs, validate the corrected proposal completely and retain
its original grids unless a replacement grid array is supplied. The saved
source remains untouched. Unknown targets, fields and collections refuse.
Normal compact refinements still use the saved drawing. The overall repair
budget remains one attempt. Opening validation messages now identify the item,
floor and permitted width range. Optional internal draft capture is used only
by the owned synthetic QA recorder; the application does not log drafts by
default or add telemetry.

The regression test reproduces new draft floor IDs absent from the saved
project, fixes its invalid opening, retains 150 grid-generated seats and
verifies the saved drawing is unchanged. All 73 studio tests passed. The full
university brief is being run again with this fix; the programme, rendering and
counts remain pending verification.


The full web check, tool-count/wiki checks, all 61 protocol tests and relative
doc links passed. The refreshed beta 2 ARM64 runtime in
`release/arcloom-draftrepair` passed native runtime identity, Codex, compiled
assets, PDF worker and license checks as build `9612fddb7412`. Both installer
formats passed verification. The live university run with corrected repair
handling remains active; signing/notarization and the wider quality checklist
remain open.


The third authenticated university request terminated at the 600-second limit
without a draft, so no repair occurred and no proposal was applied. The repaired
new-draft path is verified by its regression test, not yet by a successful live
university design. All three attempts retained the full programme and left the
saved fixture unchanged. The temporary QA recorder was removed and the normal
isolated server restored. Large-programme latency remains an unresolved MVP
requirement; schema/unit/native package checks do not establish design quality.

## Staged large-building generation checkpoint

New explicit four-to-twelve-floor briefs now use a shared blueprint and then
one detailed floor request at a time. Completed floors remain internal until
the final building validates and becomes one review proposal. Cancellation or
a failed stage returns no partial proposal and preserves the saved drawing.
Shared footprint, floor metadata and reserved geometry are checked at assembly;
new item IDs are namespaced by floor. Targeted refinements retain the existing
mutation path. The persisted building and original takeoff formats are unchanged.

`npm run test:studio` passes 78 tests, including actual subprocess transport of a
controlled four-floor response with 150 individual generated grid seats, shared
core rejection, floor-count rejection and cancellation between stages. The web
check, MCP tool-count/wiki checks, protocol check and doc-link check pass.

A real authenticated rerun of the full NEXUS programme returned the shared
blueprint in 138 seconds: 54 × 36 m, six floors, aligned stair/lift coordinates,
and five matching 12 × 12 m upper-floor openings at (21, 12). The
[synthetic university blueprint](../../output/verification/staged-nexus-blueprint.json)
is a planning artifact, not a complete furnished design. The detailed ground
floor was still running at this checkpoint. Complete AI programme quality,
assembled geometry, UI review and refreshed Mac packaging remain unverified.
The authenticated run remains live; do not restart it because an observation
wait expires.

## Staged proposal UI and real library checkpoint

An isolated controlled-response server at port 5191 exercised chat → staged CLI
transport → proposal review → apply. Four floors appeared in one review card;
the saved site name remained unchanged before application. Manual QA of this
path exposed a preview-mode mismatch: the header still said Site layout and
Measure drawing exported the saved site. These now follow the displayed
proposal. Drawing tools are disabled during proposal preview and enabled again
for Show original. The fixed measurement action imported the proposal's four
floor sheets into the original PDF workspace.

Evidence: [proposal preview](../../output/ui/arcloom-staged-preview.png) and
[proposal floor sheets](../../output/ui/arcloom-staged-measure-proposal.png).
These are explicitly controlled regression fixtures, not generated university
quality evidence. The full web check and 78 studio tests pass after the fix.

The real university run completed the ground floor with one structural repair
and the library floor without a repair, then moved on to teaching/making. The
library stage has 33 spaces (including its slab opening), 49 openings and 318
fixtures. Review found two missing modelled boundary passages on courtyard
circulation spaces, with no detected room overlaps or floor-opening overlaps.
The original run remains live and no complete six-floor proposal exists yet.
A copy of the library stage was imported only into the isolated QA profile for
[plan inspection](../../output/ui/arcloom-staged-library-plan.png) and
[reading-room walkthrough](../../output/ui/arcloom-staged-library-walkthrough.png).
This verifies one real generated floor, not the assembled building or every
programme requirement.

The initial staged native arm64 build 6385efa85659 passed packaged runtime checks
and a controlled four-floor generation inside its actual Electron executable.
Its DMG and ZIP passed integrity checks. The preview fixes require the refreshed
package at release/arcloom-staged-preview; do not confuse it with that initial
build. Local packages remain unsigned and unnotarized.

## Dense floor validation and retry checkpoints

The first staged university run terminated during the third-floor repair. Its
retained draft had valid base geometry but 473 furnishings (17 individual plus
456 from grids), exceeding the old 400-fixture floor limit. The subsequent
model repair timed out, so no full proposal was returned and the original
request's drawing stayed unchanged.

Arcloom beta.3 raises the bounded fixture capacity to 1,000 per floor. The
[retained real teaching floor](../../output/verification/staged-nexus-teaching.json)
now expands all 473 fixtures and has zero current geometry diagnostics. This
is still a single-floor stage, not a completed university. Older beta readers
reject files exceeding 400 fixtures; original Takeoff formats are unchanged.
A regression preserves 600 individual seats and rejects an over-limit addition
without changing the input.

A staged request now retains validated floors in bounded process memory for an
explicit retry of the same brief/drawing. Checkpoints expire after an hour, keep
at most two requests of 2 MB each, and are invalidated by changed conversation
instructions or drawing data. They are not persisted or applied. Controlled
UI QA failed on floor 2, then resumed after floor 1 on Send and returned the
complete four-floor proposal while the saved site name stayed unchanged.
Evidence: [resumed proposal](../../output/ui/arcloom-staged-resumed-proposal.png).
This is a transport regression, not a real AI quality claim.

Dense-floor inspection also exposed clipping after widening the preview. Fit
now uses both viewport dimensions, and enlarged content starts at reachable
scroll edges. The [teaching floor fit](../../output/ui/arcloom-staged-teaching-fit.png)
was checked against DOM bounds: the entire sheet lies inside its preview
viewport. No geometry was edited by this display fix.

After the dense-floor and fit fixes, all 82 studio tests and the full web check
passed, along with MCP tool-count/wiki, protocol and doc-link checks. Native
arm64 beta.3 build ada41617838e passed packaged content-digest validation,
bundled Codex execution, PDF-worker serving and license checks. A fresh full
NEXUS run was then started through chat in an isolated real API profile on port
5192, using the same complete brief and an authored six-floor QA baseline. Only
the expected synthetic brief captures diagnostic stage files in a temporary
QA directory; ordinary app requests do not enable this recorder. The new run
was still planning at this checkpoint. Its server process retains retry
checkpoints, and completed diagnostic stages are captured separately for
inspection if a later floor fails. No complete university is claimed yet.

## Assumption preservation and blueprint surface metadata

Staged assembly previously kept only the first 30 note strings in the project,
moving later notes to chat. Those later assumptions were absent from exported
reports. It now groups complete notes within the existing 30 × 1,000-character
schema bounds without discarding text. If the complete note set cannot fit, it
returns an explicit error rather than publishing an incomplete report. PDF
whitespace cleaning preserves separators between grouped notes.

A four-floor controlled regression provides 40 distinct stage notes and checks
every one in the exported project. A separate PDF stress artifact uses the
retained real teaching geometry with 40 explicitly synthetic QA notes. All 40
were verified with pdftotext, and the last PDF page was visually inspected with
no clipping: [PDF](../../output/verification/forty-assumption-report.pdf),
[rendered page](../../output/verification/forty-assumption-report-last.png).
Quantities & reports now shows design assumptions separately from calculation
basis, and chat's assumption section follows the previewed proposal.
[UI evidence](../../output/ui/arcloom-visible-design-assumptions.png).

The live run's initial blueprint used zero wall thickness only for the ground
garden, making otherwise valid geometry fail structural validation. Future
blueprints accept zero for landscape/void/water/parking transport and write
0.15 m nominal metadata in the canonical unit. Their footprints remain exact;
room wall thickness still rejects zero. Meter/foot regressions verify conversion
and input preservation. No stored format or original Takeoff field changed.
The live run was already executing older code and therefore used its bounded
model repair; it was not interrupted or restarted for this patch.

That run completed the [ground stage](../../output/verification/staged-nexus-ground.json):
36 spaces, 64 openings, 331 fixtures, and exactly 150 chairs contained within
the auditorium. Review found one internal-window warning (the AV viewing
window), with no room overlaps or other current geometry findings. Library
generation was live at this checkpoint. This is one completed floor, not a
complete university or compliance assessment.

Desktop CI run 38196305702 passed both Mac architectures at 979f7738. At the
next observation, run 38201693107 at e96cafc0 had passed arm64 while Intel was
still running. Windows remained failed on its previously known path issue.
All 84 local studio tests, full web check, MCP tool-count/wiki, protocol and
doc-link checks pass after the report/blueprint changes.

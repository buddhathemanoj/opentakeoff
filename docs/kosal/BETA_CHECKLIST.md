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

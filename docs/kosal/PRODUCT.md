# Arcloom

Arcloom is the Arcloom-branded spatial design and takeoff workspace built on OpenTakeoff.
The requested end state includes an improved editor inspired by Remocn Studio, integrated
Codex chat, editable AI-generated building and land layouts, and macOS and Windows apps.
Beta readiness must be demonstrated with working flows, not implied by this document.

## Product direction

Audience: architects, land planners and small development teams exploring a brief before
measuring and estimating a plan. Core sequence: brief → editable concept → review → export
or takeoff. Domain: site boundaries, setbacks, access roads, plots, building footprints,
room adjacencies and measurement sheets. Palette: graphite drafting tools, white drawing
paper, pale concrete, sage landscape and terracotta construction marks. Signature: one
scaled drawing sheet shared by direct manipulation and a visible AI proposal review.

The interface follows the supplied Remocn screenshot: a compact project sidebar, a
large quiet conversation, and a centered bottom composer. Preview opens the drawing
beside the conversation, revealing layers and editing controls when needed. Layout concepts are not surveyed boundaries or certified construction documents.

## Completion evidence required

- Kosal identity, consistent navigation, accessible empty/error/loading states.
- Create, name, save, reopen, edit, undo and export a project without data loss.
- Chat invokes the user's authenticated Codex runtime; credentials stay outside the renderer.
- AI can generate and revise editable site and floor-plan geometry from a brief.
- AI context includes selected geometry, dimensions and the existing project.
- Proposed changes are reviewed, validated and explicitly applied; failed/cancelled runs do not alter drawings.
- Existing PDF takeoff workflow remains reachable and functional.
- Desktop app launches on macOS; macOS and Windows packaging and CI are exercised.
- Installer signing/notarization and real Windows runtime testing are explicit release gates.
- Documentation, attribution, onboarding, feedback and beta checklist reflect actual functionality.

## Verification log

This goal began from the local OpenTakeoff setup on `codex/local-codex-setup`.
The existing Codex MCP coordinate fix has 287 passing MCP tests and 61 protocol tests.
The browser production build, lint and seven studio model/API tests pass. A real
Codex request using the local ChatGPT login generated a validated editable proposal.
Desktop packaging and runtime verification are in progress; this is not a release claim.

### Reference-aligned desktop iteration

- Conversation-first layout verified against the supplied October 12 screenshot; Preview
  opens the editable drawing alongside chat and reveals layers.
- Project conversations persist across reloads. Real Codex refinement, explicit apply,
  and undo were exercised in the browser using the local ChatGPT login.
- Web lint/typecheck/build pass. Web tests: 3,449 passed, four skipped, zero failed.
  Studio model/API tests: seven passed. `git diff --check` passes.
- Apple Silicon local desktop package built and launched at
  `release/local/mac-arm64/Kosal Studio.app`; bundled Codex reports ChatGPT connected.
  This is an Electron desktop app with macOS controls and menus, not a SwiftUI rewrite.
- Local package is unsigned and intended for this development machine. Windows runtime,
  release signing/notarization, custom application icon, and installer QA remain pending.
- Browser and desktop use separate local storage; export/import transfers drawings.

### Remocn source adaptation and three-floor concept

The interface is adapted from Remocn Studio commit
`0641f89fd077a91693c35593d769b6f3a300936a` (MIT), including the actual
`NeuroNoise` shader and its titlebar settings. Source mappings:

| Reference implementation | Kosal implementation |
| --- | --- |
| `app-shell.tsx`: 18rem sidebar, 8px inset, 12px radius, 56/44 preview | `studio.css`: 288px sidebar, matching inset and preview ratio |
| `projects-pane.tsx`: 32px rows, 16px icons, active rail | Studio navigation and project controls |
| `button.tsx`: 32px default, 28px small, 8px radius | Sidebar actions and titlebar buttons |
| `dock-layout.ts`: 128px composer, 672px maximum width | Studio composer |
| `titlebar.tsx` and shader backdrop: 96px masked NeuroNoise | `TitlebarAura.jsx` |
| DM Sans and Lucide React 1.7.0 | Locally bundled font and matching icon package |

The Kosal name, spatial design controls and original takeoff workspace are product
adaptations. The video/assets/components workflows are not copied or represented
as construction features. Attribution is included in THIRD-PARTY-NOTICES.md and
`desktop/licenses/remocn-MIT.txt`.

The curated 30 × 24 m concept has bank, café and IT floors, aligned stair/lift
cores, 66 spaces, 118 openings and 278 fixtures. It exports three vector A3 sheets.
This starter is authored geometry, not a claim of AI generation or construction
approval. A real Codex request refined labels across all three floors; proposal
restoration after reload and explicit application were verified in the browser.
All 21 studio tests, web lint, typecheck and production build pass. The shell,
preview and original takeoff workspace were visually checked after adaptation.

### Interactive building and retained engine verification

The interactive Three.js model renders editable walls with actual apertures,
furnishings and floor slabs, with orbit/zoom/pan, selected-floor visibility,
explosion and cutaway controls. Camera orbit was exercised in the browser. The
original takeoff canvas now uses scoped Kosal styling and a context wordmark;
measurement/storage/review handlers are unchanged. Report wrapping fixes a
Close/Export reachability problem caused by the narrower shell. See
[BETA_CHECKLIST.md](BETA_CHECKLIST.md) for evidence and remaining release gates.

Full web check passes: 3,449 tests passed, four skipped, no failures; geometry
benchmark and production build passed. Studio tests: 25 passed. The new Mac
package smoke check launched bundled Codex 0.162.1 and served the UI assets.
Native-platform package CI is prepared for Apple Silicon, Intel Mac and Windows
x64; Windows execution is still unverified.


### Product rename

The current product name is Arcloom. Its generated logo, exact prompts, asset paths
and storage continuity are recorded in [BRAND.md](BRAND.md). Kosal names in earlier
verification records describe previous builds; original schema IDs and profile
paths remain stable for compatibility. Current studio checks pass 34 tests.

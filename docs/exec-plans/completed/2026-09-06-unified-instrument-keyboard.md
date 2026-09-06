# Unified Instrument Keyboard

## Goal

Unify the one-octave and two-octave piano renderers, centralize note interaction/highlight/playback state, and inject playable instruments through a generic Vue-facing contract so future pitched instruments can reuse the same training inputs.

## Scope

- Replace `PianoKeyboard.vue` and `ScalePianoKeyboard.vue` with one range-configurable piano component.
- Give all piano keys the same semantic states: member, active, correct, and wrong, with black-key-specific rendering.
- Add a generic injected instrument registry and an interaction composable for one-shot notes, held notes, active-note highlighting, and cancellable sequences.
- Migrate keyboard memory, major-scale learning/practice, and the free piano tool.
- Add deterministic tests for keyboard geometry/state resolution and update architecture documentation.

## Non-goals

- A generic scoring/session engine for every exercise.
- A second instrument implementation.
- Web MIDI or persistence.

## Steps

1. Add reusable piano range/annotation domain helpers and tests.
2. Add instrument registry/injection and shared playback interaction composable.
3. Rebuild `PianoKeyboard.vue` on the shared contract and remove `ScalePianoKeyboard.vue`.
4. Migrate every caller and remove page-local playback/highlight timers.
5. Update architecture documentation, run `npm run check`, and verify affected routes in the browser at desktop and narrow widths.

## Progress

- [x] Shared piano model and tests
- [x] Instrument injection and interaction controller
- [x] Unified keyboard component
- [x] Caller migration
- [x] Documentation and verification

## Verification

- `npm run check`
- Browser: free piano, keyboard identification feedback, F♯ major learning keyboard, F♯ major wrong/correct feedback, and replayed scale activity.
- Responsive browser check at 320px: one-octave keyboard fits the viewport; two-octave keyboard remains locally scrollable.

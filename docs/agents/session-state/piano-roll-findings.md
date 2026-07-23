## Session state: piano-roll findings

Branch: fix/piano-roll-findings
Last session: 2026-07-23
Depth: architectural
Intent source: explicit 22-finding operator request

Work completed:
- ✅ Web playhead renders from the existing UI-thread playhead shared value.
- ✅ Zoom commits React/grid state only at gesture end.
- ✅ Grid and precision-panel scroll callbacks are bounded instead of every-frame.
- ✅ Precision editing honors snap-to-grid and drum resize locking.
- ✅ Locked drum fast flicks stay move-only; drag-preview seed width matches rendered minimum.
- ✅ Velocity preview callbacks are bounded to meaningful changes.
- ✅ Pinch and momentum interactions flush final values without per-frame React churn.
- ✅ Held-note previews stay bounded to their captured active loop when isolation changes.

Work remaining:
- ⬜ Commit/push/raise one PR after Review approval.

PR: none
Blockers: repository-wide Prettier lint reports large pre-existing formatting drift; targeted non-Prettier lint and typecheck pass.

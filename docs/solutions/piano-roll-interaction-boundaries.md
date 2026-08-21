# Piano-roll interaction boundaries

Keep row, pitch, and step calculations in shared pure helpers. On web, derive grid coordinates from `clientX - currentTarget.getBoundingClientRect().left`, with `offsetX`/`locationX` fallbacks.

Capture pointers on the synthetic event target. Track ownership per pointer and destination cell, release on capture loss, leave, blur, visibility change, and unmount, and bound edits to the clip using the note's real geometry rather than expanded hit targets.

Keep high-frequency playhead and gesture-preview state off React renders; commit grid state at gesture end. Provide equivalent keyboard controls for add, move, pitch, resize, and delete.

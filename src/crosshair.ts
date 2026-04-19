// Vertical offset of the crosshair in normalized device coordinates (-1..1).
// Positive = above screen center. Used by the Laser to aim through this point,
// and by the DOM crosshair to position itself at the matching pixel.
export const CROSSHAIR_NDC_Y = 0.22;

export const CROSSHAIR_TOP_PERCENT = ((1 - CROSSHAIR_NDC_Y) / 2) * 100;

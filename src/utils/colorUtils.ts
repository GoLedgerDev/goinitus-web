/**
 * Deterministic colour derived from an org MSP identifier string.
 * Uses djb2 hash clamped to a palette of 8 dark WCAG-contrast-safe hex values.
 * The same MSP always maps to the same colour across sessions and devices.
 */
const PALETTE = [
  '#1565C0', // blue 800
  '#00695C', // teal 800
  '#4527A0', // deep-purple 800
  '#AD1457', // pink 800
  '#E65100', // deep-orange 900
  '#283593', // indigo 800
  '#2E7D32', // green 800
  '#6A1B9A', // purple 900
] as const;

export function orgColor(msp: string): string {
  let h = 5381;
  for (let i = 0; i < msp.length; i++) {
    // djb2: h = h * 33 XOR char
    h = ((h << 5) + h) ^ msp.charCodeAt(i);
  }
  return PALETTE[Math.abs(h) % PALETTE.length];
}

import React from 'react';

// Programmatically generated Rotary-wheel inspired gear spinner
// 8-tooth gear wheel with hub cutout — clean at all sizes
function makeGearPath({ cx = 50, cy = 50, tipR = 46, rootR = 35, hubR = 13, teeth = 8 } = {}) {
  const tipHalf = (10 * Math.PI) / 180;
  const rootHalf = (15 * Math.PI) / 180;
  const f = (r, a) => [+(cx + r * Math.cos(a)).toFixed(2), +(cy + r * Math.sin(a)).toFixed(2)];
  let d = '';
  for (let i = 0; i < teeth; i++) {
    const alpha = -Math.PI / 2 + (i * 2 * Math.PI) / teeth;
    const p1 = f(rootR, alpha - rootHalf);
    const p2 = f(tipR, alpha - tipHalf);
    const p3 = f(tipR, alpha + tipHalf);
    const p4 = f(rootR, alpha + rootHalf);
    const nextAlpha = -Math.PI / 2 + ((i + 1) * 2 * Math.PI) / teeth;
    const pN = f(rootR, nextAlpha - rootHalf);
    if (i === 0) d += `M ${p1[0]},${p1[1]} `;
    d += `L ${p2[0]},${p2[1]} L ${p3[0]},${p3[1]} L ${p4[0]},${p4[1]} `;
    if (i < teeth - 1) d += `A ${rootR},${rootR} 0 0,1 ${pN[0]},${pN[1]} `;
  }
  // Close outer shape, then cut out hub with evenodd
  d += `Z M ${cx + hubR},${cy} A ${hubR},${hubR} 0 1,0 ${cx - hubR},${cy} A ${hubR},${hubR} 0 1,0 ${cx + hubR},${cy} Z`;
  return d;
}

// Pre-compute once at module load — never recomputed during renders
const GEAR_PATH = makeGearPath();

export default function LoadingSpinner({ size = 32, className = '', color }) {
  const fill = color || '#F7A81B'; // brand gold by default
  return (
    <div
      className={`spinner ${className}`}
      style={{ width: size, height: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
      aria-label="Loading"
      role="status"
    >
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: 'block' }}
      >
        <path d={GEAR_PATH} fill={fill} fillRule="evenodd" />
      </svg>
    </div>
  );
}

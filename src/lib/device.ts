// Shake detection + screen wake lock helpers.

type MotionPerm = { requestPermission?: () => Promise<'granted' | 'denied'> };

export async function requestMotionPermission(): Promise<boolean> {
  const DME = (window as unknown as { DeviceMotionEvent?: MotionPerm }).DeviceMotionEvent;
  if (DME && typeof DME.requestPermission === 'function') {
    try { return (await DME.requestPermission()) === 'granted'; } catch { return false; }
  }
  return 'DeviceMotionEvent' in window;
}

/** Calls onShake() whenever a vigorous movement is detected. Returns unsubscribe. */
export function listenShake(onShake: () => void, onAnyMotion?: () => void) {
  let last: { x: number; y: number; z: number } | null = null;
  const h = (e: DeviceMotionEvent) => {
    const a = e.acceleration;
    const g0 = e.accelerationIncludingGravity;
    if ((a && a.x != null) || (g0 && g0.x != null)) onAnyMotion?.();
    if (a && a.x != null && a.y != null && a.z != null) {
      const mag = Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z);
      if (mag > 11) onShake();
      return;
    }
    const g = e.accelerationIncludingGravity;
    if (!g || g.x == null || g.y == null || g.z == null) return;
    const cur = { x: g.x, y: g.y, z: g.z };
    if (last) {
      const d = Math.abs(cur.x - last.x) + Math.abs(cur.y - last.y) + Math.abs(cur.z - last.z);
      if (d > 18) onShake();
    }
    last = cur;
  };
  window.addEventListener('devicemotion', h);
  return () => window.removeEventListener('devicemotion', h);
}

type WL = { release: () => Promise<void>; addEventListener: (t: string, f: () => void) => void };
let lock: WL | null = null;
let want = false;

export async function keepAwake(on: boolean) {
  want = on;
  const nav = navigator as unknown as { wakeLock?: { request: (t: 'screen') => Promise<WL> } };
  if (!on) { try { await lock?.release(); } catch { /* */ } lock = null; return true; }
  if (!nav.wakeLock) return false;
  try {
    lock = await nav.wakeLock.request('screen');
    lock.addEventListener('release', () => { lock = null; });
    return true;
  } catch { return false; }
}

document.addEventListener('visibilitychange', () => {
  if (want && document.visibilityState === 'visible' && !lock) keepAwake(true);
});

export function vibrate(pattern: number | number[]) { try { navigator.vibrate?.(pattern); } catch { /* */ } }

import { useEffect, useRef } from 'react';

const COLORS = ['#34d399', '#60a5fa', '#fbbf24', '#f472b6', '#a78bfa', '#fb923c'];

/** Fires a short confetti burst each time `trigger` changes (unless reduced). */
export default function Confetti({ trigger, reduced }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(0);

  useEffect(() => {
    if (!trigger || reduced) return undefined;
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = window.innerWidth;
    const H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    const N = 120;
    const parts = Array.from({ length: N }, () => ({
      x: W / 2 + (Math.random() - 0.5) * 120,
      y: H * 0.34 + (Math.random() - 0.5) * 60,
      vx: (Math.random() - 0.5) * 9,
      vy: Math.random() * -11 - 3,
      size: Math.random() * 7 + 3,
      color: COLORS[(Math.random() * COLORS.length) | 0],
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.35,
      life: 1,
    }));

    const start = performance.now();
    const tick = (t) => {
      const elapsed = t - start;
      ctx.clearRect(0, 0, W, H);
      let alive = false;
      for (const p of parts) {
        p.vy += 0.32; // gravity
        p.vx *= 0.99;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        p.life = Math.max(0, 1 - elapsed / 1500);
        if (p.life > 0 && p.y < H + 40) {
          alive = true;
          ctx.save();
          ctx.globalAlpha = p.life;
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
          ctx.restore();
        }
      }
      if (alive) rafRef.current = requestAnimationFrame(tick);
      else ctx.clearRect(0, 0, W, H);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [trigger, reduced]);

  return <canvas ref={canvasRef} className="confetti-canvas" aria-hidden="true" />;
}

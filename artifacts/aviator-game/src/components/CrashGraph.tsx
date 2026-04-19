import { useRef, useEffect } from 'react';
import { GamePhase, getMultiplierColor } from '../lib/gameEngine';

interface CrashGraphProps {
  multiplier: number;
  phase: GamePhase;
  crashPoint: number;
}

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

export function CrashGraph({ multiplier, phase, crashPoint }: CrashGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointsRef = useRef<{ x: number; y: number; mult: number }[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const crashTriggeredRef = useRef(false);
  const animFrameRef = useRef<number>(0);
  const prevPhaseRef = useRef<GamePhase>('waiting');

  useEffect(() => {
    if (phase === 'waiting') {
      pointsRef.current = [];
      particlesRef.current = [];
      crashTriggeredRef.current = false;
    }
  }, [phase]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const padL = 48, padB = 32, padR = 16, padT = 16;
    const drawW = W - padL - padR;
    const drawH = H - padB - padT;

    const maxMult = Math.max(multiplier * 1.15, 2.5);
    const maxTime = Math.max(multiplier <= 1 ? 1 : Math.log(multiplier) / 0.06, 5);

    function multToY(m: number) {
      return padT + drawH - ((m - 1) / (maxMult - 1)) * drawH;
    }
    function timeToX(t: number) {
      return padL + (t / maxTime) * drawW;
    }

    ctx.clearRect(0, 0, W, H);

    // Background grid
    ctx.save();
    const gridLines = 5;
    for (let i = 0; i <= gridLines; i++) {
      const m = 1 + (i / gridLines) * (maxMult - 1);
      const y = multToY(m);
      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(W - padR, y);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.font = '10px Inter, system-ui, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(m.toFixed(1) + 'x', padL - 5, y + 4);
    }
    ctx.restore();

    // Current position
    const elapsed = phase !== 'waiting' ? Math.log(Math.max(multiplier, 1.001)) / 0.06 : 0;
    const currentX = timeToX(elapsed);
    const currentY = multToY(multiplier);

    if (phase !== 'waiting') {
      const last = pointsRef.current[pointsRef.current.length - 1];
      if (!last || Math.abs(last.x - currentX) > 0.5 || Math.abs(last.y - currentY) > 0.5) {
        pointsRef.current.push({ x: currentX, y: currentY, mult: multiplier });
      }
    }

    // Trigger crash particles
    if (phase === 'crashed' && !crashTriggeredRef.current && pointsRef.current.length > 0) {
      crashTriggeredRef.current = true;
      const tip = pointsRef.current[pointsRef.current.length - 1];
      const colors = ['#ef4444', '#fca5a5', '#fbbf24', '#ff5f1f', '#ffffff'];
      for (let i = 0; i < 40; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 5;
        particlesRef.current.push({
          x: tip.x, y: tip.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          maxLife: 0.5 + Math.random() * 0.5,
          size: 1.5 + Math.random() * 4,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }
    }

    // Update + draw particles
    particlesRef.current = particlesRef.current.filter(p => p.life > 0);
    particlesRef.current.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.12; // gravity
      p.vx *= 0.97;
      p.life -= 0.03;
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 4;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    const pts = pointsRef.current;
    if (pts.length > 1) {
      const color = phase === 'crashed' ? '#ef4444' : getMultiplierColor(multiplier);

      // Gradient area under curve
      const grad = ctx.createLinearGradient(0, padT, 0, H - padB);
      grad.addColorStop(0, color + '35');
      grad.addColorStop(0.6, color + '12');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(padL, H - padB);
      ctx.lineTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) {
        const prev = pts[i - 1];
        const curr = pts[i];
        const cpx = (prev.x + curr.x) / 2;
        ctx.bezierCurveTo(cpx, prev.y, cpx, curr.y, curr.x, curr.y);
      }
      ctx.lineTo(pts[pts.length - 1].x, H - padB);
      ctx.closePath();
      ctx.fill();

      // Glow behind line
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = 6;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.globalAlpha = 0.15;
      ctx.shadowColor = color;
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) {
        const prev = pts[i - 1];
        const curr = pts[i];
        const cpx = (prev.x + curr.x) / 2;
        ctx.bezierCurveTo(cpx, prev.y, cpx, curr.y, curr.x, curr.y);
      }
      ctx.stroke();
      ctx.restore();

      // Main smooth curve
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) {
        const prev = pts[i - 1];
        const curr = pts[i];
        const cpx = (prev.x + curr.x) / 2;
        ctx.bezierCurveTo(cpx, prev.y, cpx, curr.y, curr.x, curr.y);
      }
      ctx.stroke();
      ctx.restore();

      // Animated tip dot
      if (phase === 'flying') {
        // Pulsing outer ring
        const pulseSize = 8 + Math.sin(Date.now() / 150) * 3;
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.arc(currentX, currentY, pulseSize, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 20;
        ctx.fill();
        ctx.restore();

        // Inner solid dot
        ctx.beginPath();
        ctx.arc(currentX, currentY, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = color;
        ctx.shadowBlur = 15;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Crash X marker
      if (phase === 'crashed') {
        const tip = pts[pts.length - 1];
        ctx.save();
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.moveTo(tip.x - 8, tip.y - 8); ctx.lineTo(tip.x + 8, tip.y + 8);
        ctx.moveTo(tip.x + 8, tip.y - 8); ctx.lineTo(tip.x - 8, tip.y + 8);
        ctx.stroke();
        ctx.restore();
      }
    }

    // Axes
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padL, H - padB); ctx.lineTo(W - padR, H - padB);
    ctx.moveTo(padL, padT); ctx.lineTo(padL, H - padB);
    ctx.stroke();
    ctx.restore();

    prevPhaseRef.current = phase;
  }, [multiplier, phase, crashPoint]);

  // Kick off particle animation
  useEffect(() => {
    if (phase !== 'crashed') return;
    let running = true;
    function loop() {
      if (!running || particlesRef.current.length === 0) return;
      const canvas = canvasRef.current;
      if (canvas) {
        // Force re-render to animate particles
        const event = new Event('particletick');
        canvas.dispatchEvent(event);
      }
      animFrameRef.current = requestAnimationFrame(loop);
    }
    animFrameRef.current = requestAnimationFrame(loop);
    return () => { running = false; cancelAnimationFrame(animFrameRef.current); };
  }, [phase]);

  return (
    <canvas
      ref={canvasRef}
      width={640}
      height={320}
      style={{ width: '100%', height: '100%' }}
    />
  );
}

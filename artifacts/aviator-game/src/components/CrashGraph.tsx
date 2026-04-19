import { useRef, useEffect } from 'react';
import { GamePhase, getMultiplierColor } from '../lib/gameEngine';

interface CrashGraphProps {
  multiplier: number;
  phase: GamePhase;
  crashPoint: number;
}

export function CrashGraph({ multiplier, phase, crashPoint }: CrashGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointsRef = useRef<{ x: number; y: number }[]>([]);
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    if (phase === 'waiting') {
      pointsRef.current = [];
    }
  }, [phase]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const padL = 48;
    const padB = 32;
    const padR = 20;
    const padT = 20;
    const drawW = W - padL - padR;
    const drawH = H - padB - padT;

    const maxMult = Math.max(multiplier * 1.2, 2.5);
    const maxTime = Math.max(multiplier <= 1 ? 1 : (multiplier - 1) / 0.07 + 1, 5);

    function multToY(m: number) {
      return padT + drawH - ((m - 1) / (maxMult - 1)) * drawH;
    }
    function timeToX(t: number) {
      return padL + (t / maxTime) * drawW;
    }

    ctx.clearRect(0, 0, W, H);

    // Background grid
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;

    // Horizontal grid lines
    const gridLines = 5;
    for (let i = 0; i <= gridLines; i++) {
      const m = 1 + (i / gridLines) * (maxMult - 1);
      const y = multToY(m);
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(W - padR, y);
      ctx.stroke();

      // Labels
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.font = '10px Inter, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(m.toFixed(1) + 'x', padL - 4, y + 4);
    }

    // Build current point
    const t = phase === 'waiting' ? 0 : Math.log(multiplier) / 0.07;
    const currentX = timeToX(t);
    const currentY = multToY(multiplier);

    if (phase !== 'waiting') {
      // Store points
      const lastP = pointsRef.current[pointsRef.current.length - 1];
      if (!lastP || Math.abs(lastP.x - currentX) > 1 || Math.abs(lastP.y - currentY) > 1) {
        pointsRef.current.push({ x: currentX, y: currentY });
      }
    }

    const color = phase === 'crashed' ? '#ef4444' : getMultiplierColor(multiplier);

    if (pointsRef.current.length > 1) {
      // Gradient fill under curve
      const grad = ctx.createLinearGradient(0, padT, 0, H - padB);
      grad.addColorStop(0, color + '40');
      grad.addColorStop(1, color + '05');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(padL, H - padB);
      pointsRef.current.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.lineTo(pointsRef.current[pointsRef.current.length - 1].x, H - padB);
      ctx.closePath();
      ctx.fill();

      // Main curve line
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(pointsRef.current[0].x, pointsRef.current[0].y);
      for (let i = 1; i < pointsRef.current.length; i++) {
        ctx.lineTo(pointsRef.current[i].x, pointsRef.current[i].y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Current point circle
      if (phase === 'flying') {
        ctx.beginPath();
        ctx.arc(currentX, currentY, 6, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 15;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    // X axis
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padL, H - padB);
    ctx.lineTo(W - padR, H - padB);
    ctx.stroke();

    // Y axis
    ctx.beginPath();
    ctx.moveTo(padL, padT);
    ctx.lineTo(padL, H - padB);
    ctx.stroke();

  }, [multiplier, phase, crashPoint]);

  return (
    <canvas
      ref={canvasRef}
      width={640}
      height={320}
      className="graph-canvas"
      style={{ width: '100%', height: '100%' }}
    />
  );
}

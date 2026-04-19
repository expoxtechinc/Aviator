import { useRef, useCallback, useEffect } from 'react';

type SoundName =
  | 'bet'
  | 'cashout'
  | 'crash'
  | 'tick'
  | 'countdown'
  | 'win_small'
  | 'win_big'
  | 'fly_start';

export function useSound(enabled: boolean) {
  const ctxRef = useRef<AudioContext | null>(null);

  const getCtx = useCallback((): AudioContext | null => {
    if (!enabled) return null;
    if (!ctxRef.current || ctxRef.current.state === 'closed') {
      ctxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume();
    }
    return ctxRef.current;
  }, [enabled]);

  // Cleanup on unmount
  useEffect(() => () => { ctxRef.current?.close(); }, []);

  const play = useCallback((name: SoundName) => {
    const ctx = getCtx();
    if (!ctx) return;
    const now = ctx.currentTime;

    switch (name) {
      case 'bet': {
        // Short click
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.06);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.start(now); osc.stop(now + 0.12);
        break;
      }

      case 'cashout': {
        // Satisfying ascending ding + shimmer
        [0, 0.05, 0.1].forEach((delay, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain); gain.connect(ctx.destination);
          osc.type = 'sine';
          const freqs = [660, 880, 1100];
          osc.frequency.setValueAtTime(freqs[i], now + delay);
          gain.gain.setValueAtTime(0.22, now + delay);
          gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.35);
          osc.start(now + delay); osc.stop(now + delay + 0.35);
        });
        break;
      }

      case 'crash': {
        // Deep thud + descending whoosh
        const bufferSize = ctx.sampleRate * 0.6;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
        }
        const src = ctx.createBufferSource();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(400, now);
        filter.frequency.exponentialRampToValueAtTime(80, now + 0.6);
        src.buffer = buffer;
        src.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
        src.start(now); src.stop(now + 0.6);

        // Low rumble
        const osc = ctx.createOscillator();
        const g2 = ctx.createGain();
        osc.connect(g2); g2.connect(ctx.destination);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.5);
        g2.gain.setValueAtTime(0.2, now);
        g2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc.start(now); osc.stop(now + 0.5);
        break;
      }

      case 'tick': {
        // Soft metronome tick
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.start(now); osc.stop(now + 0.05);
        break;
      }

      case 'countdown': {
        // Ticking countdown beep
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = 'square';
        osc.frequency.setValueAtTime(600, now);
        gain.gain.setValueAtTime(0.07, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.start(now); osc.stop(now + 0.08);
        break;
      }

      case 'fly_start': {
        // Rising engine rev
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(400, now);
        osc.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(80, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.8);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.12, now + 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
        osc.start(now); osc.stop(now + 0.9);
        break;
      }

      case 'win_small': {
        // Quick happy pair
        [0, 0.08].forEach((d, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain); gain.connect(ctx.destination);
          osc.type = 'sine';
          osc.frequency.setValueAtTime(i === 0 ? 523 : 659, now + d);
          gain.gain.setValueAtTime(0.12, now + d);
          gain.gain.exponentialRampToValueAtTime(0.001, now + d + 0.25);
          osc.start(now + d); osc.stop(now + d + 0.25);
        });
        break;
      }

      case 'win_big': {
        // Fanfare-like ascending chord
        [523, 659, 784, 1047].forEach((freq, i) => {
          const delay = i * 0.07;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain); gain.connect(ctx.destination);
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + delay);
          gain.gain.setValueAtTime(0.18, now + delay);
          gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.6);
          osc.start(now + delay); osc.stop(now + delay + 0.6);
        });
        break;
      }
    }
  }, [getCtx]);

  // Engine hum that rises with multiplier
  const engineRef = useRef<{ osc: OscillatorNode; gain: GainNode } | null>(null);

  const startEngine = useCallback(() => {
    const ctx = getCtx();
    if (!ctx || !enabled) return;
    stopEngine();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 800;
    osc.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sawtooth';
    osc.frequency.value = 60;
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 0.3);
    osc.start();
    engineRef.current = { osc, gain };
  }, [getCtx, enabled]);

  const stopEngine = useCallback(() => {
    if (engineRef.current) {
      try {
        engineRef.current.gain.gain.exponentialRampToValueAtTime(0.001, (ctxRef.current?.currentTime ?? 0) + 0.2);
        engineRef.current.osc.stop((ctxRef.current?.currentTime ?? 0) + 0.2);
      } catch {}
      engineRef.current = null;
    }
  }, []);

  const updateEngine = useCallback((multiplier: number) => {
    if (!engineRef.current || !ctxRef.current) return;
    const freq = 60 + (multiplier - 1) * 18;
    engineRef.current.osc.frequency.setTargetAtTime(Math.min(freq, 280), ctxRef.current.currentTime, 0.1);
  }, []);

  return { play, startEngine, stopEngine, updateEngine };
}

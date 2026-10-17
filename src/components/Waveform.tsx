import { useEffect, useRef } from 'react';
import { amplitudeBound, COLORS, signalAt, waveAt, type Wave } from '../signal';

interface Props {
  waves: Wave[];
  duration: number;
  showComponents: boolean;
}

export default function Waveform({ waves, duration, showComponents }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const draw = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (!width || !height) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      const ctx = canvas.getContext('2d')!;
      ctx.scale(dpr, dpr);
      const plot = { x: 48, y: 26, width: width - 68, height: height - 68 };
      const bound = Math.max(1, Math.ceil(amplitudeBound(waves) * 2) / 2);
      const y = (amplitude: number) =>
        plot.y + plot.height / 2 - ((amplitude / bound) * plot.height) / 2;
      const x = (fraction: number) => plot.x + fraction * plot.width;
      ctx.font = '11px ui-monospace, SFMono-Regular, Consolas, monospace';

      for (let index = 0; index <= 8; index++) {
        ctx.strokeStyle = '#e9eae5';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x(index / 8), plot.y);
        ctx.lineTo(x(index / 8), plot.y + plot.height);
        ctx.stroke();
        if (index % 2 === 0) {
          ctx.fillStyle = '#858a82';
          ctx.textAlign = 'center';
          ctx.fillText(
            `${Number(((index / 8) * duration * 1000).toFixed(2))}`,
            x(index / 8),
            height - 23,
          );
        }
      }
      for (let index = -2; index <= 2; index++) {
        const amplitude = (index * bound) / 2;
        ctx.strokeStyle = index === 0 ? '#c9cdc4' : '#e9eae5';
        ctx.beginPath();
        ctx.moveTo(plot.x, y(amplitude));
        ctx.lineTo(plot.x + plot.width, y(amplitude));
        ctx.stroke();
        ctx.fillStyle = '#858a82';
        ctx.textAlign = 'right';
        ctx.fillText(
          `${Number(amplitude.toFixed(2))}`,
          plot.x - 10,
          y(amplitude) + 4,
        );
      }
      ctx.fillStyle = '#858a82';
      ctx.textAlign = 'right';
      ctx.fillText('time / ms', width - 20, height - 4);
      ctx.textAlign = 'left';
      ctx.fillText('amplitude', plot.x, 12);
      ctx.save();
      ctx.beginPath();
      ctx.rect(plot.x, plot.y - 2, plot.width, plot.height + 4);
      ctx.clip();

      // Sample each display column densely enough to retain extrema at wide time windows.
      const maxFrequency = Math.max(
        20,
        ...waves.filter((w) => !w.muted).map((w) => w.frequency),
      );
      const samplesPerColumn = Math.max(
        1,
        Math.ceil((maxFrequency * duration * 8) / plot.width),
      );
      const trace = (
        sample: (time: number) => number,
        color: string,
        lineWidth: number,
      ) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.lineJoin = 'round';
        ctx.beginPath();
        for (let column = 0; column <= plot.width; column++) {
          if (samplesPerColumn <= 2) {
            const value = sample((column / plot.width) * duration);
            if (column === 0) ctx.moveTo(plot.x + column, y(value));
            else ctx.lineTo(plot.x + column, y(value));
          } else {
            let low = Infinity;
            let high = -Infinity;
            for (let sub = 0; sub < samplesPerColumn; sub++) {
              const value = sample(
                ((column + sub / samplesPerColumn) / plot.width) * duration,
              );
              low = Math.min(low, value);
              high = Math.max(high, value);
            }
            ctx.moveTo(plot.x + column, y(low));
            ctx.lineTo(plot.x + column, y(high));
          }
        }
        ctx.stroke();
      };
      if (showComponents) {
        for (const wave of waves)
          if (!wave.muted)
            trace((t) => waveAt(wave, t), `${COLORS[wave.id]}70`, 1.35);
      }
      trace((t) => signalAt(waves, t), '#263d33', 1.8);
      ctx.restore();
    };
    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [waves, duration, showComponents]);

  return (
    <canvas
      ref={canvasRef}
      className="waveform"
      role="img"
      aria-label={`Combined waveform over ${duration * 1000} milliseconds. ${waves.filter((w) => !w.muted).length} active sine waves. Amplitude scale adjusts to the sum of wave amplitudes.`}
    >
      The combined signal is the sum of the active sine waves. Adjust the
      controls to explore their interference.
    </canvas>
  );
}

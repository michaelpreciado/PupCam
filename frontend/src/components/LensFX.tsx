import { useEffect, useRef } from 'react';

const LensFX: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const draw = () => {
      if (!ctx) return;
      const { width, height } = canvas;
      const innerRadius = Math.min(width, height) * 0.3;
      const outerRadius = Math.min(width, height) * 0.5;
      const gradient = ctx.createRadialGradient(
        width / 2,
        height / 2,
        innerRadius,
        width / 2,
        height / 2,
        outerRadius
      );
      gradient.addColorStop(0, 'rgba(0,0,0,0)');
      gradient.addColorStop(1, 'rgba(0,0,0,0.1)');

      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    };

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      draw();
    };

    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />;
};

export default LensFX; 
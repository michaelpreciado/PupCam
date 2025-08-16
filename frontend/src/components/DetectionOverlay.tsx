import React, { useEffect, useRef } from 'react';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs';

export interface Detection {
  bbox: [number, number, number, number];
  class: string;
  score: number;
}

interface Props {
  videoRef: React.RefObject<HTMLVideoElement>;
  onDetection?: (det: Detection | null) => void;
}

const DetectionOverlay: React.FC<Props> = ({ videoRef, onDetection }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let mounted = true;
    let model: cocoSsd.ObjectDetection | null = null;

    async function loadModel() {
      try {
        model = await cocoSsd.load();
        detectFrame();
      } catch (err) {
        console.error('Failed to load detection model', err);
      }
    }

    async function detectFrame() {
      if (!mounted || !model || !videoRef.current || !canvasRef.current) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      try {
        const predictions = await model.detect(video);
        const faces = predictions.filter(p =>
          ['person', 'dog', 'cat'].includes(p.class) && p.score > 0.25
        );

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        let best: Detection | null = null;
        if (faces.length > 0) {
          faces.sort((a, b) => b.score - a.score);
          const det = faces[0];
          const [x, y, w, h] = det.bbox;
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 4;
          ctx.strokeRect(x, y, w, h);
          best = { bbox: [x, y, w, h], class: det.class, score: det.score };
        }
        onDetection && onDetection(best);
      } catch (err) {
        console.error('Detection error', err);
      }

      requestAnimationFrame(detectFrame);
    }

    loadModel();
    return () => {
      mounted = false;
    };
  }, [videoRef, onDetection]);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />;
};

export default DetectionOverlay;

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
  const smoothBox = useRef<[number, number, number, number] | null>(null);

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

    function faceBox(det: cocoSsd.DetectedObject): [number, number, number, number] {
      let [x, y, w, h] = det.bbox as [number, number, number, number];
      if (det.class === 'person') {
        w = w * 0.7;
        h = h * 0.4;
        x = x + (det.bbox[2] - w) / 2;
        y = y + det.bbox[3] * 0.1;
      } else {
        w = w * 0.6;
        h = h * 0.5;
        x = x + (det.bbox[2] - w) / 2;
        y = y + det.bbox[3] * 0.15;
      }
      return [x, y, w, h];
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
          const target = faceBox(det);

          // Smooth transition toward the new box
          const alpha = 0.2;
          if (!smoothBox.current) smoothBox.current = target;
          const [sx, sy, sw, sh] = smoothBox.current;
          const [tx, ty, tw, th] = target;
          const newBox: [number, number, number, number] = [
            sx + (tx - sx) * alpha,
            sy + (ty - sy) * alpha,
            sw + (tw - sw) * alpha,
            sh + (th - sh) * alpha,
          ];
          smoothBox.current = newBox;

          const [x, y, w, h] = newBox;
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 4;
          ctx.strokeRect(x, y, w, h);
          ctx.fillStyle = '#10b981';
          ctx.font = '18px sans-serif';
          ctx.fillText(`${Math.round(det.score * 100)}%`, x, y - 8);
          best = { bbox: newBox, class: det.class, score: det.score };
        } else {
          smoothBox.current = null;
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

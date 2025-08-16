import React, { useRef, useState } from 'react';
import CameraFeed from './components/CameraFeed';
import DetectionOverlay, { Detection } from './components/DetectionOverlay';
import MoodCard from './components/MoodCard';
import ScanButton from './components/ScanButton';
import SaveButton from './components/SaveButton';

interface MoodState {
  emoji: string;
  label: string;
  confidence: number;
}

const moodEmojis: Record<string, string> = {
  happy: '😊',
  relaxed: '😌',
  anxious: '😟',
  fearful: '😨',
  angry: '😡',
  confused: '😕',
};

const App: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [detection, setDetection] = useState<Detection | null>(null);
  const [mood, setMood] = useState<MoodState | null>(null);

  const handleScan = async () => {
    if (!videoRef.current || !detection) return;
    const [x, y, w, h] = detection.bbox;

    let faceX = x, faceY = y, faceW = w, faceH = h;
    if (detection.class === 'person') {
      faceW = w * 0.7;
      faceH = h * 0.4;
      faceX = x + (w - faceW) / 2;
      faceY = y + h * 0.1;
    } else {
      faceW = w * 0.6;
      faceH = h * 0.5;
      faceX = x + (w - faceW) / 2;
      faceY = y + h * 0.15;
    }

    const canvas = document.createElement('canvas');
    canvas.width = faceW;
    canvas.height = faceH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(
      videoRef.current,
      faceX,
      faceY,
      faceW,
      faceH,
      0,
      0,
      faceW,
      faceH
    );

    const imageData = canvas.toDataURL('image/jpeg', 0.8);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageData }),
      });
      const result = await res.json();
      setMood({
        emoji: moodEmojis[result.mood] || '🤔',
        label: result.mood.charAt(0).toUpperCase() + result.mood.slice(1),
        confidence: result.confidence,
      });
    } catch (err) {
      console.error('Mood analysis failed', err);
    }
  };

  const handleSave = () => {
    if (!videoRef.current || !detection || !mood) return;
    const [x, y, w, h] = detection.bbox;

    let faceX = x, faceY = y, faceW = w, faceH = h;
    if (detection.class === 'person') {
      faceW = w * 0.7;
      faceH = h * 0.4;
      faceX = x + (w - faceW) / 2;
      faceY = y + h * 0.1;
    } else {
      faceW = w * 0.6;
      faceH = h * 0.5;
      faceX = x + (w - faceW) / 2;
      faceY = y + h * 0.15;
    }

    const canvas = document.createElement('canvas');
    canvas.width = faceW;
    canvas.height = faceH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(
      videoRef.current,
      faceX,
      faceY,
      faceW,
      faceH,
      0,
      0,
      faceW,
      faceH
    );
    ctx.fillStyle = 'white';
    ctx.font = '20px sans-serif';
    ctx.fillText(`${mood.label} (${mood.confidence}%)`, 10, 24);

    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `pupcam-${mood.label}.png`;
    link.click();
  };

  return (
    <main className="relative w-full h-dvh overflow-hidden select-none touch-none">
      <CameraFeed videoRef={videoRef} />
      <DetectionOverlay videoRef={videoRef} onDetection={setDetection} />
      <ScanButton onClick={handleScan} />
      {mood && <SaveButton onClick={handleSave} />}
      <MoodCard mood={mood} />
    </main>
  );
};

export default App;

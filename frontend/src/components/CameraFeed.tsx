import React, { useEffect, useRef } from 'react';
import LensFX from './LensFX';

const CameraFeed: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    let stream: MediaStream;

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (err) {
        console.error('Failed to get camera', err);
      }
    }

    start();
    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  return (
    <div className="absolute inset-0">
      <video
        ref={videoRef}
        playsInline
        muted
        className="w-full h-full object-cover"
      />
      <LensFX />
    </div>
  );
};

export default CameraFeed; 
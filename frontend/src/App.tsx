import React from 'react';
import CameraFeed from './components/CameraFeed';
import DetectionOverlay from './components/DetectionOverlay';
import MoodCard from './components/MoodCard';
import ScanButton from './components/ScanButton';

const App: React.FC = () => {
  return (
    <main className="relative w-full h-dvh overflow-hidden select-none touch-none">
      <CameraFeed />
      <DetectionOverlay />
      <ScanButton />
      <MoodCard />
    </main>
  );
};

export default App; 
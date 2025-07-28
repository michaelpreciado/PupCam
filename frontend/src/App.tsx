import React from 'react';
import CameraFeed from './components/CameraFeed';
import DetectionOverlay from './components/DetectionOverlay';
import MoodCard from './components/MoodCard';

const App: React.FC = () => {
  return (
    <main className="relative w-full h-dvh overflow-hidden select-none touch-none">
      <CameraFeed />
      <DetectionOverlay />
      <MoodCard />
    </main>
  );
};

export default App; 
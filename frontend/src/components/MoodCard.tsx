import React from 'react';
import LiquidGlass from './LiquidGlass';

const MoodCard: React.FC = () => {
  // Placeholder mood data; will be replaced by detection.
  const mood = { emoji: '😌', label: 'Relaxed', confidence: 88 };

  return (
    <div className="absolute inset-x-4 bottom-36 flex justify-center pointer-events-auto">
      <LiquidGlass className="px-6 py-4 flex items-center space-x-3">
        <span className="text-5xl select-none">{mood.emoji}</span>
        <div className="flex flex-col">
          <span className="font-semibold text-xl leading-none">{mood.label}</span>
          <span className="text-sm opacity-75">{mood.confidence}%</span>
        </div>
      </LiquidGlass>
    </div>
  );
};

export default MoodCard; 
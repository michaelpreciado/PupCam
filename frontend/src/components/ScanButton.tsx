import React from 'react';
import clsx from 'clsx';
import LiquidGlass from './LiquidGlass';

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
}

const ScanButton: React.FC<Props> = ({ className, children, ...rest }) => {
  return (
    <button
      {...rest}
      className={clsx(
        'absolute inset-x-0 bottom-8 flex justify-center pointer-events-auto',
        className
      )}
    >
      <LiquidGlass
        className={
          'w-24 h-24 rounded-full flex items-center justify-center ' +
          'ring-1 ring-white/20 shadow-2xl backdrop-blur-[24px] backdrop-saturate-[180%] ' +
          'transition-transform duration-300 ease-out active:scale-95'
        }
      >
        {children ?? (
          <span className="text-xl font-semibold text-white">Scan</span>
        )}
      </LiquidGlass>
    </button>
  );
};

export default ScanButton;

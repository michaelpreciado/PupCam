import React from 'react';
import clsx from 'clsx';
import LiquidGlass from './LiquidGlass';

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
}

const SaveButton: React.FC<Props> = ({ className, children, ...rest }) => {
  return (
    <button
      {...rest}
      className={clsx(
        'absolute inset-x-0 bottom-36 flex justify-center pointer-events-auto',
        className
      )}
    >
      <LiquidGlass
        className={
          'px-6 py-2 rounded-full flex items-center justify-center ' +
          'ring-1 ring-white/20 shadow-2xl backdrop-blur-[24px] backdrop-saturate-[180%] ' +
          'transition-transform duration-300 ease-out active:scale-95'
        }
      >
        {children ?? (
          <span className="text-sm font-semibold text-white">Save Image</span>
        )}
      </LiquidGlass>
    </button>
  );
};

export default SaveButton;

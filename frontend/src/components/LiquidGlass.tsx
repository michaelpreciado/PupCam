import React, { HTMLAttributes } from 'react';
import clsx from 'clsx';

interface Props extends HTMLAttributes<HTMLDivElement> {
  className?: string;
}

const LiquidGlass: React.FC<Props> = ({ className, ...rest }) => {
  return (
    <div
      {...rest}
      className={clsx(
        'backdrop-blur-[24px] backdrop-saturate-[150%] bg-glassLow/60 text-white shadow-lg rounded-xl',
        'relative overflow-hidden',
        className
      )}
    />
  );
};

export default LiquidGlass; 
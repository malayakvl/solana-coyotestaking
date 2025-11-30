import React, { FC, MouseEvent } from 'react';

interface StakeButtonProps {
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
}

export const StakeButton: FC<StakeButtonProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
    >
      Stake SOL
    </button>
  );
};

// Якщо потрібно глобально (для window), можна додати:
declare global {
  interface Window {
    StakeButton: typeof StakeButton;
  }
}

if (typeof window !== 'undefined') {
  window.StakeButton = StakeButton;
}
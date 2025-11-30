// components/StakeButton.tsx
'use client';

import React from 'react';

interface Props {
  onClick: () => void;
}

export const StakeButton: React.FC<Props> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 bg-purple-600 text-white rounded"
    >
      Stake SOL
    </button>
  );
};
export default StakeButton;

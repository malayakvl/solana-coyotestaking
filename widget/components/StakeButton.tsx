import React from 'react';

export const StakeButton = ({ onClick }: { onClick: () => void }) => (
  <button onClick={onClick} className="px-4 py-2 bg-purple-600 text-white rounded">
    Stake SOL
  </button>
);

window.StakeButton = StakeButton;

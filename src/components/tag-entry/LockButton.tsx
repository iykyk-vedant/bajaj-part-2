'use client';

import { useLockStore } from '@/store/lockStore';
import { Lock, Unlock } from 'lucide-react';

interface LockButtonProps {
  className?: string;
  dcNo?: string;
  partCode?: string;
}

export function LockButton({ className = '', dcNo = '', partCode = '' }: LockButtonProps) {
  const { isDcLocked, toggleDcLock, lockDc, unlockDc } = useLockStore();

  const handleClick = () => {
    if (isDcLocked) {
      unlockDc();
    } else {
      if (dcNo && partCode) {
        lockDc(dcNo, partCode);
      } else {
        toggleDcLock();
      }
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`flex items-center justify-center p-2 rounded-md transition-colors ${
        isDcLocked 
          ? 'bg-red-100 text-red-700 hover:bg-red-200' 
          : 'bg-green-100 text-green-700 hover:bg-green-200'
      } ${className}`}
      title={isDcLocked ? 'Unlock DC Number and Part Code' : 'Lock DC Number and Part Code'}
    >
      {isDcLocked ? (
        <>
          <Lock className="h-4 w-4 mr-1" />
          <span>Locked</span>
        </>
      ) : (
        <>
          <Unlock className="h-4 w-4 mr-1" />
          <span>Unlocked</span>
        </>
      )}
    </button>
  );
}
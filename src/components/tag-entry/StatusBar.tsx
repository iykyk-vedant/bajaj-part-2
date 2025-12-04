'use client';

interface StatusBarProps {
  currentTime: Date;
  isCapsLockOn: boolean;
  isOnline: boolean;
}

export function StatusBar({ currentTime, isCapsLockOn, isOnline }: StatusBarProps) {
  return (
    <div className="bg-gray-800 text-white p-2 rounded-lg flex justify-between items-center text-sm">
      <div>
        Tag Entry: <strong>5</strong> | Consumption Entry: <strong>3</strong>
      </div>
      <div>
        {currentTime.toLocaleDateString('en-US', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        }).replace(',', '')}
      </div>
      <div>
        <span className={isCapsLockOn ? 'text-yellow-400' : 'text-gray-400'}>
          CAPS {isCapsLockOn ? 'ON' : 'OFF'}
        </span> | 
        <span className={isOnline ? 'text-green-400' : 'text-red-400'}> ONLINE</span>
      </div>
    </div>
  );
}
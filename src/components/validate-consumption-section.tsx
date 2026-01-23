'use client';

import { useState, useEffect } from 'react';
import { ConsumptionTab } from './tag-entry/ConsumptionTab';
import { StatusBar } from './tag-entry/StatusBar';

interface ValidateConsumptionSectionProps {
  dcNumbers?: string[];
  dcPartCodes?: Record<string, string[]>;
  engineerName?: string;
  onEngineerNameChange?: (name: string) => void;
}

export function ValidateConsumptionSection({ dcNumbers, dcPartCodes, engineerName, onEngineerNameChange }: ValidateConsumptionSectionProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isCapsLockOn, setIsCapsLockOn] = useState(false);

  useEffect(() => {
    // Update current time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Check caps lock status
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.getModifierState) {
        setIsCapsLockOn(e.getModifierState('CapsLock'));
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.getModifierState) {
        setIsCapsLockOn(e.getModifierState('CapsLock'));
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      clearInterval(timer);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return (
    <div className="flex-1 flex flex-col bg-white rounded-lg shadow-md p-3">
      {/* Consumption Tab */}
      <div className="flex-1 mb-4">
        <ConsumptionTab 
          dcNumbers={dcNumbers} 
          dcPartCodes={dcPartCodes} 
          engineerName={engineerName}
          onEngineerNameChange={onEngineerNameChange}
        />
      </div>

      {/* Status Bar */}
      <StatusBar 
        currentTime={currentTime} 
        isCapsLockOn={isCapsLockOn} 
        isOnline={true} 
      />
    </div>
  );
}
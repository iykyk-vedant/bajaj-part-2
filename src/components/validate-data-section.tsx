'use client';

import { useState, useEffect } from 'react';
import { TagEntryForm } from './tag-entry/TagEntryForm';
import { ConsumptionTab } from './tag-entry/ConsumptionTab';

import { StatusBar } from './tag-entry/StatusBar';

interface ValidateDataSectionProps {
  initialData: any | null;
  isLoading: boolean;
  onSave: (data: any) => void;
  sheetActive: boolean;
  onFormChange: (context: { sparePartCode?: string; productDescription?: string }) => void;
  dcNumbers?: string[];
  dcPartCodes?: Record<string, string[]>;
}

export function ValidateDataSection({ initialData, isLoading, onSave, sheetActive, onFormChange, dcNumbers, dcPartCodes }: ValidateDataSectionProps) {

  const [currentTime, setCurrentTime] = useState(new Date());
  const [isCapsLockOn, setIsCapsLockOn] = useState(false);
  
  // Initialize DC numbers and mappings with DB data only (no localStorage fallback)
  const [localDcNumbers, setLocalDcNumbers] = useState<string[]>(dcNumbers || []);
  
  // Initialize DC-PartCode mappings with DB data only (no localStorage fallback)
  const [localDcPartCodes, setLocalDcPartCodes] = useState<Record<string, string[]>>(
    dcPartCodes || {}
  );

  // Update DC numbers and mappings when props change (from DB)
  useEffect(() => {
    setLocalDcNumbers(dcNumbers || []);
    setLocalDcPartCodes(dcPartCodes || {});
  }, [dcNumbers, dcPartCodes]);

  // Function to add a new DC number
  const addDcNumber = async (dcNo: string, partCode: string) => {
    if (dcNo && !localDcNumbers.includes(dcNo)) {
      // Update local state
      setLocalDcNumbers(prev => [...prev, dcNo]);
      
      // Also add to part codes mapping if partCode is provided
      if (partCode) {
        setLocalDcPartCodes(prev => ({
          ...prev,
          [dcNo]: [...(prev[dcNo] || []), partCode]
        }));
      } else {
        // Initialize with empty array if no part code provided
        setLocalDcPartCodes(prev => ({
          ...prev,
          [dcNo]: prev[dcNo] || []
        }));
      }
      
      // Trigger a refresh of DC numbers and part codes from DB
      window.dispatchEvent(new CustomEvent('refreshDcNumbers', { 
        detail: { dcNumbers: [...localDcNumbers, dcNo], dcPartCodes: {
          ...localDcPartCodes,
          [dcNo]: partCode ? [partCode] : []
        }} 
      }));
    }
  };

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

  // If we're in the original loading or empty state, show the original UI
  if (!initialData && !isLoading) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center min-h-[500px] lg:min-h-full border-2 border-dashed border-gray-300 rounded-lg p-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-700 mb-2">Validate Data</h2>
          <p className="text-gray-500 mb-4">
            Upload or capture a form image to begin.<br />
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center min-h-[500px] lg:min-h-full p-8">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-600">Extracting data from image...</p>
        <div className="mt-4 w-3/4 bg-gray-200 rounded-full h-2.5">
          <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '75%' }}></div>
        </div>
        <p className="mt-2 text-sm text-gray-500">Processing image...</p>
      </div>
    )
  }

  // Show the complete Tag Entry system
  return (
    <div className="flex-1 flex flex-col bg-white rounded-lg shadow-md p-3">


      {/* Tag Entry Form */}
      <div className="flex-1 mb-4">
        <TagEntryForm initialData={initialData} dcNumbers={localDcNumbers} dcPartCodes={localDcPartCodes} onAddDcNumber={addDcNumber} />
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
'use client';

import { useState, useEffect } from 'react';
import { TagEntryForm } from './tag-entry/TagEntryForm';
import { ConsumptionTab } from './tag-entry/ConsumptionTab';
import { SettingsTab } from './tag-entry/SettingsTab';
import { FindTab } from './tag-entry/FindTab';
import { StatusBar } from './tag-entry/StatusBar';

interface ValidateDataSectionProps {
  initialData: any | null;
  isLoading: boolean;
  onSave: (data: any) => void;
  sheetActive: boolean;
  onFormChange: (context: { sparePartCode?: string; productDescription?: string }) => void;
}

export function ValidateDataSection({ initialData, isLoading, onSave, sheetActive, onFormChange }: ValidateDataSectionProps) {
  const [activeTab, setActiveTab] = useState<'tag-entry' | 'consumption' | 'settings' | 'find'>('tag-entry');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isCapsLockOn, setIsCapsLockOn] = useState(false);
  
  // Initialize DC numbers from localStorage or use default values
  const [dcNumbers, setDcNumbers] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('dc-numbers');
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (e) {
          return ['DC001', 'DC002'];
        }
      }
    }
    return ['DC001', 'DC002'];
  });

  // Save DC numbers to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('dc-numbers', JSON.stringify(dcNumbers));
    }
  }, [dcNumbers]);

  // Function to add a new DC number
  const addDcNumber = (dcNo: string) => {
    if (dcNo && !dcNumbers.includes(dcNo)) {
      setDcNumbers(prev => [...prev, dcNo]);
    }
  };

  useEffect(() => {
    // Update current time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Check caps lock status
    const handleKeyDown = (e: KeyboardEvent) => {
      setIsCapsLockOn(e.getModifierState('CapsLock'));
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      setIsCapsLockOn(e.getModifierState('CapsLock'));
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
            The extracted fields will appear here for validation.
          </p>
          <p className="text-sm text-gray-400">
            Or switch to the complete Tag Entry system below
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
    <div className="flex-1 bg-white rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="bg-gray-800 text-white p-4 rounded-lg mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Bajaj Electronics - Tag Entry</h1>
        <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded">
          Logout
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          className={`py-2 px-4 font-medium text-sm ${
            activeTab === 'tag-entry'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('tag-entry')}
        >
          Tag Entry
        </button>
        <button
          className={`py-2 px-4 font-medium text-sm ${
            activeTab === 'consumption'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('consumption')}
        >
          Consumption
        </button>
        <button
          className={`py-2 px-4 font-medium text-sm ${
            activeTab === 'settings'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('settings')}
        >
          Settings
        </button>
        <button
          className={`py-2 px-4 font-medium text-sm ${
            activeTab === 'find'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('find')}
        >
          Find
        </button>
      </div>

      {/* Tab Content */}
      <div className="mb-6">
        {activeTab === 'tag-entry' && <TagEntryForm initialData={initialData} dcNumbers={dcNumbers} />}
        {activeTab === 'consumption' && <ConsumptionTab />}
        {activeTab === 'settings' && <SettingsTab dcNumbers={dcNumbers} onAddDcNumber={addDcNumber} />}
        {activeTab === 'find' && <FindTab dcNumbers={dcNumbers} />}
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
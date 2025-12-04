'use client';

import { useState, useEffect } from 'react';
import { TagEntryForm } from '../../components/tag-entry/TagEntryForm';
import { ConsumptionTab } from '../../components/tag-entry/ConsumptionTab';
import { SettingsTab } from '../../components/tag-entry/SettingsTab';
import { FindPCBSection } from '../../components/tag-entry/FindPCBSection';
import { StatusBar } from '../../components/tag-entry/StatusBar';

export default function TagEntryPage() {
  const [activeTab, setActiveTab] = useState<'tag-entry' | 'consumption' | 'settings'>('tag-entry');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isCapsLockOn, setIsCapsLockOn] = useState(false);

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

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-md p-6">
        {/* Header */}
        <div className="bg-gray-800 text-white p-4 rounded-lg mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Bajaj Electronics - Tag Entry</h1>
          <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded">
            Logout
          </button>
        </div>

        {/* Find PCB Section */}
        <FindPCBSection />

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
        </div>

        {/* Tab Content */}
        <div className="mb-6">
          {activeTab === 'tag-entry' && <TagEntryForm />}
          {activeTab === 'consumption' && <ConsumptionTab />}
          {activeTab === 'settings' && <SettingsTab />}
        </div>

        {/* Status Bar */}
        <StatusBar 
          currentTime={currentTime} 
          isCapsLockOn={isCapsLockOn} 
          isOnline={true} 
        />
      </div>
    </div>
  );
}
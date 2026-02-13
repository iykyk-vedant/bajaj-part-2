'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLockStore } from '@/store/lockStore';
import { LockButton } from './LockButton';

interface SettingsTabProps {
  dcNumbers: string[];
  onAddDcNumber: (dcNo: string, partCode: string) => void;
}

export function SettingsTab({ dcNumbers, onAddDcNumber }: SettingsTabProps) {
  const { isDcLocked } = useLockStore();
  const [dcNo, setDcNo] = useState('');
  const [partCode, setPartCode] = useState('');
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [userStatus, setUserStatus] = useState('Active');
  const [engineerName, setEngineerName] = useState('');

  const handleCreateDC = async () => {
    if (dcNo.trim()) {
      try {
        await onAddDcNumber(dcNo.trim(), partCode.trim());
        setDcNo('');
        setPartCode('');
        // Show success message
        alert(`DC Number "${dcNo.trim()}" with Part Code "${partCode.trim()}" has been created successfully!`);
      } catch (error) {
        alert('Error creating DC Number. Please try again.');
      }
    } else {
      alert('Please enter a DC Number');
    }
  };

  const handleAddUser = () => {
    // Implementation for adding user

  };

  const handleAddEngineer = () => {
    // Implementation for adding engineer

  };

  const handleCreateTable = () => {
    // Implementation for creating table

  };

  const handleExport = () => {
    // Implementation for exporting data

  };

  const handleResetPcbCounter = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('pcb-serial-counter', '1');
      alert('PCB serial counter reset to 0001. Next generated PCB number will start from 1.');
    }
  };

  const handleClearLocalStorage = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('dc-numbers');
      localStorage.removeItem('dc-partcode-mappings');
      localStorage.removeItem('pcb-serial-counter');
      alert('Local storage cleared. Please refresh the page to see the changes.');
    }
  };

  // Keyboard shortcut handler for Settings form
  const handleKeyboardShortcut = useCallback((e: KeyboardEvent) => {
    // Only handle Alt key combinations
    if (!e.altKey) return;

    // Prevent browser default behavior for these shortcuts
    switch (e.key.toLowerCase()) {
      case 's':
        e.preventDefault();
        handleCreateTable();
        break;
      case 'e':
        e.preventDefault();
        handleExport();
        break;
      default:
        break;
    }
  }, []);

  // Add keyboard event listener
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', handleKeyboardShortcut as EventListener);
      return () => {
        window.removeEventListener('keydown', handleKeyboardShortcut as EventListener);
      };
    }
  }, [handleKeyboardShortcut]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Create New DC */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <h3 className="text-[12px] font-bold text-blue-600 uppercase tracking-widest mb-4 border-b pb-1">Create New DC</h3>
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider">DC No.</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={isDcLocked ? useLockStore.getState().lockedDcNo : dcNo}
                  onChange={(e) => setDcNo(e.target.value)}
                  disabled={isDcLocked}
                  className={`flex-1 px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 h-9 transition-all ${isDcLocked ? 'bg-gray-50 text-gray-500 border-gray-200' : 'bg-white'}`}
                  placeholder="Enter DC No."
                />
                <LockButton dcNo={dcNo} partCode={partCode} />
              </div>
            </div>
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Part Code</label>
              <input
                type="text"
                value={isDcLocked ? useLockStore.getState().lockedPartCode : partCode}
                onChange={(e) => setPartCode(e.target.value)}
                disabled={isDcLocked}
                className={`w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 h-9 transition-all ${isDcLocked ? 'bg-gray-50 text-gray-500 border-gray-200' : 'bg-white'}`}
                placeholder="Enter Part Code"
              />
            </div>
            <button
              onClick={handleCreateDC}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md text-xs font-bold uppercase tracking-widest transition-all shadow-sm active:scale-95"
            >
              Create DC
            </button>
          </div>
        </div>

        {/* Add New User */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <h3 className="text-[12px] font-bold text-green-600 uppercase tracking-widest mb-4 border-b pb-1">Add New User</h3>
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider">User ID</label>
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 h-9 transition-all bg-white"
                placeholder="Enter User ID"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 h-9 transition-all bg-white"
                placeholder="Enter Password"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Status</label>
              <select
                value={userStatus}
                onChange={(e) => setUserStatus(e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 h-9 transition-all bg-white"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <button
              onClick={handleAddUser}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-md text-xs font-bold uppercase tracking-widest transition-all shadow-sm active:scale-95"
            >
              Add User
            </button>
          </div>
        </div>

        {/* Add Engineers */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <h3 className="text-[12px] font-bold text-purple-600 uppercase tracking-widest mb-4 border-b pb-1">Add Engineers</h3>
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Engineer Name</label>
              <input
                type="text"
                value={engineerName}
                onChange={(e) => setEngineerName(e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 h-9 transition-all bg-white"
                placeholder="Enter Engineer Name"
              />
            </div>
            <button
              onClick={handleAddEngineer}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-md text-xs font-bold uppercase tracking-widest transition-all shadow-sm active:scale-95"
            >
              Add Engineer
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <h3 className="text-[12px] font-bold text-gray-600 uppercase tracking-widest mb-4 border-b pb-1">System Controls</h3>
          <div className="space-y-3">
            <button
              onClick={handleCreateTable}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all shadow-sm active:scale-95"
            >
              CreateTable (Alt+S)
            </button>
            <button
              onClick={handleExport}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all shadow-sm active:scale-95"
            >
              Export (Alt+E)
            </button>
            <button
              onClick={handleResetPcbCounter}
              className="w-full bg-slate-600 hover:bg-slate-700 text-white py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all shadow-sm active:scale-95"
            >
              Reset PCB Serial Counter
            </button>
            <button
              onClick={handleClearLocalStorage}
              className="w-full bg-rose-600 hover:bg-rose-700 text-white py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all shadow-sm active:scale-95"
            >
              Clear Local Storage
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
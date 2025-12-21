'use client';

import { useState, useEffect, useCallback } from 'react';

interface SettingsTabProps {
  dcNumbers: string[];
  dcPartCodes: Record<string, string[]>;
  onAddDcNumber: (dcNo: string, partCode: string) => void;
  onAddDcNumberToDb?: (dcNo: string, partCode: string) => Promise<void>;
}

export function SettingsTab({ dcNumbers, dcPartCodes, onAddDcNumber, onAddDcNumberToDb }: SettingsTabProps) {
  const [dcNo, setDcNo] = useState('');
  const [partCode, setPartCode] = useState('');
  const [selectedDcNo, setSelectedDcNo] = useState('');
  const [newPartCode, setNewPartCode] = useState('');
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [userStatus, setUserStatus] = useState('Active');
  const [engineerName, setEngineerName] = useState('');

  const handleCreateDC = async () => {
    console.log('=== SettingsTab.handleCreateDC START ===');
    console.log('Input values - DC No:', dcNo, 'Part Code:', partCode);
    const trimmedDcNo = dcNo.trim();
    const trimmedPartCode = partCode.trim();
    console.log('Trimmed values - DC No:', trimmedDcNo, 'Part Code:', trimmedPartCode);
    
    if (trimmedDcNo) {
      // Add to localStorage/state
      console.log('Calling onAddDcNumber');
      onAddDcNumber(trimmedDcNo, trimmedPartCode);
      
      // Add to database if function is provided
      console.log('Checking if onAddDcNumberToDb is provided:', !!onAddDcNumberToDb);
      if (onAddDcNumberToDb) {
        console.log('Calling onAddDcNumberToDb with:', trimmedDcNo, trimmedPartCode);
        try {
          const result = await onAddDcNumberToDb(trimmedDcNo, trimmedPartCode);
          console.log('Successfully called onAddDcNumberToDb, result:', result);
          
          // Only show success message if database call succeeded
          setDcNo('');
          setPartCode('');
          alert(`DC Number "${trimmedDcNo}" with Part Code "${trimmedPartCode}" has been created successfully!`);
        } catch (error) {
          console.error('Error saving DC number to database:', error);
          alert(`DC Number "${trimmedDcNo}" created locally but failed to save to database.`);
          return;
        }
      } else {
        console.log('onAddDcNumberToDb is not provided');
        // Still show success for localStorage update
        setDcNo('');
        setPartCode('');
        alert(`DC Number "${trimmedDcNo}" with Part Code "${trimmedPartCode}" has been created successfully!`);
      }
      
      console.log('=== SettingsTab.handleCreateDC END ===');    } else {
      alert('Please enter a DC Number');
    }
  };
  
  const handleAddPartCode = async () => {
    console.log('=== SettingsTab.handleAddPartCode START ===');
    console.log('Input values - Selected DC No:', selectedDcNo, 'New Part Code:', newPartCode);
    const trimmedSelectedDcNo = selectedDcNo.trim();
    const trimmedNewPartCode = newPartCode.trim();
    console.log('Trimmed values - Selected DC No:', trimmedSelectedDcNo, 'New Part Code:', trimmedNewPartCode);
    
    if (trimmedSelectedDcNo && trimmedNewPartCode) {
      // Get existing part codes for this DC
      const existingPartCodes = dcPartCodes[trimmedSelectedDcNo] || [];
      
      // Check if part code already exists
      if (existingPartCodes.includes(trimmedNewPartCode)) {
        alert(`Part Code "${trimmedNewPartCode}" already exists for DC Number "${trimmedSelectedDcNo}"`);
        return;
      }
      
      // Add to localStorage/state
      console.log('Calling onAddDcNumber to add new part code');
      onAddDcNumber(trimmedSelectedDcNo, trimmedNewPartCode);
      
      // Add to database if function is provided
      console.log('Checking if onAddDcNumberToDb is provided:', !!onAddDcNumberToDb);
      if (onAddDcNumberToDb) {
        console.log('Calling onAddDcNumberToDb with:', trimmedSelectedDcNo, trimmedNewPartCode);
        try {
          const result = await onAddDcNumberToDb(trimmedSelectedDcNo, trimmedNewPartCode);
          console.log('Successfully called onAddDcNumberToDb, result:', result);
          
          // Only show success message if database call succeeded
          setSelectedDcNo('');
          setNewPartCode('');
          alert(`Part Code "${trimmedNewPartCode}" has been added to DC Number "${trimmedSelectedDcNo}" successfully!`);
        } catch (error) {
          console.error('Error saving part code to database:', error);
          alert(`Part Code "${trimmedNewPartCode}" added locally but failed to save to database.`);
          return;
        }
      } else {
        console.log('onAddDcNumberToDb is not provided');
        // Still show success for localStorage update
        setSelectedDcNo('');
        setNewPartCode('');
        alert(`Part Code "${trimmedNewPartCode}" has been added to DC Number "${trimmedSelectedDcNo}" successfully!`);
      }
      
      console.log('=== SettingsTab.handleAddPartCode END ===');
    } else {
      alert('Please select a DC Number and enter a Part Code');
    }
  };

  const handleAddUser = () => {
    // Implementation for adding user
    console.log('Adding user with:', { userId, password, userStatus });
  };

  const handleAddEngineer = () => {
    // Implementation for adding engineer
    console.log('Adding engineer with:', { engineerName });
  };

  const handleCreateTable = () => {
    // Implementation for creating table
    console.log('Creating table');
  };

  const handleExport = () => {
    // Implementation for exporting data
    console.log('Exporting data');
  };

  const handleResetPcbCounter = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('pcb-serial-counter', '1');
      alert('PCB serial counter reset to 0001. Next generated PCB number will start from 1.');
    }
  };

  const handleDispatch = () => {
    // Implementation for dispatching
    console.log('Dispatching');
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
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Create New DC */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Create New DC</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">DC No.</label>
              <input
                type="text"
                value={dcNo}
                onChange={(e) => setDcNo(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="Enter DC No."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Part Code</label>
              <input
                type="text"
                value={partCode}
                onChange={(e) => setPartCode(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="Enter Part Code"
              />
            </div>
            <button
              onClick={handleCreateDC}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white p-2 rounded"
            >
              Create DC
            </button>
          </div>
        </div>
        
        {/* Add Part Code to Existing DC */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Add Part Code to Existing DC</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select DC No.</label>
              <select
                value={selectedDcNo}
                onChange={(e) => setSelectedDcNo(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
              >
                <option value="">Select a DC Number</option>
                {dcNumbers.map((dc) => (
                  <option key={dc} value={dc}>{dc}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Part Code</label>
              <input
                type="text"
                value={newPartCode}
                onChange={(e) => setNewPartCode(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="Enter New Part Code"
              />
            </div>
            <button
              onClick={handleAddPartCode}
              className="w-full bg-green-500 hover:bg-green-600 text-white p-2 rounded"
              disabled={!selectedDcNo}
            >
              Add Part Code
            </button>
          </div>
        </div>

        {/* Add New User */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Add New User</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="Enter User ID"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="Enter Password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={userStatus}
                onChange={(e) => setUserStatus(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <button
              onClick={handleAddUser}
              className="w-full bg-green-500 hover:bg-green-600 text-white p-2 rounded"
            >
              Add User
            </button>
          </div>
        </div>

        {/* Add Engineers */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Add Engineers</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Enter Engineer Name</label>
              <input
                type="text"
                value={engineerName}
                onChange={(e) => setEngineerName(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="Enter Engineer Name"
              />
            </div>
            <button
              onClick={handleAddEngineer}
              className="w-full bg-purple-500 hover:bg-purple-600 text-white p-2 rounded"
            >
              Add Engineer
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Controls</h3>
          <div className="space-y-3">
            <button
              onClick={handleCreateTable}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-white p-2 rounded"
            >
              CreateTable (Alt+S)
            </button>
            <button
              onClick={handleExport}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white p-2 rounded"
            >
              Export (Alt+E)
            </button>
            <button
              onClick={handleResetPcbCounter}
              className="w-full bg-slate-600 hover:bg-slate-700 text-white p-2 rounded"
            >
              Reset PCB Serial Counter
            </button>
          </div>
        </div>

        {/* Dispatch */}
        <div className="border border-gray-200 rounded-lg p-4 md:col-span-2">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Dispatch</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">DC No.</label>
              <select className="w-full p-2 border border-gray-300 rounded">
                <option value="">Select DC No.</option>
                {dcNumbers.map((dc) => (
                  <option key={dc} value={dc}>{dc}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Part Code</label>
              <select className="w-full p-2 border border-gray-300 rounded">
                <option value="">Select Part Code</option>
                {/* Dynamic Part Code selection based on selected DC */}
                {/* This would be implemented with state management in a real scenario */}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={handleDispatch}
                className="w-full bg-green-500 hover:bg-green-600 text-white p-2 rounded"
              >
                Dispatch
              </button>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-4">
            <div>Dispatched: <span className="font-medium">0</span></div>
            <div>Total = 0 | Dispatched = 0 | Pending = 0</div>
          </div>
        </div>
      </div>
    </div>
  );
}
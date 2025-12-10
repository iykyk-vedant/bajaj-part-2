'use client';

import { useState } from 'react';

interface SettingsTabProps {
  dcNumbers: string[];
  onAddDcNumber: (dcNo: string) => void;
}

export function SettingsTab({ dcNumbers, onAddDcNumber }: SettingsTabProps) {
  const [dcNo, setDcNo] = useState('');
  const [partCode, setPartCode] = useState('');
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [userStatus, setUserStatus] = useState('Active');
  const [engineerName, setEngineerName] = useState('');

  const handleCreateDC = () => {
    if (dcNo.trim()) {
      onAddDcNumber(dcNo.trim());
      setDcNo('');
      setPartCode('');
      // Show success message
      alert(`DC Number "${dcNo.trim()}" has been created successfully!`);
    } else {
      alert('Please enter a DC Number');
    }
  };

  const handleResetPcbCounter = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('pcb-serial-counter', '1');
      alert('PCB serial counter reset to 0001. Next generated PCB number will start from 1.');
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

  const handleDispatch = () => {
    // Implementation for dispatching
    console.log('Dispatching');
  };

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
              CreateTable
            </button>
            <button
              onClick={handleExport}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white p-2 rounded"
            >
              Export
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
                <option value="1001">1001</option>
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
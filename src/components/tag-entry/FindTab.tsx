'use client';

import { useState } from 'react';

export function FindTab() {
  const [dcNo, setDcNo] = useState('');
  const [partCode, setPartCode] = useState('');
  const [srNo, setSrNo] = useState('');

  const handleFind = () => {
    // Implementation for finding PCB
    console.log('Finding PCB with:', { dcNo, partCode, srNo });
    // In a real implementation, this would likely call an API or search function
    alert(`Searching for PCB with:\nDC No: ${dcNo}\nPart Code: ${partCode}\nSerial No: ${srNo}`);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">DC No.</label>
          <select
            value={dcNo}
            onChange={(e) => setDcNo(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select DC No.</option>
            <option value="DC001">DC001</option>
            <option value="DC002">DC002</option>
            <option value="DC003">DC003</option>
            <option value="DC004">DC004</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Part Code</label>
          <select
            value={partCode}
            onChange={(e) => setPartCode(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Part Code</option>
            <option value="PC1001">PC1001</option>
            <option value="PC1002">PC1002</option>
            <option value="PC1003">PC1003</option>
            <option value="PC1004">PC1004</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Serial No.</label>
          <input
            type="text"
            value={srNo}
            onChange={(e) => setSrNo(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter Serial No."
          />
        </div>
      </div>
      <div className="mt-6">
        <button
          onClick={handleFind}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-md transition duration-300 ease-in-out transform hover:scale-105"
        >
          Find PCB
        </button>
      </div>
    </div>
  );
}
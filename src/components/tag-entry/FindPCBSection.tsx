'use client';

import { useState } from 'react';

export function FindPCBSection() {
  const [dcNo, setDcNo] = useState('');
  const [partCode, setPartCode] = useState('');
  const [srNo, setSrNo] = useState('');

  const handleFind = () => {
    // Implementation for finding PCB
    console.log('Finding PCB with:', { dcNo, partCode, srNo });
  };

  return (
    <div className="bg-blue-500 text-white p-4 rounded-lg mb-6">
      <h2 className="text-lg font-bold mb-3">Find PCB</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">DC No.</label>
          <select
            value={dcNo}
            onChange={(e) => setDcNo(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded text-gray-800"
          >
            <option value="">Select DC No.</option>
            <option value="DC001">DC001</option>
            <option value="DC002">DC002</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Part Code</label>
          <select
            value={partCode}
            onChange={(e) => setPartCode(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded text-gray-800"
          >
            <option value="">Select Part Code</option>
            <option value="PC1001">PC1001</option>
            <option value="PC1002">PC1002</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Sr No.</label>
          <input
            type="text"
            value={srNo}
            onChange={(e) => setSrNo(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded text-gray-800"
            placeholder="Enter Serial No."
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={handleFind}
            className="w-full bg-green-600 hover:bg-green-700 text-white p-2 rounded"
          >
            Find
          </button>
        </div>
      </div>
    </div>
  );
}
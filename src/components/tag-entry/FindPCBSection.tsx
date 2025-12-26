'use client';

import { useState } from 'react';

export function FindPCBSection() {
  const [searchTerm, setSearchTerm] = useState('');

  const handleFind = () => {
    // Implementation for finding PCB

  };

  return (
    <div className="bg-blue-500 text-white p-4 rounded-lg mb-6">
      <h2 className="text-lg font-bold mb-3">Find PCB</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Search</label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded text-gray-800"
            placeholder="Enter search term"
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

'use client';

import { useState } from 'react';
import { useLockStore } from '@/store/lockStore';
import { LockButton } from './LockButton';
import { Download } from 'lucide-react';

interface FindTabProps {
  dcNumbers?: string[];
  onExportExcel?: () => void;
}

export function FindTab({ dcNumbers = ['DC001', 'DC002', 'DC003', 'DC004'], onExportExcel }: FindTabProps) {
  const { isDcLocked } = useLockStore();
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
    <div className="bg-white p-4 rounded-md shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-gray-800">Find PCB</h2>
        {onExportExcel && (
          <button
            onClick={onExportExcel}
            className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded flex items-center gap-2 text-sm"
          >
            <Download className="h-4 w-4" />
            Export Excel
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">DC No.</label>
          <div className="flex gap-2">
            <select
              value={isDcLocked ? useLockStore.getState().lockedDcNo : dcNo}
              onChange={(e) => setDcNo(e.target.value)}
              disabled={isDcLocked}
              className={`flex-1 p-2 text-sm border border-gray-300 rounded ${isDcLocked ? 'bg-gray-100' : ''} h-10`}
            >
              <option value="">Select DC No.</option>
              {dcNumbers.map((dc) => (
                <option key={dc} value={dc}>{dc}</option>
              ))}
            </select>
            <LockButton dcNo={dcNo} partCode={partCode} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Part Code</label>
          <select
            value={isDcLocked ? useLockStore.getState().lockedPartCode : partCode}
            onChange={(e) => setPartCode(e.target.value)}
            disabled={isDcLocked}
            className={`w-full p-2 text-sm border border-gray-300 rounded ${isDcLocked ? 'bg-gray-100' : ''} h-10`}
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
            className="w-full p-2 text-sm border border-gray-300 rounded h-10"
            placeholder="Enter Serial No."
          />
        </div>
      </div>
      <div className="mt-4 flex justify-center">
        <button
          onClick={handleFind}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded text-sm"
        >
          Find PCB
        </button>
      </div>
    </div>
  );
}
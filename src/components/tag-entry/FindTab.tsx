'use client';

import { useState } from 'react';
import { useLockStore } from '@/store/lockStore';
import { LockButton } from './LockButton';
import { Download } from 'lucide-react';

interface FindTabProps {
  dcNumbers?: string[];
  dcPartCodes?: Record<string, string[]>;
  onExportExcel?: (dcNo?: string) => void;
}

export function FindTab({ dcNumbers = [], dcPartCodes = {}, onExportExcel }: FindTabProps) {
  const { isDcLocked } = useLockStore();
  const [dcNo, setDcNo] = useState('');
  const [partCode, setPartCode] = useState('');
  const [srNo, setSrNo] = useState('');
  const [selectedDcForExport, setSelectedDcForExport] = useState('');

  const handleFind = () => {
    // Implementation for finding PCB

    // In a real implementation, this would likely call an API or search function
    alert(`Searching for PCB with:\nDC No: ${dcNo}\nPart Code: ${partCode}\nSerial No: ${srNo}`);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
      <div className="flex justify-between items-center mb-6 border-b pb-2">
        <h2 className="text-[14px] font-bold text-gray-800 uppercase tracking-widest">Find PCB</h2>
        {onExportExcel && (
          <div className="flex gap-2 items-center">
            <select
              value={selectedDcForExport}
              onChange={(e) => setSelectedDcForExport(e.target.value)}
              className="px-2 py-1 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 h-9 transition-all bg-white"
            >
              <option value="">All DC Numbers</option>
              {dcNumbers
                .filter(dc => dc != null && dc !== '')
                .map((dc, index) => (
                  <option key={`export-${dc}-${index}`} value={dc}>{dc}</option>
                ))}
            </select>
            <button
              onClick={() => onExportExcel(selectedDcForExport || undefined)}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-1.5 px-4 rounded-md flex items-center gap-2 text-[11px] uppercase tracking-wider transition-all shadow-sm active:scale-95"
            >
              <Download className="h-3.5 w-3.5" />
              Export Excel
            </button>
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="space-y-1">
          <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider">DC No.</label>
          <div className="flex gap-2">
            <select
              value={isDcLocked ? useLockStore.getState().lockedDcNo : dcNo}
              onChange={(e) => setDcNo(e.target.value)}
              disabled={isDcLocked}
              className={`flex-1 px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 h-9 transition-all ${isDcLocked ? 'bg-gray-50 text-gray-500 border-gray-200' : 'bg-white'}`}
            >
              <option value="">Select DC No.</option>
              {dcNumbers
                .filter(dc => dc != null && dc !== '')
                .map((dc, index) => (
                  <option key={`${dc}-${index}`} value={dc}>{dc}</option>
                ))}
            </select>
            <LockButton dcNo={dcNo} partCode={partCode} />
          </div>
        </div>
        <div className="space-y-1">
          <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Part Code</label>
          <select
            value={isDcLocked ? useLockStore.getState().lockedPartCode : partCode}
            onChange={(e) => setPartCode(e.target.value)}
            disabled={isDcLocked}
            className={`w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 h-9 transition-all ${isDcLocked ? 'bg-gray-50 text-gray-500 border-gray-200' : 'bg-white'}`}
          >
            <option value="">Select Part Code</option>
            {(dcPartCodes[dcNo] || [])
              .filter(code => code != null && code !== '')
              .map((code, index) => (
                <option key={`${code}-${index}`} value={code}>{code}</option>
              ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Serial No.</label>
          <input
            type="text"
            value={srNo}
            onChange={(e) => setSrNo(e.target.value)}
            className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 h-9 transition-all bg-white"
            placeholder="Enter Serial No."
          />
        </div>
      </div>
      <div className="mt-2 flex justify-center">
        <button
          onClick={handleFind}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-10 rounded-md text-xs uppercase tracking-widest transition-all shadow-md active:scale-95"
        >
          Find PCB
        </button>
      </div>
    </div>
  );
}
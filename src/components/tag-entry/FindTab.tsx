'use client';

import { useState } from 'react';
import { useLockStore } from '@/store/lockStore';
import { LockButton } from './LockButton';
import { Download } from 'lucide-react';

interface FindTabProps {
  dcNumbers?: string[];
  dcPartCodes?: Record<string, string[]>;
  onExportExcel?: () => void;
}

export function FindTab({ dcNumbers = [], dcPartCodes = {}, onExportExcel }: FindTabProps) {
  const { isDcLocked } = useLockStore();
  const [dcNo, setDcNo] = useState('');
  const [partCode, setPartCode] = useState('');
  const [srNo, setSrNo] = useState('');
  const [dispatchDate, setDispatchDate] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    switch(name) {
      case 'dcNo':
        setDcNo(value);
        break;
      case 'partCode':
        setPartCode(value);
        break;
      case 'srNo':
        setSrNo(value);
        break;
      case 'dispatchDate':
        setDispatchDate(value);
        break;
      default:
        break;
    }
  };

  const handleSrNoIncrement = () => {
    const currentSrNo = parseInt(srNo || '0');
    if (!isNaN(currentSrNo)) {
      const newSrNo = currentSrNo + 1;
      setSrNo(String(newSrNo).padStart(3, '0'));
    }
  };

  const handleSrNoDecrement = () => {
    const currentSrNo = parseInt(srNo || '0');
    if (!isNaN(currentSrNo) && currentSrNo > 1) { // Prevent going below 1
      const newSrNo = currentSrNo - 1;
      setSrNo(String(newSrNo).padStart(3, '0'));
    }
  };

  const handleFind = () => {
    // Implementation for finding PCB

    // In a real implementation, this would likely call an API or search function
    alert(`Searching for PCB with:
DC No: ${dcNo}
Part Code: ${partCode}
Dispatch Date: ${dispatchDate}
Serial No: ${srNo}`);
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">DC No.</label>
          <div className="flex gap-2">
            <select
              name="dcNo"
              value={isDcLocked ? useLockStore.getState().lockedDcNo : dcNo}
              onChange={handleChange}
              disabled={isDcLocked}
              className={`flex-1 p-2 text-sm border border-gray-300 rounded ${isDcLocked ? 'bg-gray-100' : ''} h-10`}
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
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Part Code</label>
          <select
            name="partCode"
            value={isDcLocked ? useLockStore.getState().lockedPartCode : partCode}
            onChange={handleChange}
            disabled={isDcLocked}
            className={`w-full p-2 text-sm border border-gray-300 rounded ${isDcLocked ? 'bg-gray-100' : ''} h-10`}
          >
            <option value="">Select Part Code</option>
            {(dcPartCodes[dcNo] || [])
              .filter(code => code != null && code !== '')
              .map((code, index) => (
              <option key={`${code}-${index}`} value={code}>{code}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Dispatch Date:</label>
          <input
            type="date"
            name="dispatchDate"
            value={dispatchDate}
            onChange={handleChange}
            className="w-full p-2 text-sm border border-gray-300 rounded h-10"
            placeholder="Select Dispatch Date"
          />
        </div>
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-sm font-medium text-gray-700">Serial No.</label>
            <div className="flex space-x-1">
              <button 
                type="button" 
                onClick={() => handleSrNoIncrement()}
                className="text-gray-700 hover:text-gray-900 px-1"
              >
                +
              </button>
              <button 
                type="button" 
                onClick={() => handleSrNoDecrement()}
                className="text-gray-700 hover:text-gray-900 px-1"
              >
                -
              </button>
            </div>
          </div>
          <input
            type="text"
            name="srNo"
            value={srNo}
            onChange={handleChange}
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
'use client';

import { useState } from 'react';
// FindTab import has been removed since we're integrating its fields directly

interface ConsumptionTabProps {
  dcNumbers?: string[];
}

export function ConsumptionTab({ dcNumbers = ['DC001', 'DC002'] }: ConsumptionTabProps) {
  // State for Find fields
  const [dcNo, setDcNo] = useState('');
  const [partCode, setPartCode] = useState('');
  const [srNo, setSrNo] = useState('');
  
  const [formData, setFormData] = useState({
    repairDate: '',
    testing: '',
    failure: '',
    status: '',
    pcbSrNo: 'EC0112234567',
    rfObservation: '',
    analysis: '',
    validationResult: '',
    componentChange: '',
    enggName: '',
    dispatchDate: '',
  });

  const handleFind = () => {
    // Implementation for finding PCB
    console.log('Finding PCB with:', { dcNo, partCode, srNo });
    // In a real implementation, this would likely call an API or search function
    alert(`Searching for PCB with:\nDC No: ${dcNo}\nPart Code: ${partCode}\nSerial No: ${srNo}`);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleConsume = (e: React.FormEvent) => {
    e.preventDefault();
    // Implementation for consuming data
    console.log('Consuming data:', formData);
  };

  return (
    <div className="bg-white w-full h-full">
      <div className="p-6 h-full overflow-auto">
        {/* Find Section - Moved to the top */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">DC No.</label>
              <select
                value={dcNo}
                onChange={(e) => setDcNo(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select DC No.</option>
                {dcNumbers.map((dc) => (
                  <option key={dc} value={dc}>{dc}</option>
                ))}
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

        {/* Consumption Form */}
        <form onSubmit={handleConsume} className="bg-white">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Repair Date:</label>
              <input
                type="date"
                name="repairDate"
                value={formData.repairDate}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Testing:</label>
              <select
                name="testing"
                value={formData.testing}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded"
              >
                <option value="">Select Result</option>
                <option value="PASS">PASS</option>
                <option value="FAIL">FAIL</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Failure:</label>
              <select
                name="failure"
                value={formData.failure}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded"
              >
                <option value="">Select Failure</option>
                <option value="Component">Component</option>
                <option value="Soldering">Soldering</option>
                <option value="Design">Design</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status:</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded"
              >
                <option value="">Select Status</option>
                <option value="OK">OK</option>
                <option value="NFF">NFF</option>
                <option value="SCRAP">SCRAP</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">PCB Sr No:</label>
              <div className="p-2 border border-gray-300 rounded bg-gray-100 font-mono">
                {formData.pcbSrNo}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Engg Name:</label>
              <select
                name="enggName"
                value={formData.enggName}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded"
              >
                <option value="">Select Engineer</option>
                <option value="Engineer 1">Engineer 1</option>
                <option value="Engineer 2">Engineer 2</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">RF Observation:</label>
              <input
                type="text"
                name="rfObservation"
                value={formData.rfObservation}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dispatch Date:</label>
              <input
                type="date"
                name="dispatchDate"
                value={formData.dispatchDate}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Analysis:</label>
            <textarea
              name="analysis"
              value={formData.analysis}
              onChange={handleChange}
              rows={3}
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Validation Result:</label>
            <textarea
              name="validationResult"
              value={formData.validationResult}
              readOnly
              rows={3}
              className="w-full p-2 border border-gray-300 rounded bg-gray-100"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Component Change:</label>
            <textarea
              name="componentChange"
              value={formData.componentChange}
              onChange={handleChange}
              rows={3}
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Consume
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
'use client';

import { useState } from 'react';

export function ConsumptionTab() {
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
    <form onSubmit={handleConsume} className="bg-white p-6 rounded-lg shadow-md">
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
  );
}
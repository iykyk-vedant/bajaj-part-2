'use client';

import { useState, useEffect } from 'react';

interface TagEntryFormProps {
  initialData?: any;
}

export function TagEntryForm({ initialData }: TagEntryFormProps) {
  const [formData, setFormData] = useState({
    srNo: '001',
    dcNo: '',
    branch: 'Mumbai', // Set default branch
    bccdName: 'BCCD-001', // Set default BCCD name
    productDescription: '',
    productSrNo: '',
    dateOfPurchase: '',
    complaintNo: '',
    partCode: '',
    natureOfDefect: '', // Will be populated from image
    visitingTechName: '',
    mfgMonthYear: '',
    pcbSrNo: 'EC0112234567',
  });

  // Update form data when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        branch: initialData.branch || 'Mumbai', // Default to Mumbai if not provided
        bccdName: initialData.bccdName || 'BCCD-001', // Default to BCCD-001 if not provided
        productDescription: initialData.productDescription || '',
        productSrNo: initialData.productSrNo || '',
        dateOfPurchase: initialData.dateOfPurchase || '',
        complaintNo: initialData.complaintNo || '',
        partCode: initialData.sparePartCode || '',
        natureOfDefect: initialData.natureOfDefect || '', // Populate from image
        visitingTechName: initialData.technicianName || '',
        // Note: dcNo, mfgMonthYear, and pcbSrNo are not in the extraction schema
        // They will retain their default values or user input
      }));
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Implementation for saving data
    console.log('Saving data:', formData);
  };

  const handleClear = () => {
    setFormData({
      srNo: '001',
      dcNo: '',
      branch: 'Mumbai', // Reset to default branch
      bccdName: 'BCCD-001', // Reset to default BCCD name
      productDescription: '',
      productSrNo: '',
      dateOfPurchase: '',
      complaintNo: '',
      partCode: '',
      natureOfDefect: '', // Reset to empty
      visitingTechName: '',
      mfgMonthYear: '',
      pcbSrNo: 'EC0112234567',
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sr. No.:</label>
          <input
            type="text"
            name="srNo"
            value={formData.srNo}
            readOnly
            className="w-full p-2 border border-gray-300 rounded bg-gray-100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">DC No:</label>
          <select
            name="dcNo"
            value={formData.dcNo}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded"
          >
            <option value="">Select DC No.</option>
            <option value="DC001">DC001</option>
            <option value="DC002">DC002</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Branch:</label>
          {/* Changed from dropdown to text input */}
          <input
            type="text"
            name="branch"
            value={formData.branch}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">BCCD Name:</label>
          {/* Changed from dropdown to text input */}
          <input
            type="text"
            name="bccdName"
            value={formData.bccdName}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Product Description:</label>
          <input
            type="text"
            name="productDescription"
            value={formData.productDescription}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Product Sr No:</label>
          <div className="flex">
            <input
              type="text"
              name="productSrNo"
              value={formData.productSrNo}
              onChange={handleChange}
              className="flex-1 p-2 border border-gray-300 rounded-l"
            />
            <div className="bg-gray-200 p-2 border border-l-0 border-gray-300 rounded-r">
              {formData.productSrNo.length}/20
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date of Purchase:</label>
          <input
            type="date"
            name="dateOfPurchase"
            value={formData.dateOfPurchase}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Complaint No:</label>
          <input
            type="text"
            name="complaintNo"
            value={formData.complaintNo}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Part Code:</label>
          <input
            type="text"
            name="partCode"
            value={formData.partCode}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nature of Defect:</label>
          {/* Changed from dropdown to text input */}
          <input
            type="text"
            name="natureOfDefect"
            value={formData.natureOfDefect}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Visiting Tech Name:</label>
          <input
            type="text"
            name="visitingTechName"
            value={formData.visitingTechName}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mfg Month/Year:</label>
          <input
            type="month"
            name="mfgMonthYear"
            value={formData.mfgMonthYear}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">PCB Sr. No:</label>
          <div className="flex">
            <input
              type="text"
              name="pcbSrNo"
              value={formData.pcbSrNo}
              onChange={handleChange}
              className="flex-1 p-2 border border-gray-300 rounded-l"
            />
            <button
              type="button"
              className="bg-gray-200 p-2 border border-l-0 border-gray-300 rounded-r hover:bg-gray-300"
              onClick={() => {
                const prefixes = ['EC', 'PC', 'MC'];
                const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
                const date = new Date();
                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const year = String(date.getFullYear()).slice(-2);
                const serial = Math.floor(Math.random() * 9000) + 1000;
                setFormData(prev => ({
                  ...prev,
                  pcbSrNo: `${prefix}${day}${month}${year}${serial}`
                }));
              }}
            >
              Generate
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={handleClear}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Clear
        </button>
        <button
          type="button"
          className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
        >
          Update
        </button>
        <button
          type="button"
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Delete
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Save
        </button>
      </div>
    </form>
  );
}
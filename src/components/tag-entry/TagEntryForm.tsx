'use client';

import { useState, useEffect } from 'react';
import { TagEntry } from '@/lib/tag-entry/types';

interface TagEntryFormProps {
  initialData?: any;
  dcNumbers?: string[];
}

const STORAGE_KEY = 'tag-entries';

export function TagEntryForm({ initialData, dcNumbers = ['DC001', 'DC002'] }: TagEntryFormProps) {
  const [formData, setFormData] = useState({
    id: '',
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

  const [savedEntries, setSavedEntries] = useState<TagEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showAllEntries, setShowAllEntries] = useState(false);

  // Load saved entries from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          setSavedEntries(JSON.parse(stored));
        } catch (e) {
          console.error('Error loading entries:', e);
        }
      }
    }
  }, []);

  // Get next serial number based on existing entries
  useEffect(() => {
    if (savedEntries.length > 0 && !formData.id) {
      const maxSrNo = Math.max(
        ...savedEntries.map(entry => parseInt(entry.srNo) || 0)
      );
      const nextSrNo = String(maxSrNo + 1).padStart(3, '0');
      setFormData(prev => ({ ...prev, srNo: nextSrNo }));
    }
  }, [savedEntries, formData.id]);

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
    
    // Validate required fields
    if (!formData.dcNo || !formData.productSrNo || !formData.complaintNo) {
      alert('Please fill in all required fields: DC No., Product Sr No., and Complaint No.');
      return;
    }

    const entryToSave: TagEntry = {
      id: formData.id || Date.now().toString(),
      srNo: formData.srNo,
      dcNo: formData.dcNo,
      branch: formData.branch,
      bccdName: formData.bccdName,
      productDescription: formData.productDescription,
      productSrNo: formData.productSrNo,
      dateOfPurchase: formData.dateOfPurchase,
      complaintNo: formData.complaintNo,
      partCode: formData.partCode,
      natureOfDefect: formData.natureOfDefect,
      visitingTechName: formData.visitingTechName,
      mfgMonthYear: formData.mfgMonthYear,
      pcbSrNo: formData.pcbSrNo,
    };

    let updatedEntries: TagEntry[];
    if (formData.id) {
      // Update existing entry
      updatedEntries = savedEntries.map(entry => 
        entry.id === formData.id ? entryToSave : entry
      );
      alert('Entry updated successfully!');
    } else {
      // Create new entry
      updatedEntries = [...savedEntries, entryToSave];
      alert('Entry saved successfully!');
    }

    setSavedEntries(updatedEntries);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedEntries));
    }

    // Reset form after save
    handleClear();
  };

  const handleUpdate = () => {
    if (savedEntries.length === 0) {
      alert('No saved entries found. Please save an entry first.');
      return;
    }
    
    // Show all entries for selection
    setShowAllEntries(true);
    setShowSearchResults(false);
  };

  const handleDelete = () => {
    if (!formData.id) {
      alert('Please search and select an entry to delete first.');
      return;
    }

    if (!confirm('Are you sure you want to delete this entry?')) {
      return;
    }

    const updatedEntries = savedEntries.filter(entry => entry.id !== formData.id);
    setSavedEntries(updatedEntries);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedEntries));
    }

    alert('Entry deleted successfully!');
    handleClear();
  };

  const handleClear = () => {
    const nextSrNo = savedEntries.length > 0 
      ? String(Math.max(...savedEntries.map(e => parseInt(e.srNo) || 0)) + 1).padStart(3, '0')
      : '001';
    
    setFormData({
      id: '',
      srNo: nextSrNo,
      dcNo: '',
      branch: 'Mumbai',
      bccdName: 'BCCD-001',
      productDescription: '',
      productSrNo: '',
      dateOfPurchase: '',
      complaintNo: '',
      partCode: '',
      natureOfDefect: '',
      visitingTechName: '',
      mfgMonthYear: '',
      pcbSrNo: 'EC0112234567',
    });
    setShowSearchResults(false);
    setShowAllEntries(false);
    setSearchQuery('');
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      alert('Please enter a search term (DC No., Complaint No., or Product Sr No.)');
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const results = savedEntries.filter(entry =>
      entry.dcNo.toLowerCase().includes(query) ||
      entry.complaintNo.toLowerCase().includes(query) ||
      entry.productSrNo.toLowerCase().includes(query) ||
      entry.pcbSrNo.toLowerCase().includes(query)
    );

    if (results.length === 0) {
      alert('No entries found matching your search.');
      return;
    }

    // If only one result, load it directly
    if (results.length === 1) {
      const entry = results[0];
      setFormData({
        id: entry.id || '',
        srNo: entry.srNo,
        dcNo: entry.dcNo,
        branch: entry.branch,
        bccdName: entry.bccdName,
        productDescription: entry.productDescription,
        productSrNo: entry.productSrNo,
        dateOfPurchase: entry.dateOfPurchase,
        complaintNo: entry.complaintNo,
        partCode: entry.partCode,
        natureOfDefect: entry.natureOfDefect,
        visitingTechName: entry.visitingTechName,
        mfgMonthYear: entry.mfgMonthYear,
        pcbSrNo: entry.pcbSrNo,
      });
      setShowSearchResults(false);
      setSearchQuery('');
      alert('Entry loaded successfully!');
    } else {
      // Show multiple results - user can select
      setShowSearchResults(true);
    }
  };

  const loadEntry = (entry: TagEntry) => {
    setFormData({
      id: entry.id || '',
      srNo: entry.srNo,
      dcNo: entry.dcNo,
      branch: entry.branch,
      bccdName: entry.bccdName,
      productDescription: entry.productDescription,
      productSrNo: entry.productSrNo,
      dateOfPurchase: entry.dateOfPurchase,
      complaintNo: entry.complaintNo,
      partCode: entry.partCode,
      natureOfDefect: entry.natureOfDefect,
      visitingTechName: entry.visitingTechName,
      mfgMonthYear: entry.mfgMonthYear,
      pcbSrNo: entry.pcbSrNo,
    });
    setShowSearchResults(false);
    setShowAllEntries(false);
    setSearchQuery('');
  };

  const filteredResults = savedEntries.filter(entry =>
    searchQuery.toLowerCase().trim() === '' ||
    entry.dcNo.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
    entry.complaintNo.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
    entry.productSrNo.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
    entry.pcbSrNo.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
      {/* Search Bar */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by DC No., Complaint No., Product Sr No., or PCB Sr No."
            className="flex-1 p-2 border border-gray-300 rounded"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSearch();
              }
            }}
          />
          <button
            type="button"
            onClick={handleSearch}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Search
          </button>
        </div>
        
        {/* Search Results */}
        {showSearchResults && filteredResults.length > 0 && (
          <div className="mt-4 max-h-60 overflow-y-auto border border-gray-300 rounded">
            <div className="p-2 bg-gray-200 font-medium text-sm">Search Results ({filteredResults.length})</div>
            {filteredResults.map((entry) => (
              <div
                key={entry.id}
                onClick={() => loadEntry(entry)}
                className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-200 last:border-b-0"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-medium">DC: {entry.dcNo}</span> | 
                    <span className="ml-2">Complaint: {entry.complaintNo}</span> | 
                    <span className="ml-2">Product Sr: {entry.productSrNo}</span>
                  </div>
                  <span className="text-sm text-gray-500">Click to load</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* All Entries List (for Update button) */}
        {showAllEntries && savedEntries.length > 0 && (
          <div className="mt-4 max-h-60 overflow-y-auto border border-gray-300 rounded">
            <div className="p-2 bg-yellow-100 font-medium text-sm flex justify-between items-center">
              <span>All Entries ({savedEntries.length}) - Click to load</span>
              <button
                type="button"
                onClick={() => setShowAllEntries(false)}
                className="text-xs bg-gray-300 px-2 py-1 rounded hover:bg-gray-400"
              >
                Close
              </button>
            </div>
            {savedEntries.map((entry) => (
              <div
                key={entry.id}
                onClick={() => loadEntry(entry)}
                className="p-3 hover:bg-yellow-50 cursor-pointer border-b border-gray-200 last:border-b-0"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-medium">Sr. No: {entry.srNo}</span> | 
                    <span className="ml-2">DC: {entry.dcNo}</span> | 
                    <span className="ml-2">Complaint: {entry.complaintNo}</span> | 
                    <span className="ml-2">Product Sr: {entry.productSrNo}</span>
                  </div>
                  <span className="text-sm text-gray-500">Click to load</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
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
            {dcNumbers.map((dc) => (
              <option key={dc} value={dc}>{dc}</option>
            ))}
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
          onClick={handleUpdate}
          className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
        >
          Update
        </button>
        <button
          type="button"
          onClick={handleDelete}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          disabled={!formData.id}
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
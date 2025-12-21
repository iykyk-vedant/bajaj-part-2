'use client';

import { useState, useEffect, useCallback } from 'react';
import { TagEntry } from '@/lib/tag-entry/types';
import { spareParts } from '@/lib/spare-parts';

interface TagEntryFormProps {
  initialData?: any;
  dcNumbers?: string[];
  dcPartCodes?: Record<string, string[]>;
}
const STORAGE_KEY = 'tag-entries';
const PCB_COUNTER_KEY = 'pcb-serial-counter';

// Returns month code letter (A-L) for a given month index (0-based)
const getMonthCode = (monthIndex: number) => {
  const codes = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
  return codes[monthIndex] ?? 'A';
};

// Generates PCB number using provided DC No. and an incrementing counter
const generatePcbNumber = (dcNo: string) => {
  if (!dcNo) throw new Error('Please select a DC No. before generating PCB number');

  // Strip RC prefix and non-digits
  const dcDigits = dcNo.replace(/^RC/i, '').replace(/\D/g, '');

  // Middle part: first 4 digits after RC (pad with zeros if short)
  const middle = dcDigits.slice(0, 4).padEnd(4, '0');

  // Last 4 digits of DC No.
  const last4 = dcDigits.slice(-4).padStart(4, '0');

  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0'); // 01-31
  const monthCode = getMonthCode(now.getMonth()); // A-L
  const year = String(now.getFullYear()).slice(-2); // YY

  // Counter: persist in localStorage, increment per generation
  let counter = 1;
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(PCB_COUNTER_KEY);
    counter = stored ? Math.min(9999, Math.max(1, parseInt(stored, 10) || 1)) : 1;
    localStorage.setItem(PCB_COUNTER_KEY, String(Math.min(9999, counter + 1)));
  }
  const counterStr = String(counter).padStart(4, '0');

  // Final format: ES + middle + last4 + day + monthCode + year + counter
  return `ES${middle}${last4}${day}${monthCode}${year}${counterStr}`;
};

export function TagEntryForm({ initialData, dcNumbers = ['DC001', 'DC002'], dcPartCodes = {} }: TagEntryFormProps) {
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
  const [showSavedList, setShowSavedList] = useState(false);

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

  // Get next serial number based on existing entries for the selected DC
  useEffect(() => {
    if (!formData.id && formData.dcNo) {
      // Filter entries for the selected DC
      const dcEntries = savedEntries.filter(entry => entry.dcNo === formData.dcNo);
      
      if (dcEntries.length > 0) {
        const maxSrNo = Math.max(
          ...dcEntries.map(entry => parseInt(entry.srNo) || 0)
        );
        const nextSrNo = String(maxSrNo + 1).padStart(3, '0');
        setFormData(prev => ({ ...prev, srNo: nextSrNo }));
      } else {
        // If no entries for this DC, start with 001
        setFormData(prev => ({ ...prev, srNo: '001' }));
      }
    }
  }, [savedEntries, formData.id, formData.dcNo]);

  // Update form data when initialData changes
  useEffect(() => {
    if (initialData) {
      // Convert mfgMonthYear format if needed (from YYYY-MM to MM/YYYY)
      let mfgMonthYear = initialData.mfgMonthYear || '';
      if (mfgMonthYear && mfgMonthYear.length === 7 && mfgMonthYear[4] === '-') {
        const [year, month] = mfgMonthYear.split('-');
        mfgMonthYear = `${month}/${year}`;
      }
      
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
        mfgMonthYear: mfgMonthYear,
        // Note: dcNo, and pcbSrNo are not in the extraction schema
        // They will retain their default values or user input
      }));
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Handle partCode selection to auto-populate product description
    if (name === 'partCode') {
      setFormData(prev => {
        // Find the product description for the selected part code
        let productDescription = '';
        if (value) {
          const part = spareParts.find(p => p.code === value);
          if (part) {
            productDescription = part.description;
          }
        }
        
        return {
          ...prev,
          partCode: value,
          productDescription: productDescription || prev.productDescription
        };
      });
    }
    // Handle mfgMonthYear field specially to validate and format MM/YYYY
    else if (name === 'mfgMonthYear') {
      // Allow only digits and forward slash
      if (!/^[0-9\/]*$/.test(value) && value !== '') {
        return; // Don't update if invalid characters
      }
      
      let formattedValue = value;
      
      // Auto-format as user types
      if (value.length === 2 && !value.includes('/')) {
        formattedValue = value + '/';
      } else if (value.length === 3 && !value.endsWith('/')) {
        // Handle case where user pastes 3 digits without slash
        formattedValue = value.substring(0, 2) + '/' + value.substring(2);
      } else if (value.length > 7) {
        // Limit to MM/YYYY format (7 characters max)
        formattedValue = value.substring(0, 7);
      }
      
      setFormData(prev => ({
        ...prev,
        [name]: formattedValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.dcNo || !formData.productSrNo || !formData.complaintNo) {
      alert('Please fill in all required fields: DC No., Product Sr No., and Complaint No.');
      return;
    }
    
    // Validate Mfg Month/Year format if provided
    if (formData.mfgMonthYear) {
      const parts = formData.mfgMonthYear.split('/');
      if (parts.length !== 2) {
        alert('Mfg Month/Year must be in MM/YYYY format');
        return;
      }
      
      const [month, year] = parts;
      const monthNum = parseInt(month, 10);
      const yearNum = parseInt(year, 10);
      
      if (isNaN(monthNum) || isNaN(yearNum) || month.length !== 2 || year.length !== 4) {
        alert('Mfg Month/Year must be in MM/YYYY format (e.g., 05/2025)');
        return;
      }
      
      if (monthNum < 1 || monthNum > 12) {
        alert('Month must be between 01 and 12');
        return;
      }
      
      if (yearNum < 1900 || yearNum > 2100) {
        alert('Year must be between 1900 and 2100');
        return;
      }
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
    // Show saved list after save
    setShowSavedList(true);
    setShowSearchResults(false);
  };

  const handleUpdate = () => {
    if (savedEntries.length === 0) {
      alert('No saved entries found. Please save an entry first.');
      return;
    }
    
    // Show all entries for selection
    setShowSavedList(true);
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
    // Get next SR number for the currently selected DC
    let nextSrNo = '001';
    if (formData.dcNo) {
      const dcEntries = savedEntries.filter(entry => entry.dcNo === formData.dcNo);
      if (dcEntries.length > 0) {
        nextSrNo = String(Math.max(...dcEntries.map(e => parseInt(e.srNo) || 0)) + 1).padStart(3, '0');
      }
    }
    
    setFormData({
      id: '',
      srNo: nextSrNo,
      dcNo: formData.dcNo, // Keep the selected DC
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
    setShowSavedList(false);
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
    // Convert mfgMonthYear format if needed (from YYYY-MM to MM/YYYY)
    let mfgMonthYear = entry.mfgMonthYear || '';
    if (mfgMonthYear && mfgMonthYear.length === 7 && mfgMonthYear[4] === '-') {
      const [year, month] = mfgMonthYear.split('-');
      mfgMonthYear = `${month}/${year}`;
    }
    
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
      mfgMonthYear: mfgMonthYear,
      pcbSrNo: entry.pcbSrNo,
    });
    setShowSearchResults(false);
    setShowSavedList(false);
    setSearchQuery('');
  };

  const filteredResults = savedEntries.filter(entry =>
    searchQuery.toLowerCase().trim() === '' ||
    entry.dcNo.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
    entry.complaintNo.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
    entry.productSrNo.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
    entry.pcbSrNo.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  // Keyboard shortcut handler
  const handleKeyboardShortcut = useCallback((e: KeyboardEvent) => {
    // Only handle Alt key combinations
    if (!e.altKey) return;
    
    // Prevent browser default behavior for these shortcuts
    switch (e.key.toLowerCase()) {
      case 's':
        e.preventDefault();
        handleSubmit(e as unknown as React.FormEvent);
        break;
      case 'd':
        e.preventDefault();
        if (formData.id) {
          handleDelete();
        }
        break;
      case 'c':
        e.preventDefault();
        handleClear();
        break;
      case 'u':
        e.preventDefault();
        handleUpdate();
        break;
      default:
        break;
    }
  }, [formData.id]);

  // Add keyboard event listener
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', handleKeyboardShortcut as EventListener);
      return () => {
        window.removeEventListener('keydown', handleKeyboardShortcut as EventListener);
      };
    }
  }, [handleKeyboardShortcut]);

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
          <select
            name="partCode"
            value={formData.partCode}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded"
          >
            <option value="">Select Part Code</option>
            {(dcPartCodes[formData.dcNo] || []).map((code) => (
              <option key={code} value={code}>{code}</option>
            ))}
          </select>
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
            type="text"
            name="mfgMonthYear"
            value={formData.mfgMonthYear}
            onChange={handleChange}
            placeholder="MM/YYYY"
            className="w-full p-2 border border-gray-300 rounded"
            maxLength={7}
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
                try {
                  const pcb = generatePcbNumber(formData.dcNo);
                  setFormData(prev => ({
                    ...prev,
                    pcbSrNo: pcb,
                  }));
                } catch (err) {
                  alert(err instanceof Error ? err.message : 'Failed to generate PCB number');
                }
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
          Clear (Alt+C)
        </button>
        <button
          type="button"
          onClick={handleUpdate}
          className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
        >
          Update (Alt+U)
        </button>
        <button
          type="button"
          onClick={handleDelete}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          disabled={!formData.id}
        >
          Delete (Alt+D)
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Save (Alt+S)
        </button>
      </div>

      {/* Search Bar (below action buttons) */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex flex-col gap-3">
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

          <div className="flex gap-2 items-center">
            <button
              type="button"
              onClick={() => setShowSavedList(prev => !prev)}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm"
            >
              {showSavedList ? 'Hide saved list' : 'Show saved list'}
            </button>
            {savedEntries.length > 0 && !showSavedList && (
              <span className="text-sm text-gray-600">
                Saved entries: {savedEntries.length}
              </span>
            )}
          </div>
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

        {/* Saved Entries List */}
        {showSavedList && savedEntries.length > 0 && (
          <div className="mt-4 max-h-60 overflow-y-auto border border-gray-300 rounded">
            <div className="p-2 bg-yellow-100 font-medium text-sm flex justify-between items-center">
              <span>All Entries ({savedEntries.length}) - Click to load</span>
              <button
                type="button"
                onClick={() => setShowSavedList(false)}
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
    </form>
  );
}
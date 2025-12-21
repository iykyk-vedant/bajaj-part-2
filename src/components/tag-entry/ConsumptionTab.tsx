'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { validateConsumption, saveConsumptionEntry } from '@/app/actions/consumption-actions';
// FindTab import has been removed since we're integrating its fields directly

interface ConsumptionTabProps {
  dcNumbers?: string[];
  dcPartCodes?: Record<string, string[]>;
}

interface ConsumptionEntry {
  id?: string;
  repairDate: string;
  testing: string;
  failure: string;
  status: string;
  pcbSrNo: string;
  rfObservation: string;
  analysis: string;
  validationResult: string;
  componentChange: string;
  enggName: string;
  dispatchDate: string;
  // New fields for consumption validation
  componentConsumption?: string;
  consumptionEntry?: string;
  consumptionEntryDate?: string;
}
interface TagEntry {
  id?: string;
  srNo: string;
  dcNo: string;
  branch: string;
  bccdName: string;
  productDescription: string;
  productSrNo: string;
  dateOfPurchase: string;
  complaintNo: string;
  partCode: string;
  natureOfDefect: string;
  visitingTechName: string;
  mfgMonthYear: string;
  pcbSrNo: string;
}

interface TableRow {
  id?: string;
  srNo?: string;
  dcNo?: string;
  dcDate?: string;
  branch?: string;
  bccdName?: string;
  productDescription?: string;
  productSrNo?: string;
  dateOfPurchase?: string;
  complaintNo?: string;
  partCode?: string;
  defect?: string;
  visitingTechName?: string;
  mfgMonthYear?: string;
  repairDate?: string;
  testing?: string;
  failure?: string;
  status?: string;
  pcbSrNo?: string;
  rfObservation?: string;
  analysis?: string;
  validationResult?: string;
  componentChange?: string;
  enggName?: string;
  dispatchDate?: string;
  // New fields for consumption validation
  componentConsumption?: string;
  consumptionEntry?: string;
  consumptionEntryDate?: string;
}
export function ConsumptionTab({ dcNumbers = ['DC001', 'DC002'], dcPartCodes = {} }: ConsumptionTabProps) {
  // State for Find fields
  const [dcNo, setDcNo] = useState('');
  const [partCode, setPartCode] = useState('');
  const [srNo, setSrNo] = useState('');
  
  // Function to get the next SR number for a specific DC
  const getNextSrNoForDc = (dc: string): string => {
    // Get all entries for this DC from localStorage
    const storedConsumption = localStorage.getItem('consumption-entries');
    let consumptionEntries: ConsumptionEntry[] = [];
    
    if (storedConsumption) {
      try {
        consumptionEntries = JSON.parse(storedConsumption);
      } catch (e) {
        console.error('Error parsing consumption entries:', e);
      }
    }
    
    // Get all tag entries for this DC
    const storedTags = localStorage.getItem('tag-entries');
    let tagEntries: TagEntry[] = [];
    
    if (storedTags) {
      try {
        tagEntries = JSON.parse(storedTags);
      } catch (e) {
        console.error('Error parsing tag entries:', e);
      }
    }
    
    // Filter entries for this specific DC
    const dcConsumptionEntries = consumptionEntries.filter(entry => entry.pcbSrNo.includes(dc));
    const dcTagEntries = tagEntries.filter(entry => entry.dcNo === dc);
    
    // Get all SR numbers for this DC
    const srNumbers: number[] = [];
    
    // Extract SR numbers from consumption entries (assuming format contains DC)
    dcConsumptionEntries.forEach(entry => {
      // Try to extract SR number from pcbSrNo
      const match = entry.pcbSrNo.match(new RegExp(`${dc}-(\\d+)`));
      if (match && match[1]) {
        srNumbers.push(parseInt(match[1], 10));
      }
    });
    
    // Extract SR numbers from tag entries
    dcTagEntries.forEach(entry => {
      const srNum = parseInt(entry.srNo, 10);
      if (!isNaN(srNum)) {
        srNumbers.push(srNum);
      }
    });
    
    // Find the maximum SR number and add 1
    const maxSrNo = srNumbers.length > 0 ? Math.max(...srNumbers) : 0;
    const nextSrNo = maxSrNo + 1;
    
    // Return as a 3-digit string padded with zeros
    return String(nextSrNo).padStart(3, '0');
  };
  
  // Effect to update SR number when DC changes
  useEffect(() => {
    if (dcNo) {
      const nextSrNo = getNextSrNoForDc(dcNo);
      setSrNo(nextSrNo);
    }
  }, [dcNo]);

  // Effect to reset PCB found state when search criteria change
  useEffect(() => {
    if (isPcbFound) {
      setIsPcbFound(false);
    }
  }, [dcNo, partCode, srNo]);
  
  // Form data state
  const [formData, setFormData] = useState<ConsumptionEntry>({
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
    // New fields for consumption validation
    componentConsumption: '',
    consumptionEntry: '',
    consumptionEntryDate: '',
  });
  // Consumption entries state
  const [consumptionEntries, setConsumptionEntries] = useState<ConsumptionEntry[]>([]);
  
  // Unified table data state
  const [tableData, setTableData] = useState<TableRow[]>([]);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);

  // Workflow state
  const [isPcbFound, setIsPcbFound] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  
  // Validation state
  const [isValidationInProgress, setIsValidationInProgress] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  
  // Debounce ref for analysis validation
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Transform / to \n for display in Validation Result and Consume tab
  const transformedAnalysisText = useMemo(
    () => formData.analysis.replaceAll('/', '\n'),
    [formData.analysis]
  );

  // Load data from localStorage on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Load consumption entries
      const storedConsumption = localStorage.getItem('consumption-entries');
      let loadedConsumptionEntries: ConsumptionEntry[] = [];
      if (storedConsumption) {
        try {
          loadedConsumptionEntries = JSON.parse(storedConsumption);
          setConsumptionEntries(loadedConsumptionEntries);
        } catch (e) {
          console.error('Error loading consumption entries:', e);
        }
      }

      // Load tag entries
      const storedTags = localStorage.getItem('tag-entries');
      let tagEntries: TagEntry[] = [];
      if (storedTags) {
        try {
          tagEntries = JSON.parse(storedTags);
        } catch (e) {
          console.error('Error loading tag entries:', e);
        }
      }

      // Debug log to see what data we have
      console.log('Loaded tag entries:', tagEntries);
      console.log('Loaded consumption entries:', loadedConsumptionEntries);

      // Combine both datasets into unified table data
      const combinedData: TableRow[] = [
        ...tagEntries.map(entry => ({
          id: entry.id,
          srNo: entry.srNo,
          dcNo: entry.dcNo,
          dcDate: entry.dateOfPurchase, // Assuming DC Date is the same as Date of Purchase
          branch: entry.branch,
          bccdName: entry.bccdName,
          productDescription: entry.productDescription,
          productSrNo: entry.productSrNo,
          dateOfPurchase: entry.dateOfPurchase,
          complaintNo: entry.complaintNo,
          partCode: entry.partCode,
          defect: entry.natureOfDefect,
          visitingTechName: entry.visitingTechName,
          mfgMonthYear: entry.mfgMonthYear,
          // Consumption-specific fields will be empty for tag entries
          repairDate: '',
          testing: '',
          failure: '',
          status: '',
          pcbSrNo: entry.pcbSrNo || '',
          rfObservation: '',
          analysis: '',
          validationResult: '',
          componentChange: '',
          enggName: '',
          dispatchDate: '',
        })),
        ...loadedConsumptionEntries.map(entry => ({
          id: entry.id,
          // These fields will be empty as consumption entries don't have tag entry data
          srNo: '',
          dcNo: '',
          dcDate: '',
          branch: '',
          bccdName: '',
          productDescription: '',
          productSrNo: '',
          dateOfPurchase: '',
          complaintNo: '',
          partCode: '',
          defect: '',
          visitingTechName: '',
          mfgMonthYear: '',
          // Consumption-specific fields
          repairDate: entry.repairDate,
          testing: entry.testing,
          failure: entry.failure,
          status: entry.status,
          pcbSrNo: entry.pcbSrNo,
          rfObservation: entry.rfObservation,
          analysis: entry.analysis,
          validationResult: entry.validationResult,
          componentChange: entry.componentChange,
          enggName: entry.enggName,
          dispatchDate: entry.dispatchDate,
          // New fields for consumption validation
          componentConsumption: entry.componentConsumption || '',
          consumptionEntry: entry.consumptionEntry || '',
          consumptionEntryDate: entry.consumptionEntryDate || '',
        }))
      ];

      // Debug log to see combined data
      console.log('Combined table data:', combinedData);
      
      setTableData(combinedData);
    }
  }, []);

  // Save consumption entries to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('consumption-entries', JSON.stringify(consumptionEntries));
    }
    
    // Debug log to see updated consumption entries
    console.log('Updated consumption entries:', consumptionEntries);
    
    // Update tableData when consumptionEntries change
    // Load tag entries from localStorage
    let tagEntries: TagEntry[] = [];
    if (typeof window !== 'undefined') {
      const storedTags = localStorage.getItem('tag-entries');
      if (storedTags) {
        try {
          tagEntries = JSON.parse(storedTags);
        } catch (e) {
          console.error('Error loading tag entries:', e);
        }
      }
    }
    
    // Combine both datasets into unified table data
    const combinedData: TableRow[] = [
      ...tagEntries.map(entry => ({
        id: entry.id,
        srNo: entry.srNo,
        dcNo: entry.dcNo,
        dcDate: entry.dateOfPurchase, // Assuming DC Date is the same as Date of Purchase
        branch: entry.branch,
        bccdName: entry.bccdName,
        productDescription: entry.productDescription,
        productSrNo: entry.productSrNo,
        dateOfPurchase: entry.dateOfPurchase,
        complaintNo: entry.complaintNo,
        partCode: entry.partCode,
        defect: entry.natureOfDefect,
        visitingTechName: entry.visitingTechName,
        mfgMonthYear: entry.mfgMonthYear,
        // Consumption-specific fields will be empty for tag entries
        repairDate: '',
        testing: '',
        failure: '',
        status: '',
        pcbSrNo: entry.pcbSrNo || '',
        rfObservation: '',
        analysis: '',
        validationResult: '',
        componentChange: '',
        enggName: '',
        dispatchDate: '',
      })),
      ...consumptionEntries.map(entry => ({
        id: entry.id,
        // These fields will be empty as consumption entries don't have tag entry data
        srNo: '',
        dcNo: '',
        dcDate: '',
        branch: '',
        bccdName: '',
        productDescription: '',
        productSrNo: '',
        dateOfPurchase: '',
        complaintNo: '',
        partCode: '',
        defect: '',
        visitingTechName: '',
        mfgMonthYear: '',
        // Consumption-specific fields
        repairDate: entry.repairDate,
        testing: entry.testing,
        failure: entry.failure,
        status: entry.status,
        pcbSrNo: entry.pcbSrNo,
        rfObservation: entry.rfObservation,
        analysis: entry.analysis,
        validationResult: entry.validationResult,
        componentChange: entry.componentChange,
        enggName: entry.enggName,
        dispatchDate: entry.dispatchDate,
        // New fields for consumption validation
        componentConsumption: entry.componentConsumption || '',
        consumptionEntry: entry.consumptionEntry || '',
        consumptionEntryDate: entry.consumptionEntryDate || '',
      }))
    ];

    // Debug log to see updated combined data
    console.log('Updated combined table data:', combinedData);
    
    setTableData(combinedData);
  }, [consumptionEntries]);

  const handleFind = async () => {
    // Validate that all search fields are filled
    if (!dcNo || !partCode || !srNo) {
      alert('Please fill in all search fields: DC No, Part Code, and Serial No.');
      return;
    }

    // Validate that the selected part code is valid for the selected DC
    const validPartCodes = dcPartCodes[dcNo] || [];
    if (!validPartCodes.includes(partCode)) {
      alert(`Invalid Part Code for DC ${dcNo}. Please select a valid Part Code.`);
      return;
    }

    setIsSearching(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // In a real implementation, this would call an API to fetch PCB data
    // For now, we'll simulate successful data retrieval
    
    // Auto-populate form with fetched data
    setFormData(prev => ({
      ...prev,
      pcbSrNo: `PCB-${dcNo}-${srNo}`, // Simulated PCB serial number with DC and SR number
      repairDate: new Date().toISOString().split('T')[0], // Today's date
      testing: 'PASS', // Default value
      status: 'OK', // Default value
    }));
    
    setIsPcbFound(true);
    setIsSearching(false);
    
    console.log('PCB found with data:', { dcNo, partCode, srNo });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle analysis change with real-time validation
  const handleAnalysisChange = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Update form data and automatically copy analysis to componentChange
    setFormData(prev => ({
      ...prev,
      [name]: value,
      componentChange: name === 'analysis' ? value : prev.componentChange
    }));

    // Perform real-time validation as user types (with debounce)
    if (name === 'analysis') {
      // Clear any previous validation error
      setValidationError(null);
      
      // Perform validation with part code context
      try {
        const result = await validateConsumption(value, partCode);
        
        if (result.success) {
          setFormData(prev => ({
            ...prev,
            componentConsumption: result.data!.componentConsumption,
            validationResult: result.data!.formattedComponents
          }));
          
          if (!result.data!.isValid) {
            setValidationError(result.data!.errorMessage || 'Some components failed validation');
          }
        } else {
          setValidationError((result as any).error || 'An error occurred during validation');
        }
      } catch (error) {
        console.error('Error during real-time validation:', error);
      }
    }
  };
  const handleConsume = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.repairDate || !formData.testing || !formData.failure || !formData.status) {
      alert('Please fill in all required fields: Repair Date, Testing, Failure, and Status.');
      return;
    }
    
    // Validate consumption against BOM before consuming
    try {
      const validationResult = await validateConsumption(formData.analysis, partCode);
      if (!validationResult.success) {
        alert(`Validation failed: ${(validationResult as any).error || 'Unknown error'}`);
        return;
      }
            
      if (!validationResult.data!.isValid) {
        const confirmResult = confirm(`Validation warning: ${validationResult.data!.errorMessage || 'Some components failed validation'}. Do you want to continue?`);
        if (!confirmResult) {
          return;
        }
      }
    } catch (error) {
      console.error('Error during validation:', error);
      alert('An error occurred during validation');
      return;
    }
          
    // Implementation for consuming data
    console.log('Consuming data:', formData);
    alert('Data consumed successfully!');
  };

  const handleSave = async () => {
    // Validate required fields
    if (!formData.repairDate || !formData.testing || !formData.failure || !formData.status) {
      alert('Please fill in all required fields: Repair Date, Testing, Failure, and Status.');
      return;
    }

    // Validate consumption against BOM before saving
    try {
      const validationResult = await validateConsumption(formData.analysis, partCode);
      if (!validationResult.success) {
        alert(`Validation failed: ${(validationResult as any).error || 'Unknown error'}`);
        return;
      }
      
      if (!validationResult.data!.isValid) {
        const confirmResult = confirm(`Validation warning: ${validationResult.data!.errorMessage || 'Some components failed validation'}. Do you want to continue?`);
        if (!confirmResult) {
          return;
        }
      }
    } catch (error) {
      console.error('Error during validation:', error);
      alert('An error occurred during validation');
      return;
    }

    const newEntry: ConsumptionEntry = {
      ...formData,
      id: Date.now().toString(), // Simple ID generation
    };

    // Save to database
    const saveResult = await saveConsumptionEntry({
      id: newEntry.id!,
      repairDate: newEntry.repairDate,
      testing: newEntry.testing,
      failure: newEntry.failure,
      status: newEntry.status,
      pcbSrNo: newEntry.pcbSrNo,
      rfObservation: newEntry.rfObservation,
      analysis: newEntry.analysis,
      validationResult: newEntry.validationResult,
      componentChange: newEntry.componentChange,
      enggName: newEntry.enggName,
      dispatchDate: newEntry.dispatchDate,
      componentConsumption: newEntry.componentConsumption,
      consumptionEntry: newEntry.consumptionEntry,
      consumptionEntryDate: newEntry.consumptionEntryDate,
    });

    if (saveResult.success) {
      setConsumptionEntries(prev => [...prev, newEntry]);
      alert('Consumption entry saved successfully!');
    } else {
      alert(`Failed to save consumption entry: ${(saveResult as any).error}`);
    }
  };

  const handleUpdate = () => {
    if (!selectedEntryId) {
      alert('Please select an entry to update.');
      return;
    }
    
    // Validate required fields
    if (!formData.repairDate || !formData.testing || !formData.failure || !formData.status) {
      alert('Please fill in all required fields: Repair Date, Testing, Failure, and Status.');
      return;
    }
    
    setConsumptionEntries(prev => 
      prev.map(entry => 
        entry.id === selectedEntryId ? { ...formData, id: selectedEntryId } : entry
      )
    );
    
    alert('Consumption entry updated successfully!');
  };

  const handleDelete = () => {
    if (!selectedEntryId) {
      alert('Please select an entry to delete.');
      return;
    }
    
    if (!confirm('Are you sure you want to delete this entry?')) {
      return;
    }
    
    setConsumptionEntries(prev => prev.filter(entry => entry.id !== selectedEntryId));
    setSelectedEntryId(null);
    handleClearForm();
    alert('Consumption entry deleted successfully!');
  };

  const handleClearForm = () => {
    // Reset form data
    setFormData({
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
      // New fields
      componentConsumption: '',
      consumptionEntry: '',
      consumptionEntryDate: '',
    });
  };

  const handleClear = () => {
    handleClearForm();
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      // In a real app, this would redirect to login page
      alert('Logged out successfully!');
    }
  };

  const handleExportExcel = async () => {
    try {
      // Get tag entries from localStorage
      let tagEntries: TagEntry[] = [];
      const storedTags = localStorage.getItem('tag-entries');
      if (storedTags) {
        try {
          tagEntries = JSON.parse(storedTags);
        } catch (e) {
          console.error('Error loading tag entries:', e);
        }
      }
      
      // Combine consumption and tag entries for export
      const exportData = {
        consumptionEntries,
        tagEntries
      };
      
      // Call API endpoint with POST request
      const response = await fetch('/api/export-consumption-excel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(exportData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate Excel file');
      }
      
      // Get the blob from response
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Consumption_Export_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the URL object
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert(error instanceof Error ? error.message : 'Failed to export Excel file');
    }
  };

  const selectEntry = (entry: ConsumptionEntry) => {
    setFormData({
      repairDate: entry.repairDate,
      testing: entry.testing,
      failure: entry.failure,
      status: entry.status,
      pcbSrNo: entry.pcbSrNo,
      rfObservation: entry.rfObservation,
      analysis: entry.analysis,
      validationResult: entry.validationResult,
      componentChange: entry.componentChange,
      enggName: entry.enggName,
      dispatchDate: entry.dispatchDate,
      // New fields
      componentConsumption: entry.componentConsumption || '',
      consumptionEntry: entry.consumptionEntry || '',
      consumptionEntryDate: entry.consumptionEntryDate || '',
    });
    setSelectedEntryId(entry.id || null);
  };

  
  // Keyboard shortcut handler for Consumption form
  const handleKeyboardShortcut = useCallback((e: KeyboardEvent) => {
    // Only handle Alt key combinations
    if (!e.altKey) return;
    
    // Prevent browser default behavior for these shortcuts
    switch (e.key.toLowerCase()) {
      case 's':
        e.preventDefault();
        if (e.shiftKey) {
          handleSave();
        } else {
          handleConsume(e as unknown as React.FormEvent);
        }
        break;
      case 'u':
        e.preventDefault();
        handleUpdate();
        break;
      case 'd':
        e.preventDefault();
        handleDelete();
        break;
      case 'c':
        e.preventDefault();
        handleClear();
        break;
      case 'l':
        e.preventDefault();
        handleLogout();
        break;
      case 'e':
        e.preventDefault();
        handleExportExcel();
        break;
      default:
        break;
    }
  }, [isSearching, formData, selectedEntryId]);

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
                {(dcPartCodes[dcNo] || []).map((code) => (
                  <option key={code} value={code}>{code}</option>
                ))}
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
          
          <div className="mt-6 flex justify-center">
            <button
              onClick={handleFind}
              disabled={isSearching}
              className={`px-6 py-3 rounded-md font-medium ${
                isSearching
                  ? 'bg-gray-400 cursor-not-allowed text-gray-200'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              {isSearching ? 'Finding...' : 'Find PCB'}
            </button>
          </div>
        </div>

        {/* Consumption Form */}
        <form onSubmit={handleConsume} className="bg-white p-6 rounded-lg shadow-md mb-6">
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
              value={formData.analysis} // Keep original text with / characters
              onChange={handleAnalysisChange}
              rows={3}
              className="w-full p-2 border border-gray-300 rounded"
            />
            {validationError && (
              <div className="text-red-500 text-sm mt-1">{validationError}</div>
            )}
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700">Component Consumption:</label>
            <textarea
              name="componentConsumption"
              value={formData.componentConsumption}
              readOnly
              rows={3}
              className="w-full p-2 border border-gray-300 rounded bg-gray-100"
            />
          </div>          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Validation Result:</label>
            <textarea
              name="validationResult"
              value={transformedAnalysisText} // Use transformed text with \n instead of /
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
          </div>          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 rounded bg-green-500 hover:bg-green-600 text-white"
            >
              Consume (Alt+S)
            </button>
          </div>
        </form>

        {/* Excel-like Grid */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sr No</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DC No</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DC Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">BCCD Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Sr No</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date of Purchase</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Complaint No</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Part Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Defect</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Visiting Tech Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mfg Month/Year</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tableData.map((entry) => (
                  <tr 
                    key={entry.id} 
                    className={`cursor-pointer ${selectedEntryId === entry.id ? 'bg-blue-100' : 'hover:bg-gray-50'}`}
                    onClick={() => {
                      // Debug log to confirm data exists
                      console.log('Row data:', entry);
                      
                      // Populate form with selected entry data
                      setFormData({
                        repairDate: entry.repairDate || '',
                        testing: entry.testing || '',
                        failure: entry.failure || '',
                        status: entry.status || '',
                        pcbSrNo: entry.pcbSrNo || '',
                        rfObservation: entry.rfObservation || '',
                        analysis: entry.analysis || '',
                        validationResult: entry.validationResult || '',
                        componentChange: entry.componentChange || '',
                        enggName: entry.enggName || '',
                        dispatchDate: entry.dispatchDate || '',
                        // New fields - provide default empty values
                        componentConsumption: entry.componentConsumption || '',
                        consumptionEntry: entry.consumptionEntry || '',
                        consumptionEntryDate: entry.consumptionEntryDate || '',
                      });
                      setSelectedEntryId(entry.id || null);
                    }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-medium">{entry.srNo}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{entry.dcNo}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{entry.dcDate}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{entry.branch}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{entry.bccdName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{entry.productDescription}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{entry.productSrNo}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{entry.dateOfPurchase}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{entry.complaintNo}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{entry.partCode}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{entry.defect}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{entry.visitingTechName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{entry.mfgMonthYear}</td>
                  </tr>
                ))}
                {tableData.length === 0 && (
                  <tr>
                    <td colSpan={13} className="px-6 py-4 text-center text-sm text-gray-500">
                      No tag entries found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom Action Buttons */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex space-x-2">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Save (Alt+Shift+S)
            </button>
            <button
              onClick={handleUpdate}
              disabled={!selectedEntryId}
              className={`px-4 py-2 rounded ${
                selectedEntryId 
                  ? 'bg-yellow-500 text-white hover:bg-yellow-600' 
                  : 'bg-gray-400 text-gray-200 cursor-not-allowed'
              }`}
            >
              Update (Alt+U)
            </button>
            <button
              onClick={handleDelete}
              disabled={!selectedEntryId}
              className={`px-4 py-2 rounded ${
                selectedEntryId 
                  ? 'bg-red-500 text-white hover:bg-red-600' 
                  : 'bg-gray-400 text-gray-200 cursor-not-allowed'
              }`}
            >
              Delete (Alt+D)
            </button>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleClear}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Clear (Alt+C)
            </button>
            <button
              onClick={handleExportExcel}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Export Excel (Alt+E)
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              Logout (Alt+L)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

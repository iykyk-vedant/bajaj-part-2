'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useLockStore } from '@/store/lockStore';
import { LockButton } from './LockButton';
import { validateBomComponents, saveConsolidatedData } from '@/app/actions/consumption-actions';
import { getPcbNumberForDc } from '@/lib/pcb-utils';

interface ConsumptionTabProps {
  dcNumbers?: string[];
  dcPartCodes?: Record<string, string[]>;
}

interface ConsumptionEntry {
  id?: string;
  srNo?: string; // Serial No for linking with tag entry
  dcNo?: string; // DC No for linking with tag entry
  partCode?: string; // Part Code for linking with tag entry
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
}

export function ConsumptionTab({ dcNumbers = ['DC001', 'DC002'], dcPartCodes = {} }: ConsumptionTabProps) {
  const { isDcLocked } = useLockStore();
  const router = useRouter();
  
  // State for Find fields
  const [dcNo, setDcNo] = useState('');
  const [partCode, setPartCode] = useState('');
  const [srNo, setSrNo] = useState('');
  
  // Form data state
  const [formData, setFormData] = useState<ConsumptionEntry>({
    repairDate: '',
    testing: '',
    failure: '',
    status: '',
    pcbSrNo: '',
    rfObservation: '',
    analysis: '',
    validationResult: '',
    componentChange: '',
    enggName: '',
    dispatchDate: '',
  });

  // Consumption entries state
  const [consumptionEntries, setConsumptionEntries] = useState<ConsumptionEntry[]>([]);
  
  // Unified table data state
  const [tableData, setTableData] = useState<TableRow[]>([]);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);

  // Workflow state
  const [isPcbFound, setIsPcbFound] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Transform / to \n for display in Validation Result and Consume tab
  const transformedAnalysisText = useMemo(
    () => formData.analysis.replaceAll('/', '\n'),
    [formData.analysis]
  );
  
  // Effect to validate analysis when partCode changes
  useEffect(() => {
    if (formData.analysis) {
      validateBomAnalysis(formData.analysis);
    }
  }, [partCode]);
  
  // Effect to automatically save to database when form data changes (with debounce)
  useEffect(() => {
    // Only save if we have the required search fields
    if (!srNo || !dcNo || !partCode) return;
    
    // Don't save if any required fields are empty
    if (!formData.repairDate || !formData.testing || !formData.failure || !formData.status) return;
    
    // Debounce the save operation
    const timeoutId = setTimeout(async () => {
      try {
        // Get tag entry data to combine with consumption data
        let tagEntryData = {};
        if (typeof window !== 'undefined') {
          const storedTags = localStorage.getItem('tag-entries');
          if (storedTags) {
            try {
              const tagEntries: TagEntry[] = JSON.parse(storedTags);
              const matchingTagEntry = tagEntries.find(entry => entry.srNo === srNo && entry.dcNo === dcNo);
              if (matchingTagEntry) {
                tagEntryData = {
                  srNo: matchingTagEntry.srNo,
                  dcNo: matchingTagEntry.dcNo,
                  dcDate: matchingTagEntry.dateOfPurchase,
                  branch: matchingTagEntry.branch,
                  bccdName: matchingTagEntry.bccdName,
                  productDescription: matchingTagEntry.productDescription,
                  productSrNo: matchingTagEntry.productSrNo,
                  dateOfPurchase: matchingTagEntry.dateOfPurchase,
                  complaintNo: matchingTagEntry.complaintNo,
                  partCode: matchingTagEntry.partCode,
                  defect: matchingTagEntry.natureOfDefect,
                  visitingTechName: matchingTagEntry.visitingTechName,
                  mfgMonthYear: matchingTagEntry.mfgMonthYear,
                  pcbSrNo: matchingTagEntry.pcbSrNo,
                };
              }
            } catch (e) {
              console.error('Error loading tag entries:', e);
            }
          }
        }
        
        // Combine tag entry data with consumption data
        const consolidatedData = {
          ...tagEntryData,
          repairDate: formData.repairDate,
          testing: formData.testing,
          failure: formData.failure,
          status: formData.status,
          pcbSrNo: formData.pcbSrNo,
          rfObservation: formData.rfObservation,
          analysis: formData.analysis,
          validationResult: formData.validationResult,
          componentChange: formData.componentChange,
          enggName: formData.enggName,
          dispatchDate: formData.dispatchDate,
        };
        
        // Save to consolidated data table
        const result = await saveConsolidatedData(consolidatedData);
        if (result.success) {
          console.log('Consolidated data saved automatically');
        } else {
          console.error('Error saving consolidated data automatically:', result.error);
        }
      } catch (error) {
        console.error('Error saving consolidated data automatically:', error);
      }
    }, 2000); // Debounce for 2 seconds
    
    // Cleanup timeout on effect cleanup
    return () => clearTimeout(timeoutId);
  }, [formData, srNo, dcNo, partCode]);

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
        }))
      ];

      setTableData(combinedData);
    }
  }, []);

  // Save consumption entries to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('consumption-entries', JSON.stringify(consumptionEntries));
    }
    
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
      }))
    ];

    setTableData(combinedData);
  }, [consumptionEntries]);

  const handleFind = async () => {
    // Validate that all search fields are filled
    if (!dcNo || !partCode || !srNo) {
      alert('Please fill in all search fields: DC No, Part Code, and Serial No.');
      return;
    }

    setIsSearching(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // In a real implementation, this would call an API to fetch PCB data
    // For now, we'll generate the same PCB number as in TagEntryForm
    
    try {
      // Generate the same PCB number that would be generated in TagEntryForm
      const pcbSrNo = getPcbNumberForDc(dcNo);
      
      // Auto-populate form with fetched data
      setFormData(prev => ({
        ...prev,
        pcbSrNo, // Use the same PCB serial number format as TagEntryForm
        repairDate: new Date().toISOString().split('T')[0], // Today's date
        testing: 'PASS', // Default value
        status: 'OK', // Default value
      }));
      
      setIsPcbFound(true);
    } catch (error) {
      console.error('Error generating PCB number:', error);
      alert('Error generating PCB number. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Special handling for Analysis field - convert / to newlines in validation result
    if (name === 'analysis') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        validationResult: value.replaceAll('/', '\n')
      }));
      
      // Trigger BOM validation
      validateBomAnalysis(value);
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  // Function to validate BOM analysis
  const validateBomAnalysis = async (analysisText: string) => {
    if (!analysisText.trim()) {
      // Clear validation fields if analysis is empty
      setFormData(prev => ({
        ...prev,
        validationResult: '',
        componentChange: ''
      }));
      return;
    }
    
    try {
      const result = await validateBomComponents(analysisText, partCode || undefined);
      
      if (result.success && result.data) {
        // Update validation result and component change fields
        setFormData(prev => ({
          ...prev,
          validationResult: result.data.formattedComponents,
          componentChange: result.data.componentConsumption
        }));
      } else {
        // Handle validation error
        console.error('BOM validation error:', result.error);
        setFormData(prev => ({
          ...prev,
          validationResult: `Error: ${result.error || 'Failed to validate components'}`,
          componentChange: ''
        }));
      }
    } catch (error) {
      console.error('Error validating BOM components:', error);
      setFormData(prev => ({
        ...prev,
        validationResult: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        componentChange: ''
      }));
    }
  };

  const handleConsume = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate that PCB has been found
    if (!isPcbFound) {
      alert('Please find a PCB first before consuming.');
      return;
    }
    
    // Validate required fields
    if (!formData.repairDate || !formData.testing || !formData.failure || !formData.status) {
      alert('Please fill in all required fields: Repair Date, Testing, Failure, and Status.');
      return;
    }
    
    // Save data automatically when consuming
    const newEntry: any = {
      ...formData,
      id: Date.now().toString(), // Simple ID generation
      // Include tag entry information for proper Excel export
      srNo: srNo, // Serial No from the search fields
      dcNo: dcNo, // DC No from the search fields
      partCode: partCode, // Part Code from the search fields
    };
    
    setConsumptionEntries(prev => [...prev, newEntry]);
    
    // Also save to consolidated data table
    try {
      // Get tag entry data to combine with consumption data
      let tagEntryData = {};
      if (typeof window !== 'undefined') {
        const storedTags = localStorage.getItem('tag-entries');
        if (storedTags) {
          try {
            const tagEntries: TagEntry[] = JSON.parse(storedTags);
            const matchingTagEntry = tagEntries.find(entry => entry.srNo === srNo && entry.dcNo === dcNo);
            if (matchingTagEntry) {
              tagEntryData = {
                srNo: matchingTagEntry.srNo,
                dcNo: matchingTagEntry.dcNo,
                dcDate: matchingTagEntry.dateOfPurchase,
                branch: matchingTagEntry.branch,
                bccdName: matchingTagEntry.bccdName,
                productDescription: matchingTagEntry.productDescription,
                productSrNo: matchingTagEntry.productSrNo,
                dateOfPurchase: matchingTagEntry.dateOfPurchase,
                complaintNo: matchingTagEntry.complaintNo,
                partCode: matchingTagEntry.partCode,
                defect: matchingTagEntry.natureOfDefect,
                visitingTechName: matchingTagEntry.visitingTechName,
                mfgMonthYear: matchingTagEntry.mfgMonthYear,
                pcbSrNo: matchingTagEntry.pcbSrNo,
              };
            }
          } catch (e) {
            console.error('Error loading tag entries:', e);
          }
        }
      }
      
      // Combine tag entry data with consumption data
      const consolidatedData = {
        ...tagEntryData,
        repairDate: formData.repairDate,
        testing: formData.testing,
        failure: formData.failure,
        status: formData.status,
        pcbSrNo: formData.pcbSrNo,
        rfObservation: formData.rfObservation,
        analysis: formData.analysis,
        validationResult: formData.validationResult,
        componentChange: formData.componentChange,
        enggName: formData.enggName,
        dispatchDate: formData.dispatchDate,
      };
      
      // Save to consolidated data table
      const result = await saveConsolidatedData(consolidatedData);
      if (result.success) {
        console.log('Consolidated data saved successfully');
      } else {
        console.error('Error saving consolidated data:', result.error);
      }
      
      // Implementation for consuming data
      alert('Data consumed and saved successfully!');
    } catch (error) {
      console.error('Error saving data:', error);
      alert('Data consumed but there was an error saving to database.');
    }
  };



  const handleUpdate = useCallback(async () => {
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
        entry.id === selectedEntryId ? { ...formData, id: selectedEntryId, srNo: srNo, dcNo: dcNo, partCode: partCode } : entry
      )
    );
    
    // Also update consolidated data table
    try {
      // Get tag entry data to combine with consumption data
      let tagEntryData = {};
      if (typeof window !== 'undefined') {
        const storedTags = localStorage.getItem('tag-entries');
        if (storedTags) {
          try {
            const tagEntries: TagEntry[] = JSON.parse(storedTags);
            const matchingTagEntry = tagEntries.find(entry => entry.srNo === srNo && entry.dcNo === dcNo);
            if (matchingTagEntry) {
              tagEntryData = {
                srNo: matchingTagEntry.srNo,
                dcNo: matchingTagEntry.dcNo,
                dcDate: matchingTagEntry.dateOfPurchase,
                branch: matchingTagEntry.branch,
                bccdName: matchingTagEntry.bccdName,
                productDescription: matchingTagEntry.productDescription,
                productSrNo: matchingTagEntry.productSrNo,
                dateOfPurchase: matchingTagEntry.dateOfPurchase,
                complaintNo: matchingTagEntry.complaintNo,
                partCode: matchingTagEntry.partCode,
                defect: matchingTagEntry.natureOfDefect,
                visitingTechName: matchingTagEntry.visitingTechName,
                mfgMonthYear: matchingTagEntry.mfgMonthYear,
                pcbSrNo: matchingTagEntry.pcbSrNo,
              };
            }
          } catch (e) {
            console.error('Error loading tag entries:', e);
          }
        }
      }
      
      // Combine tag entry data with consumption data
      const consolidatedData = {
        ...tagEntryData,
        repairDate: formData.repairDate,
        testing: formData.testing,
        failure: formData.failure,
        status: formData.status,
        pcbSrNo: formData.pcbSrNo,
        rfObservation: formData.rfObservation,
        analysis: formData.analysis,
        validationResult: formData.validationResult,
        componentChange: formData.componentChange,
        enggName: formData.enggName,
        dispatchDate: formData.dispatchDate,
      };
      
      // Save to consolidated data table (this will create a new entry since we don't have an update function)
      const result = await saveConsolidatedData(consolidatedData);
      if (result.success) {
        console.log('Consolidated data updated successfully');
      } else {
        console.error('Error updating consolidated data:', result.error);
      }
    } catch (error) {
      console.error('Error updating consolidated data:', error);
    }
    
    alert('Consumption entry updated successfully!');
  }, [selectedEntryId, formData, srNo, dcNo, partCode]);

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
      pcbSrNo: '',
      rfObservation: '',
      analysis: '',
      validationResult: '',
      componentChange: '',
      enggName: '',
      dispatchDate: '',
    });
    
    // Reset workflow state
    setIsPcbFound(false);
    setDcNo('');
    setPartCode('');
    setSrNo('');
  };

  const handleClear = () => {
    handleClearForm();
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      // In a real app, this would redirect to login page
      router.push('/');
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
    });
    setSelectedEntryId(entry.id || null);
    // Set the search fields if they exist in the entry
    if (entry.srNo) setSrNo(entry.srNo);
    if (entry.dcNo) setDcNo(entry.dcNo);
    if (entry.partCode) setPartCode(entry.partCode);
  };

  // Keyboard shortcut handler for Consumption form
  const handleKeyboardShortcut = useCallback((e: KeyboardEvent) => {
    // Only handle Alt key combinations
    if (!e.altKey) return;
    
    // Prevent browser default behavior for these shortcuts
    switch (e.key.toLowerCase()) {
      case 's':
        e.preventDefault();
        handleConsume(e as unknown as React.FormEvent);
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
  }, [isSearching, isPcbFound, formData, selectedEntryId, handleUpdate]);

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
    <div className="bg-white w-full h-full flex flex-col">
      <div className="p-4 h-full flex flex-col">
        {/* Find Section - Moved to the top */}
        <div className="bg-white p-4 rounded-md shadow-sm mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">DC No.</label>
              <div className="flex gap-2">
                <select
                  value={isDcLocked ? useLockStore.getState().lockedDcNo : dcNo}
                  onChange={(e) => setDcNo(e.target.value)}
                  className={`flex-1 p-2 text-sm border border-gray-300 rounded ${isDcLocked || isPcbFound ? 'bg-gray-100' : ''} h-10`}
                  disabled={isDcLocked || isPcbFound}
                >
                  <option value="">Select DC</option>
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
                className={`w-full p-2 text-sm border border-gray-300 rounded ${isDcLocked || isPcbFound ? 'bg-gray-100' : ''} h-10`}
                disabled={isDcLocked || isPcbFound}
              >
                <option value="">Select Part</option>
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
                className={`w-full p-2 text-sm border border-gray-300 rounded ${isPcbFound ? 'bg-gray-100' : ''} h-10`}
                placeholder="Enter Serial No."
                disabled={isPcbFound}
              />
            </div>
          </div>
          
          <div className="mt-3 flex justify-center">
            <button
              onClick={handleFind}
              disabled={isSearching || isPcbFound}
              className={`px-4 py-2 text-sm rounded ${
                isSearching || isPcbFound
                  ? 'bg-gray-400 cursor-not-allowed text-gray-200'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              {isSearching ? 'Finding...' : 'Find PCB'}
            </button>
          </div>
        </div>

        {/* Consumption Form */}
        <form onSubmit={handleConsume} className="bg-white p-4 rounded-md shadow-sm mb-4 flex-1 flex flex-col">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Repair Date:</label>
              <input
                type="date"
                name="repairDate"
                value={formData.repairDate}
                onChange={handleChange}
                className="w-full p-2 text-sm border border-gray-300 rounded h-10"
                disabled={!isPcbFound}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Testing:</label>
              <select
                name="testing"
                value={formData.testing}
                onChange={handleChange}
                className="w-full p-2 text-sm border border-gray-300 rounded h-10"
                disabled={!isPcbFound}
              >
                <option value="">Select</option>
                <option value="PASS">PASS</option>
                <option value="FAIL">FAIL</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Failure:</label>
              <select
                name="failure"
                value={formData.failure}
                onChange={handleChange}
                className="w-full p-2 text-sm border border-gray-300 rounded h-10"
                disabled={!isPcbFound}
              >
                <option value="">Select</option>
                <option value="Component">Component</option>
                <option value="Soldering">Soldering</option>
                <option value="Design">Design</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status:</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full p-2 text-sm border border-gray-300 rounded h-10"
                disabled={!isPcbFound}
              >
                <option value="">Select</option>
                <option value="OK">OK</option>
                <option value="NFF">NFF</option>
                <option value="SCRAP">SCRAP</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">PCB Sr No:</label>
              <div className="p-2 text-sm border border-gray-300 rounded bg-gray-100 font-mono truncate h-10 flex items-center">
                {formData.pcbSrNo}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Engg Name:</label>
              <select
                name="enggName"
                value={formData.enggName}
                onChange={handleChange}
                className="w-full p-2 text-sm border border-gray-300 rounded h-10"
                disabled={!isPcbFound}
              >
                <option value="">Select</option>
                <option value="Engineer 1">Engineer 1</option>
                <option value="Engineer 2">Engineer 2</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">RF Observation:</label>
              <input
                type="text"
                name="rfObservation"
                value={formData.rfObservation}
                onChange={handleChange}
                className="w-full p-2 text-sm border border-gray-300 rounded h-10"
                disabled={!isPcbFound}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Dispatch Date:</label>
              <input
                type="date"
                name="dispatchDate"
                value={formData.dispatchDate}
                onChange={handleChange}
                className="w-full p-2 text-sm border border-gray-300 rounded h-10"
                disabled={!isPcbFound}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Analysis:</label>
              <textarea
                name="analysis"
                value={formData.analysis} // Keep original text with / characters
                onChange={handleChange}
                rows={3}
                className="w-full p-2 text-sm border border-gray-300 rounded"
                disabled={!isPcbFound}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Validation Result:</label>
              <textarea
                name="validationResult"
                value={transformedAnalysisText} // Use transformed text with \n instead of /
                readOnly
                rows={3}
                className="w-full p-2 text-sm border border-gray-300 rounded bg-gray-100"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Component Change:</label>
            <textarea
              name="componentChange"
              value={formData.componentChange}
              onChange={handleChange}
              rows={3}
              className="w-full p-2 text-sm border border-gray-300 rounded"
              disabled={!isPcbFound}
            />
          </div>

          <div className="flex justify-end space-x-3 mt-auto">
            <button
              type="button"
              onClick={handleClear}
              className="px-4 py-2 text-sm bg-gray-500 hover:bg-gray-600 text-white rounded"
            >
              Clear
            </button>
            <button
              type="submit"
              disabled={!isPcbFound}
              className={`px-4 py-2 text-sm rounded ${
                isPcbFound
                  ? 'bg-green-500 hover:bg-green-600 text-white'
                  : 'bg-gray-400 cursor-not-allowed text-gray-200'
              }`}
            >
              Consume
            </button>
          </div>
        </form>

        {/* Excel-like Grid */}
        <div className="bg-white p-4 rounded-md shadow-sm mb-4 flex-1 overflow-hidden flex flex-col">
          <div className="overflow-x-auto flex-1">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Sr No</th>
                  <th className="px-3 py-2 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">DC No</th>
                  <th className="px-3 py-2 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">DC Date</th>
                  <th className="px-3 py-2 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Branch</th>
                  <th className="px-3 py-2 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">BCCD Name</th>
                  <th className="px-3 py-2 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Product Desc</th>
                  <th className="px-3 py-2 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Product Sr No</th>
                  <th className="px-3 py-2 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Date of Purchase</th>
                  <th className="px-3 py-2 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Complaint No</th>
                  <th className="px-3 py-2 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Part Code</th>
                  <th className="px-3 py-2 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Defect</th>
                  <th className="px-3 py-2 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Visiting Tech</th>
                  <th className="px-3 py-2 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Mfg Month/Year</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tableData.map((entry) => (
                  <tr 
                    key={entry.id} 
                    className={`cursor-pointer ${selectedEntryId === entry.id ? 'bg-blue-100' : 'hover:bg-gray-50'}`}
                    onClick={() => {
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
                      });
                      setSelectedEntryId(entry.id || null);
                    }}
                  >
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-800 font-medium">{entry.srNo}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-800">{entry.dcNo}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-800">{entry.dcDate}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-800">{entry.branch}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-800">{entry.bccdName}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-800">{entry.productDescription}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-800">{entry.productSrNo}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-800">{entry.dateOfPurchase}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-800">{entry.complaintNo}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-800">{entry.partCode}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-800">{entry.defect}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-800">{entry.visitingTechName}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-800">{entry.mfgMonthYear}</td>
                  </tr>
                ))}
                {tableData.length === 0 && (
                  <tr>
                    <td colSpan={13} className="px-3 py-2 text-center text-sm text-gray-500">
                      No tag entries found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom Action Buttons */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex space-x-2">
            <button
              onClick={handleUpdate}
              disabled={!selectedEntryId}
              className={`px-4 py-2 text-sm rounded ${
                selectedEntryId 
                  ? 'bg-yellow-500 text-white hover:bg-yellow-600' 
                  : 'bg-gray-400 text-gray-200 cursor-not-allowed'
              }`}
            >
              Update
            </button>
            <button
              onClick={handleDelete}
              disabled={!selectedEntryId}
              className={`px-4 py-2 text-sm rounded ${
                selectedEntryId 
                  ? 'bg-red-500 text-white hover:bg-red-600' 
                  : 'bg-gray-400 text-gray-200 cursor-not-allowed'
              }`}
            >
              Delete
            </button>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleClear}
              className="px-4 py-2 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Clear
            </button>
            <button
              onClick={handleExportExcel}
              className="px-4 py-2 text-sm bg-green-500 text-white rounded hover:bg-green-600"
            >
              Export Excel
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
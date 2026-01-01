
'use client';

import { useState, useEffect, useCallback } from 'react';
import { TagEntry } from '@/lib/tag-entry/types';
import { useLockStore } from '@/store/lockStore';
import { LockButton } from './LockButton';
import { spareParts } from '@/lib/spare-parts';
import { generatePcbNumber, getMonthCode } from '@/lib/pcb-utils';
import { tagEntryEventEmitter, TAG_ENTRY_EVENTS } from '@/lib/event-emitter';

// Dialog components for DC creation modal
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';

interface TagEntryFormProps {
  initialData?: any;
  dcNumbers?: string[];
  dcPartCodes?: Record<string, string[]>;
  onAddDcNumber?: (dcNo: string, partCode: string) => Promise<void>;
}

const STORAGE_KEY = 'tag-entries';

export function TagEntryForm({ initialData, dcNumbers = [], dcPartCodes = {}, onAddDcNumber }: TagEntryFormProps) {
  const { isDcLocked } = useLockStore();
  const [savedEntries, setSavedEntries] = useState<TagEntry[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showSavedList, setShowSavedList] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // State for DC creation modal
  const [isDcModalOpen, setIsDcModalOpen] = useState(false);
  const [newDcNo, setNewDcNo] = useState('');
  const [newPartCode, setNewPartCode] = useState('');

  const STORAGE_KEY = 'tag-entries';

  const [formData, setFormData] = useState<TagEntry>({
    id: '',
    srNo: '001',
    dcNo: '',
    dcDate: '',
    branch: '',
    bccdName: '',
    productDescription: '',
    productSrNo: '',
    dateOfPurchase: '',
    complaintNo: '',
    partCode: '',
    natureOfDefect: '',
    visitingTechName: '',
    mfgMonthYear: '',
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

  // Load saved entries from database on component mount
  useEffect(() => {
    const loadSavedEntries = async () => {
      try {
        const { getConsolidatedDataEntries } = await import('@/app/actions/consumption-actions');
        const result = await getConsolidatedDataEntries();

        if (result.success) {
          const entries = result.data || [];
          // Convert consolidated data to TagEntry format
          const tagEntries = entries.map((entry: any) => ({
            id: entry.id || entry.sr_no,
            srNo: entry.sr_no || '',
            dcNo: entry.dc_no || '',
            branch: entry.branch || '',
            bccdName: entry.bccd_name || '',
            productDescription: entry.product_description || '',
            productSrNo: entry.product_sr_no || '',
            dateOfPurchase: entry.date_of_purchase || '',
            complaintNo: entry.complaint_no || '',
            partCode: entry.part_code || '',
            natureOfDefect: entry.nature_of_defect || '',
            visitingTechName: entry.visiting_tech_name || '',
            mfgMonthYear: entry.mfg_month_year || '',
            pcbSrNo: entry.pcb_sr_no || '',
          }));

          setSavedEntries(tagEntries);

          // Update serial number if there are existing entries
          // For initial load, we'll set it to 1, then it will be updated when DC is selected
          setFormData(prev => ({
            ...prev,
            srNo: '001'
          }));
        }
      } catch (e) {
        console.error('Error loading entries from database:', e);
      }
    };

    loadSavedEntries();
  }, []);

  // Populate form with initial data when it changes (from image extraction)
  useEffect(() => {
    if (initialData) {

      // Convert mfgMonthYear from YYYY-MM to MM/YYYY format if needed
      let mfgMonthYear = initialData.mfgMonthYear || '';
      if (mfgMonthYear && mfgMonthYear.includes('-')) {
        const [year, month] = mfgMonthYear.split('-');
        mfgMonthYear = `${month}/${year}`;
      }

      setFormData(prev => {
        // Calculate next sequential serial number for the selected DC
        const dcNo = initialData.dcNo || prev.dcNo;
        let newSrNo = prev.srNo; // Default to current srNo

        if (dcNo) {
          // Find entries with the same DC number
          const dcEntries = savedEntries.filter(entry => entry.dcNo === dcNo);

          // Calculate next sequential number (1, 2, 3, ...)
          const nextSrNo = dcEntries.length > 0
            ? Math.max(...dcEntries.map(e => parseInt(e.srNo) || 0)) + 1
            : 1;

          newSrNo = String(nextSrNo).padStart(3, '0');
        }

        const newFormData = {
          id: initialData.id || prev.id,
          srNo: newSrNo, // Automatically increment serial number
          dcNo: initialData.dcNo || prev.dcNo,
          branch: initialData.branch || prev.branch,
          bccdName: initialData.bccdName || prev.bccdName,
          // Don't override productDescription if partCode is already set
          productDescription: (prev.partCode || initialData.sparePartCode) ? prev.productDescription : (initialData.productDescription || prev.productDescription),
          productSrNo: initialData.productSrNo || prev.productSrNo,
          dateOfPurchase: initialData.dateOfPurchase || prev.dateOfPurchase,
          complaintNo: initialData.complaintNo || prev.complaintNo,
          partCode: initialData.sparePartCode || prev.partCode,
          natureOfDefect: initialData.natureOfDefect || prev.natureOfDefect,
          visitingTechName: initialData.technicianName || prev.visitingTechName,
          mfgMonthYear: mfgMonthYear || prev.mfgMonthYear,
          pcbSrNo: initialData.pcbSrNo || prev.pcbSrNo,
        };

        return newFormData;
      });
    }
  }, [initialData, savedEntries]);

  // Auto-generate PCB serial number when DC number or SR number changes
  // Only generate if DC number exists
  useEffect(() => {

    if (formData.dcNo && formData.srNo) {
      try {
        const pcb = generatePcbNumber(formData.dcNo, formData.srNo);

        setFormData(prev => ({
          ...prev,
          pcbSrNo: pcb,
        }));
      } catch (err) {
        console.error('Failed to generate PCB number:', err);
      }
    }
  }, [formData.dcNo, formData.srNo]);

  // Auto-populate product description when part code is selected
  useEffect(() => {
    if (formData.partCode) {
      const part = spareParts.find(p => p.code === formData.partCode);
      if (part && formData.productDescription !== part.description) {
        setFormData(prev => ({
          ...prev,
          productDescription: part.description
        }));
      }
    }
  }, [formData.partCode]);

  // Update serial number when DC number changes
  // Calculate next sequential number for the selected DC
  useEffect(() => {
    if (formData.dcNo && !isDcLocked) { // Only update when not locked
      // Find entries with the same DC number
      const dcEntries = savedEntries.filter(entry => entry.dcNo === formData.dcNo);

      // Calculate next sequential number (1, 2, 3, ...)
      const nextSrNo = dcEntries.length > 0
        ? Math.max(...dcEntries.map(e => parseInt(e.srNo) || 0)) + 1
        : 1;

      setFormData(prev => ({
        ...prev,
        srNo: String(nextSrNo).padStart(3, '0')
      }));
    } else if (isDcLocked) {
      // If locked, set DC No to the locked value but preserve SR No
      setFormData(prev => ({
        ...prev,
        dcNo: useLockStore.getState().lockedDcNo
      }));
    } else {
      // If no DC is selected, reset to 001
      setFormData(prev => ({
        ...prev,
        srNo: '001'
      }));
    }
  }, [formData.dcNo, savedEntries, isDcLocked]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
  
  
    // Handle mfgMonthYear field specially to validate and format MM/YYYY
    if (name === 'mfgMonthYear') {
      // Allow only digits and forward slash
      if (!/^[0-9/]*$/.test(value) && value !== '') {
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
    }
    // Handle dateOfPurchase field to validate and format date
    else if (name === 'dateOfPurchase') {
      // Allow only digits, forward slashes, and hyphens
      if (!/^[0-9/-]*$/.test(value) && value !== '') {
        return; // Don't update if invalid characters
      }
  
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    } else {
      // Update locked values if lock is active and we're changing DC No or Part Code
      // But prevent changes to locked fields
      if (isDcLocked && (name === 'dcNo' || name === 'partCode')) {
        // Don't update locked fields, keep the locked values
        return;
      }
        
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
        
      // If SR No is changed, update PCB Sr No accordingly
      if (name === 'srNo') {
        if (formData.dcNo) {
          const pcb = generatePcbNumber(formData.dcNo, value);
          setFormData(prev => ({
            ...prev,
            pcbSrNo: pcb
          }));
        }
      }
    }
  };

  const handleSrNoIncrement = () => {
    const currentSrNo = parseInt(formData.srNo || '0');
    if (!isNaN(currentSrNo)) {
      const newSrNo = currentSrNo + 1;
      setFormData(prev => ({
        ...prev,
        srNo: String(newSrNo).padStart(3, '0')
      }));
    }
  };

  const handleSrNoDecrement = () => {
    const currentSrNo = parseInt(formData.srNo || '0');
    if (!isNaN(currentSrNo) && currentSrNo > 1) { // Prevent going below 1
      const newSrNo = currentSrNo - 1;
      setFormData(prev => ({
        ...prev,
        srNo: String(newSrNo).padStart(3, '0')
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

    // Validate Date of Purchase format if provided
    if (formData.dateOfPurchase) {
      // Allow formats like DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD
      const dateRegex = /^(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}-\d{1,2}-\d{1,2})$/;
      if (!dateRegex.test(formData.dateOfPurchase)) {
        alert('Date of Purchase must be in a valid format (e.g., DD/MM/YYYY, MM/DD/YYYY, or YYYY-MM-DD)');
        return;
      }
    }

    const entryToSave: TagEntry = {
      id: formData.id || Date.now().toString(),
      srNo: formData.srNo || '001',
      dcNo: formData.dcNo || '',
      branch: formData.branch || 'Mumbai',
      bccdName: formData.bccdName || '',
      productDescription: formData.productDescription || '',
      productSrNo: formData.productSrNo || '',
      dateOfPurchase: formData.dateOfPurchase || '',
      complaintNo: formData.complaintNo || '',
      partCode: formData.partCode || '',
      natureOfDefect: formData.natureOfDefect || '',
      visitingTechName: formData.visitingTechName || '',
      mfgMonthYear: formData.mfgMonthYear || '',
      pcbSrNo: formData.pcbSrNo || '',
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

    // Save to database
    const saveToDatabase = async () => {
      try {
        const { saveConsolidatedData, getConsolidatedDataEntries, updateConsolidatedDataEntryAction } = await import('@/app/actions/consumption-actions');
        
        // Check if an entry with the same srNo, dcNo, and partCode already exists
        const result = await getConsolidatedDataEntries();
        
        if (result.success) {
          const allEntries = result.data || [];
          // Find an entry with matching srNo, dcNo, and partCode
          const existingEntry = allEntries.find((entry: any) => 
            entry.sr_no === entryToSave.srNo && entry.dc_no === entryToSave.dcNo && entry.part_code === entryToSave.partCode
          );
          
          if (existingEntry) {
            // Update the existing entry
            const updateResult = await updateConsolidatedDataEntryAction(existingEntry.id, {
              ...entryToSave,
              // Map natureOfDefect to defect for consolidated table
              defect: entryToSave.natureOfDefect,
              // Initialize consumption-specific fields as empty
              repairDate: '',
              testing: '',
              failure: '',
              status: '',
              rfObservation: '',
              analysis: '',
              validationResult: '',
              componentChange: '',
              enggName: '',
              dispatchDate: '',
            });
            
            if (!updateResult.success) {
              console.error('Failed to update entry in database:', updateResult.error);
            }
          } else {
            // No existing entry found, save as new
            const consolidatedData = {
              ...entryToSave,
              // Map natureOfDefect to defect for consolidated table
              defect: entryToSave.natureOfDefect,
              // Initialize consumption-specific fields as empty
              repairDate: '',
              testing: '',
              failure: '',
              status: '',
              rfObservation: '',
              analysis: '',
              validationResult: '',
              componentChange: '',
              enggName: '',
              dispatchDate: '',
            };
            const saveResult = await saveConsolidatedData(consolidatedData);
            
            if (!saveResult.success) {
              console.error('Failed to save entry to database:', saveResult.error);
            }
          }
        } else {
          // If we can't fetch existing entries, save as new
          const consolidatedData = {
            ...entryToSave,
            // Map natureOfDefect to defect for consolidated table
            defect: entryToSave.natureOfDefect,
            // Initialize consumption-specific fields as empty
            repairDate: '',
            testing: '',
            failure: '',
            status: '',
            rfObservation: '',
            analysis: '',
            validationResult: '',
            componentChange: '',
            enggName: '',
            dispatchDate: '',
          };
          const saveResult = await saveConsolidatedData(consolidatedData);
          
          if (!saveResult.success) {
            console.error('Failed to save entry to database:', saveResult.error);
          }
        }
      } catch (e) {
        console.error('Error saving entry to database:', e);
      }
    };

    saveToDatabase();

    // Reset form after save
    handleClear();
    // Show saved list after save
    setShowSavedList(true);
    setShowSearchResults(false);

    // Emit event to notify other components that an entry was saved
    tagEntryEventEmitter.emit(TAG_ENTRY_EVENTS.ENTRY_SAVED, entryToSave);
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

    // Remove from database
    const deleteFromDatabase = async () => {
      if (formData.id) {
        try {
          const { deleteConsolidatedDataEntryAction } = await import('@/app/actions/consumption-actions');
          const result = await deleteConsolidatedDataEntryAction(String(formData.id));

          if (!result.success) {
            console.error('Failed to delete entry from database:', result.error);
          }
        } catch (e) {
          console.error('Error deleting entry from database:', e);
        }
      }
    };

    deleteFromDatabase();

    alert('Entry deleted successfully!');
    handleClear();

    // Emit event to notify other components that an entry was deleted
    tagEntryEventEmitter.emit(TAG_ENTRY_EVENTS.ENTRY_DELETED, formData.id);
  };

  const handleClear = () => {
    setFormData({
      id: '',
      srNo: '001',
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
      pcbSrNo: '',
    });
    setShowSearchResults(false);
    setShowSavedList(false);
    setSearchQuery('');
  };

  const handleCreateDC = async () => {
    if (newDcNo.trim()) {
      try {
        // Call the server action to add DC number to database
        const { addDcNumberAction } = await import('@/app/actions/db-actions');
        const result = await addDcNumberAction(newDcNo.trim(), newPartCode.trim(), dcNumbers, dcPartCodes);
        
        if (result.success) {
          setNewDcNo('');
          setNewPartCode('');
          setIsDcModalOpen(false);
          
          // Show success message
          alert(`DC Number "${newDcNo.trim()}" with Part Code "${newPartCode.trim()}" has been created successfully!`);
          
          // Optionally, update the form to use the new DC number
          setFormData(prev => ({
            ...prev,
            dcNo: newDcNo.trim()
          }));
          
          // Call the callback if provided
          if (onAddDcNumber) {
            try {
              await onAddDcNumber(newDcNo.trim(), newPartCode.trim());
            } catch (callbackError) {
              console.error('Error in onAddDcNumber callback:', callbackError);
            }
          }
          
          // Reload DC numbers and part codes from the database to reflect the changes
          const { loadDcNumbersFromDb, loadDcPartCodesFromDb } = await import('@/lib/dc-data-sync');
          const updatedDcNumbers = await loadDcNumbersFromDb();
          const updatedDcPartCodes = await loadDcPartCodesFromDb();
          
          // Update parent component's state by calling a callback if provided
          window.dispatchEvent(new CustomEvent('refreshDcNumbers', { 
            detail: { dcNumbers: updatedDcNumbers, dcPartCodes: updatedDcPartCodes } 
          }));
        } else {
          alert(`Error creating DC Number: ${result.error}`);
        }
      } catch (error) {
        console.error('Error creating DC Number:', error);
        alert('Error creating DC Number. Please try again.');
      }
    } else {
      alert('Please enter a DC Number');
    }
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
    <form onSubmit={handleSubmit} className="bg-white rounded-md shadow-sm flex flex-col flex-1 min-h-0">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-sm font-medium text-gray-700">Sr. No.:</label>
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
            value={formData.srNo || ''}
            onChange={handleChange}
            className="w-full p-2 text-sm border border-gray-300 rounded h-9" />
        </div>
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-sm font-medium text-gray-700">DC No:</label>
            <div className="flex items-center gap-2">
              <Dialog open={isDcModalOpen} onOpenChange={setIsDcModalOpen}>
                <DialogTrigger asChild>
                  <button
                    type="button"
                    className="text-gray-700 hover:text-gray-900"
                  >
                    +
                  </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create New DC</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">DC No.</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={isDcLocked ? useLockStore.getState().lockedDcNo : newDcNo}
                          onChange={(e) => setNewDcNo(e.target.value)}
                          disabled={isDcLocked}
                          className={`flex-1 p-2 border border-gray-300 rounded ${isDcLocked ? 'bg-gray-100' : ''}`}
                          placeholder="Enter DC No." />
                        <LockButton dcNo={newDcNo} partCode={newPartCode} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Part Code</label>
                      <input
                        type="text"
                        value={isDcLocked ? useLockStore.getState().lockedPartCode : newPartCode}
                        onChange={(e) => setNewPartCode(e.target.value)}
                        disabled={isDcLocked}
                        className={`w-full p-2 border border-gray-300 rounded ${isDcLocked ? 'bg-gray-100' : ''}`}
                        placeholder="Enter Part Code" />
                    </div>
                  </div>
                  <DialogFooter>
                    <button
                      onClick={handleCreateDC}
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded"
                    >
                      Create DC
                    </button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <button
                type="button"
                className="text-gray-700 hover:text-gray-900"
                onClick={() => {
                  if (formData.dcNo) {
                    navigator.clipboard.writeText(formData.dcNo);
                    alert('DC Number copied to clipboard!');
                  }
                } }
                title="Copy DC Number"
              >
                📋
              </button>
              <LockButton dcNo={formData.dcNo} partCode={formData.partCode} />
            </div>
          </div>
        </div>
        <select
          name="dcNo"
          value={isDcLocked ? useLockStore.getState().lockedDcNo : (formData.dcNo || '')}
          onChange={handleChange}
          disabled={isDcLocked}
          className={`w-full p-2 text-sm border border-gray-300 rounded ${isDcLocked ? 'bg-gray-100' : ''} h-9`}
        >
          <option value="">Select DC No.</option>
          {dcNumbers
            .filter(dc => dc != null && dc !== '')
            .map((dc, index) => (
              <option key={`${dc}-${index}`} value={dc}>{dc}</option>
            ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Branch:</label>
        <input
          type="text"
          name="branch"
          value={formData.branch || ''}
          onChange={handleChange}
          className="w-full p-2 text-sm border border-gray-300 rounded h-9" />
      </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">BCCD Name:</label>
        <input
          type="text"
          name="bccdName"
          value={formData.bccdName || ''}
          onChange={handleChange}
          className="w-full p-2 text-sm border border-gray-300 rounded h-9" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Product Description:</label>
        <input
          type="text"
          name="productDescription"
          value={formData.productDescription || ''}
          onChange={handleChange}
          className={`w-full p-2 text-sm border border-gray-300 rounded h-9 ${formData.partCode ? 'bg-gray-100' : ''}`}
          readOnly={!!formData.partCode} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Product Sr No:</label>
        <div className="flex">
          <input
            type="text"
            name="productSrNo"
            value={formData.productSrNo || ''}
            onChange={handleChange}
            className="flex-1 p-2 text-sm border border-gray-300 rounded-l h-9" />
          <div className="bg-gray-200 p-2 text-sm border border-l-0 border-gray-300 rounded-r flex items-center">
            {(formData.productSrNo || '').length}/20
          </div>
        </div>
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Date of Purchase:</label>
        <input
          type="text"
          name="dateOfPurchase"
          value={formData.dateOfPurchase || ''}
          onChange={handleChange}
          placeholder="DD/MM/YYYY or MM/DD/YYYY"
          className="w-full p-2 text-sm border border-gray-300 rounded h-9" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Complaint No:</label>
        <input
          type="text"
          name="complaintNo"
          value={formData.complaintNo || ''}
          onChange={handleChange}
          className="w-full p-2 text-sm border border-gray-300 rounded h-9" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Part Code:</label>
        <select
          name="partCode"
          value={isDcLocked ? useLockStore.getState().lockedPartCode : (formData.partCode || '')}
          onChange={handleChange}
          disabled={isDcLocked}
          className={`w-full p-2 text-sm border border-gray-300 rounded ${isDcLocked ? 'bg-gray-100' : ''} h-9`}
        >
          <option value="">Select Part Code</option>
          {(dcPartCodes[isDcLocked ? useLockStore.getState().lockedDcNo : formData.dcNo] || [])
            .filter(code => code != null && code !== '')
            .map((code, index) => (
              <option key={`${code}-${index}`} value={code}>{code}</option>
            ))}
        </select>
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nature of Defect:</label>
        <input
          type="text"
          name="natureOfDefect"
          value={formData.natureOfDefect || ''}
          onChange={handleChange}
          className="w-full p-2 text-sm border border-gray-300 rounded h-9" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Visiting Tech Name:</label>
        <input
          type="text"
          name="visitingTechName"
          value={formData.visitingTechName || ''}
          onChange={handleChange}
          className="w-full p-2 text-sm border border-gray-300 rounded h-9" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Mfg Month/Year:</label>
        <input
          type="text"
          name="mfgMonthYear"
          value={formData.mfgMonthYear || ''}
          onChange={handleChange}
          placeholder="MM/YYYY"
          className="w-full p-2 text-sm border border-gray-300 rounded h-9"
          maxLength={7} />
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-1">PCB Sr. No:</label>
        <div className="flex">
          <input
            type="text"
            name="pcbSrNo"
            value={formData.pcbSrNo || ''}
            onChange={handleChange}
            className="flex-1 p-2 text-sm border border-gray-300 rounded h-9"
            readOnly />
        </div>
      </div>
    </div>
    <div className="flex justify-end gap-3 mt-3">
        <button
          type="button"
          onClick={handleClear}
          className="px-4 py-2 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Clear (Alt+C)
        </button>
        <button
          type="button"
          onClick={handleUpdate}
          className="px-4 py-2 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700"
        >
          Update (Alt+U)
        </button>
        <button
          type="button"
          onClick={handleDelete}
          className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          disabled={!formData.id}
        >
          Delete (Alt+D)
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Save (Alt+S)
        </button>
      </div>

      {/* Search Bar (below action buttons) */}
      <div className="mt-4 p-4 bg-gray-50 rounded-md">
        <div className="flex flex-col gap-3">
          <div className="flex gap-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by DC No., Complaint No., Product Sr No., or PCB Sr No."
              className="flex-1 p-2 text-sm border border-gray-300 rounded"
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
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Search
            </button>
          </div>

          <div className="flex gap-3 items-center">
            <button
              type="button"
              onClick={() => setShowSavedList(prev => !prev)}
              className="px-4 py-2 text-sm bg-gray-200 rounded hover:bg-gray-300"
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
          <div className="mt-4 max-h-44 overflow-y-auto border border-gray-300 rounded text-sm">
            <div className="p-2 bg-gray-200 font-medium">Search Results ({filteredResults.length})</div>
            {filteredResults.map((entry) => (
              <div
                key={entry.id}
                onClick={() => loadEntry(entry)}
                className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-200 last:border-b-0"
              >
                <div className="flex justify-between items-center">
                  <div className="truncate">
                    <span className="font-medium">DC: {entry.dcNo}</span> |
                    <span className="ml-2">Complaint: {entry.complaintNo}</span> |
                    <span className="ml-2">Product Sr: {entry.productSrNo}</span>
                  </div>
                  <span className="text-xs text-gray-500">Click to load</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Saved Entries List */}
        {showSavedList && savedEntries.length > 0 && (
          <div className="mt-4 max-h-44 overflow-y-auto border border-gray-300 rounded text-sm">
            <div className="p-2 bg-yellow-100 font-medium flex justify-between items-center">
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
                  <div className="truncate">
                    <span className="font-medium">Sr. No: {entry.srNo}</span> |
                    <span className="ml-2">DC: {entry.dcNo}</span> |
                    <span className="ml-2">Complaint: {entry.complaintNo}</span> |
                    <span className="ml-2">Product Sr: {entry.productSrNo}</span>
                  </div>
                  <span className="text-xs text-gray-500">Click to load</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </form>
  );
}

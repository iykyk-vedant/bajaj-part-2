
'use client';

import { useState, useEffect, useCallback } from 'react';
import { TagEntry } from '@/lib/tag-entry/types';
import { useLockStore } from '@/store/lockStore';
import { LockButton } from './LockButton';
import { spareParts } from '@/lib/spare-parts';
import { generatePcbNumber, getMonthCode } from '@/lib/pcb-utils';
import { tagEntryEventEmitter, TAG_ENTRY_EVENTS } from '@/lib/event-emitter';
import { EngineerName } from '@/components/ui/engineer-name-db';
import { useAuth, useSessionData } from '@/contexts/AuthContext';

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
  sessionDcNumber?: string | null;
  sessionPartCode?: string | null;
}

const STORAGE_KEY = 'tag-entries';

export function TagEntryForm({ initialData, dcNumbers = [], dcPartCodes = {}, onAddDcNumber, sessionDcNumber, sessionPartCode }: TagEntryFormProps) {
  console.log('=== TagEntryForm Component Mounted ===');
  console.log('Initial props - initialData:', initialData, 'dcNumbers length:', dcNumbers.length, 'dcPartCodes keys:', Object.keys(dcPartCodes));
  console.log('Session props - DC Number:', sessionDcNumber, 'Part Code:', sessionPartCode);

  // BRUTE FORCE APPROACH - Direct localStorage access
  console.log('=== BRUTE FORCE CHECK ===');
  const directDcNumber = localStorage.getItem('selectedDcNumber');
  const directPartCode = localStorage.getItem('selectedPartCode');
  console.log('Direct localStorage access - DC Number:', directDcNumber, 'Part Code:', directPartCode);

  const { isDcLocked } = useLockStore();
  const { user } = useAuth();
  const [savedEntries, setSavedEntries] = useState<TagEntry[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showSavedList, setShowSavedList] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userSelectedPartCode, setUserSelectedPartCode] = useState(false);

  // State for DC creation modal
  const [isDcModalOpen, setIsDcModalOpen] = useState(false);
  const [newDcNo, setNewDcNo] = useState('');
  const [newPartCode, setNewPartCode] = useState('');

  const STORAGE_KEY = 'tag-entries';

  // BRUTE FORCE INITIALIZATION - Apply session data immediately
  useEffect(() => {
    console.log('=== BRUTE FORCE INITIALIZATION ===');

    // Get data from multiple sources
    const dcNumber = sessionDcNumber || localStorage.getItem('selectedDcNumber');
    const partCode = sessionPartCode || localStorage.getItem('selectedPartCode');

    console.log('Sources - sessionDcNumber:', sessionDcNumber, 'localStorage:', localStorage.getItem('selectedDcNumber'));
    console.log('Sources - sessionPartCode:', sessionPartCode, 'localStorage:', localStorage.getItem('selectedPartCode'));
    console.log('Final values - DC Number:', dcNumber, 'Part Code:', partCode);

    // Apply immediately if we have data
    if (dcNumber || partCode) {
      console.log('APPLYING SESSION DATA TO FORM');
      setFormData(prev => ({
        ...prev,
        dcNo: dcNumber || prev.dcNo,
        partCode: partCode || prev.partCode
      }));
      setUserSelectedPartCode(true);

      // ALSO UPDATE LOCK STORE
      console.log('UPDATING LOCK STORE WITH SESSION DATA');
      useLockStore.getState().setLockedValues(dcNumber || '', partCode || '');
      useLockStore.getState().lockDc(dcNumber || '', partCode || '');

      console.log('FORM UPDATED WITH SESSION DATA');
    } else {
      console.log('NO SESSION DATA FOUND');
    }
  }, []); // Run only once on mount

  // Watch for manual localStorage changes (in case data is updated externally)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'selectedDcNumber' || e.key === 'selectedPartCode') {
        const newDcNumber = localStorage.getItem('selectedDcNumber');
        const newPartCode = localStorage.getItem('selectedPartCode');

        console.log('External storage change detected - DC Number:', newDcNumber, 'Part Code:', newPartCode);

        if (newDcNumber || newPartCode) {
          setFormData(prev => ({
            ...prev,
            dcNo: newDcNumber || prev.dcNo,
            partCode: newPartCode || prev.partCode
          }));
          setUserSelectedPartCode(true);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const [formData, setFormData] = useState<TagEntry>({
    id: '',
    srNo: '001',
    dcNo: sessionDcNumber || localStorage.getItem('selectedDcNumber') || '',
    dcDate: '',
    branch: '',
    bccdName: '',
    productDescription: '',
    productSrNo: '',
    dateOfPurchase: '',
    complaintNo: '',
    partCode: sessionPartCode || localStorage.getItem('selectedPartCode') || '',
    natureOfDefect: '',
    visitingTechName: '',
    mfgMonthYear: '',
    repairDate: '',
    testing: '',
    failure: '',
    status: '',
    pcbSrNo: '',
    analysis: '',
    componentChange: '',
    enggName: '',
    tagEntryBy: user?.name || user?.email || '',
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
            dateOfPurchase: entry.date_of_purchase ? (typeof entry.date_of_purchase === 'string' ? entry.date_of_purchase : (entry.date_of_purchase instanceof Date ? entry.date_of_purchase.toISOString().split('T')[0] : new Date(entry.date_of_purchase).toISOString().split('T')[0])) : '',
            complaintNo: entry.complaint_no || '',
            partCode: entry.part_code || '',
            natureOfDefect: entry.nature_of_defect || '',
            visitingTechName: entry.visiting_tech_name || '',
            mfgMonthYear: entry.mfg_month_year ? (typeof entry.mfg_month_year === 'string' ? entry.mfg_month_year : (entry.mfg_month_year instanceof Date ? entry.mfg_month_year.toISOString().split('T')[0] : new Date(entry.mfg_month_year).toISOString().split('T')[0])) : '',
            pcbSrNo: entry.pcb_sr_no || '',
          }));

          setSavedEntries(tagEntries);

          // Set initial SR No based on Partcode from database
          if (formData.partCode) {
            console.log('Loading SR No for Partcode:', formData.partCode);
            const { getNextSrNoForPartcodeAction } = await import('@/app/actions/consumption-actions');
            const srNoResult = await getNextSrNoForPartcodeAction(formData.partCode);
            console.log('SR No result:', srNoResult);
            if (srNoResult.success && srNoResult.data) {
              console.log('Setting SR No to:', srNoResult.data);
              setFormData(prev => ({
                ...prev,
                srNo: srNoResult.data as string
              }));
            }
          } else {
            console.log('No DC Number, using default SR No: 001');
            // Fallback to 001 if no DC Number
            setFormData(prev => ({
              ...prev,
              srNo: '001'
            }));
          }
        }
      } catch (e) {
        console.error('Error loading entries from database:', e);
      }
    };

    loadSavedEntries();
  }, [formData.dcNo]); // Reload when DC Number changes

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
        // Calculate next sequential serial number for the selected Partcode from database
        const partCode = initialData.partCode || prev.partCode;
        let newSrNo = prev.srNo; // Default to current srNo

        // Use database-based SR No generation
        const generateSrNoFromDb = async () => {
          if (partCode) {
            try {
              const { getNextSrNoForPartcodeAction } = await import('@/app/actions/consumption-actions');
              const srNoResult = await getNextSrNoForPartcodeAction(partCode);
              if (srNoResult.success && srNoResult.data) {
                return srNoResult.data;
              }
            } catch (error) {
              console.error('Error generating SR No from DB:', error);
            }
          }
          return '001'; // Fallback
        };

        // Don't override part code if user has selected one or DC is locked
        const newFormData = {
          id: initialData.id || prev.id,
          srNo: newSrNo, // Will be updated asynchronously
          dcNo: initialData.dcNo || prev.dcNo,
          branch: initialData.branch || prev.branch,
          bccdName: initialData.bccdName || prev.bccdName,
          // Don't override productDescription if partCode is already set
          productDescription: (prev.partCode || initialData.sparePartCode) ? prev.productDescription : (initialData.productDescription || prev.productDescription),
          productSrNo: initialData.productSrNo || prev.productSrNo,
          dateOfPurchase: initialData.dateOfPurchase || prev.dateOfPurchase,
          complaintNo: initialData.complaintNo || prev.complaintNo,
          // partCode should only come from dropdown, not from image extraction
          // Preserve user's selection if they've already selected a partCode
          // Also preserve locked partCode if DC is locked
          partCode: (userSelectedPartCode || isDcLocked) ? prev.partCode : '', // Don't override if user has selected a part code or DC is locked
          natureOfDefect: initialData.natureOfDefect || prev.natureOfDefect,
          visitingTechName: initialData.technicianName || prev.visitingTechName,
          mfgMonthYear: mfgMonthYear || prev.mfgMonthYear,
          pcbSrNo: initialData.pcbSrNo || prev.pcbSrNo,
        };

        // Update SR No asynchronously
        generateSrNoFromDb().then(dbSrNo => {
          setFormData(prevForm => ({
            ...prevForm,
            srNo: dbSrNo
          }));
        });

        return newFormData;
      });
    }
  }, [initialData, savedEntries, userSelectedPartCode]);



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

  // Auto-generate PCB serial number when part code or mfgMonthYear changes
  useEffect(() => {
    if (formData.partCode && formData.srNo) {
      try {
        const pcb = generatePcbNumber(formData.partCode, formData.srNo, formData.mfgMonthYear);

        setFormData(prev => ({
          ...prev,
          pcbSrNo: pcb,
        }));
      } catch (err) {
        console.error('Failed to generate PCB number:', err);
      }
    }
  }, [formData.partCode, formData.srNo, formData.mfgMonthYear]);

  // Update serial number when part code changes
  // Calculate next sequential number for the selected part code
  useEffect(() => {
    if (formData.partCode && !isDcLocked) { // Only update when not locked
      // Find entries with the same part code
      const partCodeEntries = savedEntries.filter(entry => entry.partCode === formData.partCode);

      // Calculate next sequential number (1, 2, 3, ...) for this part code
      const nextSrNo = partCodeEntries.length > 0
        ? Math.max(...partCodeEntries.map(e => parseInt(e.srNo) || 0)) + 1
        : 1;

      setFormData(prev => ({
        ...prev,
        srNo: String(nextSrNo).padStart(3, '0')
      }));
    } else if (isDcLocked) {
      // If locked, set DC No and partCode to the locked values
      setFormData(prev => ({
        ...prev,
        dcNo: useLockStore.getState().lockedDcNo,
        partCode: useLockStore.getState().lockedPartCode
      }));
    } else {
      // If no part code is selected, reset to 001
      setFormData(prev => ({
        ...prev,
        srNo: '001'
      }));
    }
  }, [formData.partCode, savedEntries, isDcLocked]);

  // Sync with lock store when locked values change
  useEffect(() => {
    const unsub = useLockStore.subscribe((state) => {
      if (state.isDcLocked) {
        setFormData(prev => ({
          ...prev,
          dcNo: state.lockedDcNo,
          partCode: state.lockedPartCode
        }));
        // When DC is locked, the part code is controlled by the lock, not user selection
        setUserSelectedPartCode(false);
      }
    });

    return () => unsub();
  }, []);

  // Handle changes in DC lock state
  useEffect(() => {
    if (isDcLocked) {
      // When DC gets locked, update form and reset user selection flag
      const lockState = useLockStore.getState();
      setFormData(prev => ({
        ...prev,
        dcNo: lockState.lockedDcNo,
        partCode: lockState.lockedPartCode
      }));
      setUserSelectedPartCode(false);
    }
  }, [isDcLocked]);

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
        if (formData.partCode) {  // Changed condition from formData.dcNo to formData.partCode
          const pcb = generatePcbNumber(formData.partCode, value, formData.mfgMonthYear);
          setFormData(prev => ({
            ...prev,
            pcbSrNo: pcb
          }));
        }
      }
      // If partCode or mfgMonthYear is changed, update PCB Sr No accordingly
      else if (name === 'partCode' || name === 'mfgMonthYear') {
        if (name === 'partCode') {
          // Mark that the user has manually selected the part code
          setUserSelectedPartCode(true);
        }
        if (formData.partCode && formData.srNo) {
          const pcb = generatePcbNumber(formData.partCode, formData.srNo, formData.mfgMonthYear);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('=== HANDLE SUBMIT CALLED ===');
    console.log('Form data:', formData);
    console.log('Session data:', { sessionDcNumber, sessionPartCode });

    // Check if all required fields are present
    const requiredFields = {
      dcNo: formData.dcNo,
      complaintNo: formData.complaintNo
    };

    console.log('Required fields check:', requiredFields);
    const missingFields = Object.entries(requiredFields)
      .filter(([key, value]) => !value)
      .map(([key]) => key);

    if (missingFields.length > 0) {
      console.log('MISSING REQUIRED FIELDS:', missingFields);
      alert(`Missing required fields: ${missingFields.join(', ')}`);
      return;
    }

    console.log('All required fields present');

    // Skip all validation and use direct save approach
    console.log('Using direct save approach...');

    const entryToSave = {
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
      enggName: formData.enggName || '',
      tagEntryBy: formData.tagEntryBy || user?.name || user?.email || '',
    };

    console.log('Entry to save:', entryToSave);

    try {
      console.log('Importing save function...');
      const { saveConsolidatedData } = await import('@/app/actions/consumption-actions');
      console.log('Calling save function with session data:', { sessionDcNumber, sessionPartCode });
      const result = await saveConsolidatedData(entryToSave, sessionDcNumber || undefined, sessionPartCode || undefined);

      console.log('Save result:', result);

      if (result.success) {
        console.log('SAVE SUCCESSFUL');
        alert('Entry saved successfully!');
        handleClear();
        setShowSavedList(true);
      } else {
        console.log('SAVE FAILED:', result.error);
        alert('Failed to save entry: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('SAVE ERROR:', error);
      alert('Error saving entry: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
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

    // Validate that the ID is a reasonable integer (not a large timestamp)
    const idNum = parseInt(String(formData.id), 10);
    if (isNaN(idNum) || idNum > 2147483647) { // Max 32-bit integer
      alert('Invalid entry ID. Please search and select a valid entry to delete.');
      console.error('Attempted to delete entry with invalid ID:', formData.id);
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
            alert('Error: Could not delete entry from database');
          }
        } catch (e) {
          console.error('Error deleting entry from database:', e);
          alert('Error: Could not delete entry from database');
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
    // Preserve the current SR No sequence, don't reset to '001'
    const currentSrNo = formData.srNo || '001';

    setFormData({
      id: '',
      srNo: currentSrNo, // Keep current SR No
      dcNo: sessionDcNumber || '', // Preserve session DC Number
      branch: 'Mumbai',
      bccdName: 'BCCD-001',
      productDescription: formData.productDescription || '', // Preserve Product Description
      productSrNo: '',
      dateOfPurchase: '',
      complaintNo: '',
      partCode: sessionPartCode || '', // Preserve session Part Code
      natureOfDefect: '',
      visitingTechName: '',
      mfgMonthYear: '',
      pcbSrNo: '',
      tagEntryBy: user?.name || user?.email || '',
    });
    // Reset the flag since it's a new entry
    setUserSelectedPartCode(!!sessionPartCode);
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
        // partCode should only come from dropdown, not from loaded entry
        partCode: '',
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
      dateOfPurchase: entry.dateOfPurchase ? (typeof entry.dateOfPurchase === 'string' ? entry.dateOfPurchase : (entry.dateOfPurchase && typeof entry.dateOfPurchase === 'object' && 'toISOString' in entry.dateOfPurchase ? (entry.dateOfPurchase as Date).toISOString().split('T')[0] : new Date(entry.dateOfPurchase).toISOString().split('T')[0])) : '',
      complaintNo: entry.complaintNo,
      // partCode should only come from dropdown, not from loaded entry
      partCode: '',
      natureOfDefect: entry.natureOfDefect,
      visitingTechName: entry.visitingTechName,
      mfgMonthYear: entry.mfgMonthYear ? (typeof entry.mfgMonthYear === 'string' ? entry.mfgMonthYear : (entry.mfgMonthYear && typeof entry.mfgMonthYear === 'object' && 'toISOString' in entry.mfgMonthYear ? (entry.mfgMonthYear as Date).toISOString().split('T')[0] : new Date(entry.mfgMonthYear).toISOString().split('T')[0])) : '',
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

    console.log('Keyboard shortcut detected:', e.key);

    // Prevent browser default behavior for these shortcuts
    switch (e.key.toLowerCase()) {
      case 's':
        e.preventDefault();
        console.log('Alt+S pressed, submitting form');
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
  }, [formData.id, handleSubmit, handleDelete, handleClear, handleUpdate]);

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="space-y-1">
          <div className="flex justify-between items-center mb-1">
            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Sr. No.</label>
            <div className="flex space-x-1">
              <button
                type="button"
                onClick={() => handleSrNoIncrement()}
                className="text-gray-400 hover:text-gray-600 px-1 text-xs"
              >
                +
              </button>
              <button
                type="button"
                onClick={() => handleSrNoDecrement()}
                className="text-gray-400 hover:text-gray-600 px-1 text-xs"
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
            className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-9 transition-all" />
        </div>
        <div className="space-y-1">
          <div className="flex justify-between items-center mb-1">
            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">DC No</label>
            <div className="flex items-center gap-2">
              <Dialog open={isDcModalOpen} onOpenChange={setIsDcModalOpen}>
                <DialogTrigger asChild>
                  <button
                    type="button"
                    className="text-blue-500 hover:text-blue-700 text-xs font-bold"
                  >
                    + NEW
                  </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create New DC</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-1">
                      <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider">DC No.</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={isDcLocked ? useLockStore.getState().lockedDcNo : newDcNo}
                          onChange={(e) => setNewDcNo(e.target.value)}
                          disabled={isDcLocked}
                          className={`flex-1 px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 h-9 transition-all ${isDcLocked ? 'bg-gray-100' : ''}`}
                          placeholder="Enter DC No." />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Part Code</label>
                      <input
                        type="text"
                        value={isDcLocked ? useLockStore.getState().lockedPartCode : newPartCode}
                        onChange={(e) => setNewPartCode(e.target.value)}
                        disabled={isDcLocked}
                        className={`w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 h-9 transition-all ${isDcLocked ? 'bg-gray-100' : ''}`}
                        placeholder="Enter Part Code" />
                    </div>
                  </div>
                  <DialogFooter>
                    <button
                      onClick={handleCreateDC}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-semibold transition-all shadow-sm"
                    >
                      Create DC
                    </button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

            </div>
          </div>
          <select
            name="dcNo"
            value={isDcLocked ? useLockStore.getState().lockedDcNo : (formData.dcNo || '')}
            onChange={handleChange}
            disabled={isDcLocked || !!sessionDcNumber}
            className={`w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-9 transition-all ${isDcLocked || sessionDcNumber ? 'bg-gray-50 text-gray-500 border-gray-200' : 'bg-white'}`}
          >
            <option value="">Select DC No.</option>
            {dcNumbers
              .filter(dc => dc != null && dc !== '')
              .map((dc, index) => (
                <option key={`${dc}-${index}`} value={dc}>{dc}</option>
              ))}
          </select>

        </div>
        <div className="space-y-1">
          <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Part Code</label>
          <select
            name="partCode"
            value={isDcLocked ? useLockStore.getState().lockedPartCode : (formData.partCode || '')}
            onChange={handleChange}
            disabled={isDcLocked}
            className={`w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-9 transition-all ${isDcLocked ? 'bg-gray-50 text-gray-500 border-gray-200' : 'bg-white'}`}
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="space-y-1">
          <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Branch</label>
          <input
            type="text"
            name="branch"
            value={formData.branch || ''}
            onChange={handleChange}
            className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-9 transition-all bg-white" />

        </div>
        <div className="space-y-1">
          <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider">BCCD Name</label>
          <input
            type="text"
            name="bccdName"
            value={formData.bccdName || ''}
            onChange={handleChange}
            className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-9 transition-all bg-white" />
        </div>
        <div className="space-y-1">
          <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Product Description</label>
          <input
            type="text"
            name="productDescription"
            value={formData.productDescription || ''}
            onChange={handleChange}
            className={`w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-9 transition-all ${formData.partCode ? 'bg-gray-50 text-gray-500 border-gray-200' : 'bg-white'}`}
            readOnly={!!formData.partCode} />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="space-y-1">
          <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Product Sr No</label>
          <div className="flex shadow-sm rounded-md overflow-hidden">
            <input
              type="text"
              name="productSrNo"
              value={formData.productSrNo || ''}
              onChange={handleChange}
              className="flex-1 px-2 py-1.5 text-xs border border-gray-300 rounded-l-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-9 transition-all bg-white" />
            <div className="bg-gray-100 px-2 text-[10px] border border-l-0 border-gray-300 text-gray-500 flex items-center font-mono">
              {(formData.productSrNo || '').length}/20
            </div>
          </div>
        </div>
        <div className="space-y-1">
          <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Date of Purchase</label>
          <input
            type="text"
            name="dateOfPurchase"
            value={formData.dateOfPurchase || ''}
            onChange={handleChange}
            placeholder="DD/MM/YYYY"
            className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-9 transition-all bg-white" />
        </div>
        <div className="space-y-1">
          <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Complaint No</label>
          <input
            type="text"
            name="complaintNo"
            value={formData.complaintNo || ''}
            onChange={handleChange}
            className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-9 transition-all bg-white" />
        </div>

      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="space-y-1">
          <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Nature of Defect</label>
          <input
            type="text"
            name="natureOfDefect"
            value={formData.natureOfDefect || ''}
            onChange={handleChange}
            className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-9 transition-all bg-white" />
        </div>
        <div className="space-y-1">
          <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Visiting Tech Name</label>
          <input
            type="text"
            name="visitingTechName"
            value={formData.visitingTechName || ''}
            onChange={handleChange}
            className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-9 transition-all bg-white" />
        </div>
        <div className="space-y-1">
          <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Mfg Month/Year</label>
          <input
            type="text"
            name="mfgMonthYear"
            value={formData.mfgMonthYear || ''}
            onChange={handleChange}
            placeholder="MM/YYYY"
            className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-9 transition-all bg-white"
            maxLength={7} />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="md:col-span-2 space-y-1">
          <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider">PCB Sr. No</label>
          <div className="flex">
            <input
              type="text"
              name="pcbSrNo"
              value={formData.pcbSrNo || ''}
              readOnly
              className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-md bg-gray-50 text-gray-500 h-9 font-mono" />
          </div>
        </div>
        <div className="space-y-1">
          <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Tag Entry By</label>
          <input
            type="text"
            value={user?.name || user?.email || ''}
            readOnly
            className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-md bg-gray-50 text-gray-500 h-9"
          />
        </div>
      </div>
      <div className="flex justify-end gap-3 mt-4">
        <button
          type="button"
          onClick={handleClear}
          className="px-4 py-1.5 text-xs font-semibold bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-all shadow-sm shadow-gray-100"
        >
          Clear (Alt+C)
        </button>
        <button
          type="button"
          onClick={handleUpdate}
          className="px-4 py-1.5 text-xs font-semibold bg-amber-500 text-white rounded-md hover:bg-amber-600 transition-all shadow-sm shadow-amber-100"
        >
          Update (Alt+U)
        </button>
        <button
          type="button"
          onClick={handleDelete}
          className="px-4 py-1.5 text-xs font-semibold bg-rose-500 text-white rounded-md hover:bg-rose-600 transition-all shadow-sm shadow-rose-100 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!formData.id}
        >
          Delete (Alt+D)
        </button>
        <button
          type="submit"
          className="px-6 py-1.5 text-xs font-bold bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all shadow-sm shadow-blue-100"
        >
          Save Data (Alt+S)
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
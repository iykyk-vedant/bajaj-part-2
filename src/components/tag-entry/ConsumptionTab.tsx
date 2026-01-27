'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useLockStore } from '@/store/lockStore';
import { LockButton } from './LockButton';
import { validateBomComponents, saveConsolidatedData, searchConsolidatedDataEntries, updateConsolidatedDataEntryByProductSrNoAction } from '@/app/actions/consumption-actions';
import { getPcbNumberForDc } from '@/lib/pcb-utils';
import { EngineerName } from '@/components/ui/engineer-name-db';
import { useAuth } from '@/contexts/AuthContext';

interface ConsumptionTabProps {
  dcNumbers?: string[];
  dcPartCodes?: Record<string, string[]>;
  engineerName?: string;
  onEngineerNameChange?: (name: string) => void;
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
  analysis: string;
  componentChange: string;
  enggName: string;
  consumptionEntryBy?: string;
  dispatchDate: string;
  validationResult?: string;
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
  analysis?: string;
  componentChange?: string;
  enggName?: string;
  dispatchDate?: string;
  validationResult?: string;
  tagEntryBy?: string;
  consumptionEntryBy?: string;
  dispatchEntryBy?: string;
}

export function ConsumptionTab({ dcNumbers = ['DC001', 'DC002'], dcPartCodes = {}, engineerName = '', onEngineerNameChange }: ConsumptionTabProps) {
  const { isDcLocked } = useLockStore();
  const { user } = useAuth();
  const router = useRouter();

  // State for Find fields
  const [partCode, setPartCode] = useState('');
  const [mfgMonthYear, setMfgMonthYear] = useState('');
  const [srNo, setSrNo] = useState('');

  // Form data state
  const [formData, setFormData] = useState<ConsumptionEntry>({
    repairDate: '',
    testing: '',
    failure: '',
    status: '',
    pcbSrNo: '',
    analysis: '',
    componentChange: '',
    enggName: engineerName || '',
    dispatchDate: '',
    validationResult: '',
  });
  
  // Debug effect to log form data changes
  useEffect(() => {
    console.log('Form data changed:', formData);
  }, [formData]);

  // Consumption entries state
  const [consumptionEntries, setConsumptionEntries] = useState<ConsumptionEntry[]>([]);

  // Unified table data state
  const [tableData, setTableData] = useState<TableRow[]>([]);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);

  // Workflow state
  const [isPcbFound, setIsPcbFound] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  
  // Debug effect to log state changes
  useEffect(() => {
    console.log('isPcbFound changed to:', isPcbFound);
  }, [isPcbFound]);

  // Transform / to \n for display in Analysis field when showing in read-only contexts
  const displayAnalysisText = useMemo(
    () => formData.analysis.replaceAll('/', '\n'),
    [formData.analysis]
  );

  // State for validation result
  const [validationResult, setValidationResult] = useState('');

  // Effect to update enggName when the prop changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      enggName: engineerName || ''
    }));
  }, [engineerName]);

  // Effect to validate analysis when partCode changes
  useEffect(() => {
    if (formData.analysis) {
      validateBomAnalysis(formData.analysis);
    }
  }, [partCode]);

  

  // Function to load data from database - only load tag entry data, not consumption
  const loadAllData = async () => {
    try {
      // Load consolidated data entries from database
      const { getConsolidatedDataEntries } = await import('@/app/actions/consumption-actions');
      const result = await getConsolidatedDataEntries();

      if (result.success) {
        const dbEntries = result.data || [];
        
        // Convert database entries to TableRow format for the table
        const tableRows: TableRow[] = dbEntries.map((entry: any) => ({
          id: entry.id,
          srNo: entry.sr_no || '',
          dcNo: entry.dc_no || '',
          dcDate: entry.dc_date || '',
          branch: entry.branch || '',
          bccdName: entry.bccd_name || '',
          productDescription: entry.product_description || '',
          productSrNo: entry.product_sr_no || '',
          dateOfPurchase: entry.date_of_purchase ? (typeof entry.date_of_purchase === 'string' ? entry.date_of_purchase : new Date(entry.date_of_purchase).toISOString().split('T')[0]) : '',
          complaintNo: entry.complaint_no || '',
          partCode: entry.part_code || '',
          defect: entry.nature_of_defect || '', // Fixed field name
          visitingTechName: entry.visiting_tech_name || '',
          mfgMonthYear: entry.mfg_month_year ? (typeof entry.mfg_month_year === 'string' ? entry.mfg_month_year : new Date(entry.mfg_month_year).toISOString().split('T')[0]) : '',
          // Consumption-specific fields - now loaded from database
          repairDate: entry.repair_date ? (typeof entry.repair_date === 'string' ? entry.repair_date : new Date(entry.repair_date).toISOString().split('T')[0]) : '',
          testing: entry.testing || '',
          failure: entry.failure || '',
          status: entry.status || '',
          pcbSrNo: entry.pcb_sr_no || '',
          analysis: entry.analysis || '',
          componentChange: entry.component_change || '',
          enggName: entry.engg_name || '',
          dispatchDate: entry.dispatch_date ? (typeof entry.dispatch_date === 'string' ? entry.dispatch_date : new Date(entry.dispatch_date).toISOString().split('T')[0]) : '',
          validationResult: entry.validation_result || '',
          tagEntryBy: entry.tag_entry_by || '',
          consumptionEntryBy: entry.consumption_entry_by || '',
          dispatchEntryBy: entry.dispatch_entry_by || '',
        }));
        
        setTableData(tableRows);
        console.log('Loaded table data - length:', tableRows.length);
        console.log('First few entries:', tableRows.slice(0, 3));
      }
    } catch (e) {
      console.error('Error loading data from database:', e);
    }
  };
  
  // Load data from database on component mount
  useEffect(() => {
    loadAllData();
  }, []);

  // This useEffect is no longer needed as data loading is handled by loadAllData function
  // The table and consumption entries are loaded together in the main useEffect

  const handleFind = async () => {
    // Validate that all search fields are filled
    if (!partCode || !mfgMonthYear || !srNo) {
      alert('Please fill in all search fields: Part Code, Mfg Month/Year, and Serial No.');
      return;
    }

    setIsSearching(true);

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      // Generate the same PCB number that would be generated in TagEntryForm
      const pcbSrNo = getPcbNumberForDc(partCode, srNo, mfgMonthYear);
      console.log('Generated PCB Serial Number:', pcbSrNo);
      console.log('Search parameters - Part Code:', partCode, 'SR No:', srNo);

      // First, search for existing entries by pcbSrNo
      const { searchConsolidatedDataEntriesByPcb } = await import('@/app/actions/consumption-actions');
      const searchResult = await searchConsolidatedDataEntriesByPcb('', partCode, pcbSrNo);
      console.log('Search result:', searchResult);
      
      // Auto-populate form with fetched data
      if (searchResult.success && searchResult.data && searchResult.data.length > 0) {
        console.log('Found existing entry, populating form');
        // If an existing entry is found, populate the form with its consumption data
        const existingEntry = searchResult.data[0];
        console.log('Existing entry data:', existingEntry);
        
        // Find the corresponding entry in tableData to get the ID
        const tableEntry = tableData.find(entry => entry.pcbSrNo === existingEntry.pcb_sr_no);
        if (tableEntry) {
          console.log('Found matching table entry, selecting it');
          setSelectedEntryId(tableEntry.id || null);
          
          // Populate form with the table entry data
          setFormData({
            repairDate: tableEntry.repairDate || '',
            testing: tableEntry.testing || '',
            failure: tableEntry.failure || '',
            status: tableEntry.status || '',
            pcbSrNo: tableEntry.pcbSrNo || '',
            analysis: tableEntry.analysis || '',
            componentChange: tableEntry.componentChange || '',
            enggName: tableEntry.enggName || engineerName || '',
            dispatchDate: tableEntry.dispatchDate || '',
            validationResult: tableEntry.validationResult || '',
          });
          
          // Also update the engineer name if it's different
          if (tableEntry.enggName && tableEntry.enggName !== engineerName) {
            onEngineerNameChange && onEngineerNameChange(tableEntry.enggName);
          }
        } else {
          console.log('No matching table entry found, using search result data');
          // Fallback to using search result data
          setFormData(prev => ({
            ...prev,
            pcbSrNo, // Use the same PCB serial number format as TagEntryForm
            repairDate: existingEntry.repair_date || new Date().toISOString().split('T')[0],
            testing: existingEntry.testing || 'PASS',
            failure: existingEntry.failure || '',
            status: existingEntry.status || 'OK',
            analysis: existingEntry.analysis || '',
            componentChange: existingEntry.component_change || '',
            enggName: existingEntry.engg_name || engineerName || '',
            dispatchDate: existingEntry.dispatch_date || '',
            validationResult: existingEntry.validation_result || '',
          }));
        }
      } else {
        console.log('No existing entry found, using default values');
        // If no existing entry is found, use default values
        setFormData(prev => ({
          ...prev,
          pcbSrNo, // Use the same PCB serial number format as TagEntryForm
          repairDate: new Date().toISOString().split('T')[0], // Today's date
          testing: 'PASS', // Default value
          status: 'OK', // Default value
          validationResult: '',
        }));
      }
  
      console.log('Setting isPcbFound to true');
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

    // Special handling for Analysis field - extract content between 'Analysis:' and 'from Analysis' for Component Change
    if (name === 'analysis') {
      // Extract text between "Analysis:" and "from Analysis" if pattern exists
      let extractedValue = value;
      let componentChangeValue = value;
      const analysisMatch = value.match(/Analysis:\s*(.*?)\s*from Analysis/);
      if (analysisMatch && analysisMatch[1]) {
        extractedValue = analysisMatch[1].trim();
        componentChangeValue = extractedValue;
      } else {
        // If no "Analysis: ... from Analysis" pattern, extract just the component identifiers (e.g., R1/R2)
        // Look for patterns like "R1/R2 FUSE", "R1 R2", etc.
        const componentPattern = /^([A-Za-z0-9/]+)(?:\s+[A-Z]+)/;
        const componentMatch = extractedValue.match(componentPattern);
        if (componentMatch && componentMatch[1]) {
          componentChangeValue = componentMatch[1];
        } else {
          componentChangeValue = extractedValue;
        }
      }
      
      // If analysis value is only spaces, clear componentChange
      if (!extractedValue.trim()) {
        setFormData(prev => ({
          ...prev,
          [name]: value,
          componentChange: ''
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [name]: value, // Store original value in the form
          componentChange: componentChangeValue, // Use component identifier for Component Change
        }));
      }

      // Trigger BOM validation to populate validation result with Component Change value
      validateBomAnalysis(componentChangeValue);
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
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

  // Function to validate BOM analysis
  const validateBomAnalysis = async (analysisText: string) => {
    // If analysis text contains only spaces, clear componentChange
    if (!analysisText.trim()) {
      // Clear componentChange field if analysis is empty
      setFormData(prev => ({
        ...prev,
        componentChange: ''
        // componentChange is already handled in handleChange
      }));
      setValidationResult('');
      return;
    }

    try {
      const result = await validateBomComponents(analysisText, partCode || undefined);

      if (result.success && result.data) {
        // Update validation result with BOM data and clean up the format
        let formattedResult = result.data.formattedComponents;
        
        // Clean up the validation result to remove prefixes and format properly
        // Split by newlines and process each line
        const lines = formattedResult.split('\n');
        const cleanedLines = lines.map(line => {
          // If the line contains @, split and reformat
          if (line.includes('@')) {
            const parts = line.split('@');
            const component = parts[0].trim();
            const details = parts[1].trim();
            
            // Skip lines with NA as details
            if (details.toUpperCase() === 'NA') {
              return null;
            }
            
            // Format as component - details
            let formattedLine = `${component} - ${details}`;
            
            // Remove part code prefix (like 971039) if present
            if (formattedLine.startsWith(partCode)) {
              formattedLine = formattedLine.substring(partCode.length).trim();
              if (formattedLine.startsWith('-')) {
                formattedLine = formattedLine.substring(1).trim();
              }
            }
            

            
            return formattedLine;
          }
          
          // For lines that don't contain @, remove part code prefix if present
          let cleanLine = line;
          if (cleanLine.startsWith(partCode)) {
            cleanLine = cleanLine.substring(partCode.length).trim();
            if (cleanLine.startsWith('-')) {
              cleanLine = cleanLine.substring(1).trim();
            }
          }
          

          
          return cleanLine;
        }).filter(line => line !== null && line.trim() !== ''); // Remove null entries and empty lines
        
        const cleanedResult = cleanedLines.join('\n');
        
        // Update validation result state
        setValidationResult(cleanedResult);
      } else {
        // Handle validation error
        console.error('BOM validation error:', result.error);
        setValidationResult('Validation error: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error validating BOM components:', error);
      setValidationResult('Error validating BOM components');
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

    // Validate that an entry is selected
    if (!selectedEntryId) {
      alert('Please select an entry from the table first.');
      return;
    }

    try {
      console.log('handleConsume - Selected entry ID:', selectedEntryId);
      console.log('handleConsume - Table data length:', tableData.length);
      console.log('handleConsume - First few table entries IDs:', tableData.slice(0, 3).map(e => e.id));
      
      // Find the selected entry to get the correct product serial number
      const selectedEntry = tableData.find(entry => entry.id === selectedEntryId);
      console.log('handleConsume - Found selected entry:', selectedEntry);
      
      if (!selectedEntry || !selectedEntry.productSrNo) {
        console.error('Could not find selected entry or product serial number');
        console.error('Selected entry ID:', selectedEntryId);
        console.error('Table data:', tableData);
        console.error('Found entry:', selectedEntry);
        alert('Error: Could not find the selected entry. Please select an entry from the table.');
        return;
      }

      // Update the consolidated data entry with consumption data
      console.log('handleConsume - Sending update request with entry.productSrNo:', selectedEntry.productSrNo);
      console.log('handleConsume - Update data:', {
        // Preserve all existing tag entry fields from the selected entry
        srNo: selectedEntry.srNo,
        dcNo: selectedEntry.dcNo,
        dcDate: selectedEntry.dcDate,
        branch: selectedEntry.branch,
        bccdName: selectedEntry.bccdName,
        productDescription: selectedEntry.productDescription,
        productSrNo: selectedEntry.productSrNo, // This should match selectedEntry.productSrNo
        dateOfPurchase: selectedEntry.dateOfPurchase,
        complaintNo: selectedEntry.complaintNo,
        partCode: selectedEntry.partCode,
        natureOfDefect: selectedEntry.defect,
        visitingTechName: selectedEntry.visitingTechName,
        mfgMonthYear: selectedEntry.mfgMonthYear,
        pcbSrNo: selectedEntry.pcbSrNo,
        // Update consumption fields
        repairDate: formData.repairDate,
        testing: formData.testing,
        failure: formData.failure,
        status: formData.status,
        analysis: formData.analysis,
        componentChange: formData.componentChange,
        enggName: formData.enggName,
        dispatchDate: formData.dispatchDate,
        consumptionEntryBy: user?.name || user?.email || '',
        tagEntryBy: selectedEntry.tagEntryBy || user?.name || user?.email || '',
        validationResult: validationResult,
      });
      
      const updateResult = await updateConsolidatedDataEntryByProductSrNoAction(selectedEntry.productSrNo, {
        // Preserve all existing tag entry fields from the selected entry
        srNo: selectedEntry.srNo,
        dcNo: selectedEntry.dcNo,
        dcDate: selectedEntry.dcDate,
        branch: selectedEntry.branch,
        bccdName: selectedEntry.bccdName,
        productDescription: selectedEntry.productDescription,
        productSrNo: selectedEntry.productSrNo, // This should match selectedEntry.productSrNo
        dateOfPurchase: selectedEntry.dateOfPurchase,
        complaintNo: selectedEntry.complaintNo,
        partCode: selectedEntry.partCode,
        natureOfDefect: selectedEntry.defect,
        visitingTechName: selectedEntry.visitingTechName,
        mfgMonthYear: selectedEntry.mfgMonthYear,
        pcbSrNo: selectedEntry.pcbSrNo,
        // Update consumption fields
        repairDate: formData.repairDate,
        testing: formData.testing,
        failure: formData.failure,
        status: formData.status,
        analysis: formData.analysis,
        componentChange: formData.componentChange,
        enggName: formData.enggName,
        dispatchDate: formData.dispatchDate,
        consumptionEntryBy: user?.name || user?.email || '',
        tagEntryBy: selectedEntry.tagEntryBy || user?.name || user?.email || '',
        validationResult: validationResult,
      });
      
      console.log('handleConsume - Update result:', updateResult);
      
      if (!updateResult.success) {
        console.error('Failed to save consumption data to database:', updateResult.error);
        alert('Error: Could not save consumption data to database');
        return;
      }
      
      // Refresh the data to show updated consumption data
      await loadAllData();
      
      alert('Data consumed successfully! Consumption data saved to database.');
    } catch (error) {
      console.error('Error during consume operation:', error);
      alert('There was an error processing the consumption data.');
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

    try {
      // Find the selected entry to get the correct product serial number
      const selectedEntry = tableData.find(entry => entry.id === selectedEntryId);
      if (!selectedEntry || !selectedEntry.productSrNo) {
        console.error('Could not find selected entry or product serial number');
        alert('Error: Could not find the selected entry. Please select an entry from the table.');
        return;
      }

      // Update the consolidated data entry with consumption data
      const updateResult = await updateConsolidatedDataEntryByProductSrNoAction(selectedEntry.productSrNo, {
        // Preserve all existing tag entry fields from the selected entry
        srNo: selectedEntry.srNo,
        dcNo: selectedEntry.dcNo,
        dcDate: selectedEntry.dcDate,
        branch: selectedEntry.branch,
        bccdName: selectedEntry.bccdName,
        productDescription: selectedEntry.productDescription,
        productSrNo: selectedEntry.productSrNo, // This should match selectedEntry.productSrNo
        dateOfPurchase: selectedEntry.dateOfPurchase,
        complaintNo: selectedEntry.complaintNo,
        partCode: selectedEntry.partCode,
        natureOfDefect: selectedEntry.defect,
        visitingTechName: selectedEntry.visitingTechName,
        mfgMonthYear: selectedEntry.mfgMonthYear,
        pcbSrNo: selectedEntry.pcbSrNo,
        // Update consumption fields
        repairDate: formData.repairDate,
        testing: formData.testing,
        failure: formData.failure,
        status: formData.status,
        analysis: formData.analysis,
        componentChange: formData.componentChange,
        enggName: formData.enggName,
        dispatchDate: formData.dispatchDate,
        consumptionEntryBy: user?.name || user?.email || '',
        tagEntryBy: selectedEntry.tagEntryBy || '',
        validationResult: validationResult,
      });
      
      if (!updateResult.success) {
        console.error('Failed to update consumption data to database:', updateResult.error);
        alert('Error: Could not update consumption data to database');
        return;
      }
      
      // Refresh the data to show updated consumption data
      await loadAllData();
      
      alert('Consumption entry updated successfully!');
    } catch (error) {
      console.error('Error during update operation:', error);
      alert('There was an error updating the consumption data.');
    }
  }, [selectedEntryId, formData, srNo, partCode, mfgMonthYear, engineerName, user?.name, user?.email, validationResult]);

  const handleDelete = async () => {
    if (!selectedEntryId) {
      alert('Please select an entry to delete.');
      return;
    }

    // Validate that the ID is a reasonable integer (not a large timestamp)
    const idNum = parseInt(String(selectedEntryId), 10);
    if (isNaN(idNum) || idNum > 2147483647) { // Max 32-bit integer
      alert('Invalid entry ID. Please select a valid entry to delete.');
      console.error('Attempted to delete entry with invalid ID:', selectedEntryId);
      return;
    }

    if (!confirm('Are you sure you want to delete this entry?')) {
      return;
    }

    try {
      // Find the entry to delete to get its product serial number
      const entryToDelete = tableData.find(entry => entry.id === selectedEntryId);
      
      if (entryToDelete && entryToDelete.productSrNo) {
        // Update the consolidated data entry to clear consumption fields
        const updateResult = await updateConsolidatedDataEntryByProductSrNoAction(entryToDelete.productSrNo, {
          // Keep all tag entry fields but clear consumption fields
          srNo: entryToDelete.srNo,
          dcNo: entryToDelete.dcNo,
          dcDate: entryToDelete.dcDate,
          branch: entryToDelete.branch,
          bccdName: entryToDelete.bccdName,
          productDescription: entryToDelete.productDescription,
          productSrNo: entryToDelete.productSrNo,
          dateOfPurchase: entryToDelete.dateOfPurchase,
          complaintNo: entryToDelete.complaintNo,
          partCode: entryToDelete.partCode,
          natureOfDefect: entryToDelete.defect,
          visitingTechName: entryToDelete.visitingTechName,
          mfgMonthYear: entryToDelete.mfgMonthYear,
          pcbSrNo: entryToDelete.pcbSrNo,
          // Clear consumption fields
          repairDate: null,
          testing: null,
          failure: null,
          status: null,
          analysis: null,
          componentChange: null,
          enggName: null,
          dispatchDate: null,
          consumptionEntryBy: null,
          tagEntryBy: null,
        });
        
        if (!updateResult.success) {
          console.error('Failed to delete consumption data from database:', updateResult.error);
          alert('Error: Could not delete consumption data from database');
          return;
        }
      }
      
      // Update local state
      setTableData(prev => prev.filter(entry => entry.id !== selectedEntryId));
      setSelectedEntryId(null);
      handleClearForm();
      
      alert('Consumption entry deleted successfully!');
    } catch (error) {
      console.error('Error deleting consumption entry:', error);
      alert('Error: Could not delete consumption entry');
    }
  };

  const handleClearForm = () => {
    // Reset form data
    setFormData({
      repairDate: '',
      testing: '',
      failure: '',
      status: '',
      pcbSrNo: '',
      analysis: '',
      componentChange: '',
      enggName: engineerName || '',
      dispatchDate: '',
      validationResult: '',
    });

    // Reset workflow state
    setIsPcbFound(false);
    setPartCode('');
    setMfgMonthYear('');
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
      // For now, we'll just export consumption entries
      // In a real implementation, we would fetch tag entries from the database
      const exportData = {
        consumptionEntries,
        tagEntries: [] // Tag entries will be fetched from database in a real implementation
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

      analysis: entry.analysis,
      componentChange: entry.componentChange,
      enggName: entry.enggName || engineerName || '',
      dispatchDate: entry.dispatchDate,
      validationResult: entry.validationResult || '',
    });
    setSelectedEntryId(entry.id || null);
    // Set the search fields if they exist in the entry
    if (entry.srNo) setSrNo(entry.srNo);
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
    <div className="bg-white w-full flex flex-col flex-1 min-h-0">
      <div className="flex-1 flex flex-col min-h-0">
        {/* Find Section - Moved to the top */}
        <div className="bg-white rounded-md shadow-sm ">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Part Code</label>
              <select
                value={partCode}
                onChange={(e) => setPartCode(e.target.value)}
                className={`w-full p-1 text-sm border border-gray-300 rounded ${isPcbFound ? 'bg-gray-100' : ''} h-8`}
                disabled={isPcbFound}
              >
                <option value="">Select Part</option>
                {dcNumbers.flatMap(dc => dcPartCodes[dc] || [])
                  .filter((code, index, self) => code && code !== '' && self.indexOf(code) === index) // unique codes
                  .map((code, index) => (
                    <option key={`${code}-${index}`} value={code}>{code}</option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mfg Month/Year (MM/YYYY)</label>
              <input
                type="text"
                value={mfgMonthYear}
                onChange={(e) => setMfgMonthYear(e.target.value)}
                className={`w-full p-1 text-sm border border-gray-300 rounded h-8 ${isPcbFound ? 'bg-gray-100' : ''}`}
                placeholder="MM/YYYY"
                disabled={isPcbFound}
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-sm font-medium text-gray-700">Serial No.</label>
                <div className="flex space-x-1">
                  {/* <button
                    type="button"
                    onClick={() => handleSrNoIncrement()}
                    className="text-gray-700 hover:text-gray-900 px-1"
                    disabled={isPcbFound}
                  >
                    +
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSrNoDecrement()}
                    className="text-gray-700 hover:text-gray-900 px-1"
                    disabled={isPcbFound}
                  >
                    -
                  </button> */}
                </div>
              </div>
              <input
                type="text"
                value={srNo}
                onChange={(e) => setSrNo(e.target.value)}
                className={`w-full p-1 text-sm border border-gray-300 rounded ${isPcbFound ? 'bg-gray-100' : ''} h-8`}
                placeholder="Enter Serial No."
                disabled={isPcbFound}
              />
            </div>
            <div className="mt-2 flex justify-center items-center">
              <button
                onClick={handleFind}
                disabled={isSearching || isPcbFound}
                className={`px-3 py-1 text-sm rounded ${isSearching || isPcbFound
                  ? 'bg-gray-400 cursor-not-allowed text-gray-200'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
              >
                {isSearching ? 'Finding...' : 'Find PCB'}
              </button>
            </div>
          </div>

        </div>

        {/* Consumption Form */}
        <form onSubmit={handleConsume} className="bg-white rounded-md shadow-sm mb-2 flex-1 flex flex-col">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-2 mb-2 p-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Repair Date:</label>
              <input
                type="date"
                name="repairDate"
                value={formData.repairDate}
                onChange={handleChange}
                className="w-full p-1 text-sm border border-gray-300 rounded h-8"
                disabled={!isPcbFound}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Testing:</label>
              <select
                name="testing"
                value={formData.testing}
                onChange={handleChange}
                className="w-full p-1 text-sm border border-gray-300 rounded h-8"
                disabled={!isPcbFound}
              >
                <option value="">Select</option>
                <option value="PASS">PASS</option>
                <option value="FAIL">FAIL</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Failure:</label>
              <input
                type="text"
                name="failure"
                value={formData.failure}
                onChange={handleChange}
                className="w-full p-1 text-sm border border-gray-300 rounded h-8"
                placeholder="Enter failure details"
                disabled={!isPcbFound}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status:</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full p-1 text-sm border border-gray-300 rounded h-8"
                disabled={!isPcbFound}
              >
                <option value="">Select</option>
                <option value="OK">OK</option>
                <option value="NFF">NFF</option>
                <option value="SCRAP">SCRAP</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Engineer:</label>
              <EngineerName
                value={engineerName}
                onChange={(value) => onEngineerNameChange && onEngineerNameChange(value)}
                className="w-full p-1 text-sm border border-gray-300 rounded h-8"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Consumption Entry By:</label>
              <input
                type="text"
                value={user?.name || user?.email || ''}
                readOnly
                className="w-full p-1 text-sm border border-gray-300 rounded h-8 bg-gray-100"
              />
            </div>

          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Analysis:</label>
              <textarea
                name="analysis"
                value={formData.analysis} // Keep original text with / characters
                onChange={handleChange}
                rows={3}
                className="w-full p-1 text-sm border border-gray-300 rounded"
                disabled={!isPcbFound}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Component Change:</label>
              <textarea
                name="componentChange"
                value={formData.componentChange}
                onChange={handleChange}
                rows={3}
                className="w-full p-1 text-sm border border-gray-300 rounded"
                disabled={!isPcbFound}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Validation Result:</label>
              <textarea
                name="validationResult"
                value={validationResult}
                readOnly
                rows={3}
                className="w-full p-1 text-sm border border-gray-300 rounded bg-gray-100"
              />
            </div>
          </div>


          <div className="flex justify-end space-x-2 mt-auto">
            <button
              type="button"
              onClick={handleClear}
              className="px-3 py-1 text-sm bg-gray-500 hover:bg-gray-600 text-white rounded"
            >
              Clear
            </button>
            <button
              type="submit"
              disabled={!isPcbFound}
              className={`px-3 py-1 text-sm rounded ${isPcbFound
                ? 'bg-green-500 hover:bg-green-600 text-white'
                : 'bg-gray-400 cursor-not-allowed text-gray-200'
                }`}
            >
              Consume
            </button>
          </div>
        </form>

        {/* Excel-like Grid */}
        <div className="bg-white rounded-md shadow-sm mb-2 flex-1 overflow-hidden flex flex-col">
          <div className="overflow-x-auto flex-1 p-2">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-1 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Sr No</th>
                  <th className="px-2 py-1 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">DC No</th>
                  <th className="px-2 py-1 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">DC Date</th>
                  <th className="px-2 py-1 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Branch</th>
                  <th className="px-2 py-1 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">BCCD Name</th>
                  <th className="px-2 py-1 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Product Desc</th>
                  <th className="px-2 py-1 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Product Sr No</th>
                  <th className="px-2 py-1 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Date of Purchase</th>
                  <th className="px-2 py-1 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Complaint No</th>
                  <th className="px-2 py-1 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Part Code</th>
                  <th className="px-2 py-1 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Visiting Tech</th>
                  <th className="px-2 py-1 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Mfg Month/Year</th>
                  <th className="px-2 py-1 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Repair Date</th>
                  <th className="px-2 py-1 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Testing</th>
                  <th className="px-2 py-1 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Failure</th>
                  <th className="px-2 py-1 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-2 py-1 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">PCB Sr No</th>
                  <th className="px-2 py-1 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Analysis</th>
                  <th className="px-2 py-1 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Component Change</th>
                  <th className="px-2 py-1 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Engg Name</th>
                  <th className="px-2 py-1 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Dispatch Date</th>
                  <th className="px-2 py-1 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Validation Result</th>
                  <th className="px-2 py-1 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Tag Entry By</th>
                  <th className="px-2 py-1 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Consumption Entry By</th>
                  <th className="px-2 py-1 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Dispatch Entry By</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tableData.map((entry, index) => (
                  <tr
                    key={entry.id || `entry-${index}`}
                    className={`cursor-pointer ${selectedEntryId === entry.id ? 'bg-blue-100' : 'hover:bg-gray-50'}`}
                    onClick={() => {
                      console.log('Table row clicked - entry ID:', entry.id);
                      console.log('Entry data:', entry);
                      // Populate form with selected entry data
                      setFormData({
                        repairDate: entry.repairDate || '',
                        testing: entry.testing || '',
                        failure: entry.failure || '',
                        status: entry.status || '',
                        pcbSrNo: entry.pcbSrNo || '',
                                            
                        analysis: entry.analysis || '',
                        componentChange: entry.componentChange || '',
                        enggName: entry.enggName || '',
                        dispatchDate: entry.dispatchDate || '',
                        validationResult: entry.validationResult || '',
                      });
                      setSelectedEntryId(entry.id || null);
                      console.log('Set selectedEntryId to:', entry.id);
                    }}
                  >
                    <td className="px-2 py-1 whitespace-nowrap text-sm text-gray-800 font-medium">{entry.srNo}</td>
                    <td className="px-2 py-1 whitespace-nowrap text-sm text-gray-800">{entry.dcNo}</td>
                    <td className="px-2 py-1 whitespace-nowrap text-sm text-gray-800">{entry.dcDate}</td>
                    <td className="px-2 py-1 whitespace-nowrap text-sm text-gray-800">{entry.branch}</td>
                    <td className="px-2 py-1 whitespace-nowrap text-sm text-gray-800">{entry.bccdName}</td>
                    <td className="px-2 py-1 whitespace-nowrap text-sm text-gray-800">{entry.productDescription}</td>
                    <td className="px-2 py-1 whitespace-nowrap text-sm text-gray-800">{entry.productSrNo}</td>
                    <td className="px-2 py-1 whitespace-nowrap text-sm text-gray-800">{entry.dateOfPurchase}</td>
                    <td className="px-2 py-1 whitespace-nowrap text-sm text-gray-800">{entry.complaintNo}</td>
                    <td className="px-2 py-1 whitespace-nowrap text-sm text-gray-800">{entry.partCode}</td>
                    <td className="px-2 py-1 whitespace-nowrap text-sm text-gray-800">{entry.visitingTechName}</td>
                    <td className="px-2 py-1 whitespace-nowrap text-sm text-gray-800">{entry.mfgMonthYear}</td>
                    <td className="px-2 py-1 whitespace-nowrap text-sm text-gray-800">{entry.repairDate}</td>
                    <td className="px-2 py-1 whitespace-nowrap text-sm text-gray-800">{entry.testing}</td>
                    <td className="px-2 py-1 whitespace-nowrap text-sm text-gray-800">{entry.failure}</td>
                    <td className="px-2 py-1 whitespace-nowrap text-sm text-gray-800">{entry.status}</td>
                    <td className="px-2 py-1 whitespace-nowrap text-sm text-gray-800">{entry.pcbSrNo}</td>
                    <td className="px-2 py-1 whitespace-nowrap text-sm text-gray-800">{entry.analysis}</td>
                    <td className="px-2 py-1 whitespace-nowrap text-sm text-gray-800">{entry.componentChange}</td>
                    <td className="px-2 py-1 whitespace-nowrap text-sm text-gray-800">{entry.enggName}</td>
                    <td className="px-2 py-1 whitespace-nowrap text-sm text-gray-800">{entry.dispatchDate}</td>
                    <td className="px-2 py-1 whitespace-nowrap text-sm text-gray-800">{entry.validationResult}</td>
                    <td className="px-2 py-1 whitespace-nowrap text-sm text-gray-800">{entry.tagEntryBy}</td>
                    <td className="px-2 py-1 whitespace-nowrap text-sm text-gray-800">{entry.consumptionEntryBy}</td>
                    <td className="px-2 py-1 whitespace-nowrap text-sm text-gray-800">{entry.dispatchEntryBy}</td>
                  </tr>
                ))}
                {tableData.length === 0 && (
                  <tr>
                    <td colSpan={26} className="px-2 py-1 text-center text-sm text-gray-500">
                      No entries found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom Action Buttons */}
        <div className="flex justify-between items-center mb-2 p-2">
          <div className="flex space-x-2">
            {/* <button
              onClick={handleUpdate}
              disabled={!selectedEntryId}
              className={`px-3 py-1 text-sm rounded ${selectedEntryId
                ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                }`}
            >
              Update
            </button> */}
            <button
              onClick={handleDelete}
              disabled={!selectedEntryId}
              className={`px-3 py-1 text-sm rounded ${selectedEntryId
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
              className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Clear
            </button>
            <button
              onClick={async () => {
                // Call server action instead of importing pg-db directly
                const result = await fetch('/api/test-db', { method: 'POST' });
                const data = await result.json();
                alert(`Database test ${data.success ? 'PASSED' : 'FAILED'} - Check console for details`);
              }}
              className="px-3 py-1 text-sm bg-orange-500 text-white rounded hover:bg-orange-600"
            >
              Test DB
            </button>
            <button
              onClick={handleExportExcel}
              className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
            >
              Export Excel
            </button>
            <button
              onClick={handleLogout}
              className="px-3 py-1 text-sm bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
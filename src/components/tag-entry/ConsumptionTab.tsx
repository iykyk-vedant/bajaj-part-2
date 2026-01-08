'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useLockStore } from '@/store/lockStore';
import { LockButton } from './LockButton';
import { validateBomComponents, saveConsolidatedData, searchConsolidatedDataEntries } from '@/app/actions/consumption-actions';
import { getPcbNumberForDc } from '@/lib/pcb-utils';
import { EngineerName } from '@/components/ui/engineer-name';

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
  rfObservation: string;
  analysis: string;
  validationResult: string;
  componentChange: string;
  enggName: string;
  consumptionEntryBy?: string;
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

export function ConsumptionTab({ dcNumbers = ['DC001', 'DC002'], dcPartCodes = {}, engineerName = '', onEngineerNameChange }: ConsumptionTabProps) {
  const { isDcLocked } = useLockStore();
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
    rfObservation: '',
    analysis: '',
    validationResult: '',
    componentChange: '',
    enggName: engineerName || '',
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

  // Transform / to \n for display in Analysis field when showing in read-only contexts
  const displayAnalysisText = useMemo(
    () => formData.analysis.replaceAll('/', '\n'),
    [formData.analysis]
  );

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

  

  // Function to load data from database
  const loadAllData = async () => {
    try {
      // Load consumption entries from database
      const { getConsolidatedDataEntries } = await import('@/app/actions/consumption-actions');
      const result = await getConsolidatedDataEntries();
      let loadedConsumptionEntries: ConsumptionEntry[] = [];

      if (result.success) {
        const dbEntries = result.data || [];
        // Convert database entries to ConsumptionEntry format
        loadedConsumptionEntries = dbEntries.map((entry: any) => ({
          id: entry.id,
          srNo: entry.sr_no,
          dcNo: entry.dc_no,
          partCode: entry.part_code,
          repairDate: entry.repair_date || '',
          testing: entry.testing || '',
          failure: entry.failure || '',
          status: entry.status || '',
          pcbSrNo: entry.pcb_sr_no || '',
          rfObservation: entry.rf_observation || '',
          analysis: entry.analysis || '',
          validationResult: entry.validation_result || '',
          componentChange: entry.component_change || '',
          enggName: entry.engg_name || '',
          dispatchDate: entry.dispatch_date || '',
        }));
        
        setConsumptionEntries(loadedConsumptionEntries);
        
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
          dateOfPurchase: entry.date_of_purchase ? (typeof entry.date_of_purchase === 'string' ? entry.date_of_purchase : (entry.date_of_purchase && typeof entry.date_of_purchase === 'object' && 'toISOString' in entry.date_of_purchase ? (entry.date_of_purchase as Date).toISOString().split('T')[0] : new Date(entry.date_of_purchase).toISOString().split('T')[0])) : '',
          complaintNo: entry.complaint_no || '',
          partCode: entry.part_code || '',
          defect: entry.defect || '',
          visitingTechName: entry.visiting_tech_name || '',
          mfgMonthYear: entry.mfg_month_year ? (typeof entry.mfg_month_year === 'string' ? entry.mfg_month_year : (entry.mfg_month_year && typeof entry.mfg_month_year === 'object' && 'toISOString' in entry.mfg_month_year ? (entry.mfg_month_year as Date).toISOString().split('T')[0] : new Date(entry.mfg_month_year).toISOString().split('T')[0])) : '',
          // Consumption-specific fields
          repairDate: entry.repair_date ? (typeof entry.repair_date === 'string' ? entry.repair_date : (entry.repair_date && typeof entry.repair_date === 'object' && 'toISOString' in entry.repair_date ? (entry.repair_date as Date).toISOString().split('T')[0] : new Date(entry.repair_date).toISOString().split('T')[0])) : '',
          testing: entry.testing || '',
          failure: entry.failure || '',
          status: entry.status || '',
          pcbSrNo: entry.pcb_sr_no || '',
          rfObservation: entry.rf_observation || '',
          analysis: entry.analysis || '',
          validationResult: entry.validation_result || '',
          componentChange: entry.component_change || '',
          enggName: entry.engg_name || '',
          dispatchDate: entry.dispatch_date ? (typeof entry.dispatch_date === 'string' ? entry.dispatch_date : (entry.dispatch_date && typeof entry.dispatch_date === 'object' && 'toISOString' in entry.dispatch_date ? (entry.dispatch_date as Date).toISOString().split('T')[0] : new Date(entry.dispatch_date).toISOString().split('T')[0])) : '',
        }));
        
        setTableData(tableRows);
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

      // First, search for existing entries by pcbSrNo
      const { searchConsolidatedDataEntriesByPcb } = await import('@/app/actions/consumption-actions');
      const searchResult = await searchConsolidatedDataEntriesByPcb('', partCode, pcbSrNo);
      
      // Auto-populate form with fetched data
      if (searchResult.success && searchResult.data && searchResult.data.length > 0) {
        // If an existing entry is found, populate the form with its consumption data
        const existingEntry = searchResult.data[0];
        setFormData(prev => ({
          ...prev,
          pcbSrNo, // Use the same PCB serial number format as TagEntryForm
          repairDate: existingEntry.repair_date || new Date().toISOString().split('T')[0],
          testing: existingEntry.testing || 'PASS',
          failure: existingEntry.failure || '',
          status: existingEntry.status || 'OK',
          rfObservation: existingEntry.rf_observation || '',
          analysis: existingEntry.analysis || '',
          validationResult: existingEntry.validation_result || '',
          componentChange: existingEntry.component_change || '',
          enggName: existingEntry.engg_name || engineerName || '',
          dispatchDate: existingEntry.dispatch_date || '',
        }));
      } else {
        // If no existing entry is found, use default values
        setFormData(prev => ({
          ...prev,
          pcbSrNo, // Use the same PCB serial number format as TagEntryForm
          repairDate: new Date().toISOString().split('T')[0], // Today's date
          testing: 'PASS', // Default value
          status: 'OK', // Default value
        }));
      }
  
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
      
      // If analysis value is only spaces, clear both componentChange and validationResult
      if (!extractedValue.trim()) {
        setFormData(prev => ({
          ...prev,
          [name]: value,
          componentChange: '',
          validationResult: ''
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
    // If analysis text contains only spaces, clear validation result but keep componentChange as empty
    if (!analysisText.trim()) {
      // Clear validation field if analysis is empty
      setFormData(prev => ({
        ...prev,
        validationResult: ''
        // componentChange is already handled in handleChange
      }));
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
        
        setFormData(prev => ({
          ...prev,
          validationResult: cleanedResult
          // componentChange is handled in handleChange
        }));
      } else {
        // Handle validation error
        console.error('BOM validation error:', result.error);
        setFormData(prev => ({
          ...prev,
          validationResult: `Error: ${result.error || 'Failed to validate components'}`
          // componentChange is handled in handleChange
        }));
      }
    } catch (error) {
      console.error('Error validating BOM components:', error);
      setFormData(prev => ({
        ...prev,
        validationResult: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
        // componentChange is handled in handleChange
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

    // Save data when consuming
    try {
      // Combine tag entry data with consumption data
      const consolidatedData = {
        srNo: srNo,
        dcNo: '', // DC No is no longer used in PCB generation
        partCode: partCode,
        repairDate: formData.repairDate || null,
        testing: formData.testing || null,
        failure: formData.failure || null,
        status: formData.status || null,
        pcbSrNo: formData.pcbSrNo || null,
        rfObservation: formData.rfObservation || null,
        analysis: formData.analysis || null,
        validationResult: formData.validationResult || null,
        componentChange: formData.componentChange || null,
        enggName: engineerName || null, // Use engineer name from navigation tab
        consumptionEntryBy: formData.consumptionEntryBy || null, // New field for consumption entry
        dispatchDate: formData.dispatchDate || null,
      };

      // Find existing entry by PCB serial number and update it
      const { updateConsolidatedDataEntryByProductSrNoAction, searchConsolidatedDataEntriesByPcb, saveConsolidatedData, updateConsolidatedDataEntryAction } = await import('@/app/actions/consumption-actions');
      
      // First, we need to find the entry with the same pcbSrNo
      // Use the mfgMonthYear from the state
      const regeneratedPcbSrNo = getPcbNumberForDc(partCode, srNo, mfgMonthYear);
      const searchResult = await searchConsolidatedDataEntriesByPcb('', partCode, regeneratedPcbSrNo);
      
      if (searchResult.success && searchResult.data && searchResult.data.length > 0) {
        const existingEntry = searchResult.data[0];
        
        // Update the existing entry - prioritize updating by ID if available, otherwise by product_sr_no
        if (existingEntry.id) {
          const updateResult = await updateConsolidatedDataEntryAction(existingEntry.id, {
            // Use existing tag entry fields from the database, fallback to form values if needed
            srNo: existingEntry.sr_no || srNo,
            dcNo: existingEntry.dc_no || '',
            branch: existingEntry.branch || '',
            bccdName: existingEntry.bccd_name || '',
            productDescription: existingEntry.product_description || '',
            productSrNo: existingEntry.product_sr_no || srNo,
            dateOfPurchase: existingEntry.date_of_purchase || '',
            complaintNo: existingEntry.complaint_no || '',
            partCode: existingEntry.part_code || '',
            natureOfDefect: existingEntry.nature_of_defect || '',
            visitingTechName: existingEntry.visiting_tech_name || '',
            mfgMonthYear: existingEntry.mfg_month_year || '',
            // Update consumption fields
            repairDate: consolidatedData.repairDate,
            testing: consolidatedData.testing,
            failure: consolidatedData.failure,
            status: consolidatedData.status,
            pcbSrNo: consolidatedData.pcbSrNo,
            rfObservation: consolidatedData.rfObservation,
            analysis: consolidatedData.analysis,
            validationResult: consolidatedData.validationResult,
            componentChange: consolidatedData.componentChange,
            enggName: consolidatedData.enggName,
            dispatchDate: consolidatedData.dispatchDate,
          });
          
          if (!updateResult.success) {
            console.error('Error updating existing consolidated data entry:', updateResult.error);
            alert('Error updating existing entry. Please try again.');
            return;
          }
        } else if (existingEntry.product_sr_no) {
          // Fallback to update by product_sr_no if no ID available
          const updateResult = await updateConsolidatedDataEntryByProductSrNoAction(existingEntry.product_sr_no, {
            // Map consolidatedData fields to database column names
            srNo: existingEntry.sr_no || srNo,
            dcNo: existingEntry.dc_no || '',
            branch: existingEntry.branch || '',
            bccdName: existingEntry.bccd_name || '',
            productDescription: existingEntry.product_description || '',
            productSrNo: existingEntry.product_sr_no || srNo,
            dateOfPurchase: existingEntry.date_of_purchase || '',
            complaintNo: existingEntry.complaint_no || '',
            partCode: existingEntry.part_code || '',
            natureOfDefect: existingEntry.nature_of_defect || '',
            visitingTechName: existingEntry.visiting_tech_name || '',
            mfgMonthYear: existingEntry.mfg_month_year || '',
            // Consumption fields
            repairDate: consolidatedData.repairDate,
            testing: consolidatedData.testing,
            failure: consolidatedData.failure,
            status: consolidatedData.status,
            pcbSrNo: consolidatedData.pcbSrNo,
            rfObservation: consolidatedData.rfObservation,
            analysis: consolidatedData.analysis,
            validationResult: consolidatedData.validationResult,
            componentChange: consolidatedData.componentChange,
            enggName: consolidatedData.enggName,
            dispatchDate: consolidatedData.dispatchDate,
          });
          
          if (!updateResult.success) {
            console.error('Error updating consolidated data by product_sr_no:', updateResult.error);
            alert('Error updating existing entry. Please try again.');
            return;
          }
        }
      } else {
        // If no existing entry found, save a new entry
        const saveResult = await saveConsolidatedData(consolidatedData);
        if (!saveResult.success) {
          console.error('Error saving consolidated data:', saveResult.error);
          alert('Error saving new entry. Please try again.');
          return;
        }
      }

      // Refresh all data to show the updated entry
      await loadAllData();
      
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
        entry.id === selectedEntryId ? { ...formData, id: selectedEntryId, srNo: srNo, dcNo: '', partCode: partCode } : entry
      )
    );

    // Also update consolidated data table
    try {
      // Combine tag entry data with consumption data
      const consolidatedData = {
        srNo: srNo,
        dcNo: '', // DC No is no longer used in PCB generation
        partCode: partCode,
        repairDate: formData.repairDate || null,
        testing: formData.testing || null,
        failure: formData.failure || null,
        status: formData.status || null,
        pcbSrNo: formData.pcbSrNo || null,
        rfObservation: formData.rfObservation || null,
        analysis: formData.analysis || null,
        validationResult: formData.validationResult || null,
        componentChange: formData.componentChange || null,
        enggName: engineerName || null, // Use engineer name from navigation tab
        dispatchDate: formData.dispatchDate || null,
      };

      // Find existing entry by PCB serial number and update it
      const { updateConsolidatedDataEntryByProductSrNoAction, searchConsolidatedDataEntriesByPcb, saveConsolidatedData, updateConsolidatedDataEntryAction } = await import('@/app/actions/consumption-actions');
      
      // First, we need to find the entry with the same pcbSrNo
      const searchResult = await searchConsolidatedDataEntriesByPcb('', partCode, formData.pcbSrNo);
      
      if (searchResult.success && searchResult.data && searchResult.data.length > 0) {
        const existingEntry = searchResult.data[0];
        
        // Update the existing entry - prioritize updating by ID if available, otherwise by product_sr_no
        if (existingEntry.id) {
          const updateResult = await updateConsolidatedDataEntryAction(existingEntry.id, {
            // Use existing tag entry fields from the database, fallback to form values if needed
            srNo: existingEntry.sr_no || srNo,
            dcNo: existingEntry.dc_no || '',
            branch: existingEntry.branch || '',
            bccdName: existingEntry.bccd_name || '',
            productDescription: existingEntry.product_description || '',
            productSrNo: existingEntry.product_sr_no || srNo,
            dateOfPurchase: existingEntry.date_of_purchase || '',
            complaintNo: existingEntry.complaint_no || '',
            partCode: existingEntry.part_code || '',
            natureOfDefect: existingEntry.nature_of_defect || '',
            visitingTechName: existingEntry.visiting_tech_name || '',
            mfgMonthYear: existingEntry.mfg_month_year || '',
            // Update consumption fields
            repairDate: consolidatedData.repairDate,
            testing: consolidatedData.testing,
            failure: consolidatedData.failure,
            status: consolidatedData.status,
            pcbSrNo: consolidatedData.pcbSrNo,
            rfObservation: consolidatedData.rfObservation,
            analysis: consolidatedData.analysis,
            validationResult: consolidatedData.validationResult,
            componentChange: consolidatedData.componentChange,
            enggName: consolidatedData.enggName,
            dispatchDate: consolidatedData.dispatchDate,
          });
          
          if (!updateResult.success) {
            console.error('Error updating existing consolidated data entry:', updateResult.error);
            alert('Error updating existing entry. Please try again.');
            return;
          }
        } else if (existingEntry.product_sr_no) {
          // Fallback to update by product_sr_no if no ID available
          const updateResult = await updateConsolidatedDataEntryByProductSrNoAction(existingEntry.product_sr_no, {
            // Map consolidatedData fields to database column names
            srNo: existingEntry.sr_no || srNo,
            dcNo: existingEntry.dc_no || '',
            branch: existingEntry.branch || '',
            bccdName: existingEntry.bccd_name || '',
            productDescription: existingEntry.product_description || '',
            productSrNo: existingEntry.product_sr_no || srNo,
            dateOfPurchase: existingEntry.date_of_purchase || '',
            complaintNo: existingEntry.complaint_no || '',
            partCode: existingEntry.part_code || '',
            natureOfDefect: existingEntry.nature_of_defect || '',
            visitingTechName: existingEntry.visiting_tech_name || '',
            mfgMonthYear: existingEntry.mfg_month_year || '',
            // Consumption fields
            repairDate: consolidatedData.repairDate,
            testing: consolidatedData.testing,
            failure: consolidatedData.failure,
            status: consolidatedData.status,
            pcbSrNo: consolidatedData.pcbSrNo,
            rfObservation: consolidatedData.rfObservation,
            analysis: consolidatedData.analysis,
            validationResult: consolidatedData.validationResult,
            componentChange: consolidatedData.componentChange,
            enggName: consolidatedData.enggName,
            dispatchDate: consolidatedData.dispatchDate,
          });
          
          if (!updateResult.success) {
            console.error('Error updating consolidated data by product_sr_no:', updateResult.error);
            alert('Error updating existing entry. Please try again.');
            return;
          }
        }
      } else {
        // If no existing entry found, save a new entry
        const saveResult = await saveConsolidatedData(consolidatedData);
        if (!saveResult.success) {
          console.error('Error saving consolidated data:', saveResult.error);
          alert('Error saving new entry. Please try again.');
          return;
        }
      }
    } catch (error) {
      console.error('Error updating consolidated data:', error);
    }
    
    // Refresh all data to show the updated entry
    try {
      await loadAllData();
    } catch (error) {
      console.error('Error refreshing all data after update:', error);
    }

    alert('Consumption entry updated successfully!');
  }, [selectedEntryId, formData, srNo, partCode, mfgMonthYear, engineerName]);

  const handleDelete = async () => {
    if (!selectedEntryId) {
      alert('Please select an entry to delete.');
      return;
    }

    if (!confirm('Are you sure you want to delete this entry?')) {
      return;
    }

    try {
      // Delete from database
      const { deleteConsolidatedDataEntryAction } = await import('@/app/actions/consumption-actions');
      const deleteResult = await deleteConsolidatedDataEntryAction(selectedEntryId);
      
      if (!deleteResult.success) {
        console.error('Error deleting consolidated data entry:', deleteResult.error);
        alert('Error deleting entry. Please try again.');
        return;
      }
      
      setConsumptionEntries(prev => prev.filter(entry => entry.id !== selectedEntryId));
      setSelectedEntryId(null);
      handleClearForm();
      
      // Refresh all data to show the updated entries
      await loadAllData();
      
      alert('Consumption entry deleted successfully!');
    } catch (error) {
      console.error('Error deleting consolidated data entry:', error);
      alert('Error deleting entry. Please try again.');
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
      rfObservation: '',
      analysis: '',
      validationResult: '',
      componentChange: '',
      enggName: engineerName || '',
      dispatchDate: '',
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
      rfObservation: entry.rfObservation,
      analysis: entry.analysis,
      validationResult: entry.validationResult,
      componentChange: entry.componentChange,
      enggName: entry.enggName || engineerName || '',
      dispatchDate: entry.dispatchDate,
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
              <select
                name="failure"
                value={formData.failure}
                onChange={handleChange}
                className="w-full p-1 text-sm border border-gray-300 rounded h-8"
                disabled={!isPcbFound}
              >
                <option value="">Select</option>
                <option value="Component">Component</option>
                <option value="Soldering">Soldering</option>
                <option value="Design">Design</option>
              </select>
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
              <EngineerName
                value={formData.consumptionEntryBy || ''}
                onChange={(value) => setFormData(prev => ({...prev, consumptionEntryBy: value}))}
                className="w-full p-1 text-sm border border-gray-300 rounded h-8"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Validation Result:</label>
              <textarea
                name="validationResult"
                value={formData.validationResult} // Show actual BOM validation result
                readOnly
                rows={3}
                className="w-full p-1 text-sm border border-gray-300 rounded bg-gray-100"
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
                  {/* <th className="px-2 py-1 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">RF Observation</th> */}
                  <th className="px-2 py-1 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Analysis</th>
                  {/* <th className="px-2 py-1 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Validation Result</th> */}
                  <th className="px-2 py-1 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Component Change</th>
                  <th className="px-2 py-1 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Engg Name</th>
                  <th className="px-2 py-1 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Dispatch Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tableData.map((entry, index) => (
                  <tr
                    key={entry.id || `entry-${index}`}
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
                    {/* <td className="px-2 py-1 whitespace-nowrap text-sm text-gray-800">{entry.rfObservation}</td> */}
                    <td className="px-2 py-1 whitespace-nowrap text-sm text-gray-800">{entry.analysis}</td>
                    <td className="px-2 py-1 whitespace-nowrap text-sm text-gray-800">{entry.validationResult}</td>
                    <td className="px-2 py-1 whitespace-nowrap text-sm text-gray-800">{entry.componentChange}</td>
                    <td className="px-2 py-1 whitespace-nowrap text-sm text-gray-800">{entry.enggName}</td>
                    <td className="px-2 py-1 whitespace-nowrap text-sm text-gray-800">{entry.dispatchDate}</td>
                  </tr>
                ))}
                {tableData.length === 0 && (
                  <tr>
                    <td colSpan={23} className="px-2 py-1 text-center text-sm text-gray-500">
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
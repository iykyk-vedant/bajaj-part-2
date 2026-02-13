'use client';

import { useState, useEffect } from 'react';
import { searchConsolidatedDataEntriesByPcb } from '@/app/actions/consumption-actions';
import { exportTagEntriesToExcel } from '@/lib/tag-entry/export-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useLockStore } from '@/store/lockStore';
import { LockButton } from '@/components/tag-entry/LockButton';
import { EngineerName } from '@/components/ui/engineer-name-db';
import { useAuth } from '@/contexts/AuthContext';

interface DispatchTabProps {
  dcNumbers: string[];
  dcPartCodes: Record<string, string[]>;
  onExportExcel?: (dcNo?: string) => void;
}

interface DispatchFormData {
  id?: string;
  srNo: string;
  dcNo: string;
  dcDate?: string;
  branch: string;
  bccdName: string;
  productDescription: string;
  productSrNo: string;
  dateOfPurchase?: string;
  complaintNo: string;
  partCode: string;
  natureOfDefect: string;
  visitingTechName: string;
  mfgMonthYear: string;
  repairDate?: string;
  testing: string;
  failure: string;
  status: string;
  pcbSrNo: string;
  rfObservation?: string;
  analysis: string;
  componentChange: string;
  enggName: string;
  validationResult?: string;
  dispatchEntryBy?: string;
  dispatchDate?: string;
}

export function DispatchTab({ dcNumbers = [], dcPartCodes = {}, onExportExcel }: DispatchTabProps) {
  const { isDcLocked } = useLockStore();
  const { toast } = useToast();
  const { user } = useAuth();
  const [dcNo, setDcNo] = useState('');
  const [partCode, setPartCode] = useState('');
  const [mfgMonthYear, setMfgMonthYear] = useState('');
  const [srNo, setSrNo] = useState('');
  const [dispatchDate, setDispatchDate] = useState('');
  const [isPcbFound, setIsPcbFound] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<DispatchFormData | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedDcForExport, setSelectedDcForExport] = useState('');

  // Removed srNo increment/decrement functions since we're not using srNo for search

  const handleFind = async () => {
    const isFullPcbSrNo = srNo.trim().toUpperCase().startsWith('ES');

    if (!isFullPcbSrNo && (!partCode || !mfgMonthYear || !srNo)) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please fill in all search fields: Part Code, Mfg Month/Year, and Serial No.'
      });
      return;
    }

    setIsSearching(true);



    try {
      let pcbSrNo = '';

      if (isFullPcbSrNo) {
        pcbSrNo = srNo.trim().toUpperCase();
      } else {
        // Use local generation to be 100% sure of logic
        pcbSrNo = generatePcbLocal(partCode, srNo, mfgMonthYear);
      }

      // DEBUG: Show what we are searching for
      console.log('Searching for PCB (Local):', pcbSrNo, 'Params:', { partCode, srNo, mfgMonthYear });
      if (!isFullPcbSrNo) {
        toast({
          title: `Debug: ${mfgMonthYear} -> ${pcbSrNo}`,
          description: `Params: Code=${partCode}, Sr=${srNo}, Date=${mfgMonthYear}`
        });
      }

      // Use searchConsolidatedDataEntriesByPcb to search by PCB serial number
      // If we have a full PCB Sr No, we ignore the partCode selection to avoid mismatch if user selected wrong part code
      const result = await searchConsolidatedDataEntriesByPcb('', isFullPcbSrNo ? '' : partCode, pcbSrNo);

      if (result.success) {
        const entries = result.data || [];

        if (entries.length === 0) {
          toast({
            variant: 'destructive',
            title: 'No Results',
            description: 'No PCB found matching the provided PCB Serial Number.'
          });
          setIsPcbFound(false);
          setSearchResults([]);
          setSelectedEntry(null);
        } else if (entries.length === 1) {
          // If only one result, select it automatically
          const entry = entries[0];
          const formData: DispatchFormData = {
            id: entry.id,
            srNo: entry.sr_no || '',
            dcNo: entry.dc_no || '',
            dcDate: entry.dc_date ? (typeof entry.dc_date === 'string' ? entry.dc_date : (entry.dc_date && typeof entry.dc_date === 'object' && 'toISOString' in entry.dc_date ? (entry.dc_date as Date).toISOString().split('T')[0] : new Date(entry.dc_date).toISOString().split('T')[0])) : '',
            branch: entry.branch || '',
            bccdName: entry.bccd_name || '',
            productDescription: entry.product_description || '',
            productSrNo: entry.product_sr_no || '',
            dateOfPurchase: entry.date_of_purchase ? (typeof entry.date_of_purchase === 'string' ? entry.date_of_purchase : (entry.date_of_purchase && typeof entry.date_of_purchase === 'object' && 'toISOString' in entry.date_of_purchase ? (entry.date_of_purchase as Date).toISOString().split('T')[0] : new Date(entry.date_of_purchase).toISOString().split('T')[0])) : '',
            complaintNo: entry.complaint_no || '',
            partCode: entry.part_code || '',
            natureOfDefect: entry.nature_of_defect || '',
            visitingTechName: entry.visiting_tech_name || '',
            mfgMonthYear: entry.mfg_month_year ? (typeof entry.mfg_month_year === 'string' ? entry.mfg_month_year : (entry.mfg_month_year && typeof entry.mfg_month_year === 'object' && 'toISOString' in entry.mfg_month_year ? (entry.mfg_month_year as Date).toISOString().split('T')[0] : new Date(entry.mfg_month_year).toISOString().split('T')[0])) : '',
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
            dispatchEntryBy: user?.name || user?.email || '',
          };

          setSelectedEntry(formData);
          setIsPcbFound(true);
          setSearchResults(entries);

          toast({
            title: 'PCB Found',
            description: 'PCB information loaded successfully.'
          });
        } else {
          // Multiple results found, show all in search results
          setSearchResults(entries);
          setIsPcbFound(false);
          setSelectedEntry(null);

          toast({
            title: 'Multiple Results Found',
            description: `Found ${entries.length} PCBs matching your criteria.`
          });
        }
      } else {
        toast({
          variant: 'destructive',
          title: 'Search Failed',
          description: result.error || 'Failed to search for PCB'
        });
      }
    } catch (error) {
      console.error('Error searching for PCB:', error);
      toast({
        variant: 'destructive',
        title: 'Search Failed',
        description: 'An error occurred while searching for PCB'
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSave = async () => {
    if (!selectedEntry) {
      toast({
        variant: 'destructive',
        title: 'No Entry Selected',
        description: 'Please find a PCB first before saving.'
      });
      return;
    }

    // Update dispatch date and set dispatchEntryBy with the logged-in user's name
    const updatedEntry = {
      ...selectedEntry,
      dispatchDate: dispatchDate || selectedEntry.dispatchDate || new Date().toISOString().split('T')[0], // Use the form value, or selected entry value, or current date if not provided
      dispatchEntryBy: user?.name || user?.email || '' // Always use user's name or email
    };

    try {
      // For dispatch, we'll update the existing entry by product_sr_no to preserve all previous data and add dispatch data
      // Import the update function by product_sr_no
      const { updateConsolidatedDataEntryByProductSrNoAction } = await import('@/app/actions/consumption-actions');

      // Update the entry by product_sr_no to preserve all previous data and add dispatch data
      const result = await updateConsolidatedDataEntryByProductSrNoAction(updatedEntry.productSrNo, updatedEntry);

      if (result.success) {
        toast({
          title: 'Dispatch Saved',
          description: 'Dispatch information saved successfully.'
        });

        // Clear fields except DC No and Part Code for next entry
        setMfgMonthYear('');
        setSrNo('');
        setIsPcbFound(false);
        setSearchResults([]);
        setSelectedEntry(null);
      } else {
        toast({
          variant: 'destructive',
          title: 'Save Failed',
          description: result.error || 'Failed to save dispatch information'
        });
      }
    } catch (error) {
      console.error('Error saving dispatch information:', error);
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: 'An error occurred while saving dispatch information'
      });
    }
  };

  const handleSelectResult = (entry: any) => {
    const formData: DispatchFormData = {
      id: entry.id,
      srNo: entry.sr_no || '',
      dcNo: entry.dc_no || '',
      dcDate: entry.dc_date ? (typeof entry.dc_date === 'string' ? entry.dc_date : (entry.dc_date && typeof entry.dc_date === 'object' && 'toISOString' in entry.dc_date ? (entry.dc_date as Date).toISOString().split('T')[0] : new Date(entry.dc_date).toISOString().split('T')[0])) : '',
      branch: entry.branch || '',
      bccdName: entry.bccd_name || '',
      productDescription: entry.product_description || '',
      productSrNo: entry.product_sr_no || '',
      dateOfPurchase: entry.date_of_purchase ? (typeof entry.date_of_purchase === 'string' ? entry.date_of_purchase : (entry.date_of_purchase && typeof entry.date_of_purchase === 'object' && 'toISOString' in entry.date_of_purchase ? (entry.date_of_purchase as Date).toISOString().split('T')[0] : new Date(entry.date_of_purchase).toISOString().split('T')[0])) : '',
      complaintNo: entry.complaint_no || '',
      partCode: entry.part_code || '',
      natureOfDefect: entry.nature_of_defect || '',
      visitingTechName: entry.visiting_tech_name || '',
      mfgMonthYear: entry.mfg_month_year ? (typeof entry.mfg_month_year === 'string' ? entry.mfg_month_year : (entry.mfg_month_year && typeof entry.mfg_month_year === 'object' && 'toISOString' in entry.mfg_month_year ? (entry.mfg_month_year as Date).toISOString().split('T')[0] : new Date(entry.mfg_month_year).toISOString().split('T')[0])) : '',
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
      dispatchEntryBy: user?.name || user?.email || '',
    };

    setSelectedEntry(formData);
    setIsPcbFound(true);
    setSearchResults([entry]);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (selectedEntry) {
      setSelectedEntry({
        ...selectedEntry,
        [name]: value
      });

      // Update dispatchDate state if dispatchDate field is changed
      if (name === 'dispatchDate') {
        setDispatchDate(value);
      }
    }
  };

  // Reset form when search criteria change
  useEffect(() => {
    if (partCode || mfgMonthYear || srNo) {
      setIsPcbFound(false);
      setSelectedEntry(null);
      setSearchResults([]);
    }
  }, [partCode, mfgMonthYear, srNo]);

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

  return (
    <div className="bg-white rounded-md shadow-sm flex flex-col h-full">
      <div className="flex justify-between items-center ">
        <h2 className="text-lg font-bold text-gray-800">Dispatch PCB</h2>
        <div className="flex gap-2">
          <select
            value={selectedDcForExport}
            onChange={(e) => setSelectedDcForExport(e.target.value)}
            className="p-2 text-sm border border-gray-300 rounded h-10"
          >
            <option value="">All DC Numbers</option>
            {dcNumbers
              .filter(dc => dc != null && dc !== '')
              .map((dc, index) => (
                <option key={`export-${dc}-${index}`} value={dc}>{dc}</option>
              ))}
          </select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (onExportExcel) {
                onExportExcel(selectedDcForExport || undefined);
              } else {
                exportTagEntriesToExcel(selectedDcForExport || undefined);
              }
            }}
            className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded flex items-center gap-2 text-sm"
          >
            Export Excel
          </Button>
        </div>
      </div>

      {/* Search Section - Standardized Grid */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-3">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider">DC No.</label>
            <div className="flex gap-2">
              <select
                value={isDcLocked ? useLockStore.getState().lockedDcNo : dcNo}
                onChange={(e) => setDcNo(e.target.value)}
                disabled={isDcLocked || isPcbFound}
                className={`w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 transition-all h-9 ${isDcLocked || isPcbFound ? 'bg-gray-50 text-gray-500' : 'bg-white'}`}
              >
                <option value="">Select DC No.</option>
                {dcNumbers
                  .filter(dc => dc != null && dc !== '')
                  .map((dc, index) => (
                    <option key={`${dc}-${index}`} value={dc}>{dc}</option>
                  ))}
              </select>
              <LockButton dcNo={dcNo} partCode={partCode} />
            </div>
          </div>
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Part Code</label>
            <select
              value={isDcLocked ? useLockStore.getState().lockedPartCode : partCode}
              onChange={(e) => setPartCode(e.target.value)}
              disabled={isDcLocked || isPcbFound}
              className={`w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 transition-all h-9 ${isDcLocked || isPcbFound ? 'bg-gray-50 text-gray-500' : 'bg-white'}`}
            >
              <option value="">Select Part Code</option>
              {(dcPartCodes[dcNo] || [])
                .filter(code => code != null && code !== '')
                .map((code, index) => (
                  <option key={`${code}-${index}`} value={code}>{code}</option>
                ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Mfg Month/Year</label>
            <input
              type="text"
              value={mfgMonthYear}
              onChange={(e) => setMfgMonthYear(e.target.value)}
              className={`w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 transition-all h-9 ${isPcbFound ? 'bg-gray-50 text-gray-500' : 'bg-white'}`}
              placeholder="MM/YYYY"
              disabled={isPcbFound}
            />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Serial No.</label>
              <div className="flex space-x-1">
                <button
                  type="button"
                  onClick={() => handleSrNoIncrement()}
                  className="text-gray-400 hover:text-gray-600 px-1 text-xs"
                  disabled={isPcbFound}
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={() => handleSrNoDecrement()}
                  className="text-gray-400 hover:text-gray-600 px-1 text-xs"
                  disabled={isPcbFound}
                >
                  -
                </button>
              </div>
            </div>
            <input
              type="text"
              value={srNo}
              onChange={(e) => setSrNo(e.target.value)}
              className={`w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 transition-all h-9 ${isPcbFound ? 'bg-gray-50 text-gray-500' : 'bg-white'}`}
              placeholder="Enter Serial No."
              disabled={isPcbFound}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleFind}
              disabled={isSearching || isPcbFound}
              className={`flex-1 px-4 py-1.5 text-xs font-semibold rounded-md shadow-sm h-9 transition-all ${isSearching || isPcbFound
                ? 'bg-gray-200 cursor-not-allowed text-gray-400'
                : 'bg-blue-600 hover:bg-blue-700 text-white active:scale-95'
                }`}
            >
              {isSearching ? 'Finding...' : 'Find PCB'}
            </button>
          </div>
        </div>
      </div>

      {/* Search Results */}
      {searchResults.length > 1 && !isPcbFound && (
        <div className="mb-6 bg-gray-50 p-4 rounded-md">
          <h3 className="font-medium text-gray-800 mb-2">Search Results ({searchResults.length})</h3>
          <div className="max-h-40 overflow-y-auto">
            {searchResults.map((entry, index) => (
              <div
                key={entry.id || index}
                className="p-2 border-b border-gray-200 hover:bg-blue-50 cursor-pointer"
                onClick={() => handleSelectResult(entry)}
              >
                <div className="flex justify-between">
                  <span>DC: {entry.dc_no} | Part: {entry.part_code} | PCB: {entry.pcb_sr_no}</span> {/* Changed display text */}
                  <span className="text-xs text-gray-500">Click to select</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PCB Information Form - Show only if a PCB is found */}
      {isPcbFound && selectedEntry && (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto pr-1 space-y-4">
            {/* Tag Entry Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
              <h4 className="text-[12px] font-bold text-blue-600 uppercase tracking-widest mb-4 border-b pb-1">Tag Entry Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Sr No</label>
                  <input
                    name="srNo"
                    value={selectedEntry.srNo}
                    readOnly
                    className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-md bg-gray-50 text-gray-500 h-9 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider">DC No</label>
                  <input
                    name="dcNo"
                    value={selectedEntry.dcNo}
                    readOnly
                    className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-md bg-gray-50 text-gray-500 h-9 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Branch</label>
                  <input
                    name="branch"
                    value={selectedEntry.branch}
                    onChange={handleChange}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 h-9 transition-all bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider">BCCD Name</label>
                  <input
                    name="bccdName"
                    value={selectedEntry.bccdName}
                    onChange={handleChange}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 h-9 transition-all bg-white"
                  />
                </div>
                <div className="md:col-span-2 space-y-1">
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Product Description</label>
                  <input
                    name="productDescription"
                    value={selectedEntry.productDescription}
                    onChange={handleChange}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 h-9 transition-all bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Product Sr No</label>
                  <input
                    name="productSrNo"
                    value={selectedEntry.productSrNo}
                    readOnly
                    className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-md bg-gray-50 text-gray-500 h-9 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Date of Purchase</label>
                  <input
                    name="dateOfPurchase"
                    type="date"
                    value={selectedEntry.dateOfPurchase}
                    onChange={handleChange}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 h-9 transition-all bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Complaint No</label>
                  <input
                    name="complaintNo"
                    value={selectedEntry.complaintNo}
                    onChange={handleChange}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 h-9 transition-all bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Part Code</label>
                  <input
                    name="partCode"
                    value={selectedEntry.partCode}
                    readOnly
                    className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-md bg-gray-50 text-gray-500 h-9 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Nature of Defect</label>
                  <input
                    name="natureOfDefect"
                    value={selectedEntry.natureOfDefect}
                    onChange={handleChange}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 h-9 transition-all bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Mfg Month/Year</label>
                  <input
                    name="mfgMonthYear"
                    value={selectedEntry.mfgMonthYear}
                    onChange={handleChange}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 h-9 transition-all bg-white"
                  />
                </div>
              </div>
            </div>
            {/* Consumption Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
              <h4 className="text-[12px] font-bold text-green-600 uppercase tracking-widest mb-4 border-b pb-1">Consumption Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Repair Date</label>
                  <input
                    name="repairDate"
                    type="date"
                    value={selectedEntry.repairDate}
                    onChange={handleChange}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 h-9 transition-all bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Testing</label>
                  <input
                    name="testing"
                    value={selectedEntry.testing}
                    onChange={handleChange}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 h-9 transition-all bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Failure</label>
                  <input
                    name="failure"
                    value={selectedEntry.failure}
                    onChange={handleChange}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 h-9 transition-all bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Status</label>
                  <input
                    name="status"
                    value={selectedEntry.status}
                    onChange={handleChange}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 h-9 transition-all bg-white"
                  />
                </div>
                <div className="md:col-span-2 space-y-1">
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider">PCB Sr No</label>
                  <input
                    name="pcbSrNo"
                    value={selectedEntry.pcbSrNo}
                    readOnly
                    className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-md bg-gray-50 text-gray-500 h-9 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Engineer Name</label>
                  <EngineerName
                    value={selectedEntry.enggName}
                    onChange={(value) => {
                      if (selectedEntry) {
                        setSelectedEntry({
                          ...selectedEntry,
                          enggName: value
                        });
                      }
                    }}
                    className="w-full"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Validation Result</label>
                  <textarea
                    name="validationResult"
                    value={selectedEntry.validationResult}
                    onChange={handleChange}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 transition-all bg-white"
                    rows={2}
                  />
                </div>
                <div className="md:col-span-2 space-y-1">
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Component Change</label>
                  <textarea
                    name="componentChange"
                    value={selectedEntry.componentChange}
                    onChange={handleChange}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 transition-all bg-white"
                    rows={2}
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Dispatch Entry By</label>
                  <input
                    type="text"
                    value={user?.name || user?.email || ''}
                    readOnly
                    className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-md bg-gray-50 text-gray-500 h-9"
                  />
                </div>
              </div>
            </div>

            {/* Dispatch Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
              <h4 className="text-[12px] font-bold text-amber-600 uppercase tracking-widest mb-4 border-b pb-1">Dispatch Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Dispatch Date</label>
                  <input
                    name="dispatchDate"
                    type="date"
                    value={dispatchDate || selectedEntry.dispatchDate || ''}
                    onChange={handleChange}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 h-9 transition-all bg-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="mt-4 flex justify-center pb-2">
            <button
              onClick={handleSave}
              className="px-10 py-2 text-sm font-bold bg-green-600 text-white rounded-md hover:bg-green-700 transition-all shadow-md active:scale-95"
            >
              Update Dispatch Data
            </button>
          </div>
        </div>
      )}

      {/* Message when no PCB is found */}
      {!isPcbFound && searchResults.length === 0 && (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          <p>Find a PCB to view and edit its information</p>
        </div>
      )}
    </div>
  );
}

// Local helper for debugging to rule out import issues
const generatePcbLocal = (pCode: string, sNo: string, dateStr: string) => {
  try {
    const cleanPartCode = pCode.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    const partCodeSegment = cleanPartCode.substring(0, 7).padEnd(7, '0');

    let monthCode = 'A';
    let year = '26'; // Default to current year if fails

    if (dateStr) {
      let dateObj: Date | null = null;
      if (dateStr.includes('/')) {
        const [month, yearStr] = dateStr.split('/');
        dateObj = new Date(parseInt(yearStr), parseInt(month) - 1, 1);
      } else if (dateStr.includes('-')) {
        const [yearStr, month] = dateStr.split('-');
        dateObj = new Date(parseInt(yearStr), parseInt(month) - 1, 1);
      }

      if (dateObj && !isNaN(dateObj.getTime())) {
        const codes = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
        monthCode = codes[dateObj.getMonth()] ?? 'A';
        year = String(dateObj.getFullYear()).slice(-2);
      }
    }

    const srNum = parseInt(sNo, 10);
    const identifier = isNaN(srNum) ? '00001' : String(srNum).padStart(5, '0');

    return `ES${partCodeSegment}${monthCode}${year}${identifier}`;
  } catch (e) {
    console.error('Local gen error:', e);
    return 'ERROR';
  }
};
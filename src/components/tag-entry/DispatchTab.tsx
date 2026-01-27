'use client';

import { useState, useEffect } from 'react';
import { searchConsolidatedDataEntries, searchConsolidatedDataEntriesByPcb } from '@/app/actions/consumption-actions';
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
    if (!partCode || !mfgMonthYear || !srNo) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please fill in all search fields: Part Code, Mfg Month/Year, and Serial No.'
      });
      return;
    }

    setIsSearching(true);

    try {
      // Generate the same PCB number that would be generated in TagEntryForm
      const { getPcbNumberForDc } = await import('@/lib/pcb-utils');
      const pcbSrNo = getPcbNumberForDc(partCode, srNo, mfgMonthYear);
      
      // Use searchConsolidatedDataEntriesByPcb to search by PCB serial number
      const result = await searchConsolidatedDataEntriesByPcb('', partCode, pcbSrNo);
      
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

      {/* Search Section */}
      <div className="mb-3">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4"> {/* Changed from 4 to 3 columns */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">DC No.</label>
            <div className="flex gap-2">
              <Select
                value={isDcLocked ? useLockStore.getState().lockedDcNo : dcNo}
                onValueChange={setDcNo}
                disabled={isDcLocked || isPcbFound}
              >
                <SelectTrigger className={`flex-1 ${isDcLocked || isPcbFound ? 'bg-gray-100' : ''}`}>
                  <SelectValue placeholder="Select DC No." />
                </SelectTrigger>
                <SelectContent>
                  {dcNumbers
                    .filter(dc => dc != null && dc !== '')
                    .map((dc, index) => (
                      <SelectItem key={`${dc}-${index}`} value={dc}>{dc}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <LockButton dcNo={dcNo} partCode={partCode} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Part Code</label>
            <Select
              value={isDcLocked ? useLockStore.getState().lockedPartCode : partCode}
              onValueChange={setPartCode}
              disabled={isDcLocked || isPcbFound}
            >
              <SelectTrigger className={`${isDcLocked || isPcbFound ? 'bg-gray-100' : ''}`}>
                <SelectValue placeholder="Select Part Code" />
              </SelectTrigger>
              <SelectContent>
                {(dcPartCodes[dcNo] || [])
                  .filter(code => code != null && code !== '')
                  .map((code, index) => (
                    <SelectItem key={`${code}-${index}`} value={code}>{code}</SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mfg Month/Year (MM/YYYY)</label>
            <Input
              type="text"
              value={mfgMonthYear}
              onChange={(e) => setMfgMonthYear(e.target.value)}
              className="w-full"
              placeholder="MM/YYYY"
              disabled={isPcbFound}
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-gray-700">Serial No.</label>
              <div className="flex space-x-1">
                <button
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
                </button>
              </div>
            </div>
            <Input
              type="text"
              value={srNo}
              onChange={(e) => setSrNo(e.target.value)}
              className="w-full"
              placeholder="Enter Serial No."
              disabled={isPcbFound}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Dispatch Date:</label>
            <Input
              type="date"
              value={dispatchDate}
              onChange={(e) => setDispatchDate(e.target.value)}
              className="w-full"
              disabled={isPcbFound}
            />
          </div>
        <div className="mt-4 flex justify-center">
          <Button
            onClick={handleFind}
            disabled={isSearching || isPcbFound}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded text-sm"
            >
            {isSearching ? 'Searching...' : 'Find PCB'}
          </Button>
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
        <div className="flex-1 flex flex-col text-sm">
          <div className="bg-blue-50 p-4 rounded-md mb-4">
            {/* <h3 className="font-bold text-blue-800 mb-3">PCB Information</h3> */}
            {/* Tag Entry Section */}
            <div className="mb-6 border-b">
              <h4 className="font-semibold text-gray-700 mb-2">Tag Entry Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Sr No</Label>
                  <Input
                    name="srNo"
                    value={selectedEntry.srNo}
                    onChange={handleChange}
                    className="mt-1"
                    readOnly
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">DC No</Label>
                  <Input
                    name="dcNo"
                    value={selectedEntry.dcNo}
                    onChange={handleChange}
                    className="mt-1"
                    readOnly
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Branch</Label>
                  <Input
                    name="branch"
                    value={selectedEntry.branch}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">BCCD Name</Label>
                  <Input
                    name="bccdName"
                    value={selectedEntry.bccdName}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Product Description</Label>
                  <Input
                    name="productDescription"
                    value={selectedEntry.productDescription}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Product Sr No</Label>
                  <Input
                    name="productSrNo"
                    value={selectedEntry.productSrNo}
                    onChange={handleChange}
                    className="mt-1"
                    readOnly
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Date of Purchase</Label>
                  <Input
                    name="dateOfPurchase"
                    type="date"
                    value={selectedEntry.dateOfPurchase}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Complaint No</Label>
                  <Input
                    name="complaintNo"
                    value={selectedEntry.complaintNo}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Part Code</Label>
                  <Input
                    name="partCode"
                    value={selectedEntry.partCode}
                    onChange={handleChange}
                    className="mt-1"
                    readOnly
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Nature of Defect</Label>
                  <Input
                    name="natureOfDefect"
                    value={selectedEntry.natureOfDefect}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Visiting Tech Name</Label>
                  <Input
                    name="visitingTechName"
                    value={selectedEntry.visitingTechName}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Mfg Month/Year</Label>
                  <Input
                    name="mfgMonthYear"
                    value={selectedEntry.mfgMonthYear}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
            {/* Consumption Section */}
            <div className="mb-6 border-b pb-4">
              <h4 className="font-semibold text-gray-700 mb-2">Consumption Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Repair Date</Label>
                  <Input
                    name="repairDate"
                    type="date"
                    value={selectedEntry.repairDate}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Testing</Label>
                  <Input
                    name="testing"
                    value={selectedEntry.testing}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Failure</Label>
                  <Input
                    name="failure"
                    value={selectedEntry.failure}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Status</Label>
                  <Input
                    name="status"
                    value={selectedEntry.status}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">PCB Sr No</Label>
                  <Input
                    name="pcbSrNo"
                    value={selectedEntry.pcbSrNo}
                    onChange={handleChange}
                    className="mt-1"
                    readOnly
                  />
                </div>
                {/* <div>
                  <Label className="text-sm font-medium text-gray-700">RF Observation</Label>
                  <Input
                    name="rfObservation"
                    value={selectedEntry.rfObservation}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div> */}
                {/* <div>
                  <Label className="text-sm font-medium text-gray-700">Analysis</Label>
                  <textarea
                    name="analysis"
                    value={selectedEntry.analysis}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded text-sm mt-1"
                    rows={3}
                  />
                </div> */}
                <div>
                  <Label className="text-sm font-medium text-gray-700">Validation Result</Label>
                  <textarea
                    name="validationResult"
                    value={selectedEntry.validationResult}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded text-sm mt-1"
                    rows={3}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Component Change</Label>
                  <textarea
                    name="componentChange"
                    value={selectedEntry.componentChange}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded text-sm mt-1"
                    rows={3}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Engineer Name</Label>
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
                    className="w-full mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Dispatch Entry By</Label>
                  <input
                    type="text"
                    value={user?.name || user?.email || ''}
                    readOnly
                    className="w-full mt-1 p-2 border border-gray-300 rounded bg-gray-100"
                  />
                </div>
              </div>
            </div>
            {/* Dispatch Section */}
            {/* <div className="mb-6">
              <h4 className="font-semibold text-gray-700 mb-2">Dispatch Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Dispatch Date</Label>
                  <Input
                    name="dispatchDate"
                    type="date"
                    value={selectedEntry.dispatchDate}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>
              </div>
            </div> */}
          </div>

          {/* Save Button */}
          <div className="mt-auto flex justify-center">
            <Button
              onClick={handleSave}
              className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-6 rounded text-sm"
            >
              Save
            </Button>
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
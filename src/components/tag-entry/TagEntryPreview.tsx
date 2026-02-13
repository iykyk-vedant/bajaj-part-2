'use client';

import { useState, useEffect } from 'react';
import { TagEntry } from '@/lib/tag-entry/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, RefreshCw } from 'lucide-react';
import { tagEntryEventEmitter, TAG_ENTRY_EVENTS } from '@/lib/event-emitter';

interface TagEntryPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  refreshTrigger?: number;
}

// Editable cell component
interface EditableCellProps {
  value: string;
  onSave: (newValue: string) => void;
  className?: string;
}

function EditableCell({ value, onSave, className }: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  const handleEdit = () => {
    setIsEditing(true);
    setEditValue(value);
  };

  const handleSave = () => {
    if (editValue !== value) {
      onSave(editValue);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <TableCell
      className={className}
      onClick={handleEdit}
      style={{ cursor: 'pointer' }}
    >
      {isEditing ? (
        <input
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          autoFocus
          className="w-full px-1 py-0.5 text-xs border border-blue-500 rounded focus:ring-1 focus:ring-blue-500 h-6 bg-white outline-none"
        />
      ) : (
        <span className="block truncate">{value}</span>
      )}
    </TableCell>
  );
}

export function TagEntryPreview({ open, onOpenChange, refreshTrigger }: TagEntryPreviewProps) {
  const [entries, setEntries] = useState<TagEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<TagEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Load saved entries from database
  const loadEntries = async () => {
    setIsLoading(true);
    try {
      const { getConsolidatedDataEntries } = await import('@/app/actions/consumption-actions');
      const result = await getConsolidatedDataEntries();

      if (result.success) {
        const dbEntries = result.data || [];
        // Convert database entries to TagEntry format
        const tagEntries = dbEntries.map((entry: any) => ({
          id: entry.id || entry.sr_no,
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
          natureOfDefect: entry.nature_of_defect || entry.defect || '',
          visitingTechName: entry.visiting_tech_name || '',
          mfgMonthYear: entry.mfg_month_year ? (typeof entry.mfg_month_year === 'string' ? entry.mfg_month_year : (entry.mfg_month_year && typeof entry.mfg_month_year === 'object' && 'toISOString' in entry.mfg_month_year ? (entry.mfg_month_year as Date).toISOString().split('T')[0] : new Date(entry.mfg_month_year).toISOString().split('T')[0])) : '',
          repairDate: entry.repair_date ? (typeof entry.repair_date === 'string' ? entry.repair_date : (entry.repair_date && typeof entry.repair_date === 'object' && 'toISOString' in entry.repair_date ? (entry.repair_date as Date).toISOString().split('T')[0] : new Date(entry.repair_date).toISOString().split('T')[0])) : '',
          testing: entry.testing || '',
          failure: entry.failure || '',
          status: entry.status || '',
          pcbSrNo: entry.pcb_sr_no || '',
          analysis: entry.analysis || '',
          componentChange: entry.component_change || '',
          enggName: entry.engg_name || '',
          dispatchDate: entry.dispatch_date ? (typeof entry.dispatch_date === 'string' ? entry.dispatch_date : (entry.dispatch_date && typeof entry.dispatch_date === 'object' && 'toISOString' in entry.dispatch_date ? (entry.dispatch_date as Date).toISOString().split('T')[0] : new Date(entry.dispatch_date).toISOString().split('T')[0])) : '',
        }));

        setEntries(tagEntries);
        setFilteredEntries(tagEntries);
      }
    } catch (e) {
      console.error('Error loading entries from database:', e);
      setEntries([]);
      setFilteredEntries([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load entries when dialog opens
  useEffect(() => {
    if (open) {
      loadEntries();
    }
  }, [open]);

  // Reload entries when refresh trigger changes
  useEffect(() => {
    if (open && refreshTrigger !== undefined) {
      loadEntries();
    }
  }, [refreshTrigger, open]);

  // Listen for entry save/update/delete events to refresh the preview
  useEffect(() => {
    const handleEntrySaved = () => {
      if (open) {
        loadEntries();
      }
    };

    const handleEntryDeleted = () => {
      if (open) {
        loadEntries();
      }
    };

    // Subscribe to events
    tagEntryEventEmitter.on(TAG_ENTRY_EVENTS.ENTRY_SAVED, handleEntrySaved);
    tagEntryEventEmitter.on(TAG_ENTRY_EVENTS.ENTRY_DELETED, handleEntryDeleted);

    // Cleanup: unsubscribe from events
    return () => {
      tagEntryEventEmitter.off(TAG_ENTRY_EVENTS.ENTRY_SAVED, handleEntrySaved);
      tagEntryEventEmitter.off(TAG_ENTRY_EVENTS.ENTRY_DELETED, handleEntryDeleted);
    };
  }, [open]);

  // Filter entries based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredEntries(entries);
      return;
    }

    const term = searchTerm.toLowerCase().trim();
    const filtered = entries.filter(entry =>
      entry.dcNo.toLowerCase().includes(term) ||
      entry.complaintNo.toLowerCase().includes(term) ||
      entry.productSrNo.toLowerCase().includes(term) ||
      entry.pcbSrNo.toLowerCase().includes(term) ||
      entry.partCode.toLowerCase().includes(term) ||
      entry.srNo.toLowerCase().includes(term)
    );

    setFilteredEntries(filtered);
  }, [searchTerm, entries]);

  // Handle saving updated entry
  const handleSaveEntry = async (entryId: number, field: keyof TagEntry, newValue: string) => {
    try {
      // Find the entry to update - handle both string and number IDs
      const entryToUpdate = entries.find(entry => {
        if (typeof entry.id === 'number') {
          return entry.id === entryId;
        } else if (typeof entry.id === 'string') {
          return Number(entry.id) === entryId;
        }
        return false;
      });
      if (!entryToUpdate) return;

      // Create updated entry
      const updatedEntry = {
        ...entryToUpdate,
        [field]: newValue
      };

      // Call the update server action
      const { updateConsolidatedDataEntryAction } = await import('@/app/actions/consumption-actions');
      const result = await updateConsolidatedDataEntryAction(String(entryId), updatedEntry);

      if (result.success) {
        // Update the local state - handle both string and number IDs
        setEntries(prevEntries =>
          prevEntries.map(entry => {
            if (typeof entry.id === 'number') {
              return entry.id === entryId ? { ...entry, [field]: newValue } : entry;
            } else if (typeof entry.id === 'string') {
              return Number(entry.id) === entryId ? { ...entry, [field]: newValue } : entry;
            }
            return entry;
          })
        );
        setFilteredEntries(prevEntries =>
          prevEntries.map(entry => {
            if (typeof entry.id === 'number') {
              return entry.id === entryId ? { ...entry, [field]: newValue } : entry;
            } else if (typeof entry.id === 'string') {
              return Number(entry.id) === entryId ? { ...entry, [field]: newValue } : entry;
            }
            return entry;
          })
        );
      } else {
        console.error('Failed to update entry:', result.error);
      }
    } catch (error) {
      console.error('Error updating entry:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="border-b pb-2 mb-2">
          <DialogTitle className="text-[14px] font-bold text-gray-800 uppercase tracking-widest">Tag Entry Preview</DialogTitle>
          <DialogDescription className="text-xs text-gray-500">
            Preview, search, and edit tag entries directly in the table
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 flex-1 overflow-hidden">
          {/* Search Bar */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 group">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-3.5 w-3.5 group-focus-within:text-blue-500 transition-colors" />
              <input
                placeholder="Search DC No, Complaint No, Product Sr No, PCB Sr No..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-9 transition-all bg-gray-50/50"
              />
            </div>
          </div>

          {/* Entries Count */}
          <div className="flex justify-between items-center px-1">
            <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
              Showing {filteredEntries.length} of {entries.length} entries
            </div>
            <button
              onClick={loadEntries}
              disabled={isLoading}
              className="flex items-center gap-2 px-3 py-1 text-[11px] font-bold text-gray-600 uppercase tracking-wider border border-gray-300 rounded-md hover:bg-gray-50 transition-all active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Table */}
          <div className="overflow-auto flex-1 border border-gray-100 rounded-lg shadow-inner bg-gray-50/30">
            <div className="overflow-x-auto h-full">
              <Table className="min-w-full text-xs">
                <TableHeader className="sticky top-0 bg-gray-100/95 backdrop-blur-sm z-10 shadow-sm">
                  <TableRow>
                    <TableHead className="w-[80px]">Sr. No.</TableHead>
                    <TableHead className="w-[120px]">DC No</TableHead>
                    <TableHead className="w-[100px]">DC Date</TableHead>
                    <TableHead className="w-[100px]">Branch</TableHead>
                    <TableHead className="w-[120px]">BCCD Name</TableHead>
                    <TableHead className="w-[200px]">Product Description</TableHead>
                    <TableHead className="w-[150px]">Product Sr No</TableHead>
                    <TableHead className="w-[120px]">Date of Purchase</TableHead>
                    <TableHead className="w-[120px]">Complaint No</TableHead>
                    <TableHead className="w-[120px]">Part Code</TableHead>
                    <TableHead className="w-[150px]">Nature of Defect</TableHead>
                    <TableHead className="w-[150px]">Visiting Tech Name</TableHead>
                    <TableHead className="w-[100px]">Mfg Month/Year</TableHead>
                    <TableHead className="w-[150px]">PCB Sr No</TableHead>
                    <TableHead className="w-[120px]">Repair Date</TableHead>
                    <TableHead className="w-[100px]">Testing</TableHead>
                    <TableHead className="w-[100px]">Failure</TableHead>
                    <TableHead className="w-[100px]">Status</TableHead>
                    <TableHead className="w-[150px]">Analysis</TableHead>
                    <TableHead className="w-[150px]">Component Change</TableHead>
                    <TableHead className="w-[150px]">Engg Name</TableHead>
                    <TableHead className="w-[120px]">Dispatch Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEntries.length > 0 ? (
                    filteredEntries.map((entry) => (
                      <TableRow key={entry.id || entry.srNo}>
                        <EditableCell
                          value={entry.srNo}
                          onSave={(newValue) => handleSaveEntry(Number(entry.id), 'srNo', newValue)}
                          className="font-medium"
                        />
                        <EditableCell
                          value={entry.dcNo}
                          onSave={(newValue) => handleSaveEntry(Number(entry.id), 'dcNo', newValue)}
                        />
                        <EditableCell
                          value={entry.dcDate || ''}
                          onSave={(newValue) => handleSaveEntry(Number(entry.id), 'dcDate', newValue)}
                        />
                        <EditableCell
                          value={entry.branch}
                          onSave={(newValue) => handleSaveEntry(Number(entry.id), 'branch', newValue)}
                        />
                        <EditableCell
                          value={entry.bccdName}
                          onSave={(newValue) => handleSaveEntry(Number(entry.id), 'bccdName', newValue)}
                        />
                        <EditableCell
                          value={entry.productDescription}
                          onSave={(newValue) => handleSaveEntry(Number(entry.id), 'productDescription', newValue)}
                        />
                        <EditableCell
                          value={entry.productSrNo}
                          onSave={(newValue) => handleSaveEntry(Number(entry.id), 'productSrNo', newValue)}
                        />
                        <EditableCell
                          value={entry.dateOfPurchase}
                          onSave={(newValue) => handleSaveEntry(Number(entry.id), 'dateOfPurchase', newValue)}
                        />
                        <EditableCell
                          value={entry.complaintNo}
                          onSave={(newValue) => handleSaveEntry(Number(entry.id), 'complaintNo', newValue)}
                        />
                        <EditableCell
                          value={entry.partCode}
                          onSave={(newValue) => handleSaveEntry(Number(entry.id), 'partCode', newValue)}
                        />
                        <EditableCell
                          value={entry.natureOfDefect}
                          onSave={(newValue) => handleSaveEntry(Number(entry.id), 'natureOfDefect', newValue)}
                        />
                        <EditableCell
                          value={entry.visitingTechName}
                          onSave={(newValue) => handleSaveEntry(Number(entry.id), 'visitingTechName', newValue)}
                        />
                        <EditableCell
                          value={entry.mfgMonthYear}
                          onSave={(newValue) => handleSaveEntry(Number(entry.id), 'mfgMonthYear', newValue)}
                        />
                        <EditableCell
                          value={entry.pcbSrNo}
                          onSave={(newValue) => handleSaveEntry(Number(entry.id), 'pcbSrNo', newValue)}
                        />
                        <EditableCell
                          value={entry.repairDate || ''}
                          onSave={(newValue) => handleSaveEntry(Number(entry.id), 'repairDate', newValue)}
                        />
                        <EditableCell
                          value={entry.testing || ''}
                          onSave={(newValue) => handleSaveEntry(Number(entry.id), 'testing', newValue)}
                        />
                        <EditableCell
                          value={entry.failure || ''}
                          onSave={(newValue) => handleSaveEntry(Number(entry.id), 'failure', newValue)}
                        />
                        <EditableCell
                          value={entry.status || ''}
                          onSave={(newValue) => handleSaveEntry(Number(entry.id), 'status', newValue)}
                        />
                        <EditableCell
                          value={entry.analysis || ''}
                          onSave={(newValue) => handleSaveEntry(Number(entry.id), 'analysis', newValue)}
                        />
                        <EditableCell
                          value={entry.componentChange || ''}
                          onSave={(newValue) => handleSaveEntry(Number(entry.id), 'componentChange', newValue)}
                        />
                        <EditableCell
                          value={entry.enggName || ''}
                          onSave={(newValue) => handleSaveEntry(Number(entry.id), 'enggName', newValue)}
                        />
                        <EditableCell
                          value={entry.dispatchDate || ''}
                          onSave={(newValue) => handleSaveEntry(Number(entry.id), 'dispatchDate', newValue)}
                        />
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={22} className="text-center text-gray-500 py-8">
                        {searchTerm ? 'No entries match your search.' : 'No tag entries found.'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        <DialogFooter className="border-t pt-2 mt-2">
          <button
            onClick={() => onOpenChange(false)}
            className="px-4 py-1.5 text-xs font-bold text-gray-600 uppercase tracking-widest hover:bg-gray-100 rounded-md transition-all"
          >
            Close
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
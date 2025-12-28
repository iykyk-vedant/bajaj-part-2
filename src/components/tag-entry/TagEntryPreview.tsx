'use client';

import { useState, useEffect } from 'react';
import { TagEntry } from '@/lib/tag-entry/types';
import { Button } from '@/components/ui/button';
import { 
  Dialog,
  DialogContent,
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
          branch: entry.branch || '',
          bccdName: entry.bccd_name || '',
          productDescription: entry.product_description || '',
          productSrNo: entry.product_sr_no || '',
          dateOfPurchase: entry.date_of_purchase ? (typeof entry.date_of_purchase === 'string' ? entry.date_of_purchase : entry.date_of_purchase instanceof Date ? entry.date_of_purchase.toISOString().split('T')[0] : new Date(entry.date_of_purchase).toISOString().split('T')[0]) : '',
          complaintNo: entry.complaint_no || '',
          partCode: entry.part_code || '',
          natureOfDefect: entry.nature_of_defect || entry.defect || '',
          visitingTechName: entry.visiting_tech_name || '',
          mfgMonthYear: entry.mfg_month_year ? (typeof entry.mfg_month_year === 'string' ? entry.mfg_month_year : entry.mfg_month_year instanceof Date ? entry.mfg_month_year.toISOString().split('T')[0] : new Date(entry.mfg_month_year).toISOString().split('T')[0]) : '',
          pcbSrNo: entry.pcb_sr_no || '',
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Tag Entry Preview</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col gap-4 flex-1 overflow-hidden">
          {/* Search Bar */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by DC No, Complaint No, Product Sr No, PCB Sr No, Part Code, or Sr No..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          
          {/* Entries Count */}
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Showing {filteredEntries.length} of {entries.length} entries
            </div>
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={loadEntries}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          
          {/* Table */}
          <div className="overflow-auto flex-1 border rounded-md">
            <Table className="min-w-full">
              <TableHeader className="sticky top-0 bg-gray-100 z-10">
                <TableRow>
                  <TableHead className="w-[80px]">Sr. No.</TableHead>
                  <TableHead className="w-[120px]">DC No</TableHead>
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.length > 0 ? (
                  filteredEntries.map((entry) => (
                    <TableRow key={entry.id || entry.srNo}>
                      <TableCell className="font-medium">{entry.srNo}</TableCell>
                      <TableCell>{entry.dcNo}</TableCell>
                      <TableCell>{entry.branch}</TableCell>
                      <TableCell>{entry.bccdName}</TableCell>
                      <TableCell>{entry.productDescription}</TableCell>
                      <TableCell>{entry.productSrNo}</TableCell>
                      <TableCell>{entry.dateOfPurchase}</TableCell>
                      <TableCell>{entry.complaintNo}</TableCell>
                      <TableCell>{entry.partCode}</TableCell>
                      <TableCell>{entry.natureOfDefect}</TableCell>
                      <TableCell>{entry.visitingTechName}</TableCell>
                      <TableCell>{entry.mfgMonthYear}</TableCell>
                      <TableCell>{entry.pcbSrNo}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={13} className="text-center text-gray-500 py-8">
                      {searchTerm ? 'No entries match your search.' : 'No tag entries found.'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
        
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
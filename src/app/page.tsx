
'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { extractDataFromImage } from '@/app/actions';
import type { ExtractDataOutput } from '@/ai/schemas/form-extraction-schemas';
import { ImageUploader } from '@/components/image-uploader';
import { ValidateDataSection } from '@/components/validate-data-section';
import { ScanText, Download, History, Plus, Trash2, MoreVertical, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SheetOverview } from '@/components/sheet-overview';
import { exportTagEntriesToExcel } from '@/lib/tag-entry/export-utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Import server actions for sheet operations
import { 
  getAllSheetsAction, 
  createSheetAction, 
  updateSheetNameAction, 
  deleteSheetAction, 
  addDataToSheetAction, 
  updateSheetDataAction 
} from '@/app/actions';export type Sheet = {
  id: string;
  name: string;
  data: ExtractDataOutput[];
  createdAt: string;
}

// Remove localStorage key since we're using MySQL
// const STORAGE_KEY = 'nexscan-sheets';
export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [currentExtractedData, setCurrentExtractedData] = useState<ExtractDataOutput | null>(null);
  
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [activeSheetId, setActiveSheetId] = useState<string | null>(null);
  const [isSheetOverviewOpen, setIsSheetOverviewOpen] = useState(false);

  // Dialog states
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCreateSheetDialogOpen, setIsCreateSheetDialogOpen] = useState(false);
  const [isRenameSheetDialogOpen, setIsRenameSheetDialogOpen] = useState(false);
  const [isDuplicateWarningOpen, setIsDuplicateWarningOpen] = useState(false);
  const [newSheetName, setNewSheetName] = useState('');
  const [pendingData, setPendingData] = useState<ExtractDataOutput | null>(null);


  // Store form context for extraction
  const [extractionContext, setExtractionContext] = useState<{ sparePartCode?: string; productDescription?: string; }>({});


  const { toast } = useToast();

  // Load sheets from MySQL database on initial render
  useEffect(() => {
    const loadSheets = async () => {
      try {
        const { sheets: loadedSheets, error } = await getAllSheetsAction();
        if (error) {
          throw new Error(error);
        }
        setSheets(loadedSheets);
        if (loadedSheets.length > 0) {
          // Activate the most recently created sheet
          setActiveSheetId(loadedSheets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0].id);
        }
      } catch (error) {
        console.error("Failed to load sheets from database:", error);
        toast({
          variant: 'destructive',
          title: 'Could not load data',
          description: 'There was an error loading your saved sheets from the database.',
        });
      }
    };

    loadSheets();
  }, [toast]);  // We no longer need to save to localStorage since we're using MySQL
  // The save operations are now handled by individual database calls  

  const handleImageReady = async (dataUrl: string) => {
    // Clear previous extraction results when a new image is uploaded
    setCurrentExtractedData(null); 
    
    if (!dataUrl) {
      return;
    }

    setIsLoading(true);
    setCurrentExtractedData(null);

    if (sheets.length === 0 || !activeSheetId) {
       handleOpenCreateSheetDialog();
       toast({ title: 'No Active Sheet', description: 'Please create a sheet to continue.'});
       setIsLoading(false);
       return;
    }

    const result = await extractDataFromImage({
      photoDataUri: dataUrl,
    });
    
    if (result.error) {
      toast({
        variant: 'destructive',
        title: 'Extraction Failed',
        description: result.error,
      });
    } else {
      setCurrentExtractedData(result.data);
      toast({
        title: 'Extraction Successful',
        description: 'Data has been extracted. Review and add to the active Excel sheet.',
      });
    }
    
    setIsLoading(false);
  };
  
  const handleAddToSheet = (data: ExtractDataOutput) => {
    if (!activeSheetId) {
      toast({
        variant: 'destructive',
        title: 'No Active Sheet',
        description: 'Please create or select a sheet first.',
      });
      return;
    }

    const activeSheet = sheets.find((s: Sheet) => s.id === activeSheetId);
    const isDuplicate = activeSheet?.data.some(
      (item: ExtractDataOutput) => item.productSrNo && item.productSrNo === data.productSrNo
    );

    if (isDuplicate) {
      setPendingData(data);
      setIsDuplicateWarningOpen(true);
    } else {
      addConfirmedData(data);
    }
  };

  const addConfirmedData = async (data: ExtractDataOutput) => {
    if (!activeSheetId) return;
    
    try {
      // Add data to MySQL database using server action
      const { error } = await addDataToSheetAction(activeSheetId, data);
      if (error) {
        throw new Error(error);
      }
      
      // Update local state
      setSheets((prevSheets: Sheet[]) => 
        prevSheets.map((sheet: Sheet) => 
          sheet.id === activeSheetId 
            ? { ...sheet, data: [...sheet.data, data] }
            : sheet
        )
      );
      setCurrentExtractedData(null); // Clear the form after adding
      toast({
        title: 'Form Added',
        description: `The form data has been added to the sheet: ${sheets.find(s => s.id === activeSheetId)?.name}.`,
      });
    } catch (error) {
      console.error("Failed to add data to sheet in database:", error);
      toast({
        variant: 'destructive',
        title: 'Add Failed',
        description: 'There was an error adding data to your sheet in the database.',
      });
    }
  };  const confirmAddDuplicate = () => {
    if (pendingData) {
      addConfirmedData(pendingData);
    }
    setIsDuplicateWarningOpen(false);
    setPendingData(null);
  };

  const handleOpenCreateSheetDialog = () => {
    setNewSheetName(`Sheet ${sheets.length + 1}`);
    setIsCreateSheetDialogOpen(true);
  };
  
  const handleCreateNewSheet = async () => {
    if (!newSheetName.trim()) {
      toast({ variant: 'destructive', title: 'Invalid Name', description: 'Sheet name cannot be empty.' });
      return;
    }
    const newSheet = {
      id: `sheet-${Date.now()}`,
      name: newSheetName,
      createdAt: new Date().toISOString(),
    };

    try {
      // Save to MySQL database using server action
      const { sheet: createdSheet, error } = await createSheetAction(newSheet);
      if (error) {
        throw new Error(error);
      }
      
      // Update local state
      setSheets((prev: Sheet[]) => [{ ...(createdSheet || newSheet), data: [] }, ...prev]);
      setActiveSheetId(newSheet.id);
      setIsCreateSheetDialogOpen(false);
      setNewSheetName('');
      toast({
        title: 'New Sheet Created',
        description: `"${newSheet.name}" is now the active sheet.`,
      });
    } catch (error) {
      console.error("Failed to create sheet in database:", error);
      toast({
        variant: 'destructive',
        title: 'Creation Failed',
        description: 'There was an error creating your sheet in the database.',
      });
    }
  };  const handleOpenRenameSheetDialog = () => {
    const activeSheet = sheets.find((s: Sheet) => s.id === activeSheetId);
    if (activeSheet) {
      setNewSheetName(activeSheet.name);
      setIsRenameSheetDialogOpen(true);
    }
  };

  const handleRenameSheet = async () => {
    if (!newSheetName.trim()) {
      toast({ variant: 'destructive', title: 'Invalid Name', description: 'Sheet name cannot be empty.' });
      return;
    }

    try {
      // Update in MySQL database using server action
      if (activeSheetId) {
        const { error } = await updateSheetNameAction(activeSheetId, newSheetName);
        if (error) {
          throw new Error(error);
        }
      }

      // Update local state
      setSheets((prevSheets: Sheet[]) =>
        prevSheets.map((sheet: Sheet) =>
          sheet.id === activeSheetId ? { ...sheet, name: newSheetName } : sheet
        )
      );
      setIsRenameSheetDialogOpen(false);
      setNewSheetName('');
      toast({ title: 'Sheet Renamed', description: `Sheet successfully renamed to "${newSheetName}".` });
    } catch (error) {
      console.error("Failed to rename sheet in database:", error);
      toast({
        variant: 'destructive',
        title: 'Rename Failed',
        description: 'There was an error renaming your sheet in the database.',
      });
    }
  };  
  const handleDeleteSheet = async () => {
    if (!activeSheetId) return;

    const sheetToDelete = sheets.find((s: Sheet) => s.id === activeSheetId);
    if (!sheetToDelete) return;
    
    try {
      // Delete from MySQL database using server action
      const { error } = await deleteSheetAction(activeSheetId);
      if (error) {
        throw new Error(error);
      }
      
      // Update local state
      setSheets((prev: Sheet[]) => prev.filter((s: Sheet) => s.id !== activeSheetId));
      
      // Set new active sheet
      const remainingSheets = sheets.filter((s: Sheet) => s.id !== activeSheetId);
      if (remainingSheets.length > 0) {
        setActiveSheetId(remainingSheets[0].id);
      } else {
        setActiveSheetId(null);
      }
      
      toast({
        variant: 'destructive',
        title: 'Sheet Deleted',
        description: `"${sheetToDelete.name}" has been removed.`,
      });
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error("Failed to delete sheet from database:", error);
      toast({
        variant: 'destructive',
        title: 'Deletion Failed',
        description: 'There was an error deleting your sheet from the database.',
      });
    }
  };  const exportToCSV = () => {
    const activeSheet = sheets.find((s: Sheet) => s.id === activeSheetId);
    if (!activeSheet || activeSheet.data.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Export Failed',
        description: 'There is no data in the active Excel sheet to export.',
      });
      return;
    }

    const headers = ['Sr. No.', ...Object.keys(activeSheet.data[0]).filter(key => key !== 'others')].join(',');
    
    const values = activeSheet.data.map((item: ExtractDataOutput, index: number) => {
      const rowData = Object.entries(item)
        .filter(([key]) => key !== 'others')
        .map(([, val]) => `"${String(val ?? '').replace(/"/g, '""')}"`)
        .join(',');
      return `${index + 1},${rowData}`;
    }).join('\n');

    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + values;
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${activeSheet.name.replace(/ /g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Export Successful',
      description: `The sheet "${activeSheet.name}" has been exported to CSV.`,
    });
  };

  const handleUpdateSheetData = async (rowIndex: number, columnId: string, value: any) => {
    // Update local state first
    setSheets((prevSheets: Sheet[]) =>
      prevSheets.map((sheet: Sheet) => {
        if (sheet.id === activeSheetId) {
          const newData = [...sheet.data];
          if (newData[rowIndex]) {
            newData[rowIndex] = { ...newData[rowIndex], [columnId]: value };
          }
          return { ...sheet, data: newData };
        }
        return sheet;
      })
    );

    // Update in MySQL database using server action
    if (activeSheetId) {
      const updatedSheet = sheets.find((s: Sheet) => s.id === activeSheetId);
      if (updatedSheet) {
        try {
          const { error } = await updateSheetDataAction(activeSheetId, updatedSheet.data);
          if (error) {
            throw new Error(error);
          }
        } catch (error) {
          console.error("Failed to update sheet data in database:", error);
          toast({
            variant: 'destructive',
            title: 'Update Failed',
            description: 'There was an error updating your sheet data in the database.',
          });
        }
      }
    }
  };  
  const handleRemoveRow = async (rowIndex: number) => {    
    setSheets((prevSheets: Sheet[]) =>
      prevSheets.map((sheet: Sheet) =>
        sheet.id === activeSheetId
          ? { ...sheet, data: sheet.data.filter((_, index) => index !== rowIndex) }
          : sheet
      )
    );
    
    // Update in MySQL database using server action
    if (activeSheetId) {
      const updatedSheet = sheets.find((s: Sheet) => s.id === activeSheetId);
      if (updatedSheet) {
        try {
          const { error } = await updateSheetDataAction(activeSheetId, updatedSheet.data);
          if (error) {
            throw new Error(error);
          }
          toast({ title: 'Row Removed', description: 'The selected entry has been removed from the sheet.' });
        } catch (error) {
          console.error("Failed to update sheet data in database:", error);
          toast({
            variant: 'destructive',
            title: 'Update Failed',
            description: 'There was an error updating your sheet data in the database.',
          });
        }
      }
    }
  };  
  const activeSheet = sheets.find((s: Sheet) => s.id === activeSheetId);

  const handleExportExcel = async () => {
    try {
      await exportTagEntriesToExcel();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Export failed',
        description: error instanceof Error ? error.message : 'Failed to export Excel file',
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="p-4 border-b bg-card/50 backdrop-blur-lg sticky top-0 z-20">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ScanText className="w-8 h-8 text-primary"/>
            <h1 className="text-2xl font-bold font-headline text-primary">NexScan</h1>
          </div>
          <div className="flex items-center gap-2">
             {/* <Button 
                variant="outline" 
                onClick={() => setIsSheetOverviewOpen(true)} 
                disabled={!activeSheet || activeSheet.data.length === 0}
              >
              <History className="mr-2 h-4 w-4" />
              View Excel Sheet ({activeSheet?.data.length || 0})
            </Button>
            <Button onClick={exportToCSV} disabled={!activeSheet || activeSheet.data.length === 0}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button> */}
            <Button 
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={handleExportExcel}
            >
              <Download className="mr-2 h-4 w-4" />
              Export Excel
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => window.location.href = '/consumption'}
            >
              Consumption
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Sheet Management</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleOpenCreateSheetDialog}>
                  <Plus className="mr-2 h-4 w-4" />
                  <span>Create New Sheet</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleOpenRenameSheetDialog} disabled={!activeSheet}>
                  <Edit className="mr-2 h-4 w-4" />
                  <span>Rename Current Sheet</span>
                </DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger disabled={sheets.length === 0}>
                    <span>Switch Sheet</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent>
                      <DropdownMenuLabel>Select a sheet</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {sheets.map(sheet => (
                        <DropdownMenuItem key={sheet.id} onClick={() => setActiveSheetId(sheet.id)} disabled={sheet.id === activeSheetId}>
                          {sheet.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => window.location.href = '/tag-entry'}>
                  <span>Tag Entry</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setIsDeleteDialogOpen(true)} disabled={!activeSheet} className="text-red-500 focus:text-red-500">
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Delete Current Sheet</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

          </div>
        </div>
      </header>
      
      <main className="flex-1 container mx-auto p-4 md:p-8 space-y-8">
        <div className="text-center">
            <h2 className="text-lg font-semibold">Active Sheet: <span className="font-bold text-primary">{activeSheet?.name || 'No active sheet'}</span></h2>
            <p className="text-sm text-muted-foreground">
                {sheets.length > 0 ? 'New scans will be added here. Use the menu to switch or create sheets.' : 'Create a new sheet from the menu to get started.'}
            </p>
        </div>
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-2/5 xl:w-1/3">
            <ImageUploader 
              onImageReady={handleImageReady} 
              isLoading={isLoading} 
            />
          </div>
          <div className="lg:w-3/5 xl:w-2/3">
            <ValidateDataSection 
              initialData={currentExtractedData} 
              isLoading={isLoading}
              onSave={handleAddToSheet}
              sheetActive={!!activeSheet}
              onFormChange={setExtractionContext}
            />
          </div>
        </div>
      </main>

      {activeSheet && (
        <SheetOverview 
          isOpen={isSheetOverviewOpen} 
          onOpenChange={setIsSheetOverviewOpen}
          sheetData={activeSheet.data}
          onUpdateData={handleUpdateSheetData}
          onRemoveRow={handleRemoveRow}
          onClearSheet={async () => {
            // Update local state
            setSheets(prev => prev.map(s => s.id === activeSheetId ? {...s, data: []} : s));
            
            // Update in MySQL database
            if (activeSheetId) {
              try {
                await updateSheetDataAction(activeSheetId, []);                setIsSheetOverviewOpen(false);
                toast({ title: 'Excel Sheet Cleared' });
              } catch (error) {
                console.error("Failed to clear sheet data in database:", error);
                toast({
                  variant: 'destructive',
                  title: 'Clear Failed',
                  description: 'There was an error clearing your sheet data in the database.',
                });
              }
            }
          }}        />
      )}

      {/* Delete Sheet Dialog */}
       <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the sheet "{activeSheet?.name}" and all its data from this browser.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSheet} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Sheet Dialog */}
      <AlertDialog open={isCreateSheetDialogOpen} onOpenChange={setIsCreateSheetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Create New Sheet</AlertDialogTitle>
            <AlertDialogDescription>
              Please enter a name for your new sheet.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="sheet-name" className="text-right">
                Name
              </Label>
              <Input
                id="sheet-name"
                value={newSheetName}
                onChange={(e) => setNewSheetName(e.target.value)}
                className="col-span-3"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleCreateNewSheet()}
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleCreateNewSheet}>Create</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rename Sheet Dialog */}
      <AlertDialog open={isRenameSheetDialogOpen} onOpenChange={setIsRenameSheetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rename Sheet</AlertDialogTitle>
            <AlertDialogDescription>
              Enter a new name for the sheet "{sheets.find(s => s.id === activeSheetId)?.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="rename-sheet-name" className="text-right">
                Name
              </Label>
              <Input
                id="rename-sheet-name"
                value={newSheetName}
                onChange={(e) => setNewSheetName(e.target.value)}
                className="col-span-3"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleRenameSheet()}
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRenameSheet}>Rename</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Duplicate Entry Warning Dialog */}
      <AlertDialog open={isDuplicateWarningOpen} onOpenChange={setIsDuplicateWarningOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Duplicate Entry Warning</AlertDialogTitle>
            <AlertDialogDescription>
              An entry with the Product Sr No. "{pendingData?.productSrNo}" already exists in this sheet. Are you sure you want to add it again?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setIsDuplicateWarningOpen(false);
              setPendingData(null);
            }}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmAddDuplicate}>Add Anyway</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

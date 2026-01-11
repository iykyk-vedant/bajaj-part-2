'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { extractDataFromImage } from '@/app/actions';
import type { ExtractDataOutput } from '@/ai/schemas/form-extraction-schemas';
import { ImageUploader } from '@/components/image-uploader';
import { useAuth } from '@/contexts/AuthContext';

import { TagEntryForm } from '@/components/tag-entry/TagEntryForm';
import { SettingsTab } from '@/components/tag-entry/SettingsTab';
import { FindTab } from '@/components/tag-entry/FindTab';
import { DispatchTab } from '@/components/tag-entry/DispatchTab';
import { ConsumptionTab } from '@/components/tag-entry/ConsumptionTab';
import { ValidateDataSection } from '@/components/validate-data-section';

import { ScanText, Download, History, Plus, Trash2, MoreVertical, Edit, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SheetOverview } from '@/components/sheet-overview';
import { exportTagEntriesToExcel } from '@/lib/tag-entry/export-utils';
import { addDcNumberWithPartCode } from '@/lib/dc-data-sync';
import { getDcNumbersAction, addDcNumberAction } from '@/app/actions/db-actions';
import { TagEntryPreview } from '@/components/tag-entry/TagEntryPreview';
import { EngineerName } from '@/components/ui/engineer-name';
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
import { ToastAction } from '@/components/ui/toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import UserProfile from '@/components/UserProfile';

// Import server actions for sheet operations
import {
  getAllSheetsAction,
  createSheetAction,
  updateSheetNameAction,
  deleteSheetAction,
  addDataToSheetAction,
  updateSheetDataAction,
  clearSheetDataAction
} from '@/app/actions/sheet-actions';



export type Sheet = {
  id: string;
  name: string;
  data: ExtractDataOutput[];
  createdAt: string;
}

// Remove localStorage key since we're using MySQL
// const STORAGE_KEY = 'nexscan-sheets';
export default function Home() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  // All state declarations must be at the top to maintain hook order
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
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewRefreshTrigger, setPreviewRefreshTrigger] = useState(0);

  // Initialize DC numbers - start with empty array
  const [dcNumbers, setDcNumbers] = useState<string[]>([]);

  // Initialize DC-PartCode mappings
  const [dcPartCodes, setDcPartCodes] = useState<Record<string, string[]>>({});


  // Store form context for extraction
  const [extractionContext, setExtractionContext] = useState<{ sparePartCode?: string; productDescription?: string; }>({});

  // Tag Entry states
  const [activeTab, setActiveTab] = useState<
    "tag-entry" | "dispatch" | "consumption"
  >("tag-entry");

  // Separate engineer name states for each tab
  const [tagEntryEngineerName, setTagEntryEngineerName] = useState<string>('');
  const [consumptionEngineerName, setConsumptionEngineerName] = useState<string>('');
  const [dispatchEngineerName, setDispatchEngineerName] = useState<string>('');

  // Sub-tab state for Tag Entry
  const [tagEntrySubTab, setTagEntrySubTab] = useState<"form" | "settings">("form");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isCapsLockOn, setIsCapsLockOn] = useState(false);
  
  // Check authentication on initial load
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        // Redirect to login if not authenticated
        router.push('/login');
      }
    }
  }, [authLoading, user, router]);

  // Show loading while checking auth status
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // Don't render anything if not authenticated
  if (!user) {
    return null; // The redirect will happen in useEffect
  }
  
  // Load DC numbers and mappings from database only after mount
  useEffect(() => {
    const loadFromDatabase = async () => {
      try {
        const result = await getDcNumbersAction();
        if (result.success) {
          setDcNumbers(result.dcNumbers || []);
          setDcPartCodes(result.dcPartCodes || {});
        }
      } catch (error) {
        console.error('Error loading DC numbers from database:', error);
      }
    };

    // Load initial data from database
    loadFromDatabase();

    // Periodic check to ensure data stays in sync (every 10 seconds)
    const interval = setInterval(() => {
      loadFromDatabase();
    }, 10000);

    return () => {
      clearInterval(interval);
    };
  }, []);
  
  // Load all sheets from database when component mounts
  useEffect(() => {
    const loadSheetsFromDatabase = async () => {
      try {
        const result = await getAllSheetsAction();
        if (result.error) {
          console.error('Error loading sheets from database:', result.error);
          toast({
            variant: 'destructive',
            title: 'Error loading sheets',
            description: result.error,
          });
          return;
        }
        
        setSheets(result.sheets || []);
        
        // If there are sheets and no active sheet is selected, set the first one as active
        if (result.sheets.length > 0 && !activeSheetId) {
          setActiveSheetId(result.sheets[0].id);
        }
      } catch (error) {
        console.error('Error loading sheets from database:', error);
        toast({
          variant: 'destructive',
          title: 'Error loading sheets',
          description: 'Failed to load sheets from database',
        });
      }
    };
    
    loadSheetsFromDatabase();
  }, []);



  // Function to add a new DC number with Part Code
  const addDcNumber = async (dcNo: string, partCode: string) => {
    // Add to database
    try {
      const result = await addDcNumberAction(dcNo, partCode, dcNumbers, dcPartCodes);

      if (result.success) {
        // Update state
        setDcNumbers(result.dcNumbers || []);
        setDcPartCodes(result.dcPartCodes || {});
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error adding DC number to database:', error);
      toast({
        variant: 'destructive',
        title: 'Could not save DC data',
        description: 'There was an error saving the DC number and part codes.',
      });
    }
  };

  useEffect(() => {
    // Update current time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Check caps lock status
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.getModifierState) {
        setIsCapsLockOn(e.getModifierState("CapsLock"));
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.getModifierState) {
        setIsCapsLockOn(e.getModifierState("CapsLock"));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      clearInterval(timer);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

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
      toast({ title: 'No Active Sheet', description: 'Please create a sheet to continue.' });
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

      // Check if a spare part code was extracted and suggest creating a DC entry
      if (result.data?.sparePartCode) {
        toast({
          title: 'Spare Part Code Detected',
          description: `Found spare part code: ${result.data.sparePartCode}. You can create a DC entry for it in the Settings tab.`,
          action: (
            <ToastAction
              altText="Go to Settings"
              onClick={() => {
                // Navigate to the tag-entry page with settings tab active
                window.location.href = '/tag-entry#settings';
              }}
            >
              Go to Settings
            </ToastAction>
          ),
        });
      } else {
        toast({
          title: 'Extraction Successful',
          description: 'Data has been extracted. Review and add to the active Excel sheet.',
        });
      }
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
  }; const confirmAddDuplicate = () => {
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
  }; const handleOpenRenameSheetDialog = () => {
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
  }; const exportToCSV = () => {
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

  // Handle Excel export for Tag Entry
  const handleTagEntryExportExcel = async () => {
    try {
      await exportTagEntriesToExcel();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to export Excel file');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="p-1.5 border-b bg-card/50 backdrop-blur-lg sticky top-0 z-20">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-1">
            <ScanText className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold font-headline text-primary">NexScan</h1>
          </div>
          <div className="flex items-center gap-2">
            <UserProfile />
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsPreviewOpen(true)}
              className="ml-2"
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview
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
                <DropdownMenuItem onClick={() => setIsDeleteDialogOpen(true)} disabled={!activeSheet} className="text-red-500 focus:text-red-500">
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Delete Current Sheet</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
          </div>
        </div>
      </header>

      <TagEntryPreview 
        open={isPreviewOpen} 
        onOpenChange={setIsPreviewOpen} 
        refreshTrigger={previewRefreshTrigger}
      />

      <main className="flex-1 px-4 h-[calc(100vh-120px)] flex flex-col">
        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 mb-2">
          <div className="flex flex-1">
            <button
              className={`py-2 px-4 font-medium text-sm ${activeTab === "tag-entry"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
                }`}
              onClick={() => setActiveTab("tag-entry")}
            >
              Tag Entry
            </button>
            <button
              className={`py-2 px-4 font-medium text-sm ${activeTab === "consumption"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
                }`}
              onClick={() => setActiveTab("consumption")}
            >
              Consumption
            </button>
            <button
              className={`py-2 px-4 font-medium text-sm ${activeTab === "dispatch"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
                }`}
              onClick={() => setActiveTab("dispatch")}
            >
              Dispatch
            </button>
          </div>
          {activeTab === "consumption" && (
            <div className="flex items-center">
              <div className="text-sm font-medium text-gray-700 mr-2">Engg Name:</div>
              <EngineerName
                value={consumptionEngineerName}
                onChange={setConsumptionEngineerName}
                className="w-48"
              />
            </div>
          )}
          {activeTab === "dispatch" && (
            <div className="flex items-center">
              <div className="text-sm font-medium text-gray-700 mr-2">Engg Name:</div>
              <EngineerName
                value={dispatchEngineerName}
                onChange={setDispatchEngineerName}
                className="w-48"
              />
            </div>
          )}
        </div>

        {/* Tab Content */}
        {activeTab === "tag-entry" && (
          <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0 w-full">
            <div className="lg:w-2/5 flex flex-col">
              <ImageUploader
                onImageReady={handleImageReady}
                isLoading={isLoading}
              />
            </div>
            <div className="lg:w-3/5 xl:w-2/3 flex flex-col">
              <ValidateDataSection
                initialData={currentExtractedData}
                isLoading={isLoading}
                onSave={handleAddToSheet}
                sheetActive={!!activeSheet}
                onFormChange={setExtractionContext}
                dcNumbers={dcNumbers}
                dcPartCodes={dcPartCodes}
              />
            </div>
          </div>
        )}

        {activeTab === "dispatch" && (
          <div className="w-full bg-white rounded-lg shadow-md p-6 flex-1">
            <DispatchTab
              dcNumbers={dcNumbers}
              dcPartCodes={dcPartCodes}
              onExportExcel={handleTagEntryExportExcel}
            />
          </div>
        )}

        {activeTab === "consumption" && (
          <div className="w-full bg-white rounded-lg shadow-md p-6 mt-6 flex-1">
            <ConsumptionTab
              dcNumbers={dcNumbers}
              dcPartCodes={dcPartCodes}
              engineerName={consumptionEngineerName}
              onEngineerNameChange={setConsumptionEngineerName}
            />
          </div>
        )}
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
            setSheets(prev => prev.map(s => s.id === activeSheetId ? { ...s, data: [] } : s));

            // Update in MySQL database
            if (activeSheetId) {
              try {
                await updateSheetDataAction(activeSheetId, []); setIsSheetOverviewOpen(false);
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
          }} />
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

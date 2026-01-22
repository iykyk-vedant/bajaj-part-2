"use client";

import { useState, useEffect } from "react";
import { TagEntryForm } from "../../components/tag-entry/TagEntryForm";

import { FindTab } from "../../components/tag-entry/FindTab";
import { ConsumptionTab } from "../../components/tag-entry/ConsumptionTab";
import { StatusBar } from "../../components/tag-entry/StatusBar";
import { exportTagEntriesToExcel } from '@/lib/tag-entry/export-utils';
import { loadDcNumbersFromDb, loadDcPartCodesFromDb, addDcNumberWithPartCode } from '@/lib/dc-data-sync';
import { addDcNumberAction } from '@/app/actions/db-actions';
import { TagEntryPreview } from '@/components/tag-entry/TagEntryPreview';
import { EngineerName } from '@/components/ui/engineer-name';

export default function TagEntryPage() {
  const [activeTab, setActiveTab] = useState<
    "tag-entry" | "dispatch" | "consumption"
  >("tag-entry");
  

  const [currentTime, setCurrentTime] = useState(new Date());
  const [isCapsLockOn, setIsCapsLockOn] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  // Engineer name state that persists across tabs
  const [engineerName, setEngineerName] = useState<string>('');
  
  // Initialize DC numbers - use default values initially
  const [dcNumbers, setDcNumbers] = useState<string[]>([]);
  
  // Initialize DC-PartCode mappings
  const [dcPartCodes, setDcPartCodes] = useState<Record<string, string[]>>({});

  // Load DC numbers and mappings from database after mount
  useEffect(() => {
    const loadDcData = async () => {
      const loadedDcNumbers = await loadDcNumbersFromDb();
      const loadedDcPartCodes = await loadDcPartCodesFromDb();
      
      setDcNumbers(loadedDcNumbers);
      setDcPartCodes(loadedDcPartCodes);
    };
    
    loadDcData();
  }, []);

  // Function to add a new DC number with Part Code
  const addDcNumber = async (dcNo: string, partCode: string) => {
    // Save to database
    try {
      const result = await addDcNumberAction(dcNo, partCode, dcNumbers, dcPartCodes);
      
      if (result.success) {
        // Reload DC numbers and part codes from database to reflect the changes
        const loadedDcNumbers = await loadDcNumbersFromDb();
        const loadedDcPartCodes = await loadDcPartCodesFromDb();
        
        setDcNumbers(loadedDcNumbers);
        setDcPartCodes(loadedDcPartCodes);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error saving DC number to database:', error);
      alert(`Error saving DC number: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Listen for refresh events from child components
  useEffect(() => {
    const handleRefreshDcNumbers = () => {
      const loadDcData = async () => {
        const loadedDcNumbers = await loadDcNumbersFromDb();
        const loadedDcPartCodes = await loadDcPartCodesFromDb();
        
        setDcNumbers(loadedDcNumbers);
        setDcPartCodes(loadedDcPartCodes);
      };
      
      loadDcData();
    };
    
    const eventListener = (e: CustomEvent) => {
      setDcNumbers(e.detail.dcNumbers);
      setDcPartCodes(e.detail.dcPartCodes);
    };
    
    window.addEventListener('refreshDcNumbers', eventListener as EventListener);
    
    return () => {
      window.removeEventListener('refreshDcNumbers', eventListener as EventListener);
    };
  }, []);

  // Check for hash fragment to switch to consumption tab
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (window.location.hash === '#consumption') {
        setActiveTab('consumption');
      }
      
      // Listen for hash changes
      const handleHashChange = () => {
        if (window.location.hash === '#consumption') {
          setActiveTab('consumption');
        }
      };
      
      window.addEventListener('hashchange', handleHashChange);
      return () => window.removeEventListener('hashchange', handleHashChange);
    }
  }, []);

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

  // Handle Excel export
  const handleExportExcel = async (dcNo?: string) => {
    try {
      await exportTagEntriesToExcel(dcNo);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to export Excel file');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      {/* <header className="bg-gray-900 text-white px-6 py-4 flex items-center justify-between shadow">
        <h1 className="text-2xl font-bold">Bajaj Electronics - Tag Entry</h1>
        <div className="flex gap-3">
          <button 
            onClick={handleExportExcel}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center gap-2"
            title="Export all tag entries to Excel"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export Excel
          </button>
          <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded">
            Logout
          </button>
        </div>
      </header> */}

      <div className="w-full bg-white rounded-lg shadow-md p-6 mt-6 flex flex-col flex-1 min-h-0">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Tag Entry System</h2>
          <button 
            onClick={() => setIsPreviewOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Preview Entries
          </button>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 mb-2">
          <div className="flex flex-1">
            <button
              className={`py-2 px-4 font-medium text-sm ${
                activeTab === "tag-entry"
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("tag-entry")}
            >
              Tag Entry
            </button>
            <button
              className={`py-2 px-4 font-medium text-sm ${
                activeTab === "consumption"
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("consumption")}
            >
              Consumption
            </button>
            <button
              className={`py-2 px-4 font-medium text-sm ${
                activeTab === "dispatch"
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
                value={engineerName}
                onChange={setEngineerName}
                className="w-48"
              />
            </div>
          )}
        </div>

        {/* Tab Content */}
        <div className="flex-1 min-h-0 mb-6">
          {activeTab === "tag-entry" && (
            <div className="bg-white rounded-lg shadow-md p-6 flex flex-col flex-1 min-h-0">
              {/* Main Tag Entry Form */}
              <div className="flex-1 min-h-0 mb-6">
                <TagEntryForm 
                  dcNumbers={dcNumbers}
                  dcPartCodes={dcPartCodes}
                />
              </div>
            </div>
          )}
          {activeTab === "dispatch" && (
            <div className="w-full bg-white rounded-lg shadow-md p-6 mt-6 flex-1">
              <FindTab 
                dcNumbers={dcNumbers}
                dcPartCodes={dcPartCodes}
                onExportExcel={handleExportExcel} 
              />
            </div>
          )}
          {activeTab === "consumption" && (
            <div className="w-full bg-white rounded-lg shadow-md p-6 mt-6 flex-1">
              <ConsumptionTab 
                dcNumbers={dcNumbers} 
                dcPartCodes={dcPartCodes} 
                engineerName={engineerName}
                onEngineerNameChange={setEngineerName}
              />
            </div>
          )}
        </div>

        {/* Status Bar */}
        <StatusBar
          currentTime={currentTime}
          isCapsLockOn={isCapsLockOn}
          isOnline={true}
        />
      </div>
      
      <TagEntryPreview 
        open={isPreviewOpen} 
        onOpenChange={setIsPreviewOpen} 
      />
    </div>
  );
}
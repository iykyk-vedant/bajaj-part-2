"use client";

import { useState, useEffect } from "react";
import { TagEntryForm } from "../../components/tag-entry/TagEntryForm";
import { SettingsTab } from "../../components/tag-entry/SettingsTab";
import { FindTab } from "../../components/tag-entry/FindTab";
import { ConsumptionTab } from "../../components/tag-entry/ConsumptionTab";
import { StatusBar } from "../../components/tag-entry/StatusBar";
import { exportTagEntriesToExcel } from "@/lib/tag-entry/export-utils";
import { loadDcNumbers, loadDcPartCodes, saveDcNumbers, saveDcPartCodes, addDcNumberWithPartCode } from "@/lib/dc-data-sync";

export default function TagEntryPage() {
  const [activeTab, setActiveTab] = useState<
    "tag-entry" | "dispatch" | "consumption"
  >("tag-entry");
  
  // Sub-tab state for Tag Entry
  const [tagEntrySubTab, setTagEntrySubTab] = useState<"form" | "settings">("form");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isCapsLockOn, setIsCapsLockOn] = useState(false);
  
  // Initialize DC numbers - use default values initially
  const [dcNumbers, setDcNumbers] = useState<string[]>(loadDcNumbers());
  
  // Initialize DC-PartCode mappings
  const [dcPartCodes, setDcPartCodes] = useState<Record<string, string[]>>(loadDcPartCodes());

  // Load DC numbers and mappings from localStorage after mount
  useEffect(() => {
    const loadedDcNumbers = loadDcNumbers();
    const loadedDcPartCodes = loadDcPartCodes();
    
    setDcNumbers(loadedDcNumbers);
    setDcPartCodes(loadedDcPartCodes);
  }, []);

  // Save DC numbers to localStorage whenever they change
  useEffect(() => {
    saveDcNumbers(dcNumbers);
  }, [dcNumbers]);
  
  // Save DC-PartCode mappings to localStorage whenever they change
  useEffect(() => {
    saveDcPartCodes(dcPartCodes);
  }, [dcPartCodes]);

  // Function to add a new DC number with Part Code
  const addDcNumber = (dcNo: string, partCode: string) => {
    const { dcNumbers: updatedDcNumbers, dcPartCodes: updatedDcPartCodes } = addDcNumberWithPartCode(
      dcNo,
      partCode,
      dcNumbers,
      dcPartCodes
    );
    
    setDcNumbers(updatedDcNumbers);
    setDcPartCodes(updatedDcPartCodes);
  };

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
  const handleExportExcel = async () => {
    try {
      await exportTagEntriesToExcel();
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

      <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-md p-6 mt-6">
        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 mb-6">
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

        {/* Tab Content */}
        <div className="mb-6">
          {activeTab === "tag-entry" && (
            <div className="bg-white rounded-lg shadow-md p-6">
              {/* Sub-tab Navigation */}
              <div className="flex border-b border-gray-200 mb-6">
                <button
                  className={`py-2 px-4 font-medium text-sm ${
                    tagEntrySubTab === "form"
                      ? "border-b-2 border-blue-500 text-blue-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                  onClick={() => setTagEntrySubTab("form")}
                >
                  Tag Entry
                </button>
                <button
                  className={`py-2 px-4 font-medium text-sm ${
                    tagEntrySubTab === "settings"
                      ? "border-b-2 border-blue-500 text-blue-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                  onClick={() => setTagEntrySubTab("settings")}
                >
                  Settings
                </button>
              </div>
              
              {/* Sub-tab Content */}
              <div className="mb-6">
                {tagEntrySubTab === "form" && (
                  <TagEntryForm 
                    dcNumbers={dcNumbers}
                    dcPartCodes={dcPartCodes}
                  />
                )}
                {tagEntrySubTab === "settings" && (
                  <SettingsTab 
                    dcNumbers={dcNumbers}
                    onAddDcNumber={addDcNumber}
                  />
                )}
              </div>
            </div>
          )}
          {activeTab === "dispatch" && <FindTab dcNumbers={dcNumbers} onExportExcel={handleExportExcel} />}
          {activeTab === "consumption" && <ConsumptionTab dcNumbers={dcNumbers} dcPartCodes={dcPartCodes} />}
        </div>

        {/* Status Bar */}
        <StatusBar
          currentTime={currentTime}
          isCapsLockOn={isCapsLockOn}
          isOnline={true}
        />
      </div>
    </div>
  );
}
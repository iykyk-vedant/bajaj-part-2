"use client";

import { useState, useEffect } from "react";
import { TagEntryForm } from "../../components/tag-entry/TagEntryForm";
import { SettingsTab } from "../../components/tag-entry/SettingsTab";
import { FindTab } from "../../components/tag-entry/FindTab";
import { StatusBar } from "../../components/tag-entry/StatusBar";
import { exportTagEntriesToExcel } from "@/lib/tag-entry/export-utils";

export default function TagEntryPage() {
  const [activeTab, setActiveTab] = useState<
    "tag-entry" | "settings" | "find"
  >("tag-entry");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isCapsLockOn, setIsCapsLockOn] = useState(false);
  
  // Initialize DC numbers - use default values initially
  const [dcNumbers, setDcNumbers] = useState<string[]>(['DC001', 'DC002']);
  
  // Initialize DC-PartCode mappings
  const [dcPartCodes, setDcPartCodes] = useState<Record<string, string[]>>({
    'DC001': ['PCB-001', 'PCB-002', 'PCB-003'],
    'DC002': ['PCB-004', 'PCB-005']
  });

  // Load DC numbers and mappings from localStorage after mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('dc-numbers');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setDcNumbers(parsed);
        } catch (e) {
          // Keep default values if parsing fails
        }
      }
      
      const storedMappings = localStorage.getItem('dc-partcode-mappings');
      if (storedMappings) {
        try {
          const parsed = JSON.parse(storedMappings);
          setDcPartCodes(parsed);
        } catch (e) {
          // Keep empty object if parsing fails
        }
      }
    }
  }, []);

  // Save DC numbers to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('dc-numbers', JSON.stringify(dcNumbers));
    }
  }, [dcNumbers]);
  
  // Save DC-PartCode mappings to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('dc-partcode-mappings', JSON.stringify(dcPartCodes));
    }
  }, [dcPartCodes]);

  // Function to add a new DC number with Part Code
  const addDcNumber = (dcNo: string, partCode: string) => {
    if (dcNo && !dcNumbers.includes(dcNo)) {
      setDcNumbers(prev => [...prev, dcNo]);
    }
    
    // Add Part Code mapping
    if (partCode) {
      setDcPartCodes(prev => {
        const currentPartCodes = prev[dcNo] || [];
        
        // Only add the part code if it doesn't already exist
        if (!currentPartCodes.includes(partCode)) {
          return {
            ...prev,
            [dcNo]: [...currentPartCodes, partCode]
          };
        }
        // If part code already exists, return the previous state
        return prev;
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
      setIsCapsLockOn(e.getModifierState("CapsLock"));
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      setIsCapsLockOn(e.getModifierState("CapsLock"));
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
              activeTab === "find"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("find")}
          >
            Find
          </button>
          <button
            className={`py-2 px-4 font-medium text-sm ${
              activeTab === "settings"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("settings")}
          >
            Settings
          </button>
        </div>

        {/* Tab Content */}
        <div className="mb-6">
          {activeTab === "tag-entry" && <TagEntryForm dcNumbers={dcNumbers} dcPartCodes={dcPartCodes} />}
          {activeTab === "find" && <FindTab dcNumbers={dcNumbers} />}
          {activeTab === "settings" && <SettingsTab dcNumbers={dcNumbers} onAddDcNumber={addDcNumber} />}
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
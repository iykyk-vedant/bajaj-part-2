"use client";

import { useState, useEffect } from "react";
import { TagEntryForm } from "../../components/tag-entry/TagEntryForm";
import { ConsumptionTab } from "../../components/tag-entry/ConsumptionTab";
import { SettingsTab } from "../../components/tag-entry/SettingsTab";
import { FindTab } from "../../components/tag-entry/FindTab";
import { StatusBar } from "../../components/tag-entry/StatusBar";

export default function TagEntryPage() {
  const [activeTab, setActiveTab] = useState<
    "tag-entry" | "consumption" | "settings" | "find"
  >("tag-entry");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isCapsLockOn, setIsCapsLockOn] = useState(false);
  
  // Initialize DC numbers from localStorage or use default values
  const [dcNumbers, setDcNumbers] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('dc-numbers');
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (e) {
          return ['DC001', 'DC002'];
        }
      }
    }
    return ['DC001', 'DC002'];
  });

  // Save DC numbers to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('dc-numbers', JSON.stringify(dcNumbers));
    }
  }, [dcNumbers]);

  // Function to add a new DC number
  const addDcNumber = (dcNo: string) => {
    if (dcNo && !dcNumbers.includes(dcNo)) {
      setDcNumbers(prev => [...prev, dcNo]);
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

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-md p-6">
        {/* Header */}
        <div className="bg-gray-800 text-white p-4 rounded-lg mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Bajaj Electronics - Tag Entry</h1>
          <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded">
            Logout
          </button>
        </div>

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
              activeTab === "settings"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("settings")}
          >
            Settings
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
        </div>

        {/* Tab Content */}
        <div className="mb-6">
          {activeTab === "tag-entry" && <TagEntryForm dcNumbers={dcNumbers} />}
          {activeTab === "consumption" && <ConsumptionTab />}
          {activeTab === "settings" && <SettingsTab dcNumbers={dcNumbers} onAddDcNumber={addDcNumber} />}
          {activeTab === "find" && <FindTab dcNumbers={dcNumbers} />}
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
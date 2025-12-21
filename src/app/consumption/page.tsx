'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ConsumptionTab } from '../../components/tag-entry/ConsumptionTab';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { getAllDcNumbersAction } from '@/app/actions';

export default function ConsumptionPage() {
  const router = useRouter();
  // Initialize DC numbers - use empty arrays initially
  const [dcNumbers, setDcNumbers] = useState<string[]>([]);
  
  // Initialize DC-PartCode mappings
  const [dcPartCodes, setDcPartCodes] = useState<Record<string, string[]>>({});

  // Load DC numbers and mappings from database and localStorage after mount
  useEffect(() => {
    const loadFromDatabase = async () => {
      try {
        // Load DC numbers from database
        const result = await getAllDcNumbersAction();
        if (result.dcNumbers && result.dcNumbers.length > 0) {
          // Convert to the format expected by the component
          const dcNumbersList = result.dcNumbers.map(item => item.dcNumber);
          const dcPartCodesMap = result.dcNumbers.reduce((acc, item) => {
            acc[item.dcNumber] = item.partCodes;
            return acc;
          }, {} as Record<string, string[]>);
          
          setDcNumbers(dcNumbersList);
          setDcPartCodes(dcPartCodesMap);
        }
      } catch (error) {
        console.error('Error loading DC numbers from database:', error);
      }
    };
    
    const loadFromLocalStorage = () => {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('dc-numbers');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            setDcNumbers(prev => {
              // Merge with existing data, avoiding duplicates
              const uniqueDcNumbers = [...new Set([...prev, ...parsed])];
              return uniqueDcNumbers;
            });
          } catch (e) {
            console.error('Error parsing DC numbers from localStorage:', e);
          }
        }
        
        const storedMappings = localStorage.getItem('dc-partcode-mappings');
        if (storedMappings) {
          try {
            const parsed = JSON.parse(storedMappings);
            setDcPartCodes(prev => {
              // Merge with existing data
              return { ...prev, ...parsed };
            });
          } catch (e) {
            console.error('Error parsing DC part codes from localStorage:', e);
          }
        }
      }
    };
    
    // Load initial data
    loadFromDatabase();
    loadFromLocalStorage();
    
    // Listen for localStorage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'dc-partcode-mappings' || e.key === 'dc-numbers') {
        loadFromLocalStorage();
      }
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
    }
    
    // Periodic check to ensure data stays in sync (every 5 seconds)
    const interval = setInterval(() => {
      loadFromDatabase();
      loadFromLocalStorage();
    }, 5000);
    
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', handleStorageChange);
      }
      clearInterval(interval);
    };
  }, []);

  // Save DC numbers to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined' && dcNumbers.length > 0) {
      localStorage.setItem('dc-numbers', JSON.stringify(dcNumbers));
    }
  }, [dcNumbers]);
  
  // Save DC-PartCode mappings to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined' && Object.keys(dcPartCodes).length > 0) {
      localStorage.setItem('dc-partcode-mappings', JSON.stringify(dcPartCodes));
    }
  }, [dcPartCodes]);
  return (
    <>
      {/* Simple header with back button */}
      <header className="p-4 border-b bg-card/50 backdrop-blur-lg">
        <div className="container mx-auto flex items-center justify-between">
          <Button 
            variant="outline" 
            onClick={() => router.push('/')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Main
          </Button>
          <h1 className="text-xl font-bold font-headline text-primary">Consumption</h1>
          <div></div> {/* Spacer for alignment */}
        </div>
      </header>
      
      {/* Full-screen consumption content */}
      <div className="flex-1 overflow-auto">
        <ConsumptionTab dcNumbers={dcNumbers} dcPartCodes={dcPartCodes} />
      </div>
    </>
  );
}
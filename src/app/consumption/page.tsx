'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ConsumptionTab } from '../../components/tag-entry/ConsumptionTab';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { loadDcNumbersFromDb, loadDcPartCodesFromDb } from '@/lib/dc-data-sync';

export default function ConsumptionPage() {
  const router = useRouter();
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

  return (
    <div className="min-h-screen w-full flex flex-col bg-background">
      {/* Simple header with back button */}
      <header className="p-4 border-b bg-card/50 backdrop-blur-lg">
        <div className="w-full flex items-center justify-between">
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
      <div className="flex-1 overflow-auto w-full">
        <div className="w-full h-full">
          <ConsumptionTab dcNumbers={dcNumbers} dcPartCodes={dcPartCodes} />
        </div>
      </div>
    </div>
  );
}
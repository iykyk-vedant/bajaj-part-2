'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ConsumptionTab } from '../../components/tag-entry/ConsumptionTab';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { loadDcNumbers, loadDcPartCodes, saveDcNumbers, saveDcPartCodes } from '@/lib/dc-data-sync';

export default function ConsumptionPage() {
  const router = useRouter();
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
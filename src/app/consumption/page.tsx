'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ConsumptionTab } from '../../components/tag-entry/ConsumptionTab';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function ConsumptionPage() {
  const router = useRouter();
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
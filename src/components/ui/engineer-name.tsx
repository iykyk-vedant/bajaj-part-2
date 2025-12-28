import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface EngineerNameProps {
  value: string;
  onChange: (value: string) => void;
  engineers?: string[];
  className?: string;
  disabled?: boolean;
}

const DEFAULT_ENGINEERS = [
  'Engineer 1',
  'Engineer 2',
  'Engineer 3',
  'Engineer 4',
  'Engineer 5'
];

export function EngineerName({ value, onChange, engineers = DEFAULT_ENGINEERS, className = '', disabled = false }: EngineerNameProps) {
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customValue, setCustomValue] = useState('');

  const allEngineers = [...new Set([...DEFAULT_ENGINEERS, ...engineers])]; // Combine and deduplicate

  const handleSelectChange = (newValue: string) => {
    if (newValue === 'add-new') {
      setShowCustomInput(true);
      setCustomValue('');
    } else {
      onChange(newValue);
      setShowCustomInput(false);
    }
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomValue(e.target.value);
  };

  const handleCustomSubmit = () => {
    if (customValue.trim()) {
      onChange(customValue.trim());
      setShowCustomInput(false);
    }
  };

  const handleCustomKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCustomSubmit();
    } else if (e.key === 'Escape') {
      setShowCustomInput(false);
      setCustomValue('');
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-2">
        {!showCustomInput ? (
          <>
            <Select value={value} onValueChange={handleSelectChange}>
              <SelectTrigger className="w-full h-8 text-sm" disabled={disabled}>
                <SelectValue placeholder="Select Engineer" />
              </SelectTrigger>
              <SelectContent>
                {allEngineers.map((engineer) => (
                  <SelectItem key={engineer} value={engineer}>
                    {engineer}
                  </SelectItem>
                ))}
                <SelectItem value="add-new">+ Add New Engineer</SelectItem>
              </SelectContent>
            </Select>
          </>
        ) : (
          <div className="flex gap-2 w-full">
            <div className="flex-1">
              <Input
                type="text"
                value={customValue}
                onChange={handleCustomChange}
                onKeyDown={handleCustomKeyDown}
                placeholder="Enter engineer name"
                className="h-8 text-sm w-full"
                autoFocus
                disabled={disabled}
              />
            </div>
            <Button 
              type="button" 
              size="sm" 
              onClick={handleCustomSubmit}
              className="h-8 px-2 flex-shrink-0"
              disabled={disabled}
            >
              Add
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={() => setShowCustomInput(false)}
              className="h-8 px-2 flex-shrink-0"
              disabled={disabled}
            >
              Cancel
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
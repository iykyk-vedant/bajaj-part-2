import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface EngineerNameProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

export function EngineerName({ value, onChange, className = '', disabled = false }: EngineerNameProps) {
  const [engineers, setEngineers] = useState<{id: number, name: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customValue, setCustomValue] = useState('');

  // Fetch engineers from API
  useEffect(() => {
    const fetchEngineers = async () => {
      try {
        const response = await fetch('/api/engineers');
        const result = await response.json();
        
        if (result.success) {
          setEngineers(result.data);
        } else {
          console.error('Failed to fetch engineers:', result.error);
        }
      } catch (error) {
        console.error('Error fetching engineers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEngineers();
  }, []);

  const handleSelectChange = async (newValue: string) => {
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

  const handleCustomSubmit = async () => {
    const trimmedValue = customValue.trim();
    if (trimmedValue) {
      try {
        // Add to database via API
        const response = await fetch('/api/engineers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: trimmedValue }),
        });
        
        const result = await response.json();
        
        if (result.success) {
          // Update local state
          const newEngineer = { id: Date.now(), name: trimmedValue };
          setEngineers(prev => [...prev, newEngineer]);
          
          // Set the value and close input
          onChange(trimmedValue);
          setShowCustomInput(false);
          setCustomValue('');
        } else {
          console.error('Failed to add engineer:', result.error);
          // Still update the form even if API fails
          onChange(trimmedValue);
          setShowCustomInput(false);
          setCustomValue('');
        }
      } catch (error) {
        console.error('Error adding engineer:', error);
        // Still update the form even if API fails
        onChange(trimmedValue);
        setShowCustomInput(false);
        setCustomValue('');
      }
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

  if (loading) {
    return (
      <div className={`space-y-2 ${className}`}>
        <Select disabled>
          <SelectTrigger className="w-full h-8 text-sm" disabled={disabled}>
            <SelectValue placeholder="Loading engineers..." />
          </SelectTrigger>
        </Select>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-2">
        {!showCustomInput ? (
          <>
            <Select value={value} onValueChange={handleSelectChange} disabled={disabled}>
              <SelectTrigger className="w-full h-8 text-sm">
                <SelectValue placeholder="Select Engineer" />
              </SelectTrigger>
              <SelectContent>
                {engineers.map((engineer) => (
                  <SelectItem key={engineer.id} value={engineer.name}>
                    {engineer.name}
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
              disabled={disabled || !customValue.trim()}
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
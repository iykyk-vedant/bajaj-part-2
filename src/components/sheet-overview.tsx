
'use client';

import { useState, useRef, useEffect, ChangeEvent } from 'react';
import type { ExtractDataOutput } from '@/ai/schemas/form-extraction-schemas';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter
} from '@/components/ui/sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2, Expand, Shrink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

type SheetOverviewProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  sheetData: ExtractDataOutput[];
  onClearSheet: () => void;
  onUpdateData: (rowIndex: number, columnId: string, value: any) => void;
  onRemoveRow: (rowIndex: number) => void;
};

// A new component for an editable table cell
const EditableCell = ({
  value: initialValue,
  rowIndex,
  columnId,
  onUpdateData,
}: {
  value: any;
  rowIndex: number;
  columnId: string;
  onUpdateData: (rowIndex: number, columnId: string, value: any) => void;
}) => {
  const [value, setValue] = useState(initialValue);
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleBlur = () => {
    setIsEditing(false);
    onUpdateData(rowIndex, columnId, value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleBlur();
    } else if (e.key === 'Escape') {
      setValue(initialValue);
      setIsEditing(false);
    }
  };
  
  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  return isEditing ? (
    <Input
      ref={inputRef}
      type="text"
      value={value ?? ''}
      onChange={(e: ChangeEvent<HTMLInputElement>) => setValue(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className="h-8"
    />
  ) : (
    <div onClick={() => setIsEditing(true)} className="min-h-[2rem] w-full px-3 py-2 text-sm">
      {value}
    </div>
  );
};


export function SheetOverview({ 
  isOpen, 
  onOpenChange, 
  sheetData, 
  onClearSheet,
  onUpdateData,
  onRemoveRow,
}: SheetOverviewProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const headers = sheetData.length > 0
    ? ['Sr. No.', ...Object.keys(sheetData[0]).filter(key => key !== 'others')]
    : [];

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent 
        className={cn(
          "w-full sm:max-w-4xl flex flex-col transition-[max-width]",
          isExpanded && "sm:max-w-[95%]"
        )}
      >
        <SheetHeader>
          <div className="flex justify-between items-center">
            <div>
              <SheetTitle>Excel Sheet Overview</SheetTitle>
              <SheetDescription>
                Click any cell to edit. You can clear the sheet or delete individual rows.
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>
        <Button variant="ghost" size="icon" onClick={() => setIsExpanded(!isExpanded)} className="absolute top-4 right-14 h-auto w-auto p-1.5 opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
            {isExpanded ? <Shrink className="h-4 w-4" /> : <Expand className="h-4 w-4" />}
            <span className="sr-only">{isExpanded ? 'Shrink' : 'Expand'}</span>
        </Button>
        <div className="flex-1 min-h-0">
          {sheetData.length > 0 ? (
            <ScrollArea className="h-full">
              <Table>
                <TableHeader className="sticky top-0 bg-secondary">
                  <TableRow>
                    {headers.map(header => (
                      <TableHead key={header} className={cn("capitalize", header === 'Sr. No.' && "w-16 text-center")}>
                        {header.replace(/([A-Z])/g, ' $1')}
                      </TableHead>
                    ))}
                    <TableHead className="w-20 text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sheetData.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="text-center font-medium">{index + 1}</TableCell>
                      {headers.slice(1).map(header => (
                        <TableCell key={header} className="p-0">
                          <EditableCell
                            value={item[header as keyof typeof item]}
                            rowIndex={index}
                            columnId={header}
                            onUpdateData={onUpdateData}
                          />
                        </TableCell>
                      ))}
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onRemoveRow(index)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete row</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <p>No forms have been added to the sheet yet.</p>
            </div>
          )}
        </div>
        <SheetFooter>
            <div className="flex w-full justify-end">
                <Button variant="destructive" onClick={onClearSheet} disabled={sheetData.length === 0}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Clear Sheet
                </Button>
            </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

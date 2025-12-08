'use client';

import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Sparkles, Languages, Loader2, PlusCircle } from 'lucide-react';
import type { ExtractDataOutput } from '@/ai/schemas/form-extraction-schemas';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { translateExtractedData } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { spareParts, type SparePart } from '@/lib/spare-parts';

// Helper function to convert various date formats to yyyy-MM-dd
function convertToHtmlDateFormat(dateString: string): string {
  if (!dateString) return '';
  
  // If it's already in the correct format, return as is
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString;
  }
  
  // Handle MM/dd/yy or MM/dd/yyyy format
  if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(dateString)) {
    const parts = dateString.split('/');
    let month = parts[0];
    let day = parts[1];
    let year = parts[2];
    
    // Pad month and day with leading zeros if needed
    month = month.padStart(2, '0');
    day = day.padStart(2, '0');
    
    // Handle 2-digit years
    if (year.length === 2) {
      const currentYear = new Date().getFullYear();
      const currentCentury = Math.floor(currentYear / 100) * 100;
      const yearNumber = parseInt(year, 10);
      // Assume years <= 50 are 20xx, and years > 50 are 19xx
      year = yearNumber <= 50 ? (currentCentury + yearNumber).toString() : (currentCentury - 100 + yearNumber).toString();
    }
    
    return `${year}-${month}-${day}`;
  }
  
  // Handle dd-MM-yyyy format
  if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(dateString)) {
    const parts = dateString.split('-');
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    const year = parts[2];
    return `${year}-${month}-${day}`;
  }
  
  // If we can't parse it, try to create a Date object and format it properly
  const dateObj = new Date(dateString);
  if (!isNaN(dateObj.getTime())) {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  // If all else fails, return empty string
  return '';
}

const formSchema = z.object({
  branch: z.string().optional(),
  bccdName: z.string().optional(),
  productDescription: z.string().optional(),
  productSrNo: z.string().optional(),
  dateOfPurchase: z.string().optional(),
  complaintNo: z.string().optional(),
  sparePartCode: z.string().optional(),
  natureOfDefect: z.string().optional(),
  technicianName: z.string().optional(),
});

type DataFormProps = {
  initialData: ExtractDataOutput | null;
  isLoading: boolean;
  onSave: (data: ExtractDataOutput) => void;
  sheetActive: boolean;
  onFormChange: (context: { sparePartCode?: string; productDescription?: string }) => void;
};

export function DataForm({ initialData, isLoading, onSave, sheetActive, onFormChange }: DataFormProps) {
  const [isTranslating, setIsTranslating] = useState(false);
  const [language, setLanguage] = useState('en');
  const [otherText, setOtherText] = useState(initialData?.others || '');
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      branch: '',
      bccdName: '',
      productDescription: '',
      productSrNo: '',
      dateOfPurchase: '',
      complaintNo: '',
      sparePartCode: '',
      natureOfDefect: '',
      technicianName: '',
    },
  });

  const watchedValues = useWatch({ control: form.control });

  useEffect(() => {
    onFormChange({
      sparePartCode: watchedValues.sparePartCode,
      productDescription: watchedValues.productDescription
    });
  }, [watchedValues, onFormChange]);


  useEffect(() => {
    if (watchedValues.sparePartCode) {
      const part = spareParts.find(p => p.code === watchedValues.sparePartCode);
      if (part && form.getValues('productDescription') !== part.description) {
        form.setValue('productDescription', part.description, { shouldValidate: true });
      }
    }
  }, [watchedValues.sparePartCode, form]);


  useEffect(() => {
    if (initialData) {
      const formattedDate = convertToHtmlDateFormat(initialData.dateOfPurchase || '');
      
      form.reset({
        branch: initialData.branch ?? '',
        bccdName: initialData.bccdName ?? '',
        productDescription: initialData.productDescription ?? '',
        productSrNo: initialData.productSrNo ?? '',
        dateOfPurchase: formattedDate,
        complaintNo: initialData.complaintNo ?? '',
        sparePartCode: initialData.sparePartCode ?? '',
        natureOfDefect: initialData.natureOfDefect ?? '',
        technicianName: initialData.technicianName ?? '',
      });
      setOtherText(initialData.others ?? '');
    } else {
      // Clear form when there is no data, but preserve spare part selection
      const currentSparePartCode = form.getValues('sparePartCode');
      const currentProductDescription = form.getValues('productDescription');
      form.reset({
        branch: '',
        bccdName: '',
        productDescription: currentSparePartCode ? currentProductDescription : '',
        productSrNo: '',
        dateOfPurchase: '',
        complaintNo: '',
        sparePartCode: currentSparePartCode,
        natureOfDefect: '',
        technicianName: '',
      });
      setOtherText('');
    }
  }, [initialData, form]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    onSave(values); 
    // After saving, clear the form fields but keep the spare part selection
    form.reset({
      ...form.getValues(),
      branch: '',
      bccdName: '',
      productSrNo: '',
      dateOfPurchase: '',
      complaintNo: '',
      natureOfDefect: '',
      technicianName: '',
    });
    setOtherText('');
  }
  
  const handleTranslate = async () => {
    const dataToTranslate = initialData || form.getValues();
    if (!dataToTranslate) return;

    setIsTranslating(true);
    // We include `otherText` for translation, but it won't be saved.
    const fullDataToTranslate = { ...dataToTranslate, others: otherText };

    const result = await translateExtractedData(fullDataToTranslate, language);
    if (result.error) {
      toast({
        variant: 'destructive',
        title: 'Translation Failed',
        description: result.error,
      });
    } else if (result.data) {
      const { others, ...formData } = result.data;
      form.reset(formData);
      setOtherText(others || '');
      toast({
        title: 'Translation Successful',
        description: `Text translated to ${language}.`,
      });
    }
    setIsTranslating(false);
  };

  if (!initialData && !isLoading) {
    return (
        <Card className="flex-1 flex flex-col justify-center items-center min-h-[500px] lg:min-h-full border-dashed">
            <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <Sparkles className="w-12 h-12 text-muted-foreground" />
                </div>
                <CardTitle className="font-headline text-2xl">Validate Data</CardTitle>
                <CardDescription>
                    {sheetActive ? 'Upload or capture a form image to begin.' : 'Create or select a sheet to start scanning.'}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground text-sm">The extracted fields will appear here for validation.</p>
            </CardContent>
        </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="flex-1 flex flex-col justify-center items-center min-h-[500px] lg:min-h-full">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Extracting data from image...</p>
      </Card>
    )
  }

  return (
    <Card className="flex-1">
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <CardTitle className="font-headline text-2xl">Validate Data</CardTitle>
            <CardDescription>Review, translate, and add the extracted information to the Excel sheet.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="hi">Hindi</SelectItem>
                <SelectItem value="mr">Marathi</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleTranslate} variant="outline" disabled={isTranslating || isLoading}>
              {isTranslating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Languages className="mr-2 h-4 w-4" />
              )}
              Translate
            </Button>
          </div>
        </div>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="sparePartCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Spare Part Code</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a spare part code" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {spareParts.map((part: SparePart) => (
                          <SelectItem key={part.code} value={part.code}>
                            {part.code}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="productDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Description</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 24-inch Monitor" {...field} value={field.value ?? ''} readOnly={!!watchedValues.sparePartCode} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="branch"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Branch</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Main Street Branch" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bccdName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>BCCD Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., John Doe" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="productSrNo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Sr No</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., SN12345678" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dateOfPurchase"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Purchase</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 2024-01-15" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="complaintNo"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Complaint No.</FormLabel>
                        <FormControl>
                        <Input placeholder="e.g., C-98765" {...field} value={field.value ?? ''} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                 <FormField
                  control={form.control}
                  name="technicianName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Technician Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Jane Smith" {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>
            <FormField
              control={form.control}
              name="natureOfDefect"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nature of Defect</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe the defect..." {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             {otherText && (
              <div>
                <Label htmlFor="others-text">Other Extracted Text (will be discarded)</Label>
                <div id="others-text" className="mt-2 rounded-md border bg-muted p-3 text-sm text-muted-foreground min-h-[80px]">
                  {otherText}
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button type="submit" disabled={isLoading || isTranslating || !sheetActive}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add to Excel
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
import { TagEntry } from './types';

/**
 * Utility function to export tag entries to Excel format
 * 
 * This function fetches all tag entries from localStorage and sends them
 * to the API endpoint to generate an Excel file matching the template format.
 * 
 * @returns Promise that resolves when the file download is triggered
 */
export async function exportTagEntriesToExcel(dcNo?: string): Promise<void> {
  try {
    let entries;
    
    if (dcNo) {
      // If DC number is provided, fetch only entries for that DC number
      const { getConsolidatedDataEntriesByDcNoAction } = await import('@/app/actions/consumption-actions');
      const result = await getConsolidatedDataEntriesByDcNoAction(dcNo);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch entries from database');
      }
      
      entries = result.data;
    } else {
      // Get all tag entries from the database
      const { getConsolidatedDataEntries } = await import('@/app/actions/consumption-actions');
      const result = await getConsolidatedDataEntries();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch entries from database');
      }

      entries = result.data;
    }

    if (!entries || entries.length === 0) {
      throw new Error('No entries to export. Please save some entries first.');
    }

    // Call API endpoint with POST request
    const response = await fetch('/api/export-excel', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ entries, dcNo }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate Excel file');
    }

    // Get the blob from response
    const blob = await response.blob();
    
    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    // Use DC number in filename if provided
    if (dcNo) {
      link.download = `Tag_Entries_Export_DC_${dcNo}_${new Date().toISOString().split('T')[0]}.xlsx`;
    } else {
      link.download = `Tag_Entries_Export_${new Date().toISOString().split('T')[0]}.xlsx`;
    }
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL object
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    throw error;
  }
}


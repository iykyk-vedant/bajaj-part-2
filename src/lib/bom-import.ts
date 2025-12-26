import fs from 'fs';
import path from 'path';
import pool from './pg-db';
import ExcelJS from 'exceljs';
/**
 * Import BOM data from a CSV file
 * Expected CSV format:
 * part_code,location,description
 * RES-001,R1,1K Ohm Resistor
 * CAP-001,C1,10uF Capacitor
 * 
 * @param csvFilePath Path to the CSV file containing BOM data
 */
export async function importBomFromCsv(csvFilePath: string): Promise<{ success: boolean; message: string }> {
  try {
    // Check if file exists
    if (!fs.existsSync(csvFilePath)) {
      return { success: false, message: `File not found: ${csvFilePath}` };
    }

    // Read the CSV file
    const csvData = fs.readFileSync(csvFilePath, 'utf8');
    
    // Split into lines and remove header
    const lines = csvData.split('\n').filter(line => line.trim() !== '');
    if (lines.length <= 1) {
      return { success: false, message: 'CSV file is empty or contains only header' };
    }

    // Process each line (skip header)
    const bomData: [string, string, string][] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line) {
        const [partCode, location, description] = line.split(',').map(field => field.trim());
        if (partCode && location) {
          bomData.push([partCode, location, description || '']);
        }
      }
    }

    // Insert data into database
    let insertedCount = 0;
    for (const [partCode, location, description] of bomData) {
      try {
        await pool.query(
          'INSERT INTO bom (part_code, location, description) VALUES ($1, $2, $3) ON CONFLICT (part_code, location) DO NOTHING',
          [partCode, location, description]
        );
        insertedCount++;
      } catch (insertError) {
        console.error(`Error inserting BOM entry (${partCode}@${location}):`, insertError);
      }
    }

    return { 
      success: true, 
      message: `Successfully imported ${insertedCount} BOM entries from ${csvFilePath}` 
    };
  } catch (error) {
    console.error('Error importing BOM data:', error);
    return { 
      success: false, 
      message: `Failed to import BOM data: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
}

/**
 * Import BOM data from a JSON file
 * Expected JSON format:
 * [
 *   {
 *     "part_code": "RES-001",
 *     "location": "R1",
 *     "description": "1K Ohm Resistor"
 *   },
 *   {
 *     "part_code": "CAP-001",
 *     "location": "C1",
 *     "description": "10uF Capacitor"
 *   }
 * ]
 * 
 * @param jsonFilePath Path to the JSON file containing BOM data
 */
export async function importBomFromJson(jsonFilePath: string): Promise<{ success: boolean; message: string }> {
  try {
    // Check if file exists
    if (!fs.existsSync(jsonFilePath)) {
      return { success: false, message: `File not found: ${jsonFilePath}` };
    }

    // Read and parse the JSON file
    const jsonData = fs.readFileSync(jsonFilePath, 'utf8');
    const bomData = JSON.parse(jsonData);

    // Validate data structure
    if (!Array.isArray(bomData)) {
      return { success: false, message: 'JSON file must contain an array of BOM entries' };
    }

    // Insert data into database
    let insertedCount = 0;
    for (const entry of bomData) {
      if (entry.part_code && entry.location) {
        try {
          await pool.query(
            'INSERT INTO bom (part_code, location, description) VALUES ($1, $2, $3) ON CONFLICT (part_code, location) DO NOTHING',
            [entry.part_code, entry.location, entry.description || '']
          );
          insertedCount++;
        } catch (insertError) {
          console.error(`Error inserting BOM entry (${entry.part_code}@${entry.location}):`, insertError);
        }
      }
    }

    return { 
      success: true, 
      message: `Successfully imported ${insertedCount} BOM entries from ${jsonFilePath}` 
    };
  } catch (error) {
    console.error('Error importing BOM data:', error);
    return { 
      success: false, 
      message: `Failed to import BOM data: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
}

/**
 * Import BOM data from an Excel file
 * Expected Excel format:
 * Sheet1 with columns: Part Code, Location, Description
 * 
 * @param excelFilePath Path to the Excel file containing BOM data
 */
export async function importBomFromExcel(excelFilePath: string): Promise<{ success: boolean; message: string }> {
  try {
    // Check if file exists
    if (!fs.existsSync(excelFilePath)) {
      return { success: false, message: `File not found: ${excelFilePath}` };
    }

    // Load the Excel workbook
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(excelFilePath);
    
    // Get the first worksheet
    const worksheet = workbook.worksheets[0];
    
    if (!worksheet) {
      return { success: false, message: 'Excel file does not contain any worksheets' };
    }

    // Extract data from rows (skip header row)
    const bomData: [string, string, string][] = [];
    
    // Process rows starting from row 2 (since row 1 is header)
    for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
      const row = worksheet.getRow(rowNumber);
      const partCode = row.getCell(2).text?.trim();  // Part Code is in column B (index 2)
      const location = row.getCell(3).text?.trim();  // Location is in column C (index 3)
      const description = row.getCell(4).text?.trim() || ''; // Description is in column D (index 4)
      
      // Skip rows with missing part code or location
      if (partCode && location && partCode !== '' && location !== '') {
        bomData.push([partCode, location, description]);
      }
    }

    // Insert data into database
    let insertedCount = 0;
    for (const [partCode, location, description] of bomData) {
      try {
        await pool.query(
          'INSERT INTO bom (part_code, location, description) VALUES ($1, $2, $3) ON CONFLICT (part_code, location) DO NOTHING',
          [partCode, location, description]
        );
        insertedCount++;
      } catch (insertError) {
        console.error(`Error inserting BOM entry (${partCode}@${location}):`, insertError);
      }
    }

    return { 
      success: true, 
      message: `Successfully imported ${insertedCount} BOM entries from ${excelFilePath}` 
    };
  } catch (error) {
    console.error('Error importing BOM data from Excel:', error);
    return { 
      success: false, 
      message: `Failed to import BOM data from Excel: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
}

/**
 * Sample BOM data for reference
 * Save this as a template for your own BOM files
 */
export const SAMPLE_BOM_CSV = `part_code,location,description
RES-001,R1,1K Ohm Resistor
CAP-001,C1,10uF Capacitor
IC-001,U1,Microcontroller
LED-001,D1,Red LED
CONN-001,J1,Power Connector
`;

export const SAMPLE_BOM_JSON = [
  {
    "part_code": "RES-001",
    "location": "R1",
    "description": "1K Ohm Resistor"
  },
  {
    "part_code": "CAP-001",
    "location": "C1",
    "description": "10uF Capacitor"
  },
  {
    "part_code": "IC-001",
    "location": "U1",
    "description": "Microcontroller"
  },
  {
    "part_code": "LED-001",
    "location": "D1",
    "description": "Red LED"
  },
  {
    "part_code": "CONN-001",
    "location": "J1",
    "description": "Power Connector"
  }
];
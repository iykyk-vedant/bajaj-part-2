import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';
import { TagEntry } from '@/lib/tag-entry/types';

/**
 * API Route: /api/export-excel
 * 
 * This endpoint generates an Excel file based on the template Export_RC252700000456_971040.xlsx
 * and populates it with tag entries from localStorage.
 * 
 * The exported file matches the exact structure, column order, naming conventions,
 * styling, and formatting used in the reference file.
 */

export async function POST(request: NextRequest) {
  try {
    // Get request body to check if DC number is provided
    const body = await request.json();
    const { entries, dcNo } = body;

    if (!entries || entries.length === 0) {
      return NextResponse.json(
        { error: 'No entries to export' },
        { status: 400 }
      );
    }

    // Path to the template Excel file
    const templatePath = path.join(process.cwd(), 'Export_RC252700000456_971040.xlsx');

    // Check if template exists
    if (!fs.existsSync(templatePath)) {
      return NextResponse.json(
        { error: 'Template file not found' },
        { status: 404 }
      );
    }

    // Load the template workbook
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(templatePath);
    
    // Get the worksheet (should be named "ExportData" based on template)
    let worksheet = workbook.getWorksheet('ExportData');
    if (!worksheet) {
      // If sheet doesn't exist, use the first sheet
      worksheet = workbook.worksheets[0];
    }
        
    // Clear autoFilter to prevent conflicts
    worksheet.autoFilter = undefined;
        
    // Clear all data rows (keep header row)
    const headerRow = worksheet.getRow(1);
    worksheet.spliceRows(2, worksheet.rowCount - 1);

    // Map tag entries to Excel format matching the template structure
    // Column order matches the template:
    // 1. Sr_No, 2. DC_No, 3. DC_Date, 4. Branch, 5. BCCD_Name, 6. Product_Description,
    // 7. Product_Sr_No, 8. Date_of_Purchase, 9. Complaint_No, 10. PartCode, 11. Defect,
    // 12. Visiting_Tech_Name, 13. Mfg_Month_Year, 14. Repair_Date, 15. Defect_Age,
    // 16. PCB_Sr_No, 17. RF_Observation, 18. Testing, 19. Failuer, 20. Analysis,
    // 21. Component_Consumption, 22. Status, 23. Send_Date, 24. Engg_Name,
    // 25. Tag_Entry_By, 26. Consumption_Entry_By, 27. Dispatch_Entry_By,
    // 28. Tag_Entry, 29. Tag_Entry_Date, 30. Consumption_Entry, 31. Consumption_Entry_Date

    entries.forEach((entry: any, index: number) => {
      const row = worksheet.addRow([]);
      
      // Get current date for timestamps
      const currentDate = new Date();
      const dateStr = currentDate.toLocaleDateString('en-GB'); // DD/MM/YYYY format
      const dateTimeStr = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD format

      // Map each field according to template column order
      row.getCell(1).value = entry.sr_no || (index + 1).toString(); // Sr_No
      row.getCell(2).value = entry.dc_no || ''; // DC_No
      row.getCell(3).value = entry.dc_date || dateStr; // DC_Date
      row.getCell(4).value = entry.branch || ''; // Branch
      row.getCell(5).value = entry.bccd_name || entry.bccdName || ''; // BCCD_Name
      row.getCell(6).value = entry.product_description || entry.productDescription || ''; // Product_Description
      row.getCell(7).value = entry.product_sr_no || entry.productSrNo || ''; // Product_Sr_No
      row.getCell(8).value = entry.date_of_purchase || entry.dateOfPurchase || ''; // Date_of_Purchase
      row.getCell(9).value = entry.complaint_no || entry.complaintNo || ''; // Complaint_No
      row.getCell(10).value = entry.part_code || entry.partCode || ''; // PartCode
      row.getCell(11).value = entry.nature_of_defect || entry.defect || ''; // Defect
      row.getCell(12).value = entry.visiting_tech_name || entry.visitingTechName || ''; // Visiting_Tech_Name
      row.getCell(13).value = entry.mfg_month_year || entry.mfgMonthYear || ''; // Mfg_Month_Year
      row.getCell(14).value = entry.repair_date || entry.repairDate || ''; // Repair_Date
      row.getCell(15).value = entry.defect_age || entry.defectAge || ''; // Defect_Age
      row.getCell(16).value = entry.pcb_sr_no || entry.pcbSrNo || ''; // PCB_Sr_No
      row.getCell(17).value = entry.testing || ''; // Testing
      row.getCell(18).value = entry.failure || ''; // Failure
      row.getCell(19).value = entry.analysis || ''; // Analysis
      row.getCell(20).value = entry.component_consumption || entry.componentConsumption || ''; // Component_Consumption
      row.getCell(21).value = entry.status || ''; // Status
      row.getCell(22).value = entry.send_date || entry.dispatch_date || entry.sendDate || ''; // Send_Date
      row.getCell(23).value = entry.engg_name || entry.enggName || ''; // Engg_Name
      row.getCell(24).value = entry.tag_entry_by || entry.tagEntryBy || ''; // Tag_Entry_By
      row.getCell(25).value = entry.consumption_entry_by || entry.consumptionEntryBy || ''; // Consumption_Entry_By
      row.getCell(26).value = entry.dispatch_entry_by || entry.dispatchEntryBy || ''; // Dispatch_Entry_By
      row.getCell(28).value = 'Yes'; // Tag_Entry (mark as Yes since we're exporting tag entries)
      row.getCell(29).value = dateTimeStr; // Tag_Entry_Date (current date)
      row.getCell(30).value = 'Yes'; // Consumption_Entry (mark as Yes since we're exporting consolidated entries)
      row.getCell(31).value = dateTimeStr; // Consumption_Entry_Date (current date)

      // Apply formatting to match template style
      row.eachCell((cell) => {
        cell.font = { name: 'Calibri', size: 11 };
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });

    // Apply header row formatting (if not already formatted)
    headerRow.eachCell((cell) => {
      cell.font = { name: 'Calibri', size: 11, bold: true };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD9D9D9' } // Light gray background
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
    
    // Auto-size columns to fit content
    worksheet.columns.forEach((column) => {
      if (column && column.eachCell) {
        let maxLength = 0;
        column.eachCell({ includeEmpty: false }, (cell) => {
          const cellValue = cell.value ? cell.value.toString() : '';
          maxLength = Math.max(maxLength, cellValue.length);
        });
        column.width = Math.min(Math.max(maxLength + 2, 10), 50);
      }
    });

    // Set proper autoFilter range after data is populated
    if (entries.length > 0) {
      // Apply autoFilter to the range that contains data: A1 to AD(n+1) where n is number of entries
      worksheet.autoFilter = `A1:AD${entries.length + 1}`;
    } else {
      // Clear autoFilter if no data
      worksheet.autoFilter = undefined;
    }

    // Generate Excel file buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Generate filename with DC number if provided, otherwise with timestamp
    let filename;
    if (dcNo) {
      filename = `Tag_Entries_Export_DC_${dcNo}_${new Date().toISOString().replace(/[:.]/g, '-').split('T')[0]}.xlsx`;
    } else {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
      filename = `Tag_Entries_Export_${timestamp}.xlsx`;
    }

    // Return the file as a download
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error generating Excel export:', error);
    return NextResponse.json(
      { error: 'Failed to generate Excel export', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}


import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';

export async function POST(request: Request) {
  try {
    const { consumptionEntries, tagEntries } = await request.json();

    // Create a new workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Consumption Data');

    // Define columns for the worksheet
    worksheet.columns = [
      { header: 'Sr No', key: 'srNo', width: 15 },
      { header: 'DC No', key: 'dcNo', width: 15 },
      { header: 'DC Date', key: 'dcDate', width: 15 },
      { header: 'Branch', key: 'branch', width: 20 },
      { header: 'BCCD Name', key: 'bccdName', width: 20 },
      { header: 'Product Description', key: 'productDescription', width: 30 },
      { header: 'Product Sr No', key: 'productSrNo', width: 20 },
      { header: 'Date of Purchase', key: 'dateOfPurchase', width: 20 },
      { header: 'Complaint No', key: 'complaintNo', width: 20 },
      { header: 'Part Code', key: 'partCode', width: 15 },
      { header: 'Nature of Defect', key: 'natureOfDefect', width: 20 },
      { header: 'Visiting Tech Name', key: 'visitingTechName', width: 25 },
      { header: 'Mfg Month/Year', key: 'mfgMonthYear', width: 20 },
      { header: 'Repair Date', key: 'repairDate', width: 15 },
      { header: 'Testing', key: 'testing', width: 15 },
      { header: 'Failure', key: 'failure', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'PCB Sr No', key: 'pcbSrNo', width: 20 },
      { header: 'RF Observation', key: 'rfObservation', width: 25 },
      { header: 'Analysis', key: 'analysis', width: 30 },
      { header: 'Validation Result', key: 'validationResult', width: 30 },
      { header: 'Component Change', key: 'componentChange', width: 30 },
      { header: 'Engineer Name', key: 'enggName', width: 20 },
      { header: 'Dispatch Date', key: 'dispatchDate', width: 15 },
    ];

    // For export, we'll use the consolidated_data table which already has combined data
    // Get all consolidated data entries from the database
    const { getAllConsolidatedDataEntries } = await import('@/lib/pg-db');
    const allConsolidatedData = await getAllConsolidatedDataEntries();

    // Add all consolidated data to the worksheet
    allConsolidatedData.forEach((entry: any) => {
      worksheet.addRow({
        srNo: tagEntry.srNo,
        dcNo: tagEntry.dcNo,
        dcDate: tagEntry.dateOfPurchase, // Assuming DC Date is the same as Date of Purchase
        branch: tagEntry.branch,
        bccdName: tagEntry.bccdName,
        productDescription: tagEntry.productDescription,
        productSrNo: tagEntry.productSrNo,
        dateOfPurchase: tagEntry.dateOfPurchase,
        complaintNo: tagEntry.complaintNo,
        partCode: tagEntry.partCode,
        natureOfDefect: tagEntry.natureOfDefect,
        visitingTechName: tagEntry.visitingTechName,
        mfgMonthYear: tagEntry.mfgMonthYear,
        // Consumption-specific fields
        repairDate: entry.repair_date || '',
        testing: entry.testing || '',
        failure: entry.failure || '',
        status: entry.status || '',
        pcbSrNo: entry.pcb_sr_no || '',
        rfObservation: entry.rf_observation || '',
        analysis: entry.analysis || '',
        validationResult: entry.validation_result || '',
        componentChange: entry.component_change || '',
        enggName: entry.engg_name || '',
        dispatchDate: entry.dispatch_date || '',
      });
    });

    // Add any consumption entries that don't have corresponding tag entries
    consumptionEntries.forEach((entry: any) => {
      if (entry.srNo && !tagEntryMap.has(entry.srNo)) {
        worksheet.addRow({
          srNo: entry.srNo || '',
          dcNo: '',
          dcDate: '',
          branch: '',
          bccdName: '',
          productDescription: '',
          productSrNo: '',
          dateOfPurchase: '',
          complaintNo: '',
          partCode: '',
          natureOfDefect: '',
          visitingTechName: '',
          mfgMonthYear: '',
          // Consumption-specific fields
          repairDate: entry.repairDate,
          testing: entry.testing,
          failure: entry.failure,
          status: entry.status,
          pcbSrNo: entry.pcbSrNo,
          rfObservation: entry.rfObservation,
          analysis: entry.analysis,
          validationResult: entry.validationResult,
          componentChange: entry.componentChange,
          enggName: entry.enggName,
          dispatchDate: entry.dispatchDate,
        });
      }
    });

    // Generate Excel file
    const buffer = await workbook.xlsx.writeBuffer();

    // Return the Excel file as a response
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename=consumption_export.xlsx',
      },
    });
  } catch (error) {
    console.error('Error generating Excel file:', error);
    return NextResponse.json(
      { error: 'Failed to generate Excel file' },
      { status: 500 }
    );
  }
}
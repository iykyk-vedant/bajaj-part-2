# Excel Export Implementation Documentation

## Overview

This document describes the Excel export functionality implemented for the Tag Entry system. The export feature generates Excel files that match the exact structure, column order, naming conventions, styling, and formatting used in the reference template file `Export_RC252700000456_971040.xlsx`.

## Architecture

### Components

1. **API Route** (`src/app/api/export-excel/route.ts`)
   - Handles POST requests to generate Excel files
   - Reads the template Excel file from the project root
   - Maps tag entries to the template structure
   - Returns the generated Excel file as a downloadable response

2. **Export Utility** (`src/lib/tag-entry/export-utils.ts`)
   - Frontend utility function to trigger Excel export
   - Retrieves tag entries from localStorage
   - Calls the API endpoint and handles file download

3. **Frontend Integration**
   - Export button added to both `validate-data-section.tsx` and `tag-entry/page.tsx`
   - Button located in the header area next to the Logout button

## Template Structure

The reference Excel file (`Export_RC252700000456_971040.xlsx`) contains the following structure:

### Sheet Name
- **ExportData** (primary worksheet)

### Column Structure (28 columns)

1. **Sr_No** - Serial Number
2. **DC_No** - DC Number
3. **DC_Date** - DC Date
4. **Branch** - Branch name
5. **BCCD_Name** - BCCD Name
6. **Product_Description** - Product Description
7. **Product_Sr_No** - Product Serial Number
8. **Date_of_Purchase** - Date of Purchase
9. **Complaint_No** - Complaint Number
10. **PartCode** - Part Code
11. **Defect** - Nature of Defect
12. **Visiting_Tech_Name** - Visiting Technician Name
13. **Mfg_Month_Year** - Manufacturing Month/Year
14. **Repair_Date** - Repair Date (not in tag entry, left blank)
15. **Defect_Age** - Defect Age (not in tag entry, left blank)
16. **PCB_Sr_No** - PCB Serial Number
17. **RF_Observation** - RF Observation (not in tag entry, left blank)
18. **Testing** - Testing (not in tag entry, left blank)
19. **Failuer** - Failure (not in tag entry, left blank)
20. **Analysis** - Analysis (not in tag entry, left blank)
21. **Component_Consumption** - Component Consumption (not in tag entry, left blank)
22. **Status** - Status (not in tag entry, left blank)
23. **Send_Date** - Send Date (not in tag entry, left blank)
24. **Engg_Name** - Engineer Name (not in tag entry, left blank)
25. **Tag_Entry** - Tag Entry flag (set to "Yes" for exported entries)
26. **Tag_Entry_Date** - Tag Entry Date (current date)
27. **Consumption_Entry** - Consumption Entry (not applicable, left blank)
28. **Consumption_Entry_Date** - Consumption Entry Date (not applicable, left blank)

## Data Mapping

The API route maps TagEntry fields to Excel columns as follows:

| TagEntry Field | Excel Column | Notes |
|---------------|-------------|-------|
| `srNo` | Sr_No | Serial number |
| `dcNo` | DC_No | DC number |
| - | DC_Date | Current date (placeholder) |
| `branch` | Branch | Branch name |
| `bccdName` | BCCD_Name | BCCD name |
| `productDescription` | Product_Description | Product description |
| `productSrNo` | Product_Sr_No | Product serial number |
| `dateOfPurchase` | Date_of_Purchase | Date of purchase |
| `complaintNo` | Complaint_No | Complaint number |
| `partCode` | PartCode | Part code |
| `natureOfDefect` | Defect | Nature of defect |
| `visitingTechName` | Visiting_Tech_Name | Visiting technician name |
| `mfgMonthYear` | Mfg_Month_Year | Manufacturing month/year |
| `pcbSrNo` | PCB_Sr_No | PCB serial number |
| - | Tag_Entry | Set to "Yes" |
| - | Tag_Entry_Date | Current date |

## Formatting

The exported Excel file maintains the following formatting to match the template:

- **Header Row:**
  - Font: Calibri, 11pt, Bold
  - Alignment: Center (vertical and horizontal)
  - Background: Light gray (#D9D9D9)
  - Borders: Thin borders on all sides

- **Data Rows:**
  - Font: Calibri, 11pt
  - Alignment: Left (horizontal), Middle (vertical)
  - Borders: Thin borders on all sides

- **Column Width:**
  - Auto-sized based on content
  - Minimum width: 10 characters
  - Maximum width: 50 characters

## Usage

### Frontend Usage

```typescript
import { exportTagEntriesToExcel } from '@/lib/tag-entry/export-utils';

// In a component
const handleExport = async () => {
  try {
    await exportTagEntriesToExcel();
  } catch (error) {
    alert(error.message);
  }
};
```

### API Endpoint

**Endpoint:** `POST /api/export-excel`

**Request Body:**
```json
{
  "entries": [
    {
      "id": "123",
      "srNo": "001",
      "dcNo": "DC001",
      "branch": "Mumbai",
      // ... other fields
    }
  ]
}
```

**Response:**
- Content-Type: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- File download with filename: `Tag_Entries_Export_YYYY-MM-DD.xlsx`

## Error Handling

The implementation includes error handling for:

1. **Missing entries:** Returns 400 error if no entries provided
2. **Template file not found:** Returns 404 error if template file is missing
3. **File generation errors:** Returns 500 error with error details
4. **Frontend errors:** Shows user-friendly error messages via alerts

## Dependencies

- **exceljs**: Library for reading and writing Excel files
- **Next.js API Routes**: For server-side file generation
- **TypeScript**: For type safety

## File Locations

- API Route: `src/app/api/export-excel/route.ts`
- Export Utility: `src/lib/tag-entry/export-utils.ts`
- Template File: `Export_RC252700000456_971040.xlsx` (project root)
- Frontend Integration: 
  - `src/components/validate-data-section.tsx`
  - `src/app/tag-entry/page.tsx`

## Notes

1. The template file must exist in the project root directory
2. Tag entries are stored in localStorage with key `tag-entries`
3. Fields not present in TagEntry are left blank in the Excel export
4. The export includes all saved tag entries from localStorage
5. Generated files are automatically downloaded with a timestamped filename


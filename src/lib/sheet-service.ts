import pool from './pg-db';
import { ExtractDataOutput } from '@/ai/schemas/form-extraction-schemas';

export interface Sheet {
  id: string;
  name: string;
  data: ExtractDataOutput[];
  createdAt: string;
}

// Get all sheets for a user
export async function getAllSheets(): Promise<Sheet[]> {
  try {
    // Return sheet metadata without data since sheet_data table is removed
    const result = await pool.query(
      `SELECT s.id, s.name, s.created_at
       FROM sheets s
       ORDER BY s.created_at DESC`
    );

    return result.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      data: [], // Return empty data array since sheet_data table is removed
      createdAt: new Date(row.created_at).toISOString()
    }));
  } catch (error) {
    console.error('Error fetching sheets:', error);
    throw error;
  }
}

// Get a specific sheet by ID
export async function getSheetById(sheetId: string): Promise<Sheet | null> {
  try {
    // Sheet data table has been removed, so only return sheet metadata
    console.log('Sheet data table has been removed. Returning sheet without data.');
    const result = await pool.query(
      `SELECT s.id, s.name, s.created_at
       FROM sheets s
       WHERE s.id = $1`,
      [sheetId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      name: row.name,
      data: [], // Return empty data array since sheet_data table is removed
      createdAt: new Date(row.created_at).toISOString()
    };
  } catch (error) {
    console.error('Error fetching sheet:', error);
    throw error;
  }
}

// Create a new sheet
export async function createSheet(sheet: Omit<Sheet, 'data'>): Promise<Sheet> {
  try {
    // Convert dates to MySQL compatible format
    const createdAt = new Date(sheet.createdAt).toISOString().slice(0, 19).replace('T', ' ');
    const updatedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
    
    await pool.query(
      `INSERT INTO sheets (id, name, created_at, updated_at) 
       VALUES ($1, $2, $3, $4)`,
      [sheet.id, sheet.name, createdAt, updatedAt]
    );

    return {
      ...sheet,
      data: []
    };
  } catch (error) {
    console.error('Error creating sheet:', error);
    throw error;
  }
}

// Update sheet name
export async function updateSheetName(sheetId: string, name: string): Promise<void> {
  try {
    // Convert date to MySQL compatible format
    const updatedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
    
    await pool.query(
      `UPDATE sheets SET name = $1, updated_at = $2 WHERE id = $3`,
      [name, updatedAt, sheetId]
    );
  } catch (error) {
    console.error('Error updating sheet name:', error);
    throw error;
  }
}

// Delete a sheet
export async function deleteSheet(sheetId: string): Promise<void> {
  try {
    await pool.query(
      `DELETE FROM sheets WHERE id = $1`,
      [sheetId]
    );
  } catch (error) {
    console.error('Error deleting sheet:', error);
    throw error;
  }
}

// Add data to a sheet
export async function addDataToSheet(sheetId: string, data: ExtractDataOutput): Promise<void> {
  try {
    // Sheet data table has been removed, so skip database operation
    console.log('Sheet data table has been removed. Skipping database operation.');
  } catch (error) {
    console.error('Error adding data to sheet:', error);
    throw error;
  }
}

// Update sheet data
export async function updateSheetData(sheetId: string, data: ExtractDataOutput[]): Promise<void> {
  try {
    // Sheet data table has been removed, so skip database operation
    console.log('Sheet data table has been removed. Skipping database operation.');
  } catch (error) {
    console.error('Error updating sheet data:', error);
    throw error;
  }
}

// Clear all data from a sheet
export async function clearSheetData(sheetId: string): Promise<void> {
  try {
    // Sheet data table has been removed, so skip database operation
    console.log('Sheet data table has been removed. Skipping database operation.');
  } catch (error) {
    console.error('Error clearing sheet data:', error);
    throw error;
  }
}
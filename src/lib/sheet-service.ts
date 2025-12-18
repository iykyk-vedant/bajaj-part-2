import pool from './db';
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
    const [rows]: any = await pool.execute(
      `SELECT s.id, s.name, s.created_at, 
              JSON_ARRAYAGG(sd.data) as sheet_data
       FROM sheets s
       LEFT JOIN sheet_data sd ON s.id = sd.sheet_id
       GROUP BY s.id, s.name, s.created_at
       ORDER BY s.created_at DESC`
    );

    return rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      data: row.sheet_data && row.sheet_data[0] !== null ? row.sheet_data : [],
      createdAt: row.created_at.toISOString()
    }));
  } catch (error) {
    console.error('Error fetching sheets:', error);
    throw error;
  }
}

// Get a specific sheet by ID
export async function getSheetById(sheetId: string): Promise<Sheet | null> {
  try {
    const [rows]: any = await pool.execute(
      `SELECT s.id, s.name, s.created_at, 
              JSON_ARRAYAGG(sd.data) as sheet_data
       FROM sheets s
       LEFT JOIN sheet_data sd ON s.id = sd.sheet_id
       WHERE s.id = ?
       GROUP BY s.id, s.name, s.created_at`,
      [sheetId]
    );

    if (rows.length === 0) {
      return null;
    }

    const row = rows[0];
    return {
      id: row.id,
      name: row.name,
      data: row.sheet_data && row.sheet_data[0] !== null ? row.sheet_data : [],
      createdAt: row.created_at.toISOString()
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
    
    await pool.execute(
      `INSERT INTO sheets (id, name, created_at, updated_at) 
       VALUES (?, ?, ?, ?)`,
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
    
    await pool.execute(
      `UPDATE sheets SET name = ?, updated_at = ? WHERE id = ?`,
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
    await pool.execute(
      `DELETE FROM sheets WHERE id = ?`,
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
    // Convert date to MySQL compatible format
    const createdAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
    
    await pool.execute(
      `INSERT INTO sheet_data (sheet_id, data, created_at) 
       VALUES (?, ?, ?)`,
      [sheetId, JSON.stringify(data), createdAt]
    );
  } catch (error) {
    console.error('Error adding data to sheet:', error);
    throw error;
  }
}

// Update sheet data
export async function updateSheetData(sheetId: string, data: ExtractDataOutput[]): Promise<void> {
  try {
    // Convert date to MySQL compatible format
    const createdAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
    
    // First, delete all existing data for this sheet
    await pool.execute(
      `DELETE FROM sheet_data WHERE sheet_id = ?`,
      [sheetId]
    );

    // Then insert all new data
    for (const item of data) {
      await pool.execute(
        `INSERT INTO sheet_data (sheet_id, data, created_at) 
         VALUES (?, ?, ?)`,
        [sheetId, JSON.stringify(item), createdAt]
      );
    }
  } catch (error) {
    console.error('Error updating sheet data:', error);
    throw error;
  }
}

// Clear all data from a sheet
export async function clearSheetData(sheetId: string): Promise<void> {
  try {
    await pool.execute(
      `DELETE FROM sheet_data WHERE sheet_id = ?`,
      [sheetId]
    );
  } catch (error) {
    console.error('Error clearing sheet data:', error);
    throw error;
  }
}
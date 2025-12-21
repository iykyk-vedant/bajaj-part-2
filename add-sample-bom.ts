import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function addSampleBom() {
  try {
    console.log('Adding sample BOM data...');
    
    // Create a connection pool with database specified
    const pool = mysql.createPool({
      host: process.env.MYSQL_HOST || 'localhost',
      port: parseInt(process.env.MYSQL_PORT || '3306'),
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'nexscan',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
    
    // Add sample BOM entries
    const sampleBomData = [
      ['RES-001', 'R1', '1K Ohm Resistor'],
      ['CAP-001', 'C1', '10uF Capacitor'],
      ['IC-001', 'U1', 'Microcontroller'],
      ['LED-001', 'D1', 'Red LED'],
      ['CONN-001', 'J1', 'Power Connector']
    ];
    
    for (const [partCode, location, description] of sampleBomData) {
      await pool.execute(
        'INSERT IGNORE INTO bom (part_code, location, description) VALUES (?, ?, ?)',
        [partCode, location, description]
      );
      console.log(`Added/Verified: ${partCode}@${location} - ${description}`);
    }
    
    console.log('Sample BOM data added successfully');
    
    // Verify the data was added
    const [rows]: any = await pool.execute('SELECT * FROM bom WHERE part_code = ? AND location = ?', ['RES-001', 'R1']);
    console.log('Verification for RES-001@R1:', rows);
    
    pool.end();
  } catch (error) {
    console.error('Failed to add sample BOM data:', error);
  }
}

addSampleBom();
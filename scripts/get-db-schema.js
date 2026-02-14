const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.PG_HOST?.replace(/'/g, ''),
    port: parseInt(process.env.PG_PORT || '5432'),
    user: process.env.PG_USER?.replace(/'/g, ''),
    password: process.env.PG_PASSWORD?.replace(/'/g, ''),
    database: process.env.PG_DATABASE?.replace(/'/g, ''),
    ssl: process.env.DB_SSL_DISABLED === 'true' ? false : {
        rejectUnauthorized: false
    },
    connectionTimeoutMillis: 10000,
});

const fs = require('fs');

async function getDbSchema() {
    console.log('Fetching database schema...');
    let output = '';

    try {
        const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

        for (const { table_name } of tablesResult.rows) {
            const columnsResult = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = $1 
        ORDER BY ordinal_position
      `, [table_name]);

            output += `\nTable: ${table_name}\n`;
            output += '------------------------------------------------\n';
            output += String('Column').padEnd(30) + String('Type').padEnd(20) + 'Nullable\n';
            output += '------------------------------------------------\n';

            columnsResult.rows.forEach(col => {
                output += (
                    col.column_name.padEnd(30) +
                    col.data_type.padEnd(20) +
                    col.is_nullable + '\n'
                );
            });
        }

        fs.writeFileSync('db_schema.txt', output);
        console.log('Schema written to db_schema.txt');

    } catch (error) {
        console.error('Error fetching schema:', error);
    } finally {
        await pool.end();
    }
}

getDbSchema();

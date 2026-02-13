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
});
pool.query("SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'consolidated_data'")
    .then(res => {
        console.log(JSON.stringify(res.rows, null, 2));
        pool.end();
    })
    .catch(err => {
        console.error(err);
        pool.end();
    });
import pg from 'pg';
const { Client } = pg;
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error('Error: DATABASE_URL is not defined in .env.local');
    process.exit(1);
}

const client = new Client({
    connectionString: connectionString,
    ssl: {
        rejectUnauthorized: false
    }
});

async function clearData() {
    try {
        await client.connect();
        console.log('Connected to database');

        const tables = [
            'bookings',
            'bill_items',
            'bills',
            'rooms',
            'room_types',
            'tables',
            'menu_items'
        ];

        for (const table of tables) {
            try {
                console.log(`Clearing table ${table}...`);
                await client.query(`TRUNCATE TABLE ${table} CASCADE;`);
                console.log(`Cleared ${table}`);
            } catch (e) {
                console.error(`Error clearing ${table}:`, e.message);
            }
        }

        console.log('All dummy data cleared successfully.');

    } catch (err) {
        console.error('Operation failed:', err);
        process.exit(1);
    } finally {
        await client.end();
    }
}

clearData();

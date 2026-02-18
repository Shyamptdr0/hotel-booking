import pg from 'pg';
const { Client } = pg;
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        await client.connect();
        const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        console.log('Tables:', res.rows.map(r => r.table_name));

        const resPolicies = await client.query("SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public'");
        console.log('Policies:', resPolicies.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

run();

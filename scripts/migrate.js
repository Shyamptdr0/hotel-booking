import pg from 'pg';
const { Client } = pg;
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

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

async function migrate() {
    try {
        await client.connect();
        console.log('Connected to database');

        const schemaPath = path.join(__dirname, '../supabase/schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        console.log('Applying schema.sql...');
        try {
            await client.query(schemaSql);
            console.log('Schema applied successfully');
        } catch (e) {
            console.warn('Schema application failed (tables might already exist). Continuing...', e.message);
        }

        // Apply Supabase migrations
        const supabaseMigrationsDir = path.join(__dirname, '../supabase/migrations');
        if (fs.existsSync(supabaseMigrationsDir)) {
            const migrationFiles = fs.readdirSync(supabaseMigrationsDir).sort();
            for (const file of migrationFiles) {
                if (file.endsWith('.sql')) {
                    const migrationPath = path.join(supabaseMigrationsDir, file);
                    const migrationSql = fs.readFileSync(migrationPath, 'utf8');
                    console.log(`Applying supabase migration ${file}...`);
                    try {
                        await client.query(migrationSql);
                        console.log(`${file} applied successfully`);
                    } catch (e) {
                        console.error(`Error applying ${file}:`, e.message);
                        throw e;
                    }
                }
            }
        }

        // Apply custom database migrations
        const migrationsDir = path.join(__dirname, '../database/migrations');
        if (fs.existsSync(migrationsDir)) {
            const migrationFiles = fs.readdirSync(migrationsDir).sort();

            for (const file of migrationFiles) {
                if (file.endsWith('.sql')) {
                    const migrationPath = path.join(migrationsDir, file);
                    const migrationSql = fs.readFileSync(migrationPath, 'utf8');
                    console.log(`Applying custom migration ${file}...`);
                    try {
                        await client.query(migrationSql);
                        console.log(`${file} applied successfully`);
                    } catch (e) {
                        console.error(`Error applying ${file}:`, e);
                        throw e;
                    }
                }
            }
        } else {
            console.log('No additional custom migrations folder found.');
        }

    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    } finally {
        await client.end();
    }
}

migrate();

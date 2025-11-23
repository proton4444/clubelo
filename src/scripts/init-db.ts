import fs from 'fs';
import path from 'path';
import { db } from '../lib/db';

async function main() {
    console.log('Initializing database...');

    try {
        // Read schema files
        const schemaPath = path.join(__dirname, '../../schema.sql');
        const fixturesSchemaPath = path.join(__dirname, '../../schema-fixtures.sql');
        const indexesSchemaPath = path.join(__dirname, '../../schema-indexes.sql');

        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        const fixturesSql = fs.readFileSync(fixturesSchemaPath, 'utf8');
        const indexesSql = fs.readFileSync(indexesSchemaPath, 'utf8');

        console.log('Running schema.sql...');
        await db.query(schemaSql);

        console.log('Running schema-fixtures.sql...');
        await db.query(fixturesSql);

        console.log('Running schema-indexes.sql...');
        await db.query(indexesSql);

        console.log('✅ Database initialized successfully!');
    } catch (error) {
        console.error('❌ Error initializing database:', error);
        process.exit(1);
    } finally {
        await db.end();
    }
}

main();

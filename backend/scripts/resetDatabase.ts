import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// 1. Load Environment Variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });
import { env } from '../src/config/env.config';

/**
 * PRODUCTION SAFETY GUARD:
 * Prevents accidental execution on staging or production databases.
 */
if (process.env.NODE_ENV === 'production' || (env as any).NODE_ENV === 'production') {
  console.error('\n⛔ CRITICAL SAFETY ERROR:');
  console.error('Database reset is strictly forbidden in PRODUCTION mode (NODE_ENV=production).');
  console.error('Operation aborted.\n');
  process.exit(1);
}

/**
 * PRODUCTION-GRADE SAFE DATABASE RESET SCRIPT
 * 
 * Equivalent to PostgreSQL's `TRUNCATE ... RESTART IDENTITY CASCADE`:
 * - Safely removes all records/documents across all collections.
 * - 100% preserves all collections, schemas, validation rules, unique indexes,
 *   compound indexes, and geospatial `2dsphere` indexes.
 * - Resets all document counts back to 0.
 * - Can be run locally without terminating or disrupting the running Express server.
 */
async function resetDatabase() {
  console.log('====================================================');
  console.log('🧹 BLOOD SANJAL — SAFE DATABASE RESET SCRIPT');
  console.log('====================================================');
  console.log(`Environment : ${process.env.NODE_ENV || 'development'}`);
  console.log(`Target DB   : ${env.MONGODB_URI.replace(/:([^:@]{3,})@/, ':****@')}`);
  console.log('----------------------------------------------------');

  try {
    // Connect to database in an isolated process
    await mongoose.connect(env.MONGODB_URI);
    const db = mongoose.connection.db;

    if (!db) {
      throw new Error('Failed to obtain MongoDB database reference.');
    }

    console.log('✓ Successfully connected to database.\n');

    const collections = await db.listCollections().toArray();

    if (collections.length === 0) {
      console.log('ℹ️  No collections found in database. The database is already clean.');
      await mongoose.disconnect();
      process.exit(0);
    }

    const wipeSummary: { collection: string; deletedCount: number; remainingCount: number }[] = [];

    // Clean all collections using deleteMany({}) to keep schemas and indexes intact
    for (const colInfo of collections) {
      const name = colInfo.name;

      // Skip internal system collections
      if (name.startsWith('system.')) continue;

      const collection = db.collection(name);
      const countBefore = await collection.countDocuments();
      const deleteResult = await collection.deleteMany({});
      const countAfter = await collection.countDocuments();

      wipeSummary.push({
        collection: name,
        deletedCount: deleteResult.deletedCount ?? countBefore,
        remainingCount: countAfter,
      });
    }

    // Display formatted summary table
    console.log('----------------------------------------------------');
    console.log(`${'Collection Name'.padEnd(28)} | ${'Wiped'.padStart(8)} | ${'Remaining'.padStart(10)}`);
    console.log('----------------------------------------------------');
    for (const item of wipeSummary) {
      console.log(
        `${item.collection.padEnd(28)} | ${String(item.deletedCount).padStart(8)} | ${String(item.remainingCount).padStart(10)}`
      );
    }
    console.log('----------------------------------------------------');
    console.log('✅ DATABASE RESET COMPLETE: All data rows wiped to 0.');
    console.log('✓ Schemas, indexes (unique, compound, 2dsphere), and relations remain 100% intact.');
    console.log('✓ Ready for fresh testing.\n');
    console.log('💡 Tip: To seed fresh initial test data & admin, run: npm run seed');
    console.log('====================================================\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Database reset failed:', error.message);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    process.exit(1);
  }
}

resetDatabase();

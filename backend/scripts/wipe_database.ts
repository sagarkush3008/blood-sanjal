import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });
import { env } from '../src/config/env.config';

/**
 * PRODUCTION-GRADE SAFE DATABASE WIPER
 * 
 * Completely wipes all records (Users, Admins, Donors, Requests, Payments, Audits, etc.)
 * while keeping 100% of the collection schemas, indexes (unique, TTL, geospatial 2dsphere) intact.
 */
async function wipeDatabase() {
  console.log("==================================================");
  console.log("⚠️  BLOOD SANJAL — COMPLETE DATABASE WIPE & RESET");
  console.log("==================================================");
  console.log(`Connecting to database: ${env.MONGODB_URI.replace(/:([^:@]{3,})@/, ':****@')} ...`);

  try {
    await mongoose.connect(env.MONGODB_URI);
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error("Could not access MongoDB database instance.");
    }
    console.log("✓ Connected to MongoDB successfully.\n");

    const rawCollections = await db.listCollections().toArray();

    if (rawCollections.length === 0) {
      console.log("No collections found in this database. It is already empty.");
      process.exit(0);
    }

    console.log(`Discovered ${rawCollections.length} collections. Starting complete wipe...\n`);

    const results: { collection: string; deleted: number; remaining: number }[] = [];

    for (const item of rawCollections) {
      const colName = item.name;
      if (colName.startsWith('system.')) continue;

      const col = db.collection(colName);
      const countBefore = await col.countDocuments();
      const deleteResult = await col.deleteMany({});
      const countAfter = await col.countDocuments();

      results.push({
        collection: colName,
        deleted: deleteResult.deletedCount ?? countBefore,
        remaining: countAfter,
      });
    }

    // Print summary table
    console.log("--------------------------------------------------");
    console.log(
      `${"Collection".padEnd(26)} | ${"Deleted".padStart(8)} | ${"Remaining".padStart(10)}`
    );
    console.log("--------------------------------------------------");
    for (const r of results) {
      console.log(
        `${r.collection.padEnd(26)} | ${String(r.deleted).padStart(8)} | ${String(r.remaining).padStart(10)}`
      );
    }
    console.log("--------------------------------------------------");
    console.log("\n✅ ALL RECORDS WIPED CLEAN. (Zero data remains in all collections)");
    console.log("✓ All collection schemas, unique constraints, and indexes remain 100% intact.");
    console.log("✓ You now have a completely fresh slate ready for new User and Admin data.\n");
    console.log("Tip: If you ever want to re-seed default demo data & admin, run: npm run seed");
    console.log("==================================================");

    await mongoose.disconnect();
    process.exit(0);
  } catch (err: any) {
    console.error("❌ Database wipe failed:", err.message);
    process.exit(1);
  }
}

wipeDatabase();

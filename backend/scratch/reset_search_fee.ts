import mongoose from 'mongoose';

async function main() {
  await mongoose.connect('mongodb://localhost:27017/blood-sanjal');
  console.log('Connected to MongoDB');

  const res = await mongoose.connection.collection('paymenttransactions').updateMany(
    { purpose: 'SEARCH_PLATFORM_FEE' },
    { $set: { status: 'EXPIRED', updatedAt: new Date(Date.now() - 48 * 3600 * 1000) } }
  );

  console.log(`Updated ${res.modifiedCount} search fee transaction(s) to EXPIRED.`);
  await mongoose.disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

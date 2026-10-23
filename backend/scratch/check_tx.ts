import mongoose from 'mongoose';

async function main() {
  await mongoose.connect('mongodb://localhost:27017/blood-sanjal');
  console.log('Connected to MongoDB');
  const collections = await mongoose.connection.db?.listCollections().toArray();
  console.log('Collections:', collections?.map(c => c.name));

  const collectionName = collections?.find(c => c.name.toLowerCase().includes('payment'))?.name || 'paymenttransactions';
  console.log('Using collection:', collectionName);

  const count = await mongoose.connection.collection(collectionName).countDocuments({ purpose: 'SEARCH_PLATFORM_FEE' });
  console.log('Count:', count);

  const docs = await mongoose.connection.collection(collectionName).find({ purpose: 'SEARCH_PLATFORM_FEE' }).toArray();
  console.log('Docs found:', docs.length);
  for (const d of docs) {
    console.log(`- ID: ${d._id}, User: ${d.userId}, Status: ${d.status}, Date: ${d.updatedAt || d.createdAt}`);
  }

  await mongoose.disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

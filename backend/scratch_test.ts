import mongoose from 'mongoose';
import { DonorProfile } from './src/modules/donors/donorProfile.model';

async function test() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/blood-sanjal');

    const doc = new DonorProfile({
      userId: new mongoose.Types.ObjectId(),
      bloodGroup: 'A+',
      donorStatus: 'INACTIVE',
      inactiveUnit: null,
    });
    
    await doc.save();
    console.log("Save successful!");
    
    doc.inactiveUnit = null;
    await doc.save();
    console.log("Update to null successful!");

  } catch (e) {
    console.error("Error:", e);
  } finally {
    await mongoose.disconnect();
  }
}
test();

const axios = require('axios');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
dotenv.config({ path: 'backend/.env' });

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/blood_sanjal');
    
    // Create a user
    const { User } = require('./backend/src/modules/users/user.model');
    const { DonorProfile } = require('./backend/src/modules/donors/donorProfile.model');
    
    const user = new User({
      name: 'Test User',
      email: 'test@example.com',
      phone: '9876543210',
      passwordHash: 'hashed',
      role: 'DONOR',
      bloodGroup: 'A+',
      status: 'ACTIVE',
      provinceId: '1',
      districtId: '1',
      cityId: '1'
    });
    await user.save();
    
    const profile = new DonorProfile({
      userId: user._id,
      bloodGroup: 'A+',
      donorStatus: 'ACTIVE',
      availabilityMode: 'AVAILABLE'
    });
    await profile.save();
    
    const token = jwt.sign({ userId: user._id.toString(), role: 'DONOR' }, process.env.JWT_ACCESS_SECRET || 'secret123');
    
    console.log('Testing /donors/me/availability...');
    const res = await axios.patch('http://localhost:5000/api/v1/donors/me/availability', { status: 'INACTIVE', durationHours: 2 }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Availability response:', res.data);
    
    // cleanup
    await User.deleteOne({ _id: user._id });
    await DonorProfile.deleteOne({ _id: profile._id });
    mongoose.disconnect();
    
  } catch (err: any) {
    console.error('ERROR RESPONSE:', err.response?.data || err.message);
  }
}
run();

const axios = require('axios');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config({ path: 'backend/.env' });

async function run() {
  try {
    const validObjectId = "507f1f77bcf86cd799439011";
    const token = jwt.sign({ userId: validObjectId, role: 'DONOR' }, process.env.JWT_ACCESS_SECRET || 'secret123');
    
    console.log('Testing /donors/me/availability...');
    const res = await axios.patch('http://localhost:5000/api/v1/donors/me/availability', { status: 'INACTIVE', durationHours: 2 }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Availability response:', res.data);
  } catch (err) {
    console.error('ERROR RESPONSE:', err.response?.data || err.message);
  }
}
run();

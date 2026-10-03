import mongoose, { Schema } from 'mongoose';

const testSchema = new Schema({
  unit: { type: String, enum: ['HOURS', 'DAYS'], default: null },
  mode: { type: String, enum: ['AVAILABLE', 'INACTIVE'], default: 'AVAILABLE' }
});

const TestModel = mongoose.model('TestModel', testSchema);

async function test() {
  const doc = new TestModel({ unit: null, mode: 'AVAILABLE' });
  try {
    await doc.validate();
    console.log('Validation passed!');
  } catch (err: any) {
    console.error('Validation failed:', err.message);
  }
}

test();

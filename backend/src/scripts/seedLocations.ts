import mongoose from 'mongoose';
import { env } from '../config/env.config';
import { Location } from '../modules/locations/location.model';

const pilotData = [
  {
    code: 'PROV_MADHESH',
    name: 'Madhesh Province',
    type: 'PROVINCE',
    children: [
      {
        code: 'DIST_PARSA',
        name: 'Parsa',
        type: 'DISTRICT',
        children: [
          { code: 'MUN_BIRGUNJ', name: 'Birgunj', type: 'MUNICIPALITY' }
        ]
      },
      {
        code: 'DIST_BARA',
        name: 'Bara',
        type: 'DISTRICT',
        children: [
          { code: 'MUN_KALAIYA', name: 'Kalaiya', type: 'MUNICIPALITY' },
          { code: 'MUN_SIMARA', name: 'Simara', type: 'MUNICIPALITY' }
        ]
      },
      {
        code: 'DIST_DHANUSHA',
        name: 'Dhanusha',
        type: 'DISTRICT',
        children: [
          { code: 'MUN_JANAKPUR', name: 'Janakpur', type: 'MUNICIPALITY' }
        ]
      }
    ]
  },
  {
    code: 'PROV_BAGMATI',
    name: 'Bagmati Province',
    type: 'PROVINCE',
    children: [
      {
        code: 'DIST_KATHMANDU',
        name: 'Kathmandu',
        type: 'DISTRICT',
        children: [
          { code: 'MUN_KATHMANDU', name: 'Kathmandu', type: 'MUNICIPALITY' }
        ]
      },
      {
        code: 'DIST_CHITWAN',
        name: 'Chitwan',
        type: 'DISTRICT',
        children: [
          { code: 'MUN_BHARATPUR', name: 'Bharatpur', type: 'MUNICIPALITY' }
        ]
      }
    ]
  },
  {
    code: 'PROV_GANDAKI',
    name: 'Gandaki Province',
    type: 'PROVINCE',
    children: [
      {
        code: 'DIST_KASKI',
        name: 'Kaski',
        type: 'DISTRICT',
        children: [
          { code: 'MUN_POKHARA', name: 'Pokhara', type: 'MUNICIPALITY' }
        ]
      }
    ]
  }
];

async function seedData(nodes: any[], parentId?: string) {
  for (const node of nodes) {
    let loc = await Location.findOne({ code: node.code });
    if (!loc) {
      loc = await Location.create({
        code: node.code,
        name: node.name,
        type: node.type,
        parentId
      });
      console.log(`Created ${node.type} ${node.name}`);
    } else {
      console.log(`${node.type} ${node.name} already exists`);
    }

    if (node.children && node.children.length > 0) {
      await seedData(node.children, loc._id.toString());
    }
  }
}

async function run() {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log('Connected to DB');
    await seedData(pilotData);
    console.log('Location seeding complete.');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

run();

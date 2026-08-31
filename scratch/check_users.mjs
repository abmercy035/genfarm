import dbConnect from '../lib/db.js';
import User from '../models/User.js';

async function check() {
  await dbConnect();
  const users = await User.find({});
  console.log('Users in DB:', users.map(u => ({ phone: u.phone, role: u.role, name: u.name })));
  process.exit(0);
}
check();

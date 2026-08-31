import mongoose from 'mongoose';

// const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/genfarm';
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance) => {
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
    
    // Auto-seed initial settings and admin user if fresh database
    const User = mongoose.models.User || (await import('@/models/User')).default;
    const userCount = await User.countDocuments({});
    if (userCount === 0) {
      const bcrypt = (await import('bcryptjs')).default;
      const hashedPassword = await bcrypt.hash('Genfarm2026.com', 10);
      await User.create({
        name: 'General Manager',
        phone: '08022493235',
        email: 'admin@genfarm.com',
        password: hashedPassword,
        role: 'SUPER_ADMIN',
        isActive: true
      });

      const Settings = mongoose.models.Settings || (await import('@/models/Settings')).default;
      const settingsCount = await Settings.countDocuments({});
      if (settingsCount === 0) {
        await Settings.create({
          price_single_egg: 120,
          price_crate_good: 3500,
          price_single_cracked: 60,
          price_crate_cracked: 1800,
          feeds: [
            { name: 'Layer Mash 25kg', bagWeightKg: 25, pricePerBag: 12500, inStockBags: 10 },
            { name: 'Grower Mash 25kg', bagWeightKg: 25, pricePerBag: 11800, inStockBags: 10 }
          ],
          medications: [
            { name: 'Multivitamins & Electrolytes', unitPrice: 2500, inStockUnits: 30 }
          ],
          birdValuations: [
            { type: 'Layers', unitValue: 3500 },
            { type: 'Broilers', unitValue: 2800 }
          ],
          defaultPenStructureValue: 450000
        });
      }
    }
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default dbConnect;

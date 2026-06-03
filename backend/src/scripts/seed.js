/* eslint-disable no-console */
import mongoose from 'mongoose';
import env from '../config/env.js';
import User from '../models/User.js';

async function upsertUser({ name, email, password, role }) {
  let user = await User.findOne({ email });
  if (user) {
    user.name = name;
    user.role = role;
    user.status = 'active';
    await user.setPassword(password);
    await user.save();
    console.log(`  ✓ updated ${role}: ${email}`);
  } else {
    user = new User({ name, email, role });
    await user.setPassword(password);
    await user.save();
    console.log(`  ✓ created ${role}: ${email}`);
  }
}

async function run() {
  console.log('[seed] Connecting to MongoDB...');
  await mongoose.connect(env.mongoUri);

  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@digsign.local';
  const adminPw = process.env.SEED_ADMIN_PASSWORD || 'Admin@12345';
  const userEmail = process.env.SEED_USER_EMAIL || 'demo@digsign.local';
  const userPw = process.env.SEED_USER_PASSWORD || 'Demo@12345';

  console.log('[seed] Upserting demo accounts...');
  await upsertUser({ name: 'Platform Admin', email: adminEmail, password: adminPw, role: 'admin' });
  await upsertUser({ name: 'Demo User', email: userEmail, password: userPw, role: 'user' });

  console.log('\nDemo credentials:');
  console.log(`  Admin: ${adminEmail} / ${adminPw}`);
  console.log(`  User : ${userEmail} / ${userPw}`);

  await mongoose.disconnect();
  console.log('[seed] Done.');
}

run().catch((err) => {
  console.error('[seed] error:', err);
  process.exit(1);
});

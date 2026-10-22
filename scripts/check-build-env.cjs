// Expo embeds EXPO_PUBLIC_* values at build time. Never print their values.
const { Buffer } = require('node:buffer');
const required = [
  'EXPO_PUBLIC_SUPABASE_URL',
  'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
];
for (const name of required) {
  if (!process.env[name]) {
    throw new Error(`${name} is missing. Configure the repository Actions variable or secret before building.`);
  }
}
if (new URL(process.env.EXPO_PUBLIC_SUPABASE_URL).protocol !== 'https:') {
  throw new Error('EXPO_PUBLIC_SUPABASE_URL must use HTTPS.');
}
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (key.startsWith('sb_secret_')) {
  throw new Error('A server-only Supabase key cannot be embedded in a public app.');
}
if (key.startsWith('eyJ')) {
  const payload = JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString());
  if (payload.role !== 'anon') {
    throw new Error('Only a publishable key or legacy anon key may be embedded in the app.');
  }
}
console.log('Required public app configuration is present.');

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ujezrrdlwwrxqhofqvkw.supabase.co';
const supabaseKey = 'sb_publishable_95VEQkgNf3tXClxai-cT2w_GLgxqbET';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('Testing connection to Supabase project...');
  try {
    const { data, error } = await supabase.from('products').select('*').limit(1);
    if (error) {
      console.log('Supabase responded with error:', error.message, error.code);
    } else {
      console.log('Successfully connected! Products count retrieved:', data?.length);
    }
  } catch (err) {
    console.error('Connection exception:', err);
  }
}

testConnection();

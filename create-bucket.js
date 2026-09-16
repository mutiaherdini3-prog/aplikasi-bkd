const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envContent = fs.readFileSync('./.env.local', 'utf-8');
let supabaseUrl = '';
let supabaseKey = '';

envContent.split('\n').forEach(line => {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) supabaseKey = line.split('=')[1].trim();
});

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase.storage.createBucket('dokumen', { public: true });
  if (error) {
    if (error.message.includes('already exists')) {
        console.log('Bucket "dokumen" already exists!');
    } else {
        console.error('Error creating bucket:', error);
    }
  } else {
    console.log('Bucket "dokumen" created successfully:', data);
  }
}
main();

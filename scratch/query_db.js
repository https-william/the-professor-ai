const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Read .env.local
const envLocalPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envLocalPath, 'utf8');

const getEnvVar = (name) => {
    const match = envContent.match(new RegExp(`^${name}=(.*)$`, 'm'));
    return match ? match[1].trim().replace(/^['"]|['"]$/g, '') : '';
};

const supabaseUrl = getEnvVar('NEXT_PUBLIC_SUPABASE_URL');
const supabaseKey = getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY');

console.log('Supabase URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    try {
        // Let's get one profile row
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .limit(1);

        if (error) {
            console.error('Error fetching profile:', error);
            return;
        }

        console.log('Available columns in profiles table:');
        if (data && data.length > 0) {
            console.log(Object.keys(data[0]));
        } else {
            console.log('No profile rows found, querying table structure directly...');
        }
        
        // Let's test update with time_commitment
        console.log('\nTesting update with time_commitment...');
        const { data: updateData, error: updateError } = await supabase
            .from('profiles')
            .update({ time_commitment: '15m' })
            .eq('alias', 'NonExistentScholarRowForTestingPurposeOnly'); // safe test
            
        if (updateError) {
            console.error('Update Error:', updateError);
        } else {
            console.log('Update succeeded (meaning time_commitment exists!)');
        }

    } catch (err) {
        console.error('Runtime error:', err);
    }
}

run();

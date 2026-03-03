// Supabase configuration 

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
//const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // ← this line

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;

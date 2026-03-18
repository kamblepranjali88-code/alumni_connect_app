// Supabase configuration
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Alumni Connect DB (main project DB)
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// College DB (for student/alumni verification only)
const collegeDB = createClient(
    process.env.COLLEGE_SUPABASE_URL,
    process.env.COLLEGE_SERVICE_ROLE_KEY
);

module.exports = { supabase, collegeDB };
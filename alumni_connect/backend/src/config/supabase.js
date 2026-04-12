const path = require('path');
const { createClient } = require('@supabase/supabase-js');

require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const collegeDB = createClient(
  process.env.COLLEGE_SUPABASE_URL,
  process.env.COLLEGE_SERVICE_ROLE_KEY
);

module.exports = { supabase, collegeDB };
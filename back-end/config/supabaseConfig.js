const { createClient } = require("@supabase/supabase-js");
const dotenv = require("dotenv");
const ws = require("ws");
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey, {
  realtime: { transport: ws },
});

module.exports = supabase;

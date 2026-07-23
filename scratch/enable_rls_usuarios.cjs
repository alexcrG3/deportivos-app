const pg = require("pg");

async function run() {
  const client = new pg.Client({ 
    connectionString: "postgresql://postgres.doadnhxmkmklhlszgcwe:AthletixOS2026!@aws-1-us-west-2.pooler.supabase.com:6543/postgres",
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  
  try {
    console.log("Enabling RLS on public.usuarios...");
    await client.query(`
      ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
    `);

    console.log("Creating policy Allow all for usuarios...");
    await client.query(`
      DROP POLICY IF EXISTS "Allow all for usuarios" ON public.usuarios;
      CREATE POLICY "Allow all for usuarios" 
      ON public.usuarios 
      FOR ALL 
      TO public 
      USING (true) 
      WITH CHECK (true);
    `);

    console.log("RLS enabled and policy created successfully.");
  } catch (e) {
    console.error("Error setting up RLS/policies:", e);
  } finally {
    await client.end();
  }
}

run().catch(console.error);

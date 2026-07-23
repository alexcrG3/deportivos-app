import pg from 'pg';

const connectionString = 'postgresql://postgres.doadnhxmkmklhlszgcwe:AthletixOS2026!@aws-1-us-west-2.pooler.supabase.com:6543/postgres?sslmode=require';

const sql = `
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        -- Create a policy allowing all CRUD operations for public (both anon and authenticated)
        EXECUTE 'DROP POLICY IF EXISTS "Allow all" ON public.' || quote_ident(r.tablename);
        EXECUTE 'CREATE POLICY "Allow all" ON public.' || quote_ident(r.tablename) || ' FOR ALL TO public USING (true) WITH CHECK (true);';
    END LOOP;
END $$;
`;

async function main() {
  console.log('Connecting to database...');
  const client = new pg.Client({ 
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  console.log('Executing RLS Option 2 SQL script...');
  await client.query(sql);
  console.log('SQL script executed successfully!');
  await client.end();
}

main().catch(err => {
  console.error('Error executing query:', err);
  process.exit(1);
});

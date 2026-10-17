const { Client } = require('pg');
const fs = require('fs');

async function run() {
  const password = 'Hardik@231264';
  const projectRef = 'ujezrrdlwwrxqhofqvkw';
  
  // Try direct connection first
  const connectionStrings = [
    `postgresql://postgres:${encodeURIComponent(password)}@db.${projectRef}.supabase.co:5432/postgres`,
    `postgresql://postgres.${projectRef}:${encodeURIComponent(password)}@aws-0-ap-south-1.pooler.supabase.com:6543/postgres`,
    `postgresql://postgres.${projectRef}:${encodeURIComponent(password)}@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`,
    `postgresql://postgres.${projectRef}:${encodeURIComponent(password)}@aws-0-eu-central-1.pooler.supabase.com:6543/postgres`,
    `postgresql://postgres.${projectRef}:${encodeURIComponent(password)}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`
  ];

  let client = null;
  let connectedStr = null;

  for (const connStr of connectionStrings) {
    const masked = connStr.replace(encodeURIComponent(password), '******');
    console.log(`Attempting connection to: ${masked}...`);
    const c = new Client({
      connectionString: connStr,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 8000
    });
    try {
      await c.connect();
      console.log(`Connected successfully!`);
      client = c;
      connectedStr = connStr;
      break;
    } catch (err) {
      console.log(`Failed: ${err.message}`);
      await c.end().catch(() => {});
    }
  }

  if (!client) {
    console.error('Could not connect through any connection string.');
    process.exit(1);
  }

  console.log('Reading supabase/all_migrations.sql...');
  const sql = fs.readFileSync('supabase/all_migrations.sql', 'utf8');

  console.log(`Executing migration (${sql.length} bytes)...`);
  try {
    await client.query(sql);
    console.log('Migration completed successfully!');

    // Test querying products
    const res = await client.query('select count(*) from public.products;');
    console.log(`Products in database: ${res.rows[0].count}`);

    const resInv = await client.query('select count(*) from public.inventory_items;');
    console.log(`Inventory items in database: ${resInv.rows[0].count}`);
  } catch (err) {
    console.error('Migration failed with error:', err);
  } finally {
    await client.end();
  }
}

run();

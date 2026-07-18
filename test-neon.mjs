import { Pool } from '@neondatabase/serverless';

const connectionString = 'postgresql://neondb_owner:npg_e24pSkYPLarK@ep-young-thunder-attw3irx-pooler.c-9.us-east-1.aws.neon.tech/neondb';

try {
  const pool = new Pool({ connectionString });
  console.log("Pool created successfully with object config");
  pool.connect().then(() => console.log("Connected")).catch(e => console.error("Connect error:", e));
} catch (e) {
  console.error("Error creating pool with object config:", e);
}

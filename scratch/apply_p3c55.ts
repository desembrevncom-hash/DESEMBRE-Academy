import { Client } from "pg";
import fs from "fs";

async function apply() {
  const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
  console.log("Connecting via pg...");
  const client = new Client({ connectionString });
  try {
    await client.connect();
    const sql = fs.readFileSync("scratch/p3c55_landing_lead_source_tracking.sql", "utf8");
    await client.query(sql);
    console.log("Migration executed successfully via direct SQL!");
  } catch (err: any) {
    console.error("Direct SQL error:", err.message);
  } finally {
    await client.end();
  }
}

apply();

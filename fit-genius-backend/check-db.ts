import { pool } from "./src/db";

async function checkDatabase() {
  try {
    // Check connection
    const versionResult = await pool.query("SELECT version()");
    console.log(
      "✅ PostgreSQL Version:",
      versionResult.rows[0].version.split("\n")[0]
    );

    // Check if users table exists
    const tablesResult = await pool.query(`
      SELECT table_name, column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name IN ('users', 'refresh_tokens')
      ORDER BY table_name, ordinal_position
    `);

    console.log("\n📊 Database Schema:");

    if (tablesResult.rows.length === 0) {
      console.log("❌ No tables found! You need to run migrations.");
      console.log("\nRun: npx drizzle-kit push");
    } else {
      let currentTable = "";
      tablesResult.rows.forEach((row) => {
        if (row.table_name !== currentTable) {
          currentTable = row.table_name;
          console.log(`\n📋 Table: ${row.table_name}`);
        }
        console.log(
          `  - ${row.column_name}: ${row.data_type}${
            row.is_nullable === "NO" ? " NOT NULL" : ""
          }`
        );
      });
    }

    // Test insert capability
    console.log("\n🧪 Testing table access...");
    const testQuery = await pool.query("SELECT COUNT(*) FROM users");
    console.log(
      `✅ Users table accessible. Current count: ${testQuery.rows[0].count}`
    );

    await pool.end();
  } catch (error) {
    console.error("❌ Database check failed:", error);
    process.exit(1);
  }
}

checkDatabase();

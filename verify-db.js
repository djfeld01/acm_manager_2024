require("dotenv").config({ path: ".env.local" });
const postgres = require("postgres");

async function testDatabaseConnection() {
  console.log("🔍 Testing Supabase database connection...");
  console.log(
    "DATABASE_URL:",
    process.env.DATABASE_URL ? "✅ Found" : "❌ Missing"
  );

  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL environment variable is not set!");
    return;
  }

  const sql = postgres(process.env.DATABASE_URL, {
    host_timeout: 30,
    idle_timeout: 0,
    max_lifetime: 60 * 30,
  });

  try {
    console.log("⏳ Attempting database connection...");

    // Simple query to test connection
    const result = await sql`SELECT 1 as test, NOW() as current_time`;
    console.log("✅ Database connection successful!");
    console.log("📅 Server time:", result[0].current_time);

    // Try to check if tables exist
    console.log("⏳ Checking database tables...");
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
      LIMIT 10
    `;

    if (tables.length > 0) {
      console.log("✅ Found database tables:");
      tables.forEach((table) => {
        console.log(`   📋 ${table.table_name}`);
      });
    } else {
      console.log("⚠️  No tables found in public schema");
    }

    // Test a simple auth-related query
    try {
      const userCount = await sql`SELECT COUNT(*) as count FROM users`;
      console.log(
        `✅ Users table accessible: ${userCount[0].count} users found`
      );
    } catch (err) {
      console.log("⚠️  Users table not accessible or empty:", err.message);
    }

    console.log("\n🎉 Database is fully operational!");
  } catch (error) {
    console.error("❌ Database connection failed:");
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);

    if (error.code === "CONNECT_TIMEOUT") {
      console.log("\n🔍 Still getting connection timeout.");
      console.log("💡 Try waiting a bit longer and running the test again.");
    } else if (error.code === "3D000") {
      console.log("\n🔍 Database name issue detected.");
      console.log("💡 Check your DATABASE_URL configuration.");
    } else {
      console.log("\n🔍 Unexpected error occurred.");
      console.log("💡 Check your Supabase dashboard for more details.");
    }
  } finally {
    await sql.end();
    console.log("🔌 Database connection closed.");
  }
}

testDatabaseConnection();

require("dotenv").config({ path: ".env.local" });
const postgres = require("postgres");

async function testDatabaseConnection() {
  console.log("Testing database connection...");
  console.log(
    "DATABASE_URL:",
    process.env.DATABASE_URL ? "✅ Found" : "❌ Missing"
  );

  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL environment variable is not set!");
    return;
  }

  const sql = postgres(process.env.DATABASE_URL, {
    host_timeout: 60,
    idle_timeout: 0,
    max_lifetime: 60 * 30,
  });

  try {
    // Simple query to wake up the database
    const result = await sql`SELECT 1 as test`;
    console.log("✅ Database connection successful!");
    console.log("Result:", result);

    // Try to check if tables exist
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      LIMIT 5
    `;
    console.log(
      "✅ Found tables:",
      tables.map((t) => t.table_name)
    );
  } catch (error) {
    console.error("❌ Database connection failed:");
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);

    if (error.code === "CONNECT_TIMEOUT") {
      console.log("\n🔍 This appears to be a connection timeout.");
      console.log("💡 Possible solutions:");
      console.log(
        "   1. Your Supabase instance may be paused (free tier limitation)"
      );
      console.log("   2. Visit your Supabase dashboard to wake it up");
      console.log("   3. Check your connection string in .env.local");
      console.log("   4. Verify your network connection");
    }
  } finally {
    await sql.end();
  }
}

testDatabaseConnection();

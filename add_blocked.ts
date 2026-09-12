import { config } from "dotenv";
config({ path: ".env.local" });

import postgres from "postgres";

async function main() {
  const client = postgres(process.env.DATABASE_URL!);
  
  try {
    await client`ALTER TABLE "users" ADD COLUMN "is_blocked" boolean DEFAULT false NOT NULL;`;
    console.log("Column added successfully!");
  } catch (err: any) {
    if (err.message.includes("already exists")) {
       console.log("Column already exists");
    } else {
       console.error("Error adding column:", err);
    }
  } finally {
    await client.end();
  }
}

main();

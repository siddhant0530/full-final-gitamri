import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { products } from "../data/products";
import { dbUpsert } from "../lib/supabase";

// Minimal .env.local loader — avoids adding a dotenv dependency.
function loadEnvLocal() {
  const envPath = resolve(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (/^["'].*["']$/.test(value)) value = value.slice(1, -1);
    if (!(key in process.env)) process.env[key] = value;
  }
}
loadEnvLocal();

async function main() {
  const rows = products.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    price: p.price,
    image: p.image,
    stock: 100,
  }));

  console.log(`Seeding ${rows.length} products...`);
  const result = await dbUpsert("Product", rows, "id");
  console.log(`✅ Upserted ${result.length} products into Supabase.`);
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
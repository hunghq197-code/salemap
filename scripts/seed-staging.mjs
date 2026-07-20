import path from "node:path";

const seedPath = path.join("supabase", "seed-staging.sql");

console.log("SaleMap staging seed");
console.log("");
console.log("1. Open Supabase Dashboard > SQL Editor for the staging project.");
console.log(`2. Copy and run ${seedPath}.`);
console.log("3. Optional user tags: set salemap.seed_user_id in the SQL file before running.");
console.log("");
console.log("This script does not execute SQL automatically to avoid using production credentials by mistake.");

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();

if (!supabaseUrl || !serviceRoleKey || !email) {
  console.error(
    "Missing required env. Need NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, BOOTSTRAP_ADMIN_EMAIL.",
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function findUserByEmail(targetEmail) {
  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 100,
    });

    if (error) {
      throw error;
    }

    const user = data.users.find(
      (item) => item.email?.trim().toLowerCase() === targetEmail,
    );

    if (user) {
      return user;
    }

    if (data.users.length < 100) {
      return null;
    }
  }

  return null;
}

const user = await findUserByEmail(email);

if (!user) {
  console.error(`User not found for email: ${email}`);
  process.exit(1);
}

const now = new Date().toISOString();
const { error: adminError } = await supabase.from("admin_users").upsert(
  {
    is_active: true,
    role: "super_admin",
    updated_at: now,
    user_id: user.id,
  },
  { onConflict: "user_id" },
);

if (adminError) {
  throw adminError;
}

await supabase
  .from("user_profiles")
  .upsert(
    {
      account_status: "active",
      is_admin: true,
      updated_at: now,
      user_id: user.id,
    },
    { onConflict: "user_id" },
  );

console.log(`Bootstrapped super_admin for ${email}`);

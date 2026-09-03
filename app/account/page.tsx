import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import { dbSelect } from "@/lib/supabase";
import { getOrdersByUserId } from "@/lib/order-store";
import { formatPrice } from "@/lib/formatPrice";
import LogoutButton from "./LogoutButton";

interface UserRow {
  id: string;
  name: string | null;
  email: string | null;
}

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/account");
  }

  const rows = await dbSelect<UserRow>(
    "User",
    `supabaseAuthId=eq.${user.id}&select=id,name,email&limit=1`
  );
  const profile = rows[0];
  const orders = profile ? await getOrdersByUserId(profile.id) : [];

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900">
            {profile?.name ? `Hi, ${profile.name}` : "Your Account"}
          </h1>
          <p className="mt-1 text-zinc-600">{profile?.email || user.email}</p>
        </div>
        <LogoutButton />
      </div>

      <h2 className="mb-4 text-xl font-semibold">Order History</h2>

      {orders.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center">
          <p className="text-zinc-600">No orders yet.</p>
          <Link href="/products" className="mt-4 inline-block text-gold-700 underline">
            Browse products
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/order-confirmation/${order.trackingId}`}
              className="block rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:border-gray-300"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{order.trackingId}</span>
                <span className="rounded-full bg-sage px-3 py-1 text-xs font-semibold text-olive">
                  {order.status}
                </span>
              </div>
              <p className="mt-1 text-sm text-zinc-500">
                {new Date(order.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
                {" · "}
                {order.items.length} item{order.items.length !== 1 ? "s" : ""}
              </p>
              <p className="mt-2 font-semibold">{formatPrice(order.total)}</p>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}

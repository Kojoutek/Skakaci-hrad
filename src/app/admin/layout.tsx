import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🏰</span>
          <span className="font-bold text-lg">Admin panel</span>
        </div>
        <form action="/admin/logout" method="post">
          <button
            type="submit"
            className="text-sm text-gray-500 hover:text-gray-900"
          >
            Odhlásit se
          </button>
        </form>
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}


import AdminSidebar from "./AdminSidebar";

export default function AdminLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#FAFAF9] md:flex">
      <AdminSidebar />
      <main className="flex-1 min-w-0 p-4 md:p-8">
        {children}
      </main>
    </div>
  );
}

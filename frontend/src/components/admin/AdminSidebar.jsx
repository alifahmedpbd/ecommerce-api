
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Tags,
  ShoppingBag,
  Users,
  MessageSquare,
  Store,
} from "lucide-react";

const links = [
  { name: "Overview", path: "/admin", icon: LayoutDashboard, end: true },
  { name: "Products", path: "/admin/products", icon: Package },
  { name: "Categories", path: "/admin/categories", icon: Tags },
  { name: "Orders", path: "/admin/orders", icon: ShoppingBag },
  { name: "Staff", path: "/admin/staff", icon: Users },
  { name: "Reviews", path: "/admin/reviews", icon: MessageSquare },
];

export default function AdminSidebar() {
  return (
    <aside className="w-full md:w-64 shrink-0 bg-[#171717] text-white md:min-h-screen">
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <Store className="text-emerald-400" size={25} />
          <div>
            <h2 className="font-bold text-lg">API Store</h2>
            <p className="text-xs text-gray-400">Admin Panel</p>
          </div>
        </div>
      </div>

      <nav className="p-4 flex md:flex-col gap-2 overflow-x-auto">
        {links.map(({ name, path, icon: Icon, end }) => (
          <NavLink
            key={path}
            to={path}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg whitespace-nowrap transition ${
                isActive
                  ? "bg-[#047857] text-white"
                  : "text-gray-300 hover:bg-white/10"
              }`
            }
          >
            <Icon size={19} />
            <span className="text-sm font-medium">{name}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

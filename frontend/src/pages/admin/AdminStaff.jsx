
import { useEffect, useState } from "react";
import { UserPlus, Shield, UserX } from "lucide-react";
import api from "../../services/api";
import AdminLayout from "../../components/admin/AdminLayout";
import normalizeList from "../../utils/normalizeList";

const initialForm = {
  username: "",
  email: "",
  password: "",
  first_name: "",
  last_name: "",
};

export default function AdminStaff() {
  const [staff, setStaff] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

const loadStaff = async () => {
  try {
    const res = await api.get("/admin/staff/");
    setStaff(normalizeList(res.data));
  } catch (err) {
    console.error(err.response?.data || err);
    setError("Staff list load করা যায়নি।");
  }
};

  useEffect(() => {
    loadStaff();
  }, []);

  const changeForm = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const createStaff = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      await api.post("/admin/staff/", form);
      setMessage("New staff account created.");
      setForm(initialForm);
      setShowForm(false);
      loadStaff();
    } catch (err) {
      setError(JSON.stringify(err.response?.data || "Staff creation failed."));
    }
  };

  const updateRole = async (user) => {
    const nextRole = user.role === "staff" ? "customer" : "staff";
    if (!window.confirm(`এই user-কে ${nextRole} role দিতে চাও?`)) return;

    try {
      const res = await api.patch(`/admin/staff/${user.id}/role/`, {
        role: nextRole,
      });

      setStaff((prev) =>
        prev.map((item) =>
          item.id === user.id ? res.data.data : item
        )
      );
      setMessage("User role updated.");
    } catch (err) {
      setError(JSON.stringify(err.response?.data || "Role update failed."));
    }
  };

  return (
    <AdminLayout>
      <div className="flex flex-wrap justify-between items-center gap-4 mb-7">
        <div>
          <h1 className="text-2xl font-bold">Staff Management</h1>
          <p className="text-sm text-gray-500 mt-1">Create staff and manage user roles</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="bg-[#047857] text-white px-4 py-2.5 rounded-lg flex items-center gap-2">
          <UserPlus size={18} /> Add Staff
        </button>
      </div>

      {message && <p className="text-[#047857] mb-4 text-sm">{message}</p>}
      {error && <p className="text-red-600 mb-4 text-sm break-words">{error}</p>}

      {showForm && (
        <form onSubmit={createStaff} className="bg-white border rounded-xl p-5 mb-6 grid md:grid-cols-2 gap-4">
          <h2 className="font-semibold md:col-span-2">Create Staff Account</h2>
          <input name="username" value={form.username} onChange={changeForm} placeholder="Username" required className="border rounded-lg p-3" />
          <input name="email" type="email" value={form.email} onChange={changeForm} placeholder="Email" required className="border rounded-lg p-3" />
          <input name="first_name" value={form.first_name} onChange={changeForm} placeholder="First name" className="border rounded-lg p-3" />
          <input name="last_name" value={form.last_name} onChange={changeForm} placeholder="Last name" className="border rounded-lg p-3" />
          <input name="password" type="password" value={form.password} onChange={changeForm} placeholder="Password" required className="border rounded-lg p-3 md:col-span-2" />
          <button className="bg-[#047857] text-white rounded-lg p-3 md:col-span-2">Create Staff</button>
        </form>
      )}

      <div className="bg-white border rounded-xl overflow-x-auto">
        <table className="w-full min-w-[650px] text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="p-4 text-left">User</th>
              <th className="p-4 text-left">Email</th>
              <th className="p-4 text-left">Role</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((user) => (
              <tr key={user.id} className="border-t">
                <td className="p-4 font-medium">{user.username}</td>
                <td className="p-4">{user.email}</td>
                <td className="p-4 capitalize">{user.role}</td>
                <td className="p-4">{user.is_active ? "Active" : "Inactive"}</td>
                <td className="p-4 text-right">
                  <button onClick={() => updateRole(user)} className="text-[#047857] inline-flex items-center gap-1">
                    {user.role === "staff" ? <><UserX size={16} /> Make Customer</> : <><Shield size={16} /> Make Staff</>}
                  </button>
                </td>
              </tr>
            ))}
            {!staff.length && <tr><td colSpan="5" className="p-6 text-center text-gray-500">No staff accounts found.</td></tr>}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}

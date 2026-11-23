
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import api from "../../services/api";
import AdminLayout from "../../components/admin/AdminLayout";
import normalizeList from "../../utils/normalizeList";

const initialForm = { name: "", slug: "", image: null };

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadCategories = async () => {
  try {
    const res = await api.get("/admin/categories/");
    setCategories(normalizeList(res.data));
  } catch (err) {
    console.error(err.response?.data || err);
    setError("Categories load করা যায়নি।");
  }
};

  useEffect(() => {
    loadCategories();
  }, []);

const makeSlug = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const changeForm = (e) => {
  const { name, value, files } = e.target;

  setForm((prev) => ({
    ...prev,
    [name]: name === "image" ? files[0] : value,
    ...(name === "name" ? { slug: makeSlug(value) } : {}),
  }));
};

  const openEdit = (category) => {
    setEditingId(category.id);
    setForm({ name: category.name, slug: category.slug, image: null });
    setShowForm(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    const data = new FormData();
    data.append("name", form.name);
    data.append("slug", form.slug);
    if (form.image) data.append("image", form.image);

    try {
      if (editingId) {
        await api.patch(`/admin/categories/${editingId}/`, data);
        setMessage("Category updated.");
      } else {
        await api.post("/admin/categories/", data);
        setMessage("Category created.");
      }

      setShowForm(false);
      setEditingId(null);
      setForm(initialForm);
      loadCategories();
    } catch (err) {
      setError(JSON.stringify(err.response?.data || "Category save failed."));
    }
  };

  const remove = async (id) => {
    if (!window.confirm("এই Category delete করতে চাও?")) return;
    try {
      await api.delete(`/admin/categories/${id}/`);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      setMessage("Category deleted.");
    } catch (err) {
      setError(JSON.stringify(err.response?.data || "Category delete failed."));
    }
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center gap-3 mb-7">
        <div>
          <h1 className="text-2xl font-bold">Categories</h1>
          <p className="text-sm text-gray-500 mt-1">Manage product categories</p>
        </div>
        <button onClick={() => { setEditingId(null); setForm(initialForm); setShowForm(true); }} className="bg-[#047857] text-white px-4 py-2.5 rounded-lg flex gap-2 items-center">
          <Plus size={18} /> Add Category
        </button>
      </div>

      {message && <p className="text-[#047857] mb-4 text-sm">{message}</p>}
      {error && <p className="text-red-600 mb-4 text-sm break-words">{error}</p>}

      {showForm && (
        <form onSubmit={submit} className="bg-white border rounded-xl p-5 mb-6 grid md:grid-cols-2 gap-4">
          <div className="md:col-span-2 flex justify-between">
            <h2 className="font-semibold">{editingId ? "Edit Category" : "New Category"}</h2>
            <button type="button" onClick={() => setShowForm(false)}><X /></button>
          </div>
          <input name="name" value={form.name} onChange={changeForm} placeholder="Category name" required className="border rounded-lg p-3" />
          <input name="slug" value={form.slug} onChange={changeForm} placeholder="Slug" required className="border rounded-lg p-3" />
          <input name="image" type="file" accept="image/*" onChange={changeForm} className="border rounded-lg p-3 md:col-span-2" />
          <button className="bg-[#047857] text-white rounded-lg p-3 md:col-span-2">Save Category</button>
        </form>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => (
          <div key={cat.id} className="bg-white border rounded-xl p-4">
            {cat.image && <img src={cat.image} alt={cat.name} className="w-full h-36 object-cover rounded-lg mb-4" />}
            <h3 className="font-semibold">{cat.name}</h3>
            <p className="text-sm text-gray-500 mt-1">{cat.slug}</p>
            <div className="flex gap-3 mt-4">
              <button onClick={() => openEdit(cat)} className="text-[#047857] flex items-center gap-1 text-sm"><Pencil size={16} /> Edit</button>
              <button onClick={() => remove(cat.id)} className="text-red-600 flex items-center gap-1 text-sm"><Trash2 size={16} /> Delete</button>
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}

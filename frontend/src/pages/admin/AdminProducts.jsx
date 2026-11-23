
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import api from "../../services/api";
import AdminLayout from "../../components/admin/AdminLayout";
import normalizeList from "../../utils/normalizeList";



const emptyForm = {
  name: "",
  description: "",
  price: "",
  slug: "",
  stock: 0,
  category: "",
  featured: false,
  image: null,
};

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");


const loadData = async () => {
  setError("");

  try {
    const productRes = await api.get("/admin/products/");

    console.log("PRODUCT API RESPONSE:", productRes.data);

    setProducts(normalizeList(productRes.data));
  } catch (err) {
    console.error("PRODUCT API ERROR:", err.response?.data || err);
    setError(
      JSON.stringify(err.response?.data || "Products load failed.")
    );
  }

  try {
    const categoryRes = await api.get("/admin/categories/");

    console.log("CATEGORY API RESPONSE:", categoryRes.data);

    setCategories(normalizeList(categoryRes.data));
  } catch (err) {
    console.error("CATEGORY API ERROR:", err.response?.data || err);
  } finally {
    setLoading(false);
  }
};


  
  useEffect(() => {
    loadData();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
    setError("");
    setMessage("");
  };

  const openEdit = (product) => {
    setEditingId(product.id);
    setForm({
      name: product.name || "",
      description: product.description || "",
      price: product.price || "",
      slug: product.slug || "",
      stock: product.stock ?? 0,
      category: product.category || "",
      featured: product.featured || false,
      image: null,
    });
    setShowForm(true);
    setError("");
    setMessage("");
  };

const makeSlug = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const handleChange = (e) => {
  const { name, value, type, checked, files } = e.target;

  setForm((prev) => {
    const updated = {
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : type === "file"
          ? files[0]
          : value,
    };

    if (name === "name") {
      updated.slug = makeSlug(value);
    }

    return updated;
  });
};
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    const data = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (value !== null && value !== "") {
        data.append(key, value);
      }
    });

    try {
      if (editingId) {
        await api.patch(`/admin/products/${editingId}/`, data);
        setMessage("Product updated successfully.");
      } else {
        await api.post("/admin/products/", data);
        setMessage("Product created successfully.");
      }

      setShowForm(false);
      setForm(emptyForm);
      setEditingId(null);
      await loadData();
    } catch (err) {
      setError(
        JSON.stringify(err.response?.data || "Product save failed.")
      );
    }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm("এই Product delete করতে চাও?")) return;

    try {
      await api.delete(`/admin/products/${id}/`);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      setMessage("Product deleted successfully.");
    } catch (err) {
      setError("Product delete করা যায়নি।");
    }
  };

  return (
    <AdminLayout>
      <div className="flex flex-wrap justify-between items-center gap-4 mb-7">
        <div>
          <h1 className="text-2xl font-bold text-[#171717]">Products</h1>
          <p className="text-sm text-gray-500 mt-1">Manage store products</p>
        </div>
        <button onClick={openCreate} className="bg-[#047857] text-white px-4 py-2.5 rounded-lg flex items-center gap-2">
          <Plus size={18} /> Add Product
        </button>
      </div>

      {message && <p className="mb-4 text-sm text-[#047857]">{message}</p>}
      {error && <p className="mb-4 text-sm text-red-600 break-words">{error}</p>}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border rounded-xl p-5 mb-6 grid md:grid-cols-2 gap-4">
          <div className="md:col-span-2 flex justify-between items-center">
            <h2 className="font-semibold">{editingId ? "Edit Product" : "Add Product"}</h2>
            <button type="button" onClick={() => setShowForm(false)}><X /></button>
          </div>

          <input name="name" value={form.name} onChange={handleChange} placeholder="Product name" required className="border rounded-lg p-3" />
          <input name="slug" value={form.slug} onChange={handleChange} placeholder="Slug" required className="border rounded-lg p-3" />
          <input name="price" type="number" step="0.01" value={form.price} onChange={handleChange} placeholder="Price" required className="border rounded-lg p-3" />
          <input name="stock" type="number" min="0" value={form.stock} onChange={handleChange} placeholder="Stock" required className="border rounded-lg p-3" />

          <select name="category" value={form.category} onChange={handleChange} className="border rounded-lg p-3">
            <option value="">No category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>

          <input name="image" type="file" accept="image/*" onChange={handleChange} className="border rounded-lg p-3" />

          <textarea name="description" value={form.description} onChange={handleChange} placeholder="Description" rows="4" className="border rounded-lg p-3 md:col-span-2" />

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="featured" checked={form.featured} onChange={handleChange} />
            Featured product
          </label>

          <button className="bg-[#047857] text-white rounded-lg py-3 md:col-span-2">
            {editingId ? "Update Product" : "Create Product"}
          </button>
        </form>
      )}

      <div className="bg-white rounded-xl border overflow-x-auto">
        {loading ? <p className="p-6">Loading products...</p> : (
          <table className="w-full text-sm min-w-[700px]">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="text-left p-4">Product</th>
                <th className="text-left p-4">Price</th>
                <th className="text-left p-4">Stock</th>
                <th className="text-left p-4">Featured</th>
                <th className="text-right p-4">Actions</th>
                <th className="text-left p-4">Category</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-t">
                  <td className="p-4 font-medium">{product.name}</td>
                  <td className="p-4">{product.price}</td>
                  <td className="p-4">{product.stock}</td>
                  <td className="p-4">{product.featured ? "Yes" : "No"}</td>
                  <td className="p-4">
                    <div className="flex justify-end gap-3">
                      <button onClick={() => openEdit(product)} className="text-[#047857]"><Pencil size={18} /></button>
                      <button onClick={() => deleteProduct(product.id)} className="text-red-600"><Trash2 size={18} /></button>
                    </div>
                  </td>
                  <td className="p-4">
  {categories.find(
    (cat) => String(cat.id) === String(product.category)
  )?.name || "Uncategorized"}
</td>
                </tr>
              ))}
              {!products.length && <tr><td colSpan="5" className="p-6 text-center text-gray-500">No products found.</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </AdminLayout>
  );
}

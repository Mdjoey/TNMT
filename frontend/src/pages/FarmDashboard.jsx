import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import {
  PlusCircle,
  Boxes,
  MapPin,
  ShieldCheck,
  QrCode,
  Settings,
  Navigation,
  Trash2,
  Edit,
  PauseCircle,
  PlayCircle,
  Upload,
  FileSpreadsheet,
  Eye,
  Download,
  X,
  Search,
  TrendingUp,
  AlertTriangle,
  BookOpen,
} from "lucide-react";
import LocationPickerMap from "../components/LocationPickerMap";

export default function FarmDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [farmInfo, setFarmInfo] = useState(null);
  const [products, setProducts] = useState([]);
  const [batches, setBatches] = useState([]);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({
    real_revenue: 0,
    pending_revenue: 0,
    total_orders: 0,
    delivered_orders: 0,
    low_stock_count: 0,
    out_of_stock_count: 0,
    top_products: [],
  });

  // State Quản lý bài viết Blog
  const [posts, setPosts] = useState([]);
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const [submittingPost, setSubmittingPost] = useState(false);
  const [postCoverPreview, setPostCoverPreview] = useState(null);
  const [newPost, setNewPost] = useState({
    title: "",
    category: "KNOWLEDGE",
    excerpt: "",
    content: "",
    coverFile: null,
    related_products: [],
  });

  // Lấy danh sách bài viết của trang trại hiện tại
  const fetchMyPosts = () => {
    const token = localStorage.getItem("ecotrace_token");
    if (!token) return;
    axios
      .get("http://localhost:8000/api/posts/my-posts/", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setPosts(res.data.results || res.data || []))
      .catch(console.error);
  };

  useEffect(() => {
    if (activeTab === "posts") {
      fetchMyPosts();
    }
  }, [activeTab]);

  // Hàm hỗ trợ chèn cú pháp định dạng nhanh vào khung nội dung
  const insertFormatting = (prefix, suffix = "") => {
    const textarea = document.getElementById("post-content-textarea");
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = newPost.content;
    const selectedText = text.substring(start, end) || "nội dung";
    const replacement = `${prefix}${selectedText}${suffix}`;

    const updatedContent =
      text.substring(0, start) + replacement + text.substring(end);
    setNewPost({ ...newPost, content: updatedContent });

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + selectedText.length,
      );
    }, 0);
  };

  // Xử lý đăng bài viết mới (hỗ trợ upload file ảnh từ máy)
  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPost.title.trim() || !newPost.content.trim()) {
      alert("Vui lòng điền tiêu đề và nội dung bài viết!");
      return;
    }

    setSubmittingPost(true);
    const token = localStorage.getItem("ecotrace_token");

    // Đóng gói dữ liệu dạng FormData để gửi file ảnh
    const formData = new FormData();
    formData.append("title", newPost.title.trim());
    formData.append("category", newPost.category);
    formData.append("excerpt", newPost.excerpt.trim());
    formData.append("content", newPost.content.trim());

    if (newPost.coverFile) {
      formData.append("cover_image", newPost.coverFile);
    }

    if (newPost.related_products && newPost.related_products.length > 0) {
      newPost.related_products.forEach((pId) => {
        formData.append("related_products", pId);
      });
    }

    try {
      await axios.post("http://localhost:8000/api/posts/", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      alert("Đăng bài viết thành công!");
      setShowCreatePostModal(false);
      setNewPost({
        title: "",
        category: "KNOWLEDGE",
        excerpt: "",
        content: "",
        coverFile: null,
        related_products: [],
      });
      setPostCoverPreview(null);
      fetchMyPosts();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Có lỗi xảy ra khi đăng bài.");
    } finally {
      setSubmittingPost(false);
    }
  };

  // Xóa bài viết
  const handleDeletePost = async (slugOrId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa bài viết này không?"))
      return;
    const token = localStorage.getItem("ecotrace_token");
    try {
      await axios.delete(`http://localhost:8000/api/posts/${slugOrId}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Đã xóa bài viết.");
      fetchMyPosts();
    } catch (err) {
      alert("Không thể xóa bài viết.");
    }
  };

  const [loading, setLoading] = useState(true);

  // State tìm kiếm và lọc sản phẩm
  const [productSearch, setProductSearch] = useState("");
  const [productFilterCat, setProductFilterCat] = useState("Tất cả");

  const filteredShopProducts = products.filter((p) => {
    const matchName = p.name
      .toLowerCase()
      .includes(productSearch.toLowerCase());
    const matchCat =
      productFilterCat === "Tất cả" || p.category === productFilterCat;
    return matchName && matchCat;
  });

  // State tìm kiếm và lọc Lô xuất xứ
  const [batchSearch, setBatchSearch] = useState("");
  const [batchFilterGrade, setBatchFilterGrade] = useState("Tất cả");
  const [editingBatch, setEditingBatch] = useState(null);

  const filteredBatches = batches.filter((b) => {
    const matchName =
      (b.product?.name || "")
        .toLowerCase()
        .includes(batchSearch.toLowerCase()) ||
      (b.batch_code || "").toLowerCase().includes(batchSearch.toLowerCase());
    const matchGrade =
      batchFilterGrade === "Tất cả" || b.eco_grade === batchFilterGrade;
    return matchName && matchGrade;
  });

  // Form Thêm sản phẩm mới
  const [newProduct, setNewProduct] = useState({
    name: "",
    category: "Rau ăn lá",
    price: "",
    unit: "kg",
    stock_quantity: 50,
    description: "",
    imageFile: null,
  });
  const [imagePreview, setImagePreview] = useState(null);

  // Modal chỉnh sửa sản phẩm
  const [editingProduct, setEditingProduct] = useState(null);
  const [editImageFile, setEditImageFile] = useState(null);

  // Form Nhập kho lô canh tác
  const [newBatch, setNewBatch] = useState({
    product_id: "",
    quantity: 100,
    planting_date: "2026-09-01",
    harvest_date: "2026-10-15",
    init_temp: 24.5,
    init_hum: 72.0,
    init_soil_m: 68.0,
    init_ph: 6.5,
  });

  // State tìm kiếm và lọc cho Kho hàng
  const [invSearch, setInvSearch] = useState("");
  const [invFilterStatus, setInvFilterStatus] = useState("ALL");

  const filteredInventory = products.filter((p) => {
    const matchName =
      p.name.toLowerCase().includes(invSearch.toLowerCase()) ||
      p.category.toLowerCase().includes(invSearch.toLowerCase());
    const stock = p.stock_quantity ?? 0;
    let matchStatus = true;
    if (invFilterStatus === "LOW") matchStatus = stock > 0 && stock <= 5;
    else if (invFilterStatus === "OUT") matchStatus = stock === 0;
    else if (invFilterStatus === "AVAILABLE") matchStatus = stock > 5;
    return matchName && matchStatus;
  });

  // State Import Excel Vi Khí Hậu
  const [excelFile, setExcelFile] = useState(null);
  const [importingBatch, setImportingBatch] = useState("");
  const [excelMsg, setExcelMsg] = useState("");

  // State Import CSV Tồn kho
  const [inventoryFile, setInventoryFile] = useState(null);

  // Form Hồ sơ Farm
  const [farmForm, setFarmForm] = useState({
    name: "",
    address: "",
    latitude: 10.3541,
    longitude: 105.7481,
    vietgap_cert_id: "",
    description: "",
    image_url: "",
  });

  const loadAllData = () => {
    setLoading(true);
    const token = localStorage.getItem("ecotrace_token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    axios
      .get("http://localhost:8000/api/farms/my-farm/", { headers })
      .then((res) => {
        setFarmInfo(res.data);
        setFarmForm({
          name: res.data.name || "",
          address: res.data.address || "",
          latitude: res.data.latitude || 10.3541,
          longitude: res.data.longitude || 105.7481,
          vietgap_cert_id: res.data.vietgap_cert_id || "",
          description: res.data.description || "",
          image_url: res.data.image_url || "",
        });
      })
      .catch((err) => console.error("Lỗi my-farm:", err));

    axios
      .get("http://localhost:8000/api/farms/my-products/", { headers })
      .then((res) => {
        const pData = Array.isArray(res.data)
          ? res.data
          : res.data.results || [];
        setProducts(pData);
        if (pData.length > 0 && !newBatch.product_id) {
          setNewBatch((prev) => ({ ...prev, product_id: pData[0].id }));
        }
      })
      .catch((err) => console.error("Lỗi my-products:", err));

    axios
      .get("http://localhost:8000/api/batches/", { headers })
      .then((res) => {
        const bData = Array.isArray(res.data)
          ? res.data
          : res.data.results || [];
        setBatches(bData);
        if (bData.length > 0 && !importingBatch)
          setImportingBatch(bData[0].batch_code);
      })
      .catch((err) => console.error("Lỗi batches:", err));

    axios
      .get("http://localhost:8000/api/orders/vendor-orders/", { headers })
      .then((res) =>
        setOrders(Array.isArray(res.data) ? res.data : res.data.results || []),
      )
      .catch((err) => console.error("Lỗi vendor-orders:", err));

    axios
      .get("http://localhost:8000/api/orders/stats/", { headers })
      .then((res) => setStats(res.data))
      .catch((err) => console.error("Lỗi stats:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // 1. Thêm sản phẩm
  const handleCreateProduct = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("ecotrace_token");
    const formData = new FormData();
    formData.append("name", newProduct.name);
    formData.append("category", newProduct.category);
    formData.append("price", newProduct.price);
    formData.append("unit", newProduct.unit);
    formData.append("stock_quantity", newProduct.stock_quantity);
    formData.append("description", newProduct.description);
    if (newProduct.imageFile) formData.append("image", newProduct.imageFile);

    try {
      const res = await axios.post(
        "http://localhost:8000/api/farms/add-product/",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        },
      );
      alert(`Đã thêm thành công sản phẩm "${res.data.name}"!`);
      setNewProduct({
        name: "",
        category: "Rau ăn lá",
        price: "",
        unit: "kg",
        stock_quantity: 50,
        description: "",
        imageFile: null,
      });
      setImagePreview(null);
      loadAllData();
    } catch (err) {
      alert(err.response?.data?.error || "Lỗi tạo sản phẩm");
    }
  };

  // 2. Chỉnh sửa sản phẩm
  const handleSaveEditProduct = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("ecotrace_token");
    const formData = new FormData();
    formData.append("name", editingProduct.name);
    formData.append("category", editingProduct.category);
    formData.append("price", editingProduct.price);
    formData.append("unit", editingProduct.unit);
    formData.append("stock_quantity", editingProduct.stock_quantity);
    formData.append("description", editingProduct.description || "");
    if (editImageFile) formData.append("image", editImageFile);

    try {
      await axios.put(
        `http://localhost:8000/api/farms/${editingProduct.id}/edit-product/`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        },
      );
      alert("Cập nhật thông tin sản phẩm thành công!");
      setEditingProduct(null);
      setEditImageFile(null);
      loadAllData();
    } catch (err) {
      alert("Lỗi cập nhật sản phẩm!");
    }
  };

  // 3. Xóa sản phẩm
  const handleDeleteProduct = async (productId, name) => {
    if (
      !window.confirm(
        `Bạn có chắc chắn muốn xóa hẳn sản phẩm "${name}" khỏi sàn?`,
      )
    )
      return;
    const token = localStorage.getItem("ecotrace_token");
    try {
      await axios.delete(
        `http://localhost:8000/api/farms/${productId}/delete-product/`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      alert(`Đã xóa sản phẩm "${name}" thành công!`);
      setProducts(products.filter((p) => p.id !== productId));
    } catch (err) {
      alert("Lỗi khi xóa sản phẩm!");
    }
  };

  // 4. Bật / Tắt bán
  const handleToggleActive = async (productId) => {
    const token = localStorage.getItem("ecotrace_token");
    try {
      const res = await axios.post(
        `http://localhost:8000/api/farms/${productId}/toggle-active/`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      alert(res.data.message);
      setProducts(
        products.map((p) =>
          p.id === productId ? { ...p, is_active: res.data.is_active } : p,
        ),
      );
    } catch (err) {
      alert("Lỗi đổi trạng thái sản phẩm!");
    }
  };

  // 5. Khởi tạo Lô mới
  const handleCreateBatch = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("ecotrace_token");
    try {
      const res = await axios.post(
        "http://localhost:8000/api/farms/create-batch/",
        newBatch,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      alert(
        `Nhập kho thành công! Mã lô: ${res.data.batch_code}. Đã cộng ${newBatch.quantity} vào kho.`,
      );
      loadAllData();
      setActiveTab("batches");
    } catch (err) {
      alert("Lỗi nhập kho lô hàng!");
    }
  };

  // 6. Xóa lô hàng
  const handleDeleteBatch = async (batchCode) => {
    if (
      !window.confirm(
        `Bạn có chắc muốn xóa vĩnh viễn lô "${batchCode}"? Mọi dữ liệu vi khí hậu của lô này cũng sẽ bị xóa!`,
      )
    )
      return;
    const token = localStorage.getItem("ecotrace_token");
    try {
      await axios.delete(`http://localhost:8000/api/batches/${batchCode}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert(`Đã xóa thành công lô ${batchCode}!`);
      setBatches(batches.filter((b) => b.batch_code !== batchCode));
    } catch (err) {
      alert("Lỗi khi xóa lô hàng!");
    }
  };

  // 7. Lưu chỉnh sửa lô hàng
  const handleSaveEditBatch = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("ecotrace_token");
    try {
      const res = await axios.put(
        `http://localhost:8000/api/batches/${editingBatch.batch_code}/`,
        editingBatch,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      alert("Cập nhật thông tin lô hàng và chỉ số vi khí hậu thành công!");
      setBatches(
        batches.map((b) =>
          b.batch_code === editingBatch.batch_code ? res.data : b,
        ),
      );
      setEditingBatch(null);
    } catch (err) {
      alert("Lỗi cập nhật lô hàng!");
    }
  };

  // 8. Import Excel Vi Khí Hậu
  const handleImportExcel = async (e) => {
    e.preventDefault();
    if (!excelFile || !importingBatch) {
      alert("Vui lòng chọn lô hàng và chọn file Excel!");
      return;
    }
    const token = localStorage.getItem("ecotrace_token");
    const formData = new FormData();
    formData.append("file", excelFile);

    try {
      const res = await axios.post(
        `http://localhost:8000/api/batches/${importingBatch}/import-excel/`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        },
      );
      setExcelMsg(res.data.message);
      alert(
        `${res.data.message}\nĐiểm Eco-Score mới: ${res.data.new_eco_score} (Hạng ${res.data.new_eco_grade})`,
      );
      setExcelFile(null);
      loadAllData();
    } catch (err) {
      alert(err.response?.data?.error || "Lỗi đọc file Excel!");
    }
  };

  const downloadSampleExcel = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "temperature,humidity,soil_moisture,soil_ph,date\n" +
      "24.5,75.0,68.0,6.5,2026-09-10\n" +
      "25.0,73.5,67.5,6.6,2026-09-11\n" +
      "23.8,76.0,70.0,6.4,2026-09-12\n" +
      "24.2,74.0,69.0,6.5,2026-09-13\n" +
      "25.5,72.0,66.5,6.7,2026-09-14\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "mau_nhat_ky_vi_khi_hau.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 9. Cập nhật tồn kho qua CSV
  const handleImportInventory = async (e) => {
    e.preventDefault();
    if (!inventoryFile) return alert("Vui lòng chọn file CSV tồn kho!");
    const token = localStorage.getItem("ecotrace_token");
    const formData = new FormData();
    formData.append("file", inventoryFile);

    try {
      const res = await axios.post(
        "http://localhost:8000/api/farms/import-inventory/",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        },
      );
      alert(res.data.message);
      setInventoryFile(null);
      loadAllData();
    } catch (err) {
      alert("Lỗi cập nhật kho từ file!");
    }
  };

  const downloadInventoryTemplate = () => {
    let csv = "product_id,product_name,stock\n";
    products.forEach((p) => {
      csv += `${p.id},"${p.name}",${p.stock_quantity}\n`;
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "danh_sach_ton_kho.csv";
    link.click();
  };

  // 10. Đổi trạng thái đơn
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    const token = localStorage.getItem("ecotrace_token");
    try {
      const res = await axios.post(
        `http://localhost:8000/api/orders/${orderId}/update-status/`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      alert(res.data.message || "Đã cập nhật trạng thái đơn hàng!");
      loadAllData();
    } catch (err) {
      alert(err.response?.data?.error || "Lỗi cập nhật trạng thái đơn hàng!");
    }
  };

  // 11. Cập nhật hồ sơ shop
  const handleUpdateFarm = (e) => {
    e.preventDefault();
    const token = localStorage.getItem("ecotrace_token");
    axios
      .put("http://localhost:8000/api/farms/my-farm/", farmForm, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        alert("Cập nhật hồ sơ trang trại thành công!");
        setFarmInfo(res.data);
      })
      .catch(() => alert("Lỗi cập nhật hồ sơ!"));
  };

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setFarmForm((prev) => ({
            ...prev,
            latitude: Number(pos.coords.latitude.toFixed(6)),
            longitude: Number(pos.coords.longitude.toFixed(6)),
          }));
          alert("Đã nhận diện tọa độ GPS thực tế của bạn!");
        },
        () => alert("Không thể truy cập GPS trình duyệt."),
      );
    }
  };

  if (loading)
    return (
      <div className="text-center py-24 text-gray-400 font-medium text-xs">
        Đang tải trung tâm quản trị...
      </div>
    );

  return (
    <div className="max-w-6xl mx-auto p-6 font-sans">
      {/* Banner Shop */}
      {farmInfo && (
        <div className="bg-emerald-900 text-white rounded-3xl p-6 mb-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-emerald-700 text-emerald-100 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                Gian hàng chủ vườn
              </span>
              <span className="text-xs text-emerald-300 flex items-center gap-1 font-mono">
                <ShieldCheck className="w-3.5 h-3.5" /> VietGAP:{" "}
                {farmInfo.vietgap_cert_id}
              </span>
            </div>
            <h1 className="text-2xl font-bold mt-1">{farmInfo.name}</h1>
            <p className="text-xs text-emerald-200 mt-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 shrink-0" /> {farmInfo.address}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to={`/farm/${farmInfo.id}`}
              className="bg-white/10 hover:bg-white/20 border border-white/20 px-3.5 py-2 rounded-2xl text-xs font-semibold text-white transition flex items-center gap-1"
            >
              <Eye className="w-3.5 h-3.5" /> Xem hồ sơ công khai
            </Link>
          </div>
        </div>
      )}

      {/* Tabs Chức Năng */}
      <div className="flex bg-slate-100 p-1.5 rounded-2xl text-xs font-bold mb-6 max-w-4xl flex-wrap gap-1">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 ${activeTab === "overview" ? "bg-white text-emerald-700 shadow-xs" : "text-gray-500"}`}
        >
          <TrendingUp className="w-3.5 h-3.5" /> Tổng quan & Doanh thu
        </button>
        <button
          onClick={() => setActiveTab("inventory")}
          className={`px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 ${activeTab === "inventory" ? "bg-white text-emerald-700 shadow-xs" : "text-gray-500"}`}
        >
          <Boxes className="w-3.5 h-3.5" /> Kho hàng & Cảnh báo (
          {products.length})
        </button>
        <button
          onClick={() => setActiveTab("products")}
          className={`px-4 py-2.5 rounded-xl transition ${activeTab === "products" ? "bg-white text-emerald-700 shadow-xs" : "text-gray-500"}`}
        >
          Sản phẩm ({products.length})
        </button>
        <button
          onClick={() => setActiveTab("batches")}
          className={`px-4 py-2.5 rounded-xl transition ${activeTab === "batches" ? "bg-white text-emerald-700 shadow-xs" : "text-gray-500"}`}
        >
          Lô xuất xứ & Mã QR ({batches.length})
        </button>
        <button
          onClick={() => setActiveTab("posts")}
          className={`px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 ${activeTab === "posts" ? "bg-white text-emerald-700 shadow-xs" : "text-gray-500"}`}
        >
          <BookOpen className="w-3.5 h-3.5" /> Bài viết & Nhật ký (
          {posts.length})
        </button>
        <button
          onClick={() => setActiveTab("excel")}
          className={`px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 ${activeTab === "excel" ? "bg-white text-emerald-700 shadow-xs" : "text-gray-500"}`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5" /> Nhập Excel Vi Khí Hậu
        </button>
        <button
          onClick={() => setActiveTab("orders")}
          className={`px-4 py-2.5 rounded-xl transition ${activeTab === "orders" ? "bg-white text-emerald-700 shadow-xs" : "text-gray-500"}`}
        >
          Đơn hàng ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab("profile")}
          className={`px-4 py-2.5 rounded-xl transition flex items-center gap-1 ${activeTab === "profile" ? "bg-white text-emerald-700 shadow-xs" : "text-gray-500"}`}
        >
          <Settings className="w-3.5 h-3.5" /> Hồ sơ Shop & GPS
        </button>
      </div>

      {/* TAB 1: TỔNG QUAN DOANH THU */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Doanh thu thực tế
              </span>
              <div className="text-xl font-extrabold text-emerald-700 mt-1">
                {Number(stats.real_revenue || 0).toLocaleString()} đ
              </div>
              <p className="text-[11px] text-gray-400 mt-1">
                Từ các đơn đã giao thành công
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Doanh thu tạm tính
              </span>
              <div className="text-xl font-extrabold text-blue-600 mt-1">
                {Number(stats.pending_revenue || 0).toLocaleString()} đ
              </div>
              <p className="text-[11px] text-gray-400 mt-1">
                Đơn đang chờ duyệt & đang giao
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Tổng số đơn hàng
              </span>
              <div className="text-xl font-extrabold text-gray-900 mt-1">
                {stats.total_orders || orders.length} đơn
              </div>
              <p className="text-[11px] text-emerald-600 font-semibold mt-1">
                Đã hoàn tất: {stats.delivered_orders || 0} đơn
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Cảnh báo tồn kho
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xl font-extrabold text-amber-600">
                  {stats.low_stock_count || 0}
                </span>
                <span className="text-xs text-gray-400">
                  sắp hết hàng (≤ 5)
                </span>
              </div>
              <p className="text-[11px] text-red-500 font-semibold mt-1">
                Hết hàng: {stats.out_of_stock_count || 0} món
              </p>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs">
            <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" /> Top nông sản
              được ưa chuộng & bán chạy nhất
            </h3>
            {!stats.top_products || stats.top_products.length === 0 ? (
              <p className="text-xs text-gray-400 py-6 text-center">
                Chưa có giao dịch hoàn tất để xếp hạng.
              </p>
            ) : (
              <div className="divide-y divide-gray-100">
                {stats.top_products.map((item, idx) => (
                  <div
                    key={item.product_id}
                    className="py-3 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${idx === 0 ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-gray-600"}`}
                      >
                        #{idx + 1}
                      </span>
                      <span className="font-bold text-gray-800">
                        {item.product_name}
                      </span>
                    </div>
                    <div className="flex items-center gap-6">
                      <span className="text-gray-500">
                        Đã bán:{" "}
                        <b className="text-emerald-700">{item.total_sold}</b>{" "}
                        lượt
                      </span>
                      <span className="font-extrabold text-gray-900">
                        {Number(item.total_sales).toLocaleString()} đ
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: QUẢN LÝ KHO HÀNG */}
      {activeTab === "inventory" && (
        <div className="space-y-6">
          {stats.low_stock_count > 0 && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 text-xs text-amber-800">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <b>Lưu ý nhập hàng:</b> Có <b>{stats.low_stock_count}</b> sản
                phẩm chỉ còn 5 đơn vị hoặc ít hơn. Khách chỉ có thể đặt tối đa
                bằng số lượng còn lại này!
              </div>
            </div>
          )}

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <h4 className="font-bold text-xs text-gray-900">
                Cập nhật tồn kho nhanh bằng File CSV/Excel
              </h4>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Tải file mẫu tồn kho hiện tại, chỉnh sửa số lượng và nạp lại vào
                hệ thống
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={downloadInventoryTemplate}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Download className="w-3.5 h-3.5" /> Xuất file kho (.CSV)
              </button>
              <label className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition shadow-xs">
                <Upload className="w-3.5 h-3.5" /> Nạp file kho mới
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => {
                    setInventoryFile(e.target.files[0]);
                    handleImportInventory(e);
                  }}
                />
              </label>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-gray-900">
                  Kiểm soát kho ({filteredInventory.length}/{products.length}{" "}
                  sản phẩm)
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
                  <button
                    type="button"
                    onClick={() => setInvFilterStatus("ALL")}
                    className={`px-2.5 py-1 rounded-lg font-medium transition ${invFilterStatus === "ALL" ? "bg-white text-emerald-700 shadow-2xs font-bold" : "text-gray-500"}`}
                  >
                    Tất cả
                  </button>
                  <button
                    type="button"
                    onClick={() => setInvFilterStatus("LOW")}
                    className={`px-2.5 py-1 rounded-lg font-medium transition ${invFilterStatus === "LOW" ? "bg-amber-500 text-white shadow-2xs font-bold" : "text-gray-500"}`}
                  >
                    Sắp hết (≤ 5)
                  </button>
                  <button
                    type="button"
                    onClick={() => setInvFilterStatus("OUT")}
                    className={`px-2.5 py-1 rounded-lg font-medium transition ${invFilterStatus === "OUT" ? "bg-red-500 text-white shadow-2xs font-bold" : "text-gray-500"}`}
                  >
                    Hết hàng (0)
                  </button>
                  <button
                    type="button"
                    onClick={() => setInvFilterStatus("AVAILABLE")}
                    className={`px-2.5 py-1 rounded-lg font-medium transition ${invFilterStatus === "AVAILABLE" ? "bg-emerald-600 text-white shadow-2xs font-bold" : "text-gray-500"}`}
                  >
                    Còn hàng
                  </button>
                </div>

                <div className="relative w-full sm:w-52">
                  <input
                    type="text"
                    placeholder="Tìm tên nông sản trong kho..."
                    value={invSearch}
                    onChange={(e) => setInvSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500"
                  />
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2" />
                </div>
              </div>
            </div>

            {filteredInventory.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-400">
                Không tìm thấy sản phẩm nào khớp với điều kiện lọc kho.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-gray-500 font-semibold border-b border-gray-100">
                  <tr>
                    <th className="p-4">Sản phẩm</th>
                    <th className="p-4">Danh mục</th>
                    <th className="p-4">Giá bán / Đơn vị</th>
                    <th className="p-4 text-center">Tồn kho hiện tại</th>
                    <th className="p-4">Tình trạng mở bán</th>
                    <th className="p-4 text-center">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredInventory.map((p) => {
                    const stock = p.stock_quantity ?? 0;
                    const displayUnit =
                      p.unit?.trim().toLowerCase().startsWith("kg") ||
                      !/\d/.test(p.unit)
                        ? `${stock} ${p.unit}`
                        : `${stock} phần (${p.unit})`;

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/50">
                        <td className="p-4 flex items-center gap-3">
                          <img
                            src={p.display_image || p.image_url}
                            alt={p.name}
                            className="w-10 h-10 rounded-lg object-cover bg-slate-100 border border-gray-100"
                          />
                          <span className="font-bold text-gray-900">
                            {p.name}
                          </span>
                        </td>
                        <td className="p-4 text-gray-500">{p.category}</td>
                        <td className="p-4 font-bold text-emerald-700">
                          {Number(p.price).toLocaleString()} đ{" "}
                          <span className="text-gray-400 font-normal">
                            /{p.unit}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <span
                            className={`px-2.5 py-1 rounded-full font-bold text-xs inline-block ${
                              stock === 0
                                ? "bg-red-100 text-red-700"
                                : stock <= 5
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {displayUnit}
                          </span>
                        </td>
                        <td className="p-4">
                          {stock === 0 ? (
                            <span className="text-red-500 font-semibold text-[11px] flex items-center gap-1">
                              ● Hết hàng (Đã tự động ngắt bán)
                            </span>
                          ) : p.is_active ? (
                            <span className="text-emerald-600 font-semibold text-[11px] flex items-center gap-1">
                              ● Đang mở bán
                            </span>
                          ) : (
                            <span className="text-gray-400 font-semibold text-[11px] flex items-center gap-1">
                              ○ Chủ vườn tạm dừng
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => {
                              setEditingProduct(p);
                              setEditImageFile(null);
                            }}
                            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-semibold text-xs transition"
                          >
                            Sửa số lượng
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: SẢN PHẨM */}
      {activeTab === "products" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs h-fit">
            <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-1.5">
              <PlusCircle className="w-4 h-4 text-emerald-600" /> Đăng bán nông
              sản mới
            </h3>
            <form onSubmit={handleCreateProduct} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                  Tên nông sản
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Dâu tây New Zealand"
                  value={newProduct.name}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, name: e.target.value })
                  }
                  className="w-full text-xs p-2.5 bg-slate-50 border border-gray-200 rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                    Danh mục
                  </label>
                  <select
                    value={newProduct.category}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, category: e.target.value })
                    }
                    className="w-full text-xs p-2.5 bg-slate-50 border border-gray-200 rounded-xl"
                  >
                    <option value="Rau ăn lá">Rau ăn lá</option>
                    <option value="Củ quả">Củ quả</option>
                    <option value="Trái cây">Trái cây</option>
                    <option value="Nấm thực phẩm">Nấm thực phẩm</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                    Đơn vị
                  </label>
                  <input
                    type="text"
                    value={newProduct.unit}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, unit: e.target.value })
                    }
                    placeholder="kg, hộp 500g..."
                    className="w-full text-xs p-2.5 bg-slate-50 border border-gray-200 rounded-xl"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                    Giá niêm yết (VNĐ)
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="80000"
                    value={newProduct.price}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, price: e.target.value })
                    }
                    className="w-full text-xs p-2.5 bg-slate-50 border border-gray-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                    Tồn kho ban đầu
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="50"
                    value={newProduct.stock_quantity}
                    onChange={(e) =>
                      setNewProduct({
                        ...newProduct,
                        stock_quantity: e.target.value,
                      })
                    }
                    className="w-full text-xs p-2.5 bg-slate-50 border border-gray-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                  Chọn ảnh từ máy tính
                </label>
                <div className="flex items-center gap-2">
                  <label className="flex-1 border border-dashed border-emerald-300 bg-emerald-50/50 hover:bg-emerald-50 rounded-xl p-3 text-center cursor-pointer transition flex items-center justify-center gap-2 text-xs text-emerald-800 font-medium">
                    <Upload className="w-4 h-4 text-emerald-600" />
                    <span>
                      {newProduct.imageFile
                        ? newProduct.imageFile.name
                        : "Tải file ảnh lên..."}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setNewProduct({ ...newProduct, imageFile: file });
                          setImagePreview(URL.createObjectURL(file));
                        }
                      }}
                    />
                  </label>
                  {imagePreview && (
                    <img
                      src={imagePreview}
                      alt="preview"
                      className="w-11 h-11 object-cover rounded-xl border border-emerald-300"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                  Mô tả phương pháp canh tác
                </label>
                <textarea
                  rows="2"
                  placeholder="Quy trình canh tác hữu cơ chuẩn VietGAP..."
                  value={newProduct.description}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      description: e.target.value,
                    })
                  }
                  className="w-full text-xs p-2.5 bg-slate-50 border border-gray-200 rounded-xl"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
              >
                Đăng sản phẩm lên sàn
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              <h3 className="text-sm font-bold text-gray-900">
                Danh mục sản phẩm hiện có ({filteredShopProducts.length}/
                {products.length})
              </h3>
              <div className="relative w-full sm:w-60">
                <input
                  type="text"
                  placeholder="Tìm sản phẩm của shop..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 shadow-2xs"
                />
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2" />
              </div>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              {[
                "Tất cả",
                "Rau ăn lá",
                "Củ quả",
                "Trái cây",
                "Nấm thực phẩm",
              ].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setProductFilterCat(cat)}
                  className={`px-3 py-1 rounded-lg font-medium transition shrink-0 ${productFilterCat === cat ? "bg-emerald-700 text-white shadow-xs" : "bg-slate-100 text-gray-600 hover:bg-slate-200"}`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {filteredShopProducts.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 text-center border border-gray-100 text-gray-400 text-xs">
                Không tìm thấy sản phẩm nào khớp với từ khóa hoặc danh mục đã
                chọn.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredShopProducts.map((p) => (
                  <div
                    key={p.id}
                    className={`bg-white rounded-2xl p-4 border shadow-xs flex flex-col justify-between transition ${!p.is_active ? "border-amber-200 bg-amber-50/20 opacity-80" : "border-gray-100"}`}
                  >
                    <div className="flex gap-3">
                      <img
                        src={
                          p.display_image ||
                          p.image_url ||
                          "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=300&q=80"
                        }
                        alt={p.name}
                        className="w-16 h-16 rounded-xl object-cover bg-slate-50 shrink-0 border border-gray-100"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src =
                            "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=300&q=80";
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-1">
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded truncate">
                            {p.category}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded shrink-0 ${p.stock_quantity === 0 ? "bg-red-100 text-red-700" : p.is_active ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}
                          >
                            {p.stock_quantity === 0
                              ? "Hết hàng"
                              : p.is_active
                                ? "Đang bán"
                                : "Tạm dừng"}
                          </span>
                        </div>
                        <h4 className="font-bold text-gray-900 text-xs mt-1 truncate">
                          {p.name}
                        </h4>
                        <p className="text-emerald-700 font-extrabold text-xs mt-1">
                          {Number(p.price).toLocaleString()} đ{" "}
                          <span className="font-normal text-gray-400">
                            /{p.unit}
                          </span>
                        </p>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          Kho: <b>{p.stock_quantity ?? 50}</b> {p.unit}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between gap-1 text-[11px]">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(p.id)}
                        className={`flex items-center gap-1 font-semibold px-2 py-1 rounded-lg transition ${p.is_active ? "text-amber-700 hover:bg-amber-50" : "text-emerald-700 hover:bg-emerald-50"}`}
                      >
                        {p.is_active ? (
                          <>
                            <PauseCircle className="w-3.5 h-3.5" /> Dừng bán
                          </>
                        ) : (
                          <>
                            <PlayCircle className="w-3.5 h-3.5" /> Mở bán
                          </>
                        )}
                      </button>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingProduct(p);
                            setEditImageFile(null);
                          }}
                          className="flex items-center gap-1 font-semibold text-blue-600 hover:bg-blue-50 px-2 py-1 rounded-lg transition"
                        >
                          <Edit className="w-3.5 h-3.5" /> Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(p.id, p.name)}
                          className="flex items-center gap-1 font-semibold text-red-600 hover:bg-red-50 px-2 py-1 rounded-lg transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Xóa
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL CHỈNH SỬA SẢN PHẨM */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-sm">
                Chỉnh sửa nông sản & Tồn kho
              </h3>
              <button
                onClick={() => setEditingProduct(null)}
                className="p-1 hover:bg-slate-100 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveEditProduct} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                  Tên nông sản
                </label>
                <input
                  type="text"
                  required
                  value={editingProduct.name}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      name: e.target.value,
                    })
                  }
                  className="w-full text-xs p-2.5 bg-slate-50 border border-gray-200 rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                    Danh mục
                  </label>
                  <select
                    value={editingProduct.category}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        category: e.target.value,
                      })
                    }
                    className="w-full text-xs p-2.5 bg-slate-50 border border-gray-200 rounded-xl"
                  >
                    <option value="Rau ăn lá">Rau ăn lá</option>
                    <option value="Củ quả">Củ quả</option>
                    <option value="Trái cây">Trái cây</option>
                    <option value="Nấm thực phẩm">Nấm thực phẩm</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                    Đơn vị
                  </label>
                  <input
                    type="text"
                    value={editingProduct.unit}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        unit: e.target.value,
                      })
                    }
                    className="w-full text-xs p-2.5 bg-slate-50 border border-gray-200 rounded-xl"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                    Giá bán (VNĐ)
                  </label>
                  <input
                    type="number"
                    required
                    value={editingProduct.price}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        price: e.target.value,
                      })
                    }
                    className="w-full text-xs p-2.5 bg-slate-50 border border-gray-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                    Tồn kho hiện tại
                  </label>
                  <input
                    type="number"
                    required
                    value={editingProduct.stock_quantity ?? 50}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        stock_quantity: e.target.value,
                      })
                    }
                    className="w-full text-xs p-2.5 bg-slate-50 border border-gray-200 rounded-xl"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                  Đổi ảnh mới (nếu muốn)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setEditImageFile(e.target.files[0])}
                  className="w-full text-xs p-2 bg-slate-50 border border-gray-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                  Mô tả
                </label>
                <textarea
                  rows="2"
                  value={editingProduct.description || ""}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      description: e.target.value,
                    })
                  }
                  className="w-full text-xs p-2.5 bg-slate-50 border border-gray-200 rounded-xl"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-semibold text-gray-700"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-xs font-semibold text-white"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 4: LÔ XUẤT XỨ & MÃ QR */}
      {activeTab === "batches" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs h-fit">
            <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-1.5">
              <Boxes className="w-4 h-4 text-emerald-600" /> Nhập lô thu hoạch
              mới
            </h3>
            <p className="text-[11px] text-gray-400 mb-4">
              Sản lượng nhập sẽ được tự động cộng dồn vào kho của nông sản và
              kích hoạt mở bán lại.
            </p>
            <form onSubmit={handleCreateBatch} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                  Chọn nông sản
                </label>
                <select
                  value={newBatch.product_id}
                  onChange={(e) =>
                    setNewBatch({ ...newBatch, product_id: e.target.value })
                  }
                  className="w-full text-xs p-2.5 bg-slate-50 border border-gray-200 rounded-xl"
                  required
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Kho hiện tại: {p.stock_quantity ?? 50})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                  Sản lượng lô thu hoạch (cộng vào kho)
                </label>
                <input
                  type="number"
                  required
                  placeholder="VD: 300"
                  value={newBatch.quantity}
                  onChange={(e) =>
                    setNewBatch({ ...newBatch, quantity: e.target.value })
                  }
                  className="w-full text-xs p-2.5 bg-slate-50 border border-gray-200 rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                    Ngày xuống giống
                  </label>
                  <input
                    type="date"
                    value={newBatch.planting_date}
                    onChange={(e) =>
                      setNewBatch({
                        ...newBatch,
                        planting_date: e.target.value,
                      })
                    }
                    className="w-full text-xs p-2 bg-slate-50 border border-gray-200 rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                    Ngày thu hoạch
                  </label>
                  <input
                    type="date"
                    value={newBatch.harvest_date}
                    onChange={(e) =>
                      setNewBatch({ ...newBatch, harvest_date: e.target.value })
                    }
                    className="w-full text-xs p-2 bg-slate-50 border border-gray-200 rounded-xl"
                    required
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100">
                <span className="text-[11px] font-bold text-gray-700 block mb-2">
                  Chỉ số vi khí hậu ban đầu:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-gray-500">
                      Nhiệt độ (°C)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={newBatch.init_temp}
                      onChange={(e) =>
                        setNewBatch({ ...newBatch, init_temp: e.target.value })
                      }
                      className="w-full text-xs p-2 bg-slate-50 border border-gray-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500">
                      Độ ẩm KK (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={newBatch.init_hum}
                      onChange={(e) =>
                        setNewBatch({ ...newBatch, init_hum: e.target.value })
                      }
                      className="w-full text-xs p-2 bg-slate-50 border border-gray-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500">
                      Độ ẩm đất (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={newBatch.init_soil_m}
                      onChange={(e) =>
                        setNewBatch({
                          ...newBatch,
                          init_soil_m: e.target.value,
                        })
                      }
                      className="w-full text-xs p-2 bg-slate-50 border border-gray-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500">
                      pH đất (5.5 - 7.0)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={newBatch.init_ph}
                      onChange={(e) =>
                        setNewBatch({ ...newBatch, init_ph: e.target.value })
                      }
                      className="w-full text-xs p-2 bg-slate-50 border border-gray-200 rounded-xl"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs mt-2"
              >
                Khởi tạo lô & Cấp mã QR
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              <h3 className="text-sm font-bold text-gray-900">
                Danh sách Lô xuất xứ VietGAP ({filteredBatches.length}/
                {batches.length})
              </h3>
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Tìm mã lô (BATCH/LOT) hoặc tên nông sản..."
                  value={batchSearch}
                  onChange={(e) => setBatchSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 shadow-2xs"
                />
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2" />
              </div>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <span className="text-gray-400 font-medium text-[11px] mr-1">
                Hạng Eco:
              </span>
              {["Tất cả", "A", "B", "C"].map((grade) => (
                <button
                  key={grade}
                  type="button"
                  onClick={() => setBatchFilterGrade(grade)}
                  className={`px-3 py-1 rounded-lg font-medium transition shrink-0 ${batchFilterGrade === grade ? "bg-emerald-700 text-white shadow-xs" : "bg-slate-100 text-gray-600 hover:bg-slate-200"}`}
                >
                  {grade === "Tất cả" ? "Tất cả hạng" : `Hạng ${grade}`}
                </button>
              ))}
            </div>

            {filteredBatches.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 text-center border border-gray-100 text-gray-400 text-xs">
                Không tìm thấy lô hàng nào khớp với tìm kiếm.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredBatches.map((b) => (
                  <div
                    key={b.batch_code}
                    className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs flex flex-col sm:flex-row justify-between sm:items-center gap-4"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-gray-900 text-sm">
                          {b.product?.name}
                        </h4>
                        <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                          {b.batch_code}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Sản lượng:{" "}
                        <b>
                          {b.quantity} {b.product?.unit || "kg"}
                        </b>{" "}
                        • Gieo: <b>{b.planting_date}</b> • Thu:{" "}
                        <b>{b.harvest_date}</b>
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          Điểm Eco: {b.eco_score}/100 (Hạng {b.eco_grade})
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {b.env_records?.length || 0} bản ghi quan trắc
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        to={`/trace/${b.batch_code}`}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
                      >
                        <QrCode className="w-3.5 h-3.5" /> Xuất xứ QR 
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          const firstEnv =
                            b.env_records && b.env_records.length > 0
                              ? b.env_records[0]
                              : {};
                          setEditingBatch({
                            ...b,
                            init_temp: firstEnv.temperature ?? 24.5,
                            init_hum: firstEnv.humidity ?? 72.0,
                            init_soil_m: firstEnv.soil_moisture ?? 68.0,
                            init_ph: firstEnv.soil_ph ?? 6.5,
                          });
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition"
                        title="Chỉnh sửa lô hàng & vi khí hậu"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteBatch(b.batch_code)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition"
                        title="Xóa lô hàng"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL SỬA LÔ HÀNG */}
      {editingBatch && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-sm">
                Chỉnh sửa lô canh tác ({editingBatch.batch_code})
              </h3>
              <button
                onClick={() => setEditingBatch(null)}
                className="p-1 hover:bg-slate-100 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditBatch} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                  Nông sản
                </label>
                <input
                  type="text"
                  disabled
                  value={editingBatch.product?.name || ""}
                  className="w-full text-xs p-2.5 bg-slate-100 border border-gray-200 rounded-xl text-gray-500 font-medium cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                  Sản lượng lô
                </label>
                <input
                  type="number"
                  required
                  value={editingBatch.quantity}
                  onChange={(e) =>
                    setEditingBatch({
                      ...editingBatch,
                      quantity: e.target.value,
                    })
                  }
                  className="w-full text-xs p-2.5 bg-slate-50 border border-gray-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                    Ngày xuống giống
                  </label>
                  <input
                    type="date"
                    required
                    value={editingBatch.planting_date}
                    onChange={(e) =>
                      setEditingBatch({
                        ...editingBatch,
                        planting_date: e.target.value,
                      })
                    }
                    className="w-full text-xs p-2 bg-slate-50 border border-gray-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                    Ngày thu hoạch
                  </label>
                  <input
                    type="date"
                    required
                    value={editingBatch.harvest_date}
                    onChange={(e) =>
                      setEditingBatch({
                        ...editingBatch,
                        harvest_date: e.target.value,
                      })
                    }
                    className="w-full text-xs p-2 bg-slate-50 border border-gray-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100">
                <span className="text-[11px] font-bold text-gray-700 block mb-2">
                  Chỉ số vi khí hậu & thổ nhưỡng ban đầu:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-gray-500">
                      Nhiệt độ (°C)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={editingBatch.init_temp ?? ""}
                      onChange={(e) =>
                        setEditingBatch({
                          ...editingBatch,
                          init_temp: e.target.value,
                        })
                      }
                      className="w-full text-xs p-2 bg-slate-50 border border-gray-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500">
                      Độ ẩm KK (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={editingBatch.init_hum ?? ""}
                      onChange={(e) =>
                        setEditingBatch({
                          ...editingBatch,
                          init_hum: e.target.value,
                        })
                      }
                      className="w-full text-xs p-2 bg-slate-50 border border-gray-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500">
                      Độ ẩm đất (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={editingBatch.init_soil_m ?? ""}
                      onChange={(e) =>
                        setEditingBatch({
                          ...editingBatch,
                          init_soil_m: e.target.value,
                        })
                      }
                      className="w-full text-xs p-2 bg-slate-50 border border-gray-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500">
                      pH đất (5.5 - 7.0)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={editingBatch.init_ph ?? ""}
                      onChange={(e) =>
                        setEditingBatch({
                          ...editingBatch,
                          init_ph: e.target.value,
                        })
                      }
                      className="w-full text-xs p-2 bg-slate-50 border border-gray-200 rounded-xl"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingBatch(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-semibold text-gray-700"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-xs font-semibold text-white"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 5: BÀI VIẾT & NHẬT KÝ CANH TÁC */}
      {activeTab === "posts" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-gray-800">
                Quản lý bài viết & Nhật ký canh tác
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Chia sẻ câu chuyện nông hộ, công nghệ VietGAP và kết nối khách
                hàng
              </p>
            </div>
            <button
              onClick={() => setShowCreatePostModal(true)}
              className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition cursor-pointer shadow-xs"
            >
              + Viết bài mới
            </button>
          </div>

          {/* Danh sách bài viết */}
          {posts.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 p-8 space-y-2">
              <p className="text-xs text-gray-400">
                Trang trại của bạn chưa đăng bài viết nào.
              </p>
              <button
                onClick={() => setShowCreatePostModal(true)}
                className="text-xs font-bold text-emerald-600 hover:underline cursor-pointer"
              >
                Viết bài chia sẻ đầu tiên ngay →
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs flex gap-4 items-center justify-between"
                >
                  <div className="flex gap-3 items-center min-w-0">
                    <img
                      src={post.display_image}
                      alt={post.title}
                      className="w-16 h-16 rounded-xl object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
                        {post.category_display || post.category}
                      </span>
                      <h4 className="text-xs font-bold text-gray-900 truncate mt-1">
                        {post.title}
                      </h4>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {new Date(post.created_at).toLocaleDateString("vi-VN")}{" "}
                        • {post.views_count} lượt xem
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      to={`/blog/${post.slug || post.id}`}
                      className="px-2.5 py-1 text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg font-semibold transition"
                    >
                      Xem
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDeletePost(post.slug || post.id)}
                      className="px-2.5 py-1 text-xs text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg font-semibold transition cursor-pointer"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* MODAL VIẾT BÀI MỚI CHUYÊN NGHIỆP */}
          {showCreatePostModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-2xs p-4">
              <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto font-sans">
                <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                  <div>
                    <h3 className="text-base font-bold text-gray-900">
                      Soạn thảo bài viết & Nhật ký nông hộ
                    </h3>
                    <p className="text-xs text-gray-400">
                      Hỗ trợ viết bài dài không giới hạn ký tự kèm thanh công cụ
                      định dạng
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowCreatePostModal(false);
                      setPostCoverPreview(null);
                    }}
                    className="p-1 hover:bg-slate-100 rounded-full text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCreatePost} className="space-y-4">
                  {/* Tiêu đề */}
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">
                      Tiêu đề bài viết *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="VD: Quy trình thu hoạch cà chua Cherry và kiểm soát vi khí hậu vụ Thu 2026..."
                      value={newPost.title}
                      onChange={(e) =>
                        setNewPost({ ...newPost, title: e.target.value })
                      }
                      className="w-full text-xs p-3 bg-slate-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 font-medium"
                    />
                  </div>

                  {/* Chuyên mục & Chọn ảnh từ Folder */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
                    <div>
                      <label className="text-xs font-bold text-gray-700 block mb-1">
                        Chủ đề bài viết
                      </label>
                      <select
                        value={newPost.category}
                        onChange={(e) =>
                          setNewPost({ ...newPost, category: e.target.value })
                        }
                        className="w-full text-xs p-3 bg-slate-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 font-medium"
                      >
                        <option value="KNOWLEDGE">Kiến thức nông sản</option>
                        <option value="FARM_STORY">Nhật ký nông hộ</option>
                        <option value="VIETGAP_TECH">Quy trình VietGAP</option>
                        <option value="EAT_CLEAN">Eat-Clean & Món ngon</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-700 block mb-1">
                        Ảnh bìa bài viết (chọn từ máy tính)
                      </label>
                      <div className="flex items-center gap-2">
                        <label className="flex-1 border border-dashed border-emerald-300 bg-emerald-50/50 hover:bg-emerald-50 rounded-xl p-2.5 text-center cursor-pointer transition flex items-center justify-center gap-2 text-xs text-emerald-800 font-medium truncate">
                          <Upload className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="truncate">
                            {newPost.coverFile
                              ? newPost.coverFile.name
                              : "Chọn file ảnh từ folder..."}
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                setNewPost({ ...newPost, coverFile: file });
                                setPostCoverPreview(URL.createObjectURL(file));
                              }
                            }}
                          />
                        </label>
                        {postCoverPreview && (
                          <img
                            src={postCoverPreview}
                            alt="preview"
                            className="w-11 h-11 object-cover rounded-xl border border-emerald-300 shrink-0"
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Tóm tắt ngắn */}
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">
                      Tóm tắt ngắn (1-2 câu hiển thị ở card trang chủ) *
                    </label>
                    <textarea
                      rows="2"
                      required
                      placeholder="Mô tả súc tích nội dung chính để kích thích người đọc..."
                      value={newPost.excerpt}
                      onChange={(e) =>
                        setNewPost({ ...newPost, excerpt: e.target.value })
                      }
                      className="w-full text-xs p-3 bg-slate-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* KHU VỰC SOẠN THẢO NỘI DUNG CHI TIẾT (RICH EDITOR) */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-bold text-gray-700">
                        Nội dung chi tiết bài viết (Không giới hạn độ dài) *
                      </label>
                      <span className="text-[11px] text-gray-400">
                        {newPost.content.length} ký tự (~
                        {newPost.content.trim()
                          ? newPost.content.trim().split(/\s+/).length
                          : 0}{" "}
                        từ)
                      </span>
                    </div>

                    {/* Thanh công cụ định dạng (Formatting Toolbar) */}
                    <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-100 border border-gray-200 rounded-t-xl text-xs">
                      <button
                        type="button"
                        onClick={() => insertFormatting("**", "**")}
                        className="px-2.5 py-1 bg-white hover:bg-slate-200 rounded-lg font-bold border border-gray-200 shadow-2xs"
                        title="In đậm"
                      >
                        B
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormatting("*", "*")}
                        className="px-2.5 py-1 bg-white hover:bg-slate-200 rounded-lg italic font-serif border border-gray-200 shadow-2xs"
                        title="In nghiêng"
                      >
                        I
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormatting("\n## ", "\n")}
                        className="px-2.5 py-1 bg-white hover:bg-slate-200 rounded-lg font-bold text-[11px] border border-gray-200 shadow-2xs"
                        title="Tiêu đề mục lớn (H2)"
                      >
                        H2
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormatting("\n### ", "\n")}
                        className="px-2.5 py-1 bg-white hover:bg-slate-200 rounded-lg font-bold text-[11px] border border-gray-200 shadow-2xs"
                        title="Tiêu đề mục nhỏ (H3)"
                      >
                        H3
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormatting("\n- ")}
                        className="px-2.5 py-1 bg-white hover:bg-slate-200 rounded-lg text-gray-700 border border-gray-200 shadow-2xs"
                        title="Danh sách gạch đầu dòng"
                      >
                        • Danh sách
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormatting("\n> ", "\n")}
                        className="px-2.5 py-1 bg-white hover:bg-slate-200 rounded-lg italic text-gray-700 border border-gray-200 shadow-2xs"
                        title="Khối trích dẫn"
                      >
                        “ Trích dẫn
                      </button>
                    </div>

                    <textarea
                      id="post-content-textarea"
                      rows="9"
                      required
                      placeholder="Nhập toàn bộ nội dung câu chuyện, quy trình chăm sóc vụ mùa, hướng dẫn bảo quản... Bạn có thể bôi đen chữ rồi bấm các nút định dạng ở trên."
                      value={newPost.content}
                      onChange={(e) =>
                        setNewPost({ ...newPost, content: e.target.value })
                      }
                      className="w-full text-xs p-3 bg-slate-50 border-x border-b border-gray-200 rounded-b-xl outline-none focus:border-emerald-500 font-sans leading-relaxed"
                    />
                  </div>

                  {/* Nút thao tác */}
                  <div className="flex gap-2 pt-2 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreatePostModal(false);
                        setPostCoverPreview(null);
                      }}
                      className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-gray-700 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={submittingPost}
                      className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50 cursor-pointer shadow-xs"
                    >
                      {submittingPost
                        ? "Đang tải ảnh và đăng bài..."
                        : "Xuất bản bài viết ngay"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 6: IMPORT EXCEL VI KHÍ HẬU */}
      {activeTab === "excel" && (
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-xs max-w-3xl space-y-6">
          <div className="flex justify-between items-start pb-4 border-b border-gray-100">
            <div>
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" /> Nạp dữ
                liệu vi khí hậu hàng loạt từ Excel
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Tự động nhập dữ liệu từ máy đo/cảm biến IoT, tự động tính lại
                điểm Eco-Score chuẩn VietGAP
              </p>
            </div>
            <button
              type="button"
              onClick={downloadSampleExcel}
              className="text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-2 rounded-xl flex items-center gap-1.5 transition"
            >
              <Download className="w-3.5 h-3.5" /> Tải file mẫu (.CSV)
            </button>
          </div>

          <form onSubmit={handleImportExcel} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                1. Chọn Lô hàng cần nạp dữ liệu
              </label>
              <select
                value={importingBatch}
                onChange={(e) => setImportingBatch(e.target.value)}
                className="w-full text-xs p-3 bg-slate-50 border border-gray-200 rounded-xl"
                required
              >
                {batches.map((b) => (
                  <option key={b.batch_code} value={b.batch_code}>
                    {b.product?.name} ({b.batch_code}) - Eco hiện tại:{" "}
                    {b.eco_score} ({b.eco_grade})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                2. Chọn file Excel (.xlsx) hoặc file .CSV
              </label>
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={(e) => setExcelFile(e.target.files[0])}
                className="w-full text-xs p-3 bg-slate-50 border border-gray-200 rounded-xl"
                required
              />
              <p className="text-[11px] text-gray-400 mt-1">
                File hỗ trợ các cột: <code>temperature</code> (nhiệt độ),{" "}
                <code>humidity</code> (độ ẩm KK), <code>soil_moisture</code> (độ
                ẩm đất), <code>soil_ph</code> (pH), <code>date</code>.
              </p>
            </div>

            {excelMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium">
                ✓ {excelMsg}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center justify-center gap-2"
            >
              <Upload className="w-4 h-4" /> Nạp file và Tự động tính toán
              Eco-Score
            </button>
          </form>
        </div>
      )}

      {/* TAB 7: ĐƠN HÀNG */}
      {activeTab === "orders" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-gray-100 font-bold text-xs text-gray-900">
            Quản lý đơn hàng (Đơn hàng xử lý theo quy trình 1 chiều; chỉ khách hàng mới có quyền hủy đơn)
          </div>
          {orders.length === 0 ? (
            <div className="text-center py-16 text-gray-400 text-xs">
              Hiện tại chưa có đơn hàng nào.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-gray-500 font-semibold border-b border-gray-100">
                  <tr>
                    {/* ĐÃ BỎ CỘT MÃ ĐƠN Ở ĐÂY */}
                    <th className="p-4">Khách hàng</th>
                    <th className="p-4">Địa chỉ giao</th>
                    <th className="p-4">Sản phẩm</th>
                    <th className="p-4">Tổng tiền COD</th>
                    <th className="p-4">Trạng thái</th>
                    <th className="p-4 text-center">Xử lý</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50/50">
                      {/* ĐÃ BỎ CỘT #{o.id} Ở ĐÂY */}
                      <td className="p-4">
                        <p className="font-semibold text-gray-800">
                          {o.customer_name}
                        </p>
                        <p className="text-gray-400 font-mono text-[11px]">
                          {o.customer_phone}
                        </p>
                      </td>
                      <td className="p-4 text-gray-600 max-w-xs truncate">
                        {o.shipping_address}
                      </td>
                      <td className="p-4 text-gray-600">
                        {o.items.map((it) => (
                          <div key={it.id} className="text-[11px]">
                            • {it.product_name} (x{it.quantity})
                          </div>
                        ))}
                      </td>
                      <td className="p-4 font-bold text-emerald-700">
                        {Number(o.total_amount).toLocaleString()} đ
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            o.status === "PENDING"
                              ? "bg-amber-100 text-amber-800"
                              : o.status === "CONFIRMED"
                              ? "bg-blue-100 text-blue-800"
                              : o.status === "SHIPPING"
                              ? "bg-indigo-100 text-indigo-800"
                              : o.status === "DELIVERED"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {o.status === "PENDING"
                            ? "Chờ xác nhận"
                            : o.status === "CONFIRMED"
                            ? "Đã xác nhận"
                            : o.status === "SHIPPING"
                            ? "Đang giao"
                            : o.status === "DELIVERED"
                            ? "Đã giao"
                            : "Đã hủy"}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        {/* 1. Trường hợp đơn đã bị khách hủy */}
                        {o.status === "CANCELLED" ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200">
                            Khách đã hủy (Đã khóa)
                          </span>
                        ) : /* 2. Trường hợp đơn đã giao thành công */
                        o.status === "DELIVERED" ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200">
                            Đã hoàn tất (Đã khóa)
                          </span>
                        ) : (
                          /* 3. Trường hợp đơn đang xử lý theo luồng 1 chiều */
                          <select
                            value={o.status}
                            onChange={(e) =>
                              handleUpdateOrderStatus(o.id, e.target.value)
                            }
                            className="text-xs p-1.5 border border-gray-200 rounded-lg bg-slate-50 font-medium text-gray-700 outline-none focus:border-emerald-500 cursor-pointer shadow-2xs"
                          >
                            {/* Khi 'Chờ xác nhận': chỉ có thể chuyển sang 'Đã xác nhận' */}
                            {o.status === "PENDING" && (
                              <>
                                <option value="PENDING" disabled>
                                  Chờ xác nhận
                                </option>
                                <option value="CONFIRMED">
                                  Xác nhận đơn hàng
                                </option>
                              </>
                            )}

                            {/* Khi 'Đã xác nhận': chỉ có thể chuyển sang 'Đang giao' */}
                            {o.status === "CONFIRMED" && (
                              <>
                                <option value="CONFIRMED" disabled>
                                  Đã xác nhận
                                </option>
                                <option value="SHIPPING">
                                  Chuyển sang Đang giao
                                </option>
                              </>
                            )}

                            {/* Khi 'Đang giao': chỉ có thể chuyển sang 'Đã giao thành công' */}
                            {o.status === "SHIPPING" && (
                              <>
                                <option value="SHIPPING" disabled>
                                  Đang giao hàng
                                </option>
                                <option value="DELIVERED">
                                  Xác nhận Đã giao thành công
                                </option>
                              </>
                            )}
                          </select>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 8: HỒ SƠ SHOP & GPS */}
      {activeTab === "profile" && (
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-xs max-w-3xl">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-100">
            <Settings className="w-5 h-5 text-emerald-600" />
            <div>
              <h2 className="text-base font-bold text-gray-900">
                Thiết lập hồ sơ nông trại & Tọa độ bản đồ
              </h2>
              <p className="text-xs text-gray-500">
                Thông tin này sẽ hiển thị công khai trên Bản đồ vùng trồng và
                Tem truy xuất nguồn gốc
              </p>
            </div>
          </div>

          <form onSubmit={handleUpdateFarm} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Tên trang trại
              </label>
              <input
                type="text"
                required
                value={farmForm.name}
                onChange={(e) =>
                  setFarmForm({ ...farmForm, name: e.target.value })
                }
                className="w-full text-xs p-2.5 bg-slate-50 border border-gray-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Mã chứng nhận VietGAP
              </label>
              <input
                type="text"
                value={farmForm.vietgap_cert_id}
                onChange={(e) =>
                  setFarmForm({ ...farmForm, vietgap_cert_id: e.target.value })
                }
                className="w-full text-xs p-2.5 bg-slate-50 border border-gray-200 rounded-xl font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Địa chỉ thực tế của trang trại
              </label>
              <input
                type="text"
                required
                value={farmForm.address}
                onChange={(e) =>
                  setFarmForm({ ...farmForm, address: e.target.value })
                }
                className="w-full text-xs p-2.5 bg-slate-50 border border-gray-200 rounded-xl"
              />
            </div>

            <div className="p-4 bg-emerald-50/60 border border-emerald-100 rounded-2xl space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-600" /> Tọa độ GPS &
                  Vị trí vùng trồng
                </span>
                <button
                  type="button"
                  onClick={handleGetCurrentLocation}
                  className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 bg-white border border-emerald-300 px-2.5 py-1 rounded-lg flex items-center gap-1 transition"
                >
                  <Navigation className="w-3.5 h-3.5" /> Lấy vị trí GPS hiện tại
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-gray-600">
                    Vĩ độ (Latitude)
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={farmForm.latitude}
                    onChange={(e) =>
                      setFarmForm({
                        ...farmForm,
                        latitude: Number(e.target.value),
                      })
                    }
                    className="w-full text-xs p-2 bg-white border border-gray-200 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-600">
                    Kinh độ (Longitude)
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={farmForm.longitude}
                    onChange={(e) =>
                      setFarmForm({
                        ...farmForm,
                        longitude: Number(e.target.value),
                      })
                    }
                    className="w-full text-xs p-2 bg-white border border-gray-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              <LocationPickerMap
                lat={farmForm.latitude}
                lng={farmForm.longitude}
                onChange={(newLat, newLng) => {
                  setFarmForm((prev) => ({
                    ...prev,
                    latitude: Number(newLat.toFixed(6)),
                    longitude: Number(newLng.toFixed(6)),
                  }));
                }}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Mô tả phương thức canh tác
              </label>
              <textarea
                rows="3"
                value={farmForm.description}
                onChange={(e) =>
                  setFarmForm({ ...farmForm, description: e.target.value })
                }
                className="w-full text-xs p-2.5 bg-slate-50 border border-gray-200 rounded-xl"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
            >
              Lưu thay đổi hồ sơ trang trại
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

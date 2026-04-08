import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useListProducts, getListProductsQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ShopLogo } from "@/components/shop-logo";
import { WelcomeModal } from "@/components/welcome-modal";
import { HistoryIcon, WalletIcon, LayoutGrid, ShieldCheck, LogOut, Plus } from "lucide-react";

const CATEGORIES = [
  { name: "Aimlock", icon: "🎯", desc: "Tăng độ chính xác" },
  { name: "File data", icon: "📦", desc: "Tối ưu hóa game" },
  { name: "Panel", icon: "🛠️", desc: "Quản lý tài khoản" },
  { name: "Menu", icon: "⚙️", desc: "Tùy chỉnh game" },
];

const VND = (amount: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

export default function HomePage() {
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const { data: products, isLoading } = useListProducts({}, {
    query: { queryKey: getListProductsQueryKey() },
  });

  const recentProducts = products?.slice(0, 4) ?? [];
  const isAdmin = user?.role === "admin" || user?.role === "superadmin";

  return (
    <div className="min-h-screen pb-10">
      {/* Welcome modal shows after login */}
      <WelcomeModal />

      {/* Navbar */}
      <nav className="glass sticky top-0 z-40 border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center gap-3">
          <ShopLogo size="sm" />

          <div className="flex-1" />

          {/* Nav links */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setLocation("/topup")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Nạp tiền
            </button>
            <button
              onClick={() => setLocation("/history")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
            >
              <HistoryIcon className="w-3.5 h-3.5" />
              Lịch sử
            </button>
            {isAdmin && (
              <button
                onClick={() => setLocation("/admin")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 transition-all"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Quản trị
              </button>
            )}
            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              Thoát
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 mt-5 space-y-7">
        {/* Balance card */}
        <div className="glass rounded-2xl p-5 border border-primary/20 shadow-xl shadow-primary/10 flex items-center justify-between gap-4">
          <div>
            <p className="text-muted-foreground text-xs">Xin chào, <span className="text-foreground font-semibold">{user?.username}</span></p>
            <p className="text-3xl font-black text-primary mt-1">{VND(user?.balance ?? 0)}</p>
            <p className="text-xs text-muted-foreground mt-1">Mã KH: <span className="font-mono text-foreground">{user?.customerId}</span></p>
          </div>
          <div className="flex flex-col gap-2">
            <Button size="sm" onClick={() => setLocation("/topup")} className="shadow-lg shadow-primary/30 text-xs">
              <WalletIcon className="w-3.5 h-3.5 mr-1.5" />
              Nạp tiền
            </Button>
            <Button size="sm" variant="outline" onClick={() => setLocation("/history")} className="border-white/20 text-xs">
              <HistoryIcon className="w-3.5 h-3.5 mr-1.5" />
              Lịch sử
            </Button>
          </div>
        </div>

        {/* Categories */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <LayoutGrid className="w-4 h-4 text-primary" />
            <h2 className="text-base font-bold text-foreground">Danh mục sản phẩm</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.name}
                onClick={() => setLocation(`/category/${encodeURIComponent(cat.name)}`)}
                className="glass rounded-xl p-4 border border-white/10 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 transition-all text-left group"
              >
                <div className="text-3xl mb-2">{cat.icon}</div>
                <p className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">{cat.name}</p>
                <p className="text-muted-foreground text-xs mt-0.5">{cat.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Featured products */}
        <div>
          <h2 className="text-base font-bold text-foreground mb-4">🔥 Sản phẩm nổi bật</h2>
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {recentProducts.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setLocation(`/product/${p.id}`)}
                  className="glass rounded-xl p-4 border border-white/10 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 transition-all text-left group"
                >
                  <div className="w-full h-20 rounded-lg bg-secondary/50 flex items-center justify-center mb-3 overflow-hidden">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl">📦</span>
                    )}
                  </div>
                  <p className="font-semibold text-foreground text-xs line-clamp-1 group-hover:text-primary transition-colors">{p.name}</p>
                  <p className="text-primary font-black text-sm mt-1">{VND(p.price)}</p>
                  <span className="text-xs bg-secondary/50 text-muted-foreground px-2 py-0.5 rounded-full mt-1 inline-block">{p.category}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

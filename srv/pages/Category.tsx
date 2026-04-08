import { useLocation, useParams } from "wouter";
import { useListProducts, getListProductsQueryKey } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const VND = (amount: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

export default function CategoryPage() {
  const { name } = useParams<{ name: string }>();
  const [, setLocation] = useLocation();
  const category = decodeURIComponent(name ?? "");

  const { data: products, isLoading } = useListProducts(
    { category },
    { query: { queryKey: getListProductsQueryKey({ category }) } }
  );

  return (
    <div className="min-h-screen pb-10">
      <nav className="glass sticky top-0 z-40 px-4 py-3 flex items-center gap-3 border-b border-white/10">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/home")}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <span className="font-black text-foreground">{category}</span>
      </nav>

      <div className="max-w-5xl mx-auto px-4 mt-6">
        <h2 className="text-xl font-bold text-foreground mb-6">
          Danh mục: <span className="text-primary">{category}</span>
        </h2>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-52 rounded-2xl" />)}
          </div>
        ) : products?.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-6xl mb-4">📦</p>
            <p className="text-muted-foreground">Chưa có sản phẩm trong danh mục này</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {products?.map((p) => (
              <button
                key={p.id}
                onClick={() => setLocation(`/product/${p.id}`)}
                className="glass rounded-2xl p-5 border border-white/10 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 transition-all text-left group"
              >
                <div className="w-full h-32 rounded-xl bg-secondary/50 flex items-center justify-center mb-4">
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <span className="text-4xl">📦</span>
                  )}
                </div>
                <p className="font-bold text-foreground group-hover:text-primary transition-colors">{p.name}</p>
                <p className="text-muted-foreground text-xs mt-1 line-clamp-2">{p.description}</p>
                <p className="text-primary font-black text-lg mt-2">{VND(p.price)}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

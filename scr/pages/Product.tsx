import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { useGetProduct, useCreatePurchase, getGetProductQueryKey, getListPurchasesQueryKey, getGetMeQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

const VND = (amount: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showConfirm, setShowConfirm] = useState(false);

  const productId = parseInt(id ?? "0", 10);
  const { data: product, isLoading } = useGetProduct(productId, {
    query: { queryKey: getGetProductQueryKey(productId), enabled: productId > 0 },
  });

  const purchaseMutation = useCreatePurchase({
    mutation: {
      onSuccess: () => {
        toast({ title: "Mua hàng thành công!", description: `Bạn đã mua ${product?.name}` });
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListPurchasesQueryKey() });
        setShowConfirm(false);
        setLocation("/history");
      },
      onError: (err: any) => {
        toast({ title: "Lỗi", description: err?.data?.error ?? "Mua hàng thất bại", variant: "destructive" });
        setShowConfirm(false);
      },
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen p-4">
        <Skeleton className="h-10 w-32 mb-6" />
        <Skeleton className="h-64 w-full rounded-2xl mb-4" />
        <Skeleton className="h-8 w-3/4 mb-2" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Sản phẩm không tồn tại</p>
      </div>
    );
  }

  const canAfford = (user?.balance ?? 0) >= product.price;
  const afterBalance = (user?.balance ?? 0) - product.price;

  return (
    <div className="min-h-screen pb-10">
      <nav className="glass sticky top-0 z-40 px-4 py-3 flex items-center gap-3 border-b border-white/10">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation(-1 as any)}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <span className="font-black text-foreground">Chi tiết sản phẩm</span>
      </nav>

      <div className="max-w-2xl mx-auto px-4 mt-6 space-y-6">
        <div className="glass rounded-2xl overflow-hidden border border-white/10">
          <div className="w-full h-56 bg-secondary/50 flex items-center justify-center">
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-7xl">📦</span>
            )}
          </div>
        </div>

        <div className="glass rounded-2xl p-6 border border-white/10 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="text-xs bg-primary/20 text-primary px-3 py-1 rounded-full font-medium">{product.category}</span>
              <h1 className="text-2xl font-black text-foreground mt-2">{product.name}</h1>
            </div>
            <p className="text-2xl font-black text-primary whitespace-nowrap">{VND(product.price)}</p>
          </div>

          <p className="text-muted-foreground leading-relaxed">{product.description}</p>

          <div className="bg-secondary/40 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Số dư hiện tại</span>
              <span className="text-foreground font-semibold">{VND(user?.balance ?? 0)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Giá sản phẩm</span>
              <span className="text-primary font-semibold">- {VND(product.price)}</span>
            </div>
            <div className="h-px bg-white/10" />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Số dư sau khi mua</span>
              <span className={`font-bold ${canAfford ? "text-green-400" : "text-destructive"}`}>
                {canAfford ? VND(afterBalance) : "Không đủ số dư"}
              </span>
            </div>
          </div>

          <Button
            className="w-full font-bold text-lg py-6 shadow-lg shadow-primary/30"
            disabled={!canAfford || purchaseMutation.isPending}
            onClick={() => setShowConfirm(true)}
          >
            <ShoppingCart className="w-5 h-5 mr-2" />
            {canAfford ? "Mua ngay" : "Không đủ số dư"}
          </Button>

          {!canAfford && (
            <Button
              variant="outline"
              className="w-full border-primary/30 text-primary"
              onClick={() => setLocation("/topup")}
            >
              Nạp tiền ngay
            </Button>
          )}
        </div>
      </div>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent className="glass border border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận mua hàng</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span className="block">Bạn chắc chắn muốn mua <strong className="text-foreground">{product.name}</strong>?</span>
              <span className="block text-primary font-bold text-lg">{VND(product.price)}</span>
              <span className="block text-muted-foreground text-sm">Số dư sau khi mua: {VND(afterBalance)}</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => purchaseMutation.mutate({ data: { productId: product.id } })}
              disabled={purchaseMutation.isPending}
              className="bg-primary text-primary-foreground"
            >
              {purchaseMutation.isPending ? "Đang xử lý..." : "Xác nhận mua"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

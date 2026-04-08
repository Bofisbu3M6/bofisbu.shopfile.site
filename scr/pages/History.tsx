import { useEffect } from "react";
import { useLocation } from "wouter";
import { useListPurchases, useListTopups, getListPurchasesQueryKey, getListTopupsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, Loader2 } from "lucide-react";

const VND = (amount: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const STATUS_MAP: Record<string, { label: string; color: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Chờ duyệt", color: "secondary" },
  checking: { label: "Đang kiểm tra", color: "outline" },
  approved: { label: "Đã duyệt", color: "default" },
  rejected: { label: "Từ chối", color: "destructive" },
};

export default function HistoryPage() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: purchases, isLoading: purchasesLoading } = useListPurchases({
    query: { queryKey: getListPurchasesQueryKey() },
  });

  const { data: topups, isLoading: topupsLoading } = useListTopups({
    query: { queryKey: getListTopupsQueryKey() },
  });

  // Auto-refresh every 3s if any topup is "checking"
  const hasChecking = topups?.some((t) => t.status === "checking");
  useEffect(() => {
    if (!hasChecking) return;
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: getListTopupsQueryKey() });
    }, 3000);
    return () => clearInterval(interval);
  }, [hasChecking, queryClient]);

  return (
    <div className="min-h-screen pb-10">
      <nav className="glass sticky top-0 z-40 px-4 py-3 flex items-center gap-3 border-b border-white/10">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/home")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <span className="font-black text-foreground">Lịch sử</span>
      </nav>

      <div className="max-w-2xl mx-auto px-4 mt-6">
        <Tabs defaultValue="purchases">
          <TabsList className="w-full mb-6 bg-secondary/50">
            <TabsTrigger value="purchases" className="flex-1">Lịch sử mua</TabsTrigger>
            <TabsTrigger value="topups" className="flex-1">Lịch sử nạp</TabsTrigger>
          </TabsList>

          <TabsContent value="purchases">
            {purchasesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
              </div>
            ) : purchases?.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-5xl mb-4">🛒</p>
                <p className="text-muted-foreground">Chưa có lịch sử mua hàng</p>
              </div>
            ) : (
              <div className="space-y-3">
                {purchases?.map((p) => (
                  <div
                    key={p.id}
                    className="glass rounded-2xl p-4 border border-white/10 flex items-center justify-between gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">{p.productName}</p>
                      <p className="text-xs text-muted-foreground">{p.productCategory} • {formatDate(p.createdAt)}</p>
                      <p className="text-primary font-bold text-sm mt-0.5">{VND(p.amount)}</p>
                    </div>
                    {p.fileUrl ? (
                      <a
                        href={p.fileUrl}
                        download
                        className="flex items-center gap-2 bg-primary/20 text-primary px-3 py-2 rounded-xl text-sm font-semibold hover:bg-primary/30 transition-colors whitespace-nowrap"
                      >
                        <Download className="w-4 h-4" />
                        Lấy sản phẩm
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground bg-secondary/40 px-3 py-2 rounded-xl">
                        Đã mua
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="topups">
            {topupsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
              </div>
            ) : topups?.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-5xl mb-4">💰</p>
                <p className="text-muted-foreground">Chưa có lịch sử nạp tiền</p>
                <Button
                  className="mt-4"
                  onClick={() => setLocation("/topup")}
                >
                  Nạp tiền ngay
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {topups?.map((t) => {
                  const status = STATUS_MAP[t.status] ?? { label: t.status, color: "outline" as const };
                  return (
                    <div
                      key={t.id}
                      className="glass rounded-2xl p-4 border border-white/10 flex items-center justify-between gap-4"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-foreground">
                            {t.method === "card" ? `Thẻ cào ${t.carrier} ${t.denomination}` : "Ngân hàng"}
                          </p>
                          <Badge variant={status.color} className="text-xs flex items-center gap-1">
                            {t.status === "checking" && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
                            {status.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{formatDate(t.createdAt)}</p>
                        {t.method === "card" && t.cardCode && (
                          <p className="text-xs text-muted-foreground font-mono mt-0.5">Mã: {t.cardCode}</p>
                        )}
                        {t.method === "bank" && t.transferNote && (
                          <p className="text-xs text-muted-foreground mt-0.5">ND: {t.transferNote}</p>
                        )}
                      </div>
                      <p className="text-primary font-black whitespace-nowrap">
                        +{VND(t.amount)}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

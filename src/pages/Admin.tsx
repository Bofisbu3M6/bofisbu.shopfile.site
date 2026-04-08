import { useState } from "react";
import { useLocation } from "wouter";
import {
  useGetAdminStats,
  useListUsers,
  useDeleteUser,
  useUpdateUserBalance,
  useAddAdminRole,
  useListAllTopups,
  useApproveTopup,
  useRejectTopup,
  useListProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  getGetAdminStatsQueryKey,
  getListUsersQueryKey,
  getListAllTopupsQueryKey,
  getListProductsQueryKey,
  getGetMeQueryKey,
} from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Trash2, Plus, Edit, Check, X } from "lucide-react";
import { FileUploadButton } from "@/components/file-upload-button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

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

const productSchema = z.object({
  name: z.string().min(1, "Bắt buộc"),
  category: z.string().min(1, "Bắt buộc"),
  price: z.coerce.number().min(1000, "Tối thiểu 1.000"),
  description: z.string().min(1, "Bắt buộc"),
  imageUrl: z.string().optional(),
  fileUrl: z.string().optional(),
});
type ProductForm = z.infer<typeof productSchema>;

export default function AdminPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [addAdminId, setAddAdminId] = useState("");
  const [editBalanceId, setEditBalanceId] = useState<number | null>(null);
  const [newBalance, setNewBalance] = useState("");
  const [productDialog, setProductDialog] = useState<{ open: boolean; editId?: number }>({ open: false });

  const productForm = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: { name: "", category: "", price: 0, description: "", imageUrl: "", fileUrl: "" },
  });

  const { data: stats, isLoading: statsLoading } = useGetAdminStats({
    query: { queryKey: getGetAdminStatsQueryKey() },
  });
  const { data: users, isLoading: usersLoading } = useListUsers({
    query: { queryKey: getListUsersQueryKey() },
  });
  const { data: topups, isLoading: topupsLoading } = useListAllTopups({
    query: { queryKey: getListAllTopupsQueryKey() },
  });
  const { data: products, isLoading: productsLoading } = useListProducts({}, {
    query: { queryKey: getListProductsQueryKey() },
  });

  const deleteUserMutation = useDeleteUser({
    mutation: {
      onSuccess: () => {
        toast({ title: "Đã xóa người dùng" });
        queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
      },
      onError: (err: any) => {
        toast({ title: "Lỗi", description: err?.data?.error ?? "Xóa thất bại", variant: "destructive" });
      },
    },
  });

  const updateBalanceMutation = useUpdateUserBalance({
    mutation: {
      onSuccess: () => {
        toast({ title: "Đã cập nhật số dư" });
        queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
        setEditBalanceId(null);
        setNewBalance("");
      },
      onError: (err: any) => {
        toast({ title: "Lỗi", description: err?.data?.error ?? "Cập nhật thất bại", variant: "destructive" });
      },
    },
  });

  const addAdminMutation = useAddAdminRole({
    mutation: {
      onSuccess: (data) => {
        toast({ title: "Thành công", description: data.message });
        queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
        setAddAdminId("");
      },
      onError: (err: any) => {
        toast({ title: "Lỗi", description: err?.data?.error ?? "Thất bại", variant: "destructive" });
      },
    },
  });

  const approveTopupMutation = useApproveTopup({
    mutation: {
      onSuccess: () => {
        toast({ title: "Đã duyệt nạp tiền" });
        queryClient.invalidateQueries({ queryKey: getListAllTopupsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
      },
      onError: (err: any) => {
        toast({ title: "Lỗi", description: err?.data?.error ?? "Thất bại", variant: "destructive" });
      },
    },
  });

  const rejectTopupMutation = useRejectTopup({
    mutation: {
      onSuccess: () => {
        toast({ title: "Đã từ chối nạp tiền" });
        queryClient.invalidateQueries({ queryKey: getListAllTopupsQueryKey() });
      },
      onError: (err: any) => {
        toast({ title: "Lỗi", description: err?.data?.error ?? "Thất bại", variant: "destructive" });
      },
    },
  });

  const createProductMutation = useCreateProduct({
    mutation: {
      onSuccess: () => {
        toast({ title: "Đã thêm sản phẩm!" });
        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
        setProductDialog({ open: false });
        productForm.reset();
      },
      onError: (err: any) => {
        toast({ title: "Lỗi", description: err?.data?.error ?? "Thêm thất bại", variant: "destructive" });
      },
    },
  });

  const updateProductMutation = useUpdateProduct({
    mutation: {
      onSuccess: () => {
        toast({ title: "Đã cập nhật sản phẩm!" });
        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
        setProductDialog({ open: false });
        productForm.reset();
      },
      onError: (err: any) => {
        toast({ title: "Lỗi", description: err?.data?.error ?? "Cập nhật thất bại", variant: "destructive" });
      },
    },
  });

  const deleteProductMutation = useDeleteProduct({
    mutation: {
      onSuccess: () => {
        toast({ title: "Đã xóa sản phẩm" });
        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
      },
      onError: (err: any) => {
        toast({ title: "Lỗi", description: err?.data?.error ?? "Xóa thất bại", variant: "destructive" });
      },
    },
  });

  const onProductSubmit = (data: ProductForm) => {
    if (productDialog.editId) {
      updateProductMutation.mutate({
        id: productDialog.editId,
        data: {
          name: data.name,
          category: data.category,
          price: data.price,
          description: data.description,
          imageUrl: data.imageUrl || null,
          fileUrl: data.fileUrl || null,
        },
      });
    } else {
      createProductMutation.mutate({
        data: {
          name: data.name,
          category: data.category,
          price: data.price,
          description: data.description,
          imageUrl: data.imageUrl || null,
          fileUrl: data.fileUrl || null,
        },
      });
    }
  };

  const openEditProduct = (p: any) => {
    productForm.reset({
      name: p.name,
      category: p.category,
      price: p.price,
      description: p.description,
      imageUrl: p.imageUrl ?? "",
      fileUrl: p.fileUrl ?? "",
    });
    setProductDialog({ open: true, editId: p.id });
  };

  const STATUS_COLORS: Record<string, string> = {
    pending: "bg-yellow-500/20 text-yellow-400",
    checking: "bg-blue-500/20 text-blue-400",
    approved: "bg-green-500/20 text-green-400",
    rejected: "bg-red-500/20 text-red-400",
  };

  const STATUS_LABELS: Record<string, string> = {
    pending: "Chờ duyệt",
    checking: "Đang kiểm tra",
    approved: "Đã duyệt",
    rejected: "Từ chối",
  };

  return (
    <div className="min-h-screen pb-10">
      <nav className="glass sticky top-0 z-40 px-4 py-3 flex items-center gap-3 border-b border-white/10">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/home")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <span className="font-black text-foreground">Quản trị viên</span>
        <span className="ml-auto text-xs bg-primary/20 text-primary px-2 py-1 rounded-full font-semibold">
          {user?.role === "superadmin" ? "Super Admin" : "Admin"}
        </span>
      </nav>

      <div className="max-w-5xl mx-auto px-4 mt-6">
        <Tabs defaultValue="stats">
          <TabsList className="flex flex-wrap gap-1 mb-6 bg-secondary/50 h-auto p-1">
            <TabsTrigger value="stats">Thống kê</TabsTrigger>
            <TabsTrigger value="products">Sản phẩm</TabsTrigger>
            <TabsTrigger value="users">Người dùng</TabsTrigger>
            <TabsTrigger value="topups">Nạp tiền</TabsTrigger>
            {user?.role === "superadmin" && (
              <TabsTrigger value="add-admin">Thêm Admin</TabsTrigger>
            )}
          </TabsList>

          {/* Stats */}
          <TabsContent value="stats">
            {statsLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { label: "Tổng người dùng", value: stats?.totalUsers ?? 0, format: (v: number) => v.toLocaleString("vi-VN") },
                  { label: "Tổng sản phẩm", value: stats?.totalProducts ?? 0, format: (v: number) => v.toLocaleString("vi-VN") },
                  { label: "Tổng đơn hàng", value: stats?.totalPurchases ?? 0, format: (v: number) => v.toLocaleString("vi-VN") },
                  { label: "Tổng doanh thu", value: stats?.totalRevenue ?? 0, format: VND },
                  { label: "Chờ duyệt nạp", value: stats?.pendingTopups ?? 0, format: (v: number) => v.toLocaleString("vi-VN") },
                ].map((s) => (
                  <div key={s.label} className="glass rounded-2xl p-5 border border-white/10">
                    <p className="text-muted-foreground text-xs">{s.label}</p>
                    <p className="text-2xl font-black text-primary mt-1">
                      {s.format(s.value) as string}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Products */}
          <TabsContent value="products">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-foreground">Quản lý sản phẩm</h3>
              <Button
                onClick={() => { productForm.reset({ name: "", category: "", price: 0, description: "", imageUrl: "", fileUrl: "" }); setProductDialog({ open: true }); }}
                className="shadow-lg shadow-primary/20"
              >
                <Plus className="w-4 h-4 mr-2" /> Thêm sản phẩm
              </Button>
            </div>
            {productsLoading ? (
              <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
            ) : (
              <div className="space-y-2">
                {products?.map((p) => (
                  <div key={p.id} className="glass rounded-xl p-4 border border-white/10 flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">{p.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs bg-secondary/50 text-muted-foreground px-2 py-0.5 rounded-full">{p.category}</span>
                        <span className="text-primary text-sm font-bold">{VND(p.price)}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="icon" variant="ghost" onClick={() => openEditProduct(p)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => deleteProductMutation.mutate({ id: p.id })} className="text-destructive hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Users */}
          <TabsContent value="users">
            {usersLoading ? (
              <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
            ) : (
              <div className="space-y-2">
                {users?.map((u) => (
                  <div key={u.id} className="glass rounded-xl p-4 border border-white/10">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-foreground">{u.username}</p>
                          <Badge variant={u.role === "superadmin" ? "default" : u.role === "admin" ? "secondary" : "outline"} className="text-xs">
                            {u.role}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground font-mono">{u.customerId}</p>
                        {editBalanceId === u.id ? (
                          <div className="flex items-center gap-2 mt-2">
                            <Input
                              type="number"
                              value={newBalance}
                              onChange={(e) => setNewBalance(e.target.value)}
                              className="h-8 w-40 bg-secondary/40 text-sm"
                              placeholder="Số dư mới"
                            />
                            <Button size="icon" className="h-8 w-8"
                              onClick={() => updateBalanceMutation.mutate({ id: u.id, data: { balance: parseFloat(newBalance) } })}
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditBalanceId(null)}>
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <p className="text-primary font-bold text-sm mt-0.5">{VND(u.balance)}</p>
                        )}
                      </div>
                      <div className="flex gap-2 shrink-0">
                        {editBalanceId !== u.id && (
                          <Button size="sm" variant="outline"
                            onClick={() => { setEditBalanceId(u.id); setNewBalance(String(u.balance)); }}
                            className="text-xs border-white/20"
                          >
                            <Edit className="w-3 h-3 mr-1" /> Số dư
                          </Button>
                        )}
                        {u.role !== "superadmin" && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => deleteUserMutation.mutate({ id: u.id })}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Topups */}
          <TabsContent value="topups">
            {topupsLoading ? (
              <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
            ) : (
              <div className="space-y-2">
                {topups?.map((t) => (
                  <div key={t.id} className="glass rounded-xl p-4 border border-white/10">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-foreground">{t.username}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[t.status] ?? "bg-secondary/50 text-muted-foreground"}`}>
                            {STATUS_LABELS[t.status] ?? t.status}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {t.method === "card" ? `Thẻ ${t.carrier} ${t.denomination}` : "Ngân hàng"}
                        </p>
                        {t.method === "card" && <p className="text-xs text-muted-foreground font-mono">Mã: {t.cardCode} | Seri: {t.cardSerial}</p>}
                        {t.method === "bank" && t.transferNote && <p className="text-xs text-muted-foreground">ND: {t.transferNote}</p>}
                        <p className="text-xs text-muted-foreground">{formatDate(t.createdAt)}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-primary font-black text-lg">{VND(t.amount)}</p>
                        {(t.status === "pending" || t.status === "checking") && (
                          <div className="flex gap-2 mt-2">
                            <Button
                              size="sm"
                              onClick={() => approveTopupMutation.mutate({ id: t.id })}
                              className="bg-green-600 hover:bg-green-700 text-white text-xs"
                              disabled={approveTopupMutation.isPending}
                            >
                              <Check className="w-3 h-3 mr-1" /> Duyệt
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => rejectTopupMutation.mutate({ id: t.id })}
                              disabled={rejectTopupMutation.isPending}
                              className="text-xs"
                            >
                              <X className="w-3 h-3 mr-1" /> Từ chối
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Add admin */}
          {user?.role === "superadmin" && (
            <TabsContent value="add-admin">
              <div className="max-w-sm">
                <h3 className="font-bold text-foreground mb-4">Cấp quyền Admin</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Nhập Mã Khách Hàng của người cần cấp quyền Admin. Họ sẽ nhận ngay 100.000.000 VND và có thể thêm sản phẩm.
                </p>
                <div className="glass rounded-2xl p-5 border border-white/10 space-y-4">
                  <div>
                    <Label htmlFor="customer-id">Mã Khách Hàng</Label>
                    <Input
                      id="customer-id"
                      value={addAdminId}
                      onChange={(e) => setAddAdminId(e.target.value)}
                      placeholder="Ví dụ: KHXXXXXX"
                      className="mt-1 bg-secondary/40 font-mono"
                    />
                  </div>
                  <Button
                    className="w-full font-bold"
                    disabled={!addAdminId || addAdminMutation.isPending}
                    onClick={() => addAdminMutation.mutate({ data: { customerId: addAdminId } })}
                  >
                    {addAdminMutation.isPending ? "Đang xử lý..." : "Cấp quyền Admin"}
                  </Button>
                </div>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Product dialog */}
      <Dialog open={productDialog.open} onOpenChange={(open) => setProductDialog({ open })}>
        <DialogContent className="glass border border-white/10 max-w-md">
          <DialogHeader>
            <DialogTitle>{productDialog.editId ? "Sửa sản phẩm" : "Thêm sản phẩm mới"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={productForm.handleSubmit(onProductSubmit)} className="space-y-3">
            <div>
              <Label>Tên sản phẩm</Label>
              <Input className="mt-1 bg-secondary/40" {...productForm.register("name")} />
              {productForm.formState.errors.name && <p className="text-destructive text-xs mt-0.5">{productForm.formState.errors.name.message}</p>}
            </div>
            <div>
              <Label>Danh mục</Label>
              <Select onValueChange={(v) => productForm.setValue("category", v)} value={productForm.watch("category")}>
                <SelectTrigger className="mt-1 bg-secondary/40">
                  <SelectValue placeholder="Chọn danh mục" />
                </SelectTrigger>
                <SelectContent>
                  {["Aimlock", "File data", "Panel", "Menu"].map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {productForm.formState.errors.category && <p className="text-destructive text-xs mt-0.5">{productForm.formState.errors.category.message}</p>}
            </div>
            <div>
              <Label>Giá (VND)</Label>
              <Input type="number" className="mt-1 bg-secondary/40" {...productForm.register("price")} />
              {productForm.formState.errors.price && <p className="text-destructive text-xs mt-0.5">{productForm.formState.errors.price.message}</p>}
            </div>
            <div>
              <Label>Mô tả</Label>
              <Input className="mt-1 bg-secondary/40" {...productForm.register("description")} />
              {productForm.formState.errors.description && <p className="text-destructive text-xs mt-0.5">{productForm.formState.errors.description.message}</p>}
            </div>
            <div>
              <Label className="mb-1 block">Ảnh sản phẩm (tùy chọn)</Label>
              <FileUploadButton
                type="image"
                label="Tải lên ảnh"
                accept="image/*"
                currentUrl={productForm.watch("imageUrl") ?? ""}
                onUploaded={(url) => productForm.setValue("imageUrl", url)}
              />
              <Input className="mt-2 bg-secondary/40 text-xs" placeholder="Hoặc dán URL ảnh..." {...productForm.register("imageUrl")} />
            </div>
            <div>
              <Label className="mb-1 block">File sản phẩm (tùy chọn)</Label>
              <FileUploadButton
                type="file"
                label="Tải lên file"
                currentUrl={productForm.watch("fileUrl") ?? ""}
                onUploaded={(url) => productForm.setValue("fileUrl", url)}
              />
              <Input className="mt-2 bg-secondary/40 text-xs" placeholder="Hoặc dán URL / link tải..." {...productForm.register("fileUrl")} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setProductDialog({ open: false })}>Hủy</Button>
              <Button
                type="submit"
                disabled={createProductMutation.isPending || updateProductMutation.isPending}
                className="shadow-lg shadow-primary/20"
              >
                {(createProductMutation.isPending || updateProductMutation.isPending) ? "Đang lưu..." : "Lưu sản phẩm"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

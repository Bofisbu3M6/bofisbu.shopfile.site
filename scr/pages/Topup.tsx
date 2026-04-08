import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTopupCard, useTopupBank, getListTopupsQueryKey } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Copy } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

const cardSchema = z.object({
  denomination: z.string().min(1, "Chọn mệnh giá"),
  carrier: z.string().min(1, "Chọn nhà mạng"),
  cardCode: z.string().min(1, "Nhập mã thẻ"),
  cardSerial: z.string().min(1, "Nhập số seri"),
});

const bankSchema = z.object({
  amount: z.coerce.number().min(10000, "Tối thiểu 10.000 VND"),
  transferNote: z.string().min(1, "Nhập nội dung chuyển khoản"),
});

type CardForm = z.infer<typeof cardSchema>;
type BankForm = z.infer<typeof bankSchema>;

const BANK_ACCOUNT = "1027195845";
const BANK_NAME = "Vietcombank";

export default function TopupPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const cardForm = useForm<CardForm>({
    resolver: zodResolver(cardSchema),
    defaultValues: { denomination: "", carrier: "", cardCode: "", cardSerial: "" },
  });

  const bankForm = useForm<BankForm>({
    resolver: zodResolver(bankSchema),
    defaultValues: { amount: 0, transferNote: "" },
  });

  const cardMutation = useTopupCard({
    mutation: {
      onSuccess: () => {
        toast({ title: "Đã gửi yêu cầu nạp thẻ!", description: "Thẻ của bạn sẽ được xử lý trong 5–10 phút" });
        queryClient.invalidateQueries({ queryKey: getListTopupsQueryKey() });
        cardForm.reset();
      },
      onError: (err: any) => {
        toast({ title: "Lỗi", description: err?.data?.error ?? "Nạp thẻ thất bại", variant: "destructive" });
      },
    },
  });

  const bankMutation = useTopupBank({
    mutation: {
      onSuccess: () => {
        toast({ title: "Đã gửi yêu cầu nạp ngân hàng!", description: "Admin sẽ kiểm tra và duyệt trong 15 phút" });
        queryClient.invalidateQueries({ queryKey: getListTopupsQueryKey() });
        bankForm.reset();
      },
      onError: (err: any) => {
        toast({ title: "Lỗi", description: err?.data?.error ?? "Nạp ngân hàng thất bại", variant: "destructive" });
      },
    },
  });

  const onCardSubmit = (data: CardForm) => cardMutation.mutate({ data });
  const onBankSubmit = (data: BankForm) => bankMutation.mutate({ data });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Đã sao chép!" });
  };

  const frameClass = "glass rounded-xl p-4 border border-white/10 w-full";

  return (
    <div className="min-h-screen pb-10">
      <nav className="glass sticky top-0 z-40 px-4 py-3 flex items-center gap-3 border-b border-white/10">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/home")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <span className="font-black text-foreground">Nạp tiền</span>
      </nav>

      <div className="max-w-md mx-auto px-4 mt-6">
        <Tabs defaultValue="card">
          <TabsList className="w-full mb-6 bg-secondary/50">
            <TabsTrigger value="card" className="flex-1">Thẻ cào</TabsTrigger>
            <TabsTrigger value="bank" className="flex-1">Ngân hàng</TabsTrigger>
          </TabsList>

          <TabsContent value="card">
            <form onSubmit={cardForm.handleSubmit(onCardSubmit)} className="space-y-3">
              <div className={frameClass}>
                <Label className="text-sm font-semibold text-muted-foreground mb-2 block">Mệnh giá</Label>
                <Select
                  onValueChange={(v) => cardForm.setValue("denomination", v)}
                  value={cardForm.watch("denomination")}
                >
                  <SelectTrigger className="bg-transparent border-0 border-b border-white/20 rounded-none px-0 focus:ring-0">
                    <SelectValue placeholder="Chọn mệnh giá..." />
                  </SelectTrigger>
                  <SelectContent>
                    {["20k", "50k", "100k", "200k", "500k"].map((d) => (
                      <SelectItem key={d} value={d}>{d.replace("k", ".000 VND")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {cardForm.formState.errors.denomination && (
                  <p className="text-destructive text-xs mt-1">{cardForm.formState.errors.denomination.message}</p>
                )}
              </div>

              <div className={frameClass}>
                <Label className="text-sm font-semibold text-muted-foreground mb-2 block">Nhà mạng</Label>
                <Select
                  onValueChange={(v) => cardForm.setValue("carrier", v)}
                  value={cardForm.watch("carrier")}
                >
                  <SelectTrigger className="bg-transparent border-0 border-b border-white/20 rounded-none px-0 focus:ring-0">
                    <SelectValue placeholder="Chọn nhà mạng..." />
                  </SelectTrigger>
                  <SelectContent>
                    {["Viettel", "Mobifone", "Vinaphone", "Garena"].map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {cardForm.formState.errors.carrier && (
                  <p className="text-destructive text-xs mt-1">{cardForm.formState.errors.carrier.message}</p>
                )}
              </div>

              <div className={frameClass}>
                <Label className="text-sm font-semibold text-muted-foreground mb-2 block">Mã thẻ</Label>
                <Input
                  placeholder="Nhập mã thẻ..."
                  className="bg-transparent border-0 border-b border-white/20 rounded-none px-0 focus-visible:ring-0"
                  {...cardForm.register("cardCode")}
                />
                {cardForm.formState.errors.cardCode && (
                  <p className="text-destructive text-xs mt-1">{cardForm.formState.errors.cardCode.message}</p>
                )}
              </div>

              <div className={frameClass}>
                <Label className="text-sm font-semibold text-muted-foreground mb-2 block">Số Seri</Label>
                <Input
                  placeholder="Nhập số seri..."
                  className="bg-transparent border-0 border-b border-white/20 rounded-none px-0 focus-visible:ring-0"
                  {...cardForm.register("cardSerial")}
                />
                {cardForm.formState.errors.cardSerial && (
                  <p className="text-destructive text-xs mt-1">{cardForm.formState.errors.cardSerial.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full font-bold shadow-lg shadow-primary/30 mt-4"
                disabled={cardMutation.isPending}
              >
                {cardMutation.isPending ? "Đang xử lý..." : "Nạp thẻ cào"}
              </Button>

              <p className="text-center text-muted-foreground text-xs">
                Thẻ sẽ được xử lý tự động qua AUTOCRAD1S.COM
              </p>
            </form>
          </TabsContent>

          <TabsContent value="bank">
            <div className="space-y-4">
              <div className="glass rounded-2xl p-5 border border-primary/20 shadow-lg space-y-4">
                <p className="font-bold text-foreground text-center">Thông tin chuyển khoản</p>
                <div className="bg-secondary/40 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-sm">Ngân hàng</span>
                    <span className="text-foreground font-bold">{BANK_NAME}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-sm">Số tài khoản</span>
                    <div className="flex items-center gap-2">
                      <span className="text-primary font-black tracking-widest text-lg">{BANK_ACCOUNT}</span>
                      <button onClick={() => copyToClipboard(BANK_ACCOUNT)} className="text-muted-foreground hover:text-primary transition-colors">
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <form onSubmit={bankForm.handleSubmit(onBankSubmit)} className="space-y-3">
                <div className={frameClass}>
                  <Label className="text-sm font-semibold text-muted-foreground mb-2 block">Số tiền chuyển (VND)</Label>
                  <Input
                    type="number"
                    placeholder="Ví dụ: 100000"
                    className="bg-transparent border-0 border-b border-white/20 rounded-none px-0 focus-visible:ring-0"
                    {...bankForm.register("amount")}
                  />
                  {bankForm.formState.errors.amount && (
                    <p className="text-destructive text-xs mt-1">{bankForm.formState.errors.amount.message}</p>
                  )}
                </div>

                <div className={frameClass}>
                  <Label className="text-sm font-semibold text-muted-foreground mb-2 block">Nội dung chuyển khoản</Label>
                  <Input
                    placeholder="Ví dụ: NAP TIEN username"
                    className="bg-transparent border-0 border-b border-white/20 rounded-none px-0 focus-visible:ring-0"
                    {...bankForm.register("transferNote")}
                  />
                  {bankForm.formState.errors.transferNote && (
                    <p className="text-destructive text-xs mt-1">{bankForm.formState.errors.transferNote.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full font-bold shadow-lg shadow-primary/30"
                  disabled={bankMutation.isPending}
                >
                  {bankMutation.isPending ? "Đang gửi..." : "Gửi yêu cầu nạp tiền"}
                </Button>

                <p className="text-center text-muted-foreground text-xs">
                  Admin sẽ kiểm tra và phê duyệt trong 5–15 phút
                </p>
              </form>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

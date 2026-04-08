import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLogin, useRegister } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShopLogo } from "@/components/shop-logo";

const loginSchema = z.object({
  username: z.string().min(1, "Nhập tên đăng nhập"),
  password: z.string().min(1, "Nhập mật khẩu"),
});

const registerSchema = z.object({
  username: z.string().min(3, "Tối thiểu 3 ký tự"),
  password: z.string().min(6, "Tối thiểu 6 ký tự"),
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { setToken } = useAuth();
  const { toast } = useToast();
  const [newCustomerId, setNewCustomerId] = useState<string | null>(null);

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { username: "", password: "" },
  });

  const loginMutation = useLogin({
    mutation: {
      onSuccess: (data) => {
        setToken(data.token);
        setLocation("/home");
      },
      onError: (err: any) => {
        toast({ title: "Lỗi", description: err?.data?.error ?? "Đăng nhập thất bại", variant: "destructive" });
      },
    },
  });

  const registerMutation = useRegister({
    mutation: {
      onSuccess: (data) => {
        setNewCustomerId(data.user.customerId);
        setToken(data.token);
        toast({ title: "Thành công", description: `Đăng ký thành công! Tặng bạn 10.000 VND 🎁` });
        setTimeout(() => setLocation("/home"), 2500);
      },
      onError: (err: any) => {
        toast({ title: "Lỗi", description: err?.data?.error ?? "Đăng ký thất bại", variant: "destructive" });
      },
    },
  });

  const onLogin = (data: LoginForm) => loginMutation.mutate({ data });
  const onRegister = (data: RegisterForm) => registerMutation.mutate({ data });

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8 gap-4">
          <ShopLogo size="lg" />
          <p className="text-muted-foreground text-sm">Cửa hàng công cụ Free Fire hàng đầu</p>
        </div>

        <div className="glass rounded-2xl p-6 border border-white/10 shadow-2xl">
          <Tabs defaultValue="login">
            <TabsList className="w-full mb-6 bg-secondary/50">
              <TabsTrigger value="login" className="flex-1">Đăng nhập</TabsTrigger>
              <TabsTrigger value="register" className="flex-1">Đăng ký</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                <div>
                  <Label htmlFor="login-username">Tên đăng nhập</Label>
                  <Input id="login-username" placeholder="Nhập tên đăng nhập" className="mt-1 bg-secondary/40" {...loginForm.register("username")} />
                  {loginForm.formState.errors.username && <p className="text-destructive text-xs mt-1">{loginForm.formState.errors.username.message}</p>}
                </div>
                <div>
                  <Label htmlFor="login-password">Mật khẩu</Label>
                  <Input id="login-password" type="password" placeholder="Nhập mật khẩu" className="mt-1 bg-secondary/40" {...loginForm.register("password")} />
                  {loginForm.formState.errors.password && <p className="text-destructive text-xs mt-1">{loginForm.formState.errors.password.message}</p>}
                </div>
                <Button type="submit" className="w-full font-bold shadow-lg shadow-primary/30" disabled={loginMutation.isPending}>
                  {loginMutation.isPending ? "Đang đăng nhập..." : "Đăng nhập"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              {newCustomerId ? (
                <div className="text-center py-6 space-y-3">
                  <div className="text-5xl">🎉</div>
                  <p className="text-foreground font-bold text-lg">Đăng ký thành công!</p>
                  <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 space-y-1">
                    <p className="text-muted-foreground text-xs">Mã khách hàng của bạn</p>
                    <p className="text-primary font-black text-2xl tracking-widest">{newCustomerId}</p>
                  </div>
                  <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3">
                    <p className="text-green-400 font-bold text-sm">🎁 Tặng bạn 10.000 VND!</p>
                  </div>
                  <p className="text-muted-foreground text-xs">Lưu mã này để được hỗ trợ</p>
                </div>
              ) : (
                <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                  <div>
                    <Label htmlFor="reg-username">Tên đăng nhập</Label>
                    <Input id="reg-username" placeholder="Chọn tên đăng nhập" className="mt-1 bg-secondary/40" {...registerForm.register("username")} />
                    {registerForm.formState.errors.username && <p className="text-destructive text-xs mt-1">{registerForm.formState.errors.username.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="reg-password">Mật khẩu</Label>
                    <Input id="reg-password" type="password" placeholder="Tối thiểu 6 ký tự" className="mt-1 bg-secondary/40" {...registerForm.register("password")} />
                    {registerForm.formState.errors.password && <p className="text-destructive text-xs mt-1">{registerForm.formState.errors.password.message}</p>}
                  </div>
                  <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-center">
                    <p className="text-green-400 text-sm font-semibold">🎁 Đăng ký nhận ngay 10.000 VND!</p>
                  </div>
                  <Button type="submit" className="w-full font-bold shadow-lg shadow-primary/30" disabled={registerMutation.isPending}>
                    {registerMutation.isPending ? "Đang tạo tài khoản..." : "Đăng ký"}
                  </Button>
                </form>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <p className="text-center text-muted-foreground text-xs mt-4">
          bofisbu.shopfile.site · Free Fire Tools · Hỗ trợ 24/7
        </p>
      </div>
    </div>
  );
}

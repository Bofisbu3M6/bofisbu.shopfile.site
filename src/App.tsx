import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import { SnowEffect } from "@/components/snow-effect";
import AuthPage from "@/pages/auth";
import HomePage from "@/pages/home";
import CategoryPage from "@/pages/category";
import ProductPage from "@/pages/product";
import TopupPage from "@/pages/topup";
import HistoryPage from "@/pages/history";
import AdminPage from "@/pages/admin";
import NotFound from "@/pages/not-found";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import { useEffect } from "react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: 30000,
    },
  },
});

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading, token } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !token) {
      setLocation("/");
    }
  }, [isLoading, token, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Dang tai...</p>
        </div>
      </div>
    );
  }

  if (!token) return null;
  return <Component />;
}

function AdminRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading, token } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading) {
      if (!token) {
        setLocation("/");
      } else if (user && user.role !== "admin" && user.role !== "superadmin") {
        setLocation("/home");
      }
    }
  }, [isLoading, token, user, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!token || (user && user.role !== "admin" && user.role !== "superadmin")) return null;
  return <Component />;
}

function AuthRedirect({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading, token } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && token && user) {
      setLocation("/home");
    }
  }, [isLoading, token, user, setLocation]);

  if (isLoading && token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => <AuthRedirect component={AuthPage} />} />
      <Route path="/home" component={() => <ProtectedRoute component={HomePage} />} />
      <Route path="/category/:name" component={() => <ProtectedRoute component={CategoryPage} />} />
      <Route path="/product/:id" component={() => <ProtectedRoute component={ProductPage} />} />
      <Route path="/topup" component={() => <ProtectedRoute component={TopupPage} />} />
      <Route path="/history" component={() => <ProtectedRoute component={HistoryPage} />} />
      <Route path="/admin" component={() => <AdminRoute component={AdminPage} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { token } = useAuth();

  useEffect(() => {
    setAuthTokenGetter(() => token);
  }, [token]);

  return (
    <>
      <SnowEffect />
      <Router />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

import {
  ShoppingBag, Menu, X, Package, ClipboardList, Store as StoreIcon,
  LogOut, LogIn, User, ShoppingCart, Tag, Star, Gift, Bot, Sparkles, MessageCircle, ShieldCheck, TrendingUp, Receipt, Heart,   Wallet,   Cake, Bell, Users, Truck,
} from "lucide-react";
import AdminOrderNotifier from "@/components/admin/AdminOrderNotifier";
import NotificationBell from "@/components/admin/NotificationBell";
import CustomerNotificationBell from "@/components/customer/CustomerNotificationBell";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const u = await db.auth.me();
        setUser(u);
      } catch {}
    };
    loadUser();
  }, []);

  const updateCartCount = () => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    setCartCount(cart.reduce((sum, i) => sum + i.quantity, 0));
  };

  useEffect(() => {
    updateCartCount();
    window.addEventListener("cart-updated", updateCartCount);
    return () => window.removeEventListener("cart-updated", updateCartCount);
  }, []);

  const isAdmin = user?.role === "admin";

  const navItems = [
    { label: "Store", page: "Store", icon: StoreIcon },
    { label: "Account", page: "Account", icon: User },
    { label: "Wallet", page: "Wallet", icon: Wallet },
    { label: "Family", page: "Family", icon: Users },
    { label: "My Orders", page: "Orders", icon: Package },

    { label: "Track Order", page: "OrderStatus", icon: Package },
    { label: "Redeem", page: "Redeem", icon: Star },
    { label: "Birthday Reward", page: "BirthdayReward", icon: Cake },
    { label: "Wishlist", page: "Wishlist", icon: Heart },
    { label: "Gift Cards", page: "GiftCards", icon: Gift },
    { label: "Support", page: "Support", icon: MessageCircle },
  ];

  const adminItems = [
    { label: "Manage Products", page: "AdminProducts", icon: Package },
    { label: "Manage Orders", page: "AdminOrders", icon: ClipboardList },
    { label: "Promo Codes", page: "AdminPromoCodes", icon: Tag },
    { label: "Gift Cards", page: "AdminGiftCards", icon: Gift },
    { label: "Redeem Rewards", page: "AdminRedeemRewards", icon: Gift },
    { label: "Order History", page: "AdminOrderHistory", icon: ClipboardList },
    { label: "Limited Edition", page: "AdminLimited", icon: Sparkles },
    { label: "AI Manager", page: "StoreManager", icon: Bot },
    { label: "Manage Admins", page: "AdminManageAdmins", icon: ShieldCheck },
    { label: "Receipts", page: "AdminReceipts", icon: Receipt },
    { label: "Wallets", page: "AdminWallets", icon: Wallet },
    { label: "Stock Alerts", page: "AdminStockAlerts", icon: TrendingUp },
    { label: "Birthday Verify", page: "AdminBirthdaySubmissions", icon: Cake },
    { label: "Notifications", page: "AdminNotifications", icon: Bell },
    { label: "Driver", page: "Driver", icon: Truck },
  ];

  return (
    <div className="min-h-screen bg-stone-50">
      {isAdmin && <AdminOrderNotifier />}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-stone-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to={createPageUrl("Store")} className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-stone-900 rounded-lg flex items-center justify-center">
                <ShoppingBag className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-stone-900 text-lg tracking-tight">Try Market</span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    currentPageName === item.page
                      ? "bg-stone-100 text-stone-900"
                      : "text-stone-500 hover:text-stone-900 hover:bg-stone-50"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              {isAdmin &&
                adminItems.map((item) => (
                  <Link
                    key={item.page}
                    to={createPageUrl(item.page)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                      currentPageName === item.page
                        ? "bg-stone-100 text-stone-900"
                        : "text-stone-500 hover:text-stone-900 hover:bg-stone-50"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2">
              {isAdmin && <NotificationBell />}
              {!isAdmin && user?.email && <CustomerNotificationBell email={user.email} />}
              <Link to={createPageUrl("Cart")} className="relative">
                <Button variant="ghost" size="icon" className="rounded-xl relative">
                  <ShoppingCart className="w-5 h-5 text-stone-700" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-stone-900 text-white text-xs rounded-full flex items-center justify-center font-medium">
                      {cartCount}
                    </span>
                  )}
                </Button>
              </Link>

              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-xl">
                      <div className="w-8 h-8 bg-stone-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-stone-600" />
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 rounded-xl">
                    <div className="px-3 py-2">
                      <p className="font-medium text-sm">{user.full_name || "User"}</p>
                      <p className="text-xs text-stone-500">{user.email}</p>
                      {isAdmin && (
                        <Badge className="mt-1 bg-stone-900 text-white text-xs">Admin</Badge>
                      )}
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => navigate(createPageUrl("Orders"))}
                      className="cursor-pointer"
                    >
                      <Package className="w-4 h-4 mr-2" /> My Orders
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => db.auth.logout()}
                      className="cursor-pointer text-red-600"
                    >
                      <LogOut className="w-4 h-4 mr-2" /> Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-xl text-sm"
                  onClick={() => db.auth.redirectToLogin()}
                >
                  <LogIn className="w-4 h-4 mr-2" /> Sign In
                </Button>
              )}

              {/* Mobile menu toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden rounded-xl"
                onClick={() => setMobileOpen(!mobileOpen)}
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile Nav */}
          {mobileOpen && (
            <div className="md:hidden border-t border-stone-100 py-3 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium ${
                    currentPageName === item.page
                      ? "bg-stone-100 text-stone-900"
                      : "text-stone-500"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              ))}
              {isAdmin && (
                <>
                  <div className="border-t border-stone-100 my-2" />
                  {adminItems.map((item) => (
                    <Link
                      key={item.page}
                      to={createPageUrl(item.page)}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium ${
                        currentPageName === item.page
                          ? "bg-stone-100 text-stone-900"
                          : "text-stone-500"
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </Link>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </nav>

      <main>{children}</main>
    </div>
  );
}

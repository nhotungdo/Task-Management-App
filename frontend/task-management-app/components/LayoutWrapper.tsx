/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Home, 
  FolderKanban, 
  CheckSquare, 
  CalendarDays, 
  BarChart2, 
  MessageCircle, 
  Users, 
  Settings,
  Bell,
  Search,
  ChevronDown,
  Briefcase,
  LogOut,
  HelpCircle,
  Layers
} from "lucide-react";
import api from "@/lib/api";

interface UserData {
  fullName?: string;
  email?: string;
  role?: string;
}

const NAV_ITEMS = [
  { href: "/", label: "Tổng quan", icon: Home },
  { href: "/workspaces", label: "Dự án", icon: FolderKanban },
  { href: "/tasks", label: "My Tasks", icon: CheckSquare },
  { href: "/calendar", label: "Lịch", icon: CalendarDays },
  { href: "/analytics", label: "Báo cáo", icon: BarChart2 },
  { href: "/messages", label: "Chat", icon: MessageCircle },
  { href: "/team", label: "Nhóm", icon: Users },
];

const BOTTOM_ITEMS = [
  { href: "/settings", label: "Cài đặt", icon: Settings },
];

function NavItem({ href, label, icon: Icon, active }: { href: string; label: string; icon: React.ElementType; active: boolean }) {
  return (
    <Link
      href={href}
      className={`gp-nav-item ${active ? "active" : ""}`}
    >
      <Icon size={16} strokeWidth={active ? 2.5 : 2} />
      <span>{label}</span>
      {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-300" />}
    </Link>
  );
}

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notifCount] = useState(3);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifMenuOpen, setNotifMenuOpen] = useState(false);

  const isAuthPage = pathname === "/login" || pathname === "/register" || pathname === "/welcome";

  useEffect(() => {
    if (!isAuthPage) {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/welcome");
        setIsLoading(false);
      } else {
        api.get("/Auth/me")
          .then(res => { setUser(res.data); })
          .catch(() => {
            localStorage.removeItem("token");
            router.push("/login");
          })
          .finally(() => { setIsLoading(false); });
      }
    } else {
      setIsLoading(false);
    }
  }, [pathname, router, isAuthPage]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  if (isAuthPage) return <>{children}</>;

  if (isLoading) {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--content-bg)" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid #e2e8f0", borderTopColor: "#0052cc", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
          <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>Đang tải...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const initials = user?.fullName
    ? user.fullName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? "U";

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "var(--content-bg)" }}>

      {/* ── Sidebar ── */}
      <aside className="gp-sidebar" style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>

        {/* Logo */}
        <div style={{ padding: "0 16px", height: 52, display: "flex", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: "linear-gradient(135deg, #0052cc, #0073e6)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Layers size={15} color="#fff" strokeWidth={2.5} />
            </div>
            <span style={{ fontSize: 16, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>
              DoneIt<span style={{ color: "#4da6ff" }}>.</span>
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
          
          {/* Main section */}
          <div style={{ padding: "4px 0 8px" }}>
            {NAV_ITEMS.map(item => (
              <NavItem
                key={item.href}
                href={item.href}
                label={item.label}
                icon={item.icon}
                active={item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)}
              />
            ))}
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "4px 16px 8px" }} />

          {/* Workspaces section */}
          <div style={{ padding: "0 8px" }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(143,163,192,0.6)", textTransform: "uppercase", letterSpacing: "0.08em", padding: "4px 12px 6px" }}>Dự án gần đây</p>
            <NavItem href="/workspaces" label="Tất cả dự án" icon={Briefcase} active={false} />
          </div>
        </nav>

        {/* Bottom section */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "8px 0" }}>
          {BOTTOM_ITEMS.map(item => (
            <NavItem
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              active={pathname.startsWith(item.href)}
            />
          ))}
          <button
            onClick={handleLogout}
            className="gp-nav-item"
            style={{ width: "100%", cursor: "pointer", border: "none", background: "none", textAlign: "left" }}
          >
            <LogOut size={16} strokeWidth={2} />
            <span>Đăng xuất</span>
          </button>
        </div>

        {/* User info */}
        <div
          style={{ padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 10, cursor: "pointer", position: "relative" }}
          onClick={() => setUserMenuOpen(v => !v)}
        >
          <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg, #667eea, #764ba2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#c8d6e8", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user?.fullName || user?.email || "Người dùng"}
            </p>
            <p style={{ fontSize: 10, color: "#6b85a3", margin: 0 }}>{user?.role || "Member"}</p>
          </div>
          <ChevronDown size={13} color="#6b85a3" />

          {/* User menu dropdown */}
          {userMenuOpen && (
            <div
              style={{ position: "absolute", bottom: "calc(100% + 4px)", left: 8, right: 8, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 6, boxShadow: "0 8px 24px rgba(0,0,0,0.15)", zIndex: 100, overflow: "hidden" }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ padding: "10px 14px", borderBottom: "1px solid #f1f5f9" }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: "#172b4d", margin: 0 }}>{user?.fullName || "Người dùng"}</p>
                <p style={{ fontSize: 11, color: "#5e6c84", margin: "2px 0 0" }}>{user?.email}</p>
              </div>
              <Link href="/settings" style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 14px", fontSize: 13, color: "#172b4d", textDecoration: "none" }}
                onClick={() => setUserMenuOpen(false)}>
                <Settings size={14} /> Cài đặt tài khoản
              </Link>
              <button onClick={handleLogout}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "9px 14px", fontSize: 13, color: "#dc3545", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
                <LogOut size={14} /> Đăng xuất
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ── Main Area ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        
        {/* Top Bar */}
        <header style={{
          height: "var(--topbar-height)",
          background: "var(--topbar-bg)",
          borderBottom: "1px solid var(--topbar-border)",
          display: "flex",
          alignItems: "center",
          padding: "0 20px",
          gap: 12,
          flexShrink: 0,
          zIndex: 10,
        }}>
          
          {/* Search */}
          <div style={{ flex: 1, maxWidth: 340, position: "relative" }}>
            <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-tertiary)", pointerEvents: "none" }} />
            <input
              type="text"
              placeholder="Tìm kiếm task, dự án..."
              style={{ width: "100%", padding: "6px 10px 6px 32px", border: "1px solid var(--border)", borderRadius: 4, fontSize: 13, color: "var(--text-primary)", background: "#f8f9fb", outline: "none" }}
              onFocus={e => { e.target.style.borderColor = "#0052cc"; e.target.style.background = "#fff"; e.target.style.boxShadow = "0 0 0 2px rgba(0,82,204,0.12)"; }}
              onBlur={e => { e.target.style.borderColor = "var(--border)"; e.target.style.background = "#f8f9fb"; e.target.style.boxShadow = "none"; }}
            />
          </div>

          <div style={{ flex: 1 }} />

          {/* Right icons */}
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            
            {/* Notifications */}
            <div style={{ position: "relative" }}>
              <button 
                onClick={() => setNotifMenuOpen(!notifMenuOpen)}
                style={{ width: 34, height: 34, borderRadius: 6, border: "none", background: notifMenuOpen ? "#f1f5f9" : "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", position: "relative", color: "var(--text-secondary)" }}
                onMouseEnter={e => (!notifMenuOpen && (e.currentTarget.style.background = "#f1f5f9"))}
                onMouseLeave={e => (!notifMenuOpen && (e.currentTarget.style.background = "none"))}>
                <Bell size={17} />
                {notifCount > 0 && (
                  <span style={{ position: "absolute", top: 5, right: 5, width: 8, height: 8, background: "#ef4444", borderRadius: "50%", border: "2px solid #fff" }} />
                )}
              </button>

              {notifMenuOpen && (
                <div 
                  style={{ position: "absolute", top: "calc(100% + 8px)", right: -50, width: 340, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, boxShadow: "0 10px 30px rgba(0,0,0,0.1)", zIndex: 100, overflow: "hidden", display: "flex", flexDirection: "column" }}
                  onClick={e => e.stopPropagation()}
                >
                  <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f8fafc" }}>
                    <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Thông báo</h4>
                    <button style={{ border: "none", background: "none", color: "#3b82f6", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Đánh dấu đã đọc</button>
                  </div>
                  <div style={{ maxHeight: 360, overflowY: "auto", padding: "8px 0" }}>
                    <div style={{ padding: "12px 20px", display: "flex", gap: 12, background: "#f0f9ff", borderLeft: "3px solid #3b82f6", cursor: "pointer", transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "#e0f2fe"} onMouseLeave={e => e.currentTarget.style.background = "#f0f9ff"}>
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#bae6fd", color: "#0369a1", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontWeight: 700, fontSize: 12 }}>AD</div>
                      <div>
                        <p style={{ margin: 0, fontSize: 13, color: "#334155", lineHeight: 1.4 }}><strong>Admin</strong> đã giao cho bạn task <span style={{ fontWeight: 600, color: "#0f172a" }}>"Thiết kế UI/UX"</span></p>
                        <p style={{ margin: "4px 0 0", fontSize: 11, color: "#64748b" }}>10 phút trước</p>
                      </div>
                    </div>
                    <div style={{ padding: "12px 20px", display: "flex", gap: 12, cursor: "pointer", transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#fecaca", color: "#b91c1c", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontWeight: 700, fontSize: 12 }}>SYS</div>
                      <div>
                        <p style={{ margin: 0, fontSize: 13, color: "#334155", lineHeight: 1.4 }}>Dự án <span style={{ fontWeight: 600, color: "#0f172a" }}>"Website Thương mại điện tử"</span> sắp đến hạn.</p>
                        <p style={{ margin: "4px 0 0", fontSize: 11, color: "#64748b" }}>2 giờ trước</p>
                      </div>
                    </div>
                    <div style={{ padding: "12px 20px", display: "flex", gap: 12, cursor: "pointer", transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#bbf7d0", color: "#15803d", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontWeight: 700, fontSize: 12 }}>HQ</div>
                      <div>
                        <p style={{ margin: 0, fontSize: 13, color: "#334155", lineHeight: 1.4 }}><strong>Hải Quân</strong> đã bình luận trong task <span style={{ fontWeight: 600, color: "#0f172a" }}>"Fix bug đăng nhập"</span></p>
                        <p style={{ margin: "4px 0 0", fontSize: 11, color: "#64748b" }}>Hôm qua lúc 15:30</p>
                      </div>
                    </div>
                  </div>
                  <div style={{ padding: "12px", borderTop: "1px solid #f1f5f9", textAlign: "center" }}>
                    <a href="/settings" style={{ color: "#64748b", fontSize: 12, fontWeight: 600, textDecoration: "none" }}>Xem tất cả thông báo</a>
                  </div>
                </div>
              )}
            </div>

            {/* Help */}
            <button style={{ width: 34, height: 34, borderRadius: 6, border: "none", background: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--text-secondary)" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#f1f5f9")}
              onMouseLeave={e => (e.currentTarget.style.background = "none")}>
              <HelpCircle size={17} />
            </button>

            {/* Divider */}
            <div style={{ width: 1, height: 20, background: "var(--border)", margin: "0 4px" }} />

            {/* User avatar */}
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg, #667eea, #764ba2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff", cursor: "pointer" }}
              title={user?.fullName || user?.email}>
              {initials}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          {children}
        </main>
      </div>
    </div>
  );
}

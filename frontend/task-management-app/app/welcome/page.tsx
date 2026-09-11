import React from "react";
import Link from "next/link";
import {
  BarChart2, GitBranch, LayoutGrid, Users, CheckCircle,
  ArrowRight, Clock, Layers, Shield, Zap, Globe
} from "lucide-react";

const FEATURES = [
  {
    icon: BarChart2,
    title: "Gantt Chart nâng cao",
    desc: "Trực quan hóa tiến độ dự án với thanh Gantt tương tác, hỗ trợ phụ thuộc và kéo thả.",
    color: "#0052cc",
    bg: "#e6f0ff",
  },
  {
    icon: LayoutGrid,
    title: "Kanban Board",
    desc: "Quản lý luồng công việc trực quan với bảng Kanban hỗ trợ kéo thả linh hoạt.",
    color: "#059669",
    bg: "#e6faf3",
  },
  {
    icon: Clock,
    title: "Time Tracking",
    desc: "Theo dõi thời gian làm việc thực tế so với ước tính, báo cáo theo nhóm và cá nhân.",
    color: "#d97706",
    bg: "#fff8e6",
  },
  {
    icon: GitBranch,
    title: "Task Dependencies",
    desc: "Thiết lập quan hệ phụ thuộc FS/SS/FF/SF giữa các task, tự động phát hiện vòng lặp.",
    color: "#7c3aed",
    bg: "#f3f0ff",
  },
  {
    icon: Users,
    title: "Quản lý nhóm",
    desc: "Phân công task, theo dõi workload, xem báo cáo năng suất từng thành viên.",
    color: "#dc2626",
    bg: "#fff1f0",
  },
  {
    icon: Globe,
    title: "Cộng tác thời gian thực",
    desc: "Cập nhật tức thì qua SignalR, bình luận, chat nhóm ngay trên giao diện dự án.",
    color: "#0891b2",
    bg: "#e0f7fa",
  },
];

const STATS = [
  { value: "2,000+", label: "Đội nhóm đang dùng" },
  { value: "50K+", label: "Task hoàn thành / tháng" },
  { value: "99.9%", label: "Uptime đảm bảo" },
  { value: "4.9★", label: "Đánh giá người dùng" },
];

export default function WelcomePage() {
  return (
    <div style={{ minHeight: "100vh", fontFamily: "'Inter', sans-serif", background: "#fff", color: "#172b4d", overflowX: "hidden" }}>

      {/* ── Navigation ── */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, background: "rgba(255,255,255,0.95)", backdropFilter: "blur(10px)", borderBottom: "1px solid #e2e8f0", zIndex: 100 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          
          <Link href="/welcome" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <div style={{ width: 30, height: 30, borderRadius: 7, background: "linear-gradient(135deg, #0052cc, #0073e6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Layers size={16} color="#fff" strokeWidth={2.5} />
            </div>
            <span style={{ fontSize: 17, fontWeight: 800, color: "#172b4d", letterSpacing: "-0.03em" }}>
              DoneIt<span style={{ color: "#0052cc" }}>.</span>
            </span>
          </Link>

          <div style={{ display: "flex", alignItems: "center", gap: 28, fontSize: 14, fontWeight: 500, color: "#5e6c84" }}>
            <a href="#features" style={{ color: "#5e6c84", textDecoration: "none" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#0052cc")}
              onMouseLeave={e => (e.currentTarget.style.color = "#5e6c84")}>Tính năng</a>
            <a href="#solutions" style={{ color: "#5e6c84", textDecoration: "none" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#0052cc")}
              onMouseLeave={e => (e.currentTarget.style.color = "#5e6c84")}>Giải pháp</a>
            <a href="#pricing" style={{ color: "#5e6c84", textDecoration: "none" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#0052cc")}
              onMouseLeave={e => (e.currentTarget.style.color = "#5e6c84")}>Bảng giá</a>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Link href="/login" style={{ padding: "7px 16px", fontSize: 14, fontWeight: 600, color: "#172b4d", textDecoration: "none", borderRadius: 4 }}
              onMouseEnter={e => (e.currentTarget.style.background = "#f1f5f9")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
              Đăng nhập
            </Link>
            <Link href="/register" style={{ padding: "7px 16px", fontSize: 14, fontWeight: 600, color: "#fff", background: "#0052cc", borderRadius: 4, textDecoration: "none", transition: "background 0.15s" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#0047b3")}
              onMouseLeave={e => (e.currentTarget.style.background = "#0052cc")}>
              Bắt đầu miễn phí
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ paddingTop: 120, paddingBottom: 80, background: "linear-gradient(180deg, #f8faff 0%, #fff 100%)", position: "relative", overflow: "hidden" }}>
        {/* BG decoration */}
        <div style={{ position: "absolute", top: 0, right: 0, width: 600, height: 600, background: "radial-gradient(circle at 60% 20%, rgba(0,82,204,0.06) 0%, transparent 60%)", pointerEvents: "none" }} />

        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "center" }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", background: "#e6f0ff", borderRadius: 4, marginBottom: 20 }}>
              <Zap size={12} color="#0052cc" />
              <span style={{ fontSize: 12, fontWeight: 700, color: "#0052cc" }}>Phiên bản 2.0 — Gantt Chart Pro</span>
            </div>

            <h1 style={{ fontSize: 44, fontWeight: 900, color: "#172b4d", lineHeight: 1.15, marginBottom: 18, letterSpacing: "-0.03em" }}>
              Phần mềm quản lý<br />
              dự án <span style={{ color: "#0052cc" }}>chuyên nghiệp</span>
            </h1>

            <p style={{ fontSize: 16, color: "#5e6c84", lineHeight: 1.7, marginBottom: 32, maxWidth: 480 }}>
              Gantt Chart tương tác, Kanban kéo thả, theo dõi thời gian và cộng tác thời gian thực — tất cả trong một nền tảng duy nhất.
            </p>

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Link href="/register" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 24px", background: "#0052cc", color: "#fff", borderRadius: 4, fontSize: 15, fontWeight: 700, textDecoration: "none", transition: "background 0.15s" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#0047b3")}
                onMouseLeave={e => (e.currentTarget.style.background = "#0052cc")}>
                Dùng thử miễn phí <ArrowRight size={16} />
              </Link>
              <span style={{ fontSize: 13, color: "#97a0af" }}>Không cần thẻ tín dụng</span>
            </div>

            {/* Trust badges */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 28 }}>
              <Shield size={14} color="#059669" />
              <span style={{ fontSize: 12, color: "#5e6c84" }}>SSL bảo mật • JWT Auth • Dữ liệu được mã hóa</span>
            </div>
          </div>

          {/* App Mockup */}
          <div style={{ position: "relative" }}>
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, boxShadow: "0 20px 60px rgba(0,0,0,0.12)", overflow: "hidden" }}>
              {/* Mock top bar */}
              <div style={{ height: 40, background: "#1e2a3b", display: "flex", alignItems: "center", padding: "0 16px", gap: 8 }}>
                {["#ff5f57","#febc2e","#28c840"].map((c,i) => (
                  <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />
                ))}
                <div style={{ flex: 1, height: 20, marginLeft: 12, background: "rgba(255,255,255,0.08)", borderRadius: 4 }} />
              </div>
              {/* Mock app body */}
              <div style={{ display: "flex" }}>
                {/* Mock sidebar */}
                <div style={{ width: 160, background: "#1e2a3b", padding: "12px 0", minHeight: 280 }}>
                  {["Tổng quan","Dự án","My Tasks","Gantt","Báo cáo"].map((item, i) => (
                    <div key={item} style={{ padding: "7px 16px", fontSize: 11, color: i === 2 ? "#fff" : "#6b85a3", background: i === 2 ? "#0052cc" : "transparent", margin: "1px 8px", borderRadius: 4 }}>
                      {item}
                    </div>
                  ))}
                </div>
                {/* Mock content */}
                <div style={{ flex: 1, padding: 14, background: "#f8f9fb" }}>
                  <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                    {[
                      { color: "#0052cc", w: "45%" },
                      { color: "#10b981", w: "28%" },
                      { color: "#f59e0b", w: "60%" },
                    ].map((bar, i) => (
                      <div key={i} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 4, padding: "8px 10px", flex: 1 }}>
                        <div style={{ height: 3, background: bar.color, borderRadius: 2, width: bar.w, marginBottom: 6 }} />
                        <div style={{ height: 6, background: "#f1f5f9", borderRadius: 2, marginBottom: 4 }} />
                        <div style={{ height: 6, background: "#f1f5f9", borderRadius: 2, width: "70%" }} />
                      </div>
                    ))}
                  </div>
                  {/* Gantt mock */}
                  {[0.7, 0.4, 0.9, 0.55, 0.3].map((w, i) => (
                    <div key={i} style={{ height: 26, marginBottom: 3, display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 60, height: 8, background: "#e2e8f0", borderRadius: 2 }} />
                      <div style={{ flex: 1, height: 12, background: "#e8edf3", borderRadius: 2, position: "relative", overflow: "hidden" }}>
                        <div style={{ position: "absolute", left: `${i*8}%`, width: `${w*60}%`, height: "100%", background: ["#0052cc","#10b981","#f59e0b","#7c3aed","#dc2626"][i], borderRadius: 2, opacity: 0.8 }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Floating badge */}
            <div style={{ position: "absolute", bottom: -16, left: -16, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 14px", boxShadow: "0 4px 16px rgba(0,0,0,0.1)", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "#e6faf3", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CheckCircle size={18} color="#059669" />
              </div>
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: "#172b4d", margin: 0 }}>3 task hoàn thành</p>
                <p style={{ fontSize: 11, color: "#5e6c84", margin: 0 }}>Hôm nay, 09:30 AM</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section style={{ background: "#1e2a3b", padding: "40px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24 }}>
          {STATS.map(s => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <p style={{ fontSize: 32, fontWeight: 900, color: "#fff", margin: "0 0 4px", letterSpacing: "-0.03em" }}>{s.value}</p>
              <p style={{ fontSize: 13, color: "#6b85a3", margin: 0 }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" style={{ padding: "80px 24px", background: "#fff" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <div style={{ display: "inline-block", padding: "3px 10px", background: "#e6f0ff", borderRadius: 4, fontSize: 12, fontWeight: 700, color: "#0052cc", marginBottom: 16 }}>
              Tính năng
            </div>
            <h2 style={{ fontSize: 36, fontWeight: 800, color: "#172b4d", marginBottom: 12, letterSpacing: "-0.02em" }}>Mọi thứ bạn cần</h2>
            <p style={{ fontSize: 16, color: "#5e6c84", maxWidth: 560, margin: "0 auto" }}>
              Một nền tảng đầy đủ tính năng để quản lý dự án từ lập kế hoạch đến hoàn thành.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
            {FEATURES.map(f => (
              <div key={f.title} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: "20px 22px", transition: "box-shadow 0.2s, border-color 0.2s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(0,82,204,0.1)"; (e.currentTarget as HTMLElement).style.borderColor = "#0052cc50"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "none"; (e.currentTarget as HTMLElement).style.borderColor = "#e2e8f0"; }}>
                <div style={{ width: 40, height: 40, borderRadius: 8, background: f.bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                  <f.icon size={20} color={f.color} />
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "#172b4d", marginBottom: 8 }}>{f.title}</h3>
                <p style={{ fontSize: 13, color: "#5e6c84", lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section id="pricing" style={{ background: "#f4f5f7", padding: "80px 24px", textAlign: "center" }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <h2 style={{ fontSize: 36, fontWeight: 800, color: "#172b4d", marginBottom: 12, letterSpacing: "-0.02em" }}>
            Sẵn sàng bắt đầu?
          </h2>
          <p style={{ fontSize: 16, color: "#5e6c84", marginBottom: 32 }}>
            Tạo tài khoản miễn phí ngay hôm nay. Không cần thẻ tín dụng.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
            <Link href="/register" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 28px", background: "#0052cc", color: "#fff", borderRadius: 4, fontSize: 15, fontWeight: 700, textDecoration: "none" }}>
              Bắt đầu miễn phí <ArrowRight size={16} />
            </Link>
            <Link href="/login" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 28px", background: "#fff", color: "#172b4d", border: "1px solid #e2e8f0", borderRadius: 4, fontSize: 15, fontWeight: 600, textDecoration: "none" }}>
              Đăng nhập
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ background: "#1e2a3b", padding: "24px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 26, height: 26, borderRadius: 6, background: "linear-gradient(135deg, #0052cc, #0073e6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Layers size={13} color="#fff" strokeWidth={2.5} />
            </div>
            <span style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}>DoneIt<span style={{ color: "#4da6ff" }}>.</span></span>
          </div>
          <p style={{ fontSize: 12, color: "#6b85a3", margin: 0 }}>
            © {new Date().getFullYear()} DoneIt. Phần mềm quản lý dự án hiện đại.
          </p>
          <div style={{ display: "flex", gap: 20, fontSize: 12, color: "#6b85a3" }}>
            <a href="#" style={{ color: "#6b85a3", textDecoration: "none" }}>Điều khoản</a>
            <a href="#" style={{ color: "#6b85a3", textDecoration: "none" }}>Bảo mật</a>
            <a href="#" style={{ color: "#6b85a3", textDecoration: "none" }}>Liên hệ</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

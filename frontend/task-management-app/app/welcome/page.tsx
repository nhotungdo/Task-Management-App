/* eslint-disable @next/next/no-img-element */
import React from "react";
import Link from "next/link";
import { 
  CheckCircle2, 
  BarChart3, 
  MessageCircle, 
  LayoutGrid, 
  ChevronRight,
  ShieldCheck,
  Zap,
  Users
} from "lucide-react";

export default function WelcomePage() {
  return (
    <div className="min-h-screen bg-white font-sans overflow-x-hidden selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-50 border-b border-slate-100 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center">
              <CheckCircle2 size={18} className="text-white" />
            </div>
            <span className="text-xl font-black tracking-tight text-slate-900">DoneIt<span className="text-indigo-600">.</span></span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#features" className="hover:text-indigo-600 transition-colors">Tính năng</a>
            <a href="#solutions" className="hover:text-indigo-600 transition-colors">Giải pháp</a>
            <a href="#pricing" className="hover:text-indigo-600 transition-colors">Bảng giá</a>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-bold text-slate-700 hover:text-indigo-600 transition-colors hidden sm:block">
              Đăng nhập
            </Link>
            <Link href="/register" className="px-5 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-full hover:bg-slate-800 transition-all hover:shadow-lg hover:shadow-slate-900/20 active:scale-95">
              Bắt đầu miễn phí
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6 relative">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-100/40 via-white to-white"></div>
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
          
          <div className="flex-1 text-center lg:text-left z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-bold mb-6">
              <Zap size={14} /> Phiên bản 2.0 đã ra mắt
            </div>
            <h1 className="text-5xl lg:text-7xl font-black text-slate-900 leading-[1.1] mb-6 tracking-tight">
              Quản lý dự án <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-500">
                thông minh hơn.
              </span>
            </h1>
            <p className="text-lg text-slate-600 mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
              Kiểm soát tiến độ, phân công công việc và kết nối đội ngũ của bạn theo thời gian thực. Tất cả trên một nền tảng duy nhất, thiết kế tối giản và sức mạnh vượt trội.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
              <Link href="/register" className="px-8 py-4 bg-indigo-600 text-white text-base font-bold rounded-full hover:bg-indigo-700 transition-all hover:shadow-xl hover:shadow-indigo-600/30 flex items-center gap-2 active:scale-95 w-full sm:w-auto justify-center">
                Tạo tài khoản miễn phí <ChevronRight size={18} />
              </Link>
              <span className="text-sm text-slate-500 font-medium">Không cần thẻ tín dụng</span>
            </div>
          </div>
          
          <div className="flex-1 relative w-full max-w-2xl lg:max-w-none">
            {/* Decorative background blobs */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-violet-200/40 to-indigo-200/40 blur-3xl rounded-full -z-10"></div>
            
            {/* Dashboard Mockup Image */}
            <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-indigo-900/10 border border-white/50 backdrop-blur-sm bg-white/40 p-2 transform transition-transform hover:-translate-y-2 duration-700">
              <img src="/hero-mockup.png" alt="DoneIt Dashboard Preview" className="w-full h-auto rounded-2xl border border-slate-100" />
            </div>
          </div>

        </div>
      </section>

      {/* Trusted By Section */}
      <section className="py-10 border-y border-slate-100 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-sm font-bold text-slate-400 mb-6 uppercase tracking-wider">Được tin dùng bởi các đội ngũ hàng đầu</p>
          <div className="flex flex-wrap justify-center items-center gap-12 opacity-60 grayscale">
            {/* Placeholder company logos (text for now) */}
            <h3 className="text-xl font-black font-serif">Acme Corp</h3>
            <h3 className="text-xl font-black tracking-tighter">GLOBAL<span className="font-light">SYS</span></h3>
            <h3 className="text-xl font-black italic">NextGen</h3>
            <h3 className="text-xl font-bold uppercase tracking-widest">Stratos</h3>
            <h3 className="text-xl font-black text-slate-800">Tech<span className="text-indigo-600">Nova</span></h3>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-4xl font-black text-slate-900 mb-6">Tại sao chọn DoneIt?</h2>
            <p className="text-lg text-slate-600 font-medium leading-relaxed">
              Khác với những phần mềm cồng kềnh, DoneIt tập trung vào trải nghiệm cốt lõi: Nhanh chóng, trực quan và luôn cập nhật theo thời gian thực (Real-time).
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 hover:border-indigo-100 transition-colors group">
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-6 text-indigo-600 group-hover:scale-110 transition-transform">
                <LayoutGrid size={28} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Kanban Kéo Thả</h3>
              <p className="text-slate-600 font-medium leading-relaxed">
                Di chuyển công việc linh hoạt qua các trạng thái bằng thao tác vuốt kéo (Drag & Drop) siêu mượt. Lưu trạng thái ngay tức thì.
              </p>
            </div>

            <div className="bg-indigo-50 rounded-3xl p-8 border border-indigo-100 hover:border-indigo-200 transition-colors group">
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-6 text-indigo-600 group-hover:scale-110 transition-transform">
                <MessageCircle size={28} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Chat Real-time (SignalR)</h3>
              <p className="text-slate-600 font-medium leading-relaxed">
                Trao đổi công việc trực tiếp không độ trễ. Nhắn tin đến đâu, nổi lên màn hình đến đó mà không cần tải lại trang.
              </p>
            </div>

            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 hover:border-indigo-100 transition-colors group">
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-6 text-indigo-600 group-hover:scale-110 transition-transform">
                <BarChart3 size={28} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Thống kê đa chiều</h3>
              <p className="text-slate-600 font-medium leading-relaxed">
                Nắm bắt ngay lập tức 100% dữ liệu tiến độ, nhân sự thông qua các Dashboard Chart tương tác hiện đại.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Split Feature Section (GanttPRO style) */}
      <section className="py-24 px-6 bg-slate-900 text-white overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1">
            <h2 className="text-4xl font-black mb-6 leading-tight">Mọi dự án nằm gọn<br/>trong một màn hình.</h2>
            <p className="text-slate-400 text-lg mb-8 font-medium leading-relaxed">
              Bạn không cần phải chuyển đổi qua lại giữa hàng tá ứng dụng. 
              Từ lịch làm việc (Calendar), theo dõi tiến trình cho đến họp nhóm, DoneIt gộp tất cả lại với thiết kế thanh lịch tối đa.
            </p>
            <ul className="space-y-4 mb-8">
              <li className="flex items-center gap-3 text-slate-300 font-medium">
                <ShieldCheck className="text-indigo-400" size={24} /> Bảo mật dữ liệu tuyệt đối (JWT Auth).
              </li>
              <li className="flex items-center gap-3 text-slate-300 font-medium">
                <Users className="text-indigo-400" size={24} /> Phân quyền linh hoạt theo Workspace.
              </li>
            </ul>
            <Link href="/register" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-slate-900 text-base font-bold rounded-full hover:bg-indigo-50 transition-colors">
              Khám phá ngay <ChevronRight size={18} />
            </Link>
          </div>
          <div className="flex-1 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 blur-3xl opacity-30 rounded-full"></div>
            {/* Using the same mockup for visual weight */}
            <img src="/hero-mockup.png" alt="DoneIt System" className="relative rounded-2xl shadow-2xl border border-slate-700/50 -rotate-2 hover:rotate-0 transition-transform duration-700" />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6 bg-white text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl lg:text-5xl font-black text-slate-900 mb-6">Sẵn sàng để tăng tốc?</h2>
          <p className="text-lg text-slate-600 mb-10 font-medium">
            Hàng ngàn đội ngũ đã tiết kiệm được hàng trăm giờ làm việc mỗi tháng. Bây giờ đến lượt bạn.
          </p>
          <Link href="/register" className="px-10 py-5 bg-indigo-600 text-white text-lg font-bold rounded-full hover:bg-indigo-700 transition-all hover:shadow-xl hover:shadow-indigo-600/30 inline-block active:scale-95">
            Bắt đầu miễn phí ngay hôm nay
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-50 border-t border-slate-200 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center">
              <CheckCircle2 size={12} className="text-white" />
            </div>
            <span className="text-lg font-black text-slate-900">DoneIt<span className="text-indigo-600">.</span></span>
          </div>
          <p className="text-slate-500 text-sm font-medium">
            © {new Date().getFullYear()} DoneIt Inc. Bản quyền thuộc về bạn.
          </p>
        </div>
      </footer>

    </div>
  );
}

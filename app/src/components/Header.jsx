export default function Header({ email, onOpenAccounts, onLogout }) {
  return (
    <header className="ha-card p-4 sm:p-5 flex flex-col md:flex-row justify-between items-center gap-4 border-l-4 border-l-amber-500">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500 border border-amber-500/20">
          <i className="fa-solid fa-receipt text-2xl"></i>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">NERP 경비 및 예산 관리 시스템</h1>
            <span className="px-2 py-0.5 text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full font-mono-num">v4 React</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">실시간 부가세 자동 연산 • 법인카드 전표 파싱 • 예산 실시간 시뮬레이션</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full md:w-auto justify-end">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-lg text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse"></span>
          <span>Supabase 연결됨 · {email}</span>
        </div>
        <button onClick={onOpenAccounts} className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-2 transition">
          <i className="fa-solid fa-sliders text-amber-400"></i> 계정/예산 설정
        </button>
        <button onClick={onLogout} className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs font-semibold transition">
          로그아웃
        </button>
      </div>
    </header>
  )
}

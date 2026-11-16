import { formatKrw } from '../lib/format'

export default function AccountTiles({ accounts, expenses }) {
  return (
    <section>
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-300">
          <i className="fa-solid fa-chart-pie text-amber-500"></i>
          <span>계정별 예산 및 실시간 사용 현황</span>
        </div>
        <span className="text-xs text-slate-500 font-mono-num">{accounts.length}개 계정 등록됨</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {accounts.map((acc) => (
          <AccountTile key={acc.id} acc={acc} expenses={expenses.filter((e) => e.accountId === acc.id)} />
        ))}
      </div>
    </section>
  )
}

// 예산 기준에 따라 한 전표가 예산에서 차감하는 금액
export const consumedBy = (acc, e) => (acc.budgetIncludesVat ? e.totalAmount || 0 : e.deductAmount || 0)

function AccountTile({ acc, expenses }) {
  const reflected = expenses.filter((e) => e.budgetReflected).reduce((s, e) => s + consumedBy(acc, e), 0)
  const pending = expenses.filter((e) => !e.budgetReflected).reduce((s, e) => s + consumedBy(acc, e), 0)

  const remaining = acc.limit - reflected
  const limit = acc.limit || 1
  const reflectedPct = Math.min(Math.round((reflected / limit) * 100) || 0, 100)
  const pendingPct = Math.min(Math.round(((reflected + pending) / limit) * 100) || 0, 100)

  let barColor = 'bg-emerald-500'
  if (reflectedPct >= 90) barColor = 'bg-red-500'
  else if (reflectedPct >= 75) barColor = 'bg-amber-500'

  return (
    <div className="ha-card p-4 space-y-3 relative overflow-hidden border-t-2 border-t-amber-500">
      <div className="flex items-start justify-between">
        <div>
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">코드: {acc.code}</span>
          <span className="text-[10px] font-mono text-slate-500 block">부서: {acc.deptCode || '미입력'} · 직무: {acc.jobCode || '미입력'}</span>
          <span className="text-[10px] font-mono text-slate-500 block">예산 기준: {acc.budgetIncludesVat ? '부가세 포함' : '부가세 미포함'}</span>
          <h3 className="font-bold text-sm text-white">{acc.name}</h3>
        </div>
        <span className="text-xs font-bold font-mono-num px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
          한도 {formatKrw(acc.limit)}
        </span>
      </div>

      <div className="pt-1">
        <div className="text-[11px] text-slate-400">현재 반영 잔여 예산</div>
        <div className={`text-xl font-extrabold font-mono-num ${remaining < 0 ? 'text-red-400' : 'text-amber-400'}`}>
          {formatKrw(remaining)}
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-[11px] font-mono-num">
          <span className="text-slate-400">소진율: <strong className="text-white">{reflectedPct}%</strong></span>
          <span className="text-slate-500">미반영 포함: {pendingPct}%</span>
        </div>
        <div className="ha-progress-container">
          <div className="ha-progress-pending bg-amber-500" style={{ width: `${pendingPct}%` }}></div>
          <div className={`ha-progress-reflected ${barColor}`} style={{ width: `${reflectedPct}%` }}></div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-800/80 font-mono-num">
        <div>
          <span className="text-slate-500 block text-[10px]">반영 차감액</span>
          <span className="text-slate-300 font-semibold">{formatKrw(reflected)}</span>
        </div>
        <div>
          <span className="text-slate-500 block text-[10px]">미반영 보류액</span>
          <span className="text-orange-400 font-semibold">{formatKrw(pending)}</span>
        </div>
      </div>
    </div>
  )
}

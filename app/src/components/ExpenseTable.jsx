import { useState } from 'react'
import { formatKrw } from '../lib/format'

export default function ExpenseTable({ accounts, expenses, onEdit, onDelete, onToggle, onToggleAll, onOpenCopy, onCsv }) {
  const [search, setSearch] = useState('')
  const [accountFilter, setAccountFilter] = useState('ALL')
  const [reflectedFilter, setReflectedFilter] = useState('ALL')

  const q = search.trim().toLowerCase()
  const filtered = expenses.filter((e) => {
    if (q) {
      const hit = [e.merchantName, e.memo, e.approveNo].some((v) => (v || '').toLowerCase().includes(q))
      if (!hit) return false
    }
    if (accountFilter !== 'ALL' && e.accountId !== accountFilter) return false
    if (reflectedFilter === 'TRUE' && !e.budgetReflected) return false
    if (reflectedFilter === 'FALSE' && e.budgetReflected) return false
    return true
  })

  return (
    <section className="ha-card p-5 space-y-4 border-t-2 border-t-emerald-500">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <i className="fa-solid fa-list-check text-emerald-400 text-lg"></i>
          <h2 className="text-base font-bold text-white">NERP 등록 경비 내역</h2>
          <span className="px-2 py-0.5 text-xs bg-slate-800 text-slate-400 rounded-full font-mono-num">{filtered.length}건</span>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="relative min-w-[180px]">
            <i className="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-slate-500"></i>
            <input type="text" placeholder="가맹점/적요/승인번호..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500" />
          </div>

          <select value={accountFilter} onChange={(e) => setAccountFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500">
            <option value="ALL">전체 계정 보기</option>
            {accounts.map((a) => <option key={a.id} value={a.id}>{a.name} ({a.code})</option>)}
          </select>

          <select value={reflectedFilter} onChange={(e) => setReflectedFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500">
            <option value="ALL">반영 여부 전체</option>
            <option value="TRUE">예산 반영만</option>
            <option value="FALSE">미반영 보류만</option>
          </select>

          <button onClick={() => onToggleAll(true)} className="px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg font-medium transition">
            <i className="fa-solid fa-check-double"></i> 전체 반영
          </button>
          <button onClick={() => onToggleAll(false)} className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg font-medium transition">
            <i className="fa-solid fa-xmark"></i> 전체 해제
          </button>
          <button onClick={onOpenCopy} className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg shadow transition flex items-center gap-1.5">
            <i className="fa-solid fa-copy"></i> NERP 복사
          </button>
          <button onClick={onCsv} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg font-medium transition flex items-center gap-1.5">
            <i className="fa-solid fa-file-excel text-emerald-400"></i> CSV 내보내기
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-800">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider">
            <tr>
              <th className="p-3 text-center w-16">반영</th>
              <th className="p-3">날짜</th>
              <th className="p-3">계정명 (코드)</th>
              <th className="p-3">카드 / 승인번호</th>
              <th className="p-3">가맹점 (사업자번호)</th>
              <th className="p-3 text-right">총 승인금액</th>
              <th className="p-3 text-right">공급가액</th>
              <th className="p-3 text-right">부가세</th>
              <th className="p-3 text-center">부가세 구분</th>
              <th className="p-3">적요 / 구매내역</th>
              <th className="p-3 text-center w-20">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={11} className="text-center py-8 text-slate-500">
                  <i className="fa-solid fa-folder-open text-2xl mb-2 block"></i>
                  등록된 경비 전표가 없습니다.
                </td>
              </tr>
            )}
            {filtered.map((exp) => {
              const acc = accounts.find((a) => a.id === exp.accountId) || { name: '미지정', code: '000' }
              return (
                <tr key={exp.id} className={`hover:bg-slate-800/50 transition ${exp.budgetReflected ? '' : 'opacity-60 bg-slate-950/30'}`}>
                  <td className="p-3 text-center">
                    <label className="ha-switch">
                      <input type="checkbox" checked={exp.budgetReflected} onChange={(e) => onToggle(exp.id, e.target.checked)} />
                      <span className="ha-switch-slider"></span>
                    </label>
                  </td>
                  <td className="p-3 font-mono-num whitespace-nowrap text-slate-300">{exp.approveDate}</td>
                  <td className="p-3 whitespace-nowrap">
                    <div className="font-medium text-slate-200">{acc.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{acc.code} · {acc.deptCode || '부서 미입력'} · {acc.jobCode || '직무 미입력'}</div>
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    <div className="text-slate-200">{exp.cardName}</div>
                    <div className="text-[10px] text-slate-500 font-mono-num">{exp.approveNo}</div>
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    <div className="font-semibold text-slate-200">{exp.merchantName || '기본'}</div>
                    <div className="text-[10px] text-slate-500 font-mono-num">{exp.merchantBizNo || '000-00-00000'}</div>
                  </td>
                  <td className="p-3 text-right font-bold font-mono-num text-amber-400 whitespace-nowrap">{formatKrw(exp.totalAmount)}</td>
                  <td className="p-3 text-right font-mono-num text-slate-300 whitespace-nowrap">{formatKrw(exp.supplyValue)}</td>
                  <td className="p-3 text-right font-mono-num text-sky-400 whitespace-nowrap">{formatKrw(exp.vatAmount)}</td>
                  <td className="p-3 text-center whitespace-nowrap">
                    {exp.vatType === 'DEDUCTIBLE'
                      ? <span className="px-2 py-0.5 text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded">공제</span>
                      : <span className="px-2 py-0.5 text-[10px] bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded">불공제</span>}
                  </td>
                  <td className="p-3 max-w-xs truncate text-slate-300" title={exp.memo}>{exp.memo || '기본'}</td>
                  <td className="p-3 text-center whitespace-nowrap space-x-1">
                    <button onClick={() => onEdit(exp)} className="p-1.5 text-sky-400 hover:text-sky-300 transition" title="수정">
                      <i className="fa-solid fa-pen"></i>
                    </button>
                    <button onClick={() => onDelete(exp.id)} className="p-1.5 text-slate-500 hover:text-red-400 transition" title="삭제">
                      <i className="fa-solid fa-trash-can"></i>
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}

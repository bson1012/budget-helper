import { useState } from 'react'
import Modal from './Modal'

const inputCls = 'bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white focus:border-amber-500 focus:outline-none'

const valuesOf = (acc) => ({
  deptCode: acc.deptCode,
  jobCode: acc.jobCode,
  basis: acc.budgetIncludesVat ? 'true' : 'false',
  limit: String(acc.limit),
})

const BasisSelect = ({ value, onChange, className }) => (
  <select value={value} onChange={(e) => onChange(e.target.value)} className={className}>
    <option value="false">부가세 미포함</option>
    <option value="true">부가세 포함</option>
  </select>
)

export default function AccountModal({ open, onClose, accounts, onAdd, onUpdate, onDelete }) {
  const [form, setForm] = useState({ name: '', code: '', deptCode: '', jobCode: '', basis: 'false', limit: '' })
  const [edits, setEdits] = useState({})

  const submit = async (e) => {
    e.preventDefault()
    const limit = parseFloat(form.limit) || 0
    if (!form.name.trim() || !form.code.trim() || limit <= 0) return
    const ok = await onAdd({
      name: form.name.trim(),
      code: form.code.trim(),
      deptCode: form.deptCode.trim(),
      jobCode: form.jobCode.trim(),
      budgetIncludesVat: form.basis === 'true',
      limit,
    })
    if (ok) setForm({ name: '', code: '', deptCode: '', jobCode: '', basis: 'false', limit: '' })
  }

  const setEdit = (acc, patch) => setEdits((prev) => ({ ...prev, [acc.id]: { ...(prev[acc.id] ?? valuesOf(acc)), ...patch } }))

  const save = (acc) => {
    const v = edits[acc.id] ?? valuesOf(acc)
    onUpdate(
      acc.id,
      {
        deptCode: v.deptCode.trim(),
        jobCode: v.jobCode.trim(),
        budgetIncludesVat: v.basis === 'true',
        limit: parseFloat(v.limit) || 0,
      },
      acc.name
    )
    setEdits((prev) => {
      const next = { ...prev }
      delete next[acc.id]
      return next
    })
  }

  return (
    <Modal open={open} onClose={onClose} title="계정 및 예산 한도 관리" icon="fa-sliders" tone="amber" width="max-w-4xl">
      <div className="space-y-4">
        <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-6 gap-2 bg-slate-900/80 p-3 rounded-lg border border-slate-800">
          <input type="text" placeholder="계정명 (예: 회의비-연구소)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className={inputCls} />
          <input type="text" placeholder="계정코드" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required className={`${inputCls} font-mono-num`} />
          <input type="text" placeholder="귀속 부서 코드" value={form.deptCode} onChange={(e) => setForm({ ...form, deptCode: e.target.value })} required className={`${inputCls} font-mono-num`} />
          <input type="text" placeholder="직무 코드" value={form.jobCode} onChange={(e) => setForm({ ...form, jobCode: e.target.value })} required className={`${inputCls} font-mono-num`} />
          <BasisSelect value={form.basis} onChange={(basis) => setForm({ ...form, basis })} className={inputCls} />
          <div className="flex gap-2">
            <input type="number" placeholder="예산한도(원)" value={form.limit} onChange={(e) => setForm({ ...form, limit: e.target.value })} required className={`${inputCls} w-full font-mono-num`} />
            <button type="submit" className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded whitespace-nowrap">추가</button>
          </div>
        </form>

        <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
          {accounts.map((acc) => {
            const v = edits[acc.id] ?? valuesOf(acc)
            return (
              <div key={acc.id} className="bg-slate-900 p-3 rounded-lg border border-slate-800 text-xs space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-bold text-slate-200">{acc.name} <span className="font-mono text-slate-500">({acc.code})</span></div>
                  <button onClick={() => onDelete(acc)} className="px-2.5 py-1.5 bg-red-500/15 hover:bg-red-500/20 text-red-400 rounded text-[11px] transition">삭제</button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-end">
                  <label className="space-y-1">
                    <span className="block text-[10px] text-slate-400">귀속 부서 코드</span>
                    <input type="text" value={v.deptCode} onChange={(e) => setEdit(acc, { deptCode: e.target.value })} className={`${inputCls} w-full font-mono-num`} />
                  </label>
                  <label className="space-y-1">
                    <span className="block text-[10px] text-slate-400">직무 코드</span>
                    <input type="text" value={v.jobCode} onChange={(e) => setEdit(acc, { jobCode: e.target.value })} className={`${inputCls} w-full font-mono-num`} />
                  </label>
                  <label className="space-y-1">
                    <span className="block text-[10px] text-slate-400">예산 기준</span>
                    <BasisSelect value={v.basis} onChange={(basis) => setEdit(acc, { basis })} className={`${inputCls} w-full`} />
                  </label>
                  <label className="space-y-1">
                    <span className="block text-[10px] text-slate-400">예산한도 (원)</span>
                    <input type="number" value={v.limit} onChange={(e) => setEdit(acc, { limit: e.target.value })} className={`${inputCls} w-full font-mono-num font-bold text-amber-400`} />
                  </label>
                  <button onClick={() => save(acc)} className="px-2 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded text-[11px] transition font-semibold">변경저장</button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </Modal>
  )
}

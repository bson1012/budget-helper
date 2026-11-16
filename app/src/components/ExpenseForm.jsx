import { useEffect, useState } from 'react'
import { CARD_OPTIONS, calcVat, formatBizNumber, formatKrw, parseSms, todayStr } from '../lib/format'

const emptyDraft = () => ({
  accountId: '',
  cardSelect: '하나',
  cardDirect: '',
  approveDate: todayStr(),
  approveNo: '',
  total: '',
  vatType: 'DEDUCTIBLE',
  merchantName: '',
  merchantBizNo: '',
  memo: '',
  budgetReflected: true,
})

// 기존 전표를 수정 폼에 채워 넣기. 저장할 때 '기본'이었던 값은 빈칸으로 보여 준다.
const draftFromExpense = (e) => {
  const known = CARD_OPTIONS.some(([v]) => v === e.cardName && v !== 'DIRECT_INPUT')
  return {
    accountId: e.accountId || '',
    cardSelect: known ? e.cardName : 'DIRECT_INPUT',
    cardDirect: known ? '' : e.cardName,
    approveDate: e.approveDate,
    approveNo: e.approveNo,
    total: String(e.totalAmount),
    vatType: e.vatType,
    merchantName: e.merchantName === '기본' ? '' : e.merchantName || '',
    merchantBizNo: e.merchantBizNo === '000-00-00000' ? '' : e.merchantBizNo || '',
    memo: e.memo === '기본' ? '' : e.memo || '',
    budgetReflected: e.budgetReflected,
  }
}

export default function ExpenseForm({ accounts, editing, onSave, onCancelEdit, notify }) {
  const [draft, setDraft] = useState(emptyDraft)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setDraft(editing ? draftFromExpense(editing) : emptyDraft())
  }, [editing])

  const set = (patch) => setDraft((d) => ({ ...d, ...patch }))
  const accountId = draft.accountId || accounts[0]?.id || ''
  const calc = calcVat(Number(draft.total) || 0, draft.vatType)
  const selectedAccount = accounts.find((a) => a.id === accountId)
  // 선택한 계정의 예산 기준에 맞춰 예산 차감 예정액 표시
  const deductPreview = selectedAccount?.budgetIncludesVat ? Number(draft.total) || 0 : calc.deduct

  const submit = async (e) => {
    e.preventDefault()
    const total = Number(draft.total) || 0
    if (total <= 0) return notify('총 승인금액을 1원 이상 입력하세요.')

    const payload = {
      accountId,
      cardName: draft.cardSelect === 'DIRECT_INPUT' ? draft.cardDirect.trim() || '기타카드' : draft.cardSelect,
      approveDate: draft.approveDate,
      approveNo: draft.approveNo.trim() || '00000000',
      vatType: draft.vatType,
      totalAmount: total,
      supplyValue: calc.supply,
      vatAmount: calc.vat,
      deductAmount: calc.deduct,
      merchantName: draft.merchantName.trim() || '기본',
      merchantBizNo: draft.merchantBizNo.trim() || '000-00-00000',
      memo: draft.memo.trim() || '기본',
      budgetReflected: draft.budgetReflected,
    }

    setSaving(true)
    const ok = await onSave(payload, editing?.id)
    setSaving(false)
    if (ok) setDraft(emptyDraft())
  }

  const applyParsed = (fields) => {
    set(fields)
    notify('승인문자 데이터 파싱 완료!')
  }

  return (
    <>
      <SmsParser onParsed={applyParsed} notify={notify} />

      <section className="ha-card p-5 space-y-4 lg:col-span-2 border-t-2 border-t-amber-500">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2 font-bold text-sm text-slate-200">
            <i className="fa-solid fa-file-circle-plus text-amber-500"></i>
            <span>{editing ? '경비 전표 수정 모드' : '신규 경비 전표 입력'}</span>
          </div>
          <div className="flex items-center gap-3">
            {editing && (
              <button type="button" onClick={onCancelEdit} className="text-xs text-red-400 hover:underline">수정 취소</button>
            )}
            <div className="flex items-center gap-2 bg-slate-900/70 px-3 py-1.5 rounded-lg border border-slate-800">
              <span className="text-xs font-semibold text-slate-300">예산 반영</span>
              <label className="ha-switch">
                <input type="checkbox" checked={draft.budgetReflected} onChange={(e) => set({ budgetReflected: e.target.checked })} />
                <span className="ha-switch-slider"></span>
              </label>
            </div>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">처리 계정 <span className="text-amber-500">*</span></label>
              <select value={accountId} onChange={(e) => set({ accountId: e.target.value })} required
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:border-amber-500 focus:outline-none font-medium">
                {accounts.map((a) => <option key={a.id} value={a.id}>{a.name} ({a.code})</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">사용 카드 <span className="text-amber-500">*</span></label>
              <select value={draft.cardSelect} onChange={(e) => set({ cardSelect: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:border-amber-500 focus:outline-none font-medium">
                {CARD_OPTIONS.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
              </select>
              {draft.cardSelect === 'DIRECT_INPUT' && (
                <input type="text" placeholder="카드명 입력..." value={draft.cardDirect} onChange={(e) => set({ cardDirect: e.target.value })}
                  className="mt-2 w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:border-amber-500 focus:outline-none" />
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">승인 날짜 <span className="text-amber-500">*</span></label>
              <input type="date" value={draft.approveDate} onChange={(e) => set({ approveDate: e.target.value })} required
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:border-amber-500 focus:outline-none font-mono-num" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">승인 번호 <span className="text-amber-500">*</span></label>
              <input type="text" placeholder="예: 38291029" value={draft.approveNo} onChange={(e) => set({ approveNo: e.target.value })} required
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:border-amber-500 focus:outline-none font-mono-num" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">총 승인금액 (원) <span className="text-amber-500">*</span></label>
              <input type="number" placeholder="0" value={draft.total} onChange={(e) => set({ total: e.target.value })} required
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs font-bold text-amber-400 focus:border-amber-500 focus:outline-none font-mono-num" />
            </div>
          </div>

          <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800/80 space-y-2">
            <label className="block text-xs font-semibold text-slate-400">부가세 구분 선택</label>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center justify-center gap-2 p-2 rounded-lg border border-slate-700 bg-slate-800/50 hover:bg-slate-800 cursor-pointer text-xs font-medium text-slate-200 transition has-[:checked]:border-amber-500 has-[:checked]:bg-amber-500/10 has-[:checked]:text-amber-400">
                <input type="radio" name="vatType" value="DEDUCTIBLE" checked={draft.vatType === 'DEDUCTIBLE'} onChange={() => set({ vatType: 'DEDUCTIBLE' })} className="accent-amber-500" />
                <span>● 부가세 공제 (기본)</span>
              </label>
              <label className="flex items-center justify-center gap-2 p-2 rounded-lg border border-slate-700 bg-slate-800/50 hover:bg-slate-800 cursor-pointer text-xs font-medium text-slate-200 transition has-[:checked]:border-orange-500 has-[:checked]:bg-orange-500/10 has-[:checked]:text-orange-400">
                <input type="radio" name="vatType" value="NON_DEDUCTIBLE" checked={draft.vatType === 'NON_DEDUCTIBLE'} onChange={() => set({ vatType: 'NON_DEDUCTIBLE' })} className="accent-orange-500" />
                <span>○ 부가세 불공제 (전액 예산차감)</span>
              </label>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-center font-mono-num">
              <div className="bg-slate-950/50 p-2 rounded">
                <span className="block text-[10px] text-slate-500">공급가액</span>
                <span className="text-xs font-semibold text-slate-300">{formatKrw(calc.supply)}</span>
              </div>
              <div className="bg-slate-950/50 p-2 rounded">
                <span className="block text-[10px] text-slate-500">부가세</span>
                <span className="text-xs font-semibold text-sky-400">{formatKrw(calc.vat)}</span>
              </div>
              <div className="bg-slate-950/50 p-2 rounded border border-amber-500/30">
                <span className="block text-[10px] text-amber-500 font-sans">예산 차감 예정액</span>
                <span className="text-xs font-bold text-amber-400">{formatKrw(deductPreview)}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">가맹점명</label>
              <input type="text" placeholder="기본" value={draft.merchantName} onChange={(e) => set({ merchantName: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:border-amber-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">가맹점 사업자번호</label>
              <input type="text" placeholder="000-00-00000" value={draft.merchantBizNo} onChange={(e) => set({ merchantBizNo: formatBizNumber(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:border-amber-500 focus:outline-none font-mono-num" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">구매 내역 / 적요</label>
              <input type="text" placeholder="기본" value={draft.memo} onChange={(e) => set({ memo: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:border-amber-500 focus:outline-none" />
            </div>
          </div>

          <div className="pt-2">
            <button type="submit" disabled={saving || accounts.length === 0}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-sm rounded-lg shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition active:scale-[0.99]">
              <i className={editing ? 'fa-solid fa-check' : 'fa-solid fa-plus-circle'}></i>
              {editing ? ' 수정 사항 저장하기' : ' NERP 경비 전표 추가 저장하기'}
            </button>
          </div>
        </form>
      </section>
    </>
  )
}

function SmsParser({ onParsed, notify }) {
  const [text, setText] = useState('')

  const parse = () => {
    if (!text.trim()) return notify('파싱할 승인문자 텍스트를 입력해주세요.')
    onParsed(parseSms(text))
  }

  return (
    <section className="ha-card p-5 space-y-4 lg:col-span-1 border-t-2 border-t-purple-500 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-purple-400 font-semibold text-sm">
            <i className="fa-solid fa-comment-sms text-base"></i>
            <span>카드 승인문자 / 카톡 파서</span>
          </div>
          <span className="text-[11px] bg-purple-500/10 text-purple-300 px-2 py-0.5 rounded border border-purple-500/20">자동 추출</span>
        </div>
        <p className="text-xs text-slate-400 mb-3">승인 문자나 카카오톡 알림톡 전체를 복사하여 아래 붙여넣으면 가맹점, 금액, 승인번호, 날짜가 자동으로 파싱됩니다.</p>
        <textarea rows={5} value={text} onChange={(e) => setText(e.target.value)}
          placeholder="[하나카드] 09/18 19:30 경복궁 132,000원 일시불 승인번호 82910482"
          className="w-full bg-slate-900/80 border border-slate-700/80 rounded-lg p-3 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition resize-none" />
      </div>

      <div className="space-y-2 pt-2">
        <button type="button" onClick={parse}
          className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-lg shadow-lg shadow-purple-600/20 flex items-center justify-center gap-2 transition active:scale-[0.99]">
          <i className="fa-solid fa-wand-magic-sparkles"></i> 승인문자 분석 후 폼에 채우기
        </button>
        <button type="button" onClick={() => setText('')}
          className="w-full py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-400 text-xs rounded-lg transition">
          입력창 비우기
        </button>
      </div>
    </section>
  )
}

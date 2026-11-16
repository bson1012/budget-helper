import { useRef } from 'react'
import Modal from './Modal'
import { buildTsv } from '../lib/format'

export default function CopyModal({ open, onClose, accounts, expenses, notify }) {
  const ref = useRef(null)
  const tsv = buildTsv(expenses, accounts)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(tsv)
    } catch {
      ref.current?.select()
      document.execCommand('copy')
    }
    notify('NERP TSV 데이터가 클립보드에 복사되었습니다!')
  }

  return (
    <Modal open={open} onClose={onClose} title="NERP 복사용 Tab-Separated Data" icon="fa-paste" tone="amber" width="max-w-4xl">
      <div className="space-y-4">
        <p className="text-xs text-slate-400">아래 텍스트 상자는 NERP 시스템 및 엑셀에 일괄 붙여넣기 할 수 있는 Tab 구분 데이터입니다.</p>
        <textarea ref={ref} rows={12} readOnly value={tsv}
          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-emerald-400 focus:outline-none" />
        <div className="flex justify-between items-center pt-2 border-t border-slate-800">
          <span className="text-xs text-slate-500 font-mono-num">{expenses.length}개 항목 준비됨</span>
          <div className="flex gap-2">
            <button onClick={copy} className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg flex items-center gap-2 shadow-lg shadow-amber-500/20">
              <i className="fa-solid fa-copy"></i> 클립보드로 복사하기
            </button>
            <button onClick={onClose} className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg">닫기</button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

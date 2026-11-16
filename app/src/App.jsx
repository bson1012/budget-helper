import { useCallback, useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import * as api from './lib/api'
import { downloadCsv } from './lib/format'
import Login from './components/Login'
import Header from './components/Header'
import AccountTiles from './components/AccountTiles'
import ExpenseForm from './components/ExpenseForm'
import ExpenseTable from './components/ExpenseTable'
import AccountModal from './components/AccountModal'
import CopyModal from './components/CopyModal'

export default function App() {
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  if (session === undefined) return <p className="p-6 text-slate-400">불러오는 중...</p>
  if (!session) return <Login />
  return <Dashboard user={session.user} />
}

function Dashboard({ user }) {
  const [accounts, setAccounts] = useState([])
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [modal, setModal] = useState(null) // 'accounts' | 'copy' | null
  const [toast, setToast] = useState(null)

  const notify = useCallback((message) => setToast({ message, id: Date.now() }), [])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(timer)
  }, [toast])

  const refresh = useCallback(async () => {
    const [a, e] = await Promise.all([api.fetchAccounts(), api.fetchExpenses()])
    setAccounts(a)
    setExpenses(e)
  }, [])

  useEffect(() => {
    refresh()
      .catch((err) => notify(`데이터를 불러오지 못했습니다: ${err.message}`))
      .finally(() => setLoading(false))
  }, [refresh, notify])

  // 다른 기기에서 바뀐 내용을 탭으로 돌아올 때 반영
  useEffect(() => {
    const onFocus = () => refresh().catch(() => {})
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [refresh])

  // 작업을 실행하고 목록을 다시 불러온다. 성공하면 true를 돌려준다.
  const run = async (action, successMessage) => {
    try {
      await action()
      await refresh()
      if (successMessage) notify(successMessage)
      return true
    } catch (err) {
      notify(`오류: ${err.message}`)
      return false
    }
  }

  const saveExpense = async (payload, id) => {
    const ok = await run(
      () => (id ? api.updateExpense(id, payload) : api.addExpense(payload)),
      id ? '경비 전표가 수정되었습니다.' : '신규 경비 전표가 등록되었습니다.'
    )
    if (ok) setEditing(null)
    return ok
  }

  const deleteExpense = (id) => {
    if (!window.confirm('이 경비 전표를 삭제할까요?')) return
    run(() => api.deleteExpense(id), '경비 전표가 삭제되었습니다.')
  }

  const toggleReflected = (id, value) => run(() => api.setExpenseReflected(id, value))

  const toggleAll = (value) =>
    run(() => api.setAllReflected(value), value ? '전체 예산 반영 처리되었습니다.' : '전체 예산 해제 처리되었습니다.')

  const addAccount = (acc) => run(() => api.addAccount(acc), '신규 계정이 추가되었습니다.')

  const updateAccount = (id, values, name) => {
    if (values.limit < 0) return notify('올바른 예산 금액을 입력하세요.')
    run(() => api.updateAccount(id, values), `[${name}] 계정 정보가 변경되었습니다.`)
  }

  const removeAccount = (acc) => {
    if (accounts.length <= 1) return notify('최소 1개 이상의 계정이 존재해야 합니다.')
    if (!window.confirm(`[${acc.name}] 계정을 삭제할까요? 이 계정의 지출 내역은 "미지정"으로 남습니다.`)) return
    run(() => api.deleteAccount(acc.id), '계정이 삭제되었습니다.')
  }

  const startEdit = (exp) => {
    setEditing(exp)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="p-3 sm:p-6 max-w-[1600px] mx-auto space-y-6 pb-20">
      <Header
        email={user.email}
        onOpenAccounts={() => setModal('accounts')}
        onLogout={() => supabase.auth.signOut()}
      />

      {loading ? (
        <p className="text-slate-400 text-sm">데이터를 불러오는 중...</p>
      ) : (
        <>
          <AccountTiles accounts={accounts} expenses={expenses} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <ExpenseForm
              accounts={accounts}
              editing={editing}
              onSave={saveExpense}
              onCancelEdit={() => setEditing(null)}
              notify={notify}
            />
          </div>

          <ExpenseTable
            accounts={accounts}
            expenses={expenses}
            onEdit={startEdit}
            onDelete={deleteExpense}
            onToggle={toggleReflected}
            onToggleAll={toggleAll}
            onOpenCopy={() => setModal('copy')}
            onCsv={() => (expenses.length ? downloadCsv(expenses, accounts) : notify('내보낼 데이터가 없습니다.'))}
          />
        </>
      )}

      <AccountModal
        open={modal === 'accounts'}
        onClose={() => setModal(null)}
        accounts={accounts}
        onAdd={addAccount}
        onUpdate={updateAccount}
        onDelete={removeAccount}
      />

      <CopyModal
        open={modal === 'copy'}
        onClose={() => setModal(null)}
        accounts={accounts}
        expenses={expenses}
        notify={notify}
      />

      {toast && (
        <div key={toast.id} className="fixed bottom-5 right-5 z-50 bg-slate-800 text-amber-400 px-4 py-3 rounded-lg shadow-2xl border border-amber-500/30 text-xs font-bold flex items-center gap-2">
          <i className="fa-solid fa-circle-check text-amber-500 text-sm"></i> {toast.message}
        </div>
      )}
    </div>
  )
}

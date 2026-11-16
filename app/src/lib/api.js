import { supabase } from './supabase'

// DB의 snake_case 행을 앱에서 쓰는 camelCase 객체로 변환
const toAccount = (row) => ({
  id: row.id,
  name: row.name,
  code: row.code,
  deptCode: row.dept_code ?? '',
  jobCode: row.job_code ?? '',
  budgetIncludesVat: row.budget_includes_vat ?? false,
  limit: row.budget_limit,
})

const toExpense = (row) => ({
  id: row.id,
  accountId: row.account_id,
  cardName: row.card_name,
  approveDate: row.approve_date,
  approveNo: row.approve_no,
  vatType: row.vat_type,
  totalAmount: row.total_amount,
  supplyValue: row.supply_value,
  vatAmount: row.vat_amount,
  deductAmount: row.deduct_amount,
  merchantName: row.merchant_name,
  merchantBizNo: row.merchant_biz_no,
  memo: row.memo,
  budgetReflected: row.budget_reflected,
})

// 앱 객체를 DB 컬럼명으로 변환 (undefined 필드는 제외)
const toExpenseRow = (e) => {
  const row = {
    account_id: e.accountId,
    card_name: e.cardName,
    approve_date: e.approveDate,
    approve_no: e.approveNo,
    vat_type: e.vatType,
    total_amount: e.totalAmount,
    supply_value: e.supplyValue,
    vat_amount: e.vatAmount,
    deduct_amount: e.deductAmount,
    merchant_name: e.merchantName,
    merchant_biz_no: e.merchantBizNo,
    memo: e.memo,
    budget_reflected: e.budgetReflected,
  }
  return Object.fromEntries(Object.entries(row).filter(([, v]) => v !== undefined))
}

const check = ({ data, error }) => {
  if (error) throw error
  return data
}

export async function fetchAccounts() {
  const rows = check(await supabase.from('accounts').select('*').order('created_at'))
  return rows.map(toAccount)
}

export async function fetchExpenses() {
  const rows = check(
    await supabase.from('expenses').select('*').order('approve_date', { ascending: false })
  )
  return rows.map(toExpense)
}

export async function addAccount({ name, code, deptCode, jobCode, budgetIncludesVat, limit }) {
  check(
    await supabase.from('accounts').insert({
      name,
      code,
      dept_code: deptCode,
      job_code: jobCode,
      budget_includes_vat: budgetIncludesVat,
      budget_limit: limit,
    })
  )
}

export async function updateAccount(id, { deptCode, jobCode, budgetIncludesVat, limit }) {
  check(
    await supabase
      .from('accounts')
      .update({ dept_code: deptCode, job_code: jobCode, budget_includes_vat: budgetIncludesVat, budget_limit: limit })
      .eq('id', id)
  )
}

// 계정을 지워도 지출 내역은 남고, 계정은 "미지정"으로 표시됩니다 (schema.sql의 on delete set null)
export async function deleteAccount(id) {
  check(await supabase.from('accounts').delete().eq('id', id))
}

export async function addExpense(expense) {
  check(await supabase.from('expenses').insert(toExpenseRow(expense)))
}

export async function updateExpense(id, expense) {
  check(await supabase.from('expenses').update(toExpenseRow(expense)).eq('id', id))
}

export async function deleteExpense(id) {
  check(await supabase.from('expenses').delete().eq('id', id))
}

export async function setExpenseReflected(id, reflected) {
  check(await supabase.from('expenses').update({ budget_reflected: reflected }).eq('id', id))
}

export async function setAllReflected(reflected) {
  check(await supabase.from('expenses').update({ budget_reflected: reflected }).not('id', 'is', null))
}

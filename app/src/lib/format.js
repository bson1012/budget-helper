// 기존 index.html의 계산, 파싱, 내보내기 로직을 옮긴 순수 함수 모음

export const formatKrw = (n) => `${(Number(n) || 0).toLocaleString('ko-KR')} 원`

export const todayStr = () => {
  const d = new Date()
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}

export const CARD_OPTIONS = [
  ['하나', '하나카드'],
  ['삼성-국민행복', '삼성 - 국민행복'],
  ['삼성-마일리지', '삼성 - 마일리지'],
  ['삼성-신세계', '삼성 - 신세계'],
  ['삼성-iD', '삼성 - iD카드'],
  ['DIRECT_INPUT', '+ 기타 카드 직접입력'],
]

// 사업자번호 입력 중 자동으로 하이픈 넣기
export function formatBizNumber(raw) {
  const v = raw.replace(/[^0-9]/g, '').slice(0, 10)
  if (v.length > 5) return `${v.slice(0, 3)}-${v.slice(3, 5)}-${v.slice(5)}`
  if (v.length > 3) return `${v.slice(0, 3)}-${v.slice(3)}`
  return v
}

// 총액에서 공급가액, 부가세, 예산 차감액 계산
export function calcVat(total, vatType) {
  if (vatType === 'DEDUCTIBLE') {
    const supply = Math.round(total / 1.1)
    return { supply, vat: total - supply, deduct: supply }
  }
  return { supply: total, vat: 0, deduct: total }
}

// 승인 문자에서 금액, 승인번호, 날짜, 카드, 가맹점을 찾아 준다. 찾은 항목만 담아서 돌려준다.
export function parseSms(rawText) {
  const text = rawText.trim()
  const result = {}

  const amountMatch = text.match(/([\d,]+)\s*원/)
  if (amountMatch) {
    const amount = parseInt(amountMatch[1].replace(/,/g, ''), 10)
    if (amount > 0) result.total = String(amount)
  }

  const approveMatch = text.match(/(?:승인번호|승인|번호)?\s*[:\[\s]*(\d{6,8})[\]\s]*/i)
  if (approveMatch) result.approveNo = approveMatch[1]

  const dateMatch = text.match(/(\d{2})[\/.-](\d{2})/)
  if (dateMatch) {
    result.approveDate = `${new Date().getFullYear()}-${dateMatch[1]}-${dateMatch[2]}`
  }

  if (text.includes('하나')) result.cardSelect = '하나'
  else if (text.includes('iD')) result.cardSelect = '삼성-iD'
  else if (text.includes('마일리지')) result.cardSelect = '삼성-마일리지'

  for (const token of text.split(/\s+/)) {
    if (!token.includes('원') && !token.includes('카드') && !token.includes('승인') && !/\d/.test(token) && token.length >= 2) {
      result.merchantName = token.replace(/[\[\]()]/g, '')
      break
    }
  }

  return result
}

const accountOf = (accounts, id) => accounts.find((a) => a.id === id) || { code: '000', name: '미지정' }

// NERP 시스템에 붙여넣는 탭 구분 데이터
export function buildTsv(expenses, accounts) {
  const header = ['승인일자', '계정코드', '계정명', '카드명', '승인번호', '가맹점명', '사업자번호', '총금액', '공급가액', '부가세', '공제구분', '적요'].join('\t')
  const rows = expenses.map((e) => {
    const acc = accountOf(accounts, e.accountId)
    return [
      e.approveDate, acc.code, acc.name, e.cardName, e.approveNo,
      e.merchantName || '기본', e.merchantBizNo || '000-00-00000',
      e.totalAmount, e.supplyValue, e.vatAmount,
      e.vatType === 'DEDUCTIBLE' ? '공제' : '불공제', e.memo || '기본',
    ].join('\t')
  })
  return [header, ...rows].join('\n')
}

export function downloadCsv(expenses, accounts) {
  const headers = ['승인일자', '계정코드', '계정명', '카드명', '승인번호', '가맹점명', '사업자번호', '총금액', '공급가액', '부가세', '공제구분', '예산반영여부', '적요']
  const lines = [headers.join(',')]
  expenses.forEach((e) => {
    const acc = accountOf(accounts, e.accountId)
    lines.push([
      `"${e.approveDate}"`, `"${acc.code}"`, `"${acc.name}"`, `"${e.cardName}"`, `"${e.approveNo}"`,
      `"${e.merchantName || '기본'}"`, `"${e.merchantBizNo || '000-00-00000'}"`,
      e.totalAmount, e.supplyValue, e.vatAmount,
      `"${e.vatType === 'DEDUCTIBLE' ? '공제' : '불공제'}"`,
      `"${e.budgetReflected ? '반영' : '미반영'}"`,
      `"${(e.memo || '기본').replace(/"/g, '""')}"`,
    ].join(','))
  })

  const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `NERP_Expense_Report_${todayStr()}.csv`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

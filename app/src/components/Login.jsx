import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  const signIn = async (e) => {
    e.preventDefault()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setMessage(error.message)
  }

  const signUp = async () => {
    const { error } = await supabase.auth.signUp({ email, password })
    setMessage(error ? error.message : '가입 확인 메일을 보냈습니다. 링크를 누른 뒤 로그인하세요.')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <form onSubmit={signIn} className="ha-card w-full max-w-sm p-6 space-y-3">
        <h1 className="text-lg font-bold text-white">NERP 경비 관리 로그인</h1>
        <input type="email" placeholder="이메일" value={email} onChange={(e) => setEmail(e.target.value)} required
          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:border-amber-500 focus:outline-none" />
        <input type="password" placeholder="비밀번호 (6자 이상)" value={password} onChange={(e) => setPassword(e.target.value)} required
          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:border-amber-500 focus:outline-none" />
        <button type="submit" className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg">로그인</button>
        <button type="button" onClick={signUp} className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg">회원가입</button>
        {message && <p className="text-xs text-amber-300">{message}</p>}
      </form>
    </div>
  )
}

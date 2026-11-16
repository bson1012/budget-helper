export default function Modal({ open, onClose, title, icon, tone = 'amber', width = 'max-w-md', children }) {
  if (!open) return null
  const color = tone === 'amber' ? 'text-amber-400 border-amber-500/50' : 'text-sky-400 border-sky-500/50'
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className={`ha-card w-full ${width} p-6 space-y-5 shadow-2xl ${color}`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className={`flex items-center gap-2 font-bold text-base ${color.split(' ')[0]}`}>
            <i className={`fa-solid ${icon}`}></i>
            <span>{title}</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-lg"><i className="fa-solid fa-xmark"></i></button>
        </div>
        {children}
      </div>
    </div>
  )
}

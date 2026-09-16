import { NavLink } from 'react-router-dom';

const icons = {
  kelas: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
    </svg>
  ),
  siswa: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="9" cy="8" r="3" /><path d="M3.5 20a5.5 5.5 0 0 1 11 0M16 11a3 3 0 1 0 0-6M16.5 14.5a5.5 5.5 0 0 1 4 5.5" />
    </svg>
  ),
  guru: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="m3 10 9-5 9 5-9 5-9-5Z" /><path d="M7 12.3V16c2.6 2 7.4 2 10 0v-3.7M21 10v6" />
    </svg>
  ),
  mapel: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 1 4 17.5v-12Z" /><path d="M8 7h8M8 11h8M8 15h5" />
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.8 1.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5v.1h-2.5v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1-1.8-1.8.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H6v-2.5h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1L9 7.7l.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.5v-.1h2.5v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.8 1.8-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1h.1V15h-.1a1.7 1.7 0 0 0-1.5 0Z" />
    </svg>
  ),
  soal: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M4 4h16v16H4zM8 8h8M8 12h8M8 16h5" />
    </svg>
  ),
  ujian: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 7h8M8 11h2M12 11h4M8 15h2M12 15h4" />
    </svg>
  ),
};

export default function DashboardSidebar({ menu, role }) {
  return (
    <aside className="md:w-64 md:flex-shrink-0">
      <div className="md:sticky md:top-24 overflow-hidden rounded-2xl bg-[#0C2B4E] p-3 shadow-xl shadow-[#0C2B4E]/15">
        <div className="hidden md:flex items-center gap-3 px-3 pb-4 pt-2 border-b border-white/10 mb-3">
          <div className="h-9 w-9 rounded-xl bg-white/10 flex items-center justify-center text-sky">
            <span className="text-lg">✦</span>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-sky/70 font-semibold">Workspace</p>
            <p className="text-sm text-white font-semibold capitalize">{role}</p>
          </div>
        </div>
        <nav className="flex md:block gap-1 overflow-x-auto">
          {menu.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `group flex min-w-max items-center gap-3 rounded-xl px-3 py-3 font-sans text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-royal text-white shadow-lg shadow-black/10'
                    : 'text-blue-100/75 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <span className="h-5 w-5 flex-shrink-0">{icons[item.icon]}</span>
              <span>{item.label}</span>
              <span className="ml-auto hidden md:block text-white/30 group-hover:text-white/60">›</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  );
}

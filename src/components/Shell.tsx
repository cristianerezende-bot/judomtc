'use client'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Home, HeartPulse, Gauge, User, LogOut } from 'lucide-react'
import { signOut } from 'next-auth/react'
import { useEffect, useState, Suspense } from 'react'
import Image from 'next/image'

const NAV = [
  { href: '/',       label: 'Home',        icon: Home       },
  { href: '/rec',    label: 'Recuperação', icon: HeartPulse },
  { href: '/pse',    label: 'PSE',         icon: Gauge      },
  { href: '/atleta', label: 'Atleta',      icon: User       },
]

function ShellInner({ children }: { children: React.ReactNode }) {
  const pathname     = usePathname()
  const searchParams = useSearchParams()
  const router       = useRouter()
  const categoria    = searchParams.get('categoria') ?? ''
  const [categorias, setCategorias] = useState<string[]>([])

  useEffect(() => {
    fetch('/api/home')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d.categorias)) setCategorias(d.categorias) })
      .catch(() => {})
  }, [])

  function navHref(href: string) {
    return categoria ? `${href}?categoria=${encodeURIComponent(categoria)}` : href
  }

  function onCatChange(val: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (val) params.set('categoria', val)
    else params.delete('categoria')
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="mx-3 mt-3 rounded-3xl border border-white/20
                         bg-white/10 backdrop-blur-md shadow-2xl overflow-hidden">
        <div className="px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="relative w-11 h-11 rounded-2xl bg-white/12 border border-white/20
                            flex items-center justify-center overflow-hidden shadow-lg">
              <Image
                src="/logo.png"
                alt="Logo Judô"
                fill
                className="object-contain p-1"
              />
            </div>
            <div>
              <div className="font-black text-sm leading-tight text-white">
                Relatório Judô
                {categoria && (
                  <span className="ml-2 text-xs font-bold opacity-80
                                   bg-yellow-400/20 border border-yellow-400/40
                                   px-2 py-0.5 rounded-full">
                    {categoria}
                  </span>
                )}
              </div>
              <div className="text-xs font-bold opacity-75 mt-0.5 text-white">Alto Rendimento • MTC</div>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex items-center gap-2 px-3 py-2 rounded-2xl
                       bg-white/10 border border-white/16 text-xs font-black
                       hover:bg-white/20 transition-colors"
          >
            <LogOut size={14} /> Sair
          </button>
        </div>

        <div className="px-3 pb-3 flex items-center gap-2 flex-wrap
                        border-t border-white/12 pt-2.5">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href
            return (
              <Link key={href} href={navHref(href)}
                className={`flex items-center gap-2 px-3 py-2 rounded-full
                            text-xs font-black border transition-colors
                            ${active
                              ? 'bg-yellow-400/20 border-yellow-400/30'
                              : 'bg-white/8 border-white/16 hover:bg-white/16'}`}>
                <Icon size={14} /> {label}
              </Link>
            )
          })}

          <div className="flex-1" />

          {categorias.length > 0 && (
            <select
              value={categoria}
              onChange={e => onCatChange(e.target.value)}
              className="bg-white border border-white/22 text-black text-xs
                         font-black rounded-full px-3 py-2 outline-none cursor-pointer
                         hover:bg-slate-100 transition-colors min-w-[160px] shadow-sm"
            >
              <option value="">Todas as categorias</option>
              {categorias.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
        </div>
      </header>

      <main className="flex-1 mx-3 mt-3 mb-4 rounded-3xl bg-slate-50
                       text-[#0B1220] shadow-2xl overflow-hidden p-4 md:p-5">
        {children}
      </main>
    </div>
  )
}

export default function Shell({ children }: { children: React.ReactNode }) {
  return (
    <Suspense>
      <ShellInner>{children}</ShellInner>
    </Suspense>
  )
}

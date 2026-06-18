'use client'
import { useState } from 'react'
import { Send } from 'lucide-react'

interface Props { names: string[]; title: string }

export default function MissingTable({ names, title }: Props) {
  const [sent, setSent] = useState<Set<string>>(new Set())
  const [copied, setCopied] = useState(false)
  const pending = names.filter(n => !sent.has(n))

  async function copy() {
    try {
      await navigator.clipboard.writeText(`${title}:\n` + pending.join('\n'))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Falha ao copiar:', err)
    }
  }

  return (
    <div className="rounded-3xl bg-white border border-black/10 shadow-lg overflow-hidden">
      <div className="px-4 py-3 bg-black/3 border-b border-black/8
                      flex justify-between items-center gap-2">
        <span className="font-black text-sm">{title}</span>
        <button onClick={copy}
          className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
            copied ? 'bg-emerald-500 text-white' : 'bg-[#0b3c6f] text-white hover:bg-[#041e3c]'
          }`}>
          {copied ? 'Copiado!' : 'Copiar lista'}
        </button>
      </div>
      <div className="max-h-72 overflow-auto">
        {pending.length === 0 ? (
          <div className="p-4 text-center text-slate-400 text-sm font-bold">
            Nenhuma pendência 🎯
          </div>
        ) : (
          <table className="w-full text-sm">
            <tbody>
              {pending.map(nome => (
                <tr key={nome} className="border-b border-black/6 last:border-0">
                  <td className="px-4 py-2.5 font-black">{nome}</td>
                  <td className="px-3 py-2 w-14 text-right">
                    <button
                      onClick={() => setSent(p => new Set([...p, nome]))}
                      className="w-9 h-8 rounded-xl bg-yellow-400/20 border border-yellow-400/40
                                 flex items-center justify-center hover:bg-emerald-100
                                 hover:border-emerald-300 transition-colors">
                      <Send size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

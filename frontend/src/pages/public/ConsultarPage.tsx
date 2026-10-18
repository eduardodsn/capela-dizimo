import * as React from 'react'
import { IdCard, Loader2, Search as SearchIcon } from 'lucide-react'

import { FiltroBar } from '@/components/pastoral/FiltroBar'
import { EmptyState } from '@/components/dashboard/EmptyState'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'

import { listarDizimistas } from '@/services/dizimistaService'
import type { Dizimista } from '@/types'
import { formatarNumeroCarne, getIniciais } from '@/utils/format'

/** Tamanho mínimo da busca antes de consultar — evita listar a base inteira com 1 letra digitada. */
const TAMANHO_MINIMO_BUSCA = 2
/** Limite de resultados exibidos de uma vez — a página não tem paginação, só busca mais específica. */
const LIMITE_RESULTADOS = 30

/**
 * Só nome e nº do carnê aparecem aqui, de propósito: é a única informação que alguém sem login
 * precisa pra se identificar (ex.: achar o próprio carnê pra usar em "Acompanhar meu dízimo" ou
 * numa devolução). Telefone, endereço e, principalmente, data de nascimento (usada como senha no
 * login do dizimista) nunca aparecem numa tela pública.
 */
type ResultadoBusca = Pick<Dizimista, 'numeroCarne' | 'nomeCompleto'>

export function ConsultarPage() {
  const [busca, setBusca] = React.useState('')
  const [resultados, setResultados] = React.useState<ResultadoBusca[]>([])
  const [buscando, setBuscando] = React.useState(false)

  React.useEffect(() => {
    const termo = busca.trim()
    if (termo.length < TAMANHO_MINIMO_BUSCA) {
      setResultados([])
      setBuscando(false)
      return
    }

    let cancelado = false
    setBuscando(true)
    listarDizimistas(termo)
      .then((lista) => {
        if (cancelado) return
        setResultados(lista.map((d) => ({ numeroCarne: d.numeroCarne, nomeCompleto: d.nomeCompleto })))
      })
      .finally(() => {
        if (!cancelado) setBuscando(false)
      })
    return () => {
      cancelado = true
    }
  }, [busca])

  const termo = busca.trim()
  const resultadosLimitados = resultados.slice(0, LIMITE_RESULTADOS)

  return (
    <div className="container max-w-2xl py-14 sm:py-20">
      <div className="text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Consultar dizimista</h1>
        <p className="mt-2 text-muted-foreground">
          Busque pelo nome ou número do carnê para confirmar o número de um cadastro.
        </p>
      </div>

      <Card className="mt-8">
        <CardContent className="pt-6">
          <FiltroBar busca={busca} onBuscaChange={setBusca} placeholder="Nome ou nº do carnê..." />

          {buscando ? (
            <div className="flex items-center justify-center gap-2 py-14 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Buscando...
            </div>
          ) : termo.length < TAMANHO_MINIMO_BUSCA ? (
            <EmptyState icon={SearchIcon} title="Digite para buscar" description="Pelo menos 2 letras do nome, ou o número do carnê." />
          ) : resultadosLimitados.length === 0 ? (
            <EmptyState icon={IdCard} title="Nenhum dizimista encontrado" description="Confira a grafia do nome ou o número do carnê." />
          ) : (
            <ul className="divide-y divide-border">
              {resultadosLimitados.map((d) => (
                <li key={d.numeroCarne} className="flex items-center gap-3 py-3">
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarFallback>{getIniciais(d.nomeCompleto)}</AvatarFallback>
                  </Avatar>
                  <p className="min-w-0 flex-1 truncate font-medium text-foreground">{d.nomeCompleto}</p>
                  <p className="shrink-0 text-sm text-muted-foreground">Nº {formatarNumeroCarne(d.numeroCarne)}</p>
                </li>
              ))}
              {resultados.length > LIMITE_RESULTADOS && (
                <li className="pt-3 text-center text-xs text-muted-foreground">
                  Mostrando os primeiros {LIMITE_RESULTADOS} resultados — refine a busca pra ver menos nomes.
                </li>
              )}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

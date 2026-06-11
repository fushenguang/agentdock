'use client'

import { useEffect, useId, useRef } from 'react'

interface MermaidProps {
  chart: string
}

export default function Mermaid({ chart }: MermaidProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const rawId = useId()
  const id = `mermaid-${rawId.replace(/:/g, '')}`

  useEffect(() => {
    let cancelled = false

    async function render() {
      const mermaid = (await import('mermaid')).default
      mermaid.initialize({ startOnLoad: false, theme: 'neutral', fontFamily: 'inherit' })

      if (cancelled || !containerRef.current) return

      try {
        const { svg } = await mermaid.render(id, chart)
        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = svg
        }
      } catch (err) {
        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = `<pre style="color:red">${String(err)}</pre>`
        }
      }
    }

    render()
    return () => {
      cancelled = true
    }
  }, [chart, id])

  return <div ref={containerRef} className="my-4 overflow-x-auto" />
}

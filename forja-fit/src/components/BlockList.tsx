import { ChevronDown, Film, Info, Repeat, Timer } from 'lucide-react'
import { useState } from 'react'
import { CATALOG_DEMOS } from '../data/demos'
import { getExercise } from '../data/exercises'
import { BLOCK_KIND_LABEL, FORMAT_HELP } from '../data/taxonomy'
import { blockSummary } from '../lib/blocks'
import { useStore } from '../lib/store'
import type { Block, BlockItem } from '../types'
import { ExercisePanel } from './ExercisePanel'

function BlockItemRow({ item, index }: { item: BlockItem; index: number }) {
  const [open, setOpen] = useState(false)
  const exercise = getExercise(item.exerciseId)
  const hasOwnVideo = useStore((s) => Boolean(s.videos[item.exerciseId] ?? exercise?.videoUrl))
  const hasDemo = hasOwnVideo || Boolean(CATALOG_DEMOS[item.exerciseId])

  return (
    <li>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
          open ? 'bg-surface-2' : 'hover:bg-surface-2'
        }`}
      >
        <span className="tnum w-5 shrink-0 text-[12px] font-bold text-faint">{index + 1}</span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span className="truncate text-sm font-semibold">
              {exercise?.name ?? item.exerciseId}
            </span>
            {hasDemo && <Film size={12} className="shrink-0 text-accent" />}
          </span>
          <span className="block text-[12px] text-muted">
            {item.prescription}
            {item.load && ` · ${item.load}`}
            {item.restSec ? ` · ${item.restSec} s de descanso` : ''}
          </span>
        </span>
        <ChevronDown
          size={15}
          className={`shrink-0 text-faint transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="px-4 pb-3">
          <ExercisePanel exerciseId={item.exerciseId} />
        </div>
      )}
    </li>
  )
}

export function BlockList({ blocks }: { blocks: Block[] }) {
  return (
    <div className="space-y-3">
      {blocks.map((block, index) => (
        <article key={block.id} className="card overflow-hidden">
          <header className="hatch border-b border-line px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="overline text-faint">
                  Bloque {index + 1} · {BLOCK_KIND_LABEL[block.kind]}
                </p>
                <h3 className="display mt-0.5 text-[15px]">{block.name}</h3>
              </div>
              <span className="shrink-0 rounded-md border border-line bg-surface-2 px-2 py-1 text-[10px] font-bold tracking-wider text-accent uppercase">
                {blockSummary(block)}
              </span>
            </div>
            {block.target && (
              <p className="mt-2 flex items-start gap-1.5 text-[12px] text-muted">
                <Timer size={13} className="mt-0.5 shrink-0" />
                {block.target}
              </p>
            )}
          </header>

          <ul className="divide-y divide-line-soft">
            {block.items.map((item, i) => (
              <BlockItemRow key={`${block.id}-${item.exerciseId}-${i}`} item={item} index={i} />
            ))}
          </ul>

          <footer className="space-y-1.5 border-t border-line-soft px-4 py-2.5">
            {block.restBetweenSetsSec ? (
              <p className="flex items-center gap-1.5 text-[12px] text-muted">
                <Repeat size={12} /> {block.restBetweenSetsSec} s entre series o rondas
              </p>
            ) : null}
            <p className="flex items-start gap-1.5 text-[12px] text-faint">
              <Info size={12} className="mt-0.5 shrink-0" />
              {block.notes ?? FORMAT_HELP[block.format]}
            </p>
          </footer>
        </article>
      ))}
    </div>
  )
}

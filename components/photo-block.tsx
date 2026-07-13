import type { Official } from '@/lib/types'

// Initials fallback before a portrait is revealed. Strips academic titles.
function initials(name: string): string {
  const core = name.replace(/^(dr|drs|prof|ir|komjen|pol|hj?)\.?\s*/gi, '').trim()
  const parts = core.split(/[\s.]+/).filter(Boolean)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase()
}

// Sizes are cell-relative: cqw = 1% of the cell width (cell is a container).
export function PhotoBlock({ official }: { official: Official }) {
  const revealed = official.confirmed

  return (
    <div className="flex flex-col items-center">
      <div
        className={
          revealed
            ? 'h-[74cqw] w-[74cqw] overflow-hidden rounded-full ring-[1.5cqw] ring-gold shadow-[0_0_8cqw_var(--gold)] [animation:fadeInSig_700ms_ease-out]'
            : 'flex h-[74cqw] w-[74cqw] items-center justify-center rounded-full border-[0.4cqw] border-foreground/20 bg-foreground/[0.03]'
        }
      >
        {revealed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={encodeURI(official.photo)}
            alt={official.name}
            className="h-full w-full object-cover object-top"
          />
        ) : (
          <span className="font-serif text-[16cqw] tracking-wide text-foreground/25">
            {initials(official.name)}
          </span>
        )}
      </div>
      <p className="mt-[5cqw] line-clamp-2 max-w-full text-center font-serif text-[9.5cqw] font-semibold leading-tight text-foreground">
        {official.position}
      </p>
      <p className="mt-[1.5cqw] line-clamp-1 max-w-full text-center font-mono text-[7cqw] uppercase tracking-[0.06em] text-muted-foreground">
        {official.name}
      </p>
    </div>
  )
}

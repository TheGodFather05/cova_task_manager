import { ThemeToggle } from './components/ThemeToggle'

const QUADRANTS = [
  { label: 'Do first', axes: 'Important · Urgent', className: 'bg-do-first' },
  { label: 'Schedule', axes: 'Important · Not urgent', className: 'bg-schedule' },
  { label: 'Delegate', axes: 'Not important · Urgent', className: 'bg-delegate' },
  { label: 'Drop', axes: 'Not important · Not urgent', className: 'bg-drop' },
]

const HEAT = ['bg-heat-0', 'bg-heat-1', 'bg-heat-2', 'bg-heat-3', 'bg-heat-4']

export default function App() {
  return (
    <div className="min-h-dvh bg-ground">
      <div className="mx-auto flex max-w-[1120px] flex-col gap-12 px-6 py-16">
        <header className="flex items-start justify-between gap-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3.5">
              <div className="flex size-11 items-center justify-center rounded-card bg-primary text-base font-bold text-on-primary">
                TL
              </div>
              <span className="text-2xl font-semibold text-primary-deep">Taskline</span>
            </div>
            <p className="max-w-[600px] text-body text-muted">
              Foundations. Every colour below is a token that swaps with the theme — the markup
              never changes.
            </p>
          </div>
          <ThemeToggle />
        </header>

        <Section title="Palette">
          <div className="flex flex-wrap gap-3">
            <Swatch className="bg-primary" name="Primary" />
            <Swatch className="bg-primary-deep" name="Deep" />
            <Swatch className="bg-accent" name="Accent" />
            <Swatch className="bg-primary-tint" name="Tint" dark />
            <Swatch className="bg-surface" name="Surface" dark />
            <Swatch className="bg-ground" name="Ground" dark />
            <Swatch className="bg-danger" name="Danger" />
          </div>
        </Section>

        <Section title="Type">
          <div className="flex flex-col gap-2">
            <p className="text-display font-semibold text-ink">Display 30 / 600</p>
            <p className="text-heading font-semibold text-ink">Heading 20 / 600</p>
            <p className="text-body font-medium text-ink">Body 15 / 500 — task titles, labels</p>
            <p className="text-secondary text-muted">Secondary 14 / 400 — descriptions and meta</p>
            <p className="font-mono text-secondary text-muted">IBM Plex Mono — 2026-09-18T14:30Z</p>
          </div>
        </Section>

        <Section title="Buttons">
          <div className="flex flex-wrap items-center gap-3">
            <button className="rounded-control bg-primary px-4 py-2.5 text-secondary font-semibold text-on-primary transition-colors hover:bg-primary-deep">
              Primary
            </button>
            <button className="rounded-control bg-accent px-4 py-2.5 text-secondary font-semibold text-white transition-colors hover:bg-accent-hover">
              New task
            </button>
            <button className="rounded-control border border-line bg-surface px-4 py-2.5 text-secondary font-medium text-muted transition-colors hover:border-primary hover:text-primary">
              Cancel
            </button>
            <button
              disabled
              className="cursor-not-allowed rounded-control bg-primary/40 px-4 py-2.5 text-secondary font-semibold text-on-primary"
            >
              Saving…
            </button>
            <button className="rounded-control border border-danger/40 bg-danger-tint px-4 py-2.5 text-secondary font-semibold text-danger">
              Delete
            </button>
          </div>
        </Section>

        <Section title="Priority badges">
          <div className="flex flex-wrap gap-3">
            {QUADRANTS.map((quadrant) => (
              <div
                key={quadrant.label}
                className="flex items-center gap-2.5 rounded-card border border-line bg-surface px-3.5 py-2.5"
              >
                <span className={`size-2.5 rounded-pill ${quadrant.className}`} />
                <span className="text-secondary font-semibold text-ink">{quadrant.label}</span>
                <span className="text-xs text-muted">{quadrant.axes}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Heatmap ramp">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted">Less</span>
            {HEAT.map((step) => (
              <span key={step} className={`size-4 rounded-[3px] ${step}`} />
            ))}
            <span className="text-xs text-muted">More</span>
          </div>
        </Section>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xs font-semibold tracking-[0.1em] text-muted uppercase">{title}</h2>
      {children}
    </section>
  )
}

function Swatch({ className, name, dark }: { className: string; name: string; dark?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className={`size-20 rounded-card border border-line ${className}`} />
      <span className={`text-xs ${dark ? 'text-muted' : 'text-muted'}`}>{name}</span>
    </div>
  )
}

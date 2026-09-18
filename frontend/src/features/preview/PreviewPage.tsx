import { useState } from 'react'
import {
  Alert,
  Button,
  Chip,
  ConfirmDialog,
  EmptyState,
  Field,
  QuadrantBadge,
  Select,
  SkeletonRows,
  StatusBadge,
} from '../../components/ui'
import { QUADRANTS, TASK_STATUSES } from '../../types/task'

/**
 * Dev-only gallery. Every component renders here, including the states real data rarely
 * produces, so they can be checked before they reach a screen.
 */
export function PreviewPage() {
  const [chip, setChip] = useState('All')
  const [confirming, setConfirming] = useState(false)

  return (
    <div className="flex flex-col gap-10">
      <h1 className="text-display font-semibold text-ink">Component preview</h1>

      <Section title="Buttons">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Primary</Button>
          <Button variant="accent">+ New task</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Cancel</Button>
          <Button variant="danger">Delete</Button>
          <Button pending pendingLabel="Saving…">
            Save
          </Button>
          <Button disabled>Disabled</Button>
        </div>
      </Section>

      <Section title="Status chips">
        <div className="flex flex-wrap gap-2">
          {['All', ...TASK_STATUSES].map((value) => (
            <Chip key={value} label={value} active={chip === value} onClick={() => setChip(value)} />
          ))}
        </div>
      </Section>

      <Section title="Badges">
        <div className="flex flex-wrap items-center gap-2">
          {TASK_STATUSES.map((status) => (
            <StatusBadge key={status} status={status} />
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {QUADRANTS.map((quadrant) => (
            <QuadrantBadge key={quadrant} quadrant={quadrant} showAxes />
          ))}
        </div>
      </Section>

      <Section title="Fields">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Title" placeholder="Migrate billing service" />
          <Field label="Email" defaultValue="not-an-email" error="Enter a valid email address." />
          <Select
            label="Status"
            options={TASK_STATUSES.map((value) => ({ value, label: value }))}
          />
          <Field label="With hint" hint="Helper text sits in neutral grey." />
        </div>
      </Section>

      <Section title="Feedback">
        <Alert title="Couldn't load tasks" detail="Check your connection and retry." />
        <Button variant="danger" onClick={() => setConfirming(true)}>
          Open delete confirmation
        </Button>
      </Section>

      <Section title="Loading">
        <SkeletonRows rows={3} />
      </Section>

      <Section title="Empty">
        <EmptyState
          title="No tasks yet"
          description="Everything you are working on will show up here. Start with the first one."
          action={<Button variant="accent">Create your first task</Button>}
        />
      </Section>

      <ConfirmDialog
        open={confirming}
        title="Delete this task?"
        description="“Migrate billing service to v2 API” will be removed. This can’t be undone."
        confirmLabel="Delete task"
        onConfirm={() => setConfirming(false)}
        onCancel={() => setConfirming(false)}
      />
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xs font-semibold tracking-[0.1em] text-muted uppercase">{title}</h2>
      {children}
    </section>
  )
}

export function Alert({ title, detail }: { title: string; detail?: string }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2.5 rounded-control border border-danger/50
                 bg-danger-tint/50 px-3.5 py-3"
    >
      <span className="mt-1.5 size-[7px] shrink-0 rounded-pill bg-danger" />
      <div className="flex flex-col gap-0.5">
        <p className="text-secondary font-medium text-ink">{title}</p>
        {detail ? <p className="text-xs text-muted">{detail}</p> : null}
      </div>
    </div>
  )
}

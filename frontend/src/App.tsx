export default function App() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-[1120px] flex-col justify-center gap-4 px-6">
      <div className="flex items-center gap-3.5">
        <div className="flex size-11 items-center justify-center rounded-xl bg-primary text-base font-bold text-white">
          TL
        </div>
        <h1 className="text-2xl font-semibold text-primary-deep">Taskline</h1>
      </div>
      <p className="max-w-[560px] text-[15px] leading-relaxed text-muted">
        Frontend scaffold. Design tokens, routing and screens follow.
      </p>
    </main>
  )
}

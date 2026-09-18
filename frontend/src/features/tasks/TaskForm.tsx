import { useState, type FormEvent } from 'react'
import { HttpError, taskApi } from '../../api'
import { Alert, Button, Field, Modal, Select } from '../../components/ui'
import { useToast } from '../../components/toast/useToast'
import { STATUS_LABELS } from '../../types/labels'
import { TASK_STATUSES, type Task, type TaskInput, type TaskStatus } from '../../types/task'
import { QuadrantSelector } from './QuadrantSelector'
import { axesOf, type Axes } from './quadrant'

interface TaskFormProps {
  open: boolean
  task: Task | null
  onClose: () => void
  onSaved: () => void
}

export function TaskForm({ open, task, onClose, onSaved }: TaskFormProps) {
  const { notify } = useToast()
  const [title, setTitle] = useState(task?.title ?? '')
  const [description, setDescription] = useState(task?.description ?? '')
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? 'TODO')
  const [axes, setAxes] = useState<Axes | null>(task ? axesOf(task.quadrant) : null)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [pending, setPending] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (!axes) {
      setFieldErrors({ priority: 'Pick a priority.' })
      return
    }

    setPending(true)
    setError(null)
    setFieldErrors({})

    // no quadrant field exists on the payload: it is derived server-side from the two axes
    const input: TaskInput = {
      title: title.trim(),
      description: description.trim() || null,
      status,
      importance: axes.importance,
      urgency: axes.urgency,
    }

    try {
      if (task) {
        await taskApi.update(task.id, input)
      } else {
        await taskApi.create(input)
      }
      notify({
        title: task ? 'Task saved' : 'Task created',
        detail: `“${input.title}” ${task ? 'updated' : 'added'}.`,
      })
      onSaved()
    } catch (caught) {
      if (caught instanceof HttpError) {
        setFieldErrors(caught.fieldErrors)
        setError(
          caught.status === 404
            ? 'That task no longer exists.'
            : (caught.message ?? 'Something went wrong.'),
        )
      } else {
        setError('Network error — try again.')
      }
      notify({ tone: 'error', title: "Couldn't save task", detail: 'Network error — try again.' })
    } finally {
      setPending(false)
    }
  }

  return (
    <Modal
      open={open}
      title={task ? 'Edit task' : 'New task'}
      description={task ? 'Changes apply immediately.' : 'Both priority axes are required.'}
      onClose={onClose}
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        {error ? <Alert title={error} /> : null}

        <Field
          label="Title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Migrate billing service"
          maxLength={255}
          error={fieldErrors.title}
          required
          autoFocus
        />

        <div className="flex flex-col gap-2">
          <label htmlFor="task-description" className="text-secondary font-medium text-ink">
            Description
          </label>
          <textarea
            id="task-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
            maxLength={5000}
            className="w-full resize-y rounded-control border border-line bg-raised px-3.5 py-3
                       text-secondary text-ink transition-colors outline-none
                       placeholder:text-faint focus:border-primary focus:ring-2 focus:ring-primary/20"
            placeholder="What does done look like?"
          />
        </div>

        <Select
          label="Status"
          value={status}
          onChange={(event) => setStatus(event.target.value as TaskStatus)}
          options={TASK_STATUSES.map((value) => ({ value, label: STATUS_LABELS[value] }))}
        />

        <QuadrantSelector value={axes} onChange={setAxes} error={fieldErrors.priority} />

        <div className="mt-1 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" pending={pending} pendingLabel="Saving…">
            {task ? 'Save task' : 'Create task'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

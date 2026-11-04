import { onScopeDispose, ref } from 'vue'
import type { NoteContent, NotesError } from '../types/note'
import { readNoteDraft, removeNoteDraft, writeNoteDraft } from '../utils/note-draft-storage'

const DRAFT_DELAY = 500

export function useNoteDraft(noteId: string | null) {
  const error = ref<NotesError | null>(null)

  let pending: NoteContent | null = null
  let timer: ReturnType<typeof setTimeout> | undefined
  let active = true

  function cancelTimer() {
    clearTimeout(timer)

    timer = undefined
  }

  function load(): NoteContent | null {
    const result = readNoteDraft(noteId)

    error.value = result.ok ? null : result.error

    return result.ok ? result.data : null
  }

  function flush() {
    cancelTimer()

    if (!active || !pending) {
      return
    }

    const result = writeNoteDraft(noteId, pending)

    error.value = result.ok ? null : result.error

    if (result.ok) {
      pending = null
    }
  }

  function schedule(content: NoteContent) {
    if (!active) {
      return
    }

    cancelTimer()

    pending = {
      title: content.title,
      todos: content.todos.map((todo) => {
        return {
          ...todo,
        }
      }),
    }

    timer = setTimeout(flush, DRAFT_DELAY)
  }

  function clear(): boolean {
    cancelTimer()

    const result = removeNoteDraft(noteId)

    error.value = result.ok ? null : result.error

    if (result.ok) {
      pending = null
    } else if (active && pending) {
      timer = setTimeout(flush, DRAFT_DELAY)
    }

    return result.ok
  }

  function stop() {
    cancelTimer()

    pending = null
    active = false

    window.removeEventListener('pagehide', flush)
  }

  window.addEventListener('pagehide', flush)

  onScopeDispose(() => {
    flush()
    stop()
  })

  return {
    error,
    load,
    schedule,
    flush,
    clear,
    stop,
  }
}

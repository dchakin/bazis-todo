import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useNotesStore } from '../app/stores/notes'
import type { Note } from '../app/types/note'
import { createTodo } from '../app/utils/notes'
import { NOTES_STORAGE_KEY, readNotes, writeNotes } from '../app/utils/notes-storage'
import { createTestStorage } from './helpers/storage'

const first: Note = {
  id: 'note-1',
  title: 'Первая заметка',
  todos: [
    {
      id: 'todo-1',
      text: 'Первая задача',
      completed: false,
    },
  ],
}

const second: Note = {
  id: 'note-2',
  title: 'Вторая заметка',
  todos: [],
}

const actions = [
  {
    name: 'create',
    run(store: ReturnType<typeof useNotesStore>) {
      return store.createNote({
        title: 'Новая заметка',
        todos: [],
      })
    },
  },
  {
    name: 'update',
    run(store: ReturnType<typeof useNotesStore>) {
      return store.updateNote({
        ...first,
        title: 'Изменения',
      })
    },
  },
  {
    name: 'delete',
    run(store: ReturnType<typeof useNotesStore>) {
      return store.deleteNote(first.id)
    },
  },
]

let storage: ReturnType<typeof createTestStorage>

beforeEach(() => {
  setActivePinia(createPinia())

  storage = createTestStorage()

  vi.stubGlobal('localStorage', storage)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('notes store', () => {
  it('loads saved notes without writing, and returns undefined for an unknown ID', () => {
    writeNotes([first, second])
    storage.setItem.mockClear()

    const store = useNotesStore()

    expect(store.loadNotes().ok).toBe(true)
    expect(store.notes).toEqual([first, second])
    expect(store.getNote('missing')).toBeUndefined()
    expect(storage.setItem).not.toHaveBeenCalled()
  })

  it('creates notes and tasks with distinct stable IDs and reloads them', () => {
    const store = useNotesStore()
    const todo = createTodo('Купить хлеб')
    const anotherTodo = createTodo()
    const created = store.createNote({
      title: 'Покупки',
      todos: [todo, anotherTodo],
    })

    expect(created.ok).toBe(true)

    if (!created.ok) {
      throw new Error(created.error.message)
    }

    const another = store.createNote({
      title: 'Идеи',
      todos: [],
    })

    expect(another.ok).toBe(true)
    expect(created.data.id).toBeTruthy()
    expect(created.data.id).not.toBe('new')
    expect(todo.id).not.toBe(anotherTodo.id)
    expect(todo.completed).toBe(false)
    expect(anotherTodo.text).toBe('')
    expect(store.notes[1]?.id).not.toBe(created.data.id)

    const reloaded = useNotesStore(createPinia())

    expect(reloaded.loadNotes().ok).toBe(true)
    expect(reloaded.getNote(created.data.id)).toEqual(created.data)
    expect(reloaded.notes).toEqual(store.notes)
  })

  it('keeps editing local until save, then persists title and task changes with the same IDs', () => {
    writeNotes([first, second])

    const store = useNotesStore()

    store.loadNotes()

    const draft = store.getNote(first.id)!
    const savedRaw = storage.getItem(NOTES_STORAGE_KEY)

    storage.setItem.mockClear()

    draft.title = 'Рабочая копия'
    draft.todos[0]!.text = 'Готово'
    draft.todos[0]!.completed = true
    draft.todos.push(createTodo('Вторая задача'))

    expect(store.getNote(first.id)).toEqual(first)
    expect(storage.getItem(NOTES_STORAGE_KEY)).toBe(savedRaw)
    expect(storage.setItem).not.toHaveBeenCalled()

    const saved = store.updateNote(draft)

    expect(saved).toEqual({
      ok: true,
      data: draft,
    })

    expect(store.getNote(first.id)).toEqual(draft)
    expect(store.getNote(first.id)?.todos[0]?.id).toBe(first.todos[0]?.id)

    const reloaded = useNotesStore(createPinia())

    reloaded.loadNotes()

    expect(reloaded.getNote(first.id)).toEqual(draft)
    expect(reloaded.getNote(second.id)).toEqual(second)

    draft.title = 'Дальнейший ввод'
    draft.todos[0]!.text = 'Другой текст'

    if (saved.ok) {
      saved.data.todos.length = 0
    }

    expect(store.getNote(first.id)).toEqual(reloaded.getNote(first.id))
  })

  it('does not share saved data with creation input or the returned note', () => {
    const store = useNotesStore()
    const content = {
      title: 'Новая',
      todos: [createTodo('Задача')],
    }

    const result = store.createNote(content)

    expect(result.ok).toBe(true)

    content.title = 'Изменённый ввод'
    content.todos[0]!.text = 'Изменённая задача'

    if (result.ok) {
      result.data.title = 'Изменённый результат'
      result.data.todos.length = 0
    }

    expect(store.notes[0]?.title).toBe('Новая')
    expect(store.notes[0]?.todos[0]?.text).toBe('Задача')
    expect(readNotes()).toEqual({
      ok: true,
      data: store.notes,
    })
  })

  it('deletes only the requested note and persists the deletion', () => {
    writeNotes([first, second])

    const store = useNotesStore()

    store.loadNotes()

    expect(store.deleteNote(first.id).ok).toBe(true)
    expect(store.notes).toEqual([second])
    expect(store.getNote(first.id)).toBeUndefined()
    expect(readNotes()).toEqual({
      ok: true,
      data: [second],
    })
  })

  it.each(actions)('keeps saved state unchanged on a failed $name and permits retry', ({ run }) => {
    writeNotes([first])

    const store = useNotesStore()

    store.loadNotes()

    const previousRaw = storage.getItem(NOTES_STORAGE_KEY)

    storage.setItem.mockImplementationOnce(() => {
      throw new DOMException('Full', 'QuotaExceededError')
    })

    expect(run(store)).toMatchObject({
      ok: false,
      error: {
        code: 'write-failed',
      },
    })

    expect(store.error?.code).toBe('write-failed')
    expect(store.notes).toEqual([first])
    expect(storage.getItem(NOTES_STORAGE_KEY)).toBe(previousRaw)
    expect(run(store).ok).toBe(true)
    expect(store.error).toBeNull()
  })

  it.each(actions)('does not overwrite damaged storage on $name', ({ run }) => {
    writeNotes([first])

    const store = useNotesStore()

    store.loadNotes()

    storage.setItem(NOTES_STORAGE_KEY, '{broken')
    storage.setItem.mockClear()

    expect(run(store)).toMatchObject({
      ok: false,
      error: {
        code: 'invalid-data',
      },
    })

    expect(store.notes).toEqual([first])
    expect(storage.getItem(NOTES_STORAGE_KEY)).toBe('{broken')
    expect(storage.setItem).not.toHaveBeenCalled()
  })

  it('retains loaded notes on load failure and clears the error after recovery', () => {
    writeNotes([first])

    const store = useNotesStore()

    store.loadNotes()
    storage.getItem.mockImplementationOnce(() => {
      throw new DOMException('Blocked', 'SecurityError')
    })

    expect(store.loadNotes().ok).toBe(false)
    expect(store.error?.code).toBe('read-failed')
    expect(store.notes).toEqual([first])
    expect(store.loadNotes().ok).toBe(true)
    expect(store.error).toBeNull()
  })

  it.each(['empty list', 'missing key'])(
    'rejects saving an externally deleted note: %s',
    (scenario) => {
      writeNotes([first, second])

      const store = useNotesStore()

      store.loadNotes()

      const draft = store.getNote(first.id)!

      draft.title = 'Устаревшая копия'

      if (scenario === 'missing key') {
        storage.removeItem(NOTES_STORAGE_KEY)
      } else {
        writeNotes([second])
      }

      const latestRaw = storage.getItem(NOTES_STORAGE_KEY)

      storage.setItem.mockClear()

      expect(store.updateNote(draft)).toMatchObject({
        ok: false,
        error: {
          code: 'not-found',
        },
      })

      expect(store.getNote(first.id)).toBeUndefined()
      expect(storage.getItem(NOTES_STORAGE_KEY)).toBe(latestRaw)
      expect(storage.setItem).not.toHaveBeenCalled()
    },
  )

  it.each(actions)(
    'merges $name into current storage without restoring deleted or losing new notes',
    ({ run }) => {
      writeNotes([first, second])

      const store = useNotesStore()

      store.loadNotes()

      const external: Note = {
        id: 'external-note',
        title: 'Из другой вкладки',
        todos: [],
      }

      writeNotes([first, external])

      expect(run(store).ok).toBe(true)
      expect(store.getNote(second.id)).toBeUndefined()
      expect(store.getNote(external.id)).toEqual(external)
      expect(readNotes()).toEqual({
        ok: true,
        data: store.notes,
      })
    },
  )

  it('reports a missing note on delete without writing stale data', () => {
    writeNotes([first])

    const store = useNotesStore()

    store.loadNotes()
    writeNotes([])
    storage.setItem.mockClear()

    expect(store.deleteNote(first.id)).toMatchObject({
      ok: false,
      error: {
        code: 'not-found',
      },
    })

    expect(store.notes).toEqual([])
    expect(storage.setItem).not.toHaveBeenCalled()
  })
})

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Note } from '../app/types/note'
import { NOTES_STORAGE_KEY, readNotes, writeNotes } from '../app/utils/notes-storage'
import { createTestStorage } from './helpers/storage'

const note: Note = {
  id: 'note-1',
  title: 'Покупки',
  todos: [
    {
      id: 'todo-1',
      text: 'Молоко',
      completed: true,
    },
  ],
}

let storage: ReturnType<typeof createTestStorage>

beforeEach(() => {
  storage = createTestStorage()

  vi.stubGlobal('localStorage', storage)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('notes storage', () => {
  it('reads missing storage as an empty list without writing', () => {
    expect(readNotes()).toEqual({
      ok: true,
      data: [],
    })

    expect(storage.setItem).not.toHaveBeenCalled()
  })

  it('writes version 1 and reads back IDs, text and completion', () => {
    expect(writeNotes([note]).ok).toBe(true)

    expect(JSON.parse(storage.getItem(NOTES_STORAGE_KEY)!)).toEqual({
      schemaVersion: 1,
      notes: [note],
    })

    expect(readNotes()).toEqual({
      ok: true,
      data: [note],
    })
  })

  it('accepts notes without tasks', () => {
    const emptyNote: Note = {
      id: 'empty-note',
      title: 'Идеи',
      todos: [],
    }

    writeNotes([emptyNote])

    expect(readNotes()).toEqual({
      ok: true,
      data: [emptyNote],
    })
  })

  it.each([
    ['invalid JSON', '{broken'],
    ['empty value', ''],
    ['null', 'null'],
    ['array', '[]'],
    [
      'missing version',
      JSON.stringify({
        notes: [],
      }),
    ],
    [
      'string version',
      JSON.stringify({
        schemaVersion: '1',
        notes: [],
      }),
    ],
    [
      'missing notes',
      JSON.stringify({
        schemaVersion: 1,
      }),
    ],
    [
      'non-array notes',
      JSON.stringify({
        schemaVersion: 1,
        notes: {},
      }),
    ],
    ...[
      null,
      {
        ...note,
        id: '',
      },
      {
        ...note,
        id: 'new',
      },
      {
        ...note,
        title: 123,
      },
      {
        ...note,
        todos: null,
      },
      {
        ...note,
        todos: [null],
      },
      {
        ...note,
        todos: [
          {
            id: ' ',
            text: 'Задача',
            completed: false,
          },
        ],
      },
      {
        ...note,
        todos: [
          {
            id: 'todo-1',
            text: 123,
            completed: false,
          },
        ],
      },
      {
        ...note,
        todos: [
          {
            id: 'todo-1',
            text: 'Задача',
            completed: 'false',
          },
        ],
      },
      {
        ...note,
        todos: [note.todos[0], note.todos[0]],
      },
    ].map((invalidNote, index) => {
      return [
        `invalid note ${index + 1}`,
        JSON.stringify({
          schemaVersion: 1,
          notes: [invalidNote],
        }),
      ]
    }),
    [
      'duplicate note IDs',
      JSON.stringify({
        schemaVersion: 1,
        notes: [note, note],
      }),
    ],
  ])('rejects %s without changing stored data', (_name, raw) => {
    storage.setItem(NOTES_STORAGE_KEY, raw!)
    storage.setItem.mockClear()

    expect(readNotes()).toMatchObject({
      ok: false,
      error: {
        code: 'invalid-data',
      },
    })

    expect(storage.getItem(NOTES_STORAGE_KEY)).toBe(raw)
    expect(storage.setItem).not.toHaveBeenCalled()
  })

  it.each([0, 2])('rejects unsupported version %s without overwriting it', (schemaVersion) => {
    const raw = JSON.stringify({
      schemaVersion,
      notes: [note],
    })

    storage.setItem(NOTES_STORAGE_KEY, raw)
    storage.setItem.mockClear()

    expect(readNotes()).toMatchObject({
      ok: false,
      error: {
        code: 'unsupported-version',
      },
    })

    expect(storage.getItem(NOTES_STORAGE_KEY)).toBe(raw)
    expect(storage.setItem).not.toHaveBeenCalled()
  })

  it('reports a read error when storage is blocked', () => {
    storage.getItem.mockImplementation(() => {
      throw new DOMException('Blocked', 'SecurityError')
    })

    expect(readNotes()).toMatchObject({
      ok: false,
      error: {
        code: 'read-failed',
      },
    })
  })

  it('reports errors when localStorage is unavailable', () => {
    vi.stubGlobal('localStorage', undefined)

    expect(readNotes()).toMatchObject({
      ok: false,
      error: {
        code: 'read-failed',
      },
    })

    expect(writeNotes([note])).toMatchObject({
      ok: false,
      error: {
        code: 'write-failed',
      },
    })
  })

  it('reports quota errors and keeps the previous saved data', () => {
    writeNotes([note])

    const previous = storage.getItem(NOTES_STORAGE_KEY)

    storage.setItem.mockImplementation(() => {
      throw new DOMException('Full', 'QuotaExceededError')
    })

    expect(writeNotes([])).toMatchObject({
      ok: false,
      error: {
        code: 'write-failed',
      },
    })

    expect(storage.getItem(NOTES_STORAGE_KEY)).toBe(previous)
  })
})

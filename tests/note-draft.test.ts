import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope } from 'vue'
import { useNoteDraft } from '../app/composables/useNoteDraft'
import { useNoteHistory } from '../app/composables/useNoteHistory'
import { NOTES_ERROR_CODES } from '../app/constants/notes-errors'
import type { NoteContent } from '../app/types/note'
import { noteDraftKey, readNoteDraft, writeNoteDraft } from '../app/utils/note-draft-storage'
import { createTestStorage } from './helpers/storage'

let storage: ReturnType<typeof createTestStorage>
let target: EventTarget
let scopes: ReturnType<typeof effectScope>[]

function session(noteId: string | null = 'note-1') {
  const scope = effectScope()

  scopes.push(scope)

  const draft = scope.run(() => {
    return useNoteDraft(noteId)
  })!

  return {
    draft,
    scope,
  }
}

function content(title = 'Черновик'): NoteContent {
  return {
    title,
    todos: [
      {
        id: 'todo-1',
        text: 'Задача',
        completed: false,
      },
    ],
  }
}

beforeEach(() => {
  vi.useFakeTimers()

  scopes = []
  storage = createTestStorage()
  target = new EventTarget()

  vi.stubGlobal('sessionStorage', storage)
  vi.stubGlobal('window', target)
})

afterEach(() => {
  for (const scope of scopes) {
    scope.stop()
  }

  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('note draft session', () => {
  it('writes 500 ms after the last change without waiting for blur', () => {
    const { draft } = session()

    draft.schedule(content('Первый ввод'))

    vi.advanceTimersByTime(400)

    draft.schedule(content('Последний ввод'))

    vi.advanceTimersByTime(499)

    expect(storage.setItem).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1)

    expect(storage.setItem).toHaveBeenCalledTimes(1)
    expect(readNoteDraft('note-1')).toMatchObject({
      data: content('Последний ввод'),
    })
    expect(vi.getTimerCount()).toBe(0)
  })

  it('copies scheduled content independently of later unscheduled mutations', () => {
    const { draft } = session()
    const note = content()

    draft.schedule(note)

    note.title = 'Позднее'
    note.todos[0]!.text = 'Позднее'

    vi.advanceTimersByTime(500)

    expect(readNoteDraft('note-1')).toMatchObject({
      data: content(),
    })
  })

  it('flushes the pending title and task on pagehide and cancels the timeout', () => {
    const { draft } = session(null)
    const note = content('Без blur')

    note.todos[0]!.text = 'Тоже без blur'

    draft.schedule(note)
    target.dispatchEvent(new Event('pagehide'))

    expect(readNoteDraft(null)).toMatchObject({
      data: note,
    })
    expect(vi.getTimerCount()).toBe(0)

    vi.advanceTimersByTime(1000)
    target.dispatchEvent(new Event('pagehide'))

    expect(storage.setItem).toHaveBeenCalledTimes(1)
  })

  it.each([null, 'note-1'])(
    'offers %s drafts without writing and starts restored history empty',
    (id) => {
      writeNoteDraft(id, content())
      storage.setItem.mockClear()

      const { draft } = session(id)
      const restored = draft.load()!
      const history = useNoteHistory(restored)

      expect(restored).toEqual(content())
      expect(history.canUndo.value).toBe(false)
      expect(history.canRedo.value).toBe(false)
      expect(storage.setItem).not.toHaveBeenCalled()
    },
  )

  it('discards a draft without affecting another note and accepts new edits', () => {
    writeNoteDraft('note-1', content())
    writeNoteDraft('note-2', content('Другая'))

    const { draft } = session()

    draft.schedule(content('Ожидает'))

    expect(draft.clear()).toBe(true)

    vi.advanceTimersByTime(1000)
    target.dispatchEvent(new Event('pagehide'))

    expect(readNoteDraft('note-1')).toMatchObject({
      data: null,
    })
    expect(readNoteDraft('note-2')).toMatchObject({
      data: content('Другая'),
    })

    draft.schedule(content('Снова'))

    vi.advanceTimersByTime(500)

    expect(readNoteDraft('note-1')).toMatchObject({
      data: content('Снова'),
    })
  })

  it('cannot recreate a cleared draft after save, cancel or external deletion', () => {
    const { draft, scope } = session()

    draft.schedule(content())
    draft.stop()
    draft.clear()
    draft.schedule(content('Запоздалое изменение'))
    target.dispatchEvent(new Event('pagehide'))
    scope.stop()

    vi.advanceTimersByTime(1000)

    expect(storage.getItem(noteDraftKey('note-1'))).toBeNull()
    expect(storage.setItem).not.toHaveBeenCalled()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('flushes on scope disposal, then removes the pagehide listener and timer', () => {
    const removeListener = vi.spyOn(target, 'removeEventListener')
    const { draft, scope } = session()

    draft.schedule(content())
    scope.stop()

    expect(readNoteDraft('note-1')).toMatchObject({
      data: content(),
    })
    expect(removeListener).toHaveBeenCalledWith('pagehide', draft.flush)
    expect(vi.getTimerCount()).toBe(0)

    storage.setItem.mockClear()
    target.dispatchEvent(new Event('pagehide'))
    draft.schedule(content('После завершения'))

    vi.advanceTimersByTime(1000)

    expect(storage.setItem).not.toHaveBeenCalled()
  })

  it('reports a failed write and retries pending content on pagehide', () => {
    const { draft } = session()

    storage.setItem.mockImplementationOnce(() => {
      throw new Error('Quota')
    })

    draft.schedule(content())

    vi.advanceTimersByTime(500)

    expect(draft.error.value?.code).toBe(NOTES_ERROR_CODES.writeFailed)

    target.dispatchEvent(new Event('pagehide'))

    expect(draft.error.value).toBeNull()
    expect(readNoteDraft('note-1')).toMatchObject({
      data: content(),
    })
  })

  it('keeps malformed drafts intact and exposes the error', () => {
    storage.setItem(noteDraftKey('note-1'), '{broken')

    const { draft } = session()

    expect(draft.load()).toBeNull()
    expect(draft.error.value?.code).toBe(NOTES_ERROR_CODES.invalidData)

    draft.schedule(content())

    vi.advanceTimersByTime(500)

    expect(storage.getItem(noteDraftKey('note-1'))).toBe('{broken')
    expect(draft.error.value?.code).toBe(NOTES_ERROR_CODES.invalidData)
  })

  it('reports failed removal and retains pending content for a final write', () => {
    const { draft } = session()

    draft.schedule(content())

    storage.removeItem.mockImplementationOnce(() => {
      throw new Error('Blocked')
    })

    expect(draft.clear()).toBe(false)
    expect(draft.error.value?.code).toBe(NOTES_ERROR_CODES.writeFailed)

    target.dispatchEvent(new Event('pagehide'))

    expect(readNoteDraft('note-1')).toMatchObject({
      data: content(),
    })
  })

  it('continues delayed autosave after draft removal fails', () => {
    const { draft } = session()

    draft.schedule(content('Последний ввод'))

    vi.advanceTimersByTime(200)

    storage.removeItem.mockImplementationOnce(() => {
      throw new Error('Blocked')
    })

    expect(draft.clear()).toBe(false)
    expect(draft.error.value?.code).toBe(NOTES_ERROR_CODES.writeFailed)

    vi.advanceTimersByTime(500)

    expect(readNoteDraft('note-1')).toMatchObject({
      data: content('Последний ввод'),
    })
    expect(draft.error.value).toBeNull()
  })

  it('removes the pagehide listener immediately when editing stops', () => {
    const removeListener = vi.spyOn(target, 'removeEventListener')
    const { draft } = session()

    draft.schedule(content())
    draft.stop()

    expect(removeListener).toHaveBeenCalledWith('pagehide', draft.flush)

    storage.removeItem.mockImplementationOnce(() => {
      throw new Error('Blocked')
    })

    expect(draft.clear()).toBe(false)
    expect(vi.getTimerCount()).toBe(0)

    target.dispatchEvent(new Event('pagehide'))

    expect(storage.setItem).not.toHaveBeenCalled()
  })
})

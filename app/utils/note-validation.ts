import type { Note, NoteContent, Todo } from '../types/note'

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isId(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isTodo(value: unknown): value is Todo {
  return (
    isRecord(value) &&
    isId(value.id) &&
    typeof value.text === 'string' &&
    typeof value.completed === 'boolean'
  )
}

export function isNoteContent(value: unknown): value is NoteContent {
  if (
    !isRecord(value) ||
    typeof value.title !== 'string' ||
    !Array.isArray(value.todos) ||
    !value.todos.every(isTodo)
  ) {
    return false
  }

  const todoIds = value.todos.map((todo) => {
    return todo.id
  })

  return new Set(todoIds).size === todoIds.length
}

export function isNote(value: unknown): value is Note {
  return isNoteContent(value) && isRecord(value) && isId(value.id) && value.id !== 'new'
}

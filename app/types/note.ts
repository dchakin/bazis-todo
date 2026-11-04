export interface Todo {
  id: string
  text: string
  completed: boolean
}

export interface NoteContent {
  title: string
  todos: Todo[]
}

export interface Note extends NoteContent {
  id: string
}

export interface NotesContainer {
  schemaVersion: 1
  notes: Note[]
}

export interface NotesError {
  code: 'read-failed' | 'invalid-data' | 'unsupported-version' | 'write-failed' | 'not-found'
  message: string
}

export type NotesResult<T> =
  | {
      ok: true
      data: T
    }
  | {
      ok: false
      error: NotesError
    }

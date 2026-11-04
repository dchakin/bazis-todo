import type { Todo } from './note'

export type NoteTextOperation =
  | {
      type: 'title'
      before: string
      after: string
    }
  | {
      type: 'todo-text'
      todoId: string
      before: string
      after: string
    }

export type NoteOperation =
  | NoteTextOperation
  | {
      type: 'todo-completed'
      todoId: string
      before: boolean
      after: boolean
    }
  | {
      type: 'todo-add'
      todo: Todo
      index: number
    }
  | {
      type: 'todo-remove'
      todo: Todo
      index: number
    }

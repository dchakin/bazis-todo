import type { Note, Todo } from '../types/note'

export function createTodo(text = ''): Todo {
  return {
    id: crypto.randomUUID(),
    text,
    completed: false,
  }
}

export function copyNote(note: Note): Note {
  return {
    id: note.id,
    title: note.title,
    todos: note.todos.map((todo) => {
      return {
        id: todo.id,
        text: todo.text,
        completed: todo.completed,
      }
    }),
  }
}

import { computed, ref } from 'vue'
import type { NoteContent, Todo } from '../types/note'
import type { NoteOperation, NoteTextOperation } from '../types/note-history'

const HISTORY_LIMIT = 50

export function useNoteHistory(draft: NoteContent) {
  const operations = ref<NoteOperation[]>([])
  const position = ref(0)
  const pendingText = ref<NoteTextOperation | null>(null)

  const canUndo = computed(() => {
    const hasTextChange =
      pendingText.value !== null && pendingText.value.before !== pendingText.value.after

    return position.value > 0 || hasTextChange
  })

  const canRedo = computed(() => {
    return position.value < operations.value.length
  })

  function discardRedo() {
    operations.value.splice(position.value)
  }

  function record(operation: NoteOperation) {
    discardRedo()

    operations.value.push(operation)

    if (operations.value.length > HISTORY_LIMIT) {
      operations.value.shift()
    }

    position.value = operations.value.length
  }

  function finishTextEdit() {
    const operation = pendingText.value

    pendingText.value = null

    if (operation && operation.before !== operation.after) {
      record(operation)
    }
  }

  function updateTitle(value: string) {
    if (draft.title === value) {
      return
    }

    if (pendingText.value?.type !== 'title') {
      finishTextEdit()

      pendingText.value = {
        type: 'title',
        before: draft.title,
        after: value,
      }
    } else {
      pendingText.value.after = value
    }

    discardRedo()

    draft.title = value
  }

  function updateTodoText(todoId: string, value: string) {
    const todo = draft.todos.find((item) => {
      return item.id === todoId
    })

    if (!todo || todo.text === value) {
      return
    }

    const isSameField =
      pendingText.value?.type === 'todo-text' && pendingText.value.todoId === todoId

    if (!isSameField) {
      finishTextEdit()

      pendingText.value = {
        type: 'todo-text',
        todoId,
        before: todo.text,
        after: value,
      }
    } else if (pendingText.value) {
      pendingText.value.after = value
    }

    discardRedo()

    todo.text = value
  }

  function apply(operation: NoteOperation, forward: boolean) {
    if (operation.type === 'title') {
      draft.title = forward ? operation.after : operation.before

      return
    }

    if (operation.type === 'todo-add' || operation.type === 'todo-remove') {
      const insert = (operation.type === 'todo-add') === forward

      if (insert) {
        draft.todos.splice(operation.index, 0, {
          ...operation.todo,
        })
      } else {
        const index = draft.todos.findIndex((todo) => {
          return todo.id === operation.todo.id
        })

        if (index !== -1) {
          draft.todos.splice(index, 1)
        }
      }

      return
    }

    const todo = draft.todos.find((item) => {
      return item.id === operation.todoId
    })

    if (!todo) {
      return
    }

    if (operation.type === 'todo-text') {
      todo.text = forward ? operation.after : operation.before
    } else {
      todo.completed = forward ? operation.after : operation.before
    }
  }

  function setTodoCompleted(todoId: string, value: boolean) {
    finishTextEdit()

    const todo = draft.todos.find((item) => {
      return item.id === todoId
    })

    if (!todo || todo.completed === value) {
      return
    }

    const operation: NoteOperation = {
      type: 'todo-completed',
      todoId,
      before: todo.completed,
      after: value,
    }

    apply(operation, true)
    record(operation)
  }

  function addTodo(todo: Todo) {
    finishTextEdit()

    const operation: NoteOperation = {
      type: 'todo-add',
      todo: {
        ...todo,
      },
      index: draft.todos.length,
    }

    apply(operation, true)
    record(operation)
  }

  function removeTodo(todoId: string) {
    finishTextEdit()

    const index = draft.todos.findIndex((todo) => {
      return todo.id === todoId
    })

    const todo = draft.todos[index]

    if (!todo) {
      return
    }

    const operation: NoteOperation = {
      type: 'todo-remove',
      todo: {
        ...todo,
      },
      index,
    }

    apply(operation, true)
    record(operation)
  }

  function undo() {
    finishTextEdit()

    const operation = operations.value[position.value - 1]

    if (!operation) {
      return
    }

    apply(operation, false)

    position.value -= 1
  }

  function redo() {
    finishTextEdit()

    const operation = operations.value[position.value]

    if (!operation) {
      return
    }

    apply(operation, true)

    position.value += 1
  }

  function reset() {
    operations.value = []
    position.value = 0
    pendingText.value = null
  }

  return {
    canUndo,
    canRedo,
    updateTitle,
    updateTodoText,
    setTodoCompleted,
    addTodo,
    removeTodo,
    finishTextEdit,
    undo,
    redo,
    reset,
  }
}

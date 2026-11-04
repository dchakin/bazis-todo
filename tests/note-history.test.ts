import { reactive } from 'vue'
import { describe, expect, it } from 'vitest'
import { useNoteHistory } from '../app/composables/useNoteHistory'
import type { NoteContent, Todo } from '../app/types/note'

function createSession() {
  const draft = reactive<NoteContent>({
    title: 'Планы',
    todos: [
      {
        id: 'first',
        text: 'Первая',
        completed: false,
      },
      {
        id: 'middle',
        text: 'Средняя',
        completed: true,
      },
      {
        id: 'last',
        text: 'Последняя',
        completed: false,
      },
    ],
  })

  return {
    draft,
    history: useNoteHistory(draft),
  }
}

const addedTodo: Todo = {
  id: 'added',
  text: 'Новая',
  completed: false,
}

describe('note history', () => {
  it('starts empty and safely handles undo and redo at the boundaries', () => {
    const { draft, history } = createSession()
    const original = structuredClone({
      title: draft.title,
      todos: draft.todos.map((todo) => {
        return {
          ...todo,
        }
      }),
    })

    expect(history.canUndo.value).toBe(false)
    expect(history.canRedo.value).toBe(false)

    history.undo()
    history.redo()

    expect(draft).toEqual(original)
  })

  it('groups title input into one step until blur and keeps raw whitespace', () => {
    const { draft, history } = createSession()

    history.updateTitle('П')
    history.updateTitle('По')
    history.updateTitle(' Покупки ')

    expect(draft.title).toBe(' Покупки ')
    expect(history.canUndo.value).toBe(true)

    history.finishTextEdit()
    history.finishTextEdit()
    history.undo()

    expect(draft.title).toBe('Планы')
    expect(history.canUndo.value).toBe(false)
    expect(history.canRedo.value).toBe(true)

    history.redo()
    history.redo()

    expect(draft.title).toBe(' Покупки ')
    expect(history.canRedo.value).toBe(false)

    history.undo()

    expect(draft.title).toBe('Планы')
    expect(history.canUndo.value).toBe(false)
  })

  it('starts a separate title step after blur', () => {
    const { draft, history } = createSession()

    history.updateTitle('Первый ввод')
    history.finishTextEdit()
    history.updateTitle('Второй ввод')
    history.finishTextEdit()
    history.undo()

    expect(draft.title).toBe('Первый ввод')

    history.undo()

    expect(draft.title).toBe('Планы')
  })

  it('groups task input and commits it before changing another field', () => {
    const { draft, history } = createSession()

    history.updateTodoText('first', 'Т')
    history.updateTodoText('first', 'Текст задачи')
    history.updateTodoText('middle', 'Вторая задача')
    history.updateTitle('Новое название')
    history.undo()

    expect(draft.title).toBe('Планы')

    history.undo()

    expect(draft.todos[1]?.text).toBe('Средняя')

    history.undo()

    expect(draft.todos[0]?.text).toBe('Первая')
    expect(history.canUndo.value).toBe(false)

    history.redo()
    history.redo()
    history.redo()

    expect(draft.title).toBe('Новое название')
    expect(draft.todos[0]?.text).toBe('Текст задачи')
    expect(draft.todos[1]?.text).toBe('Вторая задача')
  })

  it('does not record unchanged values or text returned to its initial value', () => {
    const { history } = createSession()

    history.updateTitle('Планы')
    history.finishTextEdit()
    history.updateTitle('Изменение')
    history.updateTitle('Планы')
    history.finishTextEdit()
    history.updateTodoText('first', 'Первая')
    history.updateTodoText('first', 'Изменение')
    history.updateTodoText('first', 'Первая')
    history.finishTextEdit()
    history.setTodoCompleted('first', false)
    history.removeTodo('missing')
    history.updateTodoText('missing', 'Не существует')
    history.setTodoCompleted('missing', true)

    expect(history.canUndo.value).toBe(false)
    expect(history.canRedo.value).toBe(false)
  })

  it('keeps each checkbox toggle as a separate reversible step', () => {
    const { draft, history } = createSession()

    history.setTodoCompleted('first', true)
    history.setTodoCompleted('first', false)
    history.undo()

    expect(draft.todos[0]?.completed).toBe(true)

    history.undo()

    expect(draft.todos[0]?.completed).toBe(false)
    expect(history.canUndo.value).toBe(false)

    history.redo()

    expect(draft.todos[0]?.completed).toBe(true)

    history.redo()

    expect(draft.todos[0]?.completed).toBe(false)
  })

  it('undoes and redoes task addition without sharing task data with the caller', () => {
    const { draft, history } = createSession()
    const input = {
      ...addedTodo,
    }

    history.addTodo(input)

    input.text = 'Внешнее изменение'

    expect(draft.todos.at(-1)).toEqual(addedTodo)

    history.undo()

    expect(draft.todos).toHaveLength(3)

    history.redo()

    expect(draft.todos.at(-1)).toEqual(addedTodo)

    history.updateTodoText('added', 'После добавления')
    history.undo()
    history.undo()
    history.redo()

    expect(draft.todos.at(-1)).toEqual(addedTodo)

    history.redo()

    expect(draft.todos.at(-1)?.text).toBe('После добавления')
  })

  it.each(['first', 'middle', 'last'])(
    'restores the deleted %s task with its ID, data and position',
    (id) => {
      const { draft, history } = createSession()
      const original = draft.todos.map((todo) => {
        return {
          ...todo,
        }
      })

      history.removeTodo(id)

      expect(draft.todos).toHaveLength(2)

      history.undo()

      expect(draft.todos).toEqual(original)

      history.redo()

      expect(
        draft.todos.map((todo) => {
          return todo.id
        }),
      ).toEqual(
        original
          .filter((todo) => {
            return todo.id !== id
          })
          .map((todo) => {
            return todo.id
          }),
      )
    },
  )

  it('restores a task after deleting the last remaining task', () => {
    const draft = reactive<NoteContent>({
      title: '',
      todos: [],
    })
    const history = useNoteHistory(draft)

    history.addTodo(addedTodo)
    history.removeTodo(addedTodo.id)

    expect(draft.todos).toEqual([])

    history.undo()

    expect(draft.todos).toEqual([addedTodo])

    history.undo()

    expect(draft.todos).toEqual([])
    expect(history.canUndo.value).toBe(false)

    history.redo()
    history.redo()

    expect(draft.todos).toEqual([])
  })

  it('commits pending input before a checkbox and deletion, then reverses in order', () => {
    const { draft, history } = createSession()

    history.updateTodoText('middle', 'Обновлённая задача')
    history.setTodoCompleted('middle', false)
    history.removeTodo('middle')
    history.undo()

    expect(draft.todos[1]).toEqual({
      id: 'middle',
      text: 'Обновлённая задача',
      completed: false,
    })

    history.undo()

    expect(draft.todos[1]?.completed).toBe(true)

    history.undo()

    expect(draft.todos[1]?.text).toBe('Средняя')
    expect(history.canUndo.value).toBe(false)

    history.redo()
    history.redo()
    history.redo()

    expect(
      draft.todos.map((todo) => {
        return todo.id
      }),
    ).toEqual(['first', 'last'])
    expect(history.canRedo.value).toBe(false)
  })

  it.each(['add', 'remove', 'undo', 'redo', 'save'])(
    'finishes pending title input before %s without requiring blur',
    (action) => {
      const { draft, history } = createSession()

      history.updateTitle('Без потери фокуса')

      if (action === 'add') {
        history.addTodo(addedTodo)
        history.undo()
      } else if (action === 'remove') {
        history.removeTodo('first')
        history.undo()
      } else if (action === 'undo') {
        history.undo()
        history.redo()
      } else if (action === 'redo') {
        history.redo()
      } else {
        history.finishTextEdit()
      }

      expect(draft.title).toBe('Без потери фокуса')

      history.undo()

      expect(draft.title).toBe('Планы')
      expect(history.canUndo.value).toBe(false)
    },
  )

  it.each(['title', 'todo-text', 'completed', 'add', 'remove'])(
    'clears redo immediately when a new %s change begins after undo',
    (change) => {
      const { history } = createSession()

      history.updateTitle('Старая ветка')
      history.finishTextEdit()
      history.undo()

      expect(history.canRedo.value).toBe(true)

      if (change === 'title') {
        history.updateTitle('Новая ветка')
      } else if (change === 'todo-text') {
        history.updateTodoText('first', 'Новая ветка')
      } else if (change === 'completed') {
        history.setTodoCompleted('first', true)
      } else if (change === 'add') {
        history.addTodo(addedTodo)
      } else {
        history.removeTodo('first')
      }

      expect(history.canRedo.value).toBe(false)

      history.undo()

      expect(history.canUndo.value).toBe(false)

      history.redo()

      expect(history.canRedo.value).toBe(false)
    },
  )

  it('preserves redo for unchanged input but discards it even if new input returns to its baseline', () => {
    const { draft, history } = createSession()

    history.updateTitle('Ветка')
    history.undo()
    history.updateTitle('Планы')
    history.updateTodoText('first', 'Первая')
    history.setTodoCompleted('first', false)
    history.finishTextEdit()

    expect(history.canRedo.value).toBe(true)

    history.updateTitle('Другое')

    expect(history.canRedo.value).toBe(false)

    history.updateTitle('Планы')
    history.finishTextEdit()
    history.redo()

    expect(draft.title).toBe('Планы')
    expect(history.canUndo.value).toBe(false)
    expect(history.canRedo.value).toBe(false)
  })

  it('retains 50 operations and can replay the entire retained sequence', () => {
    const { draft, history } = createSession()

    for (let index = 1; index <= 55; index += 1) {
      history.updateTitle(String(index))
      history.finishTextEdit()
    }

    for (let index = 0; index < 50; index += 1) {
      history.undo()
    }

    expect(draft.title).toBe('5')
    expect(history.canUndo.value).toBe(false)
    expect(history.canRedo.value).toBe(true)

    history.undo()

    expect(draft.title).toBe('5')

    for (let index = 0; index < 50; index += 1) {
      history.redo()
    }

    expect(draft.title).toBe('55')
    expect(history.canRedo.value).toBe(false)
  })

  it('applies the limit to the whole sequence when branching after undo', () => {
    const { draft, history } = createSession()

    for (let index = 1; index <= 50; index += 1) {
      history.updateTitle(String(index))
      history.finishTextEdit()
    }

    for (let index = 0; index < 10; index += 1) {
      history.undo()
    }

    history.updateTitle('Новая ветка')
    history.finishTextEdit()

    expect(history.canRedo.value).toBe(false)

    for (let index = 0; index < 41; index += 1) {
      history.undo()
    }

    expect(draft.title).toBe('Планы')
    expect(history.canUndo.value).toBe(false)
  })

  it('resets operations, redo and pending input without changing the draft', () => {
    const { draft, history } = createSession()

    history.addTodo(addedTodo)
    history.updateTitle('Ветка')
    history.undo()

    expect(history.canUndo.value).toBe(true)
    expect(history.canRedo.value).toBe(true)

    history.reset()
    history.updateTitle('Черновик')
    history.reset()
    history.finishTextEdit()
    history.undo()
    history.redo()

    expect(draft.title).toBe('Черновик')
    expect(draft.todos.at(-1)).toEqual(addedTodo)
    expect(history.canUndo.value).toBe(false)
    expect(history.canRedo.value).toBe(false)

    history.updateTitle('Новая сессия')
    history.undo()

    expect(draft.title).toBe('Черновик')
  })

  it('keeps separate editor sessions independent', () => {
    const first = createSession()
    const second = createSession()

    first.history.updateTitle('Изменено')
    first.history.removeTodo('middle')

    expect(second.history.canUndo.value).toBe(false)
    expect(second.draft.title).toBe('Планы')
    expect(second.draft.todos).toHaveLength(3)
  })
})

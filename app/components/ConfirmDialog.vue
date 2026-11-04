<script setup lang="ts">
const { cancelLabel = 'Оставить', danger = true } = defineProps<{
  title: string
  message: string
  confirmLabel: string
  cancelLabel?: string
  danger?: boolean
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const dialog = useTemplateRef('dialog')
const cancelButton = useTemplateRef('cancelButton')
const confirmButton = useTemplateRef('confirmButton')
const titleId = useId()
const messageId = useId()

let previousFocus: HTMLElement | null = null
let previousOverflow = ''

function trapFocus(event: KeyboardEvent) {
  if (event.key !== 'Tab') {
    return
  }

  const first = cancelButton.value
  const last = confirmButton.value

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last?.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first?.focus()
  }
}

onMounted(() => {
  previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
  previousOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'

  dialog.value?.showModal()
  cancelButton.value?.focus()
})

onBeforeUnmount(() => {
  dialog.value?.close()
  document.body.style.overflow = previousOverflow

  nextTick(() => {
    const target = previousFocus?.isConnected
      ? previousFocus
      : document.querySelector<HTMLElement>('main h1')

    target?.focus()
  })
})
</script>

<template>
  <dialog
    ref="dialog"
    class="confirm-dialog"
    :aria-labelledby="titleId"
    :aria-describedby="messageId"
    @cancel.prevent="emit('cancel')"
    @keydown="trapFocus"
  >
    <h2
      :id="titleId"
      class="dialog-title"
    >
      {{ title }}
    </h2>

    <p
      :id="messageId"
      class="dialog-message"
    >
      {{ message }}
    </p>

    <div class="actions">
      <button
        ref="cancelButton"
        class="button button-secondary"
        type="button"
        autofocus
        @click="emit('cancel')"
      >
        {{ cancelLabel }}
      </button>

      <button
        ref="confirmButton"
        class="button"
        :class="danger ? 'button-danger' : undefined"
        type="button"
        @click="emit('confirm')"
      >
        {{ confirmLabel }}
      </button>
    </div>
  </dialog>
</template>

<style scoped lang="scss">
.confirm-dialog {
  width: min(100% - 2rem, 28rem);
  max-height: calc(100dvh - 2rem);
  padding: 1.5rem;
  border: 1px solid #dce0ea;
  border-radius: 1rem;
  color: inherit;
  overflow-wrap: anywhere;

  &::backdrop {
    background: rgb(20 29 49 / 55%);
  }
}

.dialog-title {
  margin: 0;
  font-size: 1.35rem;
  line-height: 1.3;
}

.dialog-message {
  margin: 1rem 0 1.5rem;
  white-space: pre-wrap;
}
</style>

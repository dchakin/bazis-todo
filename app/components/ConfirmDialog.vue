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
      class="confirm-dialog__title"
    >
      {{ title }}
    </h2>

    <p
      :id="messageId"
      class="confirm-dialog__message"
    >
      {{ message }}
    </p>

    <div class="actions">
      <button
        ref="cancelButton"
        class="button button--secondary"
        type="button"
        autofocus
        @click="emit('cancel')"
      >
        {{ cancelLabel }}
      </button>

      <button
        ref="confirmButton"
        class="button"
        :class="danger ? 'button--danger' : undefined"
        type="button"
        @click="emit('confirm')"
      >
        {{ confirmLabel }}
      </button>
    </div>
  </dialog>
</template>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

.confirm-dialog {
  width: min(100% - $space-2xl, $dialog-max-width);
  max-height: calc(100dvh - $space-2xl);
  padding: $space-xl;
  border: $border-width solid $color-border;
  border-radius: $radius-lg;
  color: inherit;
  overflow-wrap: anywhere;

  &::backdrop {
    background-color: $color-dialog-backdrop;
  }

  &__title {
    margin: 0;
    font-size: $font-size-xl;
    line-height: $line-height-title;
  }

  &__message {
    margin: $space-md 0 $space-xl;
    white-space: pre-wrap;
  }
}
</style>

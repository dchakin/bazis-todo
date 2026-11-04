<script setup lang="ts">
const { cancelLabel = 'Отменить', danger = true } = defineProps<{
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
    <span
      class="confirm-dialog__icon"
      :class="danger ? 'confirm-dialog__icon--danger' : undefined"
    >
      <AppIcon :name="danger ? 'warning' : 'notebook'" />
    </span>

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

    <div class="confirm-dialog__actions">
      <button
        ref="cancelButton"
        class="button button--secondary confirm-dialog__action"
        type="button"
        autofocus
        @click="emit('cancel')"
      >
        {{ cancelLabel }}
      </button>

      <button
        ref="confirmButton"
        class="button confirm-dialog__action"
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
  padding: $space-2xl;
  border: $border-width solid $color-border;
  border-radius: $radius-lg;
  color: inherit;
  box-shadow: $shadow-dialog;
  overflow-wrap: anywhere;

  &::backdrop {
    background-color: $color-dialog-backdrop;
  }

  &__icon {
    display: inline-flex;
    padding: $space-md;
    margin-bottom: $space-xl;
    border-radius: $radius-md;
    color: $accent;
    background-color: $color-accent-background;

    &--danger {
      color: $color-danger-text;
      background-color: $color-danger-background;
    }
  }

  &__title {
    margin: 0;
    font-size: $font-size-xl;
    line-height: $line-height-title;
  }

  &__message {
    margin: $space-md 0 $space-xl;
    color: $color-text-muted;
    white-space: pre-wrap;
  }

  &__actions {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: $space-sm;
  }

  &__action {
    min-width: 0;
    padding-inline: $space-2xs;
    font-size: $font-size-sm;
    white-space: nowrap;
  }

  @media (max-width: $breakpoint-mobile) {
    padding: $space-xl;
  }
}
</style>

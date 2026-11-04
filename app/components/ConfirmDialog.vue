<script setup lang="ts">
const {
  cancelLabel = 'Отменить',
  danger = true,
  initialFocus = 'cancel',
} = defineProps<{
  title: string
  message: string
  confirmLabel: string
  cancelLabel?: string
  danger?: boolean
  initialFocus?: 'cancel' | 'title'
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const dialog = useTemplateRef('dialog')
const titleElement = useTemplateRef('titleElement')
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

  const first = cancelButton.value?.element
  const last = confirmButton.value?.element

  if (document.activeElement === titleElement.value) {
    event.preventDefault()

    const target = event.shiftKey ? last : first

    target?.focus()
  } else if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last?.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first?.focus()
  }
}

onMounted(() => {
  const activeElement = document.activeElement

  previousFocus =
    activeElement instanceof HTMLElement && activeElement !== document.body ? activeElement : null

  previousOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'

  dialog.value?.showModal()

  if (initialFocus === 'title') {
    titleElement.value?.focus()
  } else {
    cancelButton.value?.focus()
  }
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
      <UiIcon :name="danger ? 'warning' : 'notebook'" />
    </span>

    <h2
      :id="titleId"
      ref="titleElement"
      class="confirm-dialog__title"
      :tabindex="initialFocus === 'title' ? -1 : undefined"
      :autofocus="initialFocus === 'title'"
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
      <UiButton
        ref="cancelButton"
        variant="secondary"
        :autofocus="initialFocus === 'cancel'"
        @click="emit('cancel')"
      >
        {{ cancelLabel }}
      </UiButton>

      <UiButton
        ref="confirmButton"
        :variant="danger ? 'danger' : 'primary'"
        @click="emit('confirm')"
      >
        {{ confirmLabel }}
      </UiButton>
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

    &:focus {
      outline: none;
    }
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

  @media (max-width: $breakpoint-mobile) {
    padding: $space-xl;
  }
}
</style>

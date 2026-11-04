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
const pendingAction = ref<'confirm' | 'cancel' | null>(null)

let previousFocus: HTMLElement | null = null
let previousOverflow = ''

function focusInitial() {
  const target = initialFocus === 'title' ? titleElement.value : cancelButton.value

  target?.focus()
}

function choose(action: 'confirm' | 'cancel') {
  if (pendingAction.value) {
    return
  }

  pendingAction.value = action

  titleElement.value?.focus()
}

function finishChoice() {
  const action = pendingAction.value

  pendingAction.value = null

  if (!dialog.value?.open || !action) {
    return
  }

  if (action === 'confirm') {
    emit('confirm')
  } else {
    emit('cancel')
  }

  nextTick(focusInitial)
}

function trapFocus(event: KeyboardEvent) {
  if (event.key !== 'Tab') {
    return
  }

  if (pendingAction.value) {
    event.preventDefault()

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

  focusInitial()
})

onBeforeUnmount(() => {
  pendingAction.value = null

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
  <Transition
    name="confirm-dialog--fade"
    appear
    @after-leave="finishChoice"
  >
    <dialog
      v-show="!pendingAction"
      ref="dialog"
      class="confirm-dialog"
      :aria-busy="Boolean(pendingAction) || undefined"
      :aria-labelledby="titleId"
      :aria-describedby="messageId"
      @cancel.prevent="choose('cancel')"
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
        tabindex="-1"
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
          :disabled="Boolean(pendingAction)"
          @click="choose('cancel')"
        >
          {{ cancelLabel }}
        </UiButton>

        <UiButton
          ref="confirmButton"
          :variant="danger ? 'danger' : 'primary'"
          :disabled="Boolean(pendingAction)"
          @click="choose('confirm')"
        >
          {{ confirmLabel }}
        </UiButton>
      </div>
    </dialog>
  </Transition>
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

  &--fade-enter-active,
  &--fade-leave-active {
    transition: opacity var(--motion-normal) var(--motion-easing);

    &::backdrop {
      transition: opacity var(--motion-normal) var(--motion-easing);
    }
  }

  &--fade-enter-from,
  &--fade-leave-to {
    opacity: 0;

    &::backdrop {
      opacity: 0;
    }
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
    grid-template-columns: repeat(2, minmax(max-content, 1fr));
    gap: $space-sm;
  }

  @media (max-width: $breakpoint-mobile) {
    padding: $space-xl;

    &__actions {
      gap: $space-xs;
    }
  }
}
</style>

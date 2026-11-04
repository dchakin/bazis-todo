<script setup lang="ts">
const {
  multiline = false,
  autoGrow = false,
  rows = 1,
  variant = 'outlined',
} = defineProps<{
  multiline?: boolean
  autoGrow?: boolean
  rows?: number
  variant?: 'outlined' | 'plain'
}>()

const model = defineModel<string>({
  required: true,
})

const input = useTemplateRef<HTMLInputElement | HTMLTextAreaElement>('input')

let resizeObserver: ResizeObserver | undefined
let previousWidth = 0
let composing = false

const inputClasses = computed(() => {
  return [
    variant === 'plain' ? 'ui-input--plain' : undefined,
    multiline ? 'ui-input--multiline' : undefined,
    multiline && autoGrow ? 'ui-input--auto-grow' : undefined,
  ]
})

function resizeText() {
  const element = input.value

  if (!element || !multiline || !autoGrow) {
    return
  }

  element.style.height = 'auto'
  element.style.height = `${element.scrollHeight + element.offsetHeight - element.clientHeight}px`
}

function focus(options?: FocusOptions) {
  input.value?.focus(options)
}

function updateValue(event: Event) {
  if (composing) {
    return
  }

  model.value = (event.target as HTMLInputElement | HTMLTextAreaElement).value
}

function startComposition() {
  composing = true
}

function finishComposition(event: Event) {
  if (!composing) {
    return
  }

  composing = false

  updateValue(event)
}

watch(
  [input, () => autoGrow],
  ([element]) => {
    resizeObserver?.disconnect()

    previousWidth = 0

    if (!element || !multiline || !autoGrow) {
      element?.style.removeProperty('height')

      return
    }

    resizeText()

    resizeObserver = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width

      if (width !== undefined && width !== previousWidth) {
        previousWidth = width

        resizeText()
      }
    })

    resizeObserver.observe(element)
  },
  {
    flush: 'post',
  },
)

watch([model, () => rows], resizeText, {
  flush: 'post',
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
})

defineExpose({
  focus,
})
</script>

<template>
  <component
    :is="multiline ? 'textarea' : 'input'"
    ref="input"
    class="ui-input"
    :class="inputClasses"
    :value="model"
    :type="multiline ? undefined : 'text'"
    :rows="multiline ? rows : undefined"
    @input="updateValue"
    @compositionstart="startComposition"
    @compositionend="finishComposition"
    @change="finishComposition"
  />
</template>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

.ui-input {
  font: inherit;
  display: block;
  width: 100%;
  min-width: 0;
  min-height: var(--ui-input-min-height, #{$control-min-height});
  padding: var(--ui-input-padding, #{$space-xs} #{$space-sm});
  border: $border-width solid var(--ui-input-border-color, #{$color-input-border});
  border-radius: var(--ui-input-radius, #{$radius-sm});
  color: var(--ui-input-text-color, inherit);
  background-color: var(--ui-input-background-color, #{$color-surface});

  &--plain {
    --ui-input-border-color: transparent;
    --ui-input-background-color: transparent;
  }

  &--multiline {
    resize: vertical;
  }

  &--auto-grow {
    overflow: hidden;
    resize: none;
  }

  &:focus {
    outline: none;
    border-color: var(--ui-input-focus-border-color, #{$accent});
    background-color: var(--ui-input-focus-background-color, #{$color-surface});
    box-shadow: 0 0 0 $focus-ring-width var(--ui-input-focus-ring-color, #{$color-focus-ring});
  }

  &[aria-invalid='true'] {
    --ui-input-border-color: var(--ui-input-error-color, #{$color-danger});
    --ui-input-focus-border-color: var(--ui-input-error-color, #{$color-danger});
    --ui-input-focus-ring-color: var(--ui-input-error-ring-color, #{$color-danger-focus-ring});
  }

  &:disabled {
    --ui-input-text-color: #{$color-text-muted};
    --ui-input-background-color: #{$color-background};
  }
}
</style>

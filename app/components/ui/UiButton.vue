<script setup lang="ts">
import { NuxtLink } from '#components'
import type { ComponentPublicInstance } from 'vue'

const {
  variant = 'primary',
  type = 'button',
  disabled = false,
  to,
} = defineProps<{
  variant?: 'primary' | 'secondary' | 'quiet' | 'danger' | 'danger-quiet' | 'dashed'
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  to?: string
}>()

defineOptions({
  inheritAttrs: false,
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const root = useTemplateRef<HTMLElement | ComponentPublicInstance>('root')

const element = computed<HTMLElement | null>(() => {
  const target = root.value

  if (!target) {
    return null
  }

  return target instanceof HTMLElement ? target : target.$el
})

const buttonComponent = computed(() => {
  if (!to) {
    return 'button'
  }

  return disabled ? 'a' : NuxtLink
})

const buttonClasses = computed(() => {
  return variant === 'primary' ? undefined : `ui-button--${variant}`
})

function handleClick(event: MouseEvent) {
  if (disabled) {
    event.preventDefault()
    event.stopPropagation()

    return
  }

  emit('click', event)
}

function focus(options?: FocusOptions) {
  element.value?.focus(options)
}

defineExpose({
  element,
  focus,
})
</script>

<template>
  <component
    :is="buttonComponent"
    ref="root"
    v-bind="$attrs"
    class="ui-button"
    :class="buttonClasses"
    :to="to && !disabled ? to : undefined"
    :type="to ? undefined : type"
    :disabled="to ? undefined : disabled"
    :role="to && disabled ? 'link' : undefined"
    :aria-disabled="to && disabled ? true : undefined"
    :tabindex="to && disabled ? -1 : undefined"
    @click.capture="handleClick"
  >
    <slot />
  </component>
</template>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

.ui-button {
  font: inherit;
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  gap: var(--ui-button-gap, #{$space-2xs});
  min-width: var(--ui-button-min-size, #{$control-min-height});
  min-height: var(--ui-button-min-size, #{$control-min-height});
  padding: var(--ui-button-padding, #{$space-xs});
  border: $border-width solid var(--ui-button-border-color, transparent);
  border-radius: var(--ui-button-radius, #{$radius-sm});
  color: var(--ui-button-text-color, #{$color-surface});
  background-color: var(--ui-button-background-color, #{$accent});
  text-align: center;
  text-decoration: none;
  cursor: pointer;
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  white-space: nowrap;
  transition:
    background-color var(--motion-fast) var(--motion-easing),
    border-color var(--motion-fast) var(--motion-easing),
    color var(--motion-fast) var(--motion-easing),
    transform var(--motion-fast) var(--motion-easing);

  &:active:not(:disabled):not([aria-disabled='true']) {
    transform: translateY($motion-press-offset);
  }

  @media (prefers-reduced-motion: reduce) {
    &:active {
      transform: none;
    }
  }

  &:hover {
    border-color: var(--ui-button-hover-border-color, var(--ui-button-border-color, transparent));
    color: var(--ui-button-hover-text-color, var(--ui-button-text-color, #{$color-surface}));
    background-color: var(--ui-button-hover-background-color, #{$accent-hover});
  }

  &--secondary {
    --ui-button-border-color: #{$color-border};
    --ui-button-text-color: #{$color-text-secondary};
    --ui-button-background-color: #{$color-surface};
    --ui-button-hover-background-color: #{$color-secondary-hover};
  }

  &--danger {
    --ui-button-background-color: #{$color-danger};
    --ui-button-hover-background-color: #{$color-danger-hover};
  }

  &--quiet {
    --ui-button-text-color: #{$color-text-secondary};
    --ui-button-background-color: transparent;
    --ui-button-hover-text-color: #{$accent};
    --ui-button-hover-background-color: #{$color-accent-background};
  }

  &--danger-quiet {
    --ui-button-text-color: #{$color-text-muted};
    --ui-button-background-color: transparent;
    --ui-button-hover-text-color: #{$color-danger-text};
    --ui-button-hover-background-color: #{$color-danger-background};
  }

  &--dashed {
    --ui-button-border-color: #{$color-input-border};
    --ui-button-text-color: #{$accent};
    --ui-button-background-color: #{$color-surface};
    --ui-button-hover-border-color: #{$accent};
    --ui-button-hover-background-color: #{$color-accent-background};

    border-style: dashed;
  }

  &:disabled,
  &[aria-disabled='true'] {
    --ui-button-border-color: #{$color-border};
    --ui-button-text-color: #{$color-text-muted};
    --ui-button-background-color: #{$color-background};
    --ui-button-hover-border-color: var(--ui-button-border-color);
    --ui-button-hover-text-color: var(--ui-button-text-color);
    --ui-button-hover-background-color: var(--ui-button-background-color);

    cursor: default;
  }
}
</style>

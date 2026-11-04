<script setup lang="ts">
const { disabled = false } = defineProps<{
  disabled?: boolean
}>()

defineOptions({
  inheritAttrs: false,
})

const model = defineModel<boolean>({
  required: true,
})

const attrs = useAttrs()
const input = useTemplateRef('input')

function getInputAttrs() {
  const inputAttrs = {
    ...attrs,
  }

  delete inputAttrs.class
  delete inputAttrs.style

  return inputAttrs
}

function focus(options?: FocusOptions) {
  input.value?.focus(options)
}

defineExpose({
  focus,
})
</script>

<template>
  <label
    class="ui-checkbox"
    :class="[$attrs.class, disabled ? 'ui-checkbox--disabled' : undefined]"
    :style="$attrs.style"
  >
    <input
      ref="input"
      v-model="model"
      v-bind="getInputAttrs()"
      class="ui-checkbox__control"
      type="checkbox"
      :disabled="disabled"
    />

    <span
      v-if="$slots.default"
      class="ui-checkbox__label"
    >
      <slot />
    </span>
  </label>
</template>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

.ui-checkbox {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--ui-checkbox-gap, #{$space-xs});
  min-width: var(--ui-checkbox-min-size, #{$control-min-height});
  min-height: var(--ui-checkbox-min-size, #{$control-min-height});
  cursor: pointer;

  &--disabled {
    color: $color-text-muted;
    cursor: default;
  }

  &__control {
    flex-shrink: 0;
    width: var(--ui-checkbox-size, #{$checkbox-size});
    height: var(--ui-checkbox-size, #{$checkbox-size});
    margin: 0;
    accent-color: var(--ui-checkbox-accent-color, #{$accent});
    cursor: inherit;
  }

  &__label {
    overflow-wrap: anywhere;
  }
}
</style>

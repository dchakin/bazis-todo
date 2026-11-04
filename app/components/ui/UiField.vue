<script setup lang="ts">
const { id, label, error } = defineProps<{
  id?: string
  label?: string
  error?: string
}>()

const generatedId = useId()

const inputId = computed(() => {
  return id ?? generatedId
})

const errorId = computed(() => {
  return `${inputId.value}-error`
})

const inputAttrs = computed(() => {
  return {
    id: inputId.value,
    'aria-invalid': Boolean(error) || undefined,
    'aria-describedby': error ? errorId.value : undefined,
  }
})
</script>

<template>
  <div class="ui-field">
    <label
      v-if="label"
      class="ui-field__label"
      :for="inputId"
    >
      {{ label }}
    </label>

    <slot :input-attrs="inputAttrs" />

    <p
      v-if="error"
      :id="errorId"
      class="ui-field__error"
    >
      {{ error }}
    </p>
  </div>
</template>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

.ui-field {
  display: grid;
  gap: var(--ui-field-gap, #{$space-xs});
  min-width: 0;

  &__label {
    display: block;
    font-size: $font-size-sm;
    font-weight: $font-weight-semibold;
  }

  &__error {
    margin: 0;
    color: var(--ui-field-error-color, #{$color-danger-text});
    font-size: $font-size-sm;
  }
}
</style>

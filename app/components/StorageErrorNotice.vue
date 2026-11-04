<script setup lang="ts">
const { canRetry = true } = defineProps<{
  message: string
  canRetry?: boolean
}>()

const emit = defineEmits<{
  retry: []
}>()
</script>

<template>
  <div
    class="error-notice"
    role="alert"
  >
    <p class="error-notice__message">{{ message }}</p>

    <UiButton
      v-if="canRetry"
      class="error-notice__retry"
      variant="secondary"
      aria-label="Повторить загрузку"
      @click="emit('retry')"
    >
      Повторить
    </UiButton>
  </div>
</template>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

.error-notice {
  margin-block: $space-xl;
  padding: $space-md;
  border: $border-width solid $color-danger-border;
  border-radius: $radius-sm;
  color: $color-danger-text;
  background-color: $color-danger-background;
  overflow-wrap: anywhere;

  &__message {
    margin: 0;
  }

  &__retry {
    margin-top: $space-sm;
  }
}
</style>

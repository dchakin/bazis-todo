<script setup lang="ts">
const { value, max = 100 } = defineProps<{
  value?: number
  max?: number
}>()
</script>

<template>
  <progress
    class="ui-progress"
    :value="value"
    :max="max"
  />
</template>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

.ui-progress {
  display: block;
  width: 100%;
  height: var(--ui-progress-height, #{$space-xs});
  border: 0;
  border-radius: var(--ui-progress-radius, #{$radius-sm});
  color: var(--ui-progress-color, #{$accent});
  background-color: var(--ui-progress-track-color, #{$color-secondary-hover});
  overflow: hidden;
  appearance: none;

  &::-webkit-progress-bar {
    background-color: var(--ui-progress-track-color, #{$color-secondary-hover});
  }

  &::-webkit-progress-value {
    border-radius: var(--ui-progress-radius, #{$radius-sm});
    background-color: var(--ui-progress-color, #{$accent});
  }

  &::-moz-progress-bar {
    border-radius: var(--ui-progress-radius, #{$radius-sm});
    background-color: var(--ui-progress-color, #{$accent});
  }
}
</style>

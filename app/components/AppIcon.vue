<script setup lang="ts">
const { name } = defineProps<{
  name: 'plus' | 'check' | 'trash' | 'arrow-left' | 'arrow-right' | 'notebook' | 'list' | 'warning'
}>()

const paths = {
  plus: 'M12 5v14M5 12h14',
  warning: 'm12 3 10 18H2L12 3Zm0 6v5m0 3h.01',
  check: 'm5 12 4 4L19 6',
  trash: 'M3 6h18M9 6V4h6v2M5 6l1 14h12l1-14M10 10v6M14 10v6',
  'arrow-left': 'm12 5-7 7 7 7M5 12h14',
  'arrow-right': 'm12 5 7 7-7 7M5 12h14',
  notebook: 'M7 3h13v18H7a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3Zm0 0v18M11 8h5M11 12h5',
  list: 'm4 7 1 1 2-3M11 7h9m-16 6 1 1 2-3m4 2h9M4 19h3m4 0h9',
}
</script>

<template>
  <svg
    class="app-icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.75"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <path :d="paths[name]" />
  </svg>
</template>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

.app-icon {
  flex-shrink: 0;
  width: $icon-size;
  height: $icon-size;
}
</style>

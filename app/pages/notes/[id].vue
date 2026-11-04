<script setup lang="ts">
const route = useRoute()

const pageTitle = computed(() => {
  return route.params.id === 'new' ? 'Новая заметка' : 'Редактирование заметки'
})

useHead({
  title: computed(() => {
    return `${pageTitle.value} — Заметки с задачами`
  }),
})
</script>

<template>
  <section class="page">
    <NuxtLink
      class="back-link"
      to="/"
    >
      К списку заметок
    </NuxtLink>

    <header class="page-header">
      <h1>{{ pageTitle }}</h1>
    </header>

    <p class="page-description">Название и задачи заметки.</p>
  </section>
</template>

<script setup lang="ts">
useHead({
  title: 'Мои заметки — Заметки с задачами',
})
</script>

<template>
  <section class="page">
    <header class="page-header">
      <h1>Мои заметки</h1>

      <NuxtLink
        class="button"
        to="/notes/new"
      >
        Создать заметку
      </NuxtLink>
    </header>

    <p class="page-description">Ваши заметки и списки задач будут здесь.</p>
  </section>
</template>

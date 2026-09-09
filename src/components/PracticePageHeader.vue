<template>
  <header data-practice-header class="sticky top-0 z-30 shrink-0 border-b border-line bg-white">
    <slot />
  </header>
</template>

<style scoped>
[data-practice-header] {
  padding-top: env(safe-area-inset-top);
}
[data-practice-header] :deep(> div:first-child) {
  min-height: 3.5rem;
}
@media (min-width: 640px) {
  [data-practice-header] :deep(> div:first-child) {
    min-height: 4rem;
  }
}
</style>

<script setup lang="ts">
defineProps<{ playing?: boolean }>()
</script>

<template>
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M11 5 6 9H3v6h3l5 4V5Z" />
    <g :data-playing="playing">
      <path d="M15 8a6 6 0 0 1 0 8" />
      <path d="M18 5a10 10 0 0 1 0 14" />
    </g>
  </svg>
</template>

<style scoped>
[data-playing="true"] {
  animation: speaker-pulse 700ms ease-in-out infinite alternate;
}
@keyframes speaker-pulse {
  from { opacity: 0.25; }
  to { opacity: 1; }
}
@media (prefers-reduced-motion: reduce) {
  [data-playing="true"] { animation: none; }
}
</style>

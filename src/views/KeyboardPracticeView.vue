<script setup lang="ts">
import { useRouter } from 'vue-router'
import KeyboardMemoryPractice from '@/components/KeyboardMemoryPractice.vue'

const router = useRouter()
</script>

<template>
  <KeyboardMemoryPractice @exit="router.push({ name: 'home' })" />
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import ToneStepPractice from '@/components/ToneStepPractice.vue'

const router = useRouter()
</script>

<template>
  <ToneStepPractice @exit="router.push({ name: 'scale-learn' })" />
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import CmajorPractice from '@/components/CmajorPractice.vue'

const router = useRouter()
</script>

<template>
  <CmajorPractice @exit="router.push({ name: 'home' })" />
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import MajorScalePractice from '@/components/MajorScalePractice.vue'

const router = useRouter()
</script>

<template>
  <MajorScalePractice @exit="router.push({ name: 'home' })" />
</template>

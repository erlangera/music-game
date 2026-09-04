<script setup lang="ts">
import { useRouter } from 'vue-router'
import SolfegeMemoryPractice from '@/components/SolfegeMemoryPractice.vue'

const router = useRouter()

function returnHome() {
  void router.push({ name: 'home' })
}
</script>

<template>
  <SolfegeMemoryPractice @exit="returnHome" />
</template>

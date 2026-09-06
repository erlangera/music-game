import { createApp } from 'vue'

import App from './App.vue'
import { pianoInstrument } from './audio/pianoInstrument'
import { installInstruments } from './composables/instrumentInjection'
import router from './router'
import './assets/main.css'

const app = createApp(App)
installInstruments(app, [pianoInstrument])
app.use(router).mount('#app')

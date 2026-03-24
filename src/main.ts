import { createApp } from 'vue'
import App from './App.vue'

// Import visualization components for global registration
import { ArrayViz, TreeViz, GraphViz, PlayerControls } from '@algoflow/visualizations'

const app = createApp(App)

// Register visualization components globally
app.component('ArrayViz', ArrayViz)
app.component('TreeViz', TreeViz)
app.component('GraphViz', GraphViz)
app.component('PlayerControls', PlayerControls)

app.mount('#app')

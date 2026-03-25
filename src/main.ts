import { createApp } from 'vue'
import App from './App.vue'

// Import visualization components for global registration
import { 
  ArrayViz, 
  TreeViz, 
  GraphViz, 
  StackViz, 
  QueueViz, 
  HeapViz, 
  BSTViz, 
  SortingViz,
  PlayerControls 
} from '@algoflow/visualizations'

const app = createApp(App)

// Register visualization components globally
app.component('ArrayViz', ArrayViz)
app.component('TreeViz', TreeViz)
app.component('GraphViz', GraphViz)
app.component('StackViz', StackViz)
app.component('QueueViz', QueueViz)
app.component('HeapViz', HeapViz)
app.component('BSTViz', BSTViz)
app.component('SortingViz', SortingViz)
app.component('PlayerControls', PlayerControls)

app.mount('#app')

<script setup>
import { useRegisterSW } from 'virtual:pwa-register/vue'
import { ref, onMounted } from 'vue'
import AudioCtx from './audio.ctx'

const {
  offlineReady,
  needRefresh,
  updateServiceWorker,
} = useRegisterSW()

// reactive state
const state = ref(false)
const isLoad = ref(false)
const quality = ref('hq')
const sourceList = {
  hq: 'http://bfmstream.bfm.ru:8004/fm64',
  lq: 'http://bfmstream.bfm.ru:8004/fm32',
}
const source = ref(sourceList.hq)
const audio = ref(null)
const streamApi = new AudioCtx(source.value, 64, 3)

/**
 * @param {string} src
 */
function changeSource (src) {
  if (src === 'hq' || 'lq') {
    source.value = sourceList[src]
  } else {
   throw new Error('Src must be only hq or lq')
  }
}

async function play () {
  state.value = !state.value
  await streamApi.toggle()
}

function formatTime (seconds) {
  return new Date(seconds * 1000).toISOString().slice(14, 19);
}

onMounted(() => {

})
</script>

<template>
  <div class="audio-stream-player __h-w-100">
    <h1>BFM.RU RADiO</h1>
    <canvas id="visualizer"></canvas>
    <div class="bg-text">
      <noindex>
      BFM.RU RADiO
      BFM.RU RADiO
      BFM.RU RADiO
      BFM.RU RADiO
      BFM.RU RADiO
      BFM.RU RADiO
      BFM.RU RADiO
      </noindex>
    </div>
    <div v-if="streamApi.error.value !== ''" class="error-msg">
      {{ streamApi.error }}
    </div>
    <div class="row __h-jc-sb __h-gap-2 __h-w-100">
      <div class="row __h-gap-2 __h-ai-c">
        <div class="row control __h-gap-2 __h-ai-c">
          <button type="button" class="play" @click="play()">
            <svg v-if="!state" xmlns="http://www.w3.org/2000/svg" fill="none" width="30" height="30"  viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
            </svg>

            <svg v-else-if="isLoad" xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9.75v6.75m0 0l-3-3m3 3l3-3m-8.25 6a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
            </svg>

            <svg v-else xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
            </svg>

          </button>
          <select v-model="quality"
                  name="source-select"
                  id="sourceSelect"
                  @change="changeSource(quality)"
          >
            <option name="hq" value="hq">HQ</option>
            <option name="lq" value="lq">LQ</option>
          </select>
        </div>
      </div>
      <div class="progress">
        <p>
          AudioBuffer Created: <br>
          <mark>{{ streamApi.state.buffer.created }}</mark> <br>
        </p>

        <p>
          AudioBuffer Played: <br>
          <mark>{{ streamApi.state.buffer.played }}</mark> <br>
        </p>

        <p>
          AudioBuffer UNPlayed: <br>
          <mark>{{ streamApi.state.buffer.unPlayed }}</mark> <br>
        </p>

        <p>
          Downloaded: <br>
          <mark>{{ streamApi.state.buffer.downloaded.per }} %</mark> <br>
          <mark>at {{ streamApi.state.buffer.downloaded.at }} / to  {{ streamApi.state.buffer.downloaded.to }}</mark> <br>
        </p>

        <p>
          Speed: <br>
          <mark>{{ streamApi.state.downloadSpeed }} Kbps </mark> <br>
        </p>
      </div>
    </div>

    <div
        v-if="offlineReady || needRefresh"
        class="pwa-toast"
        role="alert"
    >
      <div class="message">
      <span v-if="offlineReady">
        App ready to work offline
      </span>
        <span v-else>
        New content available, click on reload button to update.
      </span>
      </div>
      <button v-if="needRefresh" @click="updateServiceWorker()">
        Reload
      </button>
      <button @click="close">
        Close
      </button>
    </div>
  </div>
</template>

<style scoped>
 @import "../css/audio-stream-player.css";
</style>
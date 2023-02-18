import { ref } from 'vue'
import { decimal } from '../helper';
import AudioVisualizer from './audio.visualizer';

//Math.round(bytesRead/bytesTotal*100)
// bytesFormatted(bytesRead)}/${bytesFormatted(bytesTotal)
// ${decimal(dlRate)} kbps speed
export default class AudioCtx {
  key = ''
  sourceNode
  visualizer
  state = {
    startedAt: null,
    pausedAt: null,
    paused: null,
    buffer: {
      created: ref(0),
      played: ref(0),
      unPlayed: ref(0),
      downloaded: {
        per: ref(0),
        at: ref(0),
        to: ref(0)
      }
    },
    downloadSpeed: ref('')
  }

  error = ref('')

  #bufferSize = 0
  #ctx = new (window.AudioContext || window.webkitAudioContext)()
  /**
   * @type {null | string}
   */
  #url = null
  /**
   * @type {null | any}
   */
  #buffer = null

  /**
   * Array collection decoded Audio Data
   * @type {[AudioBuffer]}
   */
  #stack = []

  /**
   * @type {null | Int8Array}
   */
  #slicedHeaderSprite = null

  #currentTimeWithLatency = 0

  /**
   * @param {null | string} url
   * @param { number } bitRate
   * @param { number } bufferTime - in seconds
   */
  constructor (url, bitRate, bufferTime) {
    this.#url = url
    this.#bufferSize = bitRate * bufferTime

    document.addEventListener('DOMContentLoaded', () => {
      const visualizer = new AudioVisualizer('#visualizer', this.#ctx)
      visualizer.canvas = document.querySelector('#visualizer')
      this.visualizer = visualizer
    })
  }


  async toggle () {
    if (!this.state.startedAt) {
      const response = await this.fetchAudioSource()
      await this.getBufferFromAudioResponse(response)
    } else {
      if (!this.state.paused) {
        this.state.paused = true
        await this.#ctx.suspend()
      } else {
        await this.#ctx.resume()
      }
    }
  }

  /**
   * @param {readAudioResponse} reader
   * @returns {Promise<void>}
   */
  async decode (reader) {
    const { value, done } = reader
    while (!done) {
      if (value.buffer.byteLength !== 0) {
        this.addBuffer(reader)
        await this.decodeStack(reader)
      }
    }
  }

  /**
   * @returns {Promise<Response>}
   */
  async fetchAudioSource () {
    this.key = `stream-start-${performance.now()}`
    performance.mark(this.key)

    const response = await fetch(this.#url, {
      method : "GET",
      headers: {
        'Accept': '*/*',
        'Range': 'bytes=0-'
      }
    })
    return response
  }

  /**
   * @param {Response} response
   * @returns {Promise<void>}
   */
  async getBufferFromAudioResponse (response) {
    const { body } = response
    const reader = body.getReader()

    try {
      while (true) {
        const { value, done } = await reader.read()
        this.state.downloadSpeed = decimal(this.steamStartTime)
        const { buffer } = value
        if (buffer === undefined) {
          throw new Error('Buffer is undefined')
        }

        if (this.#slicedHeaderSprite === null) {
          this.#slicedHeaderSprite = buffer.slice(0, this.#bufferSize)
          this.#buffer = buffer
        } else {
          this.#buffer = this.appendBuffer(this.#slicedHeaderSprite, buffer);
        }

        await this.decodeStack()

        if (done) break;
      }
    } catch (e) {
      console.warn(e)
    }
  }

  /**
   * @param {Int8Array} buffer1
   * @param {Int8Array} buffer2
   * @returns {ArrayBufferLike}
   */
  appendBuffer( buffer1, buffer2 ) {
    const tmp = new Uint8Array( buffer1.byteLength + buffer2.byteLength )
    tmp.set( new Uint8Array( buffer1 ), 0 )
    tmp.set( new Uint8Array( buffer2 ), buffer1.byteLength )
    return tmp.buffer
  }

  async decodeStack () {
    try {
      if (this.#buffer.byteLength !== 0) {
        console.log(this.#buffer)
        const decodedData = await this.#ctx.decodeAudioData(this.#buffer)
        this.#stack.push(decodedData)

        if (this.#stack.length) {
          setTimeout(() => {
            this.scheduleBuffers()
          }, 0)
        }
      } else {
        this.error.value = 'Buffer is undefined'
        throw new Error(`Buffer is empty`)
      }

    } catch (e) {
      this.#buffer = null
      await this.decodeStack()
      this.error.value = `Decode Error: ${e}`
    }
  }

  scheduleBuffers() {
    while (this.#stack.length) {
      if (this.state.buffer.created.value - this.state.buffer.played.value === 3 ) return this

      let buffer = this.#stack.shift()
      this.sourceNode = this.#ctx.createBufferSource()

      if (this.visualizer !== null) {
        this.visualizer.draw(this.sourceNode)
      }

      this.sourceNode.onended = () => {
        this.state.buffer.played.value += 1
      }
      this.state.buffer.created.value += 1

      this.sourceNode.buffer = buffer
      this.sourceNode.connect(this.#ctx.destination)

      if (this.#currentTimeWithLatency === 0) {
        console.log(this.#ctx.currentTime)
        this.#currentTimeWithLatency = this.#ctx.currentTime + 0.3
      }

      this.state.startedAt = Date.now();
      this.sourceNode.start(this.#currentTimeWithLatency);

      this.#currentTimeWithLatency += this.sourceNode.buffer.duration
    }
  }

  get steamStartTime () {
    return performance.getEntriesByName(this.key)[0].startTime
  }

  get context () {
    return this.#ctx
  }
}
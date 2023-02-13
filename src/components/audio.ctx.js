import { ref } from 'vue'
export default class AudioCtx {
  state = {
    buffer: {
      created: ref(0),
      played: 0,
      unPlayed: 0,
      downloaded: {
        per: 0,
        at: 0,
        to: 0
      }
    },
    downloadSpeed: 0
  }


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
  }

  async playStreamAudio () {
    const response = await this.fetchAudioSource()
    await this.getBufferFromAudioResponse(response)

    // this.addBuffer(reader)
    // await this.decode(reader)
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
        const decodedData = await this.#ctx.decodeAudioData(this.#buffer)
        this.#stack.push(decodedData)

        if (this.#stack.length) {
          this.scheduleBuffers()
        }
      } else {
        throw new Error(`Buffer is empty`)
      }

    } catch (e) {
      throw new Error(`Decode Error: ${e}`)
    }
  }

  scheduleBuffers() {
    while (this.#stack.length) {
      const buffer = this.#stack.shift()
      const source = this.#ctx.createBufferSource()

      this.state.buffer.created.value += 1

      source.buffer = buffer
      source.connect(this.#ctx.destination)

      if (this.#currentTimeWithLatency === 0) {
        this.#currentTimeWithLatency = this.#ctx.currentTime + 0.5
      }

      console.log(source)
      source.start(this.#currentTimeWithLatency)
      this.#currentTimeWithLatency += source.buffer.duration
    }
  }
}
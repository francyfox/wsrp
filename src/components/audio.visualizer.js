export default class AudioVisualizer {
  #canvas = new HTMLCanvasElement()
  #ctx = new AudioContext()
  #analyzer = this.#ctx.createAnalyser()

  /**
   * @description Создаёт визуализацию аудио на canvas
   * @param {AudioContext} ctx
   * @param {MediaElementAudioSourceNode} source
   * @param {string} selector - canvas selector
   */
  constructor (selector, source, ctx) {
    this.#canvas = document.querySelector(selector)
    this.#ctx = ctx
    this.#analyzer.fftSize = 256
    source.connect(this.#analyzer)
    this.#analyzer.connect(this.#ctx.destination)
  }

  /**
   * @description Рисует по длине буфера
   * @param {Uint8Array} bufferLength
   * @returns {AudioVisualizer}
   */
  draw (bufferLength) {
    const dataArray = new Uint8Array(bufferLength)
    const { width, heigth } = this.#canvas.style
    let x = 0

    this.#analyzer.getByteFrequencyData(bufferLength)
    this.#canvas.fillRect(0, 0, width, heigth)

    const barWidth = (width / bufferLength) * 2.5

    for (let item of dataArray) {
      const barHeight = (item / 2.8)
      this.#ctx.fillStyle = `rgb(50,50,200)`
      this.#ctx.fillRect(x, heigth - barHeight, (width / bufferLength) * 2.5, barHeight)
      x += barWidth + 1
    }

    requestAnimationFrame(this.draw)

    return this
  }
}
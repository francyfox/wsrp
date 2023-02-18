import butterchurn from 'butterchurn'
import butterchurnPresets from 'butterchurn-presets'

export default class AudioVisualizer {
  /**
   * @type {HTMLCanvasElement | null}
   */
  canvas = null
  /**
   * @type {AudioContext | null}
   */
  #ctx = null
  /**
   * @type {AnalyserNode | null}
   */
  analyzer = null

  /**
   * @type {MediaElementAudioSourceNode | null}
   */
  _source = null

  _visualizer = null

  /**
   * @description Создаёт визуализацию аудио на canvas
   * @param {AudioContext} ctx
   * @param {string} selector - canvas selector
   */
  constructor (selector, ctx) {
    this.#ctx = ctx
    this.analyzer = this.#ctx.createAnalyser()
    this.analyzer.fftSize = 256

    this._visualizer = butterchurn.createVisualizer(this.#ctx, document.querySelector('canvas'), {
      width: window.innerWidth,
      height: window.innerHeight
    })
  }

  /**
   * @description Рисует по длине буфера
   * @param {MediaElementAudioSourceNode} source
   * @returns {AudioVisualizer}
   */
  draw (source) {
    const bufferLength = this.analyzer.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    const width = window.innerWidth
    const height = window.innerHeight

    this._visualizer.connectAudio(source)

    const presets = butterchurnPresets.getPresets();
    const preset = presets['Flexi, martin + geiss - dedicated to the sherwin maxawow'];

    this._visualizer.loadPreset(preset, 0.0); // 2nd argument is the number of seconds to blend presets

// resize visualizer

    this._visualizer.setRendererSize(width, height);

    this.render()

    return this
  }


  render () {
    requestAnimationFrame(() => this.render())
    this._visualizer.render()
  }
}
import fs from 'fs'
import path from 'path'
import { Jimp } from 'jimp'

const b83chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz#$%*+,-.:;=?@[]^_{|}~'

/**
 * Encodes values using base83 format.
 *
 * @param {number[]} vals - Array of numeric values to encode
 * @param {number} length - Expected length of the encoded string per value
 * @returns {string} The base83 encoded string
 */
function b83encode(vals, length) {
  let result = ''
  for (const val of vals) {
    for (let i = 1; i <= length; i++) {
      result += b83chars[Math.floor(val / (83 ** (length - i))) % 83]
    }
  }
  return result
}

/**
 * Applies a uniform background color to an image by compositing it.
 *
 * @param {Jimp} image - The Jimp image instance
 * @param {number} bgColorInt - The background color in hexadecimal integer format
 * @returns {Jimp} A new Jimp image instance with the background applied
 */
function applyBackground(image, bgColorInt) {
  const bg = image.clone()
  const data = bg.bitmap.data
  const bgRed = (bgColorInt >>> 24) & 0xff
  const bgGreen = (bgColorInt >>> 16) & 0xff
  const bgBlue = (bgColorInt >>> 8) & 0xff
  for (let index = 0; index < data.length; index += 4) {
    const alpha = data[index + 3]
    if (alpha === 255) continue
    const inverseAlpha = 255 - alpha
    data[index] = (data[index] * alpha + bgRed * inverseAlpha) / 255
    data[index + 1] = (data[index + 1] * alpha + bgGreen * inverseAlpha) / 255
    data[index + 2] = (data[index + 2] * alpha + bgBlue * inverseAlpha) / 255
    data[index + 3] = 255
  }
  return bg
}

/**
 * Checks if the entire image consists of a uniform background color.
 *
 * @param {Jimp} image - The Jimp image instance
 * @param {number} bgColorInt - The background color in hexadecimal integer format
 * @returns {boolean} True if the image is uniform, false otherwise
 */
function isUniformColor(image, bgColorInt) {
  const targetHex = (bgColorInt >>> 8) & 0xffffff
  const data = image.bitmap.data
  for (let i = 0; i < data.length; i += 4) {
    if (((data[i] << 16) | (data[i + 1] << 8) | data[i + 2]) !== targetHex) return false
  }
  return true
}

function normalizeFullPanorama(image) {
  const { width, height } = image.bitmap
  const targetHeight = Math.max(1, Math.round(width / 2))
  if (height !== targetHeight) image.resize({ w: width, h: targetHeight })
  return image
}

/**
 * Extracts a specific cubemap face natively from an equirectangular image.
 *
 * @param {Jimp} inputImage - The equirectangular Jimp image
 * @param {number} cubeSize - Resolution of the output cube face
 * @param {number} haov - Horizontal angle of view
 * @param {number} vaov - Vertical angle of view
 * @param {number} horizon - Horizon angle offset
 * @param {boolean} cylindrical - Whether the projection is cylindrical
 * @param {number} faceIndex - The index of the cube face (0 to 5)
 * @returns {Jimp} The extracted cube face Jimp image
 */
function extractCubeFace(inputImage, cubeSize, haov, vaov, horizon, cylindrical, faceIndex) {
  const face = new Jimp({ width: cubeSize, height: cubeSize })
  const { width, height } = inputImage.bitmap
  const srcData = inputImage.bitmap.data
  const data = face.bitmap.data

  const haovRad = (haov * Math.PI) / 180
  const vaovRad = (vaov * Math.PI) / 180
  const horizonRad = (horizon * Math.PI) / 180
  
  const angles = [[0, 0], [0, 180], [-90, 0], [90, 0], [0, 90], [0, -90]]
  const [pitch, yaw] = angles[faceIndex]
  const p = (pitch * Math.PI) / 180
  const y = (yaw * Math.PI) / 180
  
  const cosP = Math.cos(p)
  const sinP = Math.sin(p)
  const cosY = Math.cos(y)
  const sinY = Math.sin(y)

  let ptr = 0
  for (let row = 0; row < cubeSize; row++) {
    const ty = 1 - 2 * (row + 0.5) / cubeSize
    for (let col = 0; col < cubeSize; col++) {
      const tx = 2 * (col + 0.5) / cubeSize - 1

      const ry = ty * cosP - sinP
      const rz = ty * sinP + cosP
      const dx = tx * cosY - rz * sinY
      const dz = tx * sinY + rz * cosY

      const theta = Math.atan2(dx, dz)
      const r = Math.sqrt(dx * dx + ry * ry + dz * dz)
      const phi = Math.asin(ry / r)

      const u = (theta / haovRad + 0.5) * width
      const v = cylindrical
        ? (0.5 - (Math.tan(phi) - Math.tan(horizonRad)) / (2 * Math.tan(vaovRad / 2))) * height
        : (0.5 - (phi - horizonRad) / vaovRad) * height

      let rVal = 0, gVal = 0, bVal = 0, aVal = 0

      if (!((haov < 360 && (u < 0 || u >= width)) || (vaov < 180 && (v < 0 || v >= height)))) {
        const srcX = Math.floor(u)
        const srcY = Math.floor(v)
        const wx = u - srcX
        const wy = v - srcY

        let x0 = Math.max(0, Math.min(width - 1, srcX))
        let x1 = srcX + 1
        
        if (x1 >= width) x1 = haov === 360 ? 0 : width - 1
        else if (x1 < 0) x1 = 0

        const y0 = Math.max(0, Math.min(height - 1, srcY))
        const y1 = Math.max(0, Math.min(height - 1, srcY + 1))

        const idx00 = (y0 * width + x0) * 4
        const idx10 = (y0 * width + x1) * 4
        const idx01 = (y1 * width + x0) * 4
        const idx11 = (y1 * width + x1) * 4

        const w00 = (1 - wx) * (1 - wy)
        const w10 = wx * (1 - wy)
        const w01 = (1 - wx) * wy
        const w11 = wx * wy

        rVal = srcData[idx00] * w00 + srcData[idx10] * w10 + srcData[idx01] * w01 + srcData[idx11] * w11
        gVal = srcData[idx00 + 1] * w00 + srcData[idx10 + 1] * w10 + srcData[idx01 + 1] * w01 + srcData[idx11 + 1] * w11
        bVal = srcData[idx00 + 2] * w00 + srcData[idx10 + 2] * w10 + srcData[idx01 + 2] * w01 + srcData[idx11 + 2] * w11
        aVal = srcData[idx00 + 3] * w00 + srcData[idx10 + 3] * w10 + srcData[idx01 + 3] * w01 + srcData[idx11 + 3] * w11
      }

      data[ptr++] = rVal
      data[ptr++] = gVal
      data[ptr++] = bVal
      data[ptr++] = aVal
    }
  }
  return face
}

/**
 * Configuration options for processing the panorama image.
 *
 * @typedef {Object} ProcessOptions
 * @property {boolean} [cylindrical=false] - Whether the input is a cylindrical panorama
 * @property {number} [haov=-1] - Horizontal angle of view
 * @property {number} [hfov=100.0] - Horizontal field of view
 * @property {number} [vaov=-1] - Vertical angle of view
 * @property {number} [vOffset=0.0] - Vertical offset
 * @property {number} [horizon=0] - Horizon angle
 * @property {string} [output='./output'] - Path to the output directory
 * @property {number} [tileSize=512] - Size of the output tiles
 * @property {number} [fallbackSize=1024] - Size of the fallback panorama image
 * @property {number} [cubeSize=0] - Cube face resolution
 * @property {number[]} [backgroundColor=[0.0, 0.0, 0.0]] - Background color in [r, g, b] format
 * @property {boolean} [avoidbackground=false] - Prevents viewer from displaying the background
 * @property {boolean} [autoload=false] - Enables autoload in the output configuration
 * @property {number} [quality=75] - JPEG compression quality (0-100)
 * @property {boolean} [png=false] - Output tiles as PNG instead of JPEG
 * @property {number} [thumbnailSize=0] - Size of the equirectangular thumbnail (must be a power of 2)
 * @property {string} [basePath=''] - Public URL prefix for generated tiles and fallback images
 * @property {boolean} [debug=false] - Enable debug mode (skips output directory check)
 */

/**
 * Processes a panoramic image into multi-resolution cubemap tiles natively using Jimp.
 *
 * @param {string} img - File path to the input panoramic image
 * @param {ProcessOptions} [options={}] - Processing options
 * @returns {Promise<string>} The absolute path to the generated output directory
 * @throws {Error} If the image path is missing, output directory exists (without debug), or thumbnail size is invalid
 */
export async function process(img, options = {}) {
  if (!img) throw new Error('Input panorama file path is required.')

  const opts = {
    cylindrical: false,
    haov: -1,
    hfov: 100.0,
    vaov: -1,
    vOffset: 0.0,
    horizon: 0,
    output: './output',
    tileSize: 512,
    fallbackSize: 1024,
    cubeSize: 0,
    backgroundColor: [0.0, 0.0, 0.0],
    avoidbackground: false,
    autoload: false,
    quality: 75,
    png: false,
    thumbnailSize: 0,
    basePath: '',
    normalizeToFullPanorama: false,
    debug: false,
    ...options
  }

  if (opts.thumbnailSize > 0 && (opts.thumbnailSize & (opts.thumbnailSize - 1)) !== 0) {
    throw new Error('Thumbnail size must be a power of two.')
  }

  const outputDir = path.resolve(opts.output)
  if (fs.existsSync(outputDir) && !opts.debug) {
    throw new Error(`Output directory "${outputDir}" already exists.`)
  }
  fs.mkdirSync(outputDir, { recursive: true })

  let inputImage = await Jimp.read(img)
  if (opts.normalizeToFullPanorama) inputImage = normalizeFullPanorama(inputImage)
  const origWidth = inputImage.bitmap.width
  const origHeight = inputImage.bitmap.height

  let { haov, vaov } = opts
  const isFullPano = opts.cylindrical || origWidth / origHeight === 2

  if (haov === -1) haov = 360.0
  if (vaov === -1) vaov = isFullPano ? 180.0 : Math.min(180.0, (origHeight / origWidth) * 360.0)

  const cubeSize = opts.cubeSize || 8 * Math.floor((360 / haov) * origWidth / Math.PI / 8)
  const tileSize = Math.min(opts.tileSize, cubeSize)
  
  let levels = Math.ceil(Math.log2(cubeSize / tileSize)) + 1
  if (Math.floor(cubeSize / 2 ** (levels - 2)) === tileSize) levels -= 1

  const extension = opts.png ? '.png' : '.jpg'
  const partialPano = haov !== 360 || vaov !== 180

  const [r, g, b] = opts.backgroundColor.map(v => Math.round(v * 255))
  const bgColorInt = (r << 24) | (g << 16) | (b << 8) | 0xff
  const faceLetters = ['f', 'b', 'u', 'd', 'l', 'r']
  const missingTiles = []

  for (let f = 0; f < 6; f++) {
    let size = cubeSize
    const faceImage = extractCubeFace(inputImage, cubeSize, haov, vaov, opts.horizon, opts.cylindrical, f)

    if (opts.fallbackSize > 0) {
      const fallbackDir = path.join(outputDir, 'fallback')
      if (!fs.existsSync(fallbackDir)) fs.mkdirSync(fallbackDir, { recursive: true })
      
      const fallbackImage = applyBackground(faceImage.clone(), bgColorInt)
      if (fallbackImage.bitmap.width !== opts.fallbackSize || fallbackImage.bitmap.height !== opts.fallbackSize) {
        fallbackImage.resize({ w: opts.fallbackSize, h: opts.fallbackSize })
      }
      const fallbackOutPath = path.join(fallbackDir, `${faceLetters[f]}${extension}`)
      await fallbackImage.write(fallbackOutPath, opts.png ? undefined : { quality: opts.quality })
    }

    for (let level = levels; level > 0; level--) {
      const levelDir = path.join(outputDir, String(level))
      if (!fs.existsSync(levelDir)) fs.mkdirSync(levelDir, { recursive: true })

      const tiles = Math.ceil(size / tileSize)
      if (level < levels) faceImage.resize({ w: size, h: size })

      for (let i = 0; i < tiles; i++) {
        for (let j = 0; j < tiles; j++) {
          const left = j * tileSize
          const upper = i * tileSize
          const width = Math.min(tileSize, size - left)
          const height = Math.min(tileSize, size - upper)

          let tile = faceImage.clone().crop({ x: left, y: upper, w: width, h: height })
          tile = applyBackground(tile, bgColorInt)

          if (!partialPano || !isUniformColor(tile, bgColorInt)) {
            const tileOutPath = path.join(levelDir, `${faceLetters[f]}${i}_${j}${extension}`)
            const outputPath = tileOutPath as `${string}.${string}`
            if (opts.png) await tile.write(outputPath)
            else await tile.write(outputPath, { quality: opts.quality } as never)
          } else {
            missingTiles.push([f, level, j, i])
          }
        }
      }
      size = Math.floor(size / 2)
    }
  }

  let missingTilesStr = ''
  if (missingTiles.length > 0) {
    const tilesToRemove = new Set(
      missingTiles.flatMap(t => [
        `${t[0]},${t[1] + 1},${t[2] * 2},${t[3] * 2}`,
        `${t[0]},${t[1] + 1},${t[2] * 2},${t[3] * 2 + 1}`,
        `${t[0]},${t[1] + 1},${t[2] * 2 + 1},${t[3] * 2}`,
        `${t[0]},${t[1] + 1},${t[2] * 2 + 1},${t[3] * 2 + 1}`
      ])
    )

    const filteredTiles = missingTiles
      .filter(t => !tilesToRemove.has(`${t[0]},${t[1]},${t[2]},${t[3]}`))
      .sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2] || a[3] - b[3])

    let prevFace = null
    let prevLevel = null
    let numTileDigits = 0

    for (const [face, level, x, y] of filteredTiles) {
      if (face !== prevFace) missingTilesStr += '!' + faceLetters[face]
      if (level !== prevLevel) {
        missingTilesStr += '>' + b83encode([level], 1)
        const maxTileNum = Math.ceil(cubeSize / 2 ** (levels - level) / tileSize) - 1
        numTileDigits = Math.ceil(Math.log(maxTileNum + 1) / Math.log(83)) || 1
      }
      missingTilesStr += b83encode([x, y], numTileDigits)
      prevFace = face
      prevLevel = level
    }
  }

  let equiPreview = null
  if (opts.thumbnailSize > 0) {
    const thumbImage = inputImage.clone().resize({ w: opts.thumbnailSize, h: Math.floor(opts.thumbnailSize / 2) })
    const buffer = await thumbImage.getBuffer('image/jpeg', { quality: 75 })
    equiPreview = 'data:image/jpeg;base64,' + buffer.toString('base64')
  }

  const config: Record<string, unknown> = { hfov: opts.hfov }

  if (haov < 360) {
    config.haov = haov
    config.minYaw = -haov / 2
    config.yaw = -haov / 2 + opts.hfov / 2
    config.maxYaw = haov / 2
  }

  if (vaov < 180) {
    config.vaov = vaov
    config.vOffset = opts.vOffset
    config.minPitch = -vaov / 2 + opts.vOffset
    config.pitch = opts.vOffset
    config.maxPitch = vaov / 2 + opts.vOffset
  }

  if (opts.backgroundColor.some(c => c !== 0)) config.backgroundColor = opts.backgroundColor
  if (opts.avoidbackground && (haov < 360 || vaov < 180)) config.avoidShowingBackground = true
  if (opts.autoload) config.autoLoad = true

  config.type = 'multires'
  config.multiRes = {
    ...(equiPreview && { equirectangularThumbnail: equiPreview }),
    ...(missingTilesStr && { missingTiles: missingTilesStr }),
    path: `${opts.basePath}/%l/%s%y_%x`,
    ...(opts.fallbackSize > 0 && { fallbackPath: `${opts.basePath}/fallback/%s` }),
    extension: extension.slice(1),
    tileResolution: tileSize,
    maxLevel: levels,
    cubeResolution: cubeSize
  }

  fs.writeFileSync(path.join(outputDir, 'config.json'), JSON.stringify(config, null, 4))

  return outputDir
}

export default process
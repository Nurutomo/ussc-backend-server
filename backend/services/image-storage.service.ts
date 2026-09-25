import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import process360 from '../lib/panorama-splitter.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const publicDir = path.resolve(__dirname, '../../public')
const imgDir = path.join(publicDir, 'img')

async function ensureImageDirectory() {
  await fs.mkdir(imgDir, { recursive: true })
}

export async function removeImageFromDisk(imageValue) {
  if (!imageValue || typeof imageValue !== 'string' || !imageValue.startsWith('/img/')) return
  const relativePath = imageValue.slice('/img/'.length)
  const targetPath = path.resolve(imgDir, relativePath)
  if (!targetPath.startsWith(`${imgDir}${path.sep}`)) return
  if (path.basename(targetPath) === 'config.json') {
    await fs.rm(path.dirname(targetPath), { recursive: true, force: true })
  } else {
    await fs.rm(targetPath, { force: true })
  }
}

export async function saveImageToDisk(imageValue, fieldName, markerId) {
  if (!imageValue || typeof imageValue !== 'string') return ''

  if (imageValue.startsWith('data:image/')) {
    const match = imageValue.match(/^data:image\/([a-zA-Z0-9.+-]+);base64,(.+)$/)
    if (!match) return imageValue

    const [, mimeType, base64Data] = match
    let extension = mimeType === 'jpeg' ? 'jpg' : mimeType === 'svg+xml' ? 'svg' : mimeType

    if (fieldName === 'photo_360') {
      const directoryName = `photo_360_${Date.now()}_${markerId}`
      const outputDir = path.join(imgDir, directoryName)
      const sourcePath = path.join(imgDir, `${directoryName}.${extension}`)
      await ensureImageDirectory()
      await fs.writeFile(sourcePath, Buffer.from(base64Data, 'base64'))
      await process360(sourcePath, {
        output: outputDir,
        basePath: `/img/${directoryName}`,
        normalizeToFullPanorama: true,
        autoload: true,
      })
      return `/img/${directoryName}/config.json`
    }

    const filename = `photo_normal_${Date.now()}_${markerId}.${extension}`

    await ensureImageDirectory()
    await fs.writeFile(path.join(imgDir, filename), Buffer.from(base64Data, 'base64'))
    return `/img/${filename}`
  }

  return imageValue
}

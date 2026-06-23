type CompressImageOptions = {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  outputType?: 'image/webp' | 'image/jpeg'
}

export async function compressImage(
  file: File,
  {
    maxWidth = 2000,
    maxHeight = 2000,
    quality = 0.84,
    outputType = 'image/webp',
  }: CompressImageOptions = {},
): Promise<File> {
  if (!file.type.startsWith('image/')) {
    throw new Error(`${file.name} is not an image`)
  }

  const imageBitmap = await createImageBitmap(file)

  const scale = Math.min(
    maxWidth / imageBitmap.width,
    maxHeight / imageBitmap.height,
    1,
  )

  const width = Math.round(imageBitmap.width * scale)
  const height = Math.round(imageBitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d')

  if (!context) {
    imageBitmap.close()
    throw new Error('Could not create image canvas')
  }

  context.drawImage(imageBitmap, 0, 0, width, height)
  imageBitmap.close()

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) {
          resolve(result)
        } else {
          reject(new Error('Image compression failed'))
        }
      },
      outputType,
      quality,
    )
  })

  const originalName = file.name.replace(/\.[^/.]+$/, '')
  const extension = outputType === 'image/webp' ? 'webp' : 'jpg'

  return new File([blob], `${originalName}.${extension}`, {
    type: outputType,
    lastModified: Date.now(),
  })
}

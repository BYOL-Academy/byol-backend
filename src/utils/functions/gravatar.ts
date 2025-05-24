import multiavatar from '@multiavatar/multiavatar/esm'

export const getGravatarUrl = (): string => {
  const generateRandomString = (length: number = 10): string => [...Array(length)].map(() => Math.random().toString(36).charAt(2)).join('')

  const svgCode = multiavatar(generateRandomString())
  // Convert SVG to data URL
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgCode)}`
}

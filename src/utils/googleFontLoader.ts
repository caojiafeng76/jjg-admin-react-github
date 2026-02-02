/**
 * 中文字体加载器
 * 从 Google Fonts 加载中文字体用于 jsPDF
 * 注意: jsPDF 只支持 TTF 格式，不支持 woff2
 */

// 字体缓存
let fontCache: ArrayBuffer | null = null
let fontLoadingPromise: Promise<ArrayBuffer> | null = null

// Google Fonts 思源黑体 TTF 链接
const GOOGLE_FONT_TTF_URL =
  'https://fonts.gstatic.com/s/notosanssc/v37/k3kCo84MPvpLmixcA63oeAL7Iqp5IZJF9bmaG9_FnYxNbPzS5HE.ttf'

/**
 * 从 URL 加载字体文件
 */
async function fetchFont(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch font: ${response.statusText}`)
  }
  return response.arrayBuffer()
}

/**
 * 将 ArrayBuffer 转换为 Base64 字符串
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

/**
 * 加载中文字体（带缓存）
 * @returns Base64 编码的字体数据
 */
export async function loadGoogleFont(): Promise<string> {
  // 如果已有缓存，直接返回
  if (fontCache) {
    return arrayBufferToBase64(fontCache)
  }

  // 如果正在加载，等待加载完成
  if (fontLoadingPromise) {
    const buffer = await fontLoadingPromise
    return arrayBufferToBase64(buffer)
  }

  // 从 Google Fonts 加载 TTF 字体
  fontLoadingPromise = fetchFont(GOOGLE_FONT_TTF_URL)

  try {
    fontCache = await fontLoadingPromise
    return arrayBufferToBase64(fontCache)
  } catch (error) {
    fontLoadingPromise = null
    throw error
  }
}

/**
 * 预加载字体（可在应用启动时调用）
 */
export function preloadFont(): void {
  loadGoogleFont().catch((error) => {
    console.warn('Failed to preload font:', error)
  })
}

/**
 * 清除字体缓存
 */
export function clearFontCache(): void {
  fontCache = null
  fontLoadingPromise = null
}

// 字体配置常量
export const GOOGLE_FONT_CONFIG = {
  FONT_NAME: 'NotoSansSC.ttf',
  FONT_FAMILY: 'NotoSansSC',
  FONT_STYLE: 'normal' as const,
}

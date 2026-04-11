import { QrcodeOutlined } from '@ant-design/icons'
import { Alert, App, Button, Modal, Tooltip, Typography } from 'antd'
import { useEffect, useRef, useState } from 'react'

import { getSalesOrderByProjectNo } from '@/services/apiProcessStandards'
import { getWorkshopOrderById } from '@/services/apiWorkshopOrders'

const { Paragraph, Text } = Typography

const QR_ORDER_PATH_PATTERN = /\/workshop-order-list\/qr\/([^/?#]+)/i
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

interface BarcodeDetectorResultLike {
  rawValue?: string
}

interface BarcodeDetectorLike {
  detect(source: ImageBitmapSource): Promise<BarcodeDetectorResultLike[]>
}

interface BarcodeDetectorConstructorLike {
  new (options?: { formats?: string[] }): BarcodeDetectorLike
}

interface SalesOrderProjectNoSource {
  project_no: string
  product_model: string | null
  length_mm: number | null
  material_code?: string | null
  customer_model: string | null
}

export interface ScannedProjectPayload {
  projectNo: string
  productModel: string | null
  lengthMm: number | null
  materialCode: string | null
  customerModel: string | null
  rawValue: string
}

interface ProjectNoScanButtonProps {
  projectNos?: SalesOrderProjectNoSource[]
  disabled?: boolean
  onResolved: (payload: ScannedProjectPayload) => void
}

function buildPayload(
  rawValue: string,
  data: {
    project_no: string
    product_model: string | null
    length_mm: number | null
    material_code?: string | null
    customer_model: string | null
  },
): ScannedProjectPayload {
  return {
    projectNo: data.project_no,
    productModel: data.product_model,
    lengthMm: data.length_mm,
    materialCode: data.material_code ?? null,
    customerModel: data.customer_model,
    rawValue,
  }
}

function normalizeText(value: string): string {
  return value.trim()
}

async function resolveProjectByProjectNo(
  rawValue: string,
  projectNo: string,
  projectNos?: SalesOrderProjectNoSource[],
) {
  const normalizedProjectNo = normalizeText(projectNo)
  const existing = projectNos?.find(
    (item) => normalizeText(item.project_no) === normalizedProjectNo,
  )

  if (existing) {
    return buildPayload(rawValue, existing)
  }

  const salesOrder = await getSalesOrderByProjectNo(normalizedProjectNo)
  return buildPayload(rawValue, salesOrder)
}

async function resolveProjectByOrderId(rawValue: string, orderId: string) {
  const workshopOrder = await getWorkshopOrderById(orderId)
  const projectNo = normalizeText(workshopOrder.project_no || '')

  if (!projectNo) {
    throw new Error('二维码对应订单未配置项目号')
  }

  return buildPayload(rawValue, {
    project_no: projectNo,
    product_model: workshopOrder.product_model,
    length_mm: workshopOrder.length_mm,
    material_code: workshopOrder.material_code,
    customer_model: workshopOrder.customer_model,
  })
}

async function resolveScannedProject(
  rawValue: string,
  projectNos?: SalesOrderProjectNoSource[],
) {
  const normalizedRawValue = normalizeText(rawValue)

  if (!normalizedRawValue) {
    throw new Error('未识别到二维码内容，请重试')
  }

  const projectNoFromList = projectNos?.find(
    (item) => normalizeText(item.project_no) === normalizedRawValue,
  )

  if (projectNoFromList) {
    return buildPayload(rawValue, projectNoFromList)
  }

  const parsedUrl = (() => {
    try {
      return new URL(normalizedRawValue)
    } catch {
      return null
    }
  })()

  const projectNoFromUrl =
    parsedUrl?.searchParams.get('project_no') ||
    parsedUrl?.searchParams.get('projectNo')

  if (projectNoFromUrl) {
    return resolveProjectByProjectNo(rawValue, projectNoFromUrl, projectNos)
  }

  const orderPathMatch = parsedUrl?.pathname.match(QR_ORDER_PATH_PATTERN)
  const orderIdFromPath = orderPathMatch?.[1]

  if (orderIdFromPath) {
    return resolveProjectByOrderId(
      rawValue,
      decodeURIComponent(orderIdFromPath),
    )
  }

  const orderIdFromUrl =
    parsedUrl?.searchParams.get('order_id') ||
    parsedUrl?.searchParams.get('orderId')

  if (orderIdFromUrl) {
    return resolveProjectByOrderId(rawValue, orderIdFromUrl)
  }

  if (UUID_PATTERN.test(normalizedRawValue)) {
    try {
      return await resolveProjectByOrderId(rawValue, normalizedRawValue)
    } catch {
      return resolveProjectByProjectNo(rawValue, normalizedRawValue, projectNos)
    }
  }

  return resolveProjectByProjectNo(rawValue, normalizedRawValue, projectNos)
}

export default function ProjectNoScanButton({
  projectNos,
  disabled = false,
  onResolved,
}: ProjectNoScanButtonProps) {
  const { message } = App.useApp()
  const [open, setOpen] = useState(false)
  const [starting, setStarting] = useState(false)
  const [resolving, setResolving] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const detectorRef = useRef<BarcodeDetectorLike | null>(null)
  const timerRef = useRef<number | null>(null)
  const detectingRef = useRef(false)
  const resolvingRef = useRef(false)
  const lastRawValueRef = useRef('')

  function stopScanner() {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }

    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null

    const video = videoRef.current
    if (video) {
      video.pause()
      video.srcObject = null
    }

    detectorRef.current = null
    detectingRef.current = false
  }

  useEffect(() => {
    if (!open) {
      stopScanner()
      setScanError(null)
      setStarting(false)
      setResolving(false)
      resolvingRef.current = false
      lastRawValueRef.current = ''
      return
    }

    let disposed = false

    async function startScanner() {
      if (!window.isSecureContext) {
        setScanError('扫码需要在 HTTPS 或本地开发环境中使用')
        return
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        setScanError('当前设备不支持摄像头扫码')
        return
      }

      const BarcodeDetectorCtor = (
        window as Window & {
          BarcodeDetector?: BarcodeDetectorConstructorLike
        }
      ).BarcodeDetector

      if (!BarcodeDetectorCtor) {
        setScanError(
          '当前浏览器不支持原生二维码扫描，请使用最新版 Chrome 或 Edge',
        )
        return
      }

      setStarting(true)
      setScanError(null)

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
          },
          audio: false,
        })

        if (disposed) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }

        streamRef.current = stream
        detectorRef.current = new BarcodeDetectorCtor({ formats: ['qr_code'] })

        const video = videoRef.current
        if (!video) {
          throw new Error('扫码预览初始化失败')
        }

        video.srcObject = stream
        await video.play()

        timerRef.current = window.setInterval(() => {
          void (async () => {
            if (detectingRef.current || resolvingRef.current) {
              return
            }

            const detector = detectorRef.current
            const preview = videoRef.current

            if (!detector || !preview || preview.readyState < 2) {
              return
            }

            detectingRef.current = true

            try {
              const codes = await detector.detect(preview)
              const rawValue = codes.find((item) =>
                item.rawValue?.trim(),
              )?.rawValue

              if (!rawValue) {
                return
              }

              const normalizedRawValue = normalizeText(rawValue)
              if (
                !normalizedRawValue ||
                normalizedRawValue === lastRawValueRef.current
              ) {
                return
              }

              lastRawValueRef.current = normalizedRawValue
              setResolving(true)
              resolvingRef.current = true
              setScanError(null)

              try {
                const payload = await resolveScannedProject(
                  normalizedRawValue,
                  projectNos,
                )
                onResolved(payload)
                message.success(`已识别项目号 ${payload.projectNo}`)
                setOpen(false)
              } catch (error) {
                setScanError(
                  error instanceof Error
                    ? error.message
                    : '二维码解析失败，请重试',
                )
                window.setTimeout(() => {
                  lastRawValueRef.current = ''
                }, 1500)
              } finally {
                setResolving(false)
                resolvingRef.current = false
              }
            } catch (error) {
              setScanError(
                error instanceof Error
                  ? error.message
                  : '二维码识别失败，请重试',
              )
            } finally {
              detectingRef.current = false
            }
          })()
        }, 400)
      } catch (error) {
        setScanError(
          error instanceof Error ? error.message : '摄像头启动失败，请检查权限',
        )
      } finally {
        setStarting(false)
      }
    }

    void startScanner()

    return () => {
      disposed = true
      stopScanner()
    }
  }, [message, onResolved, open, projectNos])

  return (
    <>
      <Tooltip title="扫码填充项目号">
        <Button
          icon={<QrcodeOutlined />}
          aria-label="扫码填充项目号"
          onClick={() => setOpen(true)}
          disabled={disabled}
        />
      </Tooltip>

      <Modal
        title="扫码识别项目号"
        open={open}
        onCancel={() => setOpen(false)}
        footer={null}
        destroyOnClose
        width={420}
      >
        <div className="space-y-4">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-950">
            <div className="relative aspect-square w-full">
              <video
                ref={videoRef}
                className="h-full w-full object-cover"
                muted
                playsInline
              />
              <div className="pointer-events-none absolute inset-0 border-20 border-black/20" />
              <div className="pointer-events-none absolute inset-x-10 top-1/2 h-44 -translate-y-1/2 rounded-3xl border-2 border-emerald-300/90 shadow-[0_0_0_9999px_rgba(15,23,42,0.35)]" />
              {starting ? (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-950/65 text-sm text-white">
                  正在启动摄像头...
                </div>
              ) : null}
              {resolving ? (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-950/65 text-sm text-white">
                  正在解析二维码...
                </div>
              ) : null}
            </div>
          </div>

          {scanError ? (
            <Alert type="warning" showIcon message={scanError} />
          ) : null}

          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <Paragraph className="mb-2 text-slate-700">
              将二维码放入取景框内，系统会自动识别项目号并带出型号、长度、客户型号。
            </Paragraph>
            <Text type="secondary">
              支持识别项目号文本，以及当前系统生成的订单详情二维码。识别后仍可手动修改。
            </Text>
          </div>
        </div>
      </Modal>
    </>
  )
}

import type { ReactNode } from 'react'
import { Alert, App, Button, Modal, Tooltip, Typography } from 'antd'
import { useEffect, useRef, useState } from 'react'
import { BiScan } from 'react-icons/bi'
import qrScannerWorkerPath from 'qr-scanner/qr-scanner-worker.min.js?url'

import { getSalesOrderByProjectNo } from '@/services/apiProcessStandards'
import { getWorkshopOrderById } from '@/services/apiWorkshopOrders'

const { Paragraph, Text } = Typography

const QR_ORDER_PATH_PATTERN = /\/workshop-order-list\/qr\/([^/?#]+)/i
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

interface SalesOrderProjectNoSource {
  project_no: string
  product_model: string | null
  length_mm: number | null
  material_code?: string | null
  customer?: string | null
  customer_model: string | null
}

export interface ScannedProjectPayload {
  projectNo: string
  productModel: string | null
  lengthMm: number | null
  materialCode: string | null
  customer: string | null
  customerModel: string | null
  rawValue: string
}

interface ProjectNoScanButtonProps {
  projectNos?: SalesOrderProjectNoSource[]
  disabled?: boolean
  autoOpen?: boolean
  onResolved: (payload: ScannedProjectPayload) => void
  renderTrigger?: (context: {
    disabled: boolean
    openScanner: () => void
  }) => ReactNode
}

interface ScannerController {
  stop: () => void
  destroy: () => void
}

function buildPayload(
  rawValue: string,
  data: {
    project_no: string
    product_model: string | null
    length_mm: number | null
    material_code?: string | null
    customer?: string | null
    customer_model: string | null
  },
): ScannedProjectPayload {
  return {
    projectNo: data.project_no,
    productModel: data.product_model,
    lengthMm: data.length_mm,
    materialCode: data.material_code ?? null,
    customer: data.customer ?? null,
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
    customer: workshopOrder.customer,
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
  autoOpen = false,
  onResolved,
  renderTrigger,
}: ProjectNoScanButtonProps) {
  const { message } = App.useApp()
  const [open, setOpen] = useState(false)
  const [scannerReady, setScannerReady] = useState(false)
  const [starting, setStarting] = useState(false)
  const [resolving, setResolving] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const scannerRef = useRef<ScannerController | null>(null)
  const resolvingRef = useRef(false)
  const lastRawValueRef = useRef('')
  const autoOpenedRef = useRef(false)

  useEffect(() => {
    if (!autoOpen || disabled || autoOpenedRef.current) {
      return
    }

    autoOpenedRef.current = true
    setOpen(true)
  }, [autoOpen, disabled])

  function stopScanner() {
    scannerRef.current?.stop()
    scannerRef.current?.destroy()
    scannerRef.current = null
  }

  useEffect(() => {
    if (!open || !scannerReady) {
      stopScanner()
      setStarting(false)
      setResolving(false)
      resolvingRef.current = false
      lastRawValueRef.current = ''

      if (!open) {
        setScanError(null)
      }

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

      setStarting(true)
      setScanError(null)

      try {
        const video = videoRef.current
        if (!video) {
          throw new Error('扫码预览初始化失败')
        }

        const { default: QrScanner } = await import('qr-scanner')

        if (disposed) {
          return
        }

        QrScanner.WORKER_PATH = qrScannerWorkerPath

        const scanner = new QrScanner(
          video,
          (result) => {
            const rawValue = normalizeText(result.data)

            if (!rawValue || rawValue === lastRawValueRef.current) {
              return
            }

            if (resolvingRef.current) {
              return
            }

            lastRawValueRef.current = rawValue
            setResolving(true)
            resolvingRef.current = true
            setScanError(null)

            void (async () => {
              try {
                const payload = await resolveScannedProject(
                  rawValue,
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
            })()
          },
          {
            preferredCamera: 'environment',
            maxScansPerSecond: 5,
            returnDetailedScanResult: true,
            onDecodeError: (error) => {
              const errorMessage =
                typeof error === 'string' ? error : error.message

              if (errorMessage === 'No QR code found') {
                return
              }

              setScanError(errorMessage || '二维码识别失败，请重试')
            },
          },
        )

        if (disposed) {
          scanner.destroy()
          return
        }

        scannerRef.current = scanner
        await scanner.start()
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
  }, [message, onResolved, open, projectNos, scannerReady])

  return (
    <>
      {renderTrigger ? (
        renderTrigger({
          disabled,
          openScanner: () => setOpen(true),
        })
      ) : (
        <Tooltip title="扫码填充项目号">
          <Button
            icon={<BiScan className="size-5" />}
            aria-label="扫码填充项目号"
            onClick={() => setOpen(true)}
            disabled={disabled}
          />
        </Tooltip>
      )}

      <Modal
        title="扫码识别项目号"
        open={open}
        onCancel={() => {
          setScannerReady(false)
          setOpen(false)
        }}
        afterOpenChange={(visible) => {
          setScannerReady(visible)
        }}
        footer={null}
        destroyOnClose
        forceRender
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
              <div className="pointer-events-none absolute inset-x-10 top-1/2 h-44 -translate-y-1/2 overflow-hidden rounded-3xl border-2 border-emerald-300/90 shadow-[0_0_0_9999px_rgba(15,23,42,0.35)]">
                <div className="scanner-sweep-line absolute inset-x-3 top-0 h-4 rounded-full" />
              </div>
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
              支持识别项目号文本，以及当前系统生成的订单详情二维码。若浏览器没有原生能力，会自动切换到兼容模式继续扫描。
            </Text>
          </div>
        </div>
      </Modal>
    </>
  )
}

import type { ReactNode } from 'react'
import { Button, Card, Typography } from 'antd'

const { Paragraph, Title } = Typography

interface Action {
  label: string
  onClick: () => void
  type?: 'default' | 'primary'
}

interface Props {
  eyebrow: string
  title: string
  description: string
  scanTrigger: ReactNode
  summary: ReactNode
  content?: ReactNode
  footer?: ReactNode
  primaryAction: Action
  secondaryAction?: Action
}

export default function MobileScanPageShell({
  eyebrow,
  title,
  description,
  scanTrigger,
  summary,
  content,
  footer,
  primaryAction,
  secondaryAction,
}: Props) {
  const hasCustomFooter = Boolean(footer)

  return (
    <div
      className={`h-full overflow-y-auto px-4 pt-4 ${hasCustomFooter ? 'pb-52' : 'pb-8'}`}
    >
      <div className="mx-auto flex max-w-2xl flex-col gap-4">
        <section className="rounded-[30px] border border-slate-200 bg-white px-5 py-5 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
          <div className="text-[11px] font-semibold tracking-[0.28em] text-slate-400 uppercase">
            {eyebrow}
          </div>
          <Title level={3} style={{ marginTop: 12, marginBottom: 8 }}>
            {title}
          </Title>
          <Paragraph className="mb-0 text-slate-500">{description}</Paragraph>
        </section>

        {scanTrigger}

        {summary}

        {content}

        {!hasCustomFooter ? (
          <div className="grid grid-cols-2 gap-3">
            {secondaryAction ? (
              <Button
                className="h-11 rounded-2xl"
                onClick={secondaryAction.onClick}
              >
                {secondaryAction.label}
              </Button>
            ) : (
              <Card className="rounded-2xl border-dashed border-slate-200 shadow-none" />
            )}
            <Button
              type={primaryAction.type || 'primary'}
              className="h-11 rounded-2xl"
              onClick={primaryAction.onClick}
            >
              {primaryAction.label}
            </Button>
          </div>
        ) : null}
      </div>

      {hasCustomFooter ? (
        <div
          className="fixed inset-x-0 z-40 border-t border-white/70 bg-white/92 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+12px)] backdrop-blur-xl"
          style={{ bottom: 'calc(env(safe-area-inset-bottom) + 82px)' }}
        >
          <div className="mx-auto max-w-2xl">{footer}</div>
        </div>
      ) : null}
    </div>
  )
}

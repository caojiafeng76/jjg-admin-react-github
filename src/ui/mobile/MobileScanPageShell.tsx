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
      className={`h-full overflow-y-auto px-4 pt-4 ${hasCustomFooter ? 'pb-44' : 'pb-8'}`}
    >
      <div className="mx-auto flex max-w-2xl flex-col gap-3">
        <section className="rounded-2xl border border-slate-200 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="text-[11px] font-semibold tracking-[0.2em] text-slate-400 uppercase dark:text-slate-500">
            {eyebrow}
          </div>
          <Title level={4} className="mt-2! mb-1.5! text-slate-900! dark:text-slate-100!">
            {title}
          </Title>
          <Paragraph className="mb-0! text-sm text-slate-500 dark:text-slate-400">
            {description}
          </Paragraph>
        </section>

        {scanTrigger}

        {summary}

        {content}

        {!hasCustomFooter
          ? (
              <div className="grid grid-cols-2 gap-3">
                {secondaryAction
                  ? (
                      <Button
                        className="h-11 rounded-xl"
                        onClick={secondaryAction.onClick}
                      >
                        {secondaryAction.label}
                      </Button>
                    )
                  : (
                      <Card className="rounded-xl border-dashed border-slate-200 shadow-none dark:border-slate-700" />
                    )}
                <Button
                  type={primaryAction.type || 'primary'}
                  className="h-11 rounded-xl"
                  onClick={primaryAction.onClick}
                >
                  {primaryAction.label}
                </Button>
              </div>
            )
          : null}
      </div>

      {hasCustomFooter
        ? (
            <div
              className="fixed inset-x-0 z-40 border-t border-slate-200 bg-white/95 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+12px)] backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/95"
              style={{ bottom: 'calc(env(safe-area-inset-bottom) + 74px)' }}
            >
              <div className="mx-auto max-w-2xl">{footer}</div>
            </div>
          )
        : null}
    </div>
  )
}

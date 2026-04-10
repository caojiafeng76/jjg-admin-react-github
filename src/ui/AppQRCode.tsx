import QRCodeImport from 'react-qr-code'

type QRCodeProps = {
  value: string
  size?: number
  style?: React.CSSProperties
  bgColor?: string
  fgColor?: string
  level?: 'L' | 'M' | 'Q' | 'H'
}

const QRCodeComponent = (
  QRCodeImport as typeof QRCodeImport & {
    default?: typeof QRCodeImport
  }
).default
  ? (
      QRCodeImport as typeof QRCodeImport & {
        default: typeof QRCodeImport
      }
    ).default
  : QRCodeImport

export default function AppQRCode(props: QRCodeProps) {
  return <QRCodeComponent {...props} />
}

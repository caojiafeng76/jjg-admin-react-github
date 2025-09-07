import { PrinterIcon } from '@heroicons/react/16/solid'
import { Button } from 'antd'

interface IProps {
  handlePrint: () => void
  children?: React.ReactNode
}
export default function PrintButton({ handlePrint, children }: IProps) {
  return (
    <Button
      type="text"
      icon={<PrinterIcon className="size-4 !text-blue-500/80" />}
      onClick={handlePrint}
    >
      {children ? children : '打印中文标签'}
    </Button>
  )
}

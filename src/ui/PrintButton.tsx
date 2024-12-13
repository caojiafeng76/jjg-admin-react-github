import { PrinterIcon } from '@heroicons/react/16/solid'
import { Button } from 'antd'

interface IProps {
  handlePrint: () => void
}
export default function PrintButton({ handlePrint }: IProps) {
  return (
    <Button
      type="text"
      icon={<PrinterIcon className="size-4 !text-blue-500/80" />}
      onClick={handlePrint}
    >
      打印
    </Button>
  )
}

import jsPDF from 'jspdf'

import myFont2 from '@/assets/myFont2'
import { useSelectedPos } from './useSelectedPos'

export function usePrintDecomposition() {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { selectedMap, isLoading } = useSelectedPos()

  const doc = new jsPDF({ orientation: 'l' })
  // 设置中文字体
  doc.addFileToVFS('msyh.ttf', myFont2)
  doc.addFont('msyh.ttf', 'myFont', 'normal')
  doc.setFont('myFont')

  doc.setFontSize(20)
  doc.text('踏板分解单', 120, 20)

  doc.rect(15, 30, 270, 170) // 画一个方框
  doc.line(15, 40, 285, 40)

  doc.setFontSize(10)

  doc.text('序号', 18, 30 + 7)
  doc.line(28, 30, 28, 40) //1

  doc.text('交货日期', 20 + 10 + 2, 30 + 7)
  doc.line(50, 30, 50, 40) //2

  doc.text('台数', 28 + 20 + 2 * 2, 30 + 7)
  doc.line(62, 30, 62, 40) //3

  doc.text('名称', 50 + 10 + 2 * 2, 30 + 7)
  doc.line(74, 30, 74, 40) //4

  doc.text('规格', 60 + 10 + 2 * 4, 30 + 7)
  doc.line(89, 30, 89, 40) //5

  doc.text('件数', 70 + 10 + 2 * 5, 30 + 7)
  doc.line(98, 30, 98, 40) //6

  doc.text('名称', 80 + 10 + 2 * 5, 30 + 7)
  doc.line(110, 30, 110, 40) //7

  doc.text('规格', 90 + 10 + 2 * 7, 30 + 7)
  doc.line(125, 30, 125, 40) //8

  doc.text('件数', 100 + 10 + 2 * 8, 30 + 7)
  doc.line(134, 30, 134, 40) //9

  doc.text('名称', 110 + 10 + 2 * 8, 30 + 7)
  doc.line(146, 30, 146, 40) //10

  doc.text('规格', 120 + 10 + 2 * 10, 30 + 7)
  doc.line(146 + 15, 30, 146 + 15, 40) //11

  doc.text('件数', 130 + 10 + 2 * 11, 30 + 7)
  doc.line(146 + 15 + 9, 30, 146 + 15 + 9, 40) //12

  doc.text('名称', 140 + 10 + 2 * 11, 30 + 7)
  doc.line(170 + 12, 30, 170 + 12, 40) //13

  doc.text('规格', 150 + 10 + 2 * 13, 30 + 7)
  doc.line(170 + 12 + 15, 30, 170 + 12 + 15, 40) //14

  doc.text('件数', 160 + 10 + 2 * 14, 30 + 7)
  doc.line(170 + 12 + 15 + 9, 30, 170 + 12 + 15 + 9, 40) //15

  doc.text('类型', 170 + 10 + 2 * 15, 30 + 7)
  doc.line(206 + 14, 30, 206 + 14, 40) //16

  doc.text('工艺要求', 180 + 10 + 2 * 16 + 2, 30 + 7)
  doc.line(220 + 22, 30, 220 + 22, 40) //17

  doc.text('横 围', 190 + 20 + 2 * 17 + 2, 30 + 7)
  doc.line(242 + 15, 30, 242 + 15, 40) //18

  doc.text('侧 围', 210 + 10 + 2 * 18 + 3, 30 + 7)
  doc.line(256 + 14, 30, 256 + 14, 40) //19

  doc.text('围框垫', 220 + 10 + 2 * 19 + 4, 30 + 7)

  for (let i = 0; i < 4; i++) {
    doc.line(28, 60 + i * 40, 285, 60 + i * 40)
    doc.line(28, 70 + i * 40, 285, 70 + i * 40)

    //横线
    doc.line(110, 50 + i * 40, 134, 50 + i * 40)
    doc.line(146, 50 + i * 40, 170, 50 + i * 40)
    doc.line(182, 50 + i * 40, 206, 50 + i * 40)
    doc.line(242 + 15, 50 + i * 40, 242 + 15 + 13, 50 + i * 40)

    //竖线
    doc.line(50, 40 + i * 40, 50, 60 + i * 40)
    doc.line(62, 40 + i * 40, 62, 60 + i * 40)
    doc.line(74, 40 + i * 40, 74, 60 + i * 40)
    doc.line(89, 40 + i * 40, 89, 60 + i * 40)
    doc.line(98, 40 + i * 40, 98, 60 + i * 40)
    doc.line(110, 40 + i * 40, 110, 60 + i * 40)
    doc.line(125, 40 + i * 40, 125, 60 + i * 40)
    doc.line(134, 40 + i * 40, 134, 60 + i * 40)
    doc.line(146, 40 + i * 40, 146, 60 + i * 40)
    doc.line(161, 40 + i * 40, 161, 60 + i * 40)
    doc.line(170, 40 + i * 40, 170, 60 + i * 40)
    doc.line(182, 40 + i * 40, 182, 60 + i * 40)
    doc.line(197, 40 + i * 40, 197, 60 + i * 40)
    doc.line(206, 40 + i * 40, 206, 60 + i * 40)
    doc.line(206 + 14, 40 + i * 40, 206 + 14, 60 + i * 40)
    doc.line(220 + 22, 40 + i * 40, 220 + 22, 60 + i * 40)
    doc.line(242 + 15, 40 + i * 40, 242 + 15, 60 + i * 40)
    doc.line(256 + 14, 40 + i * 40, 256 + 14, 60 + i * 40)

    doc.setFontSize(16)
    doc.text('前', 65, 47 + i * 40)
    doc.text('板', 65, 56 + i * 40)

    doc.text('中', 101, 47 + i * 40)
    doc.text('板', 101, 56 + i * 40)

    doc.text('后', 137, 47 + i * 40)
    doc.text('板', 137, 56 + i * 40)

    doc.setFontSize(12)
    doc.text('加', 174, 44 + i * 40)
    doc.text('长', 174, 51 + i * 40)
    doc.text('板', 174, 58 + i * 40)

    doc.setFontSize(10)
    doc.text('订单号：', 30, 67 + i * 40)
    doc.text('商标：', 85, 67 + i * 40)
    doc.text('编号：', 155, 67 + i * 40)
    doc.text('合同号：', 200, 67 + i * 40)
    doc.text('备注：', 30, 77 + i * 40)

    doc.setFontSize(20)
    doc.text(`${i + 1}`, 20, 61 + i * 40)
    doc.text(`${1}`, 55, 51 + i * 40)
  }

  //一条长竖线
  doc.line(28, 40, 28, 200)
  //三条长横线
  doc.line(15, 80, 285, 80)
  doc.line(15, 120, 285, 120)
  doc.line(15, 160, 285, 160)

  // doc.text('中：雷达孔', 223, 44)
  // doc.text('前：角钢', 223, 51)
  // doc.text('后：防撞块', 223, 58)

  if (!isLoading) {
    let index = 0

    selectedMap?.forEach((data, key) => {
      const [SONo, Spec, EndDate, No, SerialNo, Brand, Technique, Remark] =
        key.split('~')
      const [xinghao, huanjing, leixing] = Spec.split('-')

      doc.setFontSize(10)

      doc.text(`${EndDate}`, 30, 51 + index * 40)
      doc.text(`${No}`, 50, 67 + index * 40)
      doc.text(`${SONo}`, 220, 67 + index * 40)
      doc.text(`${SerialNo}`, 175, 67 + index * 40)
      doc.text(`${Brand}`, 105, 67 + index * 40)

      if (Technique !== 'null') {
        const [line1, line2, line3] = Technique.split(',')
        doc.text(line1 ? `${line1}` : '', 223, 44 + index * 40)
        doc.text(line2 ? `${line2}` : '', 223, 51 + index * 40)
        doc.text(line3 ? `${line3}` : '', 223, 58 + index * 40)
      }

      doc.text(`${xinghao}`, xinghao.length === 5 ? 207 : 208, 44 + index * 40)
      doc.text(`${huanjing}`, 209, 51 + index * 40)
      doc.text(`${leixing}`, leixing.length === 3 ? 208 : 209, 58 + index * 40)

      doc.text(`橡胶`, 273, 51 + index * 40)

      if (Remark && Remark !== 'null')
        doc.text(`${Remark}`, 50, 77 + index * 40)

      doc.setFontSize(8)
      data.forEach((item) => {
        const { PartNo, ParamSpec, Qty, Remark } = item
        //前板规格
        if (PartNo?.includes('XN2808EB') || PartNo?.includes('XN3024BR')) {
          doc.setFontSize(8)
          doc.text(`${ParamSpec}`, 75, 51 + index * 40)
          doc.setFontSize(12)
          doc.text(`${Qty}`, 92, 51 + index * 40)
        }

        //上中板规格
        if (
          PartNo?.includes('XN2808BP') ||
          PartNo?.includes('XN3024BS') ||
          PartNo?.includes('XN2808JY') ||
          PartNo?.includes('XN3024DF')
        ) {
          doc.setFontSize(8)
          doc.text(`${ParamSpec}`, 111, 47 + index * 40)
          doc.setFontSize(12)
          doc.text(`${Qty}`, 128, 47 + index * 40)
        }

        //下中板规格
        if (
          PartNo?.includes('XN2808BQ') ||
          PartNo?.includes('XN3024BT') ||
          PartNo?.includes('XN2808JZ') ||
          PartNo?.includes('XN3024DG')
        ) {
          doc.setFontSize(8)
          doc.text(`${ParamSpec}`, 111, 56 + index * 40)
          doc.setFontSize(12)
          doc.text(`${Qty}`, 128, 56 + index * 40)
        }

        //上后板规格
        if (
          (PartNo?.includes('XN2808AF') && Remark?.includes('上头部')) ||
          PartNo?.includes('XN3024BX')
        ) {
          doc.setFontSize(8)
          doc.text(`${ParamSpec}`, 111 + 36, 47 + index * 40)
          doc.setFontSize(12)
          doc.text(`${Qty}`, 128 + 36, 47 + index * 40)
        }

        //下后板规格
        if (
          (PartNo?.includes('XN2808AF') && Remark?.includes('下头部')) ||
          PartNo?.includes('XN3024BY')
        ) {
          doc.setFontSize(8)
          doc.text(`${ParamSpec}`, 111 + 36, 56 + index * 40)
          doc.setFontSize(12)
          doc.text(`${Qty}`, 128 + 36, 56 + index * 40)
        }

        //上加长板
        if (PartNo?.includes('XN2808AL') && Remark?.includes('上头部')) {
          doc.setFontSize(8)
          doc.text(`${ParamSpec}`, 111 + 36 + 36, 47 + index * 40)
          doc.setFontSize(12)
          doc.text(`${Qty}`, 128 + 36 + 36, 47 + index * 40)
        }

        //下加长板
        if (PartNo?.includes('XN2808AL') && Remark?.includes('下头部')) {
          doc.setFontSize(8)
          doc.text(`${ParamSpec}`, 111 + 36 + 36, 56 + index * 40)
          doc.setFontSize(12)
          doc.text(`${Qty}`, 128 + 36 + 36, 56 + index * 40)
        }

        //横围
        if (PartNo?.includes('XN2808EC') || PartNo?.includes('XN2838CP')) {
          doc.setFontSize(8)
          doc.text(
            `${ParamSpec?.slice(ParamSpec?.indexOf('=') + 1)}*${Qty}`,
            200 + 36 + 5 + 3,
            51 + index * 40,
          )
        }

        //上侧围
        if (
          (PartNo?.includes('XN2808ED') || PartNo?.includes('XN2838CQ')) &&
          Remark?.includes('上头部')
        ) {
          const count = data
            .filter(
              (it) =>
                (it.PartNo?.includes('XN2808ED') ||
                  it.PartNo?.includes('XN2838CQ')) &&
                it.Remark?.includes('上头部'),
            )
            .map((it) => it.Qty)
            .reduce((a, b) => (a || 0) + (b || 0))

          doc.setFontSize(8)
          doc.text(
            `${ParamSpec?.slice(ParamSpec?.indexOf('=') + 1)}*${count}`,
            200 + 36 + 5 + 3 + 15,
            47 + index * 40,
          )
        }

        //下侧围
        if (
          (PartNo?.includes('XN2808ED') || PartNo?.includes('XN2838CQ')) &&
          Remark?.includes('下头部')
        ) {
          const count = data
            .filter(
              (it) =>
                (it.PartNo?.includes('XN2808ED') ||
                  it.PartNo?.includes('XN2838CQ')) &&
                it.Remark?.includes('下头部'),
            )
            .map((it) => it.Qty)
            .reduce((a, b) => (a || 0) + (b || 0))

          doc.setFontSize(8)
          doc.text(
            `${ParamSpec?.slice(ParamSpec?.indexOf('=') + 1)}*${count}`,
            200 + 36 + 5 + 3 + 15,
            56 + index * 40,
          )
        }
      })

      index++
    })
  }

  function printDecomposition() {
    doc.output('dataurlnewwindow', {
      filename: '分解单',
    })
  }
  return { printDecomposition }
}

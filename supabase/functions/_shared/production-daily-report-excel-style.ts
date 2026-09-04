import XLSX from 'npm:xlsx-js-style@1.2.0'

function getColumnLetter(columnIndex: number): string {
  let letter = ''
  let currentIndex = columnIndex

  while (currentIndex >= 0) {
    letter = String.fromCharCode((currentIndex % 26) + 65) + letter
    currentIndex = Math.floor(currentIndex / 26) - 1
  }

  return letter
}

export function setRowHeight(
  worksheet: XLSX.WorkSheet,
  rowHeight: number,
  rowCount: number,
): void {
  worksheet['!rows'] = Array.from({ length: rowCount }, () => ({
    hpt: rowHeight,
    hpx: rowHeight,
  }))
}

export function centerAllCells(
  worksheet: XLSX.WorkSheet,
  data: Array<Array<unknown>>,
): void {
  if (data.length === 0) {
    return
  }

  for (let rowIndex = 0; rowIndex < data.length; rowIndex += 1) {
    for (let columnIndex = 0; columnIndex < data[0].length; columnIndex += 1) {
      const cellRef = `${getColumnLetter(columnIndex)}${rowIndex + 1}`

      if (!worksheet[cellRef]) {
        worksheet[cellRef] = { v: '' }
      }

      worksheet[cellRef].s = {
        ...(worksheet[cellRef].s || {}),
        font: {
          ...(worksheet[cellRef].s?.font || {}),
          name: '宋体',
          sz: 11,
        },
        alignment: {
          ...(worksheet[cellRef].s?.alignment || {}),
          horizontal: 'center',
          vertical: 'center',
        },
      }
    }
  }
}

import dayjs from 'dayjs'

const excelDate = 45988

// Current logic
const excelEpoch = new Date(1899, 11, 30)
const date = new Date(excelEpoch.getTime() + excelDate * 86400000)
console.log('Current Logic Result:', dayjs(date).format('YYYY-MM-DD'))
console.log('Date object:', date.toString())

// Proposed fix: Add 12 hours (0.5 days) to handle timezone/rounding issues
const dateFix = new Date(excelEpoch.getTime() + (excelDate + 0.5) * 86400000)
console.log('Fix (+0.5) Result:', dayjs(dateFix).format('YYYY-MM-DD'))

// UTC Logic
const utcEpoch = new Date(Date.UTC(1899, 11, 30))
const utcDate = new Date(utcEpoch.getTime() + excelDate * 86400000)
console.log('UTC Logic Result:', utcDate.toISOString().split('T')[0])

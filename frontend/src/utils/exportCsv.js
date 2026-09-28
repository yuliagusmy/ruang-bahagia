/**
 * Utility untuk mengekspor data ke file CSV (Kompatibel dengan Microsoft Excel UTF-8 BOM)
 */
export function exportToCsv(filename, headers, rows) {
  // \uFEFF adalah UTF-8 BOM agar Excel di Windows membaca karakter khusus dan currency dengan benar
  let csvContent = '\uFEFF'

  // Baris Header
  csvContent += headers.map((h) => `"${String(h).replace(/"/g, '""')}"`).join(',') + '\r\n'

  // Baris Data
  rows.forEach((row) => {
    const line = row
      .map((val) => {
        if (val === null || val === undefined) return '""'
        return `"${String(val).replace(/"/g, '""')}"`
      })
      .join(',')
    csvContent += line + '\r\n'
  })

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

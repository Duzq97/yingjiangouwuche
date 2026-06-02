function parseCsv(text) {
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]
    const next = text[i + 1]

    if (char === '"' && inQuotes && next === '"') {
      field += '"'
      i += 1
    } else if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      row.push(field.trim())
      field = ''
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') {
        i += 1
      }
      row.push(field.trim())
      if (row.some(Boolean)) {
        rows.push(row)
      }
      row = []
      field = ''
    } else {
      field += char
    }
  }

  row.push(field.trim())
  if (row.some(Boolean)) {
    rows.push(row)
  }

  const headers = rows.shift() || []
  return rows.map((values, index) => {
    const item = { id: `${index + 1}` }
    headers.forEach((header, headerIndex) => {
      item[header] = values[headerIndex] || ''
    })
    item.price = Number(item['硬件价格']) || 0
    return item
  })
}

module.exports = {
  parseCsv
}

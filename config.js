const CATALOG_KEY = 'hardware_catalog_items'
const CSV_PATHS = ['./miniprogram/data/hardware.csv', '../miniprogram/data/hardware.csv']

let catalogItems = []

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
      if (char === '\r' && next === '\n') i += 1
      row.push(field.trim())
      if (row.some(Boolean)) rows.push(row)
      row = []
      field = ''
    } else {
      field += char
    }
  }

  row.push(field.trim())
  if (row.some(Boolean)) rows.push(row)

  const headers = rows.shift() || []
  return rows.map((values) => {
    const item = {}
    headers.forEach((header, index) => {
      item[header] = values[index] || ''
    })
    return item
  })
}

function decodeCsv(buffer) {
  const utf8Text = new TextDecoder('utf-8').decode(buffer)
  if (utf8Text.includes('硬件分类') && utf8Text.includes('硬件名称')) {
    return utf8Text
  }
  try {
    return new TextDecoder('gb18030').decode(buffer)
  } catch (error) {
    return utf8Text
  }
}

function readCatalog() {
  try {
    return JSON.parse(localStorage.getItem(CATALOG_KEY) || '[]')
  } catch (error) {
    return []
  }
}

function writeCatalog() {
  localStorage.setItem(CATALOG_KEY, JSON.stringify(catalogItems))
}

async function fetchCsvText() {
  for (const path of CSV_PATHS) {
    try {
      const response = await fetch(path, { cache: 'no-store' })
      if (!response.ok) continue
      return decodeCsv(await response.arrayBuffer())
    } catch (error) {
      // Try the next path.
    }
  }
  throw new Error('无法读取 CSV 数据')
}

function getFormItem() {
  return {
    '硬件分类': document.getElementById('categoryInput').value.trim(),
    '硬件名称': document.getElementById('nameInput').value.trim(),
    '硬件描述': document.getElementById('descriptionInput').value.trim(),
    '硬件价格': String(Number(document.getElementById('priceInput').value) || 0),
    '硬件图片': document.getElementById('imageInput').value.trim()
  }
}

function setFormItem(item, index = '') {
  document.getElementById('editIndex').value = index
  document.getElementById('categoryInput').value = item?.['硬件分类'] || 'CPU'
  document.getElementById('nameInput').value = item?.['硬件名称'] || ''
  document.getElementById('descriptionInput').value = item?.['硬件描述'] || ''
  document.getElementById('priceInput').value = item?.['硬件价格'] || ''
  document.getElementById('imageInput').value = item?.['硬件图片'] || ''
}

function renderCatalog() {
  document.getElementById('catalogRows').innerHTML = catalogItems.map((item, index) => `
    <tr>
      <td>${item['硬件分类']}</td>
      <td>${item['硬件名称']}</td>
      <td>${item['硬件描述']}</td>
      <td>￥${Number(item['硬件价格'] || 0).toLocaleString('zh-CN')}</td>
      <td><span class="image-url">${item['硬件图片']}</span></td>
      <td>
        <button class="table-action" type="button" data-edit="${index}">编辑</button>
        <button class="table-action danger" type="button" data-delete="${index}">删除</button>
      </td>
    </tr>
  `).join('')
}

document.getElementById('catalogForm').addEventListener('submit', (event) => {
  event.preventDefault()
  const editIndex = document.getElementById('editIndex').value
  const item = getFormItem()

  if (editIndex === '') {
    catalogItems.unshift(item)
  } else {
    catalogItems[Number(editIndex)] = item
  }

  writeCatalog()
  setFormItem(null)
  renderCatalog()
})

document.getElementById('cancelEdit').addEventListener('click', () => {
  setFormItem(null)
})

document.getElementById('catalogRows').addEventListener('click', (event) => {
  const editIndex = event.target.closest('[data-edit]')?.dataset.edit
  const deleteIndex = event.target.closest('[data-delete]')?.dataset.delete

  if (editIndex !== undefined) {
    setFormItem(catalogItems[Number(editIndex)], editIndex)
  }

  if (deleteIndex !== undefined) {
    if (!window.confirm('确定删除这条商品数据？')) return
    catalogItems.splice(Number(deleteIndex), 1)
    writeCatalog()
    renderCatalog()
  }
})

document.getElementById('resetCatalog').addEventListener('click', async () => {
  if (!window.confirm('确定恢复 CSV 默认数据？当前后台配置会被清空。')) return
  localStorage.removeItem(CATALOG_KEY)
  catalogItems = parseCsv(await fetchCsvText())
  renderCatalog()
})

async function init() {
  catalogItems = readCatalog()
  if (!catalogItems.length) {
    catalogItems = parseCsv(await fetchCsvText())
  }
  renderCatalog()
}

init()

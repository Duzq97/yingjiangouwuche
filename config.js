const CATALOG_KEY = 'hardware_catalog_items'

let catalogItems = []

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

document.getElementById('resetCatalog').addEventListener('click', () => {
  if (!window.confirm('确定恢复默认数据？当前后台配置会被清空。')) return
  localStorage.removeItem(CATALOG_KEY)
  catalogItems = [...window.DEFAULT_CATALOG_ITEMS]
  renderCatalog()
})

function init() {
  catalogItems = readCatalog()
  if (!catalogItems.length) {
    catalogItems = [...window.DEFAULT_CATALOG_ITEMS]
  }
  renderCatalog()
}

init()

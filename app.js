const CATEGORY_ORDER = ['全部', 'CPU', '主板', '显卡', '散热器', '电源', '内存', '硬盘', '机箱', '杂项']

const state = {
  items: [],
  category: '全部',
  cart: new Map(),
  cartExpanded: false
}

const SUBMISSION_KEY = 'hardware_config_submissions'
const CATALOG_KEY = 'hardware_catalog_items'
const CSV_PATHS = ['./miniprogram/data/hardware.csv', '../miniprogram/data/hardware.csv']

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

  const headers = rows.shift()
  return rows.map((values, index) => {
    const item = { id: String(index + 1) }
    headers.forEach((header, headerIndex) => {
      item[header] = values[headerIndex] || ''
    })
    item.price = Number(item['硬件价格']) || 0
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

function formatPrice(value) {
  return `￥${value.toLocaleString('zh-CN')}`
}

function readSubmissions() {
  try {
    return JSON.parse(localStorage.getItem(SUBMISSION_KEY) || '[]')
  } catch (error) {
    return []
  }
}

function writeSubmissions(submissions) {
  localStorage.setItem(SUBMISSION_KEY, JSON.stringify(submissions))
}

function readCatalogItems() {
  try {
    return JSON.parse(localStorage.getItem(CATALOG_KEY) || '[]')
  } catch (error) {
    return []
  }
}

function getVisibleItems() {
  return state.category === '全部'
    ? state.items
    : state.items.filter((item) => item['硬件分类'] === state.category)
}

function getCartRows() {
  return Array.from(state.cart.entries()).map(([id, quantity]) => {
    const product = state.items.find((item) => item.id === id)
    return { ...product, quantity }
  }).filter((item) => item.id)
}

function renderTabs() {
  const counts = state.items.reduce((result, item) => {
    result[item['硬件分类']] = (result[item['硬件分类']] || 0) + 1
    return result
  }, {})

  const tabs = CATEGORY_ORDER.filter((name) => name === '全部' || counts[name])
  document.getElementById('tabs').innerHTML = tabs.map((name) => {
    const count = name === '全部' ? state.items.length : counts[name]
    const active = name === state.category ? 'active' : ''
    return `
      <button class="tab ${active}" type="button" data-category="${name}">
        <span class="tab-name">${name}</span>
        <span class="tab-count">${count}</span>
      </button>
    `
  }).join('')
}

function renderProducts() {
  const visible = getVisibleItems()
  document.getElementById('categoryTitle').textContent = state.category === '全部' ? '全部商品' : state.category
  document.getElementById('resultCount').textContent = `${visible.length} 项`

  document.getElementById('products').innerHTML = visible.map((item) => `
    <article class="product">
      <div class="image-frame">
        <img src="${item['硬件图片']}" alt="${item['硬件名称']}" />
      </div>
      <div class="product-content">
        <div class="product-title">
          <div>
            <span class="category-chip">${item['硬件分类']}</span>
            <h3>${item['硬件名称']}</h3>
          </div>
          <strong>${formatPrice(item.price)}</strong>
        </div>
        <p>${item['硬件描述']}</p>
        <div class="product-actions">
          <span>商品信息</span>
          <button type="button" data-add="${item.id}">加入购物车</button>
        </div>
      </div>
    </article>
  `).join('')
}

function renderCart() {
  const rows = getCartRows()
  const totalCount = rows.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = rows.reduce((sum, item) => sum + item.price * item.quantity, 0)

  document.getElementById('cartCount').textContent = `${totalCount} 件`
  document.getElementById('cartTotal').textContent = formatPrice(totalPrice)
  document.getElementById('cartInline').textContent = `${totalCount} 件 / ${formatPrice(totalPrice)}`
  document.getElementById('checkoutTotal').textContent = formatPrice(totalPrice)
  document.getElementById('cart').classList.toggle('collapsed', !state.cartExpanded)
  document.getElementById('toggleCart').textContent = state.cartExpanded ? '收起' : '展开'
  document.getElementById('toggleCart').setAttribute('aria-expanded', String(state.cartExpanded))

  document.getElementById('cartItems').innerHTML = rows.length
    ? rows.map((item) => `
      <div class="cart-item">
        <div>
          <strong>${item['硬件名称']}</strong>
          <span>${formatPrice(item.price)} x ${item.quantity}</span>
        </div>
        <div class="quantity">
          <button type="button" data-minus="${item.id}" aria-label="减少">-</button>
          <button type="button" data-plus="${item.id}" aria-label="增加">+</button>
        </div>
      </div>
    `).join('')
    : '<p class="empty">还没有选择硬件</p>'
}

function render() {
  renderTabs()
  renderProducts()
  renderCart()
}

document.addEventListener('click', (event) => {
  const category = event.target.closest('[data-category]')?.dataset.category
  const addId = event.target.closest('[data-add]')?.dataset.add
  const minusId = event.target.closest('[data-minus]')?.dataset.minus
  const plusId = event.target.closest('[data-plus]')?.dataset.plus

  if (category) {
    state.category = category
    render()
  }

  if (addId || plusId) {
    const id = addId || plusId
    state.cart.set(id, (state.cart.get(id) || 0) + 1)
    renderCart()
  }

  if (minusId) {
    const next = (state.cart.get(minusId) || 0) - 1
    if (next > 0) state.cart.set(minusId, next)
    else state.cart.delete(minusId)
    renderCart()
  }
})

document.getElementById('clearCart').addEventListener('click', () => {
  state.cart.clear()
  renderCart()
})

document.getElementById('submitConfig').addEventListener('click', () => {
  const rows = getCartRows()
  if (!rows.length) {
    window.alert('请先选择商品再提交配置')
    return
  }

  const totalCount = rows.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = rows.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const submission = {
    id: `CFG-${Date.now()}`,
    createdAt: new Date().toISOString(),
    totalCount,
    totalPrice,
    items: rows.map((item) => ({
      category: item['硬件分类'],
      name: item['硬件名称'],
      description: item['硬件描述'],
      price: item.price,
      image: item['硬件图片'],
      quantity: item.quantity
    }))
  }

  writeSubmissions([submission, ...readSubmissions()])
  state.cart.clear()
  state.cartExpanded = false
  renderCart()
  window.alert('配置单已提交，可进入后台查看')
})

document.getElementById('toggleCart').addEventListener('click', () => {
  state.cartExpanded = !state.cartExpanded
  renderCart()
})

document.getElementById('cartButton').addEventListener('click', () => {
  state.cartExpanded = true
  renderCart()
  document.getElementById('cart').scrollIntoView({ behavior: 'smooth', block: 'start' })
})

async function fetchCsvText() {
  for (const path of CSV_PATHS) {
    try {
      const response = await fetch(path, { cache: 'no-store' })
      if (!response.ok) continue
      return decodeCsv(await response.arrayBuffer())
    } catch (error) {
      // The local preview and GitHub Pages deployment use different roots.
    }
  }
  throw new Error('无法读取 CSV 数据')
}

async function loadCatalog() {
  const configuredItems = readCatalogItems()
  if (configuredItems.length) {
    state.items = configuredItems.map((item, index) => ({
      id: String(index + 1),
      ...item,
      price: Number(item['硬件价格']) || 0
    }))
  } else {
    state.items = parseCsv(await fetchCsvText())
  }
  render()
}

loadCatalog()

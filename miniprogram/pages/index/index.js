const { parseCsv } = require('../../utils/csv')
const hardwareCsv = require('../../data/hardware')

const CATEGORY_ORDER = ['全部', 'CPU', '主板', '显卡', '散热器', '电源', '内存', '硬盘', '机箱', '杂项']
const SUBMISSION_KEY = 'hardware_config_submissions'

Page({
  data: {
    items: [],
    visibleItems: [],
    categories: [],
    activeCategory: '全部',
    cart: {},
    cartItems: [],
    cartCount: 0,
    cartTotal: 0,
    cartVisible: false,
    tapStatus: '可点击区域：分类 / 加入 / 购物车'
  },

  onLoad() {
    this.loadCsvData()
  },

  loadCsvData() {
    let csv = hardwareCsv
    try {
      csv = wx.getFileSystemManager().readFileSync('/data/hardware.csv', 'utf8')
    } catch (error) {
      csv = hardwareCsv
    }
    const items = parseCsv(csv)
    this.setData({ items }, () => {
      this.refreshCategoryState()
      this.applyCategory()
    })
  },

  refreshCategoryState() {
    const counts = this.data.items.reduce((result, item) => {
      const name = item['硬件分类']
      result[name] = (result[name] || 0) + 1
      return result
    }, {})

    const categories = CATEGORY_ORDER
      .filter((name) => name === '全部' || counts[name])
      .map((name) => ({
        name,
        count: name === '全部' ? this.data.items.length : counts[name]
      }))

    this.setData({ categories })
  },

  applyCategory() {
    const { activeCategory, items } = this.data
    const visibleItems = activeCategory === '全部'
      ? items
      : items.filter((item) => item['硬件分类'] === activeCategory)
    this.setData({ visibleItems })
  },

  selectCategory(event) {
    const activeCategory = event.currentTarget.dataset.name
    this.setData({ activeCategory, tapStatus: `已切换到：${activeCategory}` }, () => {
      this.applyCategory()
    })
  },

  addToCart(event) {
    const id = event.currentTarget.dataset.id
    const cart = { ...this.data.cart, [id]: (this.data.cart[id] || 0) + 1 }
    const item = this.data.items.find((product) => product.id === id)
    this.setData({ cart, tapStatus: `已加入：${item ? item['硬件名称'] : '商品'}` }, () => this.refreshCart())
  },

  increaseCart(event) {
    this.addToCart(event)
  },

  decreaseCart(event) {
    const id = event.currentTarget.dataset.id
    const cart = { ...this.data.cart }
    if (cart[id] > 1) {
      cart[id] -= 1
    } else {
      delete cart[id]
    }
    this.setData({ cart }, () => this.refreshCart())
  },

  refreshCart() {
    const cartItems = Object.keys(this.data.cart).map((id) => {
      const item = this.data.items.find((product) => product.id === id)
      return { ...item, quantity: this.data.cart[id] }
    }).filter(Boolean)

    const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)
    const cartTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
    this.setData({ cartItems, cartCount, cartTotal })
  },

  openCart() {
    this.setData({ cartVisible: true, tapStatus: '已打开购物车' })
  },

  closeCart() {
    this.setData({ cartVisible: false, tapStatus: '已关闭购物车' })
  },

  submitConfig() {
    if (!this.data.cartItems.length) {
      wx.showToast({
        title: '请先选择硬件',
        icon: 'none'
      })
      return
    }

    const submission = {
      id: `CFG-${Date.now()}`,
      createdAt: new Date().toISOString(),
      totalCount: this.data.cartCount,
      totalPrice: this.data.cartTotal,
      items: this.data.cartItems.map((item) => ({
        category: item['硬件分类'],
        name: item['硬件名称'],
        description: item['硬件描述'],
        price: item.price,
        image: item['硬件图片'],
        quantity: item.quantity
      }))
    }

    const submissions = wx.getStorageSync(SUBMISSION_KEY) || []
    wx.setStorageSync(SUBMISSION_KEY, [submission, ...submissions])
    this.setData({
      cart: {},
      cartItems: [],
      cartCount: 0,
      cartTotal: 0,
      cartVisible: false
    })
    wx.showToast({
      title: '配置已提交',
      icon: 'success'
    })
  },

  noop() {}
})

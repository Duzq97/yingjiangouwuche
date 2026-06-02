const CATEGORY_ORDER = ['全部', 'CPU', '主板', '显卡', '散热器', '电源', '内存', '硬盘', '机箱', '杂项']
const SUBMISSION_KEY = 'hardware_config_submissions'
const LOCAL_IMAGE = '/assets/huiwen-computer-icon.png'

const DEFAULT_ITEMS = [
  ['CPU', 'Intel Core i5-14600KF', '14核心20线程，适合高帧率游戏和内容创作', 2199],
  ['CPU', 'AMD Ryzen 7 7800X3D', '大缓存游戏处理器，能效表现优秀', 2699],
  ['主板', 'MSI B760M Mortar WiFi', 'D5内存支持，WiFi 6E，接口完整', 1299],
  ['主板', 'ASUS TUF B650M-PLUS', 'AM5平台，供电扎实，适合中高端锐龙', 1399],
  ['显卡', 'NVIDIA GeForce RTX 4070 SUPER', '2K高画质游戏与AI创作兼顾', 4899],
  ['显卡', 'AMD Radeon RX 7800 XT', '16GB显存，2K游戏性价比方案', 3799],
  ['散热器', 'Thermalright PA120 SE', '双塔风冷，压制中高端CPU', 199],
  ['电源', 'Seasonic Focus GX750', '750W金牌全模组，支持主流中高端配置', 799],
  ['内存', 'Corsair DDR5 6000 32GB', '双通道32GB，适合游戏与生产力', 799],
  ['硬盘', 'Samsung 990 EVO 1TB', 'PCIe 4.0 NVMe固态，系统盘首选', 599],
  ['机箱', 'Fractal Pop Air', '高风道中塔机箱，走线空间充足', 599],
  ['杂项', 'Windows 11 Home', '正版系统授权，适合日常与游戏主机', 899],
  ['杂项', '显卡延长线', '适用于竖装显卡', 100]
]

function createItems() {
  return DEFAULT_ITEMS.map(function (row, index) {
    return {
      id: String(index + 1),
      '硬件分类': row[0],
      '硬件名称': row[1],
      '硬件描述': row[2],
      '硬件价格': String(row[3]),
      '硬件图片': LOCAL_IMAGE,
      price: row[3]
    }
  })
}

Page({
  data: {
    items: [],
    visibleItems: [],
    categories: [],
    activeCategory: '全部',
    activeCategoryLabel: '全部商品',
    cart: {},
    cartItems: [],
    cartCount: 0,
    cartTotal: 0,
    cartVisible: false
  },

  onLoad: function () {
    var items = createItems()
    this.setData({ items: items })
    this.refreshCategoryState()
    this.applyCategory()
  },

  refreshCategoryState: function () {
    var counts = {}
    this.data.items.forEach(function (item) {
      var name = item['硬件分类']
      counts[name] = (counts[name] || 0) + 1
    })

    var categories = CATEGORY_ORDER.filter(function (name) {
      return name === '全部' || counts[name]
    }).map(function (name) {
      return {
        name: name,
        count: name === '全部' ? this.data.items.length : counts[name]
      }
    }, this)

    this.setData({ categories: categories })
  },

  applyCategory: function () {
    var activeCategory = this.data.activeCategory
    var visibleItems = activeCategory === '全部'
      ? this.data.items
      : this.data.items.filter(function (item) {
        return item['硬件分类'] === activeCategory
      })

    this.setData({
      visibleItems: visibleItems,
      activeCategoryLabel: activeCategory === '全部' ? '全部商品' : activeCategory
    })
  },

  selectCategory: function (event) {
    this.setData({ activeCategory: event.currentTarget.dataset.name })
    this.applyCategory()
  },

  addToCart: function (event) {
    var id = event.currentTarget.dataset.id
    var cart = Object.assign({}, this.data.cart)
    cart[id] = (cart[id] || 0) + 1
    this.setData({ cart: cart })
    this.refreshCart()
  },

  increaseCart: function (event) {
    this.addToCart(event)
  },

  decreaseCart: function (event) {
    var id = event.currentTarget.dataset.id
    var cart = Object.assign({}, this.data.cart)
    if (cart[id] > 1) {
      cart[id] -= 1
    } else {
      delete cart[id]
    }
    this.setData({ cart: cart })
    this.refreshCart()
  },

  refreshCart: function () {
    var cart = this.data.cart
    var cartItems = Object.keys(cart).map(function (id) {
      var found = this.data.items.find(function (item) {
        return item.id === id
      })
      if (!found) return null
      return Object.assign({}, found, { quantity: cart[id] })
    }, this).filter(Boolean)

    var cartCount = cartItems.reduce(function (sum, item) {
      return sum + item.quantity
    }, 0)
    var cartTotal = cartItems.reduce(function (sum, item) {
      return sum + item.price * item.quantity
    }, 0)

    this.setData({
      cartItems: cartItems,
      cartCount: cartCount,
      cartTotal: cartTotal
    })
  },

  openCart: function () {
    this.setData({ cartVisible: true })
  },

  closeCart: function () {
    this.setData({ cartVisible: false })
  },

  submitConfig: function () {
    if (!this.data.cartItems.length) {
      wx.showToast({ title: '请先选择商品', icon: 'none' })
      return
    }

    var submission = {
      id: 'CFG-' + Date.now(),
      createdAt: new Date().toISOString(),
      totalCount: this.data.cartCount,
      totalPrice: this.data.cartTotal,
      items: this.data.cartItems.map(function (item) {
        return {
          category: item['硬件分类'],
          name: item['硬件名称'],
          description: item['硬件描述'],
          price: item.price,
          image: item['硬件图片'],
          quantity: item.quantity
        }
      })
    }

    var submissions = wx.getStorageSync(SUBMISSION_KEY) || []
    submissions.unshift(submission)
    wx.setStorageSync(SUBMISSION_KEY, submissions)
    this.setData({
      cart: {},
      cartItems: [],
      cartCount: 0,
      cartTotal: 0,
      cartVisible: false
    })
    wx.showToast({ title: '配置已提交', icon: 'success' })
  },

  noop: function () {}
})

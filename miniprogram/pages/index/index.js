Page({
  data: {
    categories: [
      { name: '全部', count: 4 },
      { name: 'CPU', count: 2 },
      { name: '显卡', count: 1 },
      { name: '杂项', count: 1 }
    ],
    activeCategory: '全部',
    activeCategoryLabel: '全部商品',
    visibleItems: [
      {
        id: '1',
        '硬件分类': 'CPU',
        '硬件名称': 'Intel Core i5-14600KF',
        '硬件描述': '14核心20线程，适合高帧率游戏和内容创作',
        price: 2199
      },
      {
        id: '2',
        '硬件分类': 'CPU',
        '硬件名称': 'AMD Ryzen 7 7800X3D',
        '硬件描述': '大缓存游戏处理器，能效表现优秀',
        price: 2699
      },
      {
        id: '3',
        '硬件分类': '显卡',
        '硬件名称': 'NVIDIA GeForce RTX 4070 SUPER',
        '硬件描述': '2K高画质游戏与AI创作兼顾',
        price: 4899
      },
      {
        id: '4',
        '硬件分类': '杂项',
        '硬件名称': '显卡延长线',
        '硬件描述': '适用于竖装显卡',
        price: 100
      }
    ],
    allItems: [],
    cart: {},
    cartItems: [],
    cartCount: 0,
    cartTotal: 0,
    cartVisible: false
  },

  onLoad: function () {
    this.setData({
      allItems: this.data.visibleItems
    })
  },

  selectCategory: function (event) {
    var name = event.currentTarget.dataset.name
    var list = []
    var i

    if (name === '全部') {
      list = this.data.allItems
    } else {
      for (i = 0; i < this.data.allItems.length; i += 1) {
        if (this.data.allItems[i]['硬件分类'] === name) {
          list.push(this.data.allItems[i])
        }
      }
    }

    this.setData({
      activeCategory: name,
      activeCategoryLabel: name === '全部' ? '全部商品' : name,
      visibleItems: list
    })
  },

  addToCart: function (event) {
    var id = event.currentTarget.dataset.id
    var cart = this.data.cart
    var nextCart = {}
    var key

    for (key in cart) {
      nextCart[key] = cart[key]
    }
    nextCart[id] = (nextCart[id] || 0) + 1

    this.setData({ cart: nextCart })
    this.refreshCart()
  },

  increaseCart: function (event) {
    this.addToCart(event)
  },

  decreaseCart: function (event) {
    var id = event.currentTarget.dataset.id
    var cart = this.data.cart
    var nextCart = {}
    var key

    for (key in cart) {
      nextCart[key] = cart[key]
    }

    if (nextCart[id] > 1) {
      nextCart[id] -= 1
    } else {
      delete nextCart[id]
    }

    this.setData({ cart: nextCart })
    this.refreshCart()
  },

  refreshCart: function () {
    var rows = []
    var totalCount = 0
    var totalPrice = 0
    var id
    var i
    var item
    var row

    for (id in this.data.cart) {
      item = null
      for (i = 0; i < this.data.allItems.length; i += 1) {
        if (this.data.allItems[i].id === id) {
          item = this.data.allItems[i]
          break
        }
      }
      if (item) {
        row = {
          id: item.id,
          '硬件分类': item['硬件分类'],
          '硬件名称': item['硬件名称'],
          price: item.price,
          quantity: this.data.cart[id]
        }
        rows.push(row)
        totalCount += row.quantity
        totalPrice += row.price * row.quantity
      }
    }

    this.setData({
      cartItems: rows,
      cartCount: totalCount,
      cartTotal: totalPrice
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

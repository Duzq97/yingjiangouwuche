const CATALOG_KEY = 'hardware_catalog_items'
const LOCAL_IMAGE = '/assets/huiwen-computer-icon.png'
const CATEGORY_OPTIONS = ['套装', 'CPU', '主板', '显卡', '散热器', '电源', '内存', '硬盘', '机箱', '杂项']

const DEFAULT_ITEMS = [
  ['套装', '高帧率游戏主机套装', 'CPU、显卡、主板、内存组合方案', 8999],
  ['CPU', 'Intel Core i5-14600KF', '14核心20线程，适合高帧率游戏和内容创作', 2199],
  ['CPU', 'AMD Ryzen 7 7800X3D', '大缓存游戏处理器，能效表现优秀', 2699],
  ['主板', 'MSI B760M Mortar WiFi', 'D5内存支持，WiFi 6E，接口完整', 1299],
  ['显卡', 'NVIDIA GeForce RTX 4070 SUPER', '2K高画质游戏与AI创作兼顾', 4899],
  ['电源', 'Seasonic Focus GX750', '750W金牌全模组，支持主流中高端配置', 799],
  ['杂项', '显卡延长线', '适用于竖装显卡', 100]
]

function createDefaultItems() {
  return DEFAULT_ITEMS.map(function (row, index) {
    return {
      id: String(index + 1),
      '硬件分类': row[0],
      '硬件名称': row[1],
      '硬件描述': row[2],
      '硬件价格': String(row[3]),
      '硬件图片': LOCAL_IMAGE
    }
  })
}

function emptyForm() {
  return {
    '硬件分类': '套装',
    '硬件名称': '',
    '硬件描述': '',
    '硬件价格': '',
    '硬件图片': LOCAL_IMAGE
  }
}

function getFileExt(path) {
  var match = String(path || '').match(/\.(jpg|jpeg|png|webp)$/i)
  return match ? match[0] : '.jpg'
}

Page({
  data: {
    items: [],
    form: emptyForm(),
    editingIndex: -1,
    categoryOptions: CATEGORY_OPTIONS,
    categoryIndex: 0
  },

  onShow: function () {
    this.loadItems()
  },

  loadItems: function () {
    var savedItems = wx.getStorageSync(CATALOG_KEY) || []
    var items = savedItems.length ? savedItems : createDefaultItems()
    this.setData({ items: items })
  },

  writeItems: function (items) {
    wx.setStorageSync(CATALOG_KEY, items)
    this.setData({ items: items })
  },

  changeCategory: function (event) {
    var index = Number(event.detail.value)
    var form = this.data.form
    form['硬件分类'] = CATEGORY_OPTIONS[index]
    this.setData({
      form: form,
      categoryIndex: index
    })
  },

  chooseImage: function () {
    var self = this
    var handler = function (tempPath) {
      var form = self.data.form
      var fs = wx.getFileSystemManager()
      var savedPath = wx.env.USER_DATA_PATH + '/catalog_' + Date.now() + getFileExt(tempPath)

      try {
        fs.copyFileSync(tempPath, savedPath)
        form['硬件图片'] = savedPath
      } catch (error) {
        form['硬件图片'] = tempPath
      }

      self.setData({ form: form })
    }

    if (wx.chooseMedia) {
      wx.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sourceType: ['album', 'camera'],
        success: function (result) {
          if (!result.tempFiles || !result.tempFiles.length) return
          handler(result.tempFiles[0].tempFilePath)
        }
      })
      return
    }

    wx.chooseImage({
      count: 1,
      sizeType: ['compressed', 'original'],
      sourceType: ['album', 'camera'],
      success: function (result) {
        if (!result.tempFilePaths || !result.tempFilePaths.length) return
        handler(result.tempFilePaths[0])
      }
    })
  },

  updateForm: function (event) {
    var key = event.currentTarget.dataset.key
    var form = this.data.form
    form[key] = event.detail.value
    this.setData({ form: form })
  },

  saveItem: function () {
    var form = this.data.form
    var items = this.data.items.slice()
    var item

    if (!form['硬件名称'] || !form['硬件价格']) {
      wx.showToast({ title: '请填写名称和价格', icon: 'none' })
      return
    }

    item = {
      id: String(Date.now()),
      '硬件分类': form['硬件分类'],
      '硬件名称': form['硬件名称'],
      '硬件描述': form['硬件描述'],
      '硬件价格': String(Number(form['硬件价格']) || 0),
      '硬件图片': form['硬件图片'] || LOCAL_IMAGE
    }

    if (this.data.editingIndex === -1) {
      items.unshift(item)
    } else {
      items[this.data.editingIndex] = item
    }

    this.writeItems(items)
    this.cancelEdit()
  },

  editItem: function (event) {
    var index = Number(event.currentTarget.dataset.index)
    var item = this.data.items[index]
    var categoryIndex = CATEGORY_OPTIONS.indexOf(item['硬件分类'])
    if (categoryIndex < 0) categoryIndex = 0

    this.setData({
      form: {
        '硬件分类': item['硬件分类'],
        '硬件名称': item['硬件名称'],
        '硬件描述': item['硬件描述'],
        '硬件价格': item['硬件价格'],
        '硬件图片': item['硬件图片']
      },
      editingIndex: index,
      categoryIndex: categoryIndex
    })
  },

  deleteItem: function (event) {
    var self = this
    var index = Number(event.currentTarget.dataset.index)
    wx.showModal({
      title: '确认删除',
      content: '确定删除这个商品？',
      success: function (result) {
        var items
        if (!result.confirm) return
        items = self.data.items.slice()
        items.splice(index, 1)
        self.writeItems(items)
      }
    })
  },

  cancelEdit: function () {
    this.setData({
      form: emptyForm(),
      editingIndex: -1,
      categoryIndex: 0
    })
  },

  resetCatalog: function () {
    var self = this
    wx.showModal({
      title: '恢复默认',
      content: '确定恢复默认商品数据？',
      success: function (result) {
        if (!result.confirm) return
        wx.removeStorageSync(CATALOG_KEY)
        self.setData({
          items: createDefaultItems(),
          form: emptyForm(),
          editingIndex: -1,
          categoryIndex: 0
        })
      }
    })
  }
})

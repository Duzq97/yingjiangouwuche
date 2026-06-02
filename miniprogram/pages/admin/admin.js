const SUBMISSION_KEY = 'hardware_config_submissions'

function formatTime(value) {
  var date = new Date(value)
  var month = date.getMonth() + 1
  var day = date.getDate()
  var hour = date.getHours()
  var minute = date.getMinutes()
  return date.getFullYear() + '-' +
    String(month).padStart(2, '0') + '-' +
    String(day).padStart(2, '0') + ' ' +
    String(hour).padStart(2, '0') + ':' +
    String(minute).padStart(2, '0')
}

Page({
  data: {
    submissions: []
  },

  onShow: function () {
    this.loadSubmissions()
  },

  loadSubmissions: function () {
    var list = wx.getStorageSync(SUBMISSION_KEY) || []
    var submissions = list.map(function (item) {
      return {
        id: item.id,
        createdAtText: formatTime(item.createdAt),
        totalCount: item.totalCount || 0,
        totalPrice: item.totalPrice || 0,
        items: item.items || []
      }
    })
    this.setData({ submissions: submissions })
  },

  clearSubmissions: function () {
    var self = this
    wx.showModal({
      title: '确认清空',
      content: '确定清空所有配置单记录？',
      success: function (result) {
        if (!result.confirm) return
        wx.removeStorageSync(SUBMISSION_KEY)
        self.setData({ submissions: [] })
      }
    })
  }
})

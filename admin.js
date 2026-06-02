const SUBMISSION_KEY = 'hardware_config_submissions'

function formatPrice(value) {
  return `￥${Number(value || 0).toLocaleString('zh-CN')}`
}

function formatTime(value) {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value))
}

function readSubmissions() {
  try {
    return JSON.parse(localStorage.getItem(SUBMISSION_KEY) || '[]')
  } catch (error) {
    return []
  }
}

function renderSubmissions() {
  const submissions = readSubmissions()
  const list = document.getElementById('submissionList')

  list.innerHTML = submissions.length
    ? submissions.map((submission) => `
      <article class="submission-card">
        <div class="submission-head">
          <div>
            <span class="eyebrow">${formatTime(submission.createdAt)}</span>
            <h3>${submission.id}</h3>
          </div>
          <strong>${formatPrice(submission.totalPrice)}</strong>
        </div>
        <div class="submission-meta">
          <span>${submission.totalCount} 件商品</span>
          <span>${submission.items.length} 个条目</span>
        </div>
        <div class="submission-items">
          ${submission.items.map((item) => `
            <div class="submission-item">
              <img src="${item.image}" alt="${item.name}" />
              <div>
                <strong>${item.name}</strong>
                <span>${item.category} / ${formatPrice(item.price)} x ${item.quantity}</span>
              </div>
            </div>
          `).join('')}
        </div>
      </article>
    `).join('')
    : '<p class="empty admin-empty">暂无配置单，先在主页面选择硬件并提交配置。</p>'
}

document.getElementById('clearSubmissions').addEventListener('click', () => {
  if (!window.confirm('确定清空所有配置单记录？')) return
  localStorage.removeItem(SUBMISSION_KEY)
  renderSubmissions()
})

renderSubmissions()

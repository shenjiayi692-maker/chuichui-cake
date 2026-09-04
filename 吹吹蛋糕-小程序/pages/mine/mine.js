const cloud = require('../../utils/cloud.js');
const { getStyleById } = require('../../utils/cake-styles.js');

function formatDate(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

Page({
  data: { cakes: [], loading: false },

  onShow() { this._refresh(); },

  _refresh() {
    this.setData({ loading: true });
    cloud.list().then(all => {
      const cakes = all.map(c => ({
        id: c.id,
        emoji: getStyleById(c.style && c.style.theme).decorEmoji,
        receiverNick: c.receiverNick,
        dateText: formatDate(c.createdAt),
        openCount: (c.stats && c.stats.openCount) || 0,
        blowCount: (c.stats && c.stats.blowCompletedCount) || 0
      }));
      this.setData({ cakes, loading: false });
    }).catch(() => {
      this.setData({ loading: false });
    });
  },

  goCreate() {
    wx.navigateTo({ url: '/pages/create/create' });
  },

  openCake(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/view/view?id=${id}` });
  },

  deleteCake(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认删除',
      content: '删除后这块蛋糕就吃不到了，确定？',
      success: (r) => {
        if (r.confirm) {
          cloud.remove(id).then(() => this._refresh());
        }
      }
    });
  }
});

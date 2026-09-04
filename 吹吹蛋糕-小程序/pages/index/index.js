const storage = require('../../utils/storage.js');
const { getStyleById } = require('../../utils/cake-styles.js');

function formatDate(ts) {
  const d = new Date(ts);
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return `${m}月${day}日 创建`;
}

Page({
  data: {
    recentCakes: []
  },

  onShow() {
    const cakes = storage.list().slice(0, 5).map(c => {
      const style = getStyleById(c.style && c.style.theme);
      return {
        id: c.id,
        receiverNick: c.receiverNick,
        styleEmoji: style.decorEmoji,
        createdAtText: formatDate(c.createdAt)
      };
    });
    this.setData({ recentCakes: cakes });
  },

  goCreate() {
    wx.navigateTo({ url: '/pages/create/create' });
  },

  goMine() {
    wx.navigateTo({ url: '/pages/mine/mine' });
  },

  openCake(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/view/view?id=${id}` });
  },

  onShareAppMessage() {
    return {
      title: '吹吹蛋糕：不在身边也能吹灭TA的蜡烛 🎂',
      path: '/pages/index/index'
    };
  }
});

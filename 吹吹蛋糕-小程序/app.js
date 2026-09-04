// app.js
App({
  onLaunch() {
    if (!wx.cloud) {
      console.error('请使用微信基础库 2.2.3 及以上版本以使用云开发');
      return;
    }
    wx.cloud.init({
      // 填入你在云开发控制台创建的环境 ID
      env: 'YOUR_ENV_ID',
      traceUser: true
    });
  },
  globalData: {
    version: '1.0.0'
  }
});

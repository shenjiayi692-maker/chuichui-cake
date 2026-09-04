const cloud = require('../../utils/cloud.js');
const { getStyleById, CANDLE_COLORS } = require('../../utils/cake-styles.js');
const BlowDetector = require('../../utils/blow-detector.js');

Page({
  data: {
    cakeId: '',
    cake: null,
    style: {},
    candleColor: '#FF7A8A',
    candleList: [],          // [{i, lit: true/false}]
    remainLit: 0,
    phase: 'ready',          // ready | blowing | revealed
    vuPercent: 0,
    fallbackMode: false,
    notFound: false,
    voicePlaying: false,
    isPreview: false
  },

  onLoad(options) {
    const id = options.id;
    const isPreview = options.preview === '1';
    this.setData({ cakeId: id, isPreview });

    wx.showLoading({ title: '加载中…' });

    cloud.get(id).then(cake => {
      wx.hideLoading();
      if (!cake) {
        this.setData({ notFound: true });
        return;
      }

      const style = getStyleById(cake.style.theme);
      const colorDef = CANDLE_COLORS.find(c => c.id === cake.style.candleColor) || CANDLE_COLORS[0];

      // 超过 20 支只显示 20 支视觉
      const displayCount = Math.min(cake.style.candleCount, 20);
      const candleList = Array.from({ length: displayCount }, (_, i) => ({ i, lit: true }));

      this.setData({
        cake,
        style,
        candleColor: colorDef.value,
        candleList,
        remainLit: displayCount
      });

      // 音频播放器
      this._audio = wx.createInnerAudioContext();
      this._audio.onPlay(() => this.setData({ voicePlaying: true }));
      this._audio.onEnded(() => this.setData({ voicePlaying: false }));
      this._audio.onStop(() => this.setData({ voicePlaying: false }));
      this._audio.onError(() => this.setData({ voicePlaying: false }));

      // 设置分享
      wx.showShareMenu({ withShareTicket: true, menus: ['shareAppMessage', 'shareTimeline'] });
    }).catch(() => {
      wx.hideLoading();
      this.setData({ notFound: true });
    });
  },

  onUnload() {
    this._stopDetector();
    if (this._audio) this._audio.destroy();
  },

  onHide() {
    this._stopDetector();
  },

  handleStart() {
    const detector = new BlowDetector();
    this._detector = detector;

    detector
      .on('blow', () => this._handleBlow())
      .on('level', (rms) => {
        // 转成 0~100 用作 VU 显示
        const pct = Math.min(100, Math.round(rms * 100 * 4));
        this.setData({ vuPercent: pct });
      })
      .on('permissionDenied', () => {
        wx.showModal({
          title: '麦克风没开启',
          content: '没关系，你可以"长按按钮"来模拟吹气，依然能吹灭蜡烛哦。',
          showCancel: false
        });
        this.setData({ fallbackMode: true, phase: 'blowing' });
      })
      .on('error', () => {
        this.setData({ fallbackMode: true, phase: 'blowing' });
      });

    detector.start();
    this.setData({ phase: 'blowing' });
  },

  _stopDetector() {
    if (this._detector) {
      this._detector.stop();
      this._detector = null;
    }
    if (this._fallbackTimer) {
      clearInterval(this._fallbackTimer);
      this._fallbackTimer = null;
    }
  },

  _handleBlow() {
    // 每次吹气随机熄灭 1-3 根
    const lit = this.data.candleList.filter(c => c.lit);
    if (lit.length === 0) return;

    const maxPerBlow = Math.min(3, lit.length);
    const toExtinguish = Math.max(1, Math.floor(Math.random() * maxPerBlow) + 1);
    const indices = lit.map(c => c.i).sort(() => Math.random() - 0.5).slice(0, toExtinguish);

    const newList = this.data.candleList.map(c =>
      indices.includes(c.i) ? { ...c, lit: false } : c
    );
    const remain = newList.filter(c => c.lit).length;

    // 轻触觉反馈
    wx.vibrateShort({ type: 'light' });

    this.setData({ candleList: newList, remainLit: remain });

    if (remain === 0) {
      this._onAllOut();
    }
  },

  _onAllOut() {
    this._stopDetector();
    cloud.recordBlowCompleted(this.data.cakeId);
    setTimeout(() => {
      this.setData({ phase: 'revealed' });
      // 自动播放语音（如果有）
      if (this.data.cake.content.voicePath) {
        setTimeout(() => this.playVoice(), 600);
      }
    }, 900);
  },

  // 降级模式：长按按钮模拟吹气（每 500ms 触发一次）
  fallbackHold() {
    if (!this.data.fallbackMode) return;
    if (this._fallbackTimer) return;
    this._handleBlow();
    this._fallbackTimer = setInterval(() => this._handleBlow(), 500);
  },

  fallbackRelease() {
    if (this._fallbackTimer) {
      clearInterval(this._fallbackTimer);
      this._fallbackTimer = null;
    }
  },

  playVoice() {
    const path = this.data.cake.content.voicePath;
    if (!path) return;
    if (this.data.voicePlaying) {
      this._audio.stop();
      return;
    }
    this._audio.src = path;
    this._audio.play();
  },

  saveCard() {
    wx.showLoading({ title: '生成中…' });
    const query = wx.createSelectorQuery();
    query.select('#shareCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res[0]) {
          wx.hideLoading();
          wx.showToast({ title: '生成失败', icon: 'none' });
          return;
        }
        this._drawShareCard(res[0].node)
          .then((tempPath) => {
            wx.hideLoading();
            wx.saveImageToPhotosAlbum({
              filePath: tempPath,
              success: () => wx.showToast({ title: '已保存到相册', icon: 'success' }),
              fail: (err) => {
                if (err.errMsg && err.errMsg.includes('auth')) {
                  wx.showModal({
                    title: '需要相册权限',
                    content: '去设置里开启"保存到相册"，就可以留存这张祝福卡啦。',
                    showCancel: false
                  });
                } else {
                  wx.showToast({ title: '保存失败', icon: 'none' });
                }
              }
            });
          })
          .catch((err) => {
            console.error('[view] render card', err);
            wx.hideLoading();
            wx.showToast({ title: '生成失败', icon: 'none' });
          });
      });
  },

  _drawShareCard(canvas) {
    return new Promise((resolve, reject) => {
      const ctx = canvas.getContext('2d');
      const W = 750, H = 1334;
      canvas.width = W;
      canvas.height = H;

      const { style, cake, candleColor } = this.data;

      // 背景渐变
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, style.bgGradient[0]);
      grad.addColorStop(1, style.bgGradient[1]);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // 顶部祝福前缀
      ctx.fillStyle = '#3E2723';
      ctx.font = 'bold 32px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🎂 生日快乐', W / 2, 140);

      // 寿星名字
      ctx.fillStyle = '#FF7A8A';
      ctx.font = 'bold 72px sans-serif';
      ctx.fillText(cake.receiverNick, W / 2, 230);

      // 蛋糕 —— 简化三层
      const cx = W / 2;
      // 底层
      ctx.fillStyle = style.baseColor;
      this._roundRect(ctx, cx - 240, 620, 480, 160, 20);
      ctx.fill();
      // 奶油中层
      ctx.fillStyle = style.creamColor;
      this._roundRect(ctx, cx - 220, 600, 440, 30, 15);
      ctx.fill();
      // 顶层
      ctx.fillStyle = style.topColor;
      this._roundRect(ctx, cx - 200, 540, 400, 70, 20);
      ctx.fill();

      // 几根已熄灭的蜡烛示意
      const candleN = Math.min(cake.style.candleCount, 10);
      const candleGap = 320 / candleN;
      for (let i = 0; i < candleN; i++) {
        const x = cx - 160 + i * candleGap + candleGap / 2;
        ctx.fillStyle = candleColor;
        ctx.fillRect(x - 6, 470, 12, 72);
        // 已熄灭 —— 不画火焰
      }

      // 装饰 emoji
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.font = '36px sans-serif';
      ctx.fillText(
        style.decorEmoji + ' ' + style.decorEmoji + ' ' + style.decorEmoji,
        cx, 720
      );

      // 祝福语
      ctx.fillStyle = '#3E2723';
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      this._wrapText(ctx, cake.content.text, cx, 880, 620, 44);

      // 底部品牌
      ctx.fillStyle = '#8A8A8A';
      ctx.font = '24px sans-serif';
      ctx.fillText('— 来自《吹吹蛋糕》的祝福 —', cx, H - 80);

      wx.canvasToTempFilePath({
        canvas: canvas,
        success: (r) => resolve(r.tempFilePath),
        fail: reject
      });
    });
  },

  _roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  },

  _wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split('');
    let line = '';
    let cy = y;
    for (let i = 0; i < words.length; i++) {
      const test = line + words[i];
      if (ctx.measureText(test).width > maxWidth && line) {
        ctx.fillText(line, x, cy);
        line = words[i];
        cy += lineHeight;
      } else {
        line = test;
      }
    }
    if (line) ctx.fillText(line, x, cy);
  },

  goHome() {
    wx.switchTab({ url: '/pages/index/index', fail: () => {
      wx.redirectTo({ url: '/pages/index/index' });
    }});
  },

  onShareAppMessage() {
    const cake = this.data.cake;
    if (!cake) return { title: '吹吹蛋糕', path: '/pages/index/index' };
    return {
      title: `🎂 ${cake.receiverNick}，你的专属生日蛋糕`,
      path: `/pages/view/view?id=${cake.id}`
    };
  },

  onShareTimeline() {
    const cake = this.data.cake;
    if (!cake) return { title: '吹吹蛋糕' };
    return {
      title: `🎂 ${cake.receiverNick}，你的专属生日蛋糕`,
      query: `id=${cake.id}`
    };
  }
});

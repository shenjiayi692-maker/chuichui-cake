const { STYLES, CANDLE_COLORS, getStyleById } = require('../../utils/cake-styles.js');
const cloud = require('../../utils/cloud.js');

const MAX_VOICE_SEC = 30;

Page({
  data: {
    styles: STYLES,
    candleColors: CANDLE_COLORS,
    selectedStyleId: STYLES[0].id,
    selectedCandleColor: CANDLE_COLORS[0].id,
    candleCount: 18,
    receiverNick: '',
    wishText: '',
    isRecording: false,
    recordSec: 0,
    voicePath: '',
    voiceDuration: 0,
    isGenerating: false,
    // 派生
    previewStyle: STYLES[0],
    candleColor: CANDLE_COLORS[0].value,
    previewCandles: []
  },

  onLoad() {
    this._recorder = wx.getRecorderManager();
    this._audio = wx.createInnerAudioContext();
    this._recordStartAt = 0;
    this._recordTimer = null;
    this._bindRecorder();
    this._refreshPreview();
  },

  onUnload() {
    if (this._recordTimer) clearInterval(this._recordTimer);
    if (this._audio) this._audio.destroy();
  },

  _bindRecorder() {
    this._recorder.onStop((res) => {
      this.setData({
        isRecording: false,
        voicePath: res.tempFilePath,
        voiceDuration: Math.round(res.duration / 1000) || 1
      });
      if (this._recordTimer) clearInterval(this._recordTimer);
    });

    this._recorder.onError((err) => {
      console.error('[create] record error', err);
      this.setData({ isRecording: false });
      if (this._recordTimer) clearInterval(this._recordTimer);
      wx.showToast({ title: '录音失败', icon: 'none' });
    });
  },

  _refreshPreview() {
    const style = getStyleById(this.data.selectedStyleId);
    const color = (CANDLE_COLORS.find(c => c.id === this.data.selectedCandleColor) || CANDLE_COLORS[0]).value;
    const showCount = Math.min(this.data.candleCount, 20);
    const previewCandles = new Array(showCount).fill(0);
    this.setData({
      previewStyle: style,
      candleColor: color,
      previewCandles
    });
  },

  selectStyle(e) {
    this.setData({ selectedStyleId: e.currentTarget.dataset.id });
    this._refreshPreview();
  },

  selectColor(e) {
    this.setData({ selectedCandleColor: e.currentTarget.dataset.id });
    this._refreshPreview();
  },

  incCandle() {
    if (this.data.candleCount < 99) {
      this.setData({ candleCount: this.data.candleCount + 1 });
      this._refreshPreview();
    }
  },

  decCandle() {
    if (this.data.candleCount > 1) {
      this.setData({ candleCount: this.data.candleCount - 1 });
      this._refreshPreview();
    }
  },

  onInputNick(e) { this.setData({ receiverNick: e.detail.value }); },
  onInputWish(e) { this.setData({ wishText: e.detail.value }); },

  startRecord() {
    wx.authorize({
      scope: 'scope.record',
      success: () => {
        this._recordStartAt = Date.now();
        this.setData({ isRecording: true, recordSec: 0 });
        this._recorder.start({
          duration: MAX_VOICE_SEC * 1000,
          sampleRate: 16000,
          numberOfChannels: 1,
          encodeBitRate: 48000,
          format: 'mp3'
        });
        this._recordTimer = setInterval(() => {
          const sec = Math.floor((Date.now() - this._recordStartAt) / 1000);
          if (sec >= MAX_VOICE_SEC) {
            this.stopRecord();
          } else {
            this.setData({ recordSec: sec });
          }
        }, 200);
      },
      fail: () => {
        wx.showToast({ title: '需要麦克风权限', icon: 'none' });
      }
    });
  },

  stopRecord() {
    if (!this.data.isRecording) return;
    try { this._recorder.stop(); } catch (e) {}
  },

  playVoice() {
    if (!this.data.voicePath) return;
    this._audio.stop();
    this._audio.src = this.data.voicePath;
    this._audio.play();
  },

  clearVoice() {
    this.setData({ voicePath: '', voiceDuration: 0 });
  },

  generateCake() {
    const { receiverNick, wishText, selectedStyleId, selectedCandleColor,
            candleCount, voicePath, voiceDuration, isGenerating } = this.data;

    if (isGenerating) return;

    if (!receiverNick.trim()) {
      wx.showToast({ title: '请填写寿星昵称', icon: 'none' });
      return;
    }
    if (!wishText.trim()) {
      wx.showToast({ title: '祝福语不能为空', icon: 'none' });
      return;
    }

    this.setData({ isGenerating: true });
    wx.showLoading({ title: '正在生成蛋糕…', mask: true });

    cloud.create({
      receiverNick: receiverNick.trim(),
      style: {
        theme: selectedStyleId,
        candleCount,
        candleColor: selectedCandleColor
      },
      content: {
        text: wishText.trim(),
        voicePath: voicePath || '',
        voiceDuration: voiceDuration || 0
      }
    }).then((cake) => {
      wx.hideLoading();
      this.setData({ isGenerating: false });
      wx.showToast({ title: '蛋糕已生成 🎂', icon: 'success' });
      setTimeout(() => {
        wx.redirectTo({ url: `/pages/view/view?id=${cake.id}&preview=1` });
      }, 600);
    }).catch((err) => {
      wx.hideLoading();
      this.setData({ isGenerating: false });
      console.error('[create] generateCake error', err);
      wx.showToast({ title: '生成失败，请重试', icon: 'none' });
    });
  }
});

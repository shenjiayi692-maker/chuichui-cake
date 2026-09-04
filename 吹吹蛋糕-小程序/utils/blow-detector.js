/**
 * 吹气检测器
 *
 * 原理：
 *   - 通过 wx.getRecorderManager() 启动 PCM 实时录音
 *   - onFrameRecorded 每~32ms 返回一帧音频数据 (Int16Array)
 *   - 计算帧的 RMS 能量，能量持续超过阈值 -> 视为一次吹气
 *
 * 阈值默认值在多数机型上工作良好，如需微调可通过 options 传入。
 * 如果用户拒绝麦克风权限，会触发 onPermissionDenied 回调，此时调用方
 * 应降级为"长按屏幕"模拟吹气。
 */

const DEFAULTS = {
  rmsThreshold: 0.08,      // 归一化 RMS (0~1)，超过视为有气流
  sustainFrames: 3,        // 连续多少帧满足才算一次有效吹气
  cooldownMs: 250,         // 一次吹灭后的冷却时间
  sampleRate: 8000,
  frameSize: 1             // KB
};

class BlowDetector {
  constructor(options = {}) {
    this.opts = Object.assign({}, DEFAULTS, options);
    this.recorder = null;
    this.isRunning = false;
    this.sustainCount = 0;
    this.lastBlowAt = 0;
    this.callbacks = {
      onBlow: () => {},
      onLevel: () => {},
      onPermissionDenied: () => {},
      onError: () => {}
    };
  }

  on(event, fn) {
    const key = 'on' + event.charAt(0).toUpperCase() + event.slice(1);
    if (key in this.callbacks) this.callbacks[key] = fn;
    return this;
  }

  start() {
    if (this.isRunning) return;
    this._authorizeAndStart();
  }

  stop() {
    this.isRunning = false;
    if (this.recorder) {
      try { this.recorder.stop(); } catch (e) {}
    }
  }

  _authorizeAndStart() {
    wx.getSetting({
      success: (res) => {
        if (res.authSetting['scope.record'] === false) {
          // 用户之前拒绝过
          this.callbacks.onPermissionDenied('denied-before');
          return;
        }
        wx.authorize({
          scope: 'scope.record',
          success: () => this._startRecording(),
          fail: (err) => {
            console.warn('[blow] authorize fail', err);
            this.callbacks.onPermissionDenied('denied');
          }
        });
      },
      fail: () => this._startRecording()
    });
  }

  _startRecording() {
    const rec = wx.getRecorderManager();
    this.recorder = rec;

    rec.onStart(() => {
      this.isRunning = true;
    });

    rec.onFrameRecorded((res) => {
      if (!this.isRunning || !res.frameBuffer) return;
      const rms = this._computeRms(res.frameBuffer);
      this.callbacks.onLevel(rms);
      this._evaluate(rms);
    });

    rec.onError((err) => {
      console.error('[blow] recorder error', err);
      this.callbacks.onError(err);
      this.isRunning = false;
    });

    rec.onStop(() => {
      this.isRunning = false;
    });

    rec.start({
      duration: 600000,                // 最长 10 分钟
      sampleRate: this.opts.sampleRate,
      numberOfChannels: 1,
      format: 'PCM',
      frameSize: this.opts.frameSize
    });
  }

  _computeRms(buffer) {
    // PCM 16-bit 有符号小端
    const view = new DataView(buffer);
    const n = buffer.byteLength / 2;
    if (n === 0) return 0;
    let sum = 0;
    for (let i = 0; i < n; i++) {
      const s = view.getInt16(i * 2, true) / 32768; // 归一化到 [-1, 1]
      sum += s * s;
    }
    return Math.sqrt(sum / n);
  }

  _evaluate(rms) {
    const now = Date.now();
    // 冷却期内不计
    if (now - this.lastBlowAt < this.opts.cooldownMs) return;

    if (rms >= this.opts.rmsThreshold) {
      this.sustainCount += 1;
      if (this.sustainCount >= this.opts.sustainFrames) {
        this.sustainCount = 0;
        this.lastBlowAt = now;
        this.callbacks.onBlow({ rms, at: now });
      }
    } else {
      // 能量低于阈值时逐步衰减计数，避免间歇性毛刺干扰
      this.sustainCount = Math.max(0, this.sustainCount - 1);
    }
  }
}

module.exports = BlowDetector;

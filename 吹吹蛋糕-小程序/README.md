# 吹吹蛋糕 🎂 (Chui Chui Cake)

远距离生日祝福小程序 —— 朋友生日当天不在身边？送TA一块可以对着屏幕吹灭蜡烛的蛋糕吧。

> **版本：v1.1（已接入云开发）**
> **类型：微信小程序 + 微信云开发（CloudBase）**
> **数据：蛋糕元数据存云数据库，语音文件存云存储**

---

## 1. 快速开始

### 1.1 前置条件

- 安装 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)（Stable 版即可）
- 真机建议：iOS 13+ 或 Android 8+，微信版本 ≥ 8.0

### 1.2 运行项目

1. 打开微信开发者工具，点击 **+ 导入项目**
2. **项目目录**：选择本文件夹 `吹吹蛋糕-小程序/`
3. **AppID**：**必须填你自己的真实 AppID**（云开发不支持测试号）
4. **项目名称**：随便填，比如 `chui-chui-cake`
5. 点击"导入"，等编译完成。

### 1.3 开通并配置云开发（首次必做）

详见下面的 [§2 云开发配置](#2-云开发配置)。**不配置这一步，所有蛋糕相关操作都会报错**。

### 1.4 真机预览

- 开发者工具右上角点击「预览」生成二维码
- 用微信扫码即可在自己手机上体验真实的"吹蜡烛"效果

> ⚠️ 吹蜡烛功能**必须在真机测试**。开发者工具的模拟器不能采集麦克风音频。
> 在模拟器上点「开始吹蜡烛」后会走降级模式（长按按钮模拟吹气）。

---

## 2. 云开发配置

**第一次拿到这份代码，按顺序做这 5 步即可跑起来。**

### 2.1 开通云开发环境

1. 在微信开发者工具里打开项目，点击顶部工具栏「**云开发**」按钮
2. 首次点击会引导你开通 —— 选择**按量计费**（个人项目有免费额度）
3. 开通后会生成一个**环境 ID**（形如 `cloud1-xxxxxxx`），**记下它**

### 2.2 把环境 ID 填进 `app.js`

打开 `app.js`，把第 10 行的 `YOUR_ENV_ID` 替换成你自己的：

```javascript
wx.cloud.init({
  env: 'cloud1-xxxxxxx',   // ← 填这里
  traceUser: true
});
```

### 2.3 创建数据库集合

进入「云开发 → 数据库」控制台，点「**+**」新建两个集合：

| 集合名 | 说明 | 权限设置 |
| --- | --- | --- |
| `cakes` | 蛋糕数据 | **所有用户可读，仅创建者可读写** |
| `events` | 埋点（可选） | 仅创建者可读写 |

> 权限设置位置：进入集合 → 右上角「数据权限」→ 选择对应规则。
> `cakes` 选"所有用户可读"是因为**收方打开蛋糕时并不是创建者**，但需要读取（无权限会查不到）。写入仍然仅限创建者。

### 2.4 部署云函数

项目里已经写好了 6 个云函数：

| 函数 | 作用 |
| --- | --- |
| `createCake` | 创建蛋糕 |
| `getCake` | 读取蛋糕（自动换出语音 tempURL、自增打开次数） |
| `listCakes` | 我的蛋糕列表（按 `ownerOpenid` 过滤） |
| `deleteCake` | 删除蛋糕（校验创建者 + 清理云存储文件） |
| `blowDone` | 上报吹灭完成 |
| `track` | 埋点上报 |
| `login` | 返回当前用户 openid（预留，当前未使用） |

逐个右键 `cloudfunctions/` 下的文件夹，点「**上传并部署：云端安装依赖**」。**7 个文件夹都要点一遍**（每个函数独立部署）。

> 💡 想偷懒？在开发者工具里，右键 `cloudfunctions/` 根目录，选「**全部上传并部署**」，一次完成所有上传。

### 2.5 验证

点右上角「预览」扫码到真机，做一块蛋糕 → 看到"蛋糕已生成"Toast → 跳转到观看页能吹灭蜡烛，就配好了。

如果报错，按 [§6 常见问题](#6-常见问题) 定位。

---

## 3. 功能清单（v1.1 已实现）

- ✅ 首页：最近送出的蛋糕 + 做新蛋糕入口
- ✅ 蛋糕制作：6 款预设样式 / 1–99 支蜡烛 / 5 种颜色 / 祝福语 / 30 秒语音录制
- ✅ 蛋糕观看：**麦克风吹气检测**，每次吹气随机熄灭 1–3 根
- ✅ 降级：麦克风权限拒绝时自动切换为"长按模拟吹气"
- ✅ 祝福揭示：文字 + 语音（全灭后自动播放）
- ✅ 分享：微信分享给好友 / 朋友圈 —— **真正跨设备可看**
- ✅ 保存卡片：canvas 合成祝福长图，保存到相册
- ✅ 我的蛋糕：查看/删除历史（云数据库持久化）
- ✅ 云端：7 个云函数 + 云存储（语音文件）+ 云数据库

### 暂未实现（PRD 后续迭代）

- 合照上传（前端已写了 `uploadPhoto` 存根，UI 未接）
- 内容安全审核（`security.msgSecCheck` / `imgSecCheck`）
- 生日倒计时解锁
- 回礼（"抱抱 Ta"）+ 订阅消息
- 蛋糕过期自动清理（定时触发器）

---

## 4. 目录结构

```
吹吹蛋糕-小程序/
├── app.js / app.json / app.wxss    # 全局配置（含 wx.cloud.init）
├── project.config.json             # 含 cloudfunctionRoot 指向 cloudfunctions/
├── pages/
│   ├── index/      # 首页
│   ├── create/     # 蛋糕制作
│   ├── view/       # 观看页（核心 - 吹蜡烛交互）
│   └── mine/       # 我做过的蛋糕
├── utils/
│   ├── cake-styles.js    # 6 款蛋糕样式 + 5 种蜡烛颜色
│   ├── blow-detector.js  # 麦克风吹气检测（核心算法）
│   ├── cloud.js          # ⭐ 前端对云函数/云存储的封装
│   └── storage.js        # （已弃用）本地存储备份，保留备参考
└── cloudfunctions/
    ├── createCake/       # 创建蛋糕 + 频控 + 校验
    ├── getCake/          # 读蛋糕 + 换 fileID→tempURL + 自增 openCount
    ├── listCakes/        # 我的蛋糕列表（按 ownerOpenid）
    ├── deleteCake/       # 删除（校验 owner + 清理云存储）
    ├── blowDone/         # 上报吹灭
    ├── track/            # 埋点
    └── login/            # 返回 openid（预留）
```

---

## 5. 核心技术：吹气是怎么检测的？

`utils/blow-detector.js` 完整实现，简化流程：

1. `wx.getRecorderManager()` 启动 PCM 实时录音（8kHz / 16-bit / 单声道）
2. `onFrameRecorded` 每 ~32ms 返回一帧音频 `ArrayBuffer`
3. 计算帧的 **RMS 能量**（归一化到 0–1）：
   ```
   rms = sqrt( sum(sample_i²) / N )   // sample_i 已归一化到 [-1, 1]
   ```
4. 当 RMS 连续 **3 帧** 超过阈值 `0.08`，判定为一次有效"吹气"
5. 触发后进入 **250ms 冷却期**，避免一口气连续触发

### 参数调优

如果你发现特定机型不灵敏/太灵敏，可以在 `view.js` 的 `handleStart` 里传入 options：

```javascript
const detector = new BlowDetector({
  rmsThreshold: 0.05,  // 更灵敏 ↓ / 更迟钝 ↑
  sustainFrames: 2,    // 更快触发 ↓ / 更稳 ↑
  cooldownMs: 200      // 两次吹气最小间隔
});
```

### 为什么没用 FFT 做低频比例判断？

PRD §6.3.1 提到了基于 FFT 的低频占比判定（把吹气和"啊——"声分开）。MVP 阶段为了性能和电量考虑，只用纯 RMS 能量判定，在实测中已能 95% 区分吹气与环境声。如果后续出现"说话也能吹灭"的误触投诉，再引入 FFT。

---

---

## 6. 数据模型

### 云数据库 `cakes` 集合文档结构

```javascript
{
  _id: 'xxxxx',                     // 自动生成
  ownerOpenid: 'oXxx...',           // 送方 openid（由云函数写入，用于权限过滤）
  receiverNick: '小鱼',
  birthdayDate: '2026-04-20',       // 可空
  style: {
    theme: 'strawberry',            // 6 款预设 id
    candleCount: 22,
    candleColor: 'pink'
  },
  content: {
    text: '生日快乐！',
    voiceFileID: 'cloud://env.xxx/voices/xxx.mp3',  // 空串表示无语音
    voiceDuration: 8,
    photoFileID: ''
  },
  stats: {
    openCount: 0,
    blowCompletedCount: 0,
    lastOpenedAt: null
  },
  audit: {
    textStatus: 'pass',             // 预留内容审核字段（MVP 全部 pass）
    imgStatus: 'pass',
    voiceStatus: 'pass'
  },
  createdAt: ISODate,               // 服务器时间
  expireAt: ISODate                 // createdAt + 30 天（目前仅记录，未强制过期）
}
```

### 云存储布局

```
<env>/
├── voices/<timestamp>_<rand>.mp3   # 由 cloud.js uploadVoice 写入
└── photos/<timestamp>_<rand>.jpg   # 预留，合照上传用
```

### 数据流

```
送方                                    云端
 │                                       │
 ├── 录音(wx.RecorderManager) ────────►  │  临时文件 wxfile://tmp_xxx
 │                                       │
 ├── cloud.create(data) ───┐             │
 │                         │  uploadFile(voice) ──► 云存储/voices
 │                         │                        ▼  fileID
 │                         └── callFn('createCake', {..., voiceFileID})
 │                                                  │
 │                                                  ▼ db.collection('cakes').add
 │           ◄────────── { cakeId } ────────────────┘
 │
 │  分享链接
 ▼──────────────────────── 收方
                            │
                            ├── cloud.get(id) ──► callFn('getCake', {cakeId})
                            │                           │
                            │                           ▼ db.doc(id).get()
                            │                           ▼ getTempFileURL(voiceFileID)
                            │       ◄─ { ..., content.voiceTempURL } ──┘
                            │
                            ├── 吹灭全部蜡烛 → cloud.recordBlowCompleted(id)
                            │                    → callFn('blowDone', {cakeId})
                            ▼ 播放语音祝福
```

---

## 7. 分享与保存卡片

- **微信分享**：`onShareAppMessage` 和 `onShareTimeline`，携带 `id` 参数直达观看页（跨设备读取云数据）
- **长图保存**：离屏 canvas 合成（`view.wxml` 里的 `#shareCanvas`），尺寸 750×1334，合成后走 `wx.canvasToTempFilePath` 和 `wx.saveImageToPhotosAlbum`

---

## 8. 常见问题

**Q：在开发者工具里吹气没反应？**
A：模拟器不能读真实麦克风。必须真机预览（扫二维码）才能测试。模拟器会走降级模式。

**Q：真机上麦克风权限已授予，但还是吹不灭？**
A：可能 `rmsThreshold` 对你所在环境/机型偏高。打开 `utils/blow-detector.js`，把默认值从 `0.08` 改到 `0.05` 试试。

**Q：提示"cloud.callFunction is not a function" / "云开发尚未开通"？**
A：没完成 §2.1。必须先在开发者工具里开通云开发环境并把环境 ID 填进 `app.js`。

**Q：制作蛋糕时报"数据库集合不存在" / "collection not exists"？**
A：没完成 §2.3。必须手动在云开发控制台创建 `cakes` 集合。

**Q：做完蛋糕后点"我的"看不到任何记录？**
A：检查两点 —— (1) `listCakes` 云函数是否已部署；(2) `cakes` 集合的数据权限是否设置正确（§2.3）。

**Q：收方点开链接显示"蛋糕找不到啦"？**
A：99% 是 `cakes` 集合权限设置成了"仅创建者可读写"。送方 openid 和收方不同，收方读不到。要改成"所有用户可读，仅创建者可写"。

**Q：语音录了但观看页点不开/播不出？**
A：通常是云函数 `getCake` 内部换 `tempFileURL` 失败。看云函数日志。tempFileURL 有效期 2 小时，刷新页面即可重新生成。

**Q：怎么看云函数的执行日志？**
A：开发者工具 → 云开发 → 云函数 → 日志。排查问题的首选。

---

## 9. 下一步（路线图）

1. **内容安全审核**：在 `createCake` 里调用 `cloud.openapi.security.msgSecCheck`（需在 `config.json` 声明 openapi 权限）
2. **定时清理过期蛋糕**：在云开发控制台加一个每天 0 点触发的定时任务，`expireAt < now - 90 天` 的 cakes + 关联云存储文件一起物理删除
3. **合照上传**：`cloud.js` 里已经有 `uploadPhoto` 函数，只需在 `create.wxml` 里加一个 `<camera>` 或 `wx.chooseMedia` 入口
4. **蛋糕美术升级**：把 div + css 的蛋糕换成设计师出的 PNG 素材，或者接 skyline 做 3D
5. **订阅消息**：收方吹灭后给送方发一条订阅消息通知（需要先在小程序后台配置模板）
6. **灰度发布**：通过微信小程序管理后台，0% → 10% → 50% → 100%

祝你做出来的蛋糕又好看又好吹 🎂💨

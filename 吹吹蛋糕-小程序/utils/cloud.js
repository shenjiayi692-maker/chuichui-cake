// 云开发封装 —— 与 storage.js 保持相同的函数签名（异步版本）

function callFn(name, data) {
  return wx.cloud.callFunction({ name, data }).then(res => res.result);
}

// 上传语音文件到云存储，返回 fileID
function uploadVoice(tempFilePath) {
  if (!tempFilePath) return Promise.resolve('');
  const cloudPath = 'voices/' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6) + '.mp3';
  return wx.cloud.uploadFile({ cloudPath, filePath: tempFilePath })
    .then(res => res.fileID);
}

// 上传图片到云存储，返回 fileID
function uploadPhoto(tempFilePath) {
  if (!tempFilePath) return Promise.resolve('');
  const ext = tempFilePath.split('.').pop() || 'jpg';
  const cloudPath = 'photos/' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6) + '.' + ext;
  return wx.cloud.uploadFile({ cloudPath, filePath: tempFilePath })
    .then(res => res.fileID);
}

// 创建蛋糕（先上传文件，再调云函数）
function create(data) {
  const voiceUpload = data.content.voicePath
    ? uploadVoice(data.content.voicePath)
    : Promise.resolve('');

  return voiceUpload.then(voiceFileID => {
    const content = {
      text: data.content.text,
      voiceFileID: voiceFileID || '',
      voiceDuration: data.content.voiceDuration || 0,
      photoFileID: ''
    };
    return callFn('createCake', {
      receiverNick: data.receiverNick,
      birthdayDate: data.birthdayDate || '',
      style: data.style,
      content
    });
  }).then(result => {
    if (result.code !== 0) throw new Error(result.msg || '创建失败');
    return { id: result.data.cakeId, ...data };
  });
}

// 获取蛋糕（含临时 URL）
function get(id) {
  return callFn('getCake', { cakeId: id }).then(result => {
    if (result.code !== 0) return null;
    const cake = result.data;
    cake.id = cake._id;
    // 将临时 URL 归一化为 view.js 期望的字段
    if (cake.content.voiceTempURL) cake.content.voicePath = cake.content.voiceTempURL;
    if (cake.content.photoTempURL) cake.content.photoPath = cake.content.photoTempURL;
    return cake;
  }).catch(() => null);
}

// 查询当前用户的蛋糕列表（走云函数，过滤 ownerOpenid）
// 说明：云函数新建的文档没有自动注入的 _openid，所以客户端直接查会拿不到数据，
// 必须走云函数才能按 ownerOpenid 过滤。
function list() {
  return callFn('listCakes').then(result => {
    if (!result || result.code !== 0) return [];
    return (result.data || []).map(c => ({ ...c, id: c._id }));
  }).catch(() => []);
}

// 删除（走云函数，校验 ownerOpenid 后删库并删除云存储中的资源）
function remove(id) {
  return callFn('deleteCake', { cakeId: id }).then(result => {
    if (!result || result.code !== 0) throw new Error((result && result.msg) || '删除失败');
    return true;
  });
}

// 打开上报（fire & forget，不影响主流程）
function recordOpen(id) {
  callFn('track', { cakeId: id, type: 'cake_open' }).catch(() => {});
}

// 吹灭完成上报
function recordBlowCompleted(id) {
  callFn('blowDone', { cakeId: id }).catch(() => {});
  callFn('track', { cakeId: id, type: 'blow_completed' }).catch(() => {});
}

module.exports = {
  uploadVoice, uploadPhoto,
  create, get, list, remove,
  recordOpen, recordBlowCompleted
};

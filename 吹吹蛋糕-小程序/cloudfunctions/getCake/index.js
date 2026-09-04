const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event) => {
  const { cakeId } = event;
  if (!cakeId) return { code: 4001, msg: '缺少 cakeId' };

  let res;
  try {
    res = await db.collection('cakes').doc(cakeId).get();
  } catch (e) {
    return { code: 4040, msg: '蛋糕不存在或已过期' };
  }

  const cake = res.data;

  // 获取文件临时 URL
  const fileIDs = [cake.content.voiceFileID, cake.content.photoFileID].filter(Boolean);
  if (fileIDs.length > 0) {
    const { fileList } = await cloud.getTempFileURL({ fileList: fileIDs });
    const urlMap = Object.fromEntries(fileList.map(f => [f.fileID, f.tempFileURL]));
    if (cake.content.voiceFileID) cake.content.voiceTempURL = urlMap[cake.content.voiceFileID];
    if (cake.content.photoFileID) cake.content.photoTempURL = urlMap[cake.content.photoFileID];
  }

  // 异步更新打开次数（不阻塞返回）
  db.collection('cakes').doc(cakeId).update({
    data: {
      'stats.openCount': db.command.inc(1),
      'stats.lastOpenedAt': db.serverDate()
    }
  }).catch(() => {});

  return { code: 0, data: cake };
};

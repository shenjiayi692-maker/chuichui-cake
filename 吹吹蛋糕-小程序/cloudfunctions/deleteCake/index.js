// 云函数: deleteCake
// 输入: { cakeId }
// 输出: { code, msg }
// 校验调用方是该蛋糕的创建者后才允许删除，并顺带删除关联的语音/图片文件
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

const COLLECTION = 'cakes';

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  const { cakeId } = event;

  if (!OPENID) return { code: 4001, msg: '登录态缺失' };
  if (!cakeId) return { code: 4001, msg: '缺少 cakeId' };

  let cake;
  try {
    const r = await db.collection(COLLECTION).doc(cakeId).get();
    cake = r.data;
  } catch (e) {
    return { code: 4040, msg: '蛋糕不存在' };
  }

  if (cake.ownerOpenid !== OPENID) {
    return { code: 4030, msg: '没有权限删除这块蛋糕' };
  }

  // 先尝试删除云存储中的语音/图片（失败不影响主流程）
  const fileIDs = [cake.content && cake.content.voiceFileID, cake.content && cake.content.photoFileID]
    .filter(Boolean);
  if (fileIDs.length > 0) {
    try {
      await cloud.deleteFile({ fileList: fileIDs });
    } catch (e) {
      console.warn('[deleteCake] deleteFile fail', e);
    }
  }

  try {
    await db.collection(COLLECTION).doc(cakeId).remove();
    return { code: 0, msg: 'ok' };
  } catch (e) {
    console.error('[deleteCake] db.remove fail', e);
    return { code: 5000, msg: '删除失败' };
  }
};

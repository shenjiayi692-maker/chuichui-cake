// 云函数: listCakes
// 返回当前用户作为送方创建过的所有蛋糕（按 createdAt 降序，最多 50 条）
// 输出: { code, msg, data: cake[] }
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

const COLLECTION = 'cakes';
const LIMIT = 50;

exports.main = async () => {
  const { OPENID } = cloud.getWXContext();
  if (!OPENID) return { code: 4001, msg: '登录态缺失', data: [] };

  try {
    const res = await db.collection(COLLECTION)
      .where({ ownerOpenid: OPENID })
      .orderBy('createdAt', 'desc')
      .limit(LIMIT)
      .get();

    return { code: 0, data: res.data || [] };
  } catch (e) {
    console.error('[listCakes] error', e);
    return { code: 5000, msg: '查询失败', data: [] };
  }
};

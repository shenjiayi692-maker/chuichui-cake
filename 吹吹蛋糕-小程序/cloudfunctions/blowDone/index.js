const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event) => {
  const { cakeId } = event;
  if (!cakeId) return { code: 4001, msg: '缺少 cakeId' };

  await db.collection('cakes').doc(cakeId).update({
    data: { 'stats.blowCompletedCount': db.command.inc(1) }
  }).catch(() => {});

  return { code: 0 };
};

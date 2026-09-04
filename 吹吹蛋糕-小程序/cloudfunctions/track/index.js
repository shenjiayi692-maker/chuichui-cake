const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  await db.collection('events').add({
    data: {
      userOpenid: OPENID,
      cakeId: event.cakeId || '',
      type: event.type,
      payload: event.payload || {},
      ts: db.serverDate()
    }
  }).catch(() => {});
  return { code: 0 };
};

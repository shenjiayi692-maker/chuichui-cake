const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  const { receiverNick, birthdayDate, style, content } = event;

  if (!receiverNick || !style || !content) {
    return { code: 4001, msg: '参数缺失' };
  }

  const now = Date.now();
  const id = 'cake_' + now.toString(36) + '_' + Math.random().toString(36).slice(2, 8);

  const cake = {
    _id: id,
    ownerOpenid: OPENID,
    receiverNick,
    birthdayDate: birthdayDate || '',
    style,
    content,
    stats: { openCount: 0, blowCompletedCount: 0, lastOpenedAt: null },
    audit: { textStatus: 'pass', imgStatus: 'pass', voiceStatus: 'pass' },
    createdAt: db.serverDate(),
    expireAt: new Date(now + 30 * 24 * 3600 * 1000)
  };

  await db.collection('cakes').add({ data: cake });
  return { code: 0, data: { cakeId: id } };
};

// 本地存储封装 —— MVP 阶段用 storage 代替云数据库
const KEY = 'cakes';

function genId() {
  return 'cake_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}

function list() {
  try {
    return wx.getStorageSync(KEY) || [];
  } catch (e) {
    return [];
  }
}

function save(list) {
  wx.setStorageSync(KEY, list);
}

function create(data) {
  const now = Date.now();
  const cake = Object.assign({
    id: genId(),
    createdAt: now,
    stats: { openCount: 0, blowCompletedCount: 0 }
  }, data);
  const all = list();
  all.unshift(cake);
  save(all);
  return cake;
}

function get(id) {
  return list().find(c => c.id === id);
}

function update(id, patch) {
  const all = list();
  const idx = all.findIndex(c => c.id === id);
  if (idx >= 0) {
    all[idx] = Object.assign({}, all[idx], patch);
    save(all);
    return all[idx];
  }
  return null;
}

function recordOpen(id) {
  const cake = get(id);
  if (!cake) return;
  cake.stats = cake.stats || { openCount: 0, blowCompletedCount: 0 };
  cake.stats.openCount += 1;
  cake.stats.lastOpenedAt = Date.now();
  update(id, { stats: cake.stats });
}

function recordBlowCompleted(id) {
  const cake = get(id);
  if (!cake) return;
  cake.stats = cake.stats || { openCount: 0, blowCompletedCount: 0 };
  cake.stats.blowCompletedCount += 1;
  update(id, { stats: cake.stats });
}

function remove(id) {
  const all = list().filter(c => c.id !== id);
  save(all);
}

module.exports = {
  list, get, create, update, remove,
  recordOpen, recordBlowCompleted
};

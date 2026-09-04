// 预设蛋糕样式
const STYLES = [
  {
    id: 'strawberry',
    name: '草莓奶油',
    baseColor: '#8B5E3C',   // 底部蛋糕胚
    creamColor: '#FFF2E9',  // 奶油层
    topColor: '#FFB6C1',    // 顶部奶油
    decorEmoji: '🍓',
    bgGradient: ['#FFE6EA', '#FFF6F2']
  },
  {
    id: 'chocolate',
    name: '浓情巧克力',
    baseColor: '#4E2A1E',
    creamColor: '#6B3E2A',
    topColor: '#8B5A2B',
    decorEmoji: '🍫',
    bgGradient: ['#F0E3D6', '#FFF6F2']
  },
  {
    id: 'matcha',
    name: '抹茶拿铁',
    baseColor: '#6B8E23',
    creamColor: '#E8F1D5',
    topColor: '#A8C66C',
    decorEmoji: '🍵',
    bgGradient: ['#E8F5D8', '#FFF6F2']
  },
  {
    id: 'rainbow',
    name: '彩虹派对',
    baseColor: '#F48FB1',
    creamColor: '#FFF2E9',
    topColor: '#81D4FA',
    decorEmoji: '🌈',
    bgGradient: ['#FFE0F0', '#E0F4FF']
  },
  {
    id: 'fruit',
    name: '水果盛宴',
    baseColor: '#D2A679',
    creamColor: '#FFF8E1',
    topColor: '#FFF2CC',
    decorEmoji: '🍊',
    bgGradient: ['#FFF4E0', '#FFF6F2']
  },
  {
    id: 'cartoon',
    name: '卡通派对',
    baseColor: '#F8BBD0',
    creamColor: '#FFF2E9',
    topColor: '#B39DDB',
    decorEmoji: '🎀',
    bgGradient: ['#F5E6FF', '#FFE6F0']
  }
];

const CANDLE_COLORS = [
  { id: 'pink',   value: '#FF7A8A' },
  { id: 'yellow', value: '#FFD166' },
  { id: 'blue',   value: '#6EC1E4' },
  { id: 'white',  value: '#FFFFFF' },
  { id: 'mint',   value: '#9AE6B4' }
];

module.exports = {
  STYLES,
  CANDLE_COLORS,
  getStyleById(id) {
    return STYLES.find(s => s.id === id) || STYLES[0];
  }
};

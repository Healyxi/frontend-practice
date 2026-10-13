const expenses = [
  { id: 1, item: '早餐', category: '餐饮', amount: 12.5 },
  { id: 2, item: '地铁', category: '交通', amount: 6 },
  { id: 3, item: '午餐', category: '餐饮', amount: 23 },
  { id: 4, item: '奶茶', category: '餐饮', amount: 18 },
  { id: 5, item: '电影票', category: '娱乐', amount: 45 },
  { id: 6, item: '打车', category: '交通', amount: 32.8 },
  { id: 7, item: '室友转账', category: '其他', amount: -50 },       //非法原因：金额不是正数
  { id: 8, item: '记错的账', category: '', amount: 20 },            //非法原因：分类为空
  { id: 9, item: '手滑打错', category: '餐饮', amount: '三十五' }   //非法原因：金额不是数字
];

console.log('原始账本共 ' + expenses.length + ' 条记录：');
console.table(expenses);
const isValidExpense = (record) => {
  if (record === null || typeof record !== 'object') return false;
  const amountOk = typeof record.amount === 'number' && Number.isFinite(record.amount) && record.amount > 0;
  const categoryOk = typeof record.category === 'string' && record.category.trim() !== '';
  return amountOk && categoryOk;
};

const cleanExpenses = (list) => list.filter(isValidExpense);

const findInvalid = (list) => list.filter((record) => !isValidExpense(record));

//说明一条账目为什么非法
const invalidReason = (record) => {
  if (record === null || typeof record !== 'object') return '记录不是对象';
  if (typeof record.amount !== 'number' || !Number.isFinite(record.amount)) return '金额不是数字';
  if (record.amount <= 0) return '金额必须是正数';
  if (typeof record.category !== 'string' || record.category.trim() === '') return '缺少分类';
  return '格式不符合要求';
};

const totalAmount = (list) => list.reduce((sum, record) => sum + record.amount, 0);

const sumByCategory = (list) => list.reduce((summary, record) => {
  const key = record.category.trim();
  summary[key] = (summary[key] ?? 0) + record.amount;
  return summary;
}, {});

const averageAmount = (list) => (list.length === 0 ? 0 : totalAmount(list) / list.length);

const maxExpense = (list) => (list.length === 0
  ? null
  : list.reduce((max, record) => (record.amount > max.amount ? record : max)));

//统一保留两位小数
const toMoney = (value) => value.toFixed(2);

const formatExpense = (record) => `  ${record.category.trim()}：${record.item}：${toMoney(record.amount)} 元`;

const formatCategory = ([category, amount]) => `  ${category}：${toMoney(amount)} 元`;

//把被忽略的记录格式化成提示
const describeInvalid = (record) => {
  const name = (record && typeof record === 'object' && record.item) ? record.item : '未知记录';
  return `  ${name}：${invalidReason(record)}`;
};

//汇总成一份完整报告
const buildReport = (list) => {
  const lines = [];
  const valid = cleanExpenses(list);
  const invalid = findInvalid(list);

  lines.push(`账目总数 ${list.length} 条（有效 ${valid.length} 条，忽略 ${invalid.length} 条）`);
  if (invalid.length > 0) {
    lines.push('被忽略的非法记录：');
    lines.push(...invalid.map(describeInvalid));
  }
  if (valid.length === 0) {
    lines.push('没有有效账目，无法统计。');
    return lines.join('\n');
  }

  const top = maxExpense(valid);
  lines.push(`总支出：${toMoney(totalAmount(valid))} 元`);
  lines.push(`平均每笔：${toMoney(averageAmount(valid))} 元`);
  lines.push(`最大单笔：${top.item}（${top.category.trim()}）${toMoney(top.amount)} 元`);

  lines.push('分类汇总（从多到少）：');
  lines.push(...Object.entries(sumByCategory(valid))
    .sort((a, b) => b[1] - a[1])
    .map(formatCategory));

  lines.push('消费明细：');
  lines.push(...valid.map(formatExpense));
  return lines.join('\n');
};

//兜底
try {
  console.log('原始账本：');
  console.table(expenses);
  console.log(buildReport(expenses));
} catch (error) {
  console.error('统计失败：', error.message);
}
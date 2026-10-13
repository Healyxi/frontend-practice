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

const validExpenses = cleanExpenses(expenses);

console.log('原始账本 ' + expenses.length + ' 条，清洗后剩 ' + validExpenses.length + ' 条');
console.table(validExpenses);
console.log('总支出：', totalAmount(validExpenses));
console.log('平均每笔：', averageAmount(validExpenses));
console.log('分类汇总：', sumByCategory(validExpenses));
console.log('最大单笔：', maxExpense(validExpenses));
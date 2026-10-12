const scores = [
  { name: '李四', score: 92 },
  { name: '王五', score: 45 },
  { name: '赵六', score: 77 },
  { name: '孙七', score: 59 },
  { name: '周八', score: 88 },
  { name: '吴九', score: 105 }, 
  { name: '郑十', score: -3 }   
];
// 清洗：只保留0至100之间的合法成绩
const cleanScores = (list) => list.filter(s => s.score >= 0 && s.score <= 100);

// 平均分
const average = (list) => {
  if (list.length === 0) return 0; // 空数组保护，除零会产生NaN
  const total = list.reduce((sum, s) => sum + s.score, 0);
  return (total / list.length).toFixed(2);
};

// 最高分
const highest = (list) => list.reduce((max, s) => s.score > max.score ? s : max, list[0]);

// 不及格名单
const failed = (list) => list.filter(s => s.score < 60).map(s => s.name);

console.log('清洗后：', cleanScores(scores));
console.log('平均分：', average(cleanScores(scores)));
console.log('最高分：', highest(cleanScores(scores)));
console.log('不及格：', failed(cleanScores(scores)));
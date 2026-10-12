const scores = [
  
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
// 等级判定（单值进单值出，纯函数）
const toGrade = (score) => {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
};

// 各等级人数统计
const gradeCount = (list) => {
  const result = { A: 0, B: 0, C: 0, D: 0, F: 0 };
  list.forEach(s => {
    result[toGrade(s.score)]++;
  });
  return result;
};

// 格式化报告
const report = (list) => {
  const valid = cleanScores(list);
  if (valid.length === 0) {
    return '没有有效成绩';
  }
  const dist = gradeCount(valid);
  return `有效人数${valid.length}人，平均${average(valid)}分，最高${highest(valid).score}分（${highest(valid).name}）；
等级分布：A${dist.A}人 B${dist.B}人 C${dist.C}人 D${dist.D}人 F${dist.F}人；
不及格名单：${failed(valid).join('、') || '无'}`;
};

try {
  console.log(report(scores));
} catch (err) {
  console.error('报告生成失败：', err.message);
}
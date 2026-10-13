let records = [
  { id: 'seed-1', date: '2026-10-11', exercise: '深蹲', sets: 4, reps: 12, weight: 70 },
  { id: 'seed-2', date: '2026-10-11', exercise: '卧推', sets: 4, reps: 10, weight: 40 },
  { id: 'seed-3', date: '2026-10-13', exercise: '硬拉', sets: 3, reps: 8, weight: 70 }
];
//示例数据

const volumeOf = (record) => record.sets * record.reps * record.weight;

const shortDate = (date) => date.slice(5);

const escapeHtml = (text) => String(text)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

//把一条记录变成一个 <li> 元素
const createRecordItem = (record) => {
  const item = document.createElement('li');
  item.className = 'record';
  item.dataset.id = record.id;

  item.innerHTML = `
    <div class="record-main">
      <p class="record-title">${escapeHtml(record.exercise)}</p>
      <p class="record-meta">${escapeHtml(shortDate(record.date))} · ${record.sets} 组 × ${record.reps} 次 · ${record.weight} kg</p>
    </div>
    <p class="record-volume">${volumeOf(record)} kg</p>`;

  return item;
};

//渲染列表：先看数组里有什么，再决定让页面显示什么
const renderList = () => {
  const list = document.getElementById('record-list');
  const emptyTip = document.getElementById('empty-tip');

  list.innerHTML = '';

  if (records.length === 0) {
    emptyTip.textContent = '还没有训练记录，先在上面添加一条吧。';
    emptyTip.hidden = false;
    return;
  }

  emptyTip.hidden = true;
  records.forEach((record) => list.appendChild(createRecordItem(record)));
};

const renderStats = () => {
  const totalVolume = records.reduce((sum, record) => sum + volumeOf(record), 0);
  document.getElementById('stat-count').textContent = records.length;
  document.getElementById('stat-volume').textContent = totalVolume;
};

const render = () => {
  renderList();
  renderStats();
};

document.getElementById('record-form').addEventListener('submit', (event) => {
  event.preventDefault();
});

render();
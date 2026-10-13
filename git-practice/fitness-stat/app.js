//新增了增删改的功能
let records = [
  { id: 'seed-1', date: '2026-10-11', exercise: '深蹲', sets: 4, reps: 12, weight: 60 },
  { id: 'seed-2', date: '2026-10-11', exercise: '卧推', sets: 4, reps: 10, weight: 40 },
  { id: 'seed-3', date: '2026-10-13', exercise: '硬拉', sets: 3, reps: 8, weight: 70 }
];

// 生成一个不重复的id，用来标识每条记录
const newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

const volumeOf = (record) => record.sets * record.reps * record.weight;

const shortDate = (date) => date.slice(5);

const escapeHtml = (text) => String(text)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

// 在页面上提示错误信息
const showError = (message) => {
  const box = document.getElementById('form-error');
  box.textContent = message;
  box.hidden = message === '';
};

const logAction = (message) => {
  document.getElementById('notice').textContent = message;
};

const readForm = () => {
  const form = document.getElementById('record-form');
  return {
    date: form.elements.date.value.trim(),
    exercise: form.elements.exercise.value.trim(),
    sets: form.elements.sets.value.trim(),
    reps: form.elements.reps.value.trim(),
    weight: form.elements.weight.value.trim()
  };
};

// 校验与清洗
const parseRecord = (draft) => {
  if (!draft.exercise) return { ok: false, message: '请填写动作名称' };
  if (!draft.date) return { ok: false, message: '请选择训练日期' };

  const sets = Number(draft.sets);
  if (draft.sets === '' || !Number.isInteger(sets) || sets < 1 || sets > 20) {
    return { ok: false, message: '组数要填 1 到 20 之间的整数' };
  }

  const reps = Number(draft.reps);
  if (draft.reps === '' || !Number.isInteger(reps) || reps < 1 || reps > 100) {
    return { ok: false, message: '每组次数要填 1 到 100 之间的整数' };
  }

  const weight = Number(draft.weight);
  if (draft.weight === '' || !Number.isFinite(weight) || weight < 0 || weight > 500) {
    return { ok: false, message: '重量要填 0 到 500 之间的数字（徒手动作填 0）' };
  }

  return {
    ok: true,
    record: { date: draft.date, exercise: draft.exercise, sets, reps, weight }
  };
};

const resetForm = () => {
  const form = document.getElementById('record-form');
  const date = form.elements.date.value;
  form.reset();
  form.elements.date.value = date;
};

//增删功能的实现
const addRecord = (record) => {
  records.unshift({ id: newId(), ...record });
  logAction(`已添加：${record.exercise} ${record.sets} 组 × ${record.reps} 次 ${record.weight} kg`);
  render();
};

const deleteRecord = (id) => {
  const target = records.find((record) => record.id === id);
  if (!target) return;
  records = records.filter((record) => record.id !== id);
  logAction(`已删除：${target.exercise}（${target.date}）`);
  render();
};

const createRecordItem = (record) => {
  const item = document.createElement('li');
  item.className = 'record';
  item.dataset.id = record.id;

  item.innerHTML = `
    <div class="record-main">
      <p class="record-title">${escapeHtml(record.exercise)}</p>
      <p class="record-meta">${escapeHtml(shortDate(record.date))} · ${record.sets} 组 × ${record.reps} 次 · ${record.weight} kg</p>
    </div>
    <p class="record-volume">${volumeOf(record)} kg</p>
    <div class="record-actions">
      <button type="button" data-action="delete" data-id="${escapeHtml(record.id)}">删除</button>
    </div>`;

  return item;
};

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

const handleSubmit = (event) => {
  event.preventDefault();
  const result = parseRecord(readForm());

  if (!result.ok) {
    showError(result.message);
    return;
  }

  showError('');
  addRecord(result.record);
  resetForm();
};

document.getElementById('record-form').addEventListener('submit', handleSubmit);

document.getElementById('record-list').addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  if (button.dataset.action === 'delete') deleteRecord(button.dataset.id);
});
render();
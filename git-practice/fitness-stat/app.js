//新增了改查以及本地保存的功能
const seedRecords = [
  { id: 'seed-1', date: '2026-10-11', exercise: '深蹲', sets: 4, reps: 12, weight: 70 },
  { id: 'seed-2', date: '2026-10-11', exercise: '卧推', sets: 4, reps: 10, weight: 40 },
  { id: 'seed-3', date: '2026-10-13', exercise: '硬拉', sets: 3, reps: 8, weight: 70 }
];

const STORAGE_KEY = 'fitness-records-v1';

const isValidStored = (item) => Boolean(item)
  && typeof item === 'object'
  && typeof item.id === 'string'
  && typeof item.date === 'string'
  && typeof item.exercise === 'string'
  && Number.isFinite(item.sets) && Number.isFinite(item.reps) && Number.isFinite(item.weight);

const loadRecords = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return [...seedRecords];
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [...seedRecords];
    return parsed.filter(isValidStored);
  } catch (error) {
    console.warn('本地数据读取失败，已改用示例数据：', error.message);
    return [...seedRecords];
  }
};

//每次改动数组后立刻写回本地，刷新页面数据还在
const saveRecords = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (error) {
    console.warn('本地保存失败（浏览器可能禁用了存储）：', error.message);
  }
};

let records = loadRecords();

let editingId = null;

//搜索框中的关键词
let keyword = '';

//生成一个不重复的id，用来标识每条记录（增删改都靠它认人）
const newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

const volumeOf = (record) => record.sets * record.reps * record.weight;

const shortDate = (date) => date.slice(5);

const escapeHtml = (text) => String(text)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

const showError = (message) => {
  const box = document.getElementById('form-error');
  box.textContent = message;
  box.hidden = message === '';
};

const logAction = (message) => {
  document.getElementById('notice').textContent = message;
};

const resetForm = () => {
  const form = document.getElementById('record-form');
  const date = form.elements.date.value;
  form.reset();
  form.elements.date.value = date;
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

//校验并清洗
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

const addRecord = (record) => {
  records.unshift({ id: newId(), ...record });
  saveRecords();
  logAction(`已添加：${record.exercise} ${record.sets} 组 × ${record.reps} 次 ${record.weight} kg`);
  render();
};

const deleteRecord = (id) => {
  const target = records.find((record) => record.id === id);
  if (!target) return;
  records = records.filter((record) => record.id !== id);

  if (editingId === id) {
    editingId = null;
    resetForm();
  }

  saveRecords();
  logAction(`已删除：${target.exercise}（${target.date}）`);
  render();
};

//修改：找到同id的那条，用新数据覆盖旧的
const updateRecord = (id, patch) => {
  records = records.map((record) => (record.id === id ? { ...record, ...patch } : record));
  saveRecords();
  logAction(`已修改：${patch.exercise} ${patch.sets} 组 × ${patch.reps} 次 ${patch.weight} kg`);
  render();
};

//修改模式的实现
const startEdit = (id) => {
  const target = records.find((record) => record.id === id);
  if (!target) return;
  editingId = id;

  const form = document.getElementById('record-form');
  form.elements.date.value = target.date;
  form.elements.exercise.value = target.exercise;
  form.elements.sets.value = target.sets;
  form.elements.reps.value = target.reps;
  form.elements.weight.value = target.weight;

  showError('');
  logAction(`正在修改「${target.exercise}」，改完点「保存修改」`);
  render();
};

//取消修改：清空表单，回到新增模式
const cancelEdit = () => {
  editingId = null;
  resetForm();
  showError('');
  logAction('已取消修改');
  render();
};

//查询：关键词为空就全部显示，否则按动作名称或日期匹配
const matchKeyword = (record) => {
  if (!keyword) return true;
  return `${record.date} ${record.exercise}`.toLowerCase().includes(keyword);
};

//把一条记录变成一个 <li>；按钮上的 data-action、data-id 留给事件委托用
const createRecordItem = (record) => {
  const item = document.createElement('li');
  item.className = 'record';
  item.dataset.id = record.id;

  if (record.id === editingId) item.style.color = 'red';

  item.innerHTML = `
    <div class="record-main">
      <p class="record-title">${escapeHtml(record.exercise)}</p>
      <p class="record-meta">${escapeHtml(shortDate(record.date))} · ${record.sets} 组 × ${record.reps} 次 · ${record.weight} kg</p>
    </div>
    <p class="record-volume">${volumeOf(record)} kg</p>
    <div class="record-actions">
      <button type="button" data-action="edit" data-id="${escapeHtml(record.id)}">修改</button>
      <button type="button" data-action="delete" data-id="${escapeHtml(record.id)}">删除</button>
    </div>`;

  return item;
};

//渲染列表
const renderList = () => {
  const list = document.getElementById('record-list');
  const emptyTip = document.getElementById('empty-tip');
  const visible = records.filter(matchKeyword);

  list.innerHTML = '';

  if (visible.length === 0) {
    emptyTip.textContent = records.length === 0
      ? '还没有训练记录，先在上面添加一条吧。'
      : `没有找到包含「${keyword}」的记录。`;
    emptyTip.hidden = false;
    return;
  }

  emptyTip.hidden = true;
  visible.forEach((record) => list.appendChild(createRecordItem(record)));
};

//渲染统计
const renderStats = () => {
  const visible = records.filter(matchKeyword);
  const totalVolume = visible.reduce((sum, record) => sum + volumeOf(record), 0);
  document.getElementById('stat-count').textContent = visible.length;
  document.getElementById('stat-volume').textContent = totalVolume;
};

//表单的标题和按钮跟着增or改两种模式切换
const renderFormState = () => {
  document.getElementById('form-title').textContent = editingId ? '修改训练记录' : '添加训练记录';
  document.getElementById('submit-btn').textContent = editingId ? '保存修改' : '添加记录';
  document.getElementById('cancel-btn').hidden = editingId === null;
};

//渲染
const render = () => {
  renderList();
  renderStats();
  renderFormState();
};

//提交表单：先校验，再决定是新增还是保存修改
const handleSubmit = (event) => {
  event.preventDefault();
  const result = parseRecord(readForm());

  if (!result.ok) {
    showError(result.message);
    return;
  }

  showError('');
  if (editingId === null) {
    addRecord(result.record);
  } else {
    const id = editingId;
    editingId = null;
    updateRecord(id, result.record);
  }
  resetForm();
};

document.getElementById('record-form').addEventListener('submit', handleSubmit);
document.getElementById('cancel-btn').addEventListener('click', cancelEdit);

document.getElementById('record-list').addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const id = button.dataset.id;
  if (button.dataset.action === 'edit') startEdit(id);
  if (button.dataset.action === 'delete') deleteRecord(id);
});

document.getElementById('search-input').addEventListener('input', (event) => {
  keyword = event.target.value.trim().toLowerCase();
  render();
});

render();
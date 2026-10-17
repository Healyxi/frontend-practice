const ROOMS = [
  { name: '楠苑一楼自习室', building: '楠苑', floor: 1, seats: 120, occupied: 86, status: '开放', hours: '08:00-22:30' },
  { name: '楠苑二楼自习室', building: '楠苑', floor: 2, seats: 96, occupied: 61, status: '开放', hours: '08:00-22:30' },
  { name: '楠苑三楼研讨自习室', building: '楠苑', floor: 3, seats: 48, occupied: 33, status: '开放', hours: '09:00-21:00' },
  { name: '梓苑一楼自习室', building: '梓苑', floor: 1, seats: 140, occupied: 92, status: '开放', hours: '08:00-22:30' },
  { name: '梓苑二楼自习室', building: '梓苑', floor: 2, seats: 88, occupied: 0, status: '维修', hours: '暂停开放' },
  { name: '图书馆一楼自习区', building: '图书馆', floor: 1, seats: 160, occupied: 118, status: '开放', hours: '07:30-23:00' },
  { name: '图书馆二楼自习区', building: '图书馆', floor: 2, seats: 130, occupied: 95, status: '开放', hours: '07:30-23:00' },
  { name: '图书馆三楼静音自习室', building: '图书馆', floor: 3, seats: 60, occupied: 58, status: '开放', hours: '08:00-22:00' },
  { name: '理科楼一层通宵自习室', building: '理科楼', floor: 1, seats: 80, occupied: 41, status: '开放', hours: '全天开放' },
  { name: '理科楼三层自习室', building: '理科楼', floor: 3, seats: 72, occupied: 0, status: '闭馆', hours: '08:00-22:00' },
  { name: '文科楼二层自习室', building: '文科楼', floor: 2, seats: 66, occupied: 52, status: '开放', hours: '08:00-22:00' },
  { name: '文科楼四层考研自习室', building: '文科楼', floor: 4, seats: 110, occupied: 103, status: '开放', hours: '07:00-23:30' }
];

const list = document.querySelector('#room-list');
const filters = document.querySelector('.filters');

let currentFilter = 'all';
let openOnly = false;

const render = () => {
  list.innerHTML = '';               
  const shown = ROOMS.filter(room =>
    (currentFilter === 'all' ? true : room.floor === Number(currentFilter)) &&
    (!openOnly || room.status === '开放')
  );
  if (shown.length === 0) {
    const p = document.createElement('p');
    p.className = 'text-muted';
    p.textContent = '没有符合条件的自习室';
    list.appendChild(p);
    return;
  }
  shown.forEach(room => {
    const col = document.createElement('div');
    col.className = 'col-md-6 col-lg-4';
    col.innerHTML = `
      <div class="card h-100">
        <div class="card-body">
          <h3 class="card-title h6">${room.name}</h3>
          <p class="card-text small text-muted mb-1">${room.building} ${room.floor} 层 ${room.seats} 座 ${room.hours}</p>
          <p class="card-text small mb-0">状态：${room.status} 已占 ${room.occupied} 座</p>
        </div>
      </div>`;
    list.appendChild(col);
  });
};

const state = { data: null };
let barChart = null;

const loadData = async () => {
  $('#status').text('加载中...').show();
  try {
    const response = await fetch('data/data.json');
    if (!response.ok) { throw new Error('HTTP ' + response.status); }
    const data = await response.json();
    if (data.rooms.length === 0) {
      $('#status').text('暂无数据').show();
      return;
    }
    state.data = data;
    $('#data-source').text('数据来源：' + data.source + '  单位：人');
    $('#status').hide();
    renderBarChart(data);
  } catch (error) {
    $('#status').text('加载失败：' + error.message).show();
  }
};

const renderBarChart = (data) => {
  if (barChart === null) {
    barChart = echarts.init(document.querySelector('#bar-chart'));
  }
  barChart.setOption({
    title: { text: '各自习室使用量（单位：人）', left: 'center' },
    tooltip: { trigger: 'axis' },
    grid: { bottom: 80 },
    xAxis: {
      data: data.rooms.map(r => r.name),
      axisLabel: { interval: 0, rotate: 30, fontSize: 10 }
    },
    yAxis: { name: '人' },
    series: [{
      name: '已占座位',
      type: 'bar',
      data: data.rooms.map(r => r.occupied)
    }]
  });
};

filters.addEventListener('click', (e) => {
  if (e.target.tagName !== 'BUTTON') return;
  currentFilter = e.target.dataset.filter;
  render();
});

$('#open-only').on('change', function () {
  openOnly = $(this).prop('checked');
  render();
});

window.addEventListener('resize', () => {
  if (barChart) barChart.resize();
});

render();
loadData();

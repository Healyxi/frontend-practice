const state = {
  books: null,
  rooms: null,
  category: '全部',
  openOnly: true
};

let lineChart = null;

let barChart = null;

const monthTotals = () => state.books.months.map((month, index) => {
  let total = 0;
  state.books.series.forEach(s => {
    total += s.counts[index];
  });
  return { month: month, total: total };
});

const topCategory = () => {
  let top = { category: '-', total: -1 };
  state.books.series.forEach(s => {
    const total = s.counts.reduce((sum, n) => sum + n, 0);
    if (total > top.total) {
      top = { category: s.category, total: total };
    }
  });
  return top;
};

const peakMonth = () => {
  let peak = { month: '-', total: -1 };
  monthTotals().forEach(item => {
    if (item.total > peak.total) {
      peak = item;
    }
  });
  return peak;
};

const openRooms = () => state.rooms.rooms.filter(room => room.status === '开放');

const rate = (room) => Math.round(room.occupied / room.seats * 100);

const overallRate = () => {
  const rooms = openRooms();
  let seats = 0;
  let occupied = 0;
  rooms.forEach(room => {
    seats += room.seats;
    occupied += room.occupied;
  });
  return Math.round(occupied / seats * 100);
};

const renderCards = () => {
  const total = monthTotals().reduce((sum, item) => sum + item.total, 0);
  const top = topCategory();
  const peak = peakMonth();

  $('#cards').html(`
    <div class="col-md-3">
      <div class="card">
        <div class="card-body">
          <h3 class="card-title h6">借阅总量</h3>
          <p class="card-text fs-4">${total}</p>
          <p class="card-text small text-muted">册 共${state.books.months.length}个月</p>
        </div>
      </div>
    </div>
    <div class="col-md-3">
      <div class="card">
        <div class="card-body">
          <h3 class="card-title h6">最受欢迎分类</h3>
          <p class="card-text fs-4">${top.category}</p>
          <p class="card-text small text-muted">${top.total}册</p>
        </div>
      </div>
    </div>
    <div class="col-md-3">
      <div class="card">
        <div class="card-body">
          <h3 class="card-title h6">借阅高峰月</h3>
          <p class="card-text fs-4">${peak.month}</p>
          <p class="card-text small text-muted">${peak.total}册</p>
        </div>
      </div>
    </div>
    <div class="col-md-3">
      <div class="card">
        <div class="card-body">
          <h3 class="card-title h6">开放自习室上座率</h3>
          <p class="card-text fs-4">${overallRate()}%</p>
          <p class="card-text small text-muted">${openRooms().length}间开放 共${state.rooms.rooms.length}间</p>
        </div>
      </div>
    </div>
  `);
};

const fillCategory = () => {
  const options = ['全部'].concat(state.books.series.map(s => s.category));
  $('#category').html(options.map(name => `<option>${name}</option>`).join(''));
};

const renderLineChart = () => {
  if (lineChart !== null) {
    lineChart.dispose();
  }
  const series = state.category === '全部'
    ? state.books.series
    : state.books.series.filter(s => s.category === state.category);

  lineChart = echarts.init(document.querySelector('#line-chart'));
  lineChart.setOption({
    title: { text: '各分类借阅量（单位：册）', left: 'center' },
    tooltip: { trigger: 'axis' },
    legend: { bottom: 0 },
    xAxis: { type: 'category', data: state.books.months },
    yAxis: { name: '册' },
    series: series.map(s => ({
      name: s.category,
      type: 'line',
      smooth: true,
      data: s.counts
    }))
  });
};

const renderBarChart = () => {
  if (barChart !== null) {
    barChart.destroy();
  }
  const rooms = (state.openOnly ? openRooms() : state.rooms.rooms)
    .slice()
    .sort((a, b) => rate(b) - rate(a));

  barChart = new Chart(document.querySelector('#bar-chart'), {
    type: 'bar',
    data: {
      labels: rooms.map(room => room.name),
      datasets: [{
        label: '上座率（%）',
        data: rooms.map(room => rate(room)),
        backgroundColor: rooms.map(room => room.status === '开放' ? '#2563eb' : '#cbd5e1')
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: { display: true, text: '自习室上座率（单位：%）' },
        legend: { display: false }
      },
      scales: {
        x: { max: 100 }
      }
    }
  });
};

const loadData = async () => {
  $('#status').text('加载中...').show();

  try {
    const booksResponse = await fetch('data/books.json');
    const roomsResponse = await fetch('data/studyrooms.json');
    if (!booksResponse.ok || !roomsResponse.ok) {
      throw new Error('HTTP ' + booksResponse.status + ' / ' + roomsResponse.status);
    }

    const books = await booksResponse.json();
    const rooms = await roomsResponse.json();

    if (books.series.length === 0 || rooms.rooms.length === 0) {
      $('#status').text('暂无数据').show();
      return;
    }

    state.books = books;
    state.rooms = rooms;
    $('#sub-title').text(books.title + ' · ' + books.period + ' · 数据来源：课程统一数据集');
    $('#status').hide();

    renderCards();
    fillCategory();
    renderLineChart();
    renderBarChart();
  } catch (error) {
    $('#status').removeClass('alert-warning').addClass('alert-danger').text('加载失败：' + error.message).show();
  }
};

window.addEventListener('resize', () => {
  if (lineChart) lineChart.resize();
});

$('#category').on('change', function () {
  state.category = $(this).val();
  renderLineChart();
});

$('#open-only').on('change', function () {
  state.openOnly = $(this).prop('checked');
  renderBarChart();
});

$('#cards').on('click', '.card', function () {
  $(this).toggleClass('border-primary shadow');
});

loadData();
const state = {
  data: null
};

let barChart = null;

let lineChart = null;

const loadData = async () => {
  $('#status').text('加载中...').show();

  try {
    const response = await fetch('data/books.json');
    if (!response.ok) { throw new Error('HTTP ' + response.status);
    }

    const data = await response.json();
    if (data.series.length === 0) {
      $('#status').text('暂无数据').show();
      return;
    }

    state.data = data;
    $('#sub-title').text(data.title + ' · 数据来源：课程统一数据集');
    $('#status').hide();

    renderCards(data);
    renderBarChart(data);
    renderLineChart(data);
  } catch (error) {
    $('#status').text('加载失败：' + error.message).show();
  }
};

const renderCards = (data) => {
  const months = data.months;

  data.series.forEach(s => {
    const total = s.counts.reduce((sum, n) => sum + n, 0);

    $('#cards').append(`
      <div class="col-md-4">
        <div class="card">
          <div class="card-body">
            <h3 class="card-title h6">${s.category}</h3>
            <p class="card-text fs-4">${total}</p>
            <p class="card-text small text-muted">共${months.length}个月累计借阅</p>
          </div>
        </div>
      </div>
    `);
  });
};

const renderBarChart = (data) => {
  if (barChart === null) {
    barChart = echarts.init(document.querySelector('#bar-chart'));
  }
  barChart.setOption({
    title: { text: '各月各品类借阅量', left: 'center' },
    tooltip: { trigger: 'axis' },
    legend: { bottom: 0 },
    xAxis: { data: data.months },
    yAxis: { name: '册' },
    series: data.series.map(s => ({
      name: s.category,
      type: 'bar',
      data: s.counts
    }))
  });
};

const renderLineChart = (data) => {
  if (lineChart !== null) {
    lineChart.destroy();
  }
  const ctx = document.querySelector('#line-chart');
  lineChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.months,
      datasets: data.series.map(s => ({
        label: s.category,
        data: s.counts,
        borderWidth: 1
      }))
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: { display: true, text: '借阅趋势（单位：册）' }
      }
    }
  });
};

window.addEventListener('resize', () => {
  if (barChart) barChart.resize();
});

loadData();

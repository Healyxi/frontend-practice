const state = {
  data: null
};

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
    // 第二步（ECharts柱状图）写好 renderBarChart 后，删掉下面这行的注释：
    // renderBarChart(data);
    // 第三步（Chart.js折线图）写好 renderLineChart 后，删掉下面这行的注释：
    // renderLineChart(data);
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

loadData();

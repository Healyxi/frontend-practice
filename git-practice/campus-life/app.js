const state = {
  books: null,
  rooms: null
};

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
          <p class="card-text small text-muted">册 · 共${state.books.months.length}个月</p>
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
          <p class="card-text small text-muted">${openRooms().length}间开放 · 共${state.rooms.rooms.length}间</p>
        </div>
      </div>
    </div>
  `);
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
  } catch (error) {
    $('#status').removeClass('alert-warning').addClass('alert-danger').text('加载失败：' + error.message).show();
  }
};

loadData();
let rooms = [];
let currentFilter = 'all';
let keyword = '';

const list = document.querySelector('#room-list');
const filters = document.querySelector('.filters');

const renderSummary = () => {
  let open = 0;
  let seats = 0;
  let free = 0;

  rooms.forEach(room => {
    seats += room.seats;
    if (room.status === '开放') {
      open += 1;
      free += room.seats - room.occupied;
    }
  });

  document.querySelector('#sum-total').textContent = rooms.length + ' 间';
  document.querySelector('#sum-open').textContent = open + ' 间';
  document.querySelector('#sum-free').textContent = free + ' 座';
};

const shownRooms = () => rooms.filter(room => {
  const byFloor = currentFilter === 'all' ? true : room.floor === Number(currentFilter);
  const byKeyword = keyword === '' ? true
    : room.name.includes(keyword) || room.building.includes(keyword);
  return byFloor && byKeyword;
});

const renderList = () => {
  const shown = shownRooms();

  list.innerHTML = '';
  document.querySelector('#result-count').textContent = '共 ' + shown.length + ' 间';

  if (shown.length === 0) {
    const p = document.createElement('p');
    p.className = 'text-muted mb-0';
    p.textContent = '没有符合条件的自习室';
    list.appendChild(p);
    return;
  }

  shown.forEach(room => {
    const col = document.createElement('div');
    col.className = 'col-md-6 col-lg-4';

    const free = room.status === '开放' ? room.seats - room.occupied : 0;
    const freeText = room.status === '开放' ? free + ' 座' : '暂停开放';

    col.innerHTML = `
      <div class="card h-100 room-card">
        <div class="card-body">
          <h3 class="card-title h6 mb-1">${room.name}</h3>
          <p class="small text-muted mb-2">${room.building} ${room.floor} 层 ${room.seats} 座 ${room.hours}</p>
          <p class="small mb-1">状态：${room.status}</p>
          <p class="small mb-1">已占：${room.occupied} 座</p>
          <p class="small mb-0">空座：${freeText}</p>
        </div>
      </div>`;

    list.appendChild(col);
  });
};

const renderAll = () => {
  renderSummary();
  renderList();
};

const loadData = async () => {
  $('#status').text('加载中...').show();

  try {
    const response = await fetch('data/studyrooms.json');
    if (!response.ok) {
      throw new Error('HTTP ' + response.status);
    }

    const data = await response.json();
    if (data.rooms.length === 0) {
      $('#status').text('暂无数据').show();
      return;
    }

    rooms = data.rooms;
    $('#status').hide();
    renderAll();
  } catch (error) {
    $('#status').text('加载失败：' + error.message).show();
  }
};

filters.addEventListener('click', (e) => {
  if (e.target.tagName !== 'BUTTON') return;
  currentFilter = e.target.dataset.filter;
  renderAll();
});

document.querySelector('#keyword').addEventListener('input', (e) => {
  keyword = e.target.value.trim();
  renderAll();
});

loadData();
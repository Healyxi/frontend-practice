$(async function () {
  "use strict";

  const {
    fetchJson,
    showAlert,
    hideAlert,
    escapeHtml,
    rate,
    freeSeats
  } = CampusData;

  const state = {
    books: null,
    rooms: [],
    category: "全部",
    openOnly: true
  };

  let lineChart = null;
  let barChart = null;

  function monthTotals() {
    return state.books.months.map((month, index) => {
      const total = state.books.series.reduce((sum, item) => {
        return sum + (Number(item.counts[index]) || 0);
      }, 0);

      return { month, total };
    });
  }

  function topCategory() {
    return state.books.series.reduce((best, item) => {
      const total = item.counts.reduce((sum, value) => sum + (Number(value) || 0), 0);
      return total > best.total ? { category: item.category, total } : best;
    }, { category: "—", total: 0 });
  }

  function peakMonth() {
    return monthTotals().reduce(
      (best, item) => item.total > best.total ? item : best,
      { month: "—", total: 0 }
    );
  }

  function overallRoomRate() {
    const rooms = state.rooms.filter(room => room.status === "开放");
    const seats = rooms.reduce((sum, room) => sum + (Number(room.seats) || 0), 0);
    const occupied = rooms.reduce((sum, room) => sum + (Number(room.occupied) || 0), 0);
    return seats ? Math.round((occupied / seats) * 100) : 0;
  }

  function renderCards() {
    const total = monthTotals().reduce((sum, item) => sum + item.total, 0);
    const top = topCategory();
    const peak = peakMonth();
    const openRooms = state.rooms.filter(room => room.status === "开放");

    $("#cards").html(`
      <div class="col-6 col-lg-3">
        <div class="stat-card">
          <p class="stat-label">全年借阅总量</p>
          <p class="stat-value">${total}</p>
          <p class="small text-secondary mb-0">册</p>
        </div>
      </div>
      <div class="col-6 col-lg-3">
        <div class="stat-card">
          <p class="stat-label">最受欢迎分类</p>
          <p class="stat-value">${escapeHtml(top.category)}</p>
          <p class="small text-secondary mb-0">${top.total} 册</p>
        </div>
      </div>
      <div class="col-6 col-lg-3">
        <div class="stat-card">
          <p class="stat-label">借阅高峰月</p>
          <p class="stat-value">${escapeHtml(peak.month)}</p>
          <p class="small text-secondary mb-0">${peak.total} 册</p>
        </div>
      </div>
      <div class="col-6 col-lg-3">
        <div class="stat-card">
          <p class="stat-label">开放区平均上座率</p>
          <p class="stat-value">${overallRoomRate()}%</p>
          <p class="small text-secondary mb-0">${openRooms.length} 间开放</p>
        </div>
      </div>
    `);
  }

  function fillCategorySelect() {
    const select = $("#category");
    select.empty().append(new Option("全部分类", "全部"));

    state.books.series.forEach(item => {
      select.append(new Option(item.category, item.category));
    });

    select.val(state.category);
  }

  function renderLineChart() {
    if (lineChart) {
      lineChart.dispose();
    }

    const series = state.category === "全部"
      ? state.books.series
      : state.books.series.filter(item => item.category === state.category);

    lineChart = echarts.init(document.querySelector("#line-chart"));
    lineChart.setOption({
      tooltip: { trigger: "axis" },
      legend: { type: "scroll", bottom: 0 },
      grid: { left: 48, right: 24, top: 28, bottom: 68 },
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: state.books.months
      },
      yAxis: {
        type: "value",
        name: "册",
        splitLine: { lineStyle: { color: "#e9ecef" } }
      },
      series: series.map(item => ({
        name: item.category,
        type: "line",
        smooth: true,
        symbolSize: 6,
        data: item.counts
      }))
    });
  }

  function renderBarChart() {
    if (barChart) {
      barChart.destroy();
    }

    const rooms = (state.openOnly
      ? state.rooms.filter(room => room.status === "开放")
      : state.rooms.slice()
    ).sort((a, b) => rate(b) - rate(a));

    barChart = new Chart(document.querySelector("#roomBar"), {
      type: "bar",
      data: {
        labels: rooms.map(room => room.name),
        datasets: [{
          label: "上座率",
          data: rooms.map(room => rate(room)),
          backgroundColor: rooms.map(room => {
            if (room.status !== "开放") return "#ced4da";
            return rate(room) >= 85 ? "#dc3545" : rate(room) >= 65 ? "#ffc107" : "#198754";
          }),
          borderRadius: 5
        }]
      },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label(context) {
                const room = rooms[context.dataIndex];
                return `上座率 ${rate(room)}%，空座 ${freeSeats(room)} 座（${room.status}）`;
              }
            }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            max: 100,
            ticks: { callback: value => `${value}%` }
          },
          y: {
            grid: { display: false },
            ticks: { font: { size: 11 } }
          }
        }
      }
    });
  }

  async function loadData() {
    showAlert("#pageStatus", "info", "正在加载图表数据……");

    try {
      const [books, roomData] = await Promise.all([
        fetchJson("data/books.json"),
        fetchJson("data/studyrooms.json")
      ]);

      if (!Array.isArray(books.months) || !Array.isArray(books.series)) {
        throw new Error("books.json 缺少 months 或 series 数组。");
      }

      if (!Array.isArray(roomData.rooms)) {
        throw new Error("studyrooms.json 缺少 rooms 数组。");
      }

      state.books = books;
      state.rooms = roomData.rooms;

      document.querySelector("#chart-data-source").textContent =
        `数据来源：${books.title || "books.json"}、${roomData.title || "studyrooms.json"}；均为课程教学模拟数据。`;

      if (books.series.length === 0 || state.rooms.length === 0) {
        showAlert("#pageStatus", "warning", "暂无足够数据，图表无法生成。");
        return;
      }

      hideAlert("#pageStatus");
      fillCategorySelect();
      renderCards();
      renderLineChart();
      renderBarChart();
    } catch (error) {
      showAlert("#pageStatus", "danger", `图表数据加载失败：${error.message}`);
    }
  }

  $("#category").on("change", function () {
    state.category = String($(this).val());
    renderLineChart();
  });

  $("#open-only").on("change", function () {
    state.openOnly = $(this).prop("checked");
    renderBarChart();
  });

  window.addEventListener("resize", () => {
    if (lineChart) lineChart.resize();
  });

  await loadData();
});

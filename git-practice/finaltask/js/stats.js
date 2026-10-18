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

  const numberFormatter = new Intl.NumberFormat("zh-CN");

  let lineChart = null;
  let barChart = null;

  function selectedSeries() {
    if (state.category === "全部") {
      return state.books.series;
    }

    return state.books.series.filter(item => {
      return item.category === state.category;
    });
  }

  function monthTotals(series = state.books.series) {
    return state.books.months.map((month, index) => {
      const total = series.reduce((sum, item) => {
        return sum + (Number(item.counts[index]) || 0);
      }, 0);

      return { month, total };
    });
  }

  function categoryTotals() {
    return state.books.series.map(item => ({
      category: item.category,
      total: item.counts.reduce((sum, value) => {
        return sum + (Number(value) || 0);
      }, 0)
    }));
  }

  function findPeak(totals) {
    return totals.reduce(
      (best, item) => item.total > best.total ? item : best,
      { month: "—", total: 0 }
    );
  }

  function openRooms() {
    return state.rooms.filter(room => room.status === "开放");
  }

  function overallRoomRate() {
    const rooms = openRooms();
    const seats = rooms.reduce((sum, room) => {
      return sum + (Number(room.seats) || 0);
    }, 0);
    const occupied = rooms.reduce((sum, room) => {
      return sum + (Number(room.occupied) || 0);
    }, 0);

    return seats ? Math.round((occupied / seats) * 100) : 0;
  }

  function renderCards() {
    const totals = monthTotals();
    const total = totals.reduce((sum, item) => sum + item.total, 0);
    const peak = findPeak(totals);
    const top = categoryTotals().reduce(
      (best, item) => item.total > best.total ? item : best,
      { category: "—", total: 0 }
    );

    $("#cards").html(`
      <div class="col-6 col-lg-3">
        <div class="stat-card">
          <p class="stat-label">全年借阅总量</p>
          <p class="stat-value">${numberFormatter.format(total)}</p>
          <p class="small text-secondary mb-0">册</p>
        </div>
      </div>
      <div class="col-6 col-lg-3">
        <div class="stat-card">
          <p class="stat-label">最受欢迎分类</p>
          <p class="stat-value">${escapeHtml(top.category)}</p>
          <p class="small text-secondary mb-0">
            ${numberFormatter.format(top.total)} 册
          </p>
        </div>
      </div>
      <div class="col-6 col-lg-3">
        <div class="stat-card">
          <p class="stat-label">借阅高峰月</p>
          <p class="stat-value">${escapeHtml(peak.month)}</p>
          <p class="small text-secondary mb-0">
            ${numberFormatter.format(peak.total)} 册
          </p>
        </div>
      </div>
      <div class="col-6 col-lg-3">
        <div class="stat-card">
          <p class="stat-label">开放区平均上座率</p>
          <p class="stat-value">${overallRoomRate()}%</p>
          <p class="small text-secondary mb-0">
            ${openRooms().length} 间开放
          </p>
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

  function renderLineSummary() {
    const series = selectedSeries();
    const totals = monthTotals(series);
    const total = totals.reduce((sum, item) => sum + item.total, 0);
    const peak = findPeak(totals);
    const categoryText = state.category === "全部"
      ? `全部 ${series.length} 个分类`
      : state.category;

    $("#line-summary").text(
      `${categoryText}的年度合计为 ${numberFormatter.format(total)} 册，` +
      `最高月份为 ${peak.month}，共 ${numberFormatter.format(peak.total)} 册。`
    );
  }

  function renderLineChart() {
    const series = selectedSeries();

    if (!lineChart) {
      lineChart = echarts.init(document.querySelector("#line-chart"));
    }

    lineChart.setOption({
      tooltip: {
        trigger: "axis"
      },
      legend: {
        show: series.length > 1,
        type: "scroll",
        bottom: 0
      },
      grid: {
        left: 52,
        right: 24,
        top: 28,
        bottom: series.length > 1 ? 72 : 42
      },
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: state.books.months,
        axisLabel: {
          interval: 0
        }
      },
      yAxis: {
        type: "value",
        name: "册",
        splitLine: {
          lineStyle: {
            color: "#e9ecef"
          }
        }
      },
      series: series.map(item => ({
        name: item.category,
        type: "line",
        smooth: true,
        symbolSize: 6,
        data: item.counts
      }))
    }, true);

    renderLineSummary();
  }

  function roomsForBarChart() {
    const rooms = state.openOnly
      ? state.rooms.filter(room => room.status === "开放")
      : state.rooms.slice();

    return rooms.sort((a, b) => rate(b) - rate(a));
  }

  function renderBarSummary(rooms) {
    if (rooms.length === 0) {
      $("#bar-summary").text("当前条件下没有可展示的自习室。");
      return;
    }

    const topRoom = rooms[0];
    $("#bar-summary").text(
      `当前展示 ${rooms.length} 间自习室，` +
      `最高上座率为 ${topRoom.name} 的 ${rate(topRoom)}%，` +
      `剩余 ${freeSeats(topRoom)} 座。`
    );
  }

  function renderBarChart() {
    if (barChart) {
      barChart.destroy();
    }

    const rooms = roomsForBarChart();
    renderBarSummary(rooms);

    barChart = new Chart(document.querySelector("#roomBar"), {
      type: "bar",
      data: {
        labels: rooms.map(room => room.name),
        datasets: [{
          label: "上座率",
          data: rooms.map(room => rate(room)),
          backgroundColor: rooms.map(room => {
            if (room.status !== "开放") return "#ced4da";
            if (rate(room) >= 85) return "#dc3545";
            if (rate(room) >= 65) return "#ffc107";
            return "#198754";
          }),
          borderWidth: 0,
          borderRadius: 5
        }]
      },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label(context) {
                const room = rooms[context.dataIndex];
                return `上座率 ${rate(room)}%，空座 ${freeSeats(room)} 座，状态 ${room.status}`;
              }
            }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            max: 100,
            ticks: {
              callback: value => `${value}%`
            },
            grid: {
              color: "#e9ecef"
            }
          },
          y: {
            grid: {
              display: false
            },
            ticks: {
              font: {
                size: 11
              }
            }
          }
        }
      }
    });
  }

  function renderCategoryTable() {
    const rows = categoryTotals().sort((a, b) => b.total - a.total);
    const total = rows.reduce((sum, item) => sum + item.total, 0);

    $("#category-table-body").html(
      rows.map(item => {
        const percentage = total
          ? ((item.total / total) * 100).toFixed(1)
          : "0.0";

        return `
          <tr>
            <td>${escapeHtml(item.category)}</td>
            <td class="text-end">${numberFormatter.format(item.total)}</td>
            <td class="text-end">${percentage}%</td>
          </tr>
        `;
      }).join("")
    );

    $("#category-table-total").text(numberFormatter.format(total));
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

      const invalidSeries = books.series.some(item => {
        return !item.category ||
          !Array.isArray(item.counts) ||
          item.counts.length !== books.months.length;
      });

      if (invalidSeries) {
        throw new Error("books.json 的分类名称或月份数据不完整。");
      }

      if (!Array.isArray(roomData.rooms)) {
        throw new Error("studyrooms.json 缺少 rooms 数组。");
      }

      state.books = books;
      state.rooms = roomData.rooms;
      state.category = "全部";
      state.openOnly = true;

      const periodText = books.period ? `统计周期：${books.period}。` : "";
      document.querySelector("#chart-data-source").textContent =
        `数据来源：${books.title || "books.json"}、${roomData.title || "studyrooms.json"}。` +
        `${periodText}两组数据均为课程教学模拟数据。`;

      if (state.books.series.length === 0 || state.rooms.length === 0) {
        showAlert("#pageStatus", "warning", "暂无足够数据，图表无法生成。");
        return;
      }

      hideAlert("#pageStatus");
      fillCategorySelect();
      renderCards();
      renderLineChart();
      renderBarChart();
      renderCategoryTable();
    } catch (error) {
      showAlert("#pageStatus", "danger", `图表数据加载失败：${error.message}`);
      $("#cards").empty();
      $("#category-table-body").empty();
      $("#category-table-total").text("0");
    }
  }

  $("#category").on("change", function () {
    if (!state.books) return;

    state.category = String($(this).val());
    renderLineChart();
  });

  $("#open-only").on("change", function () {
    state.openOnly = $(this).prop("checked");
    if (state.books) renderBarChart();
  });

  window.addEventListener("resize", () => {
    if (lineChart) {
      lineChart.resize();
    }
  });

  await loadData();
});

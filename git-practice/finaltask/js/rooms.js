$(async function () {
  "use strict";

  const {
    fetchJson,
    showAlert,
    hideAlert,
    escapeHtml,
    freeSeats
  } = CampusData;

  const state = {
    rooms: [],
    currentFloor: "all",
    keyword: ""
  };

  function shownRooms() {
    const keyword = state.keyword.toLowerCase();

    return state.rooms.filter(room => {
      const byFloor = state.currentFloor === "all" ||
        Number(room.floor) === Number(state.currentFloor);

      const searchable = `${room.name} ${room.building}`.toLowerCase();
      const byKeyword = !keyword || searchable.includes(keyword);

      return byFloor && byKeyword;
    });
  }

  function roomCard(room) {
    const free = room.status === "开放" ? `${freeSeats(room)} 座` : "暂停开放";
    const badgeClass = room.status === "开放"
      ? "text-bg-success"
      : room.status === "维修"
        ? "text-bg-warning"
        : "text-bg-secondary";

    return `
      <div class="col-md-6 col-xl-4">
        <article class="card room-card h-100">
          <div class="card-body p-4">
            <div class="d-flex justify-content-between align-items-start gap-2 mb-2">
              <h2 class="h6 mb-0">${escapeHtml(room.name)}</h2>
              <span class="badge ${badgeClass}">${escapeHtml(room.status)}</span>
            </div>
            <p class="small text-secondary mb-3">
              ${escapeHtml(room.building)} ${Number(room.floor) || "—"} 层
              ${escapeHtml(room.hours)}
            </p>
            <div class="row g-2 small">
              <div class="col-4">
                <span class="text-secondary d-block">总座</span>
                <strong>${room.seats}</strong>
              </div>
              <div class="col-4">
                <span class="text-secondary d-block">已占</span>
                <strong>${room.occupied}</strong>
              </div>
              <div class="col-4">
                <span class="text-secondary d-block">空座</span>
                <strong>${free}</strong>
              </div>
            </div>
          </div>
        </article>
      </div>
    `;
  }

  function render() {
    const rooms = shownRooms();
    const list = $("#room-list");

    $("#result-count").text(`共 ${rooms.length} 间符合条件的自习室`);

    if (rooms.length === 0) {
      list.html('<div class="col-12"><div class="empty-state">没有符合条件的自习室，请更换筛选条件。</div></div>');
      return;
    }

    list.html(rooms.map(roomCard).join(""));
  }

  async function loadRooms() {
    showAlert("#roomStatus", "info", "正在加载自习室数据……");

    try {
      const data = await fetchJson("data/studyrooms.json");

      if (!Array.isArray(data.rooms)) {
        throw new Error("studyrooms.json 缺少 rooms 数组。");
      }

      state.rooms = data.rooms;
      document.querySelector("#room-data-source").textContent =
        `数据来源：${data.source || "课程统一数据集"}`;

      if (state.rooms.length === 0) {
        showAlert("#roomStatus", "warning", "暂无自习室数据，列表为空。");
        render();
        return;
      }

      hideAlert("#roomStatus");
      render();
    } catch (error) {
      showAlert("#roomStatus", "danger", `自习室数据加载失败：${error.message}`);
      $("#result-count").text("");
      $("#room-list").html('<div class="col-12"><div class="empty-state">数据暂时无法显示。</div></div>');
    }
  }

  $("[data-filter]").on("click", function () {
    state.currentFloor = String($(this).data("filter"));

    $("[data-filter]")
      .removeClass("btn-primary")
      .addClass("btn-outline-primary");

    $(this)
      .removeClass("btn-outline-primary")
      .addClass("btn-primary");

    render();
  });

  $("#keyword").on("input", function () {
    state.keyword = String($(this).val() ?? "").trim();
    render();
  });

  await loadRooms();
});

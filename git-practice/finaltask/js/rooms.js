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

  const FAVORITES_KEY = "campus-studyroom-favorites-v1";

  const state = {
    rooms: [],
    keyword: "",
    floor: "all",
    status: "all",
    minFree: 0,
    favoritesOnly: false,
    favorites: new Set()
  };

  function readFavorites() {
    try {
      const raw = localStorage.getItem(FAVORITES_KEY);
      const list = raw ? JSON.parse(raw) : [];
      return new Set(
        Array.isArray(list)
          ? list.filter(item => typeof item === "string")
          : []
      );
    } catch (error) {
      return new Set();
    }
  }

  function saveFavorites() {
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify([...state.favorites]));
    } catch (error) {
      showAlert("#roomStatus", "warning", "浏览器禁止本地存储，本次收藏只会在当前页面有效。");
    }
  }

  function statusBadgeClass(status) {
    if (status === "开放") return "text-bg-success";
    if (status === "维修") return "text-bg-warning";
    return "text-bg-secondary";
  }

  function filteredRooms() {
    const keyword = state.keyword.toLowerCase();

    return state.rooms
      .filter(room => {
        const searchable = `${room.name} ${room.building}`.toLowerCase();
        const byKeyword = !keyword || searchable.includes(keyword);
        const byFloor = state.floor === "all" ||
          Number(room.floor) === Number(state.floor);
        const byStatus = state.status === "all" ||
          room.status === state.status;

        const byMinFree = state.minFree === 0 || (
          room.status === "开放" && room.free >= state.minFree
        );

        const byFavorite = !state.favoritesOnly ||
          state.favorites.has(room.name);

        return byKeyword && byFloor && byStatus && byMinFree && byFavorite;
      })
      .sort((a, b) => {
        const openOrder = (a.status === "开放" ? 0 : 1) -
          (b.status === "开放" ? 0 : 1);
        return openOrder || b.rate - a.rate;
      });
  }

  function roomCard(room) {
    const isFavorite = state.favorites.has(room.name);
    const freeText = room.status === "开放" ? `${room.free} 座` : "暂不可用";
    const barClass = room.status !== "开放"
      ? "bg-secondary"
      : room.rate >= 85
        ? "bg-danger"
        : room.rate >= 65
          ? "bg-warning"
          : "bg-success";

    return `
      <div class="col-md-6 col-xl-4">
        <article class="card room-card h-100">
          <div class="card-body d-flex flex-column p-4">
            <div class="d-flex align-items-start justify-content-between gap-2 mb-2">
              <span class="badge ${statusBadgeClass(room.status)}">${escapeHtml(room.status)}</span>
              <button type="button"
                      class="btn btn-sm favorite-button ${isFavorite ? "btn-warning" : "btn-outline-secondary"} js-favorite"
                      data-name="${escapeHtml(room.name)}"
                      aria-pressed="${isFavorite}">
                ${isFavorite ? "★ 已收藏" : "☆ 收藏"}
              </button>
            </div>

            <h2 class="h6 mb-1">${escapeHtml(room.name)}</h2>
            <p class="small text-secondary mb-3">
              ${escapeHtml(room.building)} ${Number(room.floor) || "—"} 层
              ${escapeHtml(room.hours)}
            </p>

            <div class="d-flex justify-content-between small mb-1">
              <span>上座率</span>
              <strong>${room.rate}%</strong>
            </div>
            <div class="progress mb-3" role="progressbar"
                 aria-label="${escapeHtml(room.name)}上座率"
                 aria-valuenow="${room.rate}"
                 aria-valuemin="0"
                 aria-valuemax="100">
              <div class="progress-bar ${barClass}" style="width: ${room.rate}%"></div>
            </div>

            <div class="row g-2 small mt-auto">
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
                <strong>${freeText}</strong>
              </div>
            </div>
          </div>
        </article>
      </div>
    `;
  }

  function render() {
    const rooms = filteredRooms();
    const list = $("#room-list");

    $("#result-count").text(`显示 ${rooms.length} / ${state.rooms.length} 间`);
    $("#favorite-count").text(`已收藏 ${state.favorites.size} 间`);

    if (rooms.length === 0) {
      list.html(`
        <div class="col-12">
          <div class="empty-state">
            <p class="mb-2">没有符合条件的自习室。</p>
            <button type="button" id="emptyClear" class="btn btn-sm btn-outline-primary">
              清除筛选条件
            </button>
          </div>
        </div>
      `);
      return;
    }

    list.html(rooms.map(roomCard).join(""));
  }

  function validateMinFree() {
    const input = $("#minFree");
    const raw = String(input.val() ?? "").trim();
    const value = Number(raw);
    const valid = raw === "" || (
      Number.isInteger(value) &&
      value >= 0 &&
      value <= 200
    );

    input.toggleClass("is-invalid", !valid);
    input.attr("aria-invalid", valid ? "false" : "true");
    $("#minFreeFeedback").text(valid ? "" : "请输入 0 到 200 的整数。");

    if (valid) {
      state.minFree = raw === "" ? 0 : value;
    }
  }

  function resetFilters() {
    state.keyword = "";
    state.floor = "all";
    state.status = "all";
    state.minFree = 0;
    state.favoritesOnly = false;

    $("#keyword").val("");
    $("#floor").val("all");
    $("#status").val("all");
    $("#minFree")
      .val("")
      .removeClass("is-invalid")
      .attr("aria-invalid", "false");
    $("#minFreeFeedback").text("");
    $("#favoritesOnly").prop("checked", false);

    render();
  }

  async function loadRooms() {
    showAlert("#roomStatus", "info", "正在加载自习室数据……");

    try {
      const data = await fetchJson("data/studyrooms.json");

      if (!Array.isArray(data.rooms)) {
        throw new Error("studyrooms.json 缺少 rooms 数组。");
      }

      state.rooms = data.rooms.map(room => ({
        ...room,
        rate: rate(room),
        free: freeSeats(room)
      }));

      document.querySelector("#room-data-source").textContent =
        `数据来源：${data.source || "课程统一数据集"}。上座率按已占座位除以总座位计算。`;

      if (state.rooms.length === 0) {
        showAlert("#roomStatus", "warning", "暂无自习室数据，列表为空。");
        render();
        return;
      }

      hideAlert("#roomStatus");
      render();
    } catch (error) {
      state.rooms = [];
      showAlert("#roomStatus", "danger", `自习室数据加载失败：${error.message}`);
      $("#result-count").text("");
      $("#room-list").html(`
        <div class="col-12">
          <div class="empty-state">数据暂时无法显示，请检查本地服务器和数据文件。</div>
        </div>
      `);
    }
  }

  state.favorites = readFavorites();

  $("#keyword").on("input", function () {
    state.keyword = String($(this).val() ?? "").trim();
    render();
  });

  $("#floor").on("change", function () {
    state.floor = String($(this).val());
    render();
  });

  $("#status").on("change", function () {
    state.status = String($(this).val());
    render();
  });

  $("#minFree").on("input", function () {
    validateMinFree();
    render();
  });

  $("#favoritesOnly").on("change", function () {
    state.favoritesOnly = $(this).prop("checked");
    render();
  });

  $("#clearFilters").on("click", resetFilters);

  $("#room-list").on("click", "#emptyClear", resetFilters);

  $("#room-list").on("click", ".js-favorite", function () {
    const roomName = String($(this).attr("data-name") ?? "");

    if (state.favorites.has(roomName)) {
      state.favorites.delete(roomName);
    } else {
      state.favorites.add(roomName);
    }

    saveFavorites();
    render();
  });

  await loadRooms();
});

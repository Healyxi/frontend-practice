document.addEventListener("DOMContentLoaded", async () => {
  const { fetchJson, showAlert, freeSeats } = CampusData;

  try {
    const data = await fetchJson("data/studyrooms.json");
    const rooms = Array.isArray(data.rooms) ? data.rooms : [];

    if (rooms.length === 0) {
      showAlert("#pageStatus", "warning", "暂无自习室数据，请检查 data/studyrooms.json。");
      return;
    }

    const openRooms = rooms.filter(room => room.status === "开放");
    const free = openRooms.reduce((sum, room) => sum + freeSeats(room), 0);

    document.querySelector("#sum-total").textContent = `${rooms.length} 间`;
    document.querySelector("#sum-open").textContent = `${openRooms.length} 间`;
    document.querySelector("#sum-free").textContent = `${free} 座`;
    document.querySelector("#data-note").textContent =
      `数据来源：${data.source || "课程统一数据集"}。剩余空座只统计开放中的自习室。`;
  } catch (error) {
    showAlert("#pageStatus", "danger", `首页数据加载失败：${error.message}`);
  }
});

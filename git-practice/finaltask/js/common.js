window.CampusData = (() => {
  "use strict";

  const htmlEscapes = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  };

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, ch => htmlEscapes[ch]);
  }

  async function fetchJson(path) {
    let response;

    try {
      response = await fetch(path, { cache: "no-store" });
    } catch (error) {
      throw new Error("网络请求失败，请使用本地服务器打开页面。");
    }

    if (!response.ok) {
      throw new Error(`数据加载失败（HTTP ${response.status}）：${path}`);
    }

    try {
      return await response.json();
    } catch (error) {
      throw new Error(`数据文件不是合法 JSON：${path}`);
    }
  }

  function showAlert(selector, type, message) {
    const element = document.querySelector(selector);
    if (!element) return;

    element.className = `alert alert-${type}`;
    element.textContent = message;
    element.hidden = false;
  }

  function hideAlert(selector) {
    const element = document.querySelector(selector);
    if (element) element.hidden = true;
  }

  function rate(room) {
    const seats = Number(room.seats) || 0;
    const occupied = Number(room.occupied) || 0;
    return seats > 0 ? Math.min(100, Math.round((occupied / seats) * 100)) : 0;
  }

  function freeSeats(room) {
    const seats = Number(room.seats) || 0;
    const occupied = Number(room.occupied) || 0;
    return Math.max(0, seats - occupied);
  }

  return {
    fetchJson,
    showAlert,
    hideAlert,
    escapeHtml,
    rate,
    freeSeats
  };
})();

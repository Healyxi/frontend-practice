(() => {
  "use strict";

  const {
    fetchJson,
    escapeHtml,
    rate,
    freeSeats
  } = CampusData;

  const scene = document.querySelector("#campusScene");
  const buildingMount = document.querySelector("#campusBuildings");
  const sceneStatus = document.querySelector("#sceneStatus");
  const infoPanel = document.querySelector("#infoPanel");
  const infoCode = document.querySelector("#infoCode");
  const infoTitle = document.querySelector("#infoTitle");
  const infoBody = document.querySelector("#infoBody");

  const layouts = {
    "图书馆": {
      x: -6.4,
      z: -1.5,
      code: "LIB",
      width: 4.4,
      depth: 3,
      accent: "#315b80"
    },
    "信息学院": {
      x: 0,
      z: -8.5,
      code: "INFO",
      width: 3.4,
      depth: 2.3,
      height: 3.6,
      accent: "#5b829e"
    },
    "楠苑": {
      x: 6.4,
      z: -1.5,
      code: "NAN",
      width: 3.7,
      depth: 2.5,
      accent: "#7d684e"
    }
  };

  function setSceneStatus(message, isError = false) {
    sceneStatus.textContent = message;
    sceneStatus.classList.toggle("is-error", isError);
  }

  function openRooms(rooms) {
    return rooms.filter(room => room.status === "开放");
  }

  function aggregate(rooms) {
    const open = openRooms(rooms);
    const seats = open.reduce((sum, room) => {
      return sum + (Number(room.seats) || 0);
    }, 0);
    const occupied = open.reduce((sum, room) => {
      return sum + (Number(room.occupied) || 0);
    }, 0);
    const free = open.reduce((sum, room) => {
      return sum + freeSeats(room);
    }, 0);

    return {
      seats,
      occupied,
      free,
      count: rooms.length,
      openCount: open.length,
      rate: seats ? Math.round((occupied / seats) * 100) : 0
    };
  }

  function buildingColor(rooms) {
    const summary = aggregate(rooms);

    if (summary.openCount === 0) return "#9aa7a2";
    if (summary.rate >= 85) return "#c75c50";
    if (summary.rate >= 65) return "#d9a441";
    return "#4f9b75";
  }

  function statusBadgeClass(status) {
    if (status === "开放") return "text-bg-success";
    if (status === "维修") return "text-bg-warning";
    return "text-bg-secondary";
  }

  function addBox(parent, options) {
    const box = document.createElement("a-box");
    box.setAttribute("geometry", {
      primitive: "box",
      width: options.width,
      height: options.height,
      depth: options.depth
    });
    box.setAttribute("material", {
      color: options.color,
      roughness: options.roughness ?? 0.82,
      metalness: options.metalness ?? 0.03,
      opacity: options.opacity ?? 1,
      transparent: Boolean(options.opacity && options.opacity < 1)
    });
    box.setAttribute("position", {
      x: options.x ?? 0,
      y: options.y ?? 0,
      z: options.z ?? 0
    });
    parent.appendChild(box);
    return box;
  }

  function addTree(x, z, scale = 1) {
    const tree = document.createElement("a-entity");
    tree.setAttribute("position", { x, y: 0, z });
    tree.setAttribute("scale", {
      x: scale,
      y: scale,
      z: scale
    });

    const trunk = document.createElement("a-cylinder");
    trunk.setAttribute("radius", 0.07);
    trunk.setAttribute("height", 0.75);
    trunk.setAttribute("color", "#715a3f");
    trunk.setAttribute("position", "0 0.38 0");

    const crown = document.createElement("a-sphere");
    crown.setAttribute("radius", 0.43);
    crown.setAttribute("color", "#4f8c5c");
    crown.setAttribute("position", "0 1.05 0");

    tree.appendChild(trunk);
    tree.appendChild(crown);
    buildingMount.appendChild(tree);
  }

  function createLabel(parent, code, height) {
    const label = document.createElement("a-text");
    label.setAttribute("value", code);
    label.setAttribute("align", "center");
    label.setAttribute("width", 4);
    label.setAttribute("color", "#17324d");
    label.setAttribute("position", {
      x: 0,
      y: height + 0.56,
      z: 0
    });
    label.setAttribute("scale", {
      x: 1.15,
      y: 1.15,
      z: 1.15
    });
    parent.appendChild(label);
  }

  function createBuilding(name, config, rooms) {
    const group = document.createElement("a-entity");
    group.setAttribute("position", {
      x: config.x,
      y: 0,
      z: config.z
    });

    const isDataBuilding = Array.isArray(rooms) && rooms.length > 0;
    const maxFloor = isDataBuilding
      ? Math.max(1, ...rooms.map(room => Number(room.floor) || 1))
      : 3;
    const height = isDataBuilding
      ? 1.2 + maxFloor * 0.58
      : config.height;
    const color = isDataBuilding
      ? buildingColor(rooms)
      : "#a9bac4";

    const main = addBox(group, {
      width: config.width,
      height,
      depth: config.depth,
      y: height / 2,
      color,
      roughness: 0.76,
      metalness: 0.08
    });

    main.classList.add("clickable");
    main.setAttribute("data-building", name);
    main.addEventListener("click", () => {
      if (name === "信息学院") {
        showInfoCollege();
        return;
      }

      showDataBuilding(name, config.code, rooms || []);
    });

    for (let floor = 1; floor < maxFloor; floor += 1) {
      addBox(group, {
        width: config.width * 0.84,
        height: 0.08,
        depth: 0.05,
        x: 0,
        y: floor * (height / maxFloor),
        z: config.depth / 2 + 0.03,
        color: "#e7f1ff",
        roughness: 0.5,
        opacity: 0.9
      });
    }

    for (let floor = 0; floor < maxFloor; floor += 1) {
      for (let column = -1; column <= 1; column += 1) {
        addBox(group, {
          width: 0.4,
          height: 0.25,
          depth: 0.05,
          x: column * 0.72,
          y: (floor + 0.57) * (height / maxFloor),
          z: config.depth / 2 + 0.04,
          color: "#d7ebfa",
          roughness: 0.42,
          opacity: 0.9
        });
      }
    }

    addBox(group, {
      width: config.width * 0.78,
      height: 0.16,
      depth: config.depth + 0.18,
      y: height + 0.08,
      color: "#294c5d"
    });

    addBox(group, {
      width: 0.58,
      height: 0.88,
      depth: 0.07,
      y: 0.45,
      z: config.depth / 2 + 0.05,
      color: config.accent
    });

    if (name === "图书馆") {
      addBox(group, {
        width: 3.7,
        height: 0.16,
        depth: 0.65,
        y: 0.08,
        z: config.depth / 2 + 0.54,
        color: "#f1f4f5"
      });
    }

    if (name === "楠苑") {
      for (let floor = 1; floor < maxFloor; floor += 1) {
        addBox(group, {
          width: config.width * 0.94,
          height: 0.06,
          depth: 0.38,
          y: floor * (height / maxFloor) + 0.12,
          z: config.depth / 2 + 0.2,
          color: "#e3dccf",
          roughness: 0.9
        });
      }
    }

    createLabel(group, config.code, height);
    buildingMount.appendChild(group);
  }

  function showDataBuilding(name, code, rooms) {
    const summary = aggregate(rooms);

    const roomRows = rooms.map(room => {
      const freeText = room.status === "开放"
        ? `${freeSeats(room)} 座空余`
        : "暂不可用";

      return `
        <li class="scene-room-row">
          <div>
            <strong>${escapeHtml(room.name)}</strong>
            <small>
              ${Number(room.floor) || "—"} 层 ${escapeHtml(room.hours)}
              ${escapeHtml(freeText)}
            </small>
          </div>
          <span class="badge ${statusBadgeClass(room.status)}">
            ${rate(room)}%
          </span>
        </li>
      `;
    }).join("");

    infoCode.textContent = code;
    infoTitle.textContent = name;
    infoBody.innerHTML = `
      <div class="scene-metrics">
        <div><strong>${summary.rate}%</strong><span>开放区上座率</span></div>
        <div><strong>${summary.free}</strong><span>开放区空座</span></div>
        <div><strong>${summary.count}</strong><span>自习室数量</span></div>
      </div>
      <ul class="scene-room-list">
        ${roomRows}
      </ul>
    `;
    infoPanel.hidden = false;
  }

  function showInfoCollege() {
    infoCode.textContent = "INFO";
    infoTitle.textContent = "信息学院";
    infoBody.innerHTML = `
      <p class="scene-info-text">
        信息学院是呈贡校区的教学与实验空间，在三维场景中作为校园位置参照。
      </p>
      <p class="scene-info-text mb-0">
        当前自习室数据集中没有信息学院房间，因此该楼栋不显示上座率和座位数据。
      </p>
    `;
    infoPanel.hidden = false;
  }

  function fitCamera() {
    const portrait = window.innerWidth < 768;
    const camera = document.querySelector("#mainCamera");
    const rig = document.querySelector("#cameraRig");

    camera.setAttribute("fov", portrait ? 82 : 66);
    rig.setAttribute("position", {
      x: 0,
      y: 1.65,
      z: portrait ? 15 : 11
    });
  }

  function addCampusDecor() {
    [
      [-11.6, 4.5, 0.9],
      [-10.8, -3.5, 0.75],
      [9.2, 3.2, 1],
      [8.4, 2.2, 0.8],
      [-8.4, 4.5, 0.75],
      [-4.4, 4.5, 0.8],
      [-10, -7, 1],
      [10, -7, 0.9]
    ].forEach(([x, z, scale]) => addTree(x, z, scale));
  }

  async function init() {
    try {
      if (!window.AFRAME) {
        throw new Error("A-Frame 未加载，请检查 libs/aframe.min.js。");
      }

      const data = await fetchJson("../data/studyrooms.json");
      const rooms = Array.isArray(data.rooms) ? data.rooms : [];

      if (rooms.length === 0) {
        throw new Error("暂无自习室数据，无法生成三维楼栋。");
      }

      const groups = new Map();

      rooms.forEach(room => {
        if (!groups.has(room.building)) {
          groups.set(room.building, []);
        }
        groups.get(room.building).push(room);
      });

      createBuilding("图书馆", layouts["图书馆"], groups.get("图书馆") || []);
      createBuilding("信息学院", layouts["信息学院"], null);
      createBuilding("楠苑", layouts["楠苑"], groups.get("楠苑") || []);

      addCampusDecor();
      setSceneStatus("楼栋颜色表示开放区上座率。点击 LIB、INFO 或 NAN 查看说明。");
    } catch (error) {
      setSceneStatus(`三维场景加载失败：${error.message}`, true);
    }
  }

  document.querySelector("#closeInfo").addEventListener("click", () => {
    infoPanel.hidden = true;
  });

  fitCamera();
  window.addEventListener("resize", fitCamera);

  if (scene.hasLoaded) {
    init();
  } else {
    scene.addEventListener("loaded", init, { once: true });
  }
})();

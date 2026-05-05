const menuToggle = document.querySelector("[data-menu-toggle]");
const siteNav = document.querySelector("[data-site-nav]");

if (menuToggle && siteNav) {
  menuToggle.addEventListener("click", () => {
    const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!isOpen));
    siteNav.classList.toggle("is-open", !isOpen);
  });

  siteNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      menuToggle.setAttribute("aria-expanded", "false");
      siteNav.classList.remove("is-open");
    });
  });
}

const revealItems = document.querySelectorAll("[data-reveal]");

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.2,
    }
  );

  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

const homeCanvas = document.querySelector("[data-home-canvas]");

if (homeCanvas) {
  const ctx = homeCanvas.getContext("2d", {
    alpha: false,
    desynchronized: true,
  });

  if (ctx) {
    const PHI = (1 + Math.sqrt(5)) / 2;
    const baseWidth = 680;
    const baseHeight = 520;
    const rawVerts = [];

    for (const s1 of [-1, 1]) {
      for (const s2 of [-1, 1]) {
        for (const s3 of [-1, 1]) {
          rawVerts.push([s1, s2, s3]);
        }
      }
    }

    for (const s1 of [-1, 1]) {
      for (const s2 of [-1, 1]) {
        rawVerts.push([0, s1 / PHI, s2 * PHI]);
        rawVerts.push([s1 / PHI, s2 * PHI, 0]);
        rawVerts.push([s1 * PHI, 0, s2 / PHI]);
      }
    }

    const normalize = (vector) => {
      const magnitude = Math.hypot(...vector);

      return vector.map((value) => value / magnitude);
    };

    const verts = rawVerts.map((vector) => normalize(vector));
    const edges = [];

    for (let i = 0; i < verts.length; i += 1) {
      for (let j = i + 1; j < verts.length; j += 1) {
        edges.push([i, j]);
      }
    }

    const rotateX = (vector, angle) => {
      const [x, y, z] = vector;

      return [
        x,
        y * Math.cos(angle) - z * Math.sin(angle),
        y * Math.sin(angle) + z * Math.cos(angle),
      ];
    };

    const rotateY = (vector, angle) => {
      const [x, y, z] = vector;

      return [
        x * Math.cos(angle) + z * Math.sin(angle),
        y,
        -x * Math.sin(angle) + z * Math.cos(angle),
      ];
    };

    const rotateZ = (vector, angle) => {
      const [x, y, z] = vector;

      return [
        x * Math.cos(angle) - y * Math.sin(angle),
        x * Math.sin(angle) + y * Math.cos(angle),
        z,
      ];
    };

    let width = baseWidth;
    let height = baseHeight;
    let animationFrameId = 0;
    let lastFrameTime = 0;
    let resizeObserver;
    let hasInitializedCanvas = false;

    let rx = 0.4;
    let ry = 0.6;
    let rz = 0.2;
    let vrx = 0.008;
    let vry = 0.012;
    let vrz = 0.006;
    let px = width / 2;
    let py = height / 2;
    let pz = 0;
    let vx = 2.5;
    let vy = 2.1;
    let vz = 1.9;

    const resizeCanvas = () => {
      const rect = homeCanvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

      width = Math.max(320, Math.round(rect.width));
      height = Math.max(320, Math.round(rect.height));
      homeCanvas.width = Math.round(width * dpr);
      homeCanvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (!hasInitializedCanvas) {
        px = width / 2;
        py = height / 2;
        hasInitializedCanvas = true;
      } else {
        px = Math.min(Math.max(px, 0), width);
        py = Math.min(Math.max(py, 0), height);
      }
    };

    const project = (vector, fov, camZ) => {
      const scale = fov / (fov + camZ - vector[2]);

      return [vector[0] * scale, vector[1] * scale, vector[2], scale];
    };

    const getProjectedState = (centerX, centerY, centerZ, radius, fov, camZ, rotation) => {
      const transformed = new Array(verts.length);
      const projected = new Array(verts.length);
      let minX = Number.POSITIVE_INFINITY;
      let maxX = Number.NEGATIVE_INFINITY;
      let minY = Number.POSITIVE_INFINITY;
      let maxY = Number.NEGATIVE_INFINITY;

      verts.forEach((vector, index) => {
        let x = vector[0] * radius;
        let y = vector[1] * radius;
        let z = vector[2] * radius;

        const xRotX = x;
        const yRotX = y * rotation.cosX - z * rotation.sinX;
        const zRotX = y * rotation.sinX + z * rotation.cosX;

        const xRotY = xRotX * rotation.cosY + zRotX * rotation.sinY;
        const yRotY = yRotX;
        const zRotY = -xRotX * rotation.sinY + zRotX * rotation.cosY;

        const xRotZ = xRotY * rotation.cosZ - yRotY * rotation.sinZ;
        const yRotZ = xRotY * rotation.sinZ + yRotY * rotation.cosZ;
        const zRotZ = zRotY;

        x = xRotZ + (centerX - width / 2);
        y = yRotZ + (centerY - height / 2);
        z = zRotZ + centerZ;

        transformed[index] = [x, y, z];

        const point = project(transformed[index], fov, camZ);
        projected[index] = point;

        const pointRadius = Math.max(1.5, point[3] * 3);
        const screenX = point[0] + width / 2;
        const screenY = point[1] + height / 2;

        minX = Math.min(minX, screenX - pointRadius);
        maxX = Math.max(maxX, screenX + pointRadius);
        minY = Math.min(minY, screenY - pointRadius);
        maxY = Math.max(maxY, screenY + pointRadius);
      });

      return {
        transformed,
        projected,
        minX,
        maxX,
        minY,
        maxY,
      };
    };

    const render = (now = 0) => {
      const frameDelta = lastFrameTime ? Math.min(32, now - lastFrameTime) : 16.67;
      const deltaFactor = frameDelta / 16.67;

      lastFrameTime = now;

      const baseScale = Math.min(width / baseWidth, height / baseHeight);
      const fov = 650 * baseScale;
      const camZ = 500 * baseScale;
      const radius = 98 * baseScale;
      const edgeInset = 10 * baseScale;
      const depth = 500 * baseScale;

      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, width, height);

      rx += vrx * deltaFactor;
      ry += vry * deltaFactor;
      rz += vrz * deltaFactor;

      const rotation = {
        sinX: Math.sin(rx),
        cosX: Math.cos(rx),
        sinY: Math.sin(ry),
        cosY: Math.cos(ry),
        sinZ: Math.sin(rz),
        cosZ: Math.cos(rz),
      };

      let nextPx = px + vx * baseScale * deltaFactor;
      let nextPy = py + vy * baseScale * deltaFactor;
      let nextPz = pz + vz * baseScale * deltaFactor;

      if (nextPz < -depth / 2) {
        nextPz = -depth / 2;
        vz = Math.abs(vz);
      }

      if (nextPz > depth / 2) {
        nextPz = depth / 2;
        vz = -Math.abs(vz);
      }

      let state = getProjectedState(nextPx, nextPy, nextPz, radius, fov, camZ, rotation);

      if (state.minX < edgeInset) {
        nextPx += edgeInset - state.minX;
        vx = Math.abs(vx);
        state = getProjectedState(nextPx, nextPy, nextPz, radius, fov, camZ, rotation);
      }

      if (state.maxX > width - edgeInset) {
        nextPx -= state.maxX - (width - edgeInset);
        vx = -Math.abs(vx);
        state = getProjectedState(nextPx, nextPy, nextPz, radius, fov, camZ, rotation);
      }

      if (state.minY < edgeInset) {
        nextPy += edgeInset - state.minY;
        vy = Math.abs(vy);
        state = getProjectedState(nextPx, nextPy, nextPz, radius, fov, camZ, rotation);
      }

      if (state.maxY > height - edgeInset) {
        nextPy -= state.maxY - (height - edgeInset);
        vy = -Math.abs(vy);
        state = getProjectedState(nextPx, nextPy, nextPz, radius, fov, camZ, rotation);
      }

      px = nextPx;
      py = nextPy;
      pz = nextPz;

      const { transformed, projected } = state;
      const sortedEdges = edges
        .map(([i, j]) => ({
          i,
          j,
          depthMidpoint: (transformed[i][2] + transformed[j][2]) / 2,
        }))
        .sort((a, b) => a.depthMidpoint - b.depthMidpoint);

      sortedEdges.forEach(({ i, j, depthMidpoint }) => {
        const start = projected[i];
        const end = projected[j];
        const depthAmount = Math.max(
          0,
          Math.min(1, (depthMidpoint + depth / 2 + camZ) / (depth + camZ))
        );
        const alpha = 0.08 + depthAmount * 0.55;

        ctx.beginPath();
        ctx.moveTo(start[0] + width / 2, start[1] + height / 2);
        ctx.lineTo(end[0] + width / 2, end[1] + height / 2);
        ctx.lineWidth = Math.max(0.3, ((start[3] + end[3]) / 2) * 1.2);
        ctx.strokeStyle = `rgba(255,255,255,${alpha.toFixed(2)})`;
        ctx.stroke();
      });

      projected.forEach((point, index) => {
        const depthAmount = Math.max(
          0,
          Math.min(1, (transformed[index][2] + depth / 2 + camZ) / (depth + camZ))
        );

        ctx.beginPath();
        ctx.arc(
          point[0] + width / 2,
          point[1] + height / 2,
          Math.max(1.5, point[3] * 3),
          0,
          Math.PI * 2
        );
        ctx.fillStyle = `rgba(255,255,255,${(0.4 + depthAmount * 0.6).toFixed(2)})`;
        ctx.fill();
      });

      animationFrameId = window.requestAnimationFrame(render);
    };

    resizeCanvas();
    animationFrameId = window.requestAnimationFrame(render);

    if ("ResizeObserver" in window) {
      resizeObserver = new ResizeObserver(() => {
        resizeCanvas();
      });
      resizeObserver.observe(homeCanvas);
    } else {
      window.addEventListener("resize", resizeCanvas);
    }
  }
}

const workTriggers = document.querySelectorAll("[data-work-trigger]");
const workModal = document.querySelector("[data-work-modal]");

if (workTriggers.length && workModal) {
  const modalImage = workModal.querySelector("[data-work-modal-image]");
  const modalAsset = workModal.querySelector("[data-work-modal-asset]");
  const modalTitle = workModal.querySelector("[data-work-modal-title]");
  const modalMeta = workModal.querySelector("[data-work-modal-meta]");
  const modalDescription = workModal.querySelector("[data-work-modal-description]");
  const closeButtons = workModal.querySelectorAll("[data-work-close]");
  const closeButton = workModal.querySelector(".work-modal__close");
  let activeTrigger = null;

  const closeWorkModal = () => {
    workModal.hidden = true;
    document.body.classList.remove("modal-open");

    if (activeTrigger) {
      activeTrigger.focus();
      activeTrigger = null;
    }
  };

  const openWorkModal = (trigger) => {
    const card = trigger.closest(".work-card");
    const image = card?.querySelector(".work-image");
    const imageAsset = image?.querySelector(".work-image__asset");
    const title = card?.querySelector(".work-copy h2");
    const meta = card?.querySelector(".work-meta");
    const description = card?.querySelector(".work-description");

    if (!card || !image || !title || !meta) {
      return;
    }

    activeTrigger = trigger;
    modalImage.className = "work-modal__image";
    modalImage.style.backgroundImage = "";
    modalAsset.hidden = true;
    modalAsset.removeAttribute("src");
    modalAsset.alt = "";

    if (imageAsset) {
      modalImage.classList.add("work-modal__image--photo");
      modalAsset.hidden = false;
      modalAsset.src = imageAsset.dataset.workModalSrc || imageAsset.currentSrc || imageAsset.src;
      modalAsset.alt = imageAsset.alt || title.textContent.trim();
    } else {
      image.classList.forEach((className) => {
        if (className.startsWith("work-image--")) {
          modalImage.classList.add(className);
        }
      });
    }

    modalTitle.textContent = title.textContent.trim();
    modalMeta.textContent = meta.textContent.trim();

    if (description) {
      modalDescription.textContent = description.textContent.trim();
      modalDescription.hidden = false;
    } else {
      modalDescription.textContent = "";
      modalDescription.hidden = true;
    }

    workModal.hidden = false;
    document.body.classList.add("modal-open");
    closeButton?.focus();
  };

  workTriggers.forEach((trigger) => {
    trigger.addEventListener("click", () => openWorkModal(trigger));
  });

  closeButtons.forEach((button) => {
    button.addEventListener("click", closeWorkModal);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !workModal.hidden) {
      closeWorkModal();
    }
  });
}

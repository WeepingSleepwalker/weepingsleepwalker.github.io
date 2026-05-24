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

const toricCanvases = document.querySelectorAll("[data-toric-canvas]");

toricCanvases.forEach((canvas) => {
  const ctx = canvas.getContext("2d", {
    alpha: false,
    desynchronized: true,
  });
  const resetButton = canvas
    .closest(".contact-card--animation")
    ?.querySelector("[data-toric-reset]");

  if (!ctx) {
    return;
  }

  const ripples = [];
  const particles = [];

  let width = 680;
  let height = 520;
  let centerX = width / 2;
  let baseY = height - 100;
  let fov = 500;
  let torusRadius = 110;
  let tick = 0;
  let lastSpawn = 0;
  let resizeObserver;
  let streamCount = 48;
  let streamSpeed = 11.5;
  let gravity = 0.19;
  let launchSpread = 0.32;
  let spawnInterval = 3;
  let tailLength = 6;

  const project = (x3, y3, z3) => {
    const scale = fov / (fov + z3 + height * 0.38);

    return {
      x: centerX + x3 * scale,
      y: baseY + y3 * scale,
      scale,
    };
  };

  const spawnStream = (streamIndex) => {
    const angle = (streamIndex / streamCount) * Math.PI * 2;
    const horizontalSpeed = streamSpeed * launchSpread;
    const verticalSpeed =
      -streamSpeed * Math.sqrt(1 - launchSpread * launchSpread);

    particles.push({
      x: 0,
      y: -5,
      z: 0,
      vx: Math.cos(angle) * horizontalSpeed,
      vy: verticalSpeed,
      vz: Math.sin(angle) * horizontalSpeed,
      size: 1.8,
      landed: false,
      tail: [],
    });
  };

  const spawnRipple = (px, pz) => {
    ripples.push({
      px,
      pz,
      r: 2,
      maxR: torusRadius * 0.32,
      alpha: 0.7,
      speed: Math.max(0.9, torusRadius * 0.008),
    });
  };

  const resetScene = () => {
    ripples.length = 0;
    particles.length = 0;
    tick = 0;
    lastSpawn = 0;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, width, height);
  };

  const resizeCanvas = () => {
    const rect = canvas.getBoundingClientRect();
    const compactLayout = rect.width <= 720;
    const dpr = Math.min(window.devicePixelRatio || 1, compactLayout ? 1.25 : 1.5);

    if (!rect.width || !rect.height) {
      return;
    }

    width = Math.round(rect.width);
    height = Math.round(rect.height);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    streamCount = compactLayout ? 32 : 48;
    streamSpeed = compactLayout ? 9.4 : 11.5;
    gravity = compactLayout ? 0.16 : 0.19;
    launchSpread = compactLayout ? 0.28 : 0.32;
    spawnInterval = compactLayout ? 4 : 3;
    tailLength = compactLayout ? 4 : 6;
    centerX = width / 2;
    baseY = height - Math.max(compactLayout ? 58 : 92, height * (compactLayout ? 0.12 : 0.16));
    fov = compactLayout
      ? Math.min(width * 1.15, height * 1.05)
      : Math.min(width * 0.9, height * 1.25);
    torusRadius = compactLayout
      ? Math.min(width * 0.3, height * 0.24)
      : Math.min(width * 0.24, height * 0.21);

    resetScene();
  };

  const render = () => {
    ctx.fillStyle = "rgba(0,0,0,0.2)";
    ctx.fillRect(0, 0, width, height);

    tick += 1;

    if (tick - lastSpawn >= spawnInterval) {
      for (let index = 0; index < streamCount; index += 1) {
        spawnStream(index);
      }
      lastSpawn = tick;
    }

    for (let index = ripples.length - 1; index >= 0; index -= 1) {
      const ripple = ripples[index];
      ripple.r += ripple.speed;
      ripple.alpha -= 0.014;

      if (ripple.alpha <= 0 || ripple.r > ripple.maxR) {
        ripples.splice(index, 1);
        continue;
      }

      const left = project(ripple.px - ripple.r, 0, ripple.pz);
      const right = project(ripple.px + ripple.r, 0, ripple.pz);
      const front = project(ripple.px, 0, ripple.pz + ripple.r);
      const back = project(ripple.px, 0, ripple.pz - ripple.r);
      const radiusX = (right.x - left.x) / 2;
      const radiusY = (front.y - back.y) / 2;
      const rippleX = (right.x + left.x) / 2;
      const rippleY = (front.y + back.y) / 2;

      ctx.beginPath();
      ctx.ellipse(
        rippleX,
        rippleY,
        Math.max(1, radiusX),
        Math.max(0.5, radiusY),
        0,
        0,
        Math.PI * 2
      );
      ctx.strokeStyle = `rgba(180,215,255,${ripple.alpha.toFixed(2)})`;
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }

    for (let index = particles.length - 1; index >= 0; index -= 1) {
      const particle = particles[index];

      if (particle.landed) {
        particles.splice(index, 1);
        continue;
      }

      particle.tail.push({ x: particle.x, y: particle.y, z: particle.z });
      if (particle.tail.length > tailLength) {
        particle.tail.shift();
      }

      particle.vy += gravity;
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.z += particle.vz;

      if (particle.y >= 0) {
        particle.y = 0;
        particle.landed = true;
        spawnRipple(particle.x, particle.z);
        continue;
      }

      for (let tailIndex = 0; tailIndex < particle.tail.length; tailIndex += 1) {
        const tailPoint = particle.tail[tailIndex];
        const projection = project(tailPoint.x, tailPoint.y, tailPoint.z);
        const alpha = (tailIndex / particle.tail.length) * 0.35;
        const size = Math.max(0.3, particle.size * 0.5 * projection.scale * 3);

        ctx.beginPath();
        ctx.arc(projection.x, projection.y, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200,225,255,${alpha.toFixed(2)})`;
        ctx.fill();
      }

      const projection = project(particle.x, particle.y, particle.z);
      const size = Math.max(0.8, particle.size * projection.scale * 3);

      ctx.beginPath();
      ctx.arc(projection.x, projection.y, size, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.95)";
      ctx.fill();
    }

    const spoutGlow = ctx.createRadialGradient(
      centerX,
      baseY,
      0,
      centerX,
      baseY,
      Math.max(28, torusRadius * 0.22)
    );
    spoutGlow.addColorStop(0, "rgba(200,230,255,0.45)");
    spoutGlow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = spoutGlow;
    ctx.beginPath();
    ctx.arc(centerX, baseY, Math.max(28, torusRadius * 0.22), 0, Math.PI * 2);
    ctx.fill();

    const ringGlow = ctx.createRadialGradient(
      centerX,
      baseY,
      torusRadius * 0.55 - 15,
      centerX,
      baseY,
      torusRadius * 0.55 + 15
    );
    ringGlow.addColorStop(0, "rgba(0,0,0,0)");
    ringGlow.addColorStop(0.5, "rgba(150,200,255,0.07)");
    ringGlow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = ringGlow;
    ctx.beginPath();
    ctx.ellipse(
      centerX,
      baseY,
      torusRadius * 0.9,
      torusRadius * 0.28,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();

    window.requestAnimationFrame(render);
  };

  resizeCanvas();
  window.requestAnimationFrame(render);

  if (resetButton) {
    resetButton.addEventListener("click", () => {
      resetScene();
    });
  }

  if ("ResizeObserver" in window) {
    resizeObserver = new ResizeObserver(() => {
      resizeCanvas();
    });
    resizeObserver.observe(canvas);
  } else {
    window.addEventListener("resize", resizeCanvas);
  }
});

const workTriggers = document.querySelectorAll("[data-work-trigger]");
const workModal = document.querySelector("[data-work-modal]");

if (workTriggers.length && workModal) {
  const modalImage = workModal.querySelector("[data-work-modal-image]");
  const modalAsset = workModal.querySelector("[data-work-modal-asset]");
  const modalTitle = workModal.querySelector("[data-work-modal-title]");
  const modalMeta = workModal.querySelector("[data-work-modal-meta]");
  const modalDescription = workModal.querySelector("[data-work-modal-description]");
  const modalCounter = workModal.querySelector("[data-work-modal-counter]");
  const prevButton = workModal.querySelector("[data-work-modal-prev]");
  const nextButton = workModal.querySelector("[data-work-modal-next]");
  const closeButtons = workModal.querySelectorAll("[data-work-close]");
  const closeButton = workModal.querySelector(".work-modal__close");
  let activeTrigger = null;
  let galleryItems = [];
  let activeGalleryIndex = 0;

  const setModalPlaceholderState = (image) => {
    modalImage.className = "work-modal__image";
    modalImage.style.backgroundImage = "";
    modalAsset.hidden = true;
    modalAsset.removeAttribute("src");
    modalAsset.alt = "";

    image.classList.forEach((className) => {
      if (className.startsWith("work-image--")) {
        modalImage.classList.add(className);
      }
    });
  };

  const updateGalleryControls = () => {
    const hasGallery = galleryItems.length > 1;

    if (prevButton) {
      prevButton.hidden = !hasGallery;
      prevButton.disabled = !hasGallery;
    }

    if (nextButton) {
      nextButton.hidden = !hasGallery;
      nextButton.disabled = !hasGallery;
    }

    if (modalCounter) {
      modalCounter.hidden = galleryItems.length <= 1;

      if (galleryItems.length > 1) {
        modalCounter.textContent = `${activeGalleryIndex + 1} / ${galleryItems.length}`;
      } else {
        modalCounter.textContent = "";
      }
    }
  };

  const renderActiveGalleryItem = () => {
    if (!galleryItems.length) {
      updateGalleryControls();
      return;
    }

    const currentItem = galleryItems[activeGalleryIndex];
    modalImage.className = "work-modal__image work-modal__image--photo";
    modalImage.style.backgroundImage = "";
    modalAsset.hidden = false;
    modalAsset.src = currentItem.src;
    modalAsset.alt = currentItem.alt || modalTitle.textContent || "";
    updateGalleryControls();
  };

  const stepGallery = (direction) => {
    if (galleryItems.length <= 1) {
      return;
    }

    activeGalleryIndex =
      (activeGalleryIndex + direction + galleryItems.length) % galleryItems.length;
    renderActiveGalleryItem();
  };

  const closeWorkModal = () => {
    workModal.hidden = true;
    document.body.classList.remove("modal-open");
    galleryItems = [];
    activeGalleryIndex = 0;

    if (activeTrigger) {
      activeTrigger.focus();
      activeTrigger = null;
    }
  };

  const openWorkModal = (trigger) => {
    const card = trigger.closest(".work-card");
    const image = card?.querySelector(".work-image");
    const imageAsset = image?.querySelector(".work-image__asset");
    const gallery = card?.querySelector(".work-gallery");
    const galleryImages = gallery
      ? Array.from(gallery.querySelectorAll(".work-gallery__item"))
      : [];
    const title = card?.querySelector(".work-copy h2");
    const meta = card?.querySelector(".work-meta");
    const description = card?.querySelector(".work-description");

    if (!card || !image || !title || !meta) {
      return;
    }

    activeTrigger = trigger;
    modalTitle.textContent = title.textContent.trim();
    modalMeta.textContent = meta.textContent.trim();

    if (description) {
      modalDescription.textContent = description.textContent.trim();
      modalDescription.hidden = false;
    } else {
      modalDescription.textContent = "";
      modalDescription.hidden = true;
    }

    galleryItems = [];
    activeGalleryIndex = 0;

    if (imageAsset) {
      const seenSources = new Set();
      const primarySource =
        imageAsset.dataset.workModalSrc || imageAsset.currentSrc || imageAsset.src;

      if (primarySource) {
        seenSources.add(primarySource);
        galleryItems.push({
          src: primarySource,
          alt: imageAsset.alt || title.textContent.trim(),
        });
      }

      galleryImages.forEach((galleryImage) => {
        const source = galleryImage.currentSrc || galleryImage.src;

        if (!source || seenSources.has(source)) {
          return;
        }

        seenSources.add(source);
        galleryItems.push({
          src: source,
          alt: galleryImage.alt || imageAsset.alt || title.textContent.trim(),
        });
      });
    }

    if (galleryItems.length) {
      renderActiveGalleryItem();
    } else {
      setModalPlaceholderState(image);
      updateGalleryControls();
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

  prevButton?.addEventListener("click", () => {
    stepGallery(-1);
  });

  nextButton?.addEventListener("click", () => {
    stepGallery(1);
  });

  document.addEventListener("keydown", (event) => {
    if (workModal.hidden) {
      return;
    }

    if (event.key === "Escape") {
      closeWorkModal();
      return;
    }

    if (event.key === "ArrowLeft") {
      stepGallery(-1);
      return;
    }

    if (event.key === "ArrowRight") {
      stepGallery(1);
    }
  });
}

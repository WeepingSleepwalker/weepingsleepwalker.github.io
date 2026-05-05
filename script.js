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

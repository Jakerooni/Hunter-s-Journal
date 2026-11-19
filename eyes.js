(() => {
  const script = document.currentScript;
  const gallery = script?.dataset.awake === "true";

  /* SETTINGS */
  const preferredColumns = 3;
  const rowSpacing = 80;
  const maximumWallWidth = 240;
  const contentWidth = 1160;
  const contentGap = 20;

  const canvas = document.createElement("canvas");
  canvas.id = "eye-wall";
  canvas.setAttribute("aria-hidden", "true");
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");

  if (!ctx) {
    canvas.remove();
    return;
  }

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );

  let width = 0;
  let height = 0;
  let eyes = [];
  let frame = 0;
  let lastTime = 0;

  const pointer = {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2
  };

  /*
   * Remember the previous page so Home can start with
   * open eyes when returning from Gallery.
   */
  const storageKey = "hunter-eye-page";

  function readPreviousPage() {
    try {
      return sessionStorage.getItem(storageKey);
    } catch {
      return null;
    }
  }

  function rememberPage() {
    try {
      sessionStorage.setItem(
        storageKey,
        gallery ? "gallery" : "home"
      );
    } catch {
      /* The effect also works when storage is unavailable. */
    }
  }

  const returningFromGallery =
    !gallery && readPreviousPage() === "gallery";

  rememberPage();

  let opening = returningFromGallery ? 1 : 0;
  let glare = 0;

  function contactsOpen() {
    return document.body.classList.contains("messenger-open");
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function seededRandom(seed) {
    return function () {
      seed |= 0;
      seed = (seed + 0x6D2B79F5) | 0;

      let value = Math.imul(
        seed ^ (seed >>> 15),
        1 | seed
      );

      value ^= value + Math.imul(
        value ^ (value >>> 7),
        61 | value
      );

      return (
        ((value ^ (value >>> 14)) >>> 0) / 4294967296
      );
    };
  }

  function buildEyes() {
    width = document.documentElement.clientWidth;
    height = window.innerHeight;

    const ratio = Math.min(
      window.devicePixelRatio || 1,
      2
    );

    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);

    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

    eyes = [];

    if (width <= 900) return;

    const availableSpace = Math.max(
      0,
      (width - contentWidth) / 2 - contentGap
    );

    const wallWidth = Math.min(
      availableSpace,
      maximumWallWidth
    );

    if (wallWidth < 48) return;

    addWall(0, wallWidth, 12345);
    addWall(width - wallWidth, wallWidth, 67890);
  }

  function addWall(startX, wallWidth, seed) {
    const columns = Math.min(
      preferredColumns,
      Math.max(1, Math.floor(wallWidth / 48))
    );

    const cellWidth = wallWidth / columns;
    const rows = Math.ceil(height / rowSpacing);

    for (let column = 0; column < columns; column++) {
      for (let row = 0; row < rows; row++) {
        const random = seededRandom(
          seed + column * 10007 + row * 101
        );

        const between = (min, max) =>
          min + random() * (max - min);

        const eyeWidth = cellWidth * between(0.65, 0.88);
        const eyeHeight = eyeWidth * between(0.4, 0.55);

        eyes.push({
          x:
            startX +
            cellWidth * (column + 0.5) +
            between(-3, 3),

          y:
            28 +
            row * rowSpacing +
            (column % 2) * 18 +
            between(-5, 5),

          width: eyeWidth,
          height: eyeHeight,
          angle: between(-0.22, 0.22),

          blinkOffset: between(0, 9000),
          blinkPeriod: between(6500, 13000),

          tone: Math.round(between(110, 155)),
          gazeX: 0,
          gazeY: 0
        });
      }
    }
  }

  function eyeOutline(halfWidth, halfHeight, intensity) {
    /*
     * Flatten the upper eyelid during the glare.
     * No graphic assets are needed.
     */
    const upperCurve = 1.35 - intensity * 0.65;

    ctx.beginPath();
    ctx.moveTo(-halfWidth, 0);

    ctx.bezierCurveTo(
      -halfWidth * 0.45,
      -halfHeight * upperCurve,
      halfWidth * 0.45,
      -halfHeight * upperCurve,
      halfWidth,
      0
    );

    ctx.bezierCurveTo(
      halfWidth * 0.45,
      halfHeight * 1.15,
      -halfWidth * 0.45,
      halfHeight * 1.15,
      -halfWidth,
      0
    );

    ctx.closePath();
  }

  function drawEye(eye, now, followAmount, contact) {
    const halfWidth = eye.width / 2;
    let eyeOpening = opening;

    /*
     * No blinking while glaring.
     * Gradually suppress blinking as the contact popup opens.
     */
    if (
      gallery &&
      !contact &&
      !reducedMotion.matches &&
      opening > 0.98
    ) {
      const cycle =
        (now + eye.blinkOffset) % eye.blinkPeriod;

      if (cycle < 240) {
        const blink = Math.sin((cycle / 240) * Math.PI);
        eyeOpening *= 1 - blink * 0.96 * (1 - glare);
      }
    }

    ctx.save();
    ctx.translate(eye.x, eye.y);

    /* The eyes straighten while looking toward the viewer. */
    const angle = eye.angle * (1 - glare);
    ctx.rotate(angle);

    const socket = ctx.createRadialGradient(
      0, 0, 1,
      0, 0, halfWidth * 1.2
    );

    socket.addColorStop(0, "#050506");
    socket.addColorStop(1, "rgba(5, 5, 6, 0)");

    ctx.fillStyle = socket;
    ctx.beginPath();

    ctx.ellipse(
      0,
      0,
      halfWidth * 1.25,
      eye.height * 0.8,
      0,
      0,
      Math.PI * 2
    );

    ctx.fill();

    if (eyeOpening < 0.025) {
      ctx.strokeStyle = "#727375";
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      ctx.moveTo(-halfWidth, -2);

      ctx.quadraticCurveTo(
        0,
        eye.height * 0.22,
        halfWidth,
        -2
      );

      ctx.stroke();

      ctx.strokeStyle = "#343638";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-halfWidth * 0.82, -7);

      ctx.quadraticCurveTo(
        0,
        -1,
        halfWidth * 0.82,
        -7
      );

      ctx.stroke();
      ctx.restore();
      return;
    }

    const halfHeight = eye.height * 0.5 * eyeOpening;

    eyeOutline(halfWidth, halfHeight, glare);

    const white = ctx.createLinearGradient(
      0, -halfHeight,
      0, halfHeight
    );

    white.addColorStop(0, "#55585a");
    white.addColorStop(
      0.5,
      `rgb(${eye.tone}, ${eye.tone}, ${eye.tone})`
    );
    white.addColorStop(1, "#55585a");

    ctx.fillStyle = white;
    ctx.fill();

    ctx.save();
    ctx.clip();

    let targetX = 0;
    let targetY = 0;

    /*
     * When Contacts is open, targets remain zero:
     * every iris faces directly forward.
     */
    if (gallery && !contact && !reducedMotion.matches) {
      const dx = pointer.x - eye.x;
      const dy = pointer.y - eye.y;

      const localX =
        dx * Math.cos(angle) + dy * Math.sin(angle);

      const localY =
        -dx * Math.sin(angle) + dy * Math.cos(angle);

      const distance = Math.hypot(localX, localY) || 1;
      const strength = Math.min(distance / 250, 1);

      targetX =
        (localX / distance) *
        halfWidth * 0.32 *
        strength;

      targetY =
        (localY / distance) *
        eye.height * 0.14 *
        strength;
    }

    eye.gazeX += (targetX - eye.gazeX) * followAmount;
    eye.gazeY += (targetY - eye.gazeY) * followAmount;

    const irisRadius = eye.height * 0.31;

    const iris = ctx.createRadialGradient(
      eye.gazeX, eye.gazeY, 1,
      eye.gazeX, eye.gazeY, irisRadius
    );

    iris.addColorStop(0, "#fff1a6");
    iris.addColorStop(0.45, "#d8b951");
    iris.addColorStop(0.8, "#8a6d24");
    iris.addColorStop(1, "#30280f");

    ctx.shadowColor = "#d6b343";
    ctx.shadowBlur = 6 + glare * 4;
    ctx.fillStyle = iris;

    ctx.beginPath();
    ctx.arc(
      eye.gazeX,
      eye.gazeY,
      irisRadius,
      0,
      Math.PI * 2
    );
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = "#060606";
    ctx.beginPath();

    ctx.ellipse(
      eye.gazeX,
      eye.gazeY,
      irisRadius * 0.28,
      irisRadius * 0.75,
      0,
      0,
      Math.PI * 2
    );

    ctx.fill();

    ctx.fillStyle = "#fff4c9";
    ctx.beginPath();

    ctx.arc(
      eye.gazeX - irisRadius * 0.28,
      eye.gazeY - irisRadius * 0.3,
      Math.max(1, irisRadius * 0.12),
      0,
      Math.PI * 2
    );

    ctx.fill();
    ctx.restore();

    eyeOutline(halfWidth, halfHeight, glare);

    ctx.strokeStyle = "#7b7c7d";
    ctx.lineWidth = 1.1;
    ctx.stroke();

    ctx.restore();
  }

  function animate(now) {
    frame = 0;

    if (document.hidden) return;

    const elapsed = lastTime
      ? Math.min(now - lastTime, 50)
      : 16.67;

    lastTime = now;

    const contact = contactsOpen();

    /*
     * 0 = closed, 1 = fully open.
     * Contacts uses a half-open squint.
     */
    const targetOpening = contact ? 0.52 : gallery ? 1 : 0;
    const targetGlare = contact ? 1 : 0;

    const motionAmount = reducedMotion.matches
      ? 1
      : 1 - Math.exp(-elapsed / 240);

    const followAmount = reducedMotion.matches
      ? 1
      : 1 - Math.exp(-elapsed / 100);

    opening += (targetOpening - opening) * motionAmount;
    glare += (targetGlare - glare) * motionAmount;

    if (Math.abs(targetOpening - opening) < 0.001) {
      opening = targetOpening;
    }

    if (Math.abs(targetGlare - glare) < 0.001) {
      glare = targetGlare;
    }

    ctx.clearRect(0, 0, width, height);

    for (const eye of eyes) {
      drawEye(eye, now, followAmount, contact);
    }

    const transitioning =
      opening !== targetOpening ||
      glare !== targetGlare;

    const centering = eyes.some(eye =>
      Math.abs(eye.gazeX) > 0.02 ||
      Math.abs(eye.gazeY) > 0.02
    );

    const tracking = gallery && !contact;

    if (
      eyes.length > 0 &&
      !reducedMotion.matches &&
      (transitioning || tracking || centering)
    ) {
      frame = requestAnimationFrame(animate);
    }
  }

  function wake() {
    if (frame || document.hidden) return;

    lastTime = 0;
    frame = requestAnimationFrame(animate);
  }

  function refresh() {
    cancelAnimationFrame(frame);
    frame = 0;
    lastTime = 0;

    buildEyes();
    wake();
  }

  function resetPointer() {
    pointer.x = width / 2;
    pointer.y = height / 2;
  }

  window.addEventListener("pointermove", event => {
    if (event.pointerType === "touch") return;

    pointer.x = event.clientX;
    pointer.y = event.clientY;
  }, { passive: true });

  window.addEventListener("blur", resetPointer);

  document.documentElement.addEventListener(
    "pointerleave",
    resetPointer
  );

  window.addEventListener("resize", refresh);

  /*
   * The contact script adds/removes messenger-open.
   * Respond immediately when it changes.
   */
  const observer = new MutationObserver(wake);

  observer.observe(document.body, {
    attributes: true,
    attributeFilter: ["class"]
  });

  /*
   * Handle returning with the browser's Back button,
   * including pages restored from its memory cache.
   */
  window.addEventListener("pageshow", event => {
    if (event.persisted) {
      if (!gallery && readPreviousPage() === "gallery") {
        opening = 1;
      }

      rememberPage();
      refresh();
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      cancelAnimationFrame(frame);
      frame = 0;
    } else {
      wake();
    }
  });

  reducedMotion.addEventListener("change", refresh);

  refresh();
})();
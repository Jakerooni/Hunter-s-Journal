(() => {
  const script = document.currentScript;
  const awake = script?.dataset.awake === "true";

  /* SETTINGS YOU CAN CHANGE */
  const preferredColumns = 3; // Maximum columns on EACH side.
  const rowSpacing = 80;     // Increase for fewer eyes.
  const maximumWallWidth = 240;
  const contentWidth = 1160; // Matches main's max-width in CSS.
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

  const start = performance.now();

  const pointer = {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2
  };

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function ease(value) {
    return value * value * (3 - 2 * value);
  }

  /* Same seed gives the same positions on both pages. */
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
    const nextRandom = seededRandom(seed);

    function between(min, max) {
      return min + nextRandom() * (max - min);
    }

    const columns = Math.min(
      preferredColumns,
      Math.max(1, Math.floor(wallWidth / 48))
    );

    const cellWidth = wallWidth / columns;
    const rows = Math.ceil(height / rowSpacing);

    for (let column = 0; column < columns; column++) {
      for (let row = 0; row < rows; row++) {
        /*
         * Each eye gets its own seed.
         * Existing eyes retain their appearance if row count changes.
         */
        const eyeRandom = seededRandom(
          seed + column * 10007 + row * 101
        );

        function eyeBetween(min, max) {
          return min + eyeRandom() * (max - min);
        }

        const eyeWidth =
          cellWidth * eyeBetween(0.65, 0.88);

        const eyeHeight =
          eyeWidth * eyeBetween(0.4, 0.55);

        eyes.push({
          x:
            startX +
            cellWidth * (column + 0.5) +
            eyeBetween(-3, 3),

          y:
            28 +
            row * rowSpacing +
            (column % 2) * 18 +
            eyeBetween(-5, 5),

          width: eyeWidth,
          height: eyeHeight,
          angle: eyeBetween(-0.22, 0.22),

          delay: eyeBetween(0, 900),
          blinkOffset: eyeBetween(0, 9000),
          blinkPeriod: eyeBetween(6500, 13000),

          tone: Math.round(eyeBetween(110, 155)),
          gazeX: 0,
          gazeY: 0
        });
      }
    }
  }

  function eyeOutline(halfWidth, halfHeight) {
    ctx.beginPath();
    ctx.moveTo(-halfWidth, 0);

    ctx.bezierCurveTo(
      -halfWidth * 0.45,
      -halfHeight * 1.35,
      halfWidth * 0.45,
      -halfHeight * 1.35,
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

  function drawEye(eye, now, followAmount) {
    const halfWidth = eye.width / 2;
    let opening = 0;

    if (awake) {
      if (reducedMotion.matches) {
        opening = 1;
      } else {
        const progress = clamp(
          (now - start - eye.delay) / 1200,
          0,
          1
        );

        opening = ease(progress);

        /* Blink only after the initial opening finishes. */
        if (progress >= 1) {
          const cycle =
            (now - start + eye.blinkOffset) %
            eye.blinkPeriod;

          if (cycle < 240) {
            const blink = Math.sin(
              (cycle / 240) * Math.PI
            );

            opening *= 1 - blink * 0.96;
          }
        }
      }
    }

    ctx.save();
    ctx.translate(eye.x, eye.y);
    ctx.rotate(eye.angle);

    /* Dark socket. */
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

    /* Closed eyelids on the profile page. */
    if (opening < 0.025) {
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

    const halfHeight =
      eye.height * 0.5 * opening;

    eyeOutline(halfWidth, halfHeight);

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

    if (!reducedMotion.matches) {
      const dx = pointer.x - eye.x;
      const dy = pointer.y - eye.y;

      const localX =
        dx * Math.cos(eye.angle) +
        dy * Math.sin(eye.angle);

      const localY =
        -dx * Math.sin(eye.angle) +
        dy * Math.cos(eye.angle);

      const distance =
        Math.hypot(localX, localY) || 1;

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

    eye.gazeX +=
      (targetX - eye.gazeX) * followAmount;

    eye.gazeY +=
      (targetY - eye.gazeY) * followAmount;

    const irisRadius = eye.height * 0.31;

    const iris = ctx.createRadialGradient(
      eye.gazeX,
      eye.gazeY,
      1,
      eye.gazeX,
      eye.gazeY,
      irisRadius
    );

    iris.addColorStop(0, "#fff1a6");
    iris.addColorStop(0.45, "#d8b951");
    iris.addColorStop(0.8, "#8a6d24");
    iris.addColorStop(1, "#30280f");

    ctx.shadowColor = "#d6b343";
    ctx.shadowBlur = 6;
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

    /* Pupil. */
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

    /* Highlight. */
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

    eyeOutline(halfWidth, halfHeight);

    ctx.strokeStyle = "#7b7c7d";
    ctx.lineWidth = 1.1;
    ctx.stroke();

    ctx.restore();
  }

  let lastDraw = 0;

  function animate(now) {
    frame = 0;

    if (document.hidden) return;

    const elapsed = lastDraw
      ? Math.min(now - lastDraw, 50)
      : 16.67;

    lastDraw = now;

    /* Consistent tracking speed across different refresh rates. */
    const followAmount =
      1 - Math.pow(0.91, elapsed / 16.67);

    ctx.clearRect(0, 0, width, height);

    for (const eye of eyes) {
      drawEye(eye, now, followAmount);
    }

    if (
      awake &&
      !reducedMotion.matches &&
      eyes.length > 0
    ) {
      frame = requestAnimationFrame(animate);
    }
  }

  function refresh() {
    cancelAnimationFrame(frame);
    frame = 0;
    lastDraw = 0;

    buildEyes();
    animate(performance.now());
  }

  function resetPointer() {
    pointer.x = width / 2;
    pointer.y = height / 2;
  }

  window.addEventListener("pointermove", (event) => {
    if (event.pointerType === "touch") return;

    pointer.x = event.clientX;
    pointer.y = event.clientY;
  }, { passive: true });

  document.documentElement.addEventListener(
    "pointerleave",
    resetPointer
  );

  window.addEventListener("blur", resetPointer);
  window.addEventListener("resize", refresh);
  window.addEventListener("load", refresh);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      cancelAnimationFrame(frame);
      frame = 0;
    } else {
      refresh();
    }
  });

  reducedMotion.addEventListener("change", refresh);

  refresh();
})();
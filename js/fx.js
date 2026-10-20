// Visual effects only: 3D tilt + mouse-follow glow on cards
(() => {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  document.addEventListener("mousemove", e => {
    const c = e.target.closest && e.target.closest(".card");
    if (!c) return;
    const r = c.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    c.style.setProperty("--mx", x + "px"); c.style.setProperty("--my", y + "px");
    c.style.transform = `perspective(900px) rotateX(${((y / r.height) - .5) * -4}deg) rotateY(${((x / r.width) - .5) * 4}deg) translateZ(6px)`;
  });
  document.addEventListener("mouseout", e => {
    const c = e.target.closest && e.target.closest(".card");
    if (c && !c.contains(e.relatedTarget)) c.style.transform = "";
  });
})();

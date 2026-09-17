const header = document.querySelector(".site-header");
if (header) {
  const toggleHeaderShadow = () => header.classList.toggle("scrolled", window.scrollY > 8);
  toggleHeaderShadow();
  window.addEventListener("scroll", toggleHeaderShadow, { passive: true });
}

const revealTargets = document.querySelectorAll(".reveal");
if (revealTargets.length && "IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  revealTargets.forEach((el) => observer.observe(el));
} else {
  revealTargets.forEach((el) => el.classList.add("is-visible"));
}

const canvas = document.getElementById('stars');
const ctx = canvas.getContext('2d');
const stars = Array.from({ length: 140 }, () => ({
  x: Math.random(),
  y: Math.random(),
  z: Math.random(),
  r: Math.random() * 1.5 + 0.2,
}));

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

window.addEventListener('resize', resize);
resize();

function render(time = 0) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'rgba(140, 247, 255, 0.8)';

  stars.forEach((star) => {
    const twinkle = Math.sin(time * 0.002 + star.x * 10) * 0.4 + 0.6;
    const x = star.x * canvas.width;
    const y = star.y * canvas.height;
    const radius = star.r * twinkle;

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  });

  requestAnimationFrame(render);
}

render();

const hero = document.querySelector('.hero');
window.addEventListener('pointermove', (event) => {
  const x = (event.clientX / window.innerWidth - 0.5) * 12;
  const y = (event.clientY / window.innerHeight - 0.5) * 12;
  hero.style.transform = `translate3d(${x}px, ${y}px, 0)`;
});

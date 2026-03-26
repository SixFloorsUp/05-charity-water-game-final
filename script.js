// Raindrop Catcher Game Logic
// All code is now in script.js for clarity and learning.

// Rain background lines
const rainBg = document.getElementById('rain-bg');
for (let i = 0; i < 30; i++) {
	const l = document.createElement('div');
	l.className = 'rain-line';
	l.style.cssText = `left:${Math.random()*100}%; height:${20+Math.random()*40}px; opacity:${0.2+Math.random()*0.3};`;
	rainBg.appendChild(l);
}

// Game area and constants
const WRAP = document.getElementById('game-wrap');
const W = 520, H = 340;
const GOAL = 1000;

// Game state variables
let score = 0, lives = 3, caught = 0;
let drops = [];
let running = false;
let animId = null;
let lastTime = null;
let spawnTimeout = null;
let spawnDelay = 1100;

// Cursor variables
const cur = document.getElementById('cursor');
let mx = -200, my = -200;
// Move the custom cursor with the mouse
WRAP.addEventListener('mousemove', e => {
	const r = WRAP.getBoundingClientRect();
	mx = e.clientX - r.left;
	my = e.clientY - r.top;
	cur.style.left = mx + 'px';
	cur.style.top  = my + 'px';
});
// Hide cursor when mouse leaves game area
WRAP.addEventListener('mouseleave', () => { mx = -200; my = -200; });

// Create a raindrop element
function makeDrop() {
	const el = document.createElement('div');
	el.className = 'drop';
	el.innerHTML = `<svg viewBox="0 0 18 24" xmlns="http://www.w3.org/2000/svg">
		<path d="M9 1 C9 1 2 10 2 15 A7 7 0 0 0 16 15 C16 10 9 1 9 1Z"
			fill="#5599cc" stroke="#336699" stroke-width="1"/>
	</svg>`;
	return el;
}

// Spawn a new raindrop
function spawnDrop() {
	if (!running) return;
	const el = makeDrop();
	const x = 16 + Math.random() * (W - 40);
	// Speed increases as score increases
	const speed = 70 + Math.random() * 60 + (score / GOAL) * 50;
	const drop = { el, x, y: -26, speed };
	el.style.left = x + 'px';
	el.style.top = '-26px';
	WRAP.appendChild(el);
	drops.push(drop);
	// Drops spawn faster as score increases
	spawnDelay = Math.max(450, 1100 - (score / GOAL) * 600);
	spawnTimeout = setTimeout(spawnDrop, spawnDelay);
}

// Update the score and lives display
function updateHUD() {
	document.getElementById('score-val').textContent = score;
	const hearts = ['❤️','❤️','❤️'].map((h,i) => i < lives ? h : '🖤').join('');
	document.getElementById('lives-val').textContent = hearts;
}

// Show a splash text (like '+25' or 'miss!')
function showSplash(x, y, text) {
	const s = document.createElement('div');
	s.className = 'splash';
	s.textContent = text;
	s.style.left = x + 'px';
	s.style.top  = y + 'px';
	WRAP.appendChild(s);
	setTimeout(() => s.remove(), 550);
}

// Flash the floor when a drop is missed
function flashFloor() {
	const f = document.getElementById('floor-flash');
	f.style.opacity = '1';
	setTimeout(() => f.style.opacity = '0', 200);
}

// Main game loop
function loop(ts) {
	if (!running) return;
	if (!lastTime) lastTime = ts;
	const dt = (ts - lastTime) / 1000;
	lastTime = ts;

	for (let i = drops.length - 1; i >= 0; i--) {
		const d = drops[i];
		d.y += d.speed * dt;
		d.el.style.top = d.y + 'px';

		// Check if the cursor catches the drop
		const dropCX = d.x + 9;
		const dropCY = d.y + 12;
		const withinX = dropCX > mx - 36 && dropCX < mx + 36;
		const withinY = Math.abs(dropCY - my) < 20;

		if (withinX && withinY) {
			score += 25;
			caught++;
			showSplash(d.x, d.y, '+25');
			d.el.remove();
			drops.splice(i, 1);
			updateHUD();
			if (score >= GOAL) { endGame('win'); return; }
			continue;
		}

		// If drop hits the floor
		if (d.y > H) {
			lives--;
			flashFloor();
			showSplash(d.x, H - 30, 'miss!');
			d.el.remove();
			drops.splice(i, 1);
			updateHUD();
			if (lives <= 0) { endGame('lose'); return; }
		}
	}

	animId = requestAnimationFrame(loop);
}

// Start the game
function startGame() {
	document.getElementById('start-overlay').style.display = 'none';
	running = true;
	lastTime = null;
	spawnDrop();
	animId = requestAnimationFrame(loop);
}

// End the game (win or lose)
function endGame(type) {
	running = false;
	clearTimeout(spawnTimeout);
	cancelAnimationFrame(animId);
	if (type === 'win') {
		document.getElementById('win-score').textContent = score;
		document.getElementById('win-caught').textContent = caught;
		document.getElementById('win-overlay').style.display = 'flex';
	} else {
		document.getElementById('final-score').textContent = score;
		document.getElementById('final-caught').textContent = caught;
		document.getElementById('gameover-overlay').style.display = 'flex';
	}
}

// Reset the game to play again
function resetGame() {
	drops.forEach(d => d.el.remove());
	drops = [];
	score = 0; lives = 3; caught = 0;
	spawnDelay = 1100;
	lastTime = null;
	document.getElementById('gameover-overlay').style.display = 'none';
	document.getElementById('win-overlay').style.display = 'none';
	updateHUD();
	running = true;
	spawnDrop();
	animId = requestAnimationFrame(loop);
}

// Expose startGame and resetGame to HTML
window.startGame = startGame;
window.resetGame = resetGame;

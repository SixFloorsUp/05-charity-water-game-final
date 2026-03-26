const rainBg = document.getElementById('rain-bg');
for (let i = 0; i < 30; i++) {
	const l = document.createElement('div');
	l.className = 'rain-line';
	l.style.cssText = `left:${Math.random()*100}%; height:${20+Math.random()*40}px; opacity:${0.2+Math.random()*0.3};`;
	rainBg.appendChild(l);
}

const WRAP = document.getElementById('game-wrap');
const W = 520, H = 340;
let currentGoal = 500;

let score = 0, lives = 3, caught = 0;
let drops = [];
let running = false;
let animId = null;
let lastTime = null;
let spawnTimeout = null;
let spawnDelay = 1100;

const MILESTONES = [
	{ percent: 0.25, message: "Great start! Keep going!", shown: false },
	{ percent: 0.50, message: "Halfway there!", shown: false },
	{ percent: 0.75, message: "Almost at your goal!", shown: false }
];

let difficulty = 'normal';
const DIFFICULTY_SETTINGS = {
	easy: { speedBase: 50, speedRandom: 40, speedIncrease: 30, spawnBase: 1400, spawnMin: 700, goal: 250 },
	normal: { speedBase: 70, speedRandom: 60, speedIncrease: 50, spawnBase: 1100, spawnMin: 450, goal: 500 },
	hard: { speedBase: 100, speedRandom: 80, speedIncrease: 70, spawnBase: 850, spawnMin: 300, goal: 1000 }
};

const cur = document.getElementById('cursor');
let mx = -200, my = -200;

WRAP.addEventListener('mousemove', e => {
	const r = WRAP.getBoundingClientRect();
	mx = e.clientX - r.left;
	my = e.clientY - r.top;
	cur.style.left = mx + 'px';
	cur.style.top  = my + 'px';
});

WRAP.addEventListener('mouseleave', () => { mx = -200; my = -200; });

function makeDrop() {
	const el = document.createElement('div');
	el.className = 'drop';
	el.innerHTML = `<svg viewBox="0 0 18 24" xmlns="http://www.w3.org/2000/svg">
		<path d="M9 1 C9 1 2 10 2 15 A7 7 0 0 0 16 15 C16 10 9 1 9 1Z"
			fill="#2E9DF7" stroke="#8BD1CB" stroke-width="1.5"/>
	</svg>`;
	return el;
}

function spawnDrop() {
	if (!running) return;
	const el = makeDrop();
	const x = 16 + Math.random() * (W - 40);
	const settings = DIFFICULTY_SETTINGS[difficulty];
	const speed = settings.speedBase + Math.random() * settings.speedRandom + (score / currentGoal) * settings.speedIncrease;
	const drop = { el, x, y: -26, speed };
	el.style.left = x + 'px';
	el.style.top = '-26px';
	WRAP.appendChild(el);
	drops.push(drop);
	const spawnReduction = (score / currentGoal) * (settings.spawnBase - settings.spawnMin);
	spawnDelay = Math.max(settings.spawnMin, settings.spawnBase - spawnReduction);
	spawnTimeout = setTimeout(spawnDrop, spawnDelay);
}

function updateHUD() {
	document.getElementById('score-val').textContent = score;
	const hearts = ['❤️','❤️','❤️'].map((h,i) => i < lives ? h : '🖤').join('');
	document.getElementById('lives-val').textContent = hearts;
	document.getElementById('goal-val').textContent = currentGoal;
}

function showSplash(x, y, text, isMilestone = false) {
	const s = document.createElement('div');
	s.className = isMilestone ? 'splash milestone-splash' : 'splash';
	s.textContent = text;
	s.style.left = x + 'px';
	s.style.top  = y + 'px';
	WRAP.appendChild(s);
	setTimeout(() => s.remove(), isMilestone ? 1500 : 550);
}

function checkMilestones() {
	MILESTONES.forEach(milestone => {
		if (!milestone.shown && score >= currentGoal * milestone.percent) {
			milestone.shown = true;
			showSplash(W / 2 - 50, H / 2, milestone.message, true);
		}
	});
}

function flashFloor() {
	const f = document.getElementById('floor-flash');
	f.style.opacity = '1';
	setTimeout(() => f.style.opacity = '0', 200);
}

function loop(ts) {
	if (!running) return;
	if (!lastTime) lastTime = ts;
	const dt = (ts - lastTime) / 1000;
	lastTime = ts;

	for (let i = drops.length - 1; i >= 0; i--) {
		const d = drops[i];
		d.y += d.speed * dt;
		d.el.style.top = d.y + 'px';

		const dropCX = d.x + 9;
		const dropCY = d.y + 12;
		const withinX = dropCX > mx - 20 && dropCX < mx + 20;
		const withinY = dropCY > my - 15 && dropCY < my + 20;

		if (withinX && withinY) {
			score += 25;
			caught++;
			showSplash(d.x, d.y, '+25');
			d.el.remove();
			drops.splice(i, 1);
			updateHUD();
			checkMilestones();
			if (score >= currentGoal) { endGame('win'); return; }
			continue;
		}

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

function startGame() {
	MILESTONES.forEach(m => m.shown = false);
	document.getElementById('start-overlay').style.display = 'none';
	running = true;
	lastTime = null;
	spawnDrop();
	animId = requestAnimationFrame(loop);
}

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

function resetState() {
	drops.forEach(d => d.el.remove());
	drops = [];
	score = 0; lives = 3; caught = 0;
	spawnDelay = 1100;
	lastTime = null;
	MILESTONES.forEach(m => m.shown = false);
	document.getElementById('gameover-overlay').style.display = 'none';
	document.getElementById('win-overlay').style.display = 'none';
	updateHUD();
}

function resetGame() {
	resetState();
	running = true;
	spawnDrop();
	animId = requestAnimationFrame(loop);
}

function backToMenu() {
	resetState();
	document.getElementById('start-overlay').style.display = 'flex';
	running = false;
}

function selectDifficulty(level) {
	difficulty = level;
	currentGoal = DIFFICULTY_SETTINGS[level].goal;
	document.getElementById('goal-val').textContent = currentGoal;
	const buttons = document.querySelectorAll('.difficulty-btn');
	buttons.forEach(btn => {
		if (btn.dataset.difficulty === level) {
			btn.classList.add('active');
		} else {
			btn.classList.remove('active');
		}
	});
}

window.startGame = startGame;
window.resetGame = resetGame;
window.backToMenu = backToMenu;
window.selectDifficulty = selectDifficulty;

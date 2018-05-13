// Radians should in the range of [-PI;PI]


/*--- pure helper functions ---*/
const {cos, sin, sqrt, random, floor, round, PI, atan, ceil} = Math;
const partition = (arr, predicate) => {
	const trues = [];
	const falses = [];
	for(const elem of arr){
		(predicate(elem) ? trues : falses).push(elem);
	}
	return [trues, falses];
};
const hasProperties = (obj, propObj) =>
	typeof propObj !== 'object'
	? typeof propObj === 'undefined' || obj === propObj
	: Object.keys(propObj).every(key => hasProperties(obj[key], propObj[key]));

const radiansToVec = rad => ({ x: cos(rad), y: sin(rad) });
const multiplyVec = ({ x, y }, n) => ({ x: x * n, y: y * n });
const range = (from, to, step = 1) => {
	const arr = [];
	for(let i = from; i <= to; i += step){
		arr.push(i);
	}
	return arr;
};
const mapWeakMap = (arr, callback) =>
	new WeakMap(arr.map(elem => [elem, callback(elem)]));
document.addEventListener('mousedown', e => {
	e.preventDefault();
});
document.addEventListener('keydown', e => {
	e.preventDefault();
});

class CanvasBooleanDataManager{
	constructor(canvas){
		this.width = canvas.width;
		this.height = canvas.height;
		this.canvas = canvas;
		this.ctx = canvas.getContext('2d');
		this.clear();
	}
	clear(){
		this.ctx.clearRect(0, 0, this.width, this.height);
		this.data = new Uint8Array(this.width * this.height);
	}
	setColor(str){
		this.ctx.fillStyle = 'rgb(' + str + ')';
	}
	fillRect(x, y, width, height){
		if(width === 0 || height === 0) return;
		this.ctx.fillRect(x, y, width, height);
		const index = y * this.width + x;
		this.data[index] = 1;

		let i, j;
		for(i = index + 1; i < index + width; i++){
			this.data.copyWithin(i, index, index + 1);
		}
		for(j = index + this.width; j < index + height * this.width; j += this.width){
			this.data.copyWithin(j, index, i);
		}
	}
	isFilled(x, y){
		const index = y * this.width + x;
		return !!this.data[index];
	}
	createClipboard(){
		const self = this;
		const canvas = document.createElement('canvas');
		canvas.width = this.width;
		canvas.height = this.height;
		const ctx = canvas.getContext('2d');
		let data = this.data.slice();
		return{
			copy(){
				ctx.drawImage(self.canvas, 0, 0);
				data.set(self.data);
			},
			paste(){
				self.data.set(data);
				self.ctx.drawImage(canvas, 0, 0);
			}
		};
	}
}


/*--- impure helper functions ---*/
const log = x => { console.log(x); return x; };
const waitFrame = () => new Promise(requestAnimationFrame);
const waitEvent = (el, eName, props) => new Promise(resolve => {
	const listener = e => {
		if(!hasProperties(e, props)) return;
		resolve(e);
		document.removeEventListener(eName, listener);
	};
	document.addEventListener(eName, listener);
});
const waitKeydown = props => waitEvent(document, 'keydown', props);
const removeChildren = el => {
	let c;
	while(c = el.firstChild){
		el.removeChild(c);
	}
};


/*--- scenes ---*/
const startScreen = document.getElementById('start-screen');
const game = document.getElementById('game');
const scenes = new Map();


/*--- setuping party ---*/
scenes.set(game, async ({scene, previousScene, snakeTypes}) => {
	if(typeof snakeTypes === 'undefined' || snakeTypes.length < 2){
		console.error('registered players:', snakeTypes);
		console.error('this is a multiplayer game. you have to make friends, sorry.');
		return {scene: previousScene};
	}

	const length = 10;
	const scoreBoardWidth = 40;
	const width = floor(window.innerWidth - scoreBoardWidth);
	const height = floor(window.innerHeight);
	// speed should not be larger than 1
	const speed = 1;
	const angularSpeed = PI / 140 * speed;
	const circleRadius = speed / angularSpeed;
	const holeSize = floor(20 / speed);
	const holeCycle = 160;
	const holeFrom = holeCycle - holeSize;
	const snakeSize = 4;
	// I calculate that, at a maximum,
	// how many cycles are needed for the snake to reach
	// a state where the snake's new rectangle does not overlap
	// with the initial snake rectangle
	const snakeBufferSize = ceil(
		(
			// the angle of the change; I measure it by
			// moving the snake rectangle from bottom to the right
			(PI/2) - atan(
				sqrt(circleRadius**2 - snakeSize**2) / // the y of the new rectangle's center
				snakeSize // the x of the new rectangle's center
			)
		) / angularSpeed
	) - 1;
	const wall = 8;
	const padding = wall + PI / angularSpeed * 0.75;
	
	const canvases = [
		document.getElementById('maincan'),
		document.getElementById('upmover')
	];
	const [canvas, upMover] = canvases;
	window.ctx = canvas.getContext('2d', {alpha: false});
	const scoresEl = document.getElementById('scores');
	scoresEl.style.width = window.innerWidth - width;

	for(const canvas of canvases){
		canvas.width = width;
		canvas.height = height;
	}

	const canvasManager = new CanvasBooleanDataManager(canvas);
	const canvasClipboard = canvasManager.createClipboard();

	const colors = new Set(snakeTypes.map(snakeType => snakeType.color).concat(['255,255,255']));
	const scores = mapWeakMap(snakeTypes, snakeType => 0);
	removeChildren(scoresEl);
	const scoreTextNodes = new WeakMap(snakeTypes.map(snakeType => {
		const el = document.createElement('div');
		el.style.color = 'rgb('+snakeType.color+')';
		const textNode = document.createTextNode('0');
		el.appendChild(textNode);
		scoresEl.appendChild(el);
		return [snakeType, textNode];
	}));

	/*--- static functions ---*/
	const distrubuteSnakes = n => {
		let w = width - padding * 2;
		let h = height - padding * 2;

		return range(1,n).map(() => ({
			x: random() * w + padding,
			y: random() * h + padding,
		}));
	};

	/*--- setuping game round ---*/
	for(let i = 0; i < length; i++){
		canvasManager.clear();

		const snakePositions = distrubuteSnakes(snakeTypes.length);
		const states = new WeakMap(snakeTypes.map((snakeType, i) => [snakeType, {
			dir: PI * 2 * random() - PI,
			left: false,
			right: false,
			lastPositions: [],
			x: snakePositions[i].x,
			y: snakePositions[i].y
		}]));
		let living = [...snakeTypes];
		let holeIndex = 0;
		
		canvasManager.setColor('255,255,255');
		canvasManager.fillRect(0, 0, width, wall);
		canvasManager.fillRect(0, height - wall, width, wall);
		canvasManager.fillRect(0, 0, wall, height);
		canvasManager.fillRect(width-wall, 0, wall, height);
		
		const handleKeydown = ({code}) => {
			for(const snakeType of living){
				if(snakeType.left === code){
					states.get(snakeType).left = true;
				}else if(snakeType.right === code){
					states.get(snakeType).right = true;
				}
			}
		};
		const handleKeyup = ({code}) => {
			for(const snakeType of living){
				if(snakeType.left === code){
					states.get(snakeType).left = false;
				}else if(snakeType.right === code){
					states.get(snakeType).right = false;
				}
			}
		};
		document.addEventListener('keydown', handleKeydown);
		document.addEventListener('keyup', handleKeyup);
		
		gameLoop: while(true){
			// break gameLoop;
			
			// console.time('x');
			holeIndex++;
			if(holeIndex === holeFrom){
				canvasClipboard.copy();
			}else if(holeIndex > holeFrom){
				canvasClipboard.paste();
			}
			if(holeIndex === holeCycle){
				holeIndex = 0;
			}
			
			let newDeads;
			[newDeads, living] = partition(living, snakeType => {
				const state = states.get(snakeType);
				
				if(state.left){
					state.dir -= angularSpeed;
					if(state.dir <= -PI){
						state.dir = PI;
					}
				}
				if(state.right){
					state.dir += angularSpeed;
					if(state.dir > PI){
						state.dir = -PI;
					}
				}

				const moveVector = multiplyVec(radiansToVec(state.dir), speed);
				state.lastPositions.unshift({
					x: floor(state.x),
					y: floor(state.y)
				});
				if(state.lastPositions.length > snakeBufferSize){
					state.lastPositions.pop();
				}

				state.x += moveVector.x;
				state.y += moveVector.y;

				const ex = floor(state.x);
				const ey = floor(state.y);
				
				collisionLoop: for(let x = ex; x < ex + snakeSize; x++){
					for(let y = ey; y < ey + snakeSize; y++){
						if(
							state.lastPositions.some(lastPosition =>
								x >= lastPosition.x && x < lastPosition.x + snakeSize &&
								y >= lastPosition.y && y < lastPosition.y + snakeSize
							)
						) continue;
						if(canvasManager.isFilled(x, y)){
							
							/*
							console.log('the died snake', snakeType);
							console.log('your last positions', state.lastPositions);
							console.log('your new state', state);
							console.log('the colliding pixel position', x, y);
							console.log('the color of the pixel', color);
							console.log('the index of the pixel', index);
							*/
							
							return true;
						}
					}
				}
				
				canvasManager.setColor(snakeType.color);
				canvasManager.fillRect(floor(state.x), floor(state.y), 4, 4);
			});

			if(newDeads.length > 0){
				for(const snakeType of living){
					const score = scores.get(snakeType) + newDeads.length * 5;
					scoreTextNodes.get(snakeType).nodeValue = score;
					scores.set(snakeType, score);
				}
			}
			// console.timeEnd('x');
			if(living.length <= 1) break gameLoop;
			await waitFrame();
		}

		document.removeEventListener('keydown', handleKeydown);
		document.removeEventListener('keyup', handleKeyup);

		await waitKeydown({code: 'Space'});
	}

	return{scene: previousScene};
});

scenes.set(startScreen, async () => {
	const players = document.getElementById('players');
	const snakeTypes = [
		{left: 'Backquote', right: 'Tab', color: '255,0,0'},
		{left: 'Digit2', right: 'Digit3', color: '0,255,0'},
		{left: 'Digit6', right: 'Digit7', color: '0,0,255'},
	//	{left: 'Digit0', right: 'Minus', color: '255,120,0'},
		{left: 'KeyS', right: 'KeyD', color: '0,255,255'},
		{left: 'KeyH', right: 'KeyJ', color: '255,255,0'},
		{left: 'ArrowDown', right: 'ArrowRight', color: '255,0,255'}
	];
	const rows = mapWeakMap(snakeTypes, snakeType => {
		const row = players.insertRow();
		row.style.setProperty('--main-color', 'rgb(' + snakeType.color + ')');
		const left = row.insertCell();
		left.innerText = snakeType.left;
		const right = row.insertCell();
		right.innerText = snakeType.right;
		const registration = row.insertCell();
		registration.innerText = 'unregistered';
		registration.style.setProperty('color', 'white');
		[snakeType.left, snakeType.right].map(_code => {
			document.addEventListener('keydown', ({code, repeat}) => {
				if(repeat) return;
				if(_code === code){
					if(row.hasAttribute('data-activated')){
						row.removeAttribute('data-activated');
						registration.innerText = 'unregistered';
					}else{
						registration.innerText = 'registered';
						row.setAttribute('data-activated', 'true');
					}
				}
			});
		});
		return row;
		/*
		[left, right].map(el => {
			el.addEventListener('mousedown', async ({target}) => {
				target.style.textDecoration = 'underline';
				const e = await waitEvent(document, 'keydown');
				target.style.textDecoration = '';
				target.innerText = e.code;
			});
		});
		*/
	});
	await waitEvent(document, 'keydown', {code: 'Space'});
	removeChildren(players);
	return{
		scene: game,
		snakeTypes: snakeTypes
			.filter(snakeType =>
				rows.get(snakeType).hasAttribute('data-activated')
			)
	}
});


/*--- scene handling ---*/
for(const [scene, func] of scenes){
	scene.style.display = 'none';
}
const playScene = async ({scene, ...other}) => {
	if(typeof scene.style === 'undefined'){
		console.log(scene, 'style property is not defined! other args:', args);
	}
	scene.style.display = '';
	const {scene: nextScene, ...data} = await scenes.get(scene)({scene, ...other});
	scene.style.display = 'none';
	return playScene({scene: nextScene, previousScene: scene, ...data});
};

playScene({scene: startScreen});
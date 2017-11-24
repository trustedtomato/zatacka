// Radians should in the range of [-PI;PI]

const {cos, sin, sqrt, random, floor, round, PI} = Math;

const includes = (elem, container) =>
	typeof elem !== 'object'
	? typeof elem === 'undefined' || container === elem
	: Object.keys(elem).every(key => includes(container[key], elem[key]));
const radiansToVec = rad => ({x: cos(rad), y: sin(rad)});
const multiplyVec = ({x,y}, n) => ({x: x*n, y: y*n});
const log = x => { console.log(x); return x; };
const waitFrame = () => new Promise(requestAnimationFrame);
const waitEvent = (el, eName, props) => new Promise(resolve => {
	const listener = e => {
		if(!includes(props, e)) return;
		resolve(e);
		document.removeEventListener(eName, listener);
	};
	document.addEventListener(eName, listener);
});
const waitKeydown = props => waitEvent(document, 'keydown', props);


const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d', {alpha: false});

// TODO: Make a keyboard layout thingy

const startParty = async (snakeTypes, length) => {
	const width = Math.floor(window.innerWidth);
	const height = Math.floor(window.innerHeight);
	canvas.width = width;
	canvas.height = height;

	const hwRatio = height / width;
	const speed = 1;
	const rotationSpeed = PI / 140;
	const inheriting = false;
	const holeFrom = 86;
	const holeCycle = 100;
	
	const colors = new Set(snakeTypes.map(snakeType => snakeType.color).concat(['255,255,255']));
	const scores = new WeakMap(snakeTypes.map(snakeType => [snakeType, 0]));
	ctx.clearRect(0, 0, width, height);
	for(let i = 0; i < length; i++){
		if(!inheriting){
			ctx.clearRect(0, 0, width, height);
		}

		const states = new WeakMap(snakeTypes.map(snakeType => [snakeType, {
			dir: PI * 2 * random() - PI,
			left: false,
			right: false,
			holeI: 0,
			// TODO: use holes
			holeStart: {x: NaN, y: NaN}
			// TODO: Distrubute the snakes evenly
			x: random() * width,
			y: random() * height
		}]));
		const living = [...snakeTypes];
		
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
			const image = ctx.getImageData(0, 0, width, height).data;

			for(let i = 0; i < living.length; i++){
				const snakeType = living[i];

				const state = states.get(snakeType);
				state.holeI++;
				if(state.holeI >= holeCycle){
					state.holeI = 0;
				}
				if(state.holeI >= holeFrom){
					ctx.translate(state.x, state.y);
					ctx.rotate(state.dir);
					ctx.clearRect(-2.5, -2.5, 5, 5);
					ctx.rotate(-state.dir);
					ctx.translate(-state.x, -state.y);
				}
				
				if(state.left){
					state.dir -= rotationSpeed;
					if(state.dir <= -PI){
						state.dir = PI;
					}
				}
				if(state.right){
					state.dir += rotationSpeed;
					if(state.dir > PI){
						state.dir = -PI;
					}
				}

				const moveVector = multiplyVec(radiansToVec(state.dir), speed);
				state.x = state.x + moveVector.x;
				state.y = state.y + moveVector.y;

				ctx.fillStyle = 'rgb(' + snakeType.color + ')';
				ctx.beginPath();
				ctx.arc(state.x, state.y, 2, 0, PI*2);
				ctx.fill();
				ctx.closePath();

				const corners = [];
				// top left
				if(state.dir < -PI * (1/4) || state.dir > PI * (3/4))
					corners.push({x: floor(state.x-2.5), y: floor(state.y-2.5)});
				// top right
				if(state.dir < PI * (1/4) && state.dir > -PI * (3/4))
					corners.push({x: floor(state.x+2.5), y: floor(state.y-2.5)});
				// bottom right
				if(state.dir < PI * (3/4) && state.dir > -PI * (1/4))
					corners.push({x: floor(state.x+2.5), y: floor(state.y+2.5)});
				// bottom left
				if(state.dir < -PI * (3/4) || state.dir > PI * (1/4))
					corners.push({x: floor(state.x-2.5), y: floor(state.y+2.5)});

				const corner = corners.find(corner => {
					if(corner.x < 0 || corner.y < 0 || corner.x >= width || corner.y >= height) return true;
					const i = (corner.y * width + corner.x) * 4;
					const color = [image[i], image[i + 1], image[i + 2]].join(',');
					if(colors.has(color)){
						return true;
					}
				});
				if(corner){
					const index = (corner.x * width + corner.y) * 4;
					living.splice(i, 1);
					i--;
				}
			}

			if(living.length <= 0) break gameLoop;
			await waitFrame();
		}

		document.removeEventListener('keydown', handleKeydown);
		document.removeEventListener('keyup', handleKeyup);

		await waitKeydown({code: 'Space'});
	}
};

startParty([
	// {left: 'Backquote', right: 'Digit1', color: '255,0,0'},
	{left: 'ArrowDown', right: 'ArrowRight', color: '0,255,0'}
], 10);
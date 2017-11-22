// Radians should in the range of [-PI;PI]

const {cos, sin, sqrt, random, floor, round, PI} = Math;

const radiansToVec = rad => ({x: cos(rad), y: sin(rad)});
const multiplyVec = ({x,y}, n) => ({x: x*n, y: y*n});
const log = x => { console.log(x); return x; };
const waitFrame = () => new Promise(requestAnimationFrame);


const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d', {alpha: false});

// TODO: Make a keyboard layout thingy

const startParty = async (snakeTypes, length) => {
	const width = Math.floor(window.innerWidth);
	const height = Math.floor(window.innerHeight);
	const hwRatio = height / width;
	const speed = 1;
	const rotationSpeed = PI / 140;
	const inheriting = false;
	canvas.width = width;
	canvas.height = height;
	
	const colors = new Set(snakeTypes.map(snakeType => snakeType.color));
	const scores = new WeakMap(snakeTypes.map(snakeType => [snakeType, 0]));
	ctx.clearRect(0, 0, width, height);
	for(let i = 0; i < length; i++){
		const states = new WeakMap(snakeTypes.map(snakeType => [snakeType, {
			dir: PI * 2 * random() - PI,
			left: false,
			right: false,
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
				ctx.fillRect(state.x - 2, state.y - 2, 4, 4);

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

			if(living.length <= 1) break gameLoop;
			await waitFrame();
		}

		document.removeEventListener('keydown', handleKeydown);
		document.removeEventListener('keyup', handleKeyup);

		if(!inheriting){
			ctx.clearRect(0, 0, width, height);
		}
	}
};

startParty([
	{left: 'Backquote', right: 'Digit1', color: '255,0,0'},
	{left: 'ArrowDown', right: 'ArrowRight', color: '0,255,0'}
], 10);
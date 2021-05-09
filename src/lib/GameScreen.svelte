<script lang="ts">
  import { createEventDispatcher, onDestroy, onMount } from 'svelte'
  import type { Player } from './possiblePlayers'
  import { addTwoCoordinateVectors, angleBasedVectorToCoordinateVector } from '$lib/Vector'
  import type { CoordinateVector } from '$lib/Vector'
  import Alert from '$lib/Alert.svelte'
  import { waitForEvent } from '$lib/waitForEvent'
  import { dev } from '$app/env'
  import { waitForAnimationFrame } from './waitForAnimationFrame';
  import { createEventListener } from './createEventListener';
  import type { EventListener } from './createEventListener'
  import { Direction, getDirection } from './getDirection';
  import { doLineSegmentsIntersect } from './doLineSegmentsIntersect';
  import type { LineSegment } from './doLineSegmentsIntersect'
  import { createTextCanvas } from './createTextCanvas';
  import { CustomContext } from './CustomContext'
  import { loadSvg } from './loadSvg'

  const dispatch = createEventDispatcher();

  // NOTE.
  // Generally, the length units should be in pixels,
  // the time units in miliseconds,
  // the speed units in px / ms,
  // the angles in radians and
  // the anglular velocities in radians / ms. 

  export let players: Set<Player>
  export let getIfShouldEnd = ({ scores, numberOfPlayers }: {
    scores: number[],
    elapsedRounds: number,
    numberOfPlayers: number
  }) => {
    return scores.some(score => score >= 50 * (numberOfPlayers - 1))
  }
  export let deathScore = 5
  export let holeScore = 1
  export let headSize = 4
  /** Should be smaller than the 1/16 of headSize. */
  export let speed = 0.12
  export let holeLength = 18
  export let holePeriodLength = 200
  export let rotationRadius = 40

  let canvas: HTMLCanvasElement
  let tempCanvas: HTMLCanvasElement

  let alertMessageHtml = null
  let shouldGameStop = false
  let timeAtLastPaint = 0
  let iterationTime: number
  let scores = new Map([...players].map(player => [
    player,
    0
  ]))

  const font = `${headSize * 8}px -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif`
  let deathImageContainer: HTMLElement
  const deathImageWidth = 50
  const deathImageHeight = 50
  const deathImagePromise = loadSvg('skull-with-crossbones.svg').then(svg => {
    svg.setAttribute('width', `${deathImageWidth}px`)
    svg.setAttribute('height', `${deathImageHeight}px`)
    return svg
  })
  const scoreboardWidth = 80
  const wallSize = headSize * 2
  const width = Math.floor(window.innerWidth) - 80
  const height = Math.floor(window.innerHeight)

  const holePeriodTime = holePeriodLength / speed
  const holeTime = holeLength / speed
  // If the snakes' moved more distance than this, there would be a gap in the snake.
  const maxDistancePerIteration = headSize
  // Accordingly to the max distance, the max time which can elapse
  // between two iteartions should be set. 
  const maxTimeElapsed = maxDistancePerIteration / speed
  // because v = rω
  const angularVelocity = speed / rotationRadius

  // (A bit more than) the minimum distance needed to do a 135 degrees rotation.
  const minimumStartPositionOffset =
    rotationRadius * (Math.SQRT1_2 + 1)

  const requestedRotations: Map<
    Player,
    {
      clockwise: boolean,
      anticlockwise: boolean
    }
  > = new Map([...players].map(player => [
    player,
    {
      clockwise: false,
      anticlockwise: false
    }
  ]))

  const listeners: EventListener[] = []

  onMount(async () => {
    // The browser shows a scrollbar else, don't really know why.
    document.body.style.overflow = 'hidden'

    for (const _canvas of [
      canvas,
      tempCanvas
    ]) {
      _canvas.width = width
      _canvas.height = height
    }

    const ctx = new CustomContext(canvas, { alpha: false })
    const tempCtx = new CustomContext(tempCanvas)
    const isPointFatal = (x: number, y: number) =>
      ctx.isPointFilled(x, y) || tempCtx.isPointFilled(x, y)

    const addFadingOutElement = (el: HTMLElement) => {
      el.style.position = 'absolute'
      el.style.left = '0px'
      el.style.top = '0px'
      el.style.opacity = '0'
      deathImageContainer.appendChild(el)
      const { width, height } = el.getBoundingClientRect()
      return {
        fadeOutFrom (x: number, y: number) {
          x -= width / 2
          y -= height / 2
          el.style.transform = `translate(${x}px, ${y}px`
          el.style.opacity = '1'
          el.style.transition = ''
          requestAnimationFrame(() => {
            el.style.transform = `translate(${x}px, ${y - 50}px`
            el.style.opacity = '0'
            el.style.transition = 'opacity 1s ease-out, transform 1s ease-out'
          })
        }
      }
    }

    const holeScoreImages = new Map([...players].map(player => [
      player,
      addFadingOutElement(
        createTextCanvas({
          text: `+${holeScore}`,
          color: player.color,
          font
        })
      )
    ]))

    const deathImages: Map<Player, ReturnType<typeof addFadingOutElement>> = new Map()
    deathImagePromise.then(generalDeathImage => {
      for (const player of players) {
        const deathImage = generalDeathImage.cloneNode(true) as HTMLElement
        deathImage.style.fill = player.color
        deathImages.set(
          player,
          addFadingOutElement(deathImage)
        )
      }
    })

    listeners.push(
      createEventListener(document, 'keydown', (event: KeyboardEvent) => {
        for (const player of players) {
          if (player.controlKeys.turnClockwise === event.code) {
            requestedRotations.get(player).clockwise = true
            event.preventDefault()
          } else if (player.controlKeys.turnAnticlockwise === event.code) {
            requestedRotations.get(player).anticlockwise = true
            event.preventDefault()
          }
        }
      }),
      createEventListener(document, 'keyup', (event: KeyboardEvent) => {
        for (const player of players) {
          if (player.controlKeys.turnClockwise === event.code) {
            requestedRotations.get(player).clockwise = false
          } else if (player.controlKeys.turnAnticlockwise === event.code) {
            requestedRotations.get(player).anticlockwise = false
          }
        }
      })
    )

    roundLoop: for (let nthRound = 1; !shouldGameStop; nthRound++) {
      ctx.clear()
      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, width, wallSize)
      ctx.fillRect(0, 0, wallSize, height)
      ctx.fillRect(0, height - wallSize, width, wallSize)
      ctx.fillRect(width - wallSize, 0, wallSize, height)

      const alivePlayers = new Set(players)

      const positions = new Map([...players].map(player => [
        player,
        {
          x: Math.random() * (width - headSize - minimumStartPositionOffset * 2) + minimumStartPositionOffset,
          y: Math.random() * (height - headSize - minimumStartPositionOffset * 2) + minimumStartPositionOffset
        }
      ]))
  
      const velocityAngles = new Map([...players].map(player => [
        player,
        Math.random() * Math.PI * 2
      ]))

      let timeAtStart = performance.now()
      timeAtLastPaint = timeAtStart
      let gameTime = 0

      const startPositionsOfHoles: Map<Player, CoordinateVector> = new Map(
        [...players].map(player => [
          player,
          null
        ])
      )

      const holes: LineSegment[] = []
      let currentlyCreatingHoles = false

      animationLoop: while (!shouldGameStop) {
        const currentTime = performance.now()
        const actualTimeElapsed = currentTime - timeAtLastPaint
        const timeElapsed = Math.max(
          // The first iteration is sometimes a really small number,
          // which makes the game buggy.
          0.1,
          Math.min(actualTimeElapsed, maxTimeElapsed)
        )
        gameTime += timeElapsed
        timeAtLastPaint = currentTime
  
        // --- Do things before drawing the new state ---
        tempCtx.clear()

        if (
          holePeriodTime -
          (gameTime % holePeriodTime)
          < holeTime
        ) {
          if (!currentlyCreatingHoles) {
            currentlyCreatingHoles = true
            for (const player of players) {
              startPositionsOfHoles.set(
                player,
                positions.get(player)
              )
            }
          }
        } else {
          if (currentlyCreatingHoles) {
            currentlyCreatingHoles = false
            const newHoles = [...players].map((player): LineSegment => [
                startPositionsOfHoles.get(player),
                positions.get(player)
            ])
            // We have to delay adding the new holes.
            queueMicrotask(() => {
              holes.push(...newHoles)
            })
          }
        }

        // Update player state (position, velocity, check holes and fatal points).
        for (const player of alivePlayers) {
          const requestedRotation = requestedRotations.get(player)
          const oldPosition = positions.get(player)

          const newPosition = (() => {
            // Get new positions according to the players' requests.
            if (requestedRotation.clockwise !== requestedRotation.anticlockwise) {
              // Don't worry if you don't understand, it's trigonometry.
              const rotationAngle = angularVelocity * timeElapsed *
                (requestedRotation.clockwise ? 1 : -1)
              const oldVelocityAngle = velocityAngles.get(player)
              const newVelocityAngle = oldVelocityAngle + rotationAngle          
              const displacement = angleBasedVectorToCoordinateVector({
                angle: oldVelocityAngle + rotationAngle / 2,
                length: 2 * rotationRadius * Math.sin(Math.abs(rotationAngle) / 2)
              })
  
              // Update velocity.
              velocityAngles.set(player, newVelocityAngle)
              return addTwoCoordinateVectors(
                oldPosition,
                displacement
              )
            } else {
              return addTwoCoordinateVectors(
                oldPosition,
                angleBasedVectorToCoordinateVector({
                  angle: velocityAngles.get(player),
                  length: timeElapsed * speed
                })
              )
            }
          })()

          // Update position.
          positions.set(player, newPosition)
        
          for (const hole of holes) {
            if (doLineSegmentsIntersect(hole, [
              oldPosition,
              newPosition
            ])) {
              holeScoreImages.get(player).fadeOutFrom(newPosition.x, newPosition.y)
              scores.set(player, scores.get(player) + holeScore)
              scores = scores
            }
          }

          // Test if the new position is fatal.
          const shouldDie = (() => {
            if (
              newPosition.y + headSize > height ||
              newPosition.x + headSize > width ||
              newPosition.y < 0 ||
              newPosition.x < 0
            ) {
              return true
            }
            const direction = getDirection(velocityAngles.get(player))
            const positionXChange = Math.sign(Math.floor(newPosition.x) - Math.floor(oldPosition.x))
            const positionYChange = Math.sign(Math.floor(newPosition.y) - Math.floor(oldPosition.y))
            const pointsToCheck: {x: number, y: number}[] = []
            // Check top left corner.
            if (
              (direction === Direction.Up || direction === Direction.Left) &&
              (positionXChange === -1 || positionYChange === -1)
            ) {
              pointsToCheck.push({
                x: Math.floor(newPosition.x),
                y: Math.floor(newPosition.y)
              })
            }
            // Check top right corner.
            if (
              (direction === Direction.Up || direction === Direction.Right) &&
              (positionXChange === 1 || positionYChange === -1)
            ) {
              pointsToCheck.push({
                x: Math.floor(newPosition.x + headSize - 1),
                y: Math.floor(newPosition.y)
              })
            }
            // Check bottom left corner.
            if (
              (direction === Direction.Down || direction === Direction.Left) &&
              (positionXChange === -1 || positionYChange === 1)
            ) {
              pointsToCheck.push({
                x: Math.floor(newPosition.x),
                y: Math.floor(newPosition.y + headSize - 1)
              })
            }
            // Check bottom right corner.
            if (
              (direction === Direction.Down || direction === Direction.Right) &&
              (positionXChange === 1 || positionYChange === 1)
            ) {
              pointsToCheck.push({
                x: Math.floor(newPosition.x + headSize - 1),
                y: Math.floor(newPosition.y + headSize - 1)
              })
            }

            const fatalPoints = pointsToCheck.filter(point => isPointFatal(point.x, point.y))

            return fatalPoints.length > 0
          })()

          if (shouldDie) {
            alivePlayers.delete(player)
            deathImages.get(player).fadeOutFrom(newPosition.x, newPosition.y)
            for (const alivePlayer of alivePlayers) {
              scores.set(alivePlayer, scores.get(alivePlayer) + deathScore)
              scores = scores
            }
          }
        }

        for (const player of players) {
          const position = positions.get(player)
          const targetCtx = currentlyCreatingHoles ? tempCtx : ctx
          targetCtx.fillStyle = player.color
          targetCtx.fillRect(Math.floor(position.x), Math.floor(position.y), headSize, headSize)
        }

        iterationTime = performance.now() - currentTime

        if (alivePlayers.size <= 1) {
          break animationLoop
        }

        await waitForAnimationFrame()
      }

      if (getIfShouldEnd({
        scores: [...scores.values()],
        elapsedRounds: nthRound,
        numberOfPlayers: players.size
      })) {
        alertMessageHtml = 'Game ended. Press <span class="underline">Enter</span> to go to the menu.'
        while (true) {
          const event = await waitForEvent(document, 'keydown') as KeyboardEvent
          if (event.code === 'Enter') {
            break
          }
        }
        alertMessageHtml = null
        break roundLoop
      } else {
        alertMessageHtml = 'Press <span class="underline">Space</span> to continue to the next round…'
        while (true) {
          const event = await waitForEvent(document, 'keydown') as KeyboardEvent
          if (event.code === 'Space') {
            break
          }
        }
        alertMessageHtml = null
      }
    }

    dispatch('ended')
  })

  onDestroy(() => {
    document.body.style.overflow = ''
    for (const listener of listeners) {
      listener.destroy()
    }
    shouldGameStop = true
  })
</script>

<div style="width: 100%; height: 100%; display: flex">
  <div style="position: relative; flex-grow: 1">
    <canvas bind:this={canvas}></canvas>
    <canvas bind:this={tempCanvas}></canvas>
    <div style="position: absolute; left: 0; top: 0" bind:this={deathImageContainer}></div>
    {#if alertMessageHtml}
      <Alert>
        {@html alertMessageHtml }
      </Alert>
    {/if}
  </div>
  <div style="
    width: {scoreboardWidth}px;
    box-sizing: border-box;
    padding-left: 6px;
  ">
    {#each [...players] as player}
      <div style="color: {player.color}">{ scores.get(player) }</div>
    {/each}
    {#if dev}
      <div>{iterationTime} ms</div>
    {/if}
  </div>
</div>

<style>
  canvas {
    position: absolute;
    left: 0;
    top: 0;
  }
</style>
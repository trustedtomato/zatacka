<script lang="ts">
	import { keyboardLayout } from '$lib/keyboardLayout'
	import { possiblePlayers } from '$lib/possiblePlayers'
	import type { Player } from '$lib/possiblePlayers'
	import { onDestroy, onMount, createEventDispatcher } from 'svelte'
	import { browser } from '$app/env'

	const dispatch = createEventDispatcher();

	const keycodeToPlayer: Map<string, Player> = new Map()
	for (const player of possiblePlayers) {
		keycodeToPlayer.set(player.controlKeys.turnClockwise, player)
		keycodeToPlayer.set(player.controlKeys.turnAnticlockwise, player)
	}

	let joinedPlayers: Set<Player> = new Set()
	let canStart = false
	$: canStart = joinedPlayers.size >= 2

	const onKeydown = (event: KeyboardEvent) => {
		if (event.code === 'Space') {
			if (canStart) {
				dispatch('requestStart', {
					players: joinedPlayers
				})
			}
			return
		}

		const player = keycodeToPlayer.get(event.code)
		if (!player) {
			return
		}
		// Disable special behaviour of controller keys (for example Tab).
		event.preventDefault()
		// Since the mutation does not include an assignment,
		// a seemingly unneccessary assignment is needed
		// to trigger reactivity.
		if (joinedPlayers.has(player)) {
			joinedPlayers.delete(player)
		} else {
			joinedPlayers.add(player)
		}
			joinedPlayers = joinedPlayers
	}

	onMount(() => {
		if (browser) {
			document.addEventListener('keydown', onKeydown)
		}
	})

	onDestroy(() => {
		if (browser) {
			document.removeEventListener('keydown', onKeydown)
		}
	})
</script>

<div style="display: flex; flex-direction: column; align-items: center;">
	<div style="width: min-content">
		<h1>Zatacka</h1>
		<table class="keyboard">
			{#each keyboardLayout as row}
				<tr class="keyboard__row">
					{#each row as keyData}
						<td
							class="keyboard__key {keyData[0] ? '' : 'keyboard__key--placeholder'}"
							style="
								background: {keycodeToPlayer.get(keyData[1])?.color};
								{keycodeToPlayer.get(keyData[1])?.isColorLight ? 'color: black;' : ''}
								width: { 2 * (keyData[2] || 1) }rem
							"
							colspan={10 * (keyData[2] || 1)}
						>
							{ keyData[0] }
						</td>
					{/each}
				</tr>
			{/each}
		</table>
	
		<div style="margin: 1.5em 0">
			<div>
				Press a colored key to join with that color.
				The keys with the same color are used for controlling the snake.
				{#if !canStart}
					Need at least two players to start.
				{:else}
					Press <span style="text-decoration: underline">Space</span> to start the game!
				{/if}
			</div>
			<div>
				{#if joinedPlayers.size > 0}
					Players who already joined:
				{/if}
			</div>
			<ul>
				{#each [...joinedPlayers] as player}
					<li>
						<span style="
							padding: 0 .25em;
							background: {player.color};
							color: { player.isColorLight ? 'black' : 'white' }
						">
							{ player.name }
						</span>
					</li>
				{/each}
			</ul>
		</div>
	</div>
</div>

<style>
	h1 {
		margin: 1em 0 1.5em 0;
		text-align: center;
	}
	.keyboard {
		table-layout: fixed;
		width: 20rem;
		border-spacing: 0;
		border-collapse: collapse;
	}
	.keyboard__row {
		height: 1rem;
	}
	.keyboard__key {
		border: 2px solid white;
		height: 2rem;
		padding: 0;
		box-sizing: border-box;
		text-align: center;
		font-size: .8rem;
	}
	.keyboard__key--placeholder {
		border: 0;
	}
</style>

<script lang="ts">
	import StartScreen from '$lib/StartScreen.svelte'
	import GameScreen from '$lib/GameScreen.svelte'
	import type { Player } from '$lib/possiblePlayers'

	let startedWith: Set<Player> = null
	const requestStart = (e: CustomEvent) => {
		startedWith = e.detail.players
	}

	const onGameEnded = () => {
		startedWith = null
	}
</script>

<svelte:head>
	<title>
		Zatacka
	</title>
</svelte:head>

{#if startedWith === null}
	<StartScreen on:requestStart={requestStart} />
{:else}
	<GameScreen on:ended={onGameEnded} players={startedWith} />
{/if}
import "./translations"

import {
	DOTAGameUIState,
	EventsSDK,
	GameState
} from "github.com/octarine-public/wrapper/index"

import { GUIHelper } from "./gui"
import { MenuManager } from "./menu"

const bootstrap = new (class CPickHelper {
	private readonly hpThreshold = 50
	private readonly gui = new GUIHelper()
	private readonly menu = new MenuManager()

	protected get State() {
		return this.menu.State.value
	}

	protected get InGameUIState() {
		return GameState.UIState === DOTAGameUIState.DOTA_GAME_UI_DOTA_INGAME
	}

	public Draw() {
		if (this.State && !this.InGameUIState) {
			this.gui.Draw(this.menu)
		}
		// if (!this.State || !GameState.IsConnected || !this.GUI.IsUIGame) {
		// 	return
		// }
		// if (!this.GUI.IsReady || this.GUI.IsGameInProgress || this.GUI.IsPostGame) {
		// 	return
		// }
		// const arrPlayers = PlayerCustomData.Array
		// for (let index = arrPlayers.length - 1; index > -1; index--) {
		// 	const player = arrPlayers[index]
		// 	if (!player.IsValid || player.IsSpectator) {
		// 		continue
		// 	}
		// 	if (!player.IsEnemy() || !player.LaneSelections.length) {
		// 		continue
		// 	}
		// 	// hide roles with low % health (if used top panel and any scripts enabled)
		// 	if (player.Hero !== undefined && player.Hero.HPPercent < this.hpThreshold) {
		// 		continue
		// 	}
		// 	if (player.Team !== Team.DraftPool) {
		// 		this.GUI.Draw(player)
		// 	}
		// }
	}
})()

EventsSDK.on("Draw", () => bootstrap.Draw())

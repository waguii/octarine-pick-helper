import "./translate"

import {
	ArrayExtensions,
	DOTAGameState,
	DOTAGameUIState,
	EventsSDK,
	GameRules,
	GameState,
	GUIInfo,
	Input,
	InputEventSDK,
	PlayerCustomData,
	Rectangle,
	Team,
	VMouseKeys
} from "github.com/octarine-public/wrapper/index"

import { PlayerGUI } from "./gui/player"
import { TeamGUI } from "./gui/team"
import { MenuManager } from "./menu"

const bootstrap = new (class CBootstrap {
	private readonly menu = new MenuManager()
	private readonly players = new Set<PlayerCustomData>()

	private readonly teamGUI = new TeamGUI()
	private readonly playerGUI = new PlayerGUI()

	private get gameState() {
		return GameRules?.GameState ?? DOTAGameState.DOTA_GAMERULES_STATE_INIT
	}

	private get isPostGame() {
		return this.gameState === DOTAGameState.DOTA_GAMERULES_STATE_POST_GAME
	}

	private get isDisconnect() {
		return this.gameState === DOTAGameState.DOTA_GAMERULES_STATE_DISCONNECT
	}

	private get isInGame() {
		return (
			this.gameState >= DOTAGameState.DOTA_GAMERULES_STATE_PRE_GAME &&
			this.gameState <= DOTAGameState.DOTA_GAMERULES_STATE_GAME_IN_PROGRESS
		)
	}

	private get isStrategyTime() {
		return (
			this.gameState <= DOTAGameState.DOTA_GAMERULES_STATE_STRATEGY_TIME ||
			this.gameState >= DOTAGameState.DOTA_GAMERULES_STATE_DISCONNECT
		)
	}

	private get isShowCase() {
		return this.gameState === DOTAGameState.DOTA_GAMERULES_STATE_TEAM_SHOWCASE
	}

	private get shouldPass() {
		if (!this.menu.State.value) {
			return false
		}
		if (!this.isInGame || this.isPostGame || this.isDisconnect) {
			return false
		}
		return GameState.UIState === DOTAGameUIState.DOTA_GAME_UI_DOTA_INGAME
	}

	private get shouldDraw() {
		return !this.isContainsScoreboardOpen() && !this.isContainsShopOpen()
	}

	public Draw() {
		if (!this.shouldPass) {
			return
		}

		let dire = 0
		let radiant = 0
		const position = this.menu.GetPanelPos
		this.playerGUI.CopyTouch(this.menu, position, Input.CursorOnScreen)

		const orderByPlayers = ArrayExtensions.orderBy(
			Array.from(this.players),
			x => -x.NetWorth
		)

		for (const player of orderByPlayers) {
			switch (player.Team) {
				case Team.Dire:
					dire += player.NetWorth
					break
				case Team.Radiant:
					radiant += player.NetWorth
					break
			}
			if (player.IsAbandoned || player.IsDisconnected) {
				continue
			}
			if (this.shouldDraw) {
				this.playerGUI.Draw(this.menu, position, player)
			}
		}

		const isObserver = GameState.LocalTeam === Team.Observer
		if (!this.isShowCase && !this.isStrategyTime && !isObserver) {
			this.teamGUI.Draw(this.menu.Total, radiant, dire)
		}
	}

	public PlayerCustomDataUpdated(entity: PlayerCustomData) {
		if (!entity.IsValid || entity.IsSpectator) {
			this.players.delete(entity)
			return
		}
		if (!this.players.has(entity)) {
			this.players.add(entity)
		}
	}

	public MouseKeyUp(key: VMouseKeys) {
		if (!this.isValidInput(key)) {
			return true
		}
		return this.playerGUI.MouseKeyUp(this.menu)
	}

	public MouseKeyDown(key: VMouseKeys) {
		if (!this.isValidInput(key)) {
			return true
		}
		return this.playerGUI.MouseKeyDown(this.menu)
	}

	public GameChanged() {
		this.teamGUI.GameChanged()
		this.playerGUI.GameChanged()
	}

	private isValidInput(key: VMouseKeys) {
		return this.shouldPass && key === VMouseKeys.MK_LBUTTON
	}

	private shoudlDrawPanelPosition(...positions: Rectangle[]) {
		return positions.some(position => this.isContainsPanel(position))
	}

	private isContainsPanel(position: Rectangle) {
		return position.Contains(this.menu.GetPanelPos)
	}

	private isContainsShopOpen() {
		return (
			Input.IsShopOpen &&
			this.shoudlDrawPanelPosition(
				GUIInfo.OpenShopMini.Items,
				GUIInfo.OpenShopMini.Header,
				GUIInfo.OpenShopMini.GuideFlyout,
				GUIInfo.OpenShopMini.ItemCombines,
				GUIInfo.OpenShopMini.PinnedItems,
				GUIInfo.OpenShopLarge.Items,
				GUIInfo.OpenShopLarge.Header,
				GUIInfo.OpenShopLarge.GuideFlyout,
				GUIInfo.OpenShopLarge.PinnedItems,
				GUIInfo.OpenShopLarge.ItemCombines
			)
		)
	}

	private isContainsScoreboardOpen() {
		return (
			Input.IsScoreboardOpen &&
			this.shoudlDrawPanelPosition(GUIInfo.Scoreboard.Background)
		)
	}
})()

EventsSDK.on("Draw", () => bootstrap.Draw())

EventsSDK.on("GameEnded", () => bootstrap.GameChanged())

EventsSDK.on("GameStarted", () => bootstrap.GameChanged())

InputEventSDK.on("MouseKeyUp", key => bootstrap.MouseKeyUp(key))

InputEventSDK.on("MouseKeyDown", key => bootstrap.MouseKeyDown(key))

EventsSDK.on("PlayerCustomDataUpdated", player =>
	bootstrap.PlayerCustomDataUpdated(player)
)

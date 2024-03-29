import "./translations"

import {
	DOTAGameState,
	DOTAGameUIState,
	Entity,
	EventsSDK,
	GameRules,
	GameState,
	GUIInfo,
	Input,
	InputEventSDK,
	Item,
	NotificationsSDK,
	PlayerCustomData,
	Rectangle,
	ResetSettingsUpdated,
	Sleeper,
	SpiritBear,
	Team,
	Unit,
	VMouseKeys
} from "github.com/octarine-public/wrapper/index"

import { KeyMode } from "./enums/KeyMode"
import { PlayerGUI } from "./gui/player"
import { TeamGUI } from "./gui/team"
import { MenuManager } from "./menu"

const bootstrap = new (class CBootstrap {
	private readonly menu = new MenuManager()
	private readonly sleeper = new Sleeper()
	private readonly playerGUI: PlayerGUI
	private readonly teamGUI = new TeamGUI()
	private readonly players: PlayerCustomData[] = []
	private readonly spiritBears: SpiritBear[] = []

	constructor() {
		this.playerGUI = new PlayerGUI(this.menu)
		this.menu.Reset.OnValue(() => this.resetSettings())
	}

	private get state() {
		return this.menu.State.value
	}

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

	private get isScoreboardPosition() {
		if (!Input.IsScoreboardOpen) {
			return false
		}
		return this.shouldPosition(GUIInfo.Scoreboard.Background)
	}

	private get isShopPosition() {
		if (!Input.IsShopOpen) {
			return false
		}
		return this.shouldPosition(
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
	}

	private get isToggleKeyMode() {
		const menu = this.menu
		const toggleKey = menu.ToggleKey
		// if toggle key is not assigned (setting to "None")
		if (toggleKey.assignedKey < 0) {
			return false
		}
		const keyModeID = menu.ModeKey.SelectedID
		return (
			(keyModeID === KeyMode.Toggled && !menu.IsToggled) ||
			(keyModeID === KeyMode.Pressed && !toggleKey.isPressed)
		)
	}

	private get canDrawPlayerGUI() {
		return !this.isShopPosition && !this.isScoreboardPosition && !this.isToggleKeyMode
	}

	public Draw() {
		if (!this.state || !this.isInGame || this.isPostGame || this.isDisconnect) {
			return
		}

		if (GameState.UIState !== DOTAGameUIState.DOTA_GAME_UI_DOTA_INGAME) {
			return
		}

		let dire = 0
		let radiant = 0
		const position = new Rectangle()
		const enabledPlayers: number[] = []

		const orderByPlayers = this.players.orderBy(x => this.calculateByItem(x))

		this.playerGUI.UpdateSetPosition(position)

		for (let index = orderByPlayers.length - 1; index > -1; index--) {
			const player = orderByPlayers[index],
				itemCosts = this.calculateByItem(player)
			// for Team GUI
			switch (player.Team) {
				case Team.Dire:
					dire += itemCosts
					break
				case Team.Radiant:
					radiant += itemCosts
					break
			}
			if (player.IsAbandoned || player.IsDisconnected) {
				continue
			}
			if (this.canDrawPlayerGUI) {
				this.playerGUI.Draw(
					player,
					enabledPlayers,
					position,
					this.menu.OnlyItems.value ? itemCosts : undefined
				)
			}
		}

		this.playerGUI.CalculateBottomSize(enabledPlayers, position)
		this.playerGUI.UpdatePositionAfter()

		// Team GUI
		const isObserver = GameState.LocalTeam === Team.Observer
		if (this.isShowCase || this.isStrategyTime || isObserver) {
			return
		}

		this.teamGUI.Draw(this.menu.Total, radiant, dire)
	}

	public EntityCreated(entity: Entity) {
		if (!(entity instanceof SpiritBear)) {
			return
		}
		if (this.isShouldSpiritBear(entity)) {
			this.spiritBears.push(entity)
		}
	}

	public EntityDestroyed(entity: Entity) {
		if (entity instanceof SpiritBear) {
			this.spiritBears.remove(entity)
		}
	}

	public UnitItemsChanged(entity: Unit) {
		if (!(entity instanceof SpiritBear)) {
			return
		}
		if (!entity.IsValid) {
			this.spiritBears.remove(entity)
			return
		}
		if (this.isShouldSpiritBear(entity)) {
			this.spiritBears.push(entity)
		}
	}

	public UnitPropertyChanged(entity: Unit) {
		if (!(entity instanceof SpiritBear)) {
			return
		}
		if (!entity.IsValid || this.isIllusionSpiritBear(entity)) {
			this.spiritBears.remove(entity)
			return
		}
		if (this.isShouldSpiritBear(entity)) {
			this.spiritBears.push(entity)
		}
	}

	public LifeStateChanged(entity: Entity) {
		if (entity instanceof SpiritBear && !entity.IsAlive) {
			this.spiritBears.remove(entity)
		}
	}

	public PlayerCustomDataUpdated(entity: PlayerCustomData) {
		if (!entity.IsValid || entity.IsSpectator) {
			this.players.remove(entity)
			return
		}
		if (this.players.every(x => x.PlayerID !== entity.PlayerID)) {
			this.players.push(entity)
		}
	}

	public MouseKeyUp(key: VMouseKeys) {
		if (!this.shouldInput(key)) {
			return true
		}
		return this.playerGUI.MouseKeyUp()
	}

	public MouseKeyDown(key: VMouseKeys) {
		if (!this.shouldInput(key)) {
			return true
		}
		return this.playerGUI.MouseKeyDown()
	}

	public GameChanged() {
		this.teamGUI.GameChanged()
		this.playerGUI.GameChanged()
	}

	private shouldInput(key: VMouseKeys) {
		if (!this.state || this.isPostGame || key !== VMouseKeys.MK_LBUTTON) {
			return false
		}
		if (GameState.UIState !== DOTAGameUIState.DOTA_GAME_UI_DOTA_INGAME) {
			return false
		}
		return true
	}

	private shouldPosition(...positions: Rectangle[]) {
		return positions.some(position => this.isContainsPanel(position))
	}

	private isContainsPanel(position: Rectangle) {
		return position.Contains(this.playerGUI.TotalPosition.pos1)
	}

	private isShouldSpiritBear(spiritBear: SpiritBear) {
		return (
			spiritBear.ShouldRespawn &&
			!this.spiritBears.includes(spiritBear) &&
			!this.isIllusionSpiritBear(spiritBear)
		)
	}

	private isIllusionSpiritBear(spiritBear: SpiritBear) {
		return spiritBear.IsIllusion || spiritBear.HasBuffByName("modifier_illusion")
	}

	private resetSettings() {
		if (this.sleeper.Sleeping("ResetSettings")) {
			return
		}
		this.menu.ResetSettings()
		this.playerGUI.ResetSettings()
		this.sleeper.Sleep(1000, "ResetSettings")
		NotificationsSDK.Push(new ResetSettingsUpdated())
	}

	private calculateByItem(player: PlayerCustomData) {
		if (player.Hero === undefined || !this.menu.OnlyItems.value) {
			return player.NetWorth
		}
		const bearItems =
			this.spiritBears.find(
				x => !this.isIllusionSpiritBear(x) && x.PlayerID === player.PlayerID
			)?.TotalItems ?? []
		return ([...player.Hero.TotalItems, ...bearItems] as Item[])
			.filter(x => x !== undefined && x.Cost !== 0)
			.reduce((prev, curr) => prev + curr.Cost, 0)
	}
})()

EventsSDK.on("Draw", () => bootstrap.Draw())

EventsSDK.on("GameEnded", () => bootstrap.GameChanged())

EventsSDK.on("GameStarted", () => bootstrap.GameChanged())

EventsSDK.on("EntityCreated", entity => bootstrap.EntityCreated(entity))

EventsSDK.on("LifeStateChanged", entity => bootstrap.LifeStateChanged(entity))

EventsSDK.on("EntityDestroyed", entity => bootstrap.EntityDestroyed(entity))

EventsSDK.on("UnitItemsChanged", unit => bootstrap.UnitItemsChanged(unit))

EventsSDK.on("UnitPropertyChanged", unit => bootstrap.UnitPropertyChanged(unit))

InputEventSDK.on("MouseKeyUp", key => bootstrap.MouseKeyUp(key))

InputEventSDK.on("MouseKeyDown", key => bootstrap.MouseKeyDown(key))

EventsSDK.on("PlayerCustomDataUpdated", player =>
	bootstrap.PlayerCustomDataUpdated(player)
)

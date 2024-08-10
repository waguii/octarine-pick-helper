import {
	Color,
	DOTAGameState,
	DOTAGameUIState,
	GameRules,
	GameState,
	GUIInfo,
	ImageData,
	Input,
	LaneSelection,
	Menu,
	Rectangle,
	RendererSDK,
	TextFlags,
	Vector2
} from "github.com/octarine-public/wrapper/index"

import { MenuManager } from "./menu"

export class GUIHelper {
	private dragging = false

	private readonly vecSize = new Vector2()
	private readonly vecPosition = new Vector2()
	private readonly draggingOffset = new Vector2()

	private readonly inGameColor = new Color(0xcf, 0xcf, 0xcf)
	private readonly inSelectionColor = new Color(0xaa, 0xaa, 0xaa)

	private readonly recIcon = new Rectangle()
	private readonly position = new Rectangle()
	private readonly basePath = "github.com/octarine-public/mmr-tracker/scripts_files/"
	private readonly header = this.basePath + "images/header.svg"

	private readonly imageHeader = ImageData.GetRankTexture(LaneSelection.SUPPORT)

	public get IsReady() {
		return GUIInfo !== undefined && GUIInfo.TopBar !== undefined
	}

	public get IsGameInProgress() {
		return this.gameState === DOTAGameState.DOTA_GAMERULES_STATE_GAME_IN_PROGRESS
	}

	public get IsPostGame() {
		return this.gameState === DOTAGameState.DOTA_GAMERULES_STATE_POST_GAME
	}

	public get IsUIGame() {
		return GameState.UIState === DOTAGameUIState.DOTA_GAME_UI_DOTA_INGAME
	}

	private get color() {
		return this.isPreGame ? this.inGameColor : this.inSelectionColor
	}

	private get gameState() {
		return GameRules?.GameState ?? DOTAGameState.DOTA_GAMERULES_STATE_INIT
	}

	private get isPreGame() {
		return this.gameState === DOTAGameState.DOTA_GAMERULES_STATE_PRE_GAME
	}

	private get isShowCase() {
		return this.gameState === DOTAGameState.DOTA_GAMERULES_STATE_TEAM_SHOWCASE
	}

	private get isSelection() {
		return (
			(this.gameState > DOTAGameState.DOTA_GAMERULES_STATE_INIT &&
				this.gameState <= DOTAGameState.DOTA_GAMERULES_STATE_STRATEGY_TIME) ||
			this.gameState === DOTAGameState.DOTA_GAMERULES_STATE_PLAYER_DRAFT
		)
	}

	public Draw(menu: MenuManager) {
		if (!menu.State) {
			return
		}
		const vecPosition = this.UpdateScale(menu)
		const alpha = (Math.max(menu.Opacity.value, this.dragging ? 100 : 50) / 100) * 255

		// background
		RendererSDK.Image(
			this.header,
			this.position.pos1,
			-1,
			this.position.Size,
			Color.White.SetA(alpha)
		)

		this.DrawInformation(alpha)
		this.DrawDetails()
		this.UpdatePosition(menu, vecPosition)
	}

	protected DrawDetails() {
		const basePos = this.position.Clone()
		const playerCount = 5
		for (let i = 0; i < playerCount; i++) {
			const pos = basePos.Clone().AddY(30 * i)
			RendererSDK.TextByFlags(
				"Player " + i,
				pos,
				Color.White.SetA(255),
				3,
				TextFlags.Center | TextFlags.Left
			)
		}
		// RendererSDK.Image(
		// 	this.header,
		// 	basePos.pos1,
		// 	-1,
		// 	this.position.Size,
		// 	Color.White.SetA(255)
		// )
	}

	protected DrawInformation(alpha: number) {
		// left icon
		RendererSDK.Image(
			this.imageHeader,
			this.recIcon.pos1,
			-1,
			this.recIcon.Size,
			Color.White.SetA(alpha)
		)

		const basePos = this.position.Clone()
		const flags = TextFlags.Center | TextFlags.Left

		const indentationX = 4
		const startPos = basePos.AddX((this.recIcon.Width + indentationX) * (88 / 64))

		const trackerPos = RendererSDK.TextByFlags(
			"TESTE",
			startPos,
			Color.White.SetA(alpha),
			3,
			flags
		)
	}

	public MouseKeyUp() {
		if (!this.dragging) {
			return true
		}
		this.dragging = false
		Menu.Base.SaveConfigASAP = true
		return false
	}

	public MouseKeyDown() {
		if (this.dragging) {
			return true
		}
		const pos = this.position
		const mouse = Input.CursorOnScreen
		if (!mouse.IsUnderRectangle(pos.x, pos.y, pos.Width, pos.Height)) {
			return true
		}
		this.dragging = true
		mouse.Subtract(pos.pos1).CopyTo(this.draggingOffset)
		return false
	}

	protected UpdateScale(menu: MenuManager) {
		const panelSize = GUIInfo.ScaleVector(250, 35)
		this.vecSize.CopyFrom(panelSize)

		const menuPos = menu.Position
		const panelPosition = GUIInfo.ScaleVector(menuPos.X.value, menuPos.Y.value)
		this.vecPosition.CopyFrom(panelPosition)

		this.position.pos1.CopyFrom(panelPosition)
		this.position.pos2.CopyFrom(panelPosition.Add(panelSize))

		const iconSize = GUIInfo.ScaleVector(24, 24)
		this.recIcon.pos1.CopyFrom(panelPosition)
		this.recIcon.pos2.CopyFrom(panelPosition.Add(iconSize))

		this.recIcon.x += this.recIcon.Width / 4
		this.recIcon.y += this.recIcon.Height / 4

		return panelPosition
	}

	protected UpdatePosition(menu: MenuManager, position: Vector2) {
		if (!this.dragging) {
			// NOTE: update full panel if added new unit's or items
			this.updateMinMaxPanelPosition(menu, position)
			return
		}
		const wSize = RendererSDK.WindowSize
		const mousePos = Input.CursorOnScreen
		const toPosition = mousePos
			.SubtractForThis(this.draggingOffset)
			.Min(wSize.Subtract(this.position.Size))
			.Max(0)
			.CopyTo(position)
		this.saveNewPosition(menu, toPosition)
	}

	private updateMinMaxPanelPosition(menu: MenuManager, position: Vector2) {
		const wSize = RendererSDK.WindowSize
		const totalSize = this.position.Size
		const newPosition = position
			.Min(wSize.Subtract(totalSize))
			.Max(0)
			.CopyTo(position)
		this.saveNewPosition(menu, newPosition)
	}

	private saveNewPosition(menu: MenuManager, newPosition?: Vector2) {
		const position = newPosition ?? this.vecPosition
		menu.Position.Vector = position
			.Clone()
			.DivideScalarX(GUIInfo.GetWidthScale())
			.DivideScalarY(GUIInfo.GetHeightScale())
			.RoundForThis(1)
	}
}

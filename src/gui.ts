import {
	Color,
	DOTAGameState,
	DOTAGameUIState,
	GameRules,
	GameState,
	GUIInfo,
	ImageData,
	LaneSelection,
	Menu,
	Rectangle,
	RendererSDK,
	Team,
	TextFlags,
	Vector2
} from "github.com/octarine-public/wrapper/index"

import { MenuManager } from "./menu"

export class GUIHelper {
	private readonly inGameColor = new Color(0xcf, 0xcf, 0xcf)
	private readonly inSelectionColor = new Color(0xaa, 0xaa, 0xaa)
	private readonly position = new Rectangle()

	private readonly roleLocalizationNames = [
		"DOTA_TopBar_LaneSelectionSafelane",
		"DOTA_TopBar_LaneSelectionOfflane",
		"DOTA_TopBar_LaneSelectionMidlane",
		"DOTA_TopBar_LaneSelectionSupport",
		"DOTA_TopBar_LaneSelectionHardSupport"
	]

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
		const basePos = this.position.Clone()
		const startPos = basePos.AddX(10)
		const flags = TextFlags.Center | TextFlags.Left
		const trackerPos = RendererSDK.TextByFlags(
			"TESTE",
			startPos,
			Color.White.SetA(255),
			3,
			flags
		)

		// if (this.isShowCase) {
		// 	return
		// }
		// const laneSelections = player.LaneSelections
		// const rolePosition = this.getPosition(player.Team, player.TeamSlot)?.Clone()
		// if (rolePosition === undefined) {
		// 	return
		// }
		// const size = rolePosition.Height
		// const roleImageSize = new Vector2(size, size)
		// if (this.isPreGame) {
		// 	const length = laneSelections.length / 10
		// 	const count = 2 - length
		// 	rolePosition.Height *= count
		// 	roleImageSize.MultiplyScalarForThis(count)
		// }
		// if (laneSelections.length === 1) {
		// 	this.drawTextForRole(rolePosition, laneSelections[0])
		// 	return
		// }
		// // render multiple tier icons from center
		// const xPosition = rolePosition.x + rolePosition.Size.x / 2
		// for (let index = laneSelections.length - 1; index > -1; index--) {
		// 	const lane = laneSelections[index]
		// 	const iconTier = ImageData.GetRankTexture(lane)
		// 	const position = new Vector2(xPosition, rolePosition.y + 1)
		// 		.AddScalarX(index * roleImageSize.x)
		// 		.SubtractScalarX((roleImageSize.x * laneSelections.length) / 2)
		// 	RendererSDK.Image(iconTier, position, -1, roleImageSize, this.color)
		// }
	}

	private getPosition(team: Team, slotId: number): Nullable<Rectangle> {
		if (this.isSelection) {
			return team === Team.Dire
				? GUIInfo.PreGame.DirePlayersRoles[slotId]
				: GUIInfo.PreGame.RadiantPlayersRoles[slotId]
		}
		return team === Team.Dire
			? GUIInfo.TopBar.DirePlayersManabars[slotId]
			: GUIInfo.TopBar.RadiantPlayersManabars[slotId]
	}

	private getRoleName(role: LaneSelection) {
		return Menu.Localization.Localize(this.roleLocalizationNames[role] ?? "No role")
	}

	private drawTextForRole(position: Rectangle, lane: LaneSelection) {
		if (!this.isPreGame) {
			this.drawInHeroSelection(position, lane)
			return
		}

		const division = 1.7
		const roleName = this.getRoleName(lane)
		if (roleName.length < 10) {
			this.drawText(roleName, position, division, TextFlags.Top)
			return
		}

		const names = roleName.split(" ")
		const gapBetweenName = GUIInfo.ScaleHeight(13)

		for (const newName of names) {
			this.drawText(newName, position, division, TextFlags.Top)
			position.AddY(gapBetweenName)
		}
	}

	private drawInHeroSelection(rolePosition: Rectangle, lane: LaneSelection) {
		const size = GUIInfo.ScaleWidth(16)
		const roleName = this.getRoleName(lane)
		const iconTier = ImageData.GetRankTexture(lane)
		const newPosition = rolePosition.Clone()
		newPosition.pos1.AddScalarX(size / 2)
		const textPosition = this.drawText(roleName, newPosition)
		const imageSize = new Vector2(size, size)
		const iconPosition = textPosition.pos1
			.SubtractScalarY(2)
			.SubtractScalarX(imageSize.x)
		RendererSDK.Image(iconTier, iconPosition, -1, imageSize, this.color)
	}

	private drawText(
		text: string,
		position: Rectangle,
		divider = 1.4,
		flags = TextFlags.Center
	) {
		return RendererSDK.TextByFlags(
			text,
			position,
			this.color,
			divider,
			flags,
			600,
			RendererSDK.DefaultFontName,
			false,
			false,
			false
		)
	}
}

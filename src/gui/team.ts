import {
	Color,
	GameState,
	GUIInfo,
	ImageData,
	Rectangle,
	RendererSDK,
	Team,
	Vector2,
	Vector3
} from "github.com/octarine-public/wrapper/index"

import { TotalNetWorthMenu } from "../menu"

export class TeamGUI {
	protected Dire = 0
	protected Radiant = 0

	protected Team = Team.Radiant
	protected readonly BgColor = new Color(0x0, 0x0, 0x0, 0xdc)

	protected get GUIReady() {
		return GUIInfo !== undefined && GUIInfo.TopBar !== undefined
	}

	public Draw(menu: TotalNetWorthMenu, radiant: number, dire: number) {
		if (!menu.State.value || !this.GUIReady) {
			return
		}

		this.Dire = dire
		this.Radiant = radiant

		if (!menu.Difference.value) {
			this.redenderAllTeams(menu)
			return
		}

		const color = menu.TextColor.SelectedColor
		const distinction = this.Radiant - this.Dire
		const teamDistinction = distinction > 0 ? Team.Radiant : Team.Dire
		const position = this.getPosition(teamDistinction)
		this.renderComponent(position, teamDistinction, color, distinction)
	}

	public GameChanged() {
		this.Team = Team.Radiant
		this.Dire = this.Radiant = 0
	}

	private redenderAllTeams(menu: TotalNetWorthMenu) {
		const textColor = menu.TextColor.SelectedColor
		const direPosition = this.getPosition(Team.Dire)
		const radiantPosition = this.getPosition(Team.Radiant)
		this.renderComponent(direPosition, Team.Dire, textColor)
		this.renderComponent(radiantPosition, Team.Radiant, textColor)
	}

	private renderComponent(
		position: Rectangle,
		team = Team.Radiant,
		textColor: Color,
		sum?: number
	) {
		this.renderBackground(position)
		const cPosition = position.Clone()
		const fontName = RendererSDK.DefaultFontName

		const textSize = GUIInfo.ScaleHeight(11)
		const text = this.calcSummToStr(this.serializeSum(team, sum))
		const getTextSize = RendererSDK.GetTextSize(text, fontName, textSize, 600)

		const calcPosition = cPosition.x + cPosition.Size.x / 2
		const centerPosition = new Vector2(calcPosition, cPosition.y)

		const textPosition = centerPosition
			.Clone()
			.AddScalarY(3)
			.SubtractScalarX(getTextSize.x / 2)

		RendererSDK.Text(text, textPosition, textColor, fontName, textSize, 600)

		const size = GUIInfo.ScaleWidth(12)
		const iconSize = new Vector2(size, size)
		this.renderGoldIcon(textPosition, getTextSize, iconSize)
		this.renderDiffIcon(textPosition, getTextSize, iconSize, team)
	}

	private renderDiffIcon(
		position: Vector2,
		textSize: Vector3,
		iconSize: Vector2,
		team: Team
	) {
		const localTeam = GameState.LocalTeam
		const imageTeam =
			localTeam === team || localTeam === Team.Observer
				? ImageData.Paths.Icons.arrow_gold_dif
				: ImageData.Paths.Icons.arrow_plus_stats_red

		const iconPosition = position.SubtractScalarX(textSize.x + iconSize.x + 1)
		RendererSDK.Image(imageTeam, iconPosition, -1, iconSize, Color.White)
	}

	private renderGoldIcon(position: Vector2, textSize: Vector3, iconSize: Vector2) {
		const image = ImageData.Paths.Icons.gold_large
		const iconPosition = position.AddScalarX(textSize.x).AddScalarY(iconSize.y / 8)
		RendererSDK.Image(image, iconPosition, -1, iconSize, Color.White)
	}

	private renderBackground(position: Rectangle) {
		RendererSDK.Image(
			ImageData.Paths.Icons.chat_preview_opacity_mask,
			position.pos1,
			-1,
			position.Size,
			this.BgColor,
			0,
			undefined,
			false,
			new Vector2(),
			RendererSDK.GetImageSize(ImageData.Paths.Icons.chat_preview_opacity_mask)
		)
	}

	private serializeSum(team: Team, sum?: number) {
		const convertSum = (newSum: number) => (newSum < 0 ? newSum * -1 : newSum)
		if (sum !== undefined) {
			return convertSum(sum)
		}
		sum ??= team === Team.Dire ? this.Dire : this.Radiant
		return convertSum(sum)
	}

	private calcSummToStr(sum: number) {
		const total = Math.min(sum / 1000, 99)
		const moduleSum = (total * 100) % 50
		const minTotal = Math.max(Math.floor(total), 1)
		return (
			(moduleSum === 0
				? minTotal
				: moduleSum > 30
				? "<" + minTotal
				: ">" + minTotal) + "k"
		)
	}

	private getPosition(team?: Team) {
		const absPosition =
			(team ?? this.Team) === Team.Dire
				? GUIInfo.TopBar.DireSpectatorGoldDisplay.Clone()
				: GUIInfo.TopBar.RadiantSpectatorGoldDisplay.Clone()

		// any team?
		if ((team ?? this.Team) === Team.Dire || (team ?? this.Team) === Team.Radiant) {
			absPosition.AddX(1) // [+] 2px
		}

		return absPosition
	}
}

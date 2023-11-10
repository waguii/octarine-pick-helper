import {
	Color,
	GameState,
	GUIInfo,
	ImageData,
	Input,
	Menu,
	Player,
	RendererSDK,
	Team,
	Vector2
} from "github.com/octarine-public/wrapper/index"

import { MenuManager } from "../menu"

export class PlayerGUI {
	private dirtyPosition = false
	private isUnderRectangle = false
	private readonly Position = new Vector2()
	private readonly mouseOnPanel = new Vector2()
	private readonly path = "github.com/octarine-public/net-worth/scripts_files"

	public Draw(menu: MenuManager, position: Vector2, player: Player) {
		const textSize = menu.Size
		const lineSize = menu.LineSize
		const playerSize = menu.PlayerSize

		const ally = menu.Ally.value
		const enemy = menu.Enemy.value
		const hideLocal = !menu.Local.value

		if (
			(player.IsEnemy() && !enemy) ||
			(!player.IsEnemy() && !ally) ||
			(player.IsLocalPlayer && hideLocal)
		) {
			return
		}

		this.Gradient(position, lineSize, player.IsEnemy(), player.Team)
		this.Icon(player, position, playerSize)
		this.Text(player, position, lineSize, playerSize, textSize)
		position.AddForThis(new Vector2(0, playerSize.y + 2))
	}

	public MouseKeyUp(menu: MenuManager) {
		if (!this.dirtyPosition) {
			return true
		}

		Menu.Base.SaveConfigASAP = true
		this.dirtyPosition = false

		menu.SettingsPosition.Vector = menu.GetPanelPos.Clone()
			.DivideScalarX(GUIInfo.GetWidthScale())
			.DivideScalarY(GUIInfo.GetHeightScale())
			.RoundForThis(1)

		return true
	}

	public MouseKeyDown(menu: MenuManager) {
		if (this.dirtyPosition) {
			return true
		}

		const Size = menu.PlayerSize
		const position = menu.GetPanelPos
		const isHoverPanel = Input.CursorOnScreen.IsUnderRectangle(
			position.x,
			position.y,
			Size.x,
			Size.y
		)

		if (!isHoverPanel) {
			return true
		}

		this.dirtyPosition = true
		this.mouseOnPanel.CopyFrom(Input.CursorOnScreen.Subtract(this.Position))
		return false
	}

	public CopyTouch(menu: MenuManager, position: Vector2, mousePos: Vector2) {
		this.Position.CopyFrom(position)

		if (!this.dirtyPosition) {
			return
		}

		position.CopyFrom(mousePos.Subtract(this.mouseOnPanel))
		menu.SettingsPosition.Vector = position
			.Clone()
			.DivideScalarX(GUIInfo.GetWidthScale())
			.DivideScalarY(GUIInfo.GetHeightScale())
			.RoundForThis(1)
	}

	public GameChanged() {
		this.Position.toZero()
		this.mouseOnPanel.toZero()
		this.dirtyPosition = false
		this.isUnderRectangle = false
	}

	protected Text(
		player: Player,
		position: Vector2,
		lineSize: Vector2,
		playerSize: Vector2,
		textSize: number
	) {
		const pos = position.Add(new Vector2(playerSize.x + 5, lineSize.y - textSize - 2))
		const text = this.isUnderRectangle
			? this.serializePlayerName(player)
			: this.serializeNetWorth(player.NetWorth)
		RendererSDK.Text(text, pos, Color.White, RendererSDK.DefaultFontName, textSize)
	}

	protected Icon(player: Player, position: Vector2, size: Vector2) {
		const cursorOnScreen = Input.CursorOnScreen
		this.isUnderRectangle = cursorOnScreen.IsUnderRectangle(
			position.x,
			position.y,
			size.x,
			size.y
		)
		RendererSDK.Image(ImageData.GetHero(player.HeroName ?? ""), position, -1, size)
		RendererSDK.FilledRect(
			position.Clone().SubtractScalarX(3),
			new Vector2(3, size.y),
			player.PlayerColor.SetA(180)
		)
	}

	protected Gradient(position: Vector2, size: Vector2, isEnemy = false, team: Team) {
		let color: Color
		if (GameState.LocalTeam === Team.Observer) {
			color = team === Team.Dire ? Color.Red.SetA(200) : Color.Green.SetA(200)
		} else {
			color = isEnemy ? Color.Red.SetA(200) : Color.Green.SetA(200)
		}
		RendererSDK.Image(
			`${this.path}/networth_gradient.svg`,
			position,
			-1,
			size.Clone().MultiplyScalarX(0.85),
			color
		)
	}

	private serializePlayerName(player: Player) {
		const name = player.PlayerName ?? player.NetWorth.toString()
		return name.length > 8 ? name.slice(0, 7) + "…" : name
	}

	private serializeNetWorth(netWorth: number) {
		return netWorth.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1 ")
	}
}

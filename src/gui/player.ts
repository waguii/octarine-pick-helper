import {
	Color,
	GameState,
	GUIInfo,
	ImageData,
	Input,
	Menu,
	PlayerCustomData,
	Rectangle,
	RendererSDK,
	Team,
	TextFlags,
	Vector2
} from "github.com/octarine-public/wrapper/index"

import { MenuManager } from "../menu"

export class PlayerGUI {
	public readonly TotalPosition = new Rectangle()

	private dragging = false
	private isUnderRectangle = false
	private readonly path = "github.com/octarine-public/net-worth/scripts_files"

	private readonly draggingOffset = new Vector2()
	private readonly scaleGradientSize = new Vector2()
	private readonly scalePositionPanel = new Vector2()
	private readonly scaleUnitImageSize = new Vector2()

	constructor(private readonly menu: MenuManager) {
		this.menu.Size.OnValue(() => this.updateScaleSize())
		this.menu.Position.X.OnValue(() => this.updateScalePosition())
		this.menu.Position.Y.OnValue(() => this.updateScalePosition())
	}

	public UpdateSetPosition(position: Rectangle) {
		const positionPanel = this.scalePositionPanel
		const unitImageSize = this.scaleUnitImageSize

		position.x = positionPanel.x
		position.y = positionPanel.y
		position.Width = unitImageSize.x
		position.Height = unitImageSize.y

		this.TotalPosition.pos1.CopyFrom(position.pos1)
		this.TotalPosition.pos2.CopyFrom(position.pos2)
	}

	public Draw(player: PlayerCustomData, enabledPlayers: number[], position: Rectangle) {
		const gap = 2
		const menu = this.menu
		const ally = menu.Ally.value
		const enemy = menu.Enemy.value

		const dragging = this.dragging
		const isEnemy = player.IsEnemy()

		const hideLocal = !menu.Local.value && player.IsLocalPlayer
		if ((isEnemy && !enemy) || (!isEnemy && !ally) || hideLocal) {
			return
		}

		// player image
		let count = 0
		const heroName = player.HeroName ?? ""
		const texturePath = ImageData.GetHeroTexture(heroName)
		const opacity = Math.round((1 - menu.Opacity.value / 100) * 255)

		const imageRect = position.Clone()
		this.FieldRect(imageRect, Color.Black.SetA(opacity), dragging)
		imageRect.x += gap / 2
		imageRect.y += gap / 2
		imageRect.Width -= gap
		imageRect.Height -= gap
		this.Image(texturePath, imageRect, Color.White.SetA(opacity), dragging)

		// player image border left
		const leftBorder = imageRect.Clone()
		leftBorder.Width = GUIInfo.ScaleWidth(gap)
		this.FieldRect(leftBorder, player.Color.Clone().SetA(opacity), dragging)

		// player gradient border right
		const gPosition = position.Clone()
		gPosition.x += position.Width
		gPosition.Width = this.scaleGradientSize.x
		gPosition.Height = this.scaleGradientSize.y
		this.Gradient(gPosition, isEnemy, player.Team, opacity, dragging)

		this.isUnderRectangle =
			position.Contains(Input.CursorOnScreen) ||
			gPosition.Contains(Input.CursorOnScreen) ||
			gPosition.Contains(Input.CursorOnScreen)

		this.Text(gPosition, player, opacity) // NOTE: not cloned gPosition

		count++
		enabledPlayers.push(count)
		position.AddY(position.Height + gap / 2)
		this.TotalPosition.Height += position.Height
	}

	public UpdatePositionAfter() {
		const position = this.scalePositionPanel
		if (!this.dragging) {
			// NOTE: update full panel if added new unit's or items
			this.updateMinMaxPanelPosition(position)
			return
		}
		this.BackgroundDrag()
		const wSize = RendererSDK.WindowSize
		const mousePos = Input.CursorOnScreen
		const toPosition = mousePos
			.SubtractForThis(this.draggingOffset)
			.Min(wSize.Subtract(this.TotalPosition.Size))
			.Max(0)
			.CopyTo(position)
		this.saveNewPosition(toPosition)
	}

	public MouseKeyUp() {
		if (!this.dragging) {
			return true
		}
		this.dragging = false
		Menu.Base.SaveConfigASAP = true
		return true
	}

	public MouseKeyDown() {
		if (this.dragging) {
			return true
		}
		const menu = this.menu.TouchKeyPanel
		const isTouch = menu.isPressed || menu.assignedKey === -1
		if (!isTouch) {
			return true
		}
		const mouse = Input.CursorOnScreen
		const recPos = this.TotalPosition
		if (!mouse.IsUnderRectangle(recPos.x, recPos.y, recPos.Width, recPos.Height)) {
			return true
		}
		this.dragging = true
		mouse.Subtract(recPos.pos1).CopyTo(this.draggingOffset)
		return false
	}

	public CalculateBottomSize(enabledPlayers: number[], position: Rectangle) {
		this.TotalPosition.Width += this.scaleGradientSize.x
		this.TotalPosition.Height -= position.Height - enabledPlayers.length
	}

	public GameChanged() {
		this.dragging = false
		this.isUnderRectangle = false
		this.draggingOffset.toZero()
	}

	public ResetSettings() {
		this.updateScaleSize()
		this.updateScalePosition()
		this.saveNewPosition()
	}

	protected Text(position: Rectangle, player: PlayerCustomData, opacity: number) {
		// NOTE: since it is the last element, position.Clone() is ignored for optimization
		const text = this.isUnderRectangle
			? this.serializePlayerName(player)
			: this.serializeNetWorth(player.NetWorth)
		position.x += position.Height / 6
		const flags = TextFlags.Center | TextFlags.Left
		RendererSDK.TextByFlags(
			text,
			position,
			Color.White.SetA(opacity + 20),
			1.6,
			flags,
			400
		)
	}

	protected Image(
		path: string,
		position: Rectangle,
		color = Color.White,
		grayscale?: boolean,
		round: number = -1
	) {
		RendererSDK.Image(
			path,
			position.pos1,
			round,
			position.Size,
			color,
			undefined,
			undefined,
			grayscale
		)
	}

	protected FieldRect(position: Rectangle, color = Color.White, grayscale?: boolean) {
		RendererSDK.FilledRect(
			position.pos1,
			position.Size,
			color,
			undefined,
			undefined,
			grayscale
		)
	}

	protected Gradient(
		position: Rectangle,
		isEnemy = false,
		team: Team,
		opacity: number,
		grayscale?: boolean
	) {
		opacity = Math.min(opacity, 200)
		const localTeam = GameState.LocalTeam
		const gradientColor =
			localTeam === Team.Observer
				? team === Team.Dire
					? Color.Red.SetA(opacity)
					: Color.Green.SetA(opacity)
				: isEnemy
				? Color.Red.SetA(opacity)
				: Color.Green.SetA(opacity)
		this.Image(
			`${this.path}/networth_gradient.svg`,
			position,
			gradientColor,
			grayscale
		)
	}

	protected BackgroundDrag() {
		const position = this.TotalPosition
		const division = position.Height / 10 - this.menu.Size.value / 3
		RendererSDK.FilledRect(position.pos1, position.Size, Color.Black.SetA(100))
		RendererSDK.TextByFlags(
			Menu.Localization.Localize("NetWorth_Drag"),
			position,
			Color.White,
			division
		)
	}

	private serializePlayerName(player: PlayerCustomData) {
		const name = player.PlayerName ?? player.NetWorth.toString()
		return name.length > 8 ? name.slice(0, 7) + "…" : name
	}

	private serializeNetWorth(netWorth: number) {
		return netWorth.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1 ")
	}

	private updateMinMaxPanelPosition(position: Vector2) {
		const wSize = RendererSDK.WindowSize
		const totalSize = this.TotalPosition.Size
		const newPosition = position
			.Min(wSize.Subtract(totalSize))
			.Max(0)
			.CopyTo(position)
		this.saveNewPosition(newPosition)
	}

	private updateScaleSize() {
		const minSize = 20
		const sizeMenu = this.menu.Size.value
		const size = Math.min(Math.max(sizeMenu + minSize, minSize), minSize * 2)
		this.scaleUnitImageSize.y = this.scaleGradientSize.y = GUIInfo.ScaleHeight(size)

		this.scaleGradientSize.x = GUIInfo.ScaleWidth(size * 3)
		this.scaleUnitImageSize.x = GUIInfo.ScaleWidth(size * 1.6)
	}

	private updateScalePosition() {
		const menuPosition = this.menu.Position
		const valueX = Math.max(GUIInfo.ScaleWidth(menuPosition.X.value), 0)
		this.scalePositionPanel.x = valueX
		const valueY = Math.max(GUIInfo.ScaleHeight(menuPosition.Y.value), 0)
		this.scalePositionPanel.y = valueY
	}

	private saveNewPosition(newPosition?: Vector2) {
		const position = newPosition ?? this.scalePositionPanel
		this.menu.Position.Vector = position.RoundForThis(1)
	}
}

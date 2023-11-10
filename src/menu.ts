import {
	Color,
	GUIInfo,
	Menu,
	NotificationsSDK,
	ResetSettingsUpdated,
	Sleeper,
	Vector2
} from "github.com/octarine-public/wrapper/index"

export class TotalNetWorthMenu {
	public readonly State: Menu.Toggle
	public readonly Difference: Menu.Toggle
	public readonly TextColor: Menu.ColorPicker

	protected readonly Menu: Menu.Node

	constructor(tree: Menu.Node) {
		this.Menu = tree.AddNode(
			"Between teams",
			"panorama/images/hud/reborn/graph_icon_psd.vtex_c"
		)
		this.Menu.SortNodes = false
		this.State = this.Menu.AddToggle("State", true)
		this.Difference = this.Menu.AddToggle("Show only difference", true)
		this.TextColor = this.Menu.AddColorPicker("Text color", new Color(242, 195, 30))
	}

	public ResetSettings() {
		this.State.value = this.Difference.value = true
		this.TextColor.SelectedColor.CopyFrom(new Color(242, 195, 30))
	}
}

export class MenuManager {
	public readonly State: Menu.Toggle
	public readonly Ally: Menu.Toggle
	public readonly Enemy: Menu.Toggle
	public readonly Local: Menu.Toggle

	public readonly Total: TotalNetWorthMenu
	public readonly SettingsPosition: {
		readonly node: Menu.Node
		readonly X: Menu.Slider
		readonly Y: Menu.Slider
		Vector: Vector2
	}

	protected readonly Menu: Menu.Node
	protected readonly Entries: Menu.Node

	protected readonly SettingsTree: Menu.Node
	protected readonly SettingsSize: Menu.Slider

	private readonly sleeper = new Sleeper()

	constructor() {
		this.Entries = Menu.AddEntry("Visual")

		this.Menu = this.Entries.AddNode(
			"Net worth",
			"panorama/images/hud/reborn/graph_icon_psd.vtex_c"
		)

		this.Menu.SortNodes = false
		this.State = this.Menu.AddToggle("State", true)

		this.Ally = this.Menu.AddToggle("Allies", true)
		this.Enemy = this.Menu.AddToggle("Enemies", true)
		this.Local = this.Menu.AddToggle("You net worth", true, "Show your own net worth")
		this.Local.IsHidden = true

		this.SettingsTree = this.Menu.AddNode(
			"Settings heroes",
			"menu/icons/settings.svg"
		)
		this.SettingsSize = this.SettingsTree.AddSlider("Size", 18, 18, 60)
		this.SettingsPosition = this.Menu.AddVector2(
			"Settings heroes",
			new Vector2(7, 309),
			new Vector2(0, 0),
			new Vector2(1920, 1080)
		)

		this.Total = new TotalNetWorthMenu(this.Menu)

		this.Ally.OnValue(call => (this.Local.IsHidden = !call.value))

		this.Menu.AddButton("Reset", "Reset settings").OnValue(() => {
			if (this.sleeper.Sleeping("ResetSettings")) {
				return
			}
			this.ResetSettings()
			this.sleeper.Sleep(1000, "ResetSettings")
			NotificationsSDK.Push(new ResetSettingsUpdated())
		})
	}

	public get PlayerSize() {
		return new Vector2(
			GUIInfo.ScaleWidth(this.SettingsSize.value * 1.5),
			GUIInfo.ScaleHeight(this.SettingsSize.value)
		)
	}

	public get Size() {
		return GUIInfo.ScaleHeight(this.SettingsSize.value * 0.7)
	}

	public get LineSize() {
		return new Vector2(
			GUIInfo.ScaleWidth(this.SettingsSize.value * 5.5),
			GUIInfo.ScaleHeight(this.SettingsSize.value)
		)
	}

	public get GetPanelPos(): Vector2 {
		return new Vector2(
			GUIInfo.ScaleWidth(this.SettingsPosition.Vector.x),
			GUIInfo.ScaleHeight(this.SettingsPosition.Vector.y)
		)
	}

	protected ResetSettings() {
		this.Total.ResetSettings()
		this.SettingsSize.value = 18
		this.Local.IsHidden = false
		this.SettingsPosition.X.value = 7
		this.SettingsPosition.Y.value = 309
		this.State.value = this.Ally.value = true
		this.Local.value = this.Enemy.value = true
	}
}

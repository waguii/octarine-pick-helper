import { Color, Menu, Vector2 } from "github.com/octarine-public/wrapper/index"

export class TotalNetWorthMenu {
	public readonly State: Menu.Toggle
	public readonly Difference: Menu.Toggle
	public readonly TextColor: Menu.ColorPicker

	constructor(tree: Menu.Node) {
		const menu = tree.AddNode(
			"Between teams",
			"panorama/images/hud/reborn/graph_icon_psd.vtex_c"
		)
		menu.SortNodes = false
		this.State = menu.AddToggle("State", true)
		this.Difference = menu.AddToggle("Show only difference", true)
		this.TextColor = menu.AddColorPicker("Text color", new Color(242, 195, 30))
	}

	public ResetSettings() {
		this.State.value = this.Difference.value = true
		this.TextColor.SelectedColor.CopyFrom(new Color(242, 195, 30))
	}
}

export class MenuManager {
	public IsToggled = true
	public readonly Reset: Menu.Button
	public readonly State: Menu.Toggle
	public readonly Ally: Menu.Toggle
	public readonly Enemy: Menu.Toggle
	public readonly Local: Menu.Toggle

	public readonly ModeKey: Menu.Dropdown
	public readonly ToggleKey: Menu.KeyBind

	public readonly Size: Menu.Slider
	public readonly Total: TotalNetWorthMenu

	public readonly Position: {
		readonly node: Menu.Node
		readonly X: Menu.Slider
		readonly Y: Menu.Slider
		Vector: Vector2
	}

	constructor() {
		const entries = Menu.AddEntry("Visual")
		const menu = entries.AddNode(
			"Net worth",
			"panorama/images/hud/reborn/graph_icon_psd.vtex_c"
		)
		menu.SortNodes = false

		this.State = menu.AddToggle("State", true)
		this.Ally = menu.AddToggle("Allies", true)
		this.Enemy = menu.AddToggle("Enemies", true)
		this.Local = menu.AddToggle("You net worth", true, "Show your own net worth")
		this.Local.IsHidden = true

		const settingsTree = menu.AddNode("Settings heroes", "menu/icons/settings.svg")
		settingsTree.SortNodes = false

		this.ToggleKey = settingsTree.AddKeybind("Key", "", "Key bind turn on/off panel")
		this.ModeKey = settingsTree.AddDropdown("Key mode", ["Hold key", "Toggled"], 1)
		this.Size = settingsTree.AddSlider("Size", 0, 0, 20)

		this.Position = menu.AddVector2(
			"Settings heroes",
			new Vector2(0, 355),
			new Vector2(0, 0),
			new Vector2(1920, 1080)
		)

		this.Total = new TotalNetWorthMenu(menu)
		this.Reset = menu.AddButton("Reset", "Reset settings")

		this.Ally.OnValue(call => (this.Local.IsHidden = !call.value))
		this.ToggleKey.OnRelease(() => (this.IsToggled = !this.IsToggled))
	}

	public ResetSettings() {
		this.Total.ResetSettings()
		this.Size.value = 0
		this.Local.IsHidden = false
		this.Position.X.value = 0
		this.Position.Y.value = 355
		this.State.value = this.Ally.value = true
		this.Local.value = this.Enemy.value = true
	}
}

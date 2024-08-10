import "./translations"

import {
	DOTAGameUIState,
	EventsSDK,
	GameState,
	InputEventSDK,
	VMouseKeys
} from "github.com/octarine-public/wrapper/index"

import { GUIHelper } from "./gui"
import { MenuManager } from "./menu"

const bootstrap = new (class CPickHelper {
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
	}

	public MouseKeyUp(key: VMouseKeys) {
		if (!this.shouldInput(key)) {
			return true
		}
		return this.gui.MouseKeyUp()
	}

	public MouseKeyDown(key: VMouseKeys) {
		if (!this.shouldInput(key)) {
			return true
		}
		return this.gui.MouseKeyDown()
	}

	private shouldInput(key: VMouseKeys) {
		if (!this.State || key !== VMouseKeys.MK_LBUTTON) {
			return false
		}
		return !this.InGameUIState
	}
})()

EventsSDK.on("Draw", () => bootstrap.Draw())
InputEventSDK.on("MouseKeyUp", key => bootstrap.MouseKeyUp(key))
InputEventSDK.on("MouseKeyDown", key => bootstrap.MouseKeyDown(key))

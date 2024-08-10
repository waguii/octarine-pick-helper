import { ImageData, LaneSelection, Menu } from "github.com/octarine-public/wrapper/index"

export class MenuManager {
	public readonly State: Menu.Toggle

	private readonly imageNode = ImageData.GetRankTexture(LaneSelection.SUPPORT)

	constructor() {
		const main = Menu.AddEntry("Visual")
		const node = main.AddNode("Pick Helper", this.imageNode)
		this.State = node.AddToggle("State", true)
	}
}

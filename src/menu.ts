import { ImageData, LaneSelection, Menu } from "github.com/octarine-public/wrapper/index"

export class MenuManager {
	public readonly State: Menu.Toggle

	private readonly imageNode = ImageData.GetRankTexture(LaneSelection.MID_LANE)

	constructor() {
		const main = Menu.AddEntry("Visual")
		const node = main.AddNode("Ranked roles", this.imageNode)
		this.State = node.AddToggle("State", true)
	}
}

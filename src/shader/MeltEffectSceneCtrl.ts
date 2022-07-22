import { ui } from "../ui/layaMaxUI";
import ShaderDissolve from "./ShaderDissolve";

export default class MeltEffectSceneCtrl extends ui.shader.MeltEffectUI {
    private shaderDissolve: ShaderDissolve;

    onAwake(): void {
        this.shaderDissolve = this.img.getComponent(ShaderDissolve);
    }

    onEnable(): void {
        this.slider.on(Laya.Event.CHANGE, this, () => {
            this.shaderDissolve.dissolveThreshold = this.slider.value;
        })
    }
}
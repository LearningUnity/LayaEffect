import { ui } from "../../ui/layaMaxUI";
import { LightningMgr } from "./LightningMgr";

export default class LightningSceneCtrl extends ui.canvas.LightningUI {
    onAwake(): void {
        console.log('onAwake');
        this.addUIEvent();
    }
    onEnable(): void {
        LightningMgr.ins.init(this.sp_lightning);
        LightningMgr.ins.startTimer();
    }
    addUIEvent() {
        Laya.stage.on(Laya.Event.MOUSE_DOWN, this, this.onHandler);
        Laya.stage.on(Laya.Event.MOUSE_UP, this, this.onHandler);
        Laya.stage.on(Laya.Event.MOUSE_MOVE, this, this.onHandler);
    }
    removeUIEvent() {
        Laya.stage.off(Laya.Event.MOUSE_DOWN, this, this.onHandler);
        Laya.stage.off(Laya.Event.MOUSE_UP, this, this.onHandler);
        Laya.stage.off(Laya.Event.MOUSE_MOVE, this, this.onHandler);
    }
    onHandler(e: Laya.Event) {
        switch (e.type) {
            case Laya.Event.MOUSE_DOWN:
            case Laya.Event.MOUSE_MOVE:
                LightningMgr.ins.beginDraw(e.stageX, e.stageY);
                break;
            case Laya.Event.MOUSE_UP:
                LightningMgr.ins.pauseDraw();
                break;
        }
    }
    onDestroy(): void {
        this.removeUIEvent();
    }
}
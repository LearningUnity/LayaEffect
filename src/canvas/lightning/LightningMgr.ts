import { Lightning } from "./Lightning";
import { LightningCfg } from "./LightningCfg";
import { LightningVector } from "./LightningVector";

/** 闪电管理器 */
export class LightningMgr {
    private static _ins: LightningMgr;
    public static get ins() {
        if (!this._ins) {
            this._ins = new LightningMgr();
        }
        return this._ins;
    }

    private isInit: boolean = false;
    private sprite: Laya.Sprite;
    private canvas: Laya.HTMLCanvas;
    private lightning: Lightning;
    private lightningCfg: LightningCfg;
    private isDrawing: boolean = true;
    private points: LightningVector[] = [];
    private posVec: LightningVector;

    public init(sprite: Laya.Sprite) {
        if (!this.isInit) {
            this.isInit = true;
            this.sprite = sprite;
            this.canvas = new Laya.HTMLCanvas(true);
            this.canvas.size(Laya.stage.width, Laya.stage.height);
            this.lightningCfg = new LightningCfg();
            this.lightning = new Lightning(this.lightningCfg);
            this.posVec = new LightningVector(0, 0, 0, 0);
            this.points.push(new LightningVector(0, 0, this.canvas.width / 2, this.canvas.height / 2));
            this.points.push(new LightningVector(0, 0, 20, 20));
            this.points.push(new LightningVector(0, 0, this.canvas.width / 2, 20));
            this.points.push(new LightningVector(0, 0, this.canvas.width - 20, 20));
            this.points.push(new LightningVector(0, 0, 20, this.canvas.height - 20));
            this.points.push(new LightningVector(0, 0, this.canvas.width / 2, this.canvas.height - 20));
            this.points.push(new LightningVector(0, 0, this.canvas.width - 20, this.canvas.height - 20));
        }
    }

    public startTimer() {
        if (this.isInit) {
            this.stopTimer();
            Laya.timer.frameLoop(1, this, this.update);
        }
    }

    public stopTimer() {
        Laya.timer.clearAll(this);
    }

    public beginDraw(posX: number, posY: number) {
        if (this.isInit) {
            this.isDrawing = true;
            this.posVec.X = 0;
            this.posVec.Y = 0;
            this.posVec.X1 = posX;
            this.posVec.Y1 = posY;
        }
    }

    public pauseDraw() {
        this.isDrawing = false;
    }

    private update() {
        if (this.isDrawing) {
            this.canvas.clear();        // 清空画布内容
            this.points.forEach(lightningVec => {
                this.lightning.cast(this.canvas.context as any, lightningVec, this.posVec);
            });
            this.sprite.graphics.drawImage(this.canvas.getTexture());
        }
    }

    /** 清空画布内容 */
    public clearCanvas() {
        if (this.canvas) {
            this.canvas.clear();
        }
    }

    public destroy() {
        this.stopTimer();
        this.canvas.clear();        // 清空画布, 释放GPU空间占用
        this.canvas.destroy();      // 销毁画布, 释放CPU空间占用
        this.canvas = null;
        this.sprite = null;
        this.lightningCfg = null;
        this.lightning = null;
        this.points = [];
        this.isInit = false;
    }
}
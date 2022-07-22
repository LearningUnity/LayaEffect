import { LightningCfg } from "./LightningCfg";
import { LightningVector } from "./LightningVector";

/** 闪电类 */
export class Lightning {
    public config: LightningCfg;
    constructor(cfg: LightningCfg) {
        this.config = cfg;
    }

    public cast(context: CanvasRenderingContext2D, from: LightningVector, to: LightningVector) {
        if (!from || !to) {
            return;
        }
        // 主节点
        let mainVector = new LightningVector(from.X1, from.Y1, to.X1, to.Y1);
        // skip cas if not close enough
        if (this.config.threshold && mainVector.length() > context.canvas.width * this.config.threshold) {
            return;
        }
        // 两点间总长度
        let mainLength = mainVector.length();
        // 两点间长度/画布宽度
        let posLenRateInCanvas = (mainLength / context.canvas.width)
        // 使用的节点数
        let usingSegmentCount = Math.floor(this.config.segments * posLenRateInCanvas);
        // 每个节点间宽度
        let perNodeDis = mainLength / usingSegmentCount;

        let fromPos = from;
        for (let i = 1; i <= usingSegmentCount; i++) {
            // position in the main vector
            let tempPos = mainVector.multiply((1 / usingSegmentCount) * i);

            // add position noise
            if (i != usingSegmentCount) {
                tempPos.X1 += perNodeDis * Math.random();
                tempPos.Y1 += perNodeDis * Math.random();
            }

            // new vector for segment
            let toPos = new LightningVector(fromPos.X1, fromPos.Y1, tempPos.X1, tempPos.Y1);

            // main line
            this.line(context, toPos);
            fromPos = toPos;
        }

        this.circle(context, from, posLenRateInCanvas);
        this.circle(context, to, posLenRateInCanvas);

        context.restore();
    }

    private circle(context: CanvasRenderingContext2D, pos: LightningVector, posLenRateInCanvas: number) {
        let cfg = this.config;
        context.shadowBlur = cfg.circle.shadowBlur;
        context.shadowColor = cfg.circle.shadowColor;
        context.strokeStyle = cfg.circle.strokeStyle;
        context.lineWidth = cfg.circle.lineWidth;
        context.beginPath();
        context.arc(
            pos.X1 + Math.random() * 10 * posLenRateInCanvas,            // x                                                   
            pos.Y1 + Math.random() * 10 * posLenRateInCanvas,            // y                                                   
            5,                                                           // radius           半径
            0,                                                           // startAngle       开始角度 
            2 * Math.PI,                                                 // endAngle         结束角度      
            false                                                        // counterclockwise 逆时针方向      
        );
        context.stroke();
    }

    private line(context: CanvasRenderingContext2D, vec: LightningVector) {
        let cfg = this.config;
        context.shadowBlur = cfg.line.shadowBlur;             // 清除阴影
        context.shadowColor = cfg.line.shadowColor;
        context.strokeStyle = cfg.line.strokeStyle;
        context.lineWidth = cfg.line.lineWidth;
        context.beginPath();
        context.moveTo(vec.X, vec.Y);
        context.lineTo(vec.X1, vec.Y1);
        // context.globalAlpha = c.Alpha;
        context.stroke();
    }

    private random(min: number, max: number) {
        return Math.floor(Math.random() * (max - min)) + min;
    }
}
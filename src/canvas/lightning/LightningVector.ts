/** 闪电向量 */
export class LightningVector {
    public X: number;
    public Y: number;
    public X1: number;
    public Y1: number;
    constructor(x, y, x1, y1) {
        this.X = x;
        this.Y = y;
        this.X1 = x1;
        this.Y1 = y1;
    }
    delX() {
        return this.X1 - this.X;
    }
    delY() {
        return this.Y1 - this.Y;
    }
    normalized() {
        let len = this.length();
        return new LightningVector(
            this.X,
            this.Y,
            this.X + (this.delX() / len),
            this.Y + (this.delY() / len)
        );
    }
    length() {
        return Math.sqrt(Math.pow(this.delX(), 2) + Math.pow(this.delY(), 2));
    }
    multiply(num: number) {
        return new LightningVector(
            this.X,
            this.Y,
            this.X + this.delX() * num,
            this.Y + this.delY() * num
        );
    }
    clone() {
        return new LightningVector(this.X, this.Y, this.X1, this.Y1);
    }
}
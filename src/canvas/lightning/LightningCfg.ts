/** 闪电配置 */
export class LightningCfg {
    public segments: number = 40;
    // 值越大, 固定点显示越多
    public threshold: number = 0.5;
    public circle = {
        // 线尺寸
        lineWidth: 1,
        // 线颜色
        strokeStyle: "#ffffff",
        // 线阴影尺寸(外边框)
        shadowBlur: 0.1,
        // 线阴影颜色
        shadowColor: "#006dff"
    }
    public line = {
        // 线尺寸
        lineWidth: 1,
        // 线颜色
        strokeStyle: "#ffffff",
        // 线阴影尺寸(外边框)
        shadowBlur: 5,
        // 线阴影颜色
        shadowColor: "#127bca"
    }
}
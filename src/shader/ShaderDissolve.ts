var vs: string = `
    attribute vec4 posuv;
    attribute vec4 attribColor;
    attribute vec4 attribFlags;
    attribute vec4 clipDir;
    attribute vec2 clipRect;
    uniform vec4 clipMatDir;
    uniform vec2 clipMatPos;
    varying vec2 cliped;
    uniform vec2 size;
    uniform vec2 clipOff;
    #ifdef WORLDMAT
        uniform mat4 mmat;
    #endif
    #ifdef MVP3D
        uniform mat4 u_MvpMatrix;
    #endif
    varying vec4 v_texcoordAlpha;
    varying vec4 v_color;
    varying float v_useTex;
    void main() {
        vec4 pos = vec4(posuv.xy,0.,1.);
        #ifdef WORLDMAT
            pos=mmat*pos;
        #endif
        vec4 pos1  =vec4((pos.x/size.x-0.5)*2.0,(0.5-pos.y/size.y)*2.0,0.,1.0);
        #ifdef MVP3D
            gl_Position=u_MvpMatrix*pos1;
        #else
            gl_Position=pos1;
        #endif
        v_texcoordAlpha.xy = posuv.zw;
        v_texcoordAlpha.z = attribColor.a/255.0;
        v_color = attribColor/255.0;
        v_color.xyz*=v_color.w;
        v_useTex = attribFlags.r/255.0;
        float clipw = length(clipMatDir.xy);
        float cliph = length(clipMatDir.zw);
        vec2 clpos = clipMatPos.xy;
        #ifdef WORLDMAT
        if(clipOff[0]>0.0){
            clpos.x+=mmat[3].x;
            clpos.y+=mmat[3].y;
        }
        #endif
        vec2 clippos = pos.xy - clpos;

        if(clipw>20000. && cliph>20000.)
            cliped = vec2(0.5,0.5);
        else {
            cliped=vec2( dot(clippos,clipMatDir.xy)/clipw/clipw, dot(clippos,clipMatDir.zw)/cliph/cliph);
        }
    }`;
//片元着色器 --- 根据噪图 过滤掉低于阈值的颜色
var ps: string = `
    #define SHADER_NAME DissolveEdgeFrag
    #if defined(GL_FRAGMENT_PRECISION_HIGH)
        precision highp float;
    #else
        precision mediump float;
    #endif

    varying vec4 v_texcoordAlpha;
    varying vec4 v_color;
    varying float v_useTex;
    varying vec2 cliped;
    
    uniform sampler2D texture;
    uniform sampler2D u_NoiseTex;
    //消融阈值  0 - 1
    uniform float u_DissolveThreshold;
    uniform float u_Spread;
    uniform float u_EdgeWidth;
    uniform float u_EdgeIntensity;
    uniform vec4 u_EdgeColor;

    void main(){
        vec4 color = texture2D(texture, v_texcoordAlpha.xy);
        float noiseTexValue = texture2D(u_NoiseTex, v_texcoordAlpha.xy).r;

        //重映射，将阙值映射到新的范围内， 为了解决还没有溶解前，保证图片的完整
        float spread = (1.0 + u_Spread) * u_DissolveThreshold - u_Spread;
        
        //获取到过渡值
        float gradient = (noiseTexValue - spread) / u_Spread;

        // 当前的过渡边缘
        float dis = distance(gradient, 0.5);
        float edge = clamp(1.0 - dis / u_EdgeWidth, 0.0, 1.0);
        float opacity = color.a * step(0.5, gradient);

        //计算出边缘的颜色，并被当前默认颜色影响
        vec3 edgeColor = u_EdgeColor.rgb * color.rgb * u_EdgeIntensity;

        //通过边缘补间获得最终颜色
        color.rgb = mix(color.rgb, edgeColor, edge);

        color.a *= opacity;
        color.rgb *= color.a;

        if(opacity < 0.5){
            discard;
        }
        
        gl_FragColor = color;
    }`;
export default class ShaderDissolve extends Laya.Script {
    public owner: Laya.Sprite | Laya.Image;

    private NOISE_TEXTURE_PATH: string = "game/timg.png";

    private shaderValue: Laya.Value2D;
    private SHADER_ID: number = 9999;
    private tex: Laya.Texture | Laya.Texture2D | Laya.RenderTexture;
    private offsetX: number;
    private offsetY: number;
    private width: number;
    private height: number;
    private uv: ArrayLike<number>;

    private _edgeColor: number[];
    private _edgeColorSpread: number;
    private _edgeWidth: number;
    private _edgeIntensity: number;
    private _dissolveThreshold: number;

    constructor() {
        super();
        this.shaderValue = new Laya.Value2D(this.SHADER_ID, this.SHADER_ID);
        this.shaderValue.shader = new Laya.Shader2X(vs, ps, this.SHADER_ID);
    }

    onAwake(): void {
        if (!this.owner) {
            console.error('shader is not have owner');
            return;
        }
        // 设置自定义渲染
        this.owner.customRenderEnable = true;

        // 绑定自定义渲染函数
        this.owner.customRender = this.customRender.bind(this);
        if (this.owner instanceof Laya.Image) {
            if (this.owner["_bitmap"] && this.owner["_bitmap"]["_source"]) {
                let texture = this.owner["_bitmap"]["_source"];
                this.width = texture.width;
                this.height = texture.height;
                this.uv = texture.uv;
                this.tex = texture.bitmap;
                this.offsetX = texture.offsetX - this.owner.pivotX;
                this.offsetY = texture.offsetY - this.owner.pivotY;
                this.owner.skin = "";
            } else {
                console.error('can not find texture');
            }
        } else if (this.owner instanceof Laya.Sprite) {
            let texture = this.owner.texture;
            if (texture) {
                this.width = texture.width;
                this.height = texture.height;
                this.uv = texture.uv;
                this.tex = texture.bitmap;
                this.offsetX = this.owner.texture.offsetX - this.owner.pivotX;
                this.offsetY = this.owner.texture.offsetY - this.owner.pivotY;
                // 移除旧图片
                this.owner.texture = null;
            } else {
                console.error('can not find texture');
            }
        }
    }

    /** 设置噪音纹理 */
    public setNoiseTexSkin(skin: string) {
        Laya.loader.load(skin, new Laya.Handler(this, (tex: Laya.Texture) => {
            if (this.shaderValue) {
                this.shaderValue['u_NoiseTex'] = tex.bitmap["_getSource"]();
            }
        }));
    }
    public get edgeColor() { return this._edgeColor; }
    public get edgeColorSpread() { return this._edgeColorSpread; }
    public get edgeWidth() { return this._edgeWidth; }
    public get edgeIntensity() { return this._edgeIntensity; }
    public get dissolveThreshold() { return this._dissolveThreshold; }

    /** 边缘颜色[0~1,0~1,0~1] */
    public set edgeColor(value: number[]) {
        if (this.shaderValue) {
            this._edgeColor = value;
            this.shaderValue['u_EdgeColor'] = value;
        }
    }
    /** 边缘颜色扩散[0~1] */
    public set edgeColorSpread(value: number) {
        if (this.shaderValue) {
            this._edgeColorSpread = value;
            this.shaderValue["u_Spread"] = value;
        }
    }
    /** 边缘颜色宽度[0~1] */
    public set edgeWidth(value: number) {
        if (this.shaderValue) {
            this._edgeWidth = value;
            this.shaderValue["u_EdgeWidth"] = value;
        }
    }
    /** 边缘强度[0~5] */
    public set edgeIntensity(value: number) {
        if (this.shaderValue) {
            this._edgeIntensity = value;
            this.shaderValue["u_EdgeIntensity"] = value;
        }
    }
    /** 溶解比例[0~1] */
    public set dissolveThreshold(value: number) {
        if (this.shaderValue) {
            this._dissolveThreshold = value;
            this.shaderValue['u_DissolveThreshold'] = value;
        }
    }

    onEnable(): void {
        this.setNoiseTexSkin(this.NOISE_TEXTURE_PATH);
        this.dissolveThreshold = 0;
        this.edgeWidth = 0.19;
        this.edgeColorSpread = 0.5;
        this.edgeIntensity = 1.3;
        this.edgeColor = [240 / 255, 238 / 255, 151 / 255];
    }

    /** 自定义渲染提交(隐藏或销毁后, 不会执行此方法) */
    public customRender(context: Laya.Context, x: number, y: number) {
        if (!context || !this.tex) return;
        context.drawTarget(
            this.tex as any,
            x + this.offsetX,           // 渲染起点(距离舞台偏移---图片坐标x + 图片在纹理中的偏移)
            y + this.offsetY,           // 渲染起点(距离舞台偏移)
            this.width,                 // 渲染宽度(图片宽度)
            this.height,                // 渲染高度
            null,
            this.shaderValue,           // 使用的shader
            this.uv                     // 纹理uv
        );
    }
}
(function () {
    'use strict';

    var Scene = Laya.Scene;
    var REG = Laya.ClassUtils.regClass;
    var ui;
    (function (ui) {
        var canvas;
        (function (canvas) {
            class LightningUI extends Scene {
                constructor() { super(); }
                createChildren() {
                    super.createChildren();
                    this.loadScene("canvas/Lightning");
                }
            }
            canvas.LightningUI = LightningUI;
            REG("ui.canvas.LightningUI", LightningUI);
        })(canvas = ui.canvas || (ui.canvas = {}));
    })(ui || (ui = {}));
    (function (ui) {
        var shader;
        (function (shader) {
            class MeltEffectUI extends Scene {
                constructor() { super(); }
                createChildren() {
                    super.createChildren();
                    this.loadScene("shader/MeltEffect");
                }
            }
            shader.MeltEffectUI = MeltEffectUI;
            REG("ui.shader.MeltEffectUI", MeltEffectUI);
        })(shader = ui.shader || (ui.shader = {}));
    })(ui || (ui = {}));

    class LightningVector {
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
            return new LightningVector(this.X, this.Y, this.X + (this.delX() / len), this.Y + (this.delY() / len));
        }
        length() {
            return Math.sqrt(Math.pow(this.delX(), 2) + Math.pow(this.delY(), 2));
        }
        multiply(num) {
            return new LightningVector(this.X, this.Y, this.X + this.delX() * num, this.Y + this.delY() * num);
        }
        clone() {
            return new LightningVector(this.X, this.Y, this.X1, this.Y1);
        }
    }

    class Lightning {
        constructor(cfg) {
            this.config = cfg;
        }
        cast(context, from, to) {
            if (!from || !to) {
                return;
            }
            let mainVector = new LightningVector(from.X1, from.Y1, to.X1, to.Y1);
            if (this.config.threshold && mainVector.length() > context.canvas.width * this.config.threshold) {
                return;
            }
            let mainLength = mainVector.length();
            let posLenRateInCanvas = (mainLength / context.canvas.width);
            let usingSegmentCount = Math.floor(this.config.segments * posLenRateInCanvas);
            let perNodeDis = mainLength / usingSegmentCount;
            let fromPos = from;
            for (let i = 1; i <= usingSegmentCount; i++) {
                let tempPos = mainVector.multiply((1 / usingSegmentCount) * i);
                if (i != usingSegmentCount) {
                    tempPos.X1 += perNodeDis * Math.random();
                    tempPos.Y1 += perNodeDis * Math.random();
                }
                let toPos = new LightningVector(fromPos.X1, fromPos.Y1, tempPos.X1, tempPos.Y1);
                this.line(context, toPos);
                fromPos = toPos;
            }
            this.circle(context, from, posLenRateInCanvas);
            this.circle(context, to, posLenRateInCanvas);
            context.restore();
        }
        circle(context, pos, posLenRateInCanvas) {
            let cfg = this.config;
            context.shadowBlur = cfg.circle.shadowBlur;
            context.shadowColor = cfg.circle.shadowColor;
            context.strokeStyle = cfg.circle.strokeStyle;
            context.lineWidth = cfg.circle.lineWidth;
            context.beginPath();
            context.arc(pos.X1 + Math.random() * 10 * posLenRateInCanvas, pos.Y1 + Math.random() * 10 * posLenRateInCanvas, 5, 0, 2 * Math.PI, false);
            context.stroke();
        }
        line(context, vec) {
            let cfg = this.config;
            context.shadowBlur = cfg.line.shadowBlur;
            context.shadowColor = cfg.line.shadowColor;
            context.strokeStyle = cfg.line.strokeStyle;
            context.lineWidth = cfg.line.lineWidth;
            context.beginPath();
            context.moveTo(vec.X, vec.Y);
            context.lineTo(vec.X1, vec.Y1);
            context.stroke();
        }
        random(min, max) {
            return Math.floor(Math.random() * (max - min)) + min;
        }
    }

    class LightningCfg {
        constructor() {
            this.segments = 40;
            this.threshold = 0.5;
            this.circle = {
                lineWidth: 1,
                strokeStyle: "#ffffff",
                shadowBlur: 0.1,
                shadowColor: "#006dff"
            };
            this.line = {
                lineWidth: 1,
                strokeStyle: "#ffffff",
                shadowBlur: 5,
                shadowColor: "#127bca"
            };
        }
    }

    class LightningMgr {
        constructor() {
            this.isInit = false;
            this.isDrawing = true;
            this.points = [];
        }
        static get ins() {
            if (!this._ins) {
                this._ins = new LightningMgr();
            }
            return this._ins;
        }
        init(sprite) {
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
        startTimer() {
            if (this.isInit) {
                this.stopTimer();
                Laya.timer.frameLoop(1, this, this.update);
            }
        }
        stopTimer() {
            Laya.timer.clearAll(this);
        }
        beginDraw(posX, posY) {
            if (this.isInit) {
                this.isDrawing = true;
                this.posVec.X = 0;
                this.posVec.Y = 0;
                this.posVec.X1 = posX;
                this.posVec.Y1 = posY;
            }
        }
        pauseDraw() {
            this.isDrawing = false;
        }
        update() {
            if (this.isDrawing) {
                this.canvas.clear();
                this.points.forEach(lightningVec => {
                    this.lightning.cast(this.canvas.context, lightningVec, this.posVec);
                });
                this.sprite.graphics.drawImage(this.canvas.getTexture());
            }
        }
        clearCanvas() {
            if (this.canvas) {
                this.canvas.clear();
            }
        }
        destroy() {
            this.stopTimer();
            this.canvas.clear();
            this.canvas.destroy();
            this.canvas = null;
            this.sprite = null;
            this.lightningCfg = null;
            this.lightning = null;
            this.points = [];
            this.isInit = false;
        }
    }

    class LightningSceneCtrl extends ui.canvas.LightningUI {
        onAwake() {
            console.log('onAwake');
            this.addUIEvent();
        }
        onEnable() {
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
        onHandler(e) {
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
        onDestroy() {
            this.removeUIEvent();
        }
    }

    var vs = `
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
    var ps = `
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
    class ShaderDissolve extends Laya.Script {
        constructor() {
            super();
            this.NOISE_TEXTURE_PATH = "game/timg.png";
            this.SHADER_ID = 9999;
            this.shaderValue = new Laya.Value2D(this.SHADER_ID, this.SHADER_ID);
            this.shaderValue.shader = new Laya.Shader2X(vs, ps, this.SHADER_ID);
        }
        onAwake() {
            if (!this.owner) {
                console.error('shader is not have owner');
                return;
            }
            this.owner.customRenderEnable = true;
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
                }
                else {
                    console.error('can not find texture');
                }
            }
            else if (this.owner instanceof Laya.Sprite) {
                let texture = this.owner.texture;
                if (texture) {
                    this.width = texture.width;
                    this.height = texture.height;
                    this.uv = texture.uv;
                    this.tex = texture.bitmap;
                    this.offsetX = this.owner.texture.offsetX - this.owner.pivotX;
                    this.offsetY = this.owner.texture.offsetY - this.owner.pivotY;
                    this.owner.texture = null;
                }
                else {
                    console.error('can not find texture');
                }
            }
        }
        setNoiseTexSkin(skin) {
            Laya.loader.load(skin, new Laya.Handler(this, (tex) => {
                if (this.shaderValue) {
                    this.shaderValue['u_NoiseTex'] = tex.bitmap["_getSource"]();
                }
            }));
        }
        get edgeColor() { return this._edgeColor; }
        get edgeColorSpread() { return this._edgeColorSpread; }
        get edgeWidth() { return this._edgeWidth; }
        get edgeIntensity() { return this._edgeIntensity; }
        get dissolveThreshold() { return this._dissolveThreshold; }
        set edgeColor(value) {
            if (this.shaderValue) {
                this._edgeColor = value;
                this.shaderValue['u_EdgeColor'] = value;
            }
        }
        set edgeColorSpread(value) {
            if (this.shaderValue) {
                this._edgeColorSpread = value;
                this.shaderValue["u_Spread"] = value;
            }
        }
        set edgeWidth(value) {
            if (this.shaderValue) {
                this._edgeWidth = value;
                this.shaderValue["u_EdgeWidth"] = value;
            }
        }
        set edgeIntensity(value) {
            if (this.shaderValue) {
                this._edgeIntensity = value;
                this.shaderValue["u_EdgeIntensity"] = value;
            }
        }
        set dissolveThreshold(value) {
            if (this.shaderValue) {
                this._dissolveThreshold = value;
                this.shaderValue['u_DissolveThreshold'] = value;
            }
        }
        onEnable() {
            this.setNoiseTexSkin(this.NOISE_TEXTURE_PATH);
            this.dissolveThreshold = 0;
            this.edgeWidth = 0.19;
            this.edgeColorSpread = 0.5;
            this.edgeIntensity = 1.3;
            this.edgeColor = [240 / 255, 238 / 255, 151 / 255];
        }
        customRender(context, x, y) {
            if (!context || !this.tex)
                return;
            context.drawTarget(this.tex, x + this.offsetX, y + this.offsetY, this.width, this.height, null, this.shaderValue, this.uv);
        }
    }

    class MeltEffectSceneCtrl extends ui.shader.MeltEffectUI {
        onAwake() {
            this.shaderDissolve = this.img.getComponent(ShaderDissolve);
        }
        onEnable() {
            this.slider.on(Laya.Event.CHANGE, this, () => {
                this.shaderDissolve.dissolveThreshold = this.slider.value;
            });
        }
    }

    class GameConfig {
        constructor() {
        }
        static init() {
            var reg = Laya.ClassUtils.regClass;
            reg("canvas/lightning/LightningSceneCtrl.ts", LightningSceneCtrl);
            reg("shader/MeltEffectSceneCtrl.ts", MeltEffectSceneCtrl);
            reg("shader/ShaderDissolve.ts", ShaderDissolve);
        }
    }
    GameConfig.width = 750;
    GameConfig.height = 1624;
    GameConfig.scaleMode = "fixedwidth";
    GameConfig.screenMode = "none";
    GameConfig.alignV = "top";
    GameConfig.alignH = "left";
    GameConfig.startScene = "shader/MeltEffect.scene";
    GameConfig.sceneRoot = "";
    GameConfig.debug = false;
    GameConfig.stat = true;
    GameConfig.physicsDebug = false;
    GameConfig.exportSceneToJson = true;
    GameConfig.init();

    class Main {
        constructor() {
            if (window["Laya3D"])
                Laya3D.init(GameConfig.width, GameConfig.height);
            else
                Laya.init(GameConfig.width, GameConfig.height, Laya["WebGL"]);
            Laya["Physics"] && Laya["Physics"].enable();
            Laya["DebugPanel"] && Laya["DebugPanel"].enable();
            Laya.stage.scaleMode = GameConfig.scaleMode;
            Laya.stage.screenMode = GameConfig.screenMode;
            Laya.stage.alignV = GameConfig.alignV;
            Laya.stage.alignH = GameConfig.alignH;
            Laya.URL.exportSceneToJson = GameConfig.exportSceneToJson;
            if (GameConfig.debug || Laya.Utils.getQueryString("debug") == "true")
                Laya.enableDebugPanel();
            if (GameConfig.physicsDebug && Laya["PhysicsDebugDraw"])
                Laya["PhysicsDebugDraw"].enable();
            if (GameConfig.stat)
                Laya.Stat.show();
            Laya.alertGlobalError(true);
            Laya.ResourceVersion.enable("version.json", Laya.Handler.create(this, this.onVersionLoaded), Laya.ResourceVersion.FILENAME_VERSION);
        }
        onVersionLoaded() {
            Laya.AtlasInfoManager.enable("fileconfig.json", Laya.Handler.create(this, this.onConfigLoaded));
        }
        onConfigLoaded() {
            GameConfig.startScene && Laya.Scene.open(GameConfig.startScene);
        }
    }
    new Main();

}());

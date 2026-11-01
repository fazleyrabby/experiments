import{H as e,O as t,R as n,V as r,W as i,X as a,Y as o,at as s,b as c,ct as l,k as u,nt as d,rt as f,u as p,vt as m,y as h,yt as g}from"./three-y5ZduNgy.js";import{a as _,n as v,o as y,t as b}from"./BaseSimulation-DSIm9ZAg.js";import{t as x}from"./plinth-Cv3j_KNH.js";var S=class e{size;temperature;source;scratch;constructor(e){this.size=e,this.temperature=new Float32Array(e*e),this.source=new Float32Array(e*e),this.scratch=new Float32Array(e*e)}step(e,t){let n=this.size,r=this.temperature,i=this.scratch,a=1-t;for(let t=0;t<n;t++){let o=t*n,s=(t>0?t-1:t)*n,c=(t<n-1?t+1:t)*n;for(let t=0;t<n;t++){let l=t>0?t-1:t,u=t<n-1?t+1:t,d=r[o+t],f=r[o+l]+r[o+u]+r[s+t]+r[c+t]-4*d,p=this.source[o+t];i[o+t]=p>0?p:(d+e*f)*a}}this.temperature=i,this.scratch=r}brush(e,t,n,r){let i=this.size,a=Math.ceil(n);for(let o=Math.max(0,Math.floor(t)-a);o<=Math.min(i-1,Math.floor(t)+a);o++)for(let s=Math.max(0,Math.floor(e)-a);s<=Math.min(i-1,Math.floor(e)+a);s++){let a=Math.hypot(s+.5-e,o+.5-t);a<=n&&r(o*i+s,1-a/(n+1))}}paint(e,t,n,r){this.brush(e,t,n,e=>{this.source[e]=Math.max(this.source[e],r),this.temperature[e]=Math.max(this.temperature[e],r)})}erase(e,t,n){this.brush(e,t,n,e=>{this.source[e]=0,this.temperature[e]=0})}inject(e,t,n,r){this.brush(e,t,n,(e,t)=>{this.temperature[e]=Math.max(this.temperature[e],r*t)})}max(){let e=0;for(let t=0;t<this.temperature.length;t++)this.temperature[t]>e&&(e=this.temperature[t]);return e}average(){let e=0;for(let t=0;t<this.temperature.length;t++)e+=this.temperature[t];return e/this.temperature.length}resample(t){let n=new e(t),r=this.size/t;for(let e=0;e<t;e++)for(let i=0;i<t;i++){let a=Math.min(this.size-1,Math.floor((e+.5)*r))*this.size+Math.min(this.size-1,Math.floor((i+.5)*r));n.temperature[e*t+i]=this.temperature[a],n.source[e*t+i]=this.source[a]}return n}},C=`
  uniform sampler2D uTemperature;
  uniform float uHeight;
  varying vec2 vUv;

  void main() {
    vUv = uv;
    float temperature = texture2D(uTemperature, uv).r;
    vec3 displaced = position + vec3(0.0, 0.0, temperature * uHeight);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
  }
`,w=`
  uniform sampler2D uTemperature;
  uniform float uSize;
  uniform float uSlope;
  varying vec2 vUv;

  vec3 ramp(float t) {
    vec3 c0 = vec3(0.030, 0.045, 0.085);
    vec3 c1 = vec3(0.150, 0.090, 0.400);
    vec3 c2 = vec3(0.760, 0.150, 0.270);
    vec3 c3 = vec3(1.000, 0.560, 0.110);
    vec3 c4 = vec3(1.000, 0.960, 0.780);
    t = clamp(t, 0.0, 1.0);
    if (t < 0.25) return mix(c0, c1, t / 0.25);
    if (t < 0.50) return mix(c1, c2, (t - 0.25) / 0.25);
    if (t < 0.75) return mix(c2, c3, (t - 0.50) / 0.25);
    return mix(c3, c4, (t - 0.75) / 0.25);
  }

  void main() {
    float t = texture2D(uTemperature, vUv).r;
    float texel = 1.0 / uSize;

    // Relief shading from the temperature gradient.
    float dx = texture2D(uTemperature, vUv + vec2(texel, 0.0)).r - texture2D(uTemperature, vUv - vec2(texel, 0.0)).r;
    float dy = texture2D(uTemperature, vUv + vec2(0.0, texel)).r - texture2D(uTemperature, vUv - vec2(0.0, texel)).r;
    vec3 normal = normalize(vec3(-dx * uSlope, -dy * uSlope, 1.0));
    float light = 0.7 + 0.3 * dot(normal, normalize(vec3(0.45, 0.5, 0.75)));
    vec3 color = ramp(t) * light;

    // Cell lines, faded out once cells are too small on screen to resolve.
    vec2 cell = abs(fract(vUv * uSize) - 0.5);
    float cellWidth = fwidth(vUv.x * uSize) + fwidth(vUv.y * uSize);
    float line = smoothstep(0.5 - cellWidth, 0.5, max(cell.x, cell.y)) * clamp(1.0 - cellWidth * 2.2, 0.0, 1.0);
    color = mix(color, color * 0.5 + vec3(0.02, 0.025, 0.035), line * 0.7);

    // Isotherm contours.
    float bands = t * 8.0;
    float contour = 1.0 - smoothstep(0.0, fwidth(bands) * 1.6, abs(fract(bands + 0.5) - 0.5));
    color += vec3(0.16) * contour * step(0.04, t);

    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`,T=12,E=.52,D=2.1,O=12,k=20,A=980;function j(e){return k+e*A}var M=class extends b{grid=new S(8);emitters=[];surface=null;texture=null;pixels=new Uint16Array;cursor;iterationDebt=0;raycaster=new d;pointer=new m;hit=new g;plane=new o(new g(0,1,0),-.52);stroke=null;constructor(){super(y(new g(1,.95,1))),this.params={heatSource:800,conductivity:.6,cooling:.25,speed:1,resolution:`128`,tool:`paint`,wander:!0}}build(){this.iterationDebt=0,this.stroke=null;let t=this.resolution();this.grid=new S(t);let n=this.rng.int(2,4);for(let e=0;e<n;e++)this.grid.paint(this.rng.range(.15,.85)*t,this.rng.range(.15,.85)*t,Math.max(1.2,t/30),this.rng.range(.55,1));this.emitters=Array.from({length:this.rng.int(2,3)},()=>({frequencyX:this.rng.range(.11,.3),frequencyY:this.rng.range(.11,.3),phaseX:this.rng.range(0,Math.PI*2),phaseY:this.rng.range(0,Math.PI*2),strength:this.rng.range(.7,1)})),this.world.add(x(15.2,15.2));let a=new r(new p(12.7,.5,12.7),new i({color:856084,roughness:.8,metalness:.2}));a.position.y=.5/2,this.world.add(a);let o=new i({color:_.steel,metalness:.6,roughness:.4});for(let[e,t,n,i]of[[0,6.22,12.7,.26],[0,-6.22,12.7,.26],[6.22,0,.26,12.18],[-6.22,0,.26,12.18]]){let a=new r(new p(n,.3,i),o);a.position.set(e,.5,t),this.world.add(a)}this.enableShadows(this.world),this.cursor=new r(new s(.86,1,40),new e({color:_.white,transparent:!0,opacity:.8,depthTest:!1})),this.cursor.rotation.x=-Math.PI/2,this.cursor.visible=!1,this.cursor.renderOrder=2,this.world.add(this.cursor),this.buildSurface(),this.lighting.setShadowExtent(12),this.setView(15.2*(this.isPreview?.74:.86),7.6+(this.isPreview?.3:2.2));let c=this.ctx.element;c&&!this.isPreview&&(c.addEventListener(`pointerdown`,this.onPointerDown,!0),c.addEventListener(`pointermove`,this.onPointerMove,!0),c.addEventListener(`pointerup`,this.onPointerUp,!0),c.addEventListener(`pointercancel`,this.onPointerUp,!0),c.addEventListener(`pointerleave`,this.onPointerLeave),c.addEventListener(`contextmenu`,this.onContextMenu))}teardown(){this.surface=null,this.texture=null;let e=this.ctx?.element;e&&(e.removeEventListener(`pointerdown`,this.onPointerDown,!0),e.removeEventListener(`pointermove`,this.onPointerMove,!0),e.removeEventListener(`pointerup`,this.onPointerUp,!0),e.removeEventListener(`pointercancel`,this.onPointerUp,!0),e.removeEventListener(`pointerleave`,this.onPointerLeave),e.removeEventListener(`contextmenu`,this.onContextMenu))}update(e){let{grid:t}=this,n=t.size,r=this.num(`speed`);if(this.bool(`wander`)){let e=this.time;for(let i of this.emitters){let a=(.5+.38*Math.sin(e*i.frequencyX*r+i.phaseX))*n,o=(.5+.38*Math.sin(e*i.frequencyY*r+i.phaseY))*n;t.inject(a,o,Math.max(1.5,n/22),i.strength*this.sourceStrength())}}this.iterationDebt+=r*Math.max(1,n/64)*e*60;let i=.24*this.num(`conductivity`),a=this.num(`cooling`)*.004,o=0;for(;this.iterationDebt>=1&&o<O;)t.step(i,a),--this.iterationDebt,o++;this.iterationDebt=Math.min(this.iterationDebt,1)}render(){if(!this.texture)return;let e=this.grid.temperature,t=this.pixels;for(let n=0;n<e.length;n++)t[n]=c.toHalfFloat(e[n]);this.texture.needsUpdate=!0}onParam(e,t){if(e!==`resolution`)return;let n=this.resolution();n!==this.grid.size&&(this.grid=this.grid.resample(n),this.buildSurface())}getStats(){let e=Math.floor(this.time);return{maxTemp:j(this.grid.max()).toFixed(0),avgTemp:j(this.grid.average()).toFixed(1),gridSize:`${this.grid.size} × ${this.grid.size}`,simTime:`${String(Math.floor(e/60)).padStart(2,`0`)}:${String(e%60).padStart(2,`0`)}`}}entityCount(){return this.grid.size*this.grid.size}resolution(){let e=Number(this.params.resolution);return this.ctx.mobile?Math.min(e,128):e}sourceStrength(){return(this.num(`heatSource`)-k)/A}buildSurface(){this.surface&&(v(this.surface),this.world.remove(this.surface));let e=this.grid.size;this.pixels=new Uint16Array(e*e);let i=new h(this.pixels,e,e,f,u);i.minFilter=n,i.magFilter=n,i.needsUpdate=!0,this.texture=i;let o=Math.min(e,this.isPreview||this.ctx.mobile?64:160),s=new r(new a(T,T,o,o),new l({uniforms:{uTemperature:{value:i},uSize:{value:e},uHeight:{value:D},uSlope:{value:D*e/24}},vertexShader:C,fragmentShader:w}));s.rotation.x=-Math.PI/2,s.position.y=E,s.frustumCulled=!1,this.surface=new t,this.surface.add(s),this.world.add(this.surface)}cellAt(e){let t=this.ctx.element;if(!t)return null;let n=t.getBoundingClientRect();if(this.pointer.set((e.clientX-n.left)/n.width*2-1,-((e.clientY-n.top)/n.height)*2+1),this.raycaster.setFromCamera(this.pointer,this.camera),!this.raycaster.ray.intersectPlane(this.plane,this.hit))return null;let r=this.hit.x/T+.5,i=.5-this.hit.z/T;return r<0||r>1||i<0||i>1?null:{x:r*this.grid.size,y:i*this.grid.size}}brushRadius(){return Math.max(1.3,this.grid.size/26)}apply(e,t,n){e===`paint`?this.grid.paint(t,n,this.brushRadius(),this.sourceStrength()):this.grid.erase(t,n,this.brushRadius()*1.4)}onPointerDown=e=>{if(this.params.tool===`camera`||e.altKey||e.button===1)return;let t=this.cellAt(e);if(!t)return;e.stopImmediatePropagation(),e.preventDefault();let n=e.button===2||this.params.tool===`erase`?`erase`:`paint`;this.stroke={mode:n,x:t.x,y:t.y,pointerId:e.pointerId},this.ctx.element?.setPointerCapture(e.pointerId),this.apply(n,t.x,t.y),this.events.emit({type:n===`paint`?`heat_paint`:`heat_erase`})};onPointerMove=e=>{let t=this.cellAt(e);if(this.cursor.visible=t!==null&&this.params.tool!==`camera`&&e.pointerType===`mouse`,t){let e=this.brushRadius()/this.grid.size*T;this.cursor.scale.setScalar(e),this.cursor.position.set(this.hit.x,.54,this.hit.z)}let n=this.stroke;if(!n||n.pointerId!==e.pointerId||(e.stopImmediatePropagation(),!t))return;let r=Math.hypot(t.x-n.x,t.y-n.y),i=Math.max(1,Math.ceil(r/(this.brushRadius()*.5)));for(let e=1;e<=i;e++)this.apply(n.mode,n.x+(t.x-n.x)*e/i,n.y+(t.y-n.y)*e/i);n.x=t.x,n.y=t.y};onPointerUp=e=>{this.stroke&&this.stroke.pointerId===e.pointerId&&(e.stopImmediatePropagation(),this.stroke=null)};onPointerLeave=()=>{this.cursor.visible=!1};onContextMenu=e=>{e.preventDefault()}};export{M as default};
(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))n(i);new MutationObserver(i=>{for(const r of i)if(r.type==="childList")for(const o of r.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&n(o)}).observe(document,{childList:!0,subtree:!0});function e(i){const r={};return i.integrity&&(r.integrity=i.integrity),i.referrerPolicy&&(r.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?r.credentials="include":i.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function n(i){if(i.ep)return;i.ep=!0;const r=e(i);fetch(i.href,r)}})();const ad="modulepreload",cd=function(s,t){return new URL(s,t).href},xl={},ld=function(t,e,n){let i=Promise.resolve();if(e&&e.length>0){let l=function(u){return Promise.all(u.map(h=>Promise.resolve(h).then(p=>({status:"fulfilled",value:p}),p=>({status:"rejected",reason:p}))))};const o=document.getElementsByTagName("link"),a=document.querySelector("meta[property=csp-nonce]"),c=a?.nonce||a?.getAttribute("nonce");i=l(e.map(u=>{if(u=cd(u,n),u in xl)return;xl[u]=!0;const h=u.endsWith(".css"),p=h?'[rel="stylesheet"]':"";if(n)for(let m=o.length-1;m>=0;m--){const v=o[m];if(v.href===u&&(!h||v.rel==="stylesheet"))return}else if(document.querySelector(`link[href="${u}"]${p}`))return;const d=document.createElement("link");if(d.rel=h?"stylesheet":ad,h||(d.as="script"),d.crossOrigin="",d.href=u,c&&d.setAttribute("nonce",c),document.head.appendChild(d),h)return new Promise((m,v)=>{d.addEventListener("load",m),d.addEventListener("error",()=>v(new Error(`Unable to preload CSS for ${u}`)))})}))}function r(o){const a=new Event("vite:preloadError",{cancelable:!0});if(a.payload=o,window.dispatchEvent(a),!a.defaultPrevented)throw o}return i.then(o=>{for(const a of o||[])a.status==="rejected"&&r(a.reason);return t().catch(r)})};const Wc="180",Ls={ROTATE:0,DOLLY:1,PAN:2},Cs={ROTATE:0,PAN:1,DOLLY_PAN:2,DOLLY_ROTATE:3},hd=0,yl=1,ud=2,Qh=1,tu=2,ui=3,pi=0,nn=1,Xe=2,di=0,Us=1,wr=2,Ml=3,bl=4,dd=5,ji=100,fd=101,pd=102,md=103,gd=104,vd=200,_d=201,xd=202,yd=203,ja=204,$a=205,Md=206,bd=207,Sd=208,wd=209,Td=210,Ed=211,Ad=212,Rd=213,Cd=214,Ka=0,Ja=1,Qa=2,Fs=3,tc=4,ec=5,nc=6,ic=7,eu=0,Pd=1,Dd=2,Ci=0,Id=1,Ld=2,Ud=3,nu=4,Nd=5,Fd=6,zd=7,iu=300,zs=301,Os=302,sc=303,rc=304,qo=306,oc=1e3,Ki=1001,ac=1002,yn=1003,Od=1004,Br=1005,Kn=1006,sa=1007,Ji=1008,ei=1009,su=1010,ru=1011,Tr=1012,Xc=1013,Pi=1014,An=1015,Qn=1016,qc=1017,Yc=1018,Er=1020,ou=35902,au=35899,cu=1021,lu=1022,_n=1023,Ar=1026,Rr=1027,Zc=1028,Yo=1029,hu=1030,jc=1031,$c=1033,Eo=33776,Ao=33777,Ro=33778,Co=33779,cc=35840,lc=35841,hc=35842,uc=35843,dc=36196,fc=37492,pc=37496,mc=37808,gc=37809,vc=37810,_c=37811,xc=37812,yc=37813,Mc=37814,bc=37815,Sc=37816,wc=37817,Tc=37818,Ec=37819,Ac=37820,Rc=37821,Cc=36492,Pc=36494,Dc=36495,Ic=36283,Lc=36284,Uc=36285,Nc=36286,Bd=3200,kd=3201,uu=0,Vd=1,Ti="",ae="srgb",Bs="srgb-linear",Fo="linear",we="srgb",as=7680,Sl=519,Hd=512,Gd=513,Wd=514,du=515,Xd=516,qd=517,Yd=518,Zd=519,Fc=35044,Ps=35048,wl="300 es",zn=2e3,zo=2001;class rs{addEventListener(t,e){this._listeners===void 0&&(this._listeners={});const n=this._listeners;n[t]===void 0&&(n[t]=[]),n[t].indexOf(e)===-1&&n[t].push(e)}hasEventListener(t,e){const n=this._listeners;return n===void 0?!1:n[t]!==void 0&&n[t].indexOf(e)!==-1}removeEventListener(t,e){const n=this._listeners;if(n===void 0)return;const i=n[t];if(i!==void 0){const r=i.indexOf(e);r!==-1&&i.splice(r,1)}}dispatchEvent(t){const e=this._listeners;if(e===void 0)return;const n=e[t.type];if(n!==void 0){t.target=this;const i=n.slice(0);for(let r=0,o=i.length;r<o;r++)i[r].call(this,t);t.target=null}}}const Ze=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"];let Tl=1234567;const _r=Math.PI/180,ks=180/Math.PI;function ti(){const s=Math.random()*4294967295|0,t=Math.random()*4294967295|0,e=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(Ze[s&255]+Ze[s>>8&255]+Ze[s>>16&255]+Ze[s>>24&255]+"-"+Ze[t&255]+Ze[t>>8&255]+"-"+Ze[t>>16&15|64]+Ze[t>>24&255]+"-"+Ze[e&63|128]+Ze[e>>8&255]+"-"+Ze[e>>16&255]+Ze[e>>24&255]+Ze[n&255]+Ze[n>>8&255]+Ze[n>>16&255]+Ze[n>>24&255]).toLowerCase()}function ie(s,t,e){return Math.max(t,Math.min(e,s))}function Kc(s,t){return(s%t+t)%t}function jd(s,t,e,n,i){return n+(s-t)*(i-n)/(e-t)}function $d(s,t,e){return s!==t?(e-s)/(t-s):0}function xr(s,t,e){return(1-e)*s+e*t}function Kd(s,t,e,n){return xr(s,t,1-Math.exp(-e*n))}function Jd(s,t=1){return t-Math.abs(Kc(s,t*2)-t)}function Qd(s,t,e){return s<=t?0:s>=e?1:(s=(s-t)/(e-t),s*s*(3-2*s))}function tf(s,t,e){return s<=t?0:s>=e?1:(s=(s-t)/(e-t),s*s*s*(s*(s*6-15)+10))}function ef(s,t){return s+Math.floor(Math.random()*(t-s+1))}function nf(s,t){return s+Math.random()*(t-s)}function sf(s){return s*(.5-Math.random())}function rf(s){s!==void 0&&(Tl=s);let t=Tl+=1831565813;return t=Math.imul(t^t>>>15,t|1),t^=t+Math.imul(t^t>>>7,t|61),((t^t>>>14)>>>0)/4294967296}function of(s){return s*_r}function af(s){return s*ks}function cf(s){return(s&s-1)===0&&s!==0}function lf(s){return Math.pow(2,Math.ceil(Math.log(s)/Math.LN2))}function hf(s){return Math.pow(2,Math.floor(Math.log(s)/Math.LN2))}function uf(s,t,e,n,i){const r=Math.cos,o=Math.sin,a=r(e/2),c=o(e/2),l=r((t+n)/2),u=o((t+n)/2),h=r((t-n)/2),p=o((t-n)/2),d=r((n-t)/2),m=o((n-t)/2);switch(i){case"XYX":s.set(a*u,c*h,c*p,a*l);break;case"YZY":s.set(c*p,a*u,c*h,a*l);break;case"ZXZ":s.set(c*h,c*p,a*u,a*l);break;case"XZX":s.set(a*u,c*m,c*d,a*l);break;case"YXY":s.set(c*d,a*u,c*m,a*l);break;case"ZYZ":s.set(c*m,c*d,a*u,a*l);break;default:console.warn("THREE.MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+i)}}function Nn(s,t){switch(t.constructor){case Float32Array:return s;case Uint32Array:return s/4294967295;case Uint16Array:return s/65535;case Uint8Array:return s/255;case Int32Array:return Math.max(s/2147483647,-1);case Int16Array:return Math.max(s/32767,-1);case Int8Array:return Math.max(s/127,-1);default:throw new Error("Invalid component type.")}}function Me(s,t){switch(t.constructor){case Float32Array:return s;case Uint32Array:return Math.round(s*4294967295);case Uint16Array:return Math.round(s*65535);case Uint8Array:return Math.round(s*255);case Int32Array:return Math.round(s*2147483647);case Int16Array:return Math.round(s*32767);case Int8Array:return Math.round(s*127);default:throw new Error("Invalid component type.")}}const Oo={DEG2RAD:_r,RAD2DEG:ks,generateUUID:ti,clamp:ie,euclideanModulo:Kc,mapLinear:jd,inverseLerp:$d,lerp:xr,damp:Kd,pingpong:Jd,smoothstep:Qd,smootherstep:tf,randInt:ef,randFloat:nf,randFloatSpread:sf,seededRandom:rf,degToRad:of,radToDeg:af,isPowerOfTwo:cf,ceilPowerOfTwo:lf,floorPowerOfTwo:hf,setQuaternionFromProperEuler:uf,normalize:Me,denormalize:Nn};class tt{constructor(t=0,e=0){tt.prototype.isVector2=!0,this.x=t,this.y=e}get width(){return this.x}set width(t){this.x=t}get height(){return this.y}set height(t){this.y=t}set(t,e){return this.x=t,this.y=e,this}setScalar(t){return this.x=t,this.y=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y)}copy(t){return this.x=t.x,this.y=t.y,this}add(t){return this.x+=t.x,this.y+=t.y,this}addScalar(t){return this.x+=t,this.y+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this}subScalar(t){return this.x-=t,this.y-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this}multiply(t){return this.x*=t.x,this.y*=t.y,this}multiplyScalar(t){return this.x*=t,this.y*=t,this}divide(t){return this.x/=t.x,this.y/=t.y,this}divideScalar(t){return this.multiplyScalar(1/t)}applyMatrix3(t){const e=this.x,n=this.y,i=t.elements;return this.x=i[0]*e+i[3]*n+i[6],this.y=i[1]*e+i[4]*n+i[7],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this}clamp(t,e){return this.x=ie(this.x,t.x,e.x),this.y=ie(this.y,t.y,e.y),this}clampScalar(t,e){return this.x=ie(this.x,t,e),this.y=ie(this.y,t,e),this}clampLength(t,e){const n=this.length();return this.divideScalar(n||1).multiplyScalar(ie(n,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(t){return this.x*t.x+this.y*t.y}cross(t){return this.x*t.y-this.y*t.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(t){const e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;const n=this.dot(t)/e;return Math.acos(ie(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){const e=this.x-t.x,n=this.y-t.y;return e*e+n*n}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this}equals(t){return t.x===this.x&&t.y===this.y}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this}rotateAround(t,e){const n=Math.cos(e),i=Math.sin(e),r=this.x-t.x,o=this.y-t.y;return this.x=r*n-o*i+t.x,this.y=r*i+o*n+t.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}}class xe{constructor(t=0,e=0,n=0,i=1){this.isQuaternion=!0,this._x=t,this._y=e,this._z=n,this._w=i}static slerpFlat(t,e,n,i,r,o,a){let c=n[i+0],l=n[i+1],u=n[i+2],h=n[i+3];const p=r[o+0],d=r[o+1],m=r[o+2],v=r[o+3];if(a===0){t[e+0]=c,t[e+1]=l,t[e+2]=u,t[e+3]=h;return}if(a===1){t[e+0]=p,t[e+1]=d,t[e+2]=m,t[e+3]=v;return}if(h!==v||c!==p||l!==d||u!==m){let g=1-a;const f=c*p+l*d+u*m+h*v,x=f>=0?1:-1,_=1-f*f;if(_>Number.EPSILON){const w=Math.sqrt(_),S=Math.atan2(w,f*x);g=Math.sin(g*S)/w,a=Math.sin(a*S)/w}const y=a*x;if(c=c*g+p*y,l=l*g+d*y,u=u*g+m*y,h=h*g+v*y,g===1-a){const w=1/Math.sqrt(c*c+l*l+u*u+h*h);c*=w,l*=w,u*=w,h*=w}}t[e]=c,t[e+1]=l,t[e+2]=u,t[e+3]=h}static multiplyQuaternionsFlat(t,e,n,i,r,o){const a=n[i],c=n[i+1],l=n[i+2],u=n[i+3],h=r[o],p=r[o+1],d=r[o+2],m=r[o+3];return t[e]=a*m+u*h+c*d-l*p,t[e+1]=c*m+u*p+l*h-a*d,t[e+2]=l*m+u*d+a*p-c*h,t[e+3]=u*m-a*h-c*p-l*d,t}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get w(){return this._w}set w(t){this._w=t,this._onChangeCallback()}set(t,e,n,i){return this._x=t,this._y=e,this._z=n,this._w=i,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(t){return this._x=t.x,this._y=t.y,this._z=t.z,this._w=t.w,this._onChangeCallback(),this}setFromEuler(t,e=!0){const n=t._x,i=t._y,r=t._z,o=t._order,a=Math.cos,c=Math.sin,l=a(n/2),u=a(i/2),h=a(r/2),p=c(n/2),d=c(i/2),m=c(r/2);switch(o){case"XYZ":this._x=p*u*h+l*d*m,this._y=l*d*h-p*u*m,this._z=l*u*m+p*d*h,this._w=l*u*h-p*d*m;break;case"YXZ":this._x=p*u*h+l*d*m,this._y=l*d*h-p*u*m,this._z=l*u*m-p*d*h,this._w=l*u*h+p*d*m;break;case"ZXY":this._x=p*u*h-l*d*m,this._y=l*d*h+p*u*m,this._z=l*u*m+p*d*h,this._w=l*u*h-p*d*m;break;case"ZYX":this._x=p*u*h-l*d*m,this._y=l*d*h+p*u*m,this._z=l*u*m-p*d*h,this._w=l*u*h+p*d*m;break;case"YZX":this._x=p*u*h+l*d*m,this._y=l*d*h+p*u*m,this._z=l*u*m-p*d*h,this._w=l*u*h-p*d*m;break;case"XZY":this._x=p*u*h-l*d*m,this._y=l*d*h-p*u*m,this._z=l*u*m+p*d*h,this._w=l*u*h+p*d*m;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+o)}return e===!0&&this._onChangeCallback(),this}setFromAxisAngle(t,e){const n=e/2,i=Math.sin(n);return this._x=t.x*i,this._y=t.y*i,this._z=t.z*i,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(t){const e=t.elements,n=e[0],i=e[4],r=e[8],o=e[1],a=e[5],c=e[9],l=e[2],u=e[6],h=e[10],p=n+a+h;if(p>0){const d=.5/Math.sqrt(p+1);this._w=.25/d,this._x=(u-c)*d,this._y=(r-l)*d,this._z=(o-i)*d}else if(n>a&&n>h){const d=2*Math.sqrt(1+n-a-h);this._w=(u-c)/d,this._x=.25*d,this._y=(i+o)/d,this._z=(r+l)/d}else if(a>h){const d=2*Math.sqrt(1+a-n-h);this._w=(r-l)/d,this._x=(i+o)/d,this._y=.25*d,this._z=(c+u)/d}else{const d=2*Math.sqrt(1+h-n-a);this._w=(o-i)/d,this._x=(r+l)/d,this._y=(c+u)/d,this._z=.25*d}return this._onChangeCallback(),this}setFromUnitVectors(t,e){let n=t.dot(e)+1;return n<1e-8?(n=0,Math.abs(t.x)>Math.abs(t.z)?(this._x=-t.y,this._y=t.x,this._z=0,this._w=n):(this._x=0,this._y=-t.z,this._z=t.y,this._w=n)):(this._x=t.y*e.z-t.z*e.y,this._y=t.z*e.x-t.x*e.z,this._z=t.x*e.y-t.y*e.x,this._w=n),this.normalize()}angleTo(t){return 2*Math.acos(Math.abs(ie(this.dot(t),-1,1)))}rotateTowards(t,e){const n=this.angleTo(t);if(n===0)return this;const i=Math.min(1,e/n);return this.slerp(t,i),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(t){return this._x*t._x+this._y*t._y+this._z*t._z+this._w*t._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let t=this.length();return t===0?(this._x=0,this._y=0,this._z=0,this._w=1):(t=1/t,this._x=this._x*t,this._y=this._y*t,this._z=this._z*t,this._w=this._w*t),this._onChangeCallback(),this}multiply(t){return this.multiplyQuaternions(this,t)}premultiply(t){return this.multiplyQuaternions(t,this)}multiplyQuaternions(t,e){const n=t._x,i=t._y,r=t._z,o=t._w,a=e._x,c=e._y,l=e._z,u=e._w;return this._x=n*u+o*a+i*l-r*c,this._y=i*u+o*c+r*a-n*l,this._z=r*u+o*l+n*c-i*a,this._w=o*u-n*a-i*c-r*l,this._onChangeCallback(),this}slerp(t,e){if(e===0)return this;if(e===1)return this.copy(t);const n=this._x,i=this._y,r=this._z,o=this._w;let a=o*t._w+n*t._x+i*t._y+r*t._z;if(a<0?(this._w=-t._w,this._x=-t._x,this._y=-t._y,this._z=-t._z,a=-a):this.copy(t),a>=1)return this._w=o,this._x=n,this._y=i,this._z=r,this;const c=1-a*a;if(c<=Number.EPSILON){const d=1-e;return this._w=d*o+e*this._w,this._x=d*n+e*this._x,this._y=d*i+e*this._y,this._z=d*r+e*this._z,this.normalize(),this}const l=Math.sqrt(c),u=Math.atan2(l,a),h=Math.sin((1-e)*u)/l,p=Math.sin(e*u)/l;return this._w=o*h+this._w*p,this._x=n*h+this._x*p,this._y=i*h+this._y*p,this._z=r*h+this._z*p,this._onChangeCallback(),this}slerpQuaternions(t,e,n){return this.copy(t).slerp(e,n)}random(){const t=2*Math.PI*Math.random(),e=2*Math.PI*Math.random(),n=Math.random(),i=Math.sqrt(1-n),r=Math.sqrt(n);return this.set(i*Math.sin(t),i*Math.cos(t),r*Math.sin(e),r*Math.cos(e))}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._w===this._w}fromArray(t,e=0){return this._x=t[e],this._y=t[e+1],this._z=t[e+2],this._w=t[e+3],this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._w,t}fromBufferAttribute(t,e){return this._x=t.getX(e),this._y=t.getY(e),this._z=t.getZ(e),this._w=t.getW(e),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}class A{constructor(t=0,e=0,n=0){A.prototype.isVector3=!0,this.x=t,this.y=e,this.z=n}set(t,e,n){return n===void 0&&(n=this.z),this.x=t,this.y=e,this.z=n,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this}multiplyVectors(t,e){return this.x=t.x*e.x,this.y=t.y*e.y,this.z=t.z*e.z,this}applyEuler(t){return this.applyQuaternion(El.setFromEuler(t))}applyAxisAngle(t,e){return this.applyQuaternion(El.setFromAxisAngle(t,e))}applyMatrix3(t){const e=this.x,n=this.y,i=this.z,r=t.elements;return this.x=r[0]*e+r[3]*n+r[6]*i,this.y=r[1]*e+r[4]*n+r[7]*i,this.z=r[2]*e+r[5]*n+r[8]*i,this}applyNormalMatrix(t){return this.applyMatrix3(t).normalize()}applyMatrix4(t){const e=this.x,n=this.y,i=this.z,r=t.elements,o=1/(r[3]*e+r[7]*n+r[11]*i+r[15]);return this.x=(r[0]*e+r[4]*n+r[8]*i+r[12])*o,this.y=(r[1]*e+r[5]*n+r[9]*i+r[13])*o,this.z=(r[2]*e+r[6]*n+r[10]*i+r[14])*o,this}applyQuaternion(t){const e=this.x,n=this.y,i=this.z,r=t.x,o=t.y,a=t.z,c=t.w,l=2*(o*i-a*n),u=2*(a*e-r*i),h=2*(r*n-o*e);return this.x=e+c*l+o*h-a*u,this.y=n+c*u+a*l-r*h,this.z=i+c*h+r*u-o*l,this}project(t){return this.applyMatrix4(t.matrixWorldInverse).applyMatrix4(t.projectionMatrix)}unproject(t){return this.applyMatrix4(t.projectionMatrixInverse).applyMatrix4(t.matrixWorld)}transformDirection(t){const e=this.x,n=this.y,i=this.z,r=t.elements;return this.x=r[0]*e+r[4]*n+r[8]*i,this.y=r[1]*e+r[5]*n+r[9]*i,this.z=r[2]*e+r[6]*n+r[10]*i,this.normalize()}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this}divideScalar(t){return this.multiplyScalar(1/t)}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this}clamp(t,e){return this.x=ie(this.x,t.x,e.x),this.y=ie(this.y,t.y,e.y),this.z=ie(this.z,t.z,e.z),this}clampScalar(t,e){return this.x=ie(this.x,t,e),this.y=ie(this.y,t,e),this.z=ie(this.z,t,e),this}clampLength(t,e){const n=this.length();return this.divideScalar(n||1).multiplyScalar(ie(n,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this}cross(t){return this.crossVectors(this,t)}crossVectors(t,e){const n=t.x,i=t.y,r=t.z,o=e.x,a=e.y,c=e.z;return this.x=i*c-r*a,this.y=r*o-n*c,this.z=n*a-i*o,this}projectOnVector(t){const e=t.lengthSq();if(e===0)return this.set(0,0,0);const n=t.dot(this)/e;return this.copy(t).multiplyScalar(n)}projectOnPlane(t){return ra.copy(this).projectOnVector(t),this.sub(ra)}reflect(t){return this.sub(ra.copy(t).multiplyScalar(2*this.dot(t)))}angleTo(t){const e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;const n=this.dot(t)/e;return Math.acos(ie(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){const e=this.x-t.x,n=this.y-t.y,i=this.z-t.z;return e*e+n*n+i*i}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)+Math.abs(this.z-t.z)}setFromSpherical(t){return this.setFromSphericalCoords(t.radius,t.phi,t.theta)}setFromSphericalCoords(t,e,n){const i=Math.sin(e)*t;return this.x=i*Math.sin(n),this.y=Math.cos(e)*t,this.z=i*Math.cos(n),this}setFromCylindrical(t){return this.setFromCylindricalCoords(t.radius,t.theta,t.y)}setFromCylindricalCoords(t,e,n){return this.x=t*Math.sin(e),this.y=n,this.z=t*Math.cos(e),this}setFromMatrixPosition(t){const e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this}setFromMatrixScale(t){const e=this.setFromMatrixColumn(t,0).length(),n=this.setFromMatrixColumn(t,1).length(),i=this.setFromMatrixColumn(t,2).length();return this.x=e,this.y=n,this.z=i,this}setFromMatrixColumn(t,e){return this.fromArray(t.elements,e*4)}setFromMatrix3Column(t,e){return this.fromArray(t.elements,e*3)}setFromEuler(t){return this.x=t._x,this.y=t._y,this.z=t._z,this}setFromColor(t){return this.x=t.r,this.y=t.g,this.z=t.b,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const t=Math.random()*Math.PI*2,e=Math.random()*2-1,n=Math.sqrt(1-e*e);return this.x=n*Math.cos(t),this.y=e,this.z=n*Math.sin(t),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}}const ra=new A,El=new xe;class ne{constructor(t,e,n,i,r,o,a,c,l){ne.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],t!==void 0&&this.set(t,e,n,i,r,o,a,c,l)}set(t,e,n,i,r,o,a,c,l){const u=this.elements;return u[0]=t,u[1]=i,u[2]=a,u[3]=e,u[4]=r,u[5]=c,u[6]=n,u[7]=o,u[8]=l,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(t){const e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],this}extractBasis(t,e,n){return t.setFromMatrix3Column(this,0),e.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(t){const e=t.elements;return this.set(e[0],e[4],e[8],e[1],e[5],e[9],e[2],e[6],e[10]),this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){const n=t.elements,i=e.elements,r=this.elements,o=n[0],a=n[3],c=n[6],l=n[1],u=n[4],h=n[7],p=n[2],d=n[5],m=n[8],v=i[0],g=i[3],f=i[6],x=i[1],_=i[4],y=i[7],w=i[2],S=i[5],T=i[8];return r[0]=o*v+a*x+c*w,r[3]=o*g+a*_+c*S,r[6]=o*f+a*y+c*T,r[1]=l*v+u*x+h*w,r[4]=l*g+u*_+h*S,r[7]=l*f+u*y+h*T,r[2]=p*v+d*x+m*w,r[5]=p*g+d*_+m*S,r[8]=p*f+d*y+m*T,this}multiplyScalar(t){const e=this.elements;return e[0]*=t,e[3]*=t,e[6]*=t,e[1]*=t,e[4]*=t,e[7]*=t,e[2]*=t,e[5]*=t,e[8]*=t,this}determinant(){const t=this.elements,e=t[0],n=t[1],i=t[2],r=t[3],o=t[4],a=t[5],c=t[6],l=t[7],u=t[8];return e*o*u-e*a*l-n*r*u+n*a*c+i*r*l-i*o*c}invert(){const t=this.elements,e=t[0],n=t[1],i=t[2],r=t[3],o=t[4],a=t[5],c=t[6],l=t[7],u=t[8],h=u*o-a*l,p=a*c-u*r,d=l*r-o*c,m=e*h+n*p+i*d;if(m===0)return this.set(0,0,0,0,0,0,0,0,0);const v=1/m;return t[0]=h*v,t[1]=(i*l-u*n)*v,t[2]=(a*n-i*o)*v,t[3]=p*v,t[4]=(u*e-i*c)*v,t[5]=(i*r-a*e)*v,t[6]=d*v,t[7]=(n*c-l*e)*v,t[8]=(o*e-n*r)*v,this}transpose(){let t;const e=this.elements;return t=e[1],e[1]=e[3],e[3]=t,t=e[2],e[2]=e[6],e[6]=t,t=e[5],e[5]=e[7],e[7]=t,this}getNormalMatrix(t){return this.setFromMatrix4(t).invert().transpose()}transposeIntoArray(t){const e=this.elements;return t[0]=e[0],t[1]=e[3],t[2]=e[6],t[3]=e[1],t[4]=e[4],t[5]=e[7],t[6]=e[2],t[7]=e[5],t[8]=e[8],this}setUvTransform(t,e,n,i,r,o,a){const c=Math.cos(r),l=Math.sin(r);return this.set(n*c,n*l,-n*(c*o+l*a)+o+t,-i*l,i*c,-i*(-l*o+c*a)+a+e,0,0,1),this}scale(t,e){return this.premultiply(oa.makeScale(t,e)),this}rotate(t){return this.premultiply(oa.makeRotation(-t)),this}translate(t,e){return this.premultiply(oa.makeTranslation(t,e)),this}makeTranslation(t,e){return t.isVector2?this.set(1,0,t.x,0,1,t.y,0,0,1):this.set(1,0,t,0,1,e,0,0,1),this}makeRotation(t){const e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,n,e,0,0,0,1),this}makeScale(t,e){return this.set(t,0,0,0,e,0,0,0,1),this}equals(t){const e=this.elements,n=t.elements;for(let i=0;i<9;i++)if(e[i]!==n[i])return!1;return!0}fromArray(t,e=0){for(let n=0;n<9;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){const n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t}clone(){return new this.constructor().fromArray(this.elements)}}const oa=new ne;function fu(s){for(let t=s.length-1;t>=0;--t)if(s[t]>=65535)return!0;return!1}function Bo(s){return document.createElementNS("http://www.w3.org/1999/xhtml",s)}function df(){const s=Bo("canvas");return s.style.display="block",s}const Al={};function Cr(s){s in Al||(Al[s]=!0,console.warn(s))}function ff(s,t,e){return new Promise(function(n,i){function r(){switch(s.clientWaitSync(t,s.SYNC_FLUSH_COMMANDS_BIT,0)){case s.WAIT_FAILED:i();break;case s.TIMEOUT_EXPIRED:setTimeout(r,e);break;default:n()}}setTimeout(r,e)})}const Rl=new ne().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),Cl=new ne().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function pf(){const s={enabled:!0,workingColorSpace:Bs,spaces:{},convert:function(i,r,o){return this.enabled===!1||r===o||!r||!o||(this.spaces[r].transfer===we&&(i.r=fi(i.r),i.g=fi(i.g),i.b=fi(i.b)),this.spaces[r].primaries!==this.spaces[o].primaries&&(i.applyMatrix3(this.spaces[r].toXYZ),i.applyMatrix3(this.spaces[o].fromXYZ)),this.spaces[o].transfer===we&&(i.r=Ns(i.r),i.g=Ns(i.g),i.b=Ns(i.b))),i},workingToColorSpace:function(i,r){return this.convert(i,this.workingColorSpace,r)},colorSpaceToWorking:function(i,r){return this.convert(i,r,this.workingColorSpace)},getPrimaries:function(i){return this.spaces[i].primaries},getTransfer:function(i){return i===Ti?Fo:this.spaces[i].transfer},getToneMappingMode:function(i){return this.spaces[i].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(i,r=this.workingColorSpace){return i.fromArray(this.spaces[r].luminanceCoefficients)},define:function(i){Object.assign(this.spaces,i)},_getMatrix:function(i,r,o){return i.copy(this.spaces[r].toXYZ).multiply(this.spaces[o].fromXYZ)},_getDrawingBufferColorSpace:function(i){return this.spaces[i].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(i=this.workingColorSpace){return this.spaces[i].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(i,r){return Cr("THREE.ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace()."),s.workingToColorSpace(i,r)},toWorkingColorSpace:function(i,r){return Cr("THREE.ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking()."),s.colorSpaceToWorking(i,r)}},t=[.64,.33,.3,.6,.15,.06],e=[.2126,.7152,.0722],n=[.3127,.329];return s.define({[Bs]:{primaries:t,whitePoint:n,transfer:Fo,toXYZ:Rl,fromXYZ:Cl,luminanceCoefficients:e,workingColorSpaceConfig:{unpackColorSpace:ae},outputColorSpaceConfig:{drawingBufferColorSpace:ae}},[ae]:{primaries:t,whitePoint:n,transfer:we,toXYZ:Rl,fromXYZ:Cl,luminanceCoefficients:e,outputColorSpaceConfig:{drawingBufferColorSpace:ae}}}),s}const fe=pf();function fi(s){return s<.04045?s*.0773993808:Math.pow(s*.9478672986+.0521327014,2.4)}function Ns(s){return s<.0031308?s*12.92:1.055*Math.pow(s,.41666)-.055}let cs;class mf{static getDataURL(t,e="image/png"){if(/^data:/i.test(t.src)||typeof HTMLCanvasElement>"u")return t.src;let n;if(t instanceof HTMLCanvasElement)n=t;else{cs===void 0&&(cs=Bo("canvas")),cs.width=t.width,cs.height=t.height;const i=cs.getContext("2d");t instanceof ImageData?i.putImageData(t,0,0):i.drawImage(t,0,0,t.width,t.height),n=cs}return n.toDataURL(e)}static sRGBToLinear(t){if(typeof HTMLImageElement<"u"&&t instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&t instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&t instanceof ImageBitmap){const e=Bo("canvas");e.width=t.width,e.height=t.height;const n=e.getContext("2d");n.drawImage(t,0,0,t.width,t.height);const i=n.getImageData(0,0,t.width,t.height),r=i.data;for(let o=0;o<r.length;o++)r[o]=fi(r[o]/255)*255;return n.putImageData(i,0,0),e}else if(t.data){const e=t.data.slice(0);for(let n=0;n<e.length;n++)e instanceof Uint8Array||e instanceof Uint8ClampedArray?e[n]=Math.floor(fi(e[n]/255)*255):e[n]=fi(e[n]);return{data:e,width:t.width,height:t.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),t}}let gf=0;class Jc{constructor(t=null){this.isSource=!0,Object.defineProperty(this,"id",{value:gf++}),this.uuid=ti(),this.data=t,this.dataReady=!0,this.version=0}getSize(t){const e=this.data;return typeof HTMLVideoElement<"u"&&e instanceof HTMLVideoElement?t.set(e.videoWidth,e.videoHeight,0):e instanceof VideoFrame?t.set(e.displayHeight,e.displayWidth,0):e!==null?t.set(e.width,e.height,e.depth||0):t.set(0,0,0),t}set needsUpdate(t){t===!0&&this.version++}toJSON(t){const e=t===void 0||typeof t=="string";if(!e&&t.images[this.uuid]!==void 0)return t.images[this.uuid];const n={uuid:this.uuid,url:""},i=this.data;if(i!==null){let r;if(Array.isArray(i)){r=[];for(let o=0,a=i.length;o<a;o++)i[o].isDataTexture?r.push(aa(i[o].image)):r.push(aa(i[o]))}else r=aa(i);n.url=r}return e||(t.images[this.uuid]=n),n}}function aa(s){return typeof HTMLImageElement<"u"&&s instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&s instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&s instanceof ImageBitmap?mf.getDataURL(s):s.data?{data:Array.from(s.data),width:s.width,height:s.height,type:s.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}let vf=0;const ca=new A;class qe extends rs{constructor(t=qe.DEFAULT_IMAGE,e=qe.DEFAULT_MAPPING,n=Ki,i=Ki,r=Kn,o=Ji,a=_n,c=ei,l=qe.DEFAULT_ANISOTROPY,u=Ti){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:vf++}),this.uuid=ti(),this.name="",this.source=new Jc(t),this.mipmaps=[],this.mapping=e,this.channel=0,this.wrapS=n,this.wrapT=i,this.magFilter=r,this.minFilter=o,this.anisotropy=l,this.format=a,this.internalFormat=null,this.type=c,this.offset=new tt(0,0),this.repeat=new tt(1,1),this.center=new tt(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new ne,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=u,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(t&&t.depth&&t.depth>1),this.pmremVersion=0}get width(){return this.source.getSize(ca).x}get height(){return this.source.getSize(ca).y}get depth(){return this.source.getSize(ca).z}get image(){return this.source.data}set image(t=null){this.source.data=t}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(t){return this.name=t.name,this.source=t.source,this.mipmaps=t.mipmaps.slice(0),this.mapping=t.mapping,this.channel=t.channel,this.wrapS=t.wrapS,this.wrapT=t.wrapT,this.magFilter=t.magFilter,this.minFilter=t.minFilter,this.anisotropy=t.anisotropy,this.format=t.format,this.internalFormat=t.internalFormat,this.type=t.type,this.offset.copy(t.offset),this.repeat.copy(t.repeat),this.center.copy(t.center),this.rotation=t.rotation,this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrix.copy(t.matrix),this.generateMipmaps=t.generateMipmaps,this.premultiplyAlpha=t.premultiplyAlpha,this.flipY=t.flipY,this.unpackAlignment=t.unpackAlignment,this.colorSpace=t.colorSpace,this.renderTarget=t.renderTarget,this.isRenderTargetTexture=t.isRenderTargetTexture,this.isArrayTexture=t.isArrayTexture,this.userData=JSON.parse(JSON.stringify(t.userData)),this.needsUpdate=!0,this}setValues(t){for(const e in t){const n=t[e];if(n===void 0){console.warn(`THREE.Texture.setValues(): parameter '${e}' has value of undefined.`);continue}const i=this[e];if(i===void 0){console.warn(`THREE.Texture.setValues(): property '${e}' does not exist.`);continue}i&&n&&i.isVector2&&n.isVector2||i&&n&&i.isVector3&&n.isVector3||i&&n&&i.isMatrix3&&n.isMatrix3?i.copy(n):this[e]=n}}toJSON(t){const e=t===void 0||typeof t=="string";if(!e&&t.textures[this.uuid]!==void 0)return t.textures[this.uuid];const n={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(t).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),e||(t.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(t){if(this.mapping!==iu)return t;if(t.applyMatrix3(this.matrix),t.x<0||t.x>1)switch(this.wrapS){case oc:t.x=t.x-Math.floor(t.x);break;case Ki:t.x=t.x<0?0:1;break;case ac:Math.abs(Math.floor(t.x)%2)===1?t.x=Math.ceil(t.x)-t.x:t.x=t.x-Math.floor(t.x);break}if(t.y<0||t.y>1)switch(this.wrapT){case oc:t.y=t.y-Math.floor(t.y);break;case Ki:t.y=t.y<0?0:1;break;case ac:Math.abs(Math.floor(t.y)%2)===1?t.y=Math.ceil(t.y)-t.y:t.y=t.y-Math.floor(t.y);break}return this.flipY&&(t.y=1-t.y),t}set needsUpdate(t){t===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(t){t===!0&&this.pmremVersion++}}qe.DEFAULT_IMAGE=null;qe.DEFAULT_MAPPING=iu;qe.DEFAULT_ANISOTROPY=1;class be{constructor(t=0,e=0,n=0,i=1){be.prototype.isVector4=!0,this.x=t,this.y=e,this.z=n,this.w=i}get width(){return this.z}set width(t){this.z=t}get height(){return this.w}set height(t){this.w=t}set(t,e,n,i){return this.x=t,this.y=e,this.z=n,this.w=i,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this.w=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setW(t){return this.w=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;case 3:this.w=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this.w=t.w!==void 0?t.w:1,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this.w+=t.w,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this.w+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this.w=t.w+e.w,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this.w+=t.w*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this.w-=t.w,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this.w-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this.w=t.w-e.w,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this.w*=t.w,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this.w*=t,this}applyMatrix4(t){const e=this.x,n=this.y,i=this.z,r=this.w,o=t.elements;return this.x=o[0]*e+o[4]*n+o[8]*i+o[12]*r,this.y=o[1]*e+o[5]*n+o[9]*i+o[13]*r,this.z=o[2]*e+o[6]*n+o[10]*i+o[14]*r,this.w=o[3]*e+o[7]*n+o[11]*i+o[15]*r,this}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this.w/=t.w,this}divideScalar(t){return this.multiplyScalar(1/t)}setAxisAngleFromQuaternion(t){this.w=2*Math.acos(t.w);const e=Math.sqrt(1-t.w*t.w);return e<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=t.x/e,this.y=t.y/e,this.z=t.z/e),this}setAxisAngleFromRotationMatrix(t){let e,n,i,r;const c=t.elements,l=c[0],u=c[4],h=c[8],p=c[1],d=c[5],m=c[9],v=c[2],g=c[6],f=c[10];if(Math.abs(u-p)<.01&&Math.abs(h-v)<.01&&Math.abs(m-g)<.01){if(Math.abs(u+p)<.1&&Math.abs(h+v)<.1&&Math.abs(m+g)<.1&&Math.abs(l+d+f-3)<.1)return this.set(1,0,0,0),this;e=Math.PI;const _=(l+1)/2,y=(d+1)/2,w=(f+1)/2,S=(u+p)/4,T=(h+v)/4,C=(m+g)/4;return _>y&&_>w?_<.01?(n=0,i=.707106781,r=.707106781):(n=Math.sqrt(_),i=S/n,r=T/n):y>w?y<.01?(n=.707106781,i=0,r=.707106781):(i=Math.sqrt(y),n=S/i,r=C/i):w<.01?(n=.707106781,i=.707106781,r=0):(r=Math.sqrt(w),n=T/r,i=C/r),this.set(n,i,r,e),this}let x=Math.sqrt((g-m)*(g-m)+(h-v)*(h-v)+(p-u)*(p-u));return Math.abs(x)<.001&&(x=1),this.x=(g-m)/x,this.y=(h-v)/x,this.z=(p-u)/x,this.w=Math.acos((l+d+f-1)/2),this}setFromMatrixPosition(t){const e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this.w=e[15],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this.w=Math.min(this.w,t.w),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this.w=Math.max(this.w,t.w),this}clamp(t,e){return this.x=ie(this.x,t.x,e.x),this.y=ie(this.y,t.y,e.y),this.z=ie(this.z,t.z,e.z),this.w=ie(this.w,t.w,e.w),this}clampScalar(t,e){return this.x=ie(this.x,t,e),this.y=ie(this.y,t,e),this.z=ie(this.z,t,e),this.w=ie(this.w,t,e),this}clampLength(t,e){const n=this.length();return this.divideScalar(n||1).multiplyScalar(ie(n,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z+this.w*t.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this.w+=(t.w-this.w)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this.w=t.w+(e.w-t.w)*n,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z&&t.w===this.w}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this.w=t[e+3],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t[e+3]=this.w,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this.w=t.getW(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}}class _f extends rs{constructor(t=1,e=1,n={}){super(),n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:Kn,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1},n),this.isRenderTarget=!0,this.width=t,this.height=e,this.depth=n.depth,this.scissor=new be(0,0,t,e),this.scissorTest=!1,this.viewport=new be(0,0,t,e);const i={width:t,height:e,depth:n.depth},r=new qe(i);this.textures=[];const o=n.count;for(let a=0;a<o;a++)this.textures[a]=r.clone(),this.textures[a].isRenderTargetTexture=!0,this.textures[a].renderTarget=this;this._setTextureOptions(n),this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this._depthTexture=null,this.depthTexture=n.depthTexture,this.samples=n.samples,this.multiview=n.multiview}_setTextureOptions(t={}){const e={minFilter:Kn,generateMipmaps:!1,flipY:!1,internalFormat:null};t.mapping!==void 0&&(e.mapping=t.mapping),t.wrapS!==void 0&&(e.wrapS=t.wrapS),t.wrapT!==void 0&&(e.wrapT=t.wrapT),t.wrapR!==void 0&&(e.wrapR=t.wrapR),t.magFilter!==void 0&&(e.magFilter=t.magFilter),t.minFilter!==void 0&&(e.minFilter=t.minFilter),t.format!==void 0&&(e.format=t.format),t.type!==void 0&&(e.type=t.type),t.anisotropy!==void 0&&(e.anisotropy=t.anisotropy),t.colorSpace!==void 0&&(e.colorSpace=t.colorSpace),t.flipY!==void 0&&(e.flipY=t.flipY),t.generateMipmaps!==void 0&&(e.generateMipmaps=t.generateMipmaps),t.internalFormat!==void 0&&(e.internalFormat=t.internalFormat);for(let n=0;n<this.textures.length;n++)this.textures[n].setValues(e)}get texture(){return this.textures[0]}set texture(t){this.textures[0]=t}set depthTexture(t){this._depthTexture!==null&&(this._depthTexture.renderTarget=null),t!==null&&(t.renderTarget=this),this._depthTexture=t}get depthTexture(){return this._depthTexture}setSize(t,e,n=1){if(this.width!==t||this.height!==e||this.depth!==n){this.width=t,this.height=e,this.depth=n;for(let i=0,r=this.textures.length;i<r;i++)this.textures[i].image.width=t,this.textures[i].image.height=e,this.textures[i].image.depth=n,this.textures[i].isArrayTexture=this.textures[i].image.depth>1;this.dispose()}this.viewport.set(0,0,t,e),this.scissor.set(0,0,t,e)}clone(){return new this.constructor().copy(this)}copy(t){this.width=t.width,this.height=t.height,this.depth=t.depth,this.scissor.copy(t.scissor),this.scissorTest=t.scissorTest,this.viewport.copy(t.viewport),this.textures.length=0;for(let e=0,n=t.textures.length;e<n;e++){this.textures[e]=t.textures[e].clone(),this.textures[e].isRenderTargetTexture=!0,this.textures[e].renderTarget=this;const i=Object.assign({},t.textures[e].image);this.textures[e].source=new Jc(i)}return this.depthBuffer=t.depthBuffer,this.stencilBuffer=t.stencilBuffer,this.resolveDepthBuffer=t.resolveDepthBuffer,this.resolveStencilBuffer=t.resolveStencilBuffer,t.depthTexture!==null&&(this.depthTexture=t.depthTexture.clone()),this.samples=t.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}}class Rn extends _f{constructor(t=1,e=1,n={}){super(t,e,n),this.isWebGLRenderTarget=!0}}class pu extends qe{constructor(t=null,e=1,n=1,i=1){super(null),this.isDataArrayTexture=!0,this.image={data:t,width:e,height:n,depth:i},this.magFilter=yn,this.minFilter=yn,this.wrapR=Ki,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(t){this.layerUpdates.add(t)}clearLayerUpdates(){this.layerUpdates.clear()}}class xf extends qe{constructor(t=null,e=1,n=1,i=1){super(null),this.isData3DTexture=!0,this.image={data:t,width:e,height:n,depth:i},this.magFilter=yn,this.minFilter=yn,this.wrapR=Ki,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class On{constructor(t=new A(1/0,1/0,1/0),e=new A(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=t,this.max=e}set(t,e){return this.min.copy(t),this.max.copy(e),this}setFromArray(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e+=3)this.expandByPoint(Cn.fromArray(t,e));return this}setFromBufferAttribute(t){this.makeEmpty();for(let e=0,n=t.count;e<n;e++)this.expandByPoint(Cn.fromBufferAttribute(t,e));return this}setFromPoints(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e++)this.expandByPoint(t[e]);return this}setFromCenterAndSize(t,e){const n=Cn.copy(e).multiplyScalar(.5);return this.min.copy(t).sub(n),this.max.copy(t).add(n),this}setFromObject(t,e=!1){return this.makeEmpty(),this.expandByObject(t,e)}clone(){return new this.constructor().copy(this)}copy(t){return this.min.copy(t.min),this.max.copy(t.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(t){return this.isEmpty()?t.set(0,0,0):t.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(t){return this.isEmpty()?t.set(0,0,0):t.subVectors(this.max,this.min)}expandByPoint(t){return this.min.min(t),this.max.max(t),this}expandByVector(t){return this.min.sub(t),this.max.add(t),this}expandByScalar(t){return this.min.addScalar(-t),this.max.addScalar(t),this}expandByObject(t,e=!1){t.updateWorldMatrix(!1,!1);const n=t.geometry;if(n!==void 0){const r=n.getAttribute("position");if(e===!0&&r!==void 0&&t.isInstancedMesh!==!0)for(let o=0,a=r.count;o<a;o++)t.isMesh===!0?t.getVertexPosition(o,Cn):Cn.fromBufferAttribute(r,o),Cn.applyMatrix4(t.matrixWorld),this.expandByPoint(Cn);else t.boundingBox!==void 0?(t.boundingBox===null&&t.computeBoundingBox(),kr.copy(t.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),kr.copy(n.boundingBox)),kr.applyMatrix4(t.matrixWorld),this.union(kr)}const i=t.children;for(let r=0,o=i.length;r<o;r++)this.expandByObject(i[r],e);return this}containsPoint(t){return t.x>=this.min.x&&t.x<=this.max.x&&t.y>=this.min.y&&t.y<=this.max.y&&t.z>=this.min.z&&t.z<=this.max.z}containsBox(t){return this.min.x<=t.min.x&&t.max.x<=this.max.x&&this.min.y<=t.min.y&&t.max.y<=this.max.y&&this.min.z<=t.min.z&&t.max.z<=this.max.z}getParameter(t,e){return e.set((t.x-this.min.x)/(this.max.x-this.min.x),(t.y-this.min.y)/(this.max.y-this.min.y),(t.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(t){return t.max.x>=this.min.x&&t.min.x<=this.max.x&&t.max.y>=this.min.y&&t.min.y<=this.max.y&&t.max.z>=this.min.z&&t.min.z<=this.max.z}intersectsSphere(t){return this.clampPoint(t.center,Cn),Cn.distanceToSquared(t.center)<=t.radius*t.radius}intersectsPlane(t){let e,n;return t.normal.x>0?(e=t.normal.x*this.min.x,n=t.normal.x*this.max.x):(e=t.normal.x*this.max.x,n=t.normal.x*this.min.x),t.normal.y>0?(e+=t.normal.y*this.min.y,n+=t.normal.y*this.max.y):(e+=t.normal.y*this.max.y,n+=t.normal.y*this.min.y),t.normal.z>0?(e+=t.normal.z*this.min.z,n+=t.normal.z*this.max.z):(e+=t.normal.z*this.max.z,n+=t.normal.z*this.min.z),e<=-t.constant&&n>=-t.constant}intersectsTriangle(t){if(this.isEmpty())return!1;this.getCenter(Zs),Vr.subVectors(this.max,Zs),ls.subVectors(t.a,Zs),hs.subVectors(t.b,Zs),us.subVectors(t.c,Zs),mi.subVectors(hs,ls),gi.subVectors(us,hs),zi.subVectors(ls,us);let e=[0,-mi.z,mi.y,0,-gi.z,gi.y,0,-zi.z,zi.y,mi.z,0,-mi.x,gi.z,0,-gi.x,zi.z,0,-zi.x,-mi.y,mi.x,0,-gi.y,gi.x,0,-zi.y,zi.x,0];return!la(e,ls,hs,us,Vr)||(e=[1,0,0,0,1,0,0,0,1],!la(e,ls,hs,us,Vr))?!1:(Hr.crossVectors(mi,gi),e=[Hr.x,Hr.y,Hr.z],la(e,ls,hs,us,Vr))}clampPoint(t,e){return e.copy(t).clamp(this.min,this.max)}distanceToPoint(t){return this.clampPoint(t,Cn).distanceTo(t)}getBoundingSphere(t){return this.isEmpty()?t.makeEmpty():(this.getCenter(t.center),t.radius=this.getSize(Cn).length()*.5),t}intersect(t){return this.min.max(t.min),this.max.min(t.max),this.isEmpty()&&this.makeEmpty(),this}union(t){return this.min.min(t.min),this.max.max(t.max),this}applyMatrix4(t){return this.isEmpty()?this:(si[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(t),si[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(t),si[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(t),si[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(t),si[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(t),si[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(t),si[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(t),si[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(t),this.setFromPoints(si),this)}translate(t){return this.min.add(t),this.max.add(t),this}equals(t){return t.min.equals(this.min)&&t.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(t){return this.min.fromArray(t.min),this.max.fromArray(t.max),this}}const si=[new A,new A,new A,new A,new A,new A,new A,new A],Cn=new A,kr=new On,ls=new A,hs=new A,us=new A,mi=new A,gi=new A,zi=new A,Zs=new A,Vr=new A,Hr=new A,Oi=new A;function la(s,t,e,n,i){for(let r=0,o=s.length-3;r<=o;r+=3){Oi.fromArray(s,r);const a=i.x*Math.abs(Oi.x)+i.y*Math.abs(Oi.y)+i.z*Math.abs(Oi.z),c=t.dot(Oi),l=e.dot(Oi),u=n.dot(Oi);if(Math.max(-Math.max(c,l,u),Math.min(c,l,u))>a)return!1}return!0}const yf=new On,js=new A,ha=new A;class Bn{constructor(t=new A,e=-1){this.isSphere=!0,this.center=t,this.radius=e}set(t,e){return this.center.copy(t),this.radius=e,this}setFromPoints(t,e){const n=this.center;e!==void 0?n.copy(e):yf.setFromPoints(t).getCenter(n);let i=0;for(let r=0,o=t.length;r<o;r++)i=Math.max(i,n.distanceToSquared(t[r]));return this.radius=Math.sqrt(i),this}copy(t){return this.center.copy(t.center),this.radius=t.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(t){return t.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(t){return t.distanceTo(this.center)-this.radius}intersectsSphere(t){const e=this.radius+t.radius;return t.center.distanceToSquared(this.center)<=e*e}intersectsBox(t){return t.intersectsSphere(this)}intersectsPlane(t){return Math.abs(t.distanceToPoint(this.center))<=this.radius}clampPoint(t,e){const n=this.center.distanceToSquared(t);return e.copy(t),n>this.radius*this.radius&&(e.sub(this.center).normalize(),e.multiplyScalar(this.radius).add(this.center)),e}getBoundingBox(t){return this.isEmpty()?(t.makeEmpty(),t):(t.set(this.center,this.center),t.expandByScalar(this.radius),t)}applyMatrix4(t){return this.center.applyMatrix4(t),this.radius=this.radius*t.getMaxScaleOnAxis(),this}translate(t){return this.center.add(t),this}expandByPoint(t){if(this.isEmpty())return this.center.copy(t),this.radius=0,this;js.subVectors(t,this.center);const e=js.lengthSq();if(e>this.radius*this.radius){const n=Math.sqrt(e),i=(n-this.radius)*.5;this.center.addScaledVector(js,i/n),this.radius+=i}return this}union(t){return t.isEmpty()?this:this.isEmpty()?(this.copy(t),this):(this.center.equals(t.center)===!0?this.radius=Math.max(this.radius,t.radius):(ha.subVectors(t.center,this.center).setLength(t.radius),this.expandByPoint(js.copy(t.center).add(ha)),this.expandByPoint(js.copy(t.center).sub(ha))),this)}equals(t){return t.center.equals(this.center)&&t.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(t){return this.radius=t.radius,this.center.fromArray(t.center),this}}const ri=new A,ua=new A,Gr=new A,vi=new A,da=new A,Wr=new A,fa=new A;class Zo{constructor(t=new A,e=new A(0,0,-1)){this.origin=t,this.direction=e}set(t,e){return this.origin.copy(t),this.direction.copy(e),this}copy(t){return this.origin.copy(t.origin),this.direction.copy(t.direction),this}at(t,e){return e.copy(this.origin).addScaledVector(this.direction,t)}lookAt(t){return this.direction.copy(t).sub(this.origin).normalize(),this}recast(t){return this.origin.copy(this.at(t,ri)),this}closestPointToPoint(t,e){e.subVectors(t,this.origin);const n=e.dot(this.direction);return n<0?e.copy(this.origin):e.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(t){return Math.sqrt(this.distanceSqToPoint(t))}distanceSqToPoint(t){const e=ri.subVectors(t,this.origin).dot(this.direction);return e<0?this.origin.distanceToSquared(t):(ri.copy(this.origin).addScaledVector(this.direction,e),ri.distanceToSquared(t))}distanceSqToSegment(t,e,n,i){ua.copy(t).add(e).multiplyScalar(.5),Gr.copy(e).sub(t).normalize(),vi.copy(this.origin).sub(ua);const r=t.distanceTo(e)*.5,o=-this.direction.dot(Gr),a=vi.dot(this.direction),c=-vi.dot(Gr),l=vi.lengthSq(),u=Math.abs(1-o*o);let h,p,d,m;if(u>0)if(h=o*c-a,p=o*a-c,m=r*u,h>=0)if(p>=-m)if(p<=m){const v=1/u;h*=v,p*=v,d=h*(h+o*p+2*a)+p*(o*h+p+2*c)+l}else p=r,h=Math.max(0,-(o*p+a)),d=-h*h+p*(p+2*c)+l;else p=-r,h=Math.max(0,-(o*p+a)),d=-h*h+p*(p+2*c)+l;else p<=-m?(h=Math.max(0,-(-o*r+a)),p=h>0?-r:Math.min(Math.max(-r,-c),r),d=-h*h+p*(p+2*c)+l):p<=m?(h=0,p=Math.min(Math.max(-r,-c),r),d=p*(p+2*c)+l):(h=Math.max(0,-(o*r+a)),p=h>0?r:Math.min(Math.max(-r,-c),r),d=-h*h+p*(p+2*c)+l);else p=o>0?-r:r,h=Math.max(0,-(o*p+a)),d=-h*h+p*(p+2*c)+l;return n&&n.copy(this.origin).addScaledVector(this.direction,h),i&&i.copy(ua).addScaledVector(Gr,p),d}intersectSphere(t,e){ri.subVectors(t.center,this.origin);const n=ri.dot(this.direction),i=ri.dot(ri)-n*n,r=t.radius*t.radius;if(i>r)return null;const o=Math.sqrt(r-i),a=n-o,c=n+o;return c<0?null:a<0?this.at(c,e):this.at(a,e)}intersectsSphere(t){return t.radius<0?!1:this.distanceSqToPoint(t.center)<=t.radius*t.radius}distanceToPlane(t){const e=t.normal.dot(this.direction);if(e===0)return t.distanceToPoint(this.origin)===0?0:null;const n=-(this.origin.dot(t.normal)+t.constant)/e;return n>=0?n:null}intersectPlane(t,e){const n=this.distanceToPlane(t);return n===null?null:this.at(n,e)}intersectsPlane(t){const e=t.distanceToPoint(this.origin);return e===0||t.normal.dot(this.direction)*e<0}intersectBox(t,e){let n,i,r,o,a,c;const l=1/this.direction.x,u=1/this.direction.y,h=1/this.direction.z,p=this.origin;return l>=0?(n=(t.min.x-p.x)*l,i=(t.max.x-p.x)*l):(n=(t.max.x-p.x)*l,i=(t.min.x-p.x)*l),u>=0?(r=(t.min.y-p.y)*u,o=(t.max.y-p.y)*u):(r=(t.max.y-p.y)*u,o=(t.min.y-p.y)*u),n>o||r>i||((r>n||isNaN(n))&&(n=r),(o<i||isNaN(i))&&(i=o),h>=0?(a=(t.min.z-p.z)*h,c=(t.max.z-p.z)*h):(a=(t.max.z-p.z)*h,c=(t.min.z-p.z)*h),n>c||a>i)||((a>n||n!==n)&&(n=a),(c<i||i!==i)&&(i=c),i<0)?null:this.at(n>=0?n:i,e)}intersectsBox(t){return this.intersectBox(t,ri)!==null}intersectTriangle(t,e,n,i,r){da.subVectors(e,t),Wr.subVectors(n,t),fa.crossVectors(da,Wr);let o=this.direction.dot(fa),a;if(o>0){if(i)return null;a=1}else if(o<0)a=-1,o=-o;else return null;vi.subVectors(this.origin,t);const c=a*this.direction.dot(Wr.crossVectors(vi,Wr));if(c<0)return null;const l=a*this.direction.dot(da.cross(vi));if(l<0||c+l>o)return null;const u=-a*vi.dot(fa);return u<0?null:this.at(u/o,r)}applyMatrix4(t){return this.origin.applyMatrix4(t),this.direction.transformDirection(t),this}equals(t){return t.origin.equals(this.origin)&&t.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class Et{constructor(t,e,n,i,r,o,a,c,l,u,h,p,d,m,v,g){Et.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],t!==void 0&&this.set(t,e,n,i,r,o,a,c,l,u,h,p,d,m,v,g)}set(t,e,n,i,r,o,a,c,l,u,h,p,d,m,v,g){const f=this.elements;return f[0]=t,f[4]=e,f[8]=n,f[12]=i,f[1]=r,f[5]=o,f[9]=a,f[13]=c,f[2]=l,f[6]=u,f[10]=h,f[14]=p,f[3]=d,f[7]=m,f[11]=v,f[15]=g,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new Et().fromArray(this.elements)}copy(t){const e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],e[9]=n[9],e[10]=n[10],e[11]=n[11],e[12]=n[12],e[13]=n[13],e[14]=n[14],e[15]=n[15],this}copyPosition(t){const e=this.elements,n=t.elements;return e[12]=n[12],e[13]=n[13],e[14]=n[14],this}setFromMatrix3(t){const e=t.elements;return this.set(e[0],e[3],e[6],0,e[1],e[4],e[7],0,e[2],e[5],e[8],0,0,0,0,1),this}extractBasis(t,e,n){return t.setFromMatrixColumn(this,0),e.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this}makeBasis(t,e,n){return this.set(t.x,e.x,n.x,0,t.y,e.y,n.y,0,t.z,e.z,n.z,0,0,0,0,1),this}extractRotation(t){const e=this.elements,n=t.elements,i=1/ds.setFromMatrixColumn(t,0).length(),r=1/ds.setFromMatrixColumn(t,1).length(),o=1/ds.setFromMatrixColumn(t,2).length();return e[0]=n[0]*i,e[1]=n[1]*i,e[2]=n[2]*i,e[3]=0,e[4]=n[4]*r,e[5]=n[5]*r,e[6]=n[6]*r,e[7]=0,e[8]=n[8]*o,e[9]=n[9]*o,e[10]=n[10]*o,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromEuler(t){const e=this.elements,n=t.x,i=t.y,r=t.z,o=Math.cos(n),a=Math.sin(n),c=Math.cos(i),l=Math.sin(i),u=Math.cos(r),h=Math.sin(r);if(t.order==="XYZ"){const p=o*u,d=o*h,m=a*u,v=a*h;e[0]=c*u,e[4]=-c*h,e[8]=l,e[1]=d+m*l,e[5]=p-v*l,e[9]=-a*c,e[2]=v-p*l,e[6]=m+d*l,e[10]=o*c}else if(t.order==="YXZ"){const p=c*u,d=c*h,m=l*u,v=l*h;e[0]=p+v*a,e[4]=m*a-d,e[8]=o*l,e[1]=o*h,e[5]=o*u,e[9]=-a,e[2]=d*a-m,e[6]=v+p*a,e[10]=o*c}else if(t.order==="ZXY"){const p=c*u,d=c*h,m=l*u,v=l*h;e[0]=p-v*a,e[4]=-o*h,e[8]=m+d*a,e[1]=d+m*a,e[5]=o*u,e[9]=v-p*a,e[2]=-o*l,e[6]=a,e[10]=o*c}else if(t.order==="ZYX"){const p=o*u,d=o*h,m=a*u,v=a*h;e[0]=c*u,e[4]=m*l-d,e[8]=p*l+v,e[1]=c*h,e[5]=v*l+p,e[9]=d*l-m,e[2]=-l,e[6]=a*c,e[10]=o*c}else if(t.order==="YZX"){const p=o*c,d=o*l,m=a*c,v=a*l;e[0]=c*u,e[4]=v-p*h,e[8]=m*h+d,e[1]=h,e[5]=o*u,e[9]=-a*u,e[2]=-l*u,e[6]=d*h+m,e[10]=p-v*h}else if(t.order==="XZY"){const p=o*c,d=o*l,m=a*c,v=a*l;e[0]=c*u,e[4]=-h,e[8]=l*u,e[1]=p*h+v,e[5]=o*u,e[9]=d*h-m,e[2]=m*h-d,e[6]=a*u,e[10]=v*h+p}return e[3]=0,e[7]=0,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromQuaternion(t){return this.compose(Mf,t,bf)}lookAt(t,e,n){const i=this.elements;return fn.subVectors(t,e),fn.lengthSq()===0&&(fn.z=1),fn.normalize(),_i.crossVectors(n,fn),_i.lengthSq()===0&&(Math.abs(n.z)===1?fn.x+=1e-4:fn.z+=1e-4,fn.normalize(),_i.crossVectors(n,fn)),_i.normalize(),Xr.crossVectors(fn,_i),i[0]=_i.x,i[4]=Xr.x,i[8]=fn.x,i[1]=_i.y,i[5]=Xr.y,i[9]=fn.y,i[2]=_i.z,i[6]=Xr.z,i[10]=fn.z,this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){const n=t.elements,i=e.elements,r=this.elements,o=n[0],a=n[4],c=n[8],l=n[12],u=n[1],h=n[5],p=n[9],d=n[13],m=n[2],v=n[6],g=n[10],f=n[14],x=n[3],_=n[7],y=n[11],w=n[15],S=i[0],T=i[4],C=i[8],b=i[12],M=i[1],E=i[5],D=i[9],N=i[13],I=i[2],F=i[6],z=i[10],X=i[14],k=i[3],K=i[7],rt=i[11],Z=i[15];return r[0]=o*S+a*M+c*I+l*k,r[4]=o*T+a*E+c*F+l*K,r[8]=o*C+a*D+c*z+l*rt,r[12]=o*b+a*N+c*X+l*Z,r[1]=u*S+h*M+p*I+d*k,r[5]=u*T+h*E+p*F+d*K,r[9]=u*C+h*D+p*z+d*rt,r[13]=u*b+h*N+p*X+d*Z,r[2]=m*S+v*M+g*I+f*k,r[6]=m*T+v*E+g*F+f*K,r[10]=m*C+v*D+g*z+f*rt,r[14]=m*b+v*N+g*X+f*Z,r[3]=x*S+_*M+y*I+w*k,r[7]=x*T+_*E+y*F+w*K,r[11]=x*C+_*D+y*z+w*rt,r[15]=x*b+_*N+y*X+w*Z,this}multiplyScalar(t){const e=this.elements;return e[0]*=t,e[4]*=t,e[8]*=t,e[12]*=t,e[1]*=t,e[5]*=t,e[9]*=t,e[13]*=t,e[2]*=t,e[6]*=t,e[10]*=t,e[14]*=t,e[3]*=t,e[7]*=t,e[11]*=t,e[15]*=t,this}determinant(){const t=this.elements,e=t[0],n=t[4],i=t[8],r=t[12],o=t[1],a=t[5],c=t[9],l=t[13],u=t[2],h=t[6],p=t[10],d=t[14],m=t[3],v=t[7],g=t[11],f=t[15];return m*(+r*c*h-i*l*h-r*a*p+n*l*p+i*a*d-n*c*d)+v*(+e*c*d-e*l*p+r*o*p-i*o*d+i*l*u-r*c*u)+g*(+e*l*h-e*a*d-r*o*h+n*o*d+r*a*u-n*l*u)+f*(-i*a*u-e*c*h+e*a*p+i*o*h-n*o*p+n*c*u)}transpose(){const t=this.elements;let e;return e=t[1],t[1]=t[4],t[4]=e,e=t[2],t[2]=t[8],t[8]=e,e=t[6],t[6]=t[9],t[9]=e,e=t[3],t[3]=t[12],t[12]=e,e=t[7],t[7]=t[13],t[13]=e,e=t[11],t[11]=t[14],t[14]=e,this}setPosition(t,e,n){const i=this.elements;return t.isVector3?(i[12]=t.x,i[13]=t.y,i[14]=t.z):(i[12]=t,i[13]=e,i[14]=n),this}invert(){const t=this.elements,e=t[0],n=t[1],i=t[2],r=t[3],o=t[4],a=t[5],c=t[6],l=t[7],u=t[8],h=t[9],p=t[10],d=t[11],m=t[12],v=t[13],g=t[14],f=t[15],x=h*g*l-v*p*l+v*c*d-a*g*d-h*c*f+a*p*f,_=m*p*l-u*g*l-m*c*d+o*g*d+u*c*f-o*p*f,y=u*v*l-m*h*l+m*a*d-o*v*d-u*a*f+o*h*f,w=m*h*c-u*v*c-m*a*p+o*v*p+u*a*g-o*h*g,S=e*x+n*_+i*y+r*w;if(S===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const T=1/S;return t[0]=x*T,t[1]=(v*p*r-h*g*r-v*i*d+n*g*d+h*i*f-n*p*f)*T,t[2]=(a*g*r-v*c*r+v*i*l-n*g*l-a*i*f+n*c*f)*T,t[3]=(h*c*r-a*p*r-h*i*l+n*p*l+a*i*d-n*c*d)*T,t[4]=_*T,t[5]=(u*g*r-m*p*r+m*i*d-e*g*d-u*i*f+e*p*f)*T,t[6]=(m*c*r-o*g*r-m*i*l+e*g*l+o*i*f-e*c*f)*T,t[7]=(o*p*r-u*c*r+u*i*l-e*p*l-o*i*d+e*c*d)*T,t[8]=y*T,t[9]=(m*h*r-u*v*r-m*n*d+e*v*d+u*n*f-e*h*f)*T,t[10]=(o*v*r-m*a*r+m*n*l-e*v*l-o*n*f+e*a*f)*T,t[11]=(u*a*r-o*h*r-u*n*l+e*h*l+o*n*d-e*a*d)*T,t[12]=w*T,t[13]=(u*v*i-m*h*i+m*n*p-e*v*p-u*n*g+e*h*g)*T,t[14]=(m*a*i-o*v*i-m*n*c+e*v*c+o*n*g-e*a*g)*T,t[15]=(o*h*i-u*a*i+u*n*c-e*h*c-o*n*p+e*a*p)*T,this}scale(t){const e=this.elements,n=t.x,i=t.y,r=t.z;return e[0]*=n,e[4]*=i,e[8]*=r,e[1]*=n,e[5]*=i,e[9]*=r,e[2]*=n,e[6]*=i,e[10]*=r,e[3]*=n,e[7]*=i,e[11]*=r,this}getMaxScaleOnAxis(){const t=this.elements,e=t[0]*t[0]+t[1]*t[1]+t[2]*t[2],n=t[4]*t[4]+t[5]*t[5]+t[6]*t[6],i=t[8]*t[8]+t[9]*t[9]+t[10]*t[10];return Math.sqrt(Math.max(e,n,i))}makeTranslation(t,e,n){return t.isVector3?this.set(1,0,0,t.x,0,1,0,t.y,0,0,1,t.z,0,0,0,1):this.set(1,0,0,t,0,1,0,e,0,0,1,n,0,0,0,1),this}makeRotationX(t){const e=Math.cos(t),n=Math.sin(t);return this.set(1,0,0,0,0,e,-n,0,0,n,e,0,0,0,0,1),this}makeRotationY(t){const e=Math.cos(t),n=Math.sin(t);return this.set(e,0,n,0,0,1,0,0,-n,0,e,0,0,0,0,1),this}makeRotationZ(t){const e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,0,n,e,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(t,e){const n=Math.cos(e),i=Math.sin(e),r=1-n,o=t.x,a=t.y,c=t.z,l=r*o,u=r*a;return this.set(l*o+n,l*a-i*c,l*c+i*a,0,l*a+i*c,u*a+n,u*c-i*o,0,l*c-i*a,u*c+i*o,r*c*c+n,0,0,0,0,1),this}makeScale(t,e,n){return this.set(t,0,0,0,0,e,0,0,0,0,n,0,0,0,0,1),this}makeShear(t,e,n,i,r,o){return this.set(1,n,r,0,t,1,o,0,e,i,1,0,0,0,0,1),this}compose(t,e,n){const i=this.elements,r=e._x,o=e._y,a=e._z,c=e._w,l=r+r,u=o+o,h=a+a,p=r*l,d=r*u,m=r*h,v=o*u,g=o*h,f=a*h,x=c*l,_=c*u,y=c*h,w=n.x,S=n.y,T=n.z;return i[0]=(1-(v+f))*w,i[1]=(d+y)*w,i[2]=(m-_)*w,i[3]=0,i[4]=(d-y)*S,i[5]=(1-(p+f))*S,i[6]=(g+x)*S,i[7]=0,i[8]=(m+_)*T,i[9]=(g-x)*T,i[10]=(1-(p+v))*T,i[11]=0,i[12]=t.x,i[13]=t.y,i[14]=t.z,i[15]=1,this}decompose(t,e,n){const i=this.elements;let r=ds.set(i[0],i[1],i[2]).length();const o=ds.set(i[4],i[5],i[6]).length(),a=ds.set(i[8],i[9],i[10]).length();this.determinant()<0&&(r=-r),t.x=i[12],t.y=i[13],t.z=i[14],Pn.copy(this);const l=1/r,u=1/o,h=1/a;return Pn.elements[0]*=l,Pn.elements[1]*=l,Pn.elements[2]*=l,Pn.elements[4]*=u,Pn.elements[5]*=u,Pn.elements[6]*=u,Pn.elements[8]*=h,Pn.elements[9]*=h,Pn.elements[10]*=h,e.setFromRotationMatrix(Pn),n.x=r,n.y=o,n.z=a,this}makePerspective(t,e,n,i,r,o,a=zn,c=!1){const l=this.elements,u=2*r/(e-t),h=2*r/(n-i),p=(e+t)/(e-t),d=(n+i)/(n-i);let m,v;if(c)m=r/(o-r),v=o*r/(o-r);else if(a===zn)m=-(o+r)/(o-r),v=-2*o*r/(o-r);else if(a===zo)m=-o/(o-r),v=-o*r/(o-r);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+a);return l[0]=u,l[4]=0,l[8]=p,l[12]=0,l[1]=0,l[5]=h,l[9]=d,l[13]=0,l[2]=0,l[6]=0,l[10]=m,l[14]=v,l[3]=0,l[7]=0,l[11]=-1,l[15]=0,this}makeOrthographic(t,e,n,i,r,o,a=zn,c=!1){const l=this.elements,u=2/(e-t),h=2/(n-i),p=-(e+t)/(e-t),d=-(n+i)/(n-i);let m,v;if(c)m=1/(o-r),v=o/(o-r);else if(a===zn)m=-2/(o-r),v=-(o+r)/(o-r);else if(a===zo)m=-1/(o-r),v=-r/(o-r);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+a);return l[0]=u,l[4]=0,l[8]=0,l[12]=p,l[1]=0,l[5]=h,l[9]=0,l[13]=d,l[2]=0,l[6]=0,l[10]=m,l[14]=v,l[3]=0,l[7]=0,l[11]=0,l[15]=1,this}equals(t){const e=this.elements,n=t.elements;for(let i=0;i<16;i++)if(e[i]!==n[i])return!1;return!0}fromArray(t,e=0){for(let n=0;n<16;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){const n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t[e+9]=n[9],t[e+10]=n[10],t[e+11]=n[11],t[e+12]=n[12],t[e+13]=n[13],t[e+14]=n[14],t[e+15]=n[15],t}}const ds=new A,Pn=new Et,Mf=new A(0,0,0),bf=new A(1,1,1),_i=new A,Xr=new A,fn=new A,Pl=new Et,Dl=new xe;class Ye{constructor(t=0,e=0,n=0,i=Ye.DEFAULT_ORDER){this.isEuler=!0,this._x=t,this._y=e,this._z=n,this._order=i}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get order(){return this._order}set order(t){this._order=t,this._onChangeCallback()}set(t,e,n,i=this._order){return this._x=t,this._y=e,this._z=n,this._order=i,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(t){return this._x=t._x,this._y=t._y,this._z=t._z,this._order=t._order,this._onChangeCallback(),this}setFromRotationMatrix(t,e=this._order,n=!0){const i=t.elements,r=i[0],o=i[4],a=i[8],c=i[1],l=i[5],u=i[9],h=i[2],p=i[6],d=i[10];switch(e){case"XYZ":this._y=Math.asin(ie(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(-u,d),this._z=Math.atan2(-o,r)):(this._x=Math.atan2(p,l),this._z=0);break;case"YXZ":this._x=Math.asin(-ie(u,-1,1)),Math.abs(u)<.9999999?(this._y=Math.atan2(a,d),this._z=Math.atan2(c,l)):(this._y=Math.atan2(-h,r),this._z=0);break;case"ZXY":this._x=Math.asin(ie(p,-1,1)),Math.abs(p)<.9999999?(this._y=Math.atan2(-h,d),this._z=Math.atan2(-o,l)):(this._y=0,this._z=Math.atan2(c,r));break;case"ZYX":this._y=Math.asin(-ie(h,-1,1)),Math.abs(h)<.9999999?(this._x=Math.atan2(p,d),this._z=Math.atan2(c,r)):(this._x=0,this._z=Math.atan2(-o,l));break;case"YZX":this._z=Math.asin(ie(c,-1,1)),Math.abs(c)<.9999999?(this._x=Math.atan2(-u,l),this._y=Math.atan2(-h,r)):(this._x=0,this._y=Math.atan2(a,d));break;case"XZY":this._z=Math.asin(-ie(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(p,l),this._y=Math.atan2(a,r)):(this._x=Math.atan2(-u,d),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+e)}return this._order=e,n===!0&&this._onChangeCallback(),this}setFromQuaternion(t,e,n){return Pl.makeRotationFromQuaternion(t),this.setFromRotationMatrix(Pl,e,n)}setFromVector3(t,e=this._order){return this.set(t.x,t.y,t.z,e)}reorder(t){return Dl.setFromEuler(this),this.setFromQuaternion(Dl,t)}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._order===this._order}fromArray(t){return this._x=t[0],this._y=t[1],this._z=t[2],t[3]!==void 0&&(this._order=t[3]),this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._order,t}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}Ye.DEFAULT_ORDER="XYZ";class mu{constructor(){this.mask=1}set(t){this.mask=(1<<t|0)>>>0}enable(t){this.mask|=1<<t|0}enableAll(){this.mask=-1}toggle(t){this.mask^=1<<t|0}disable(t){this.mask&=~(1<<t|0)}disableAll(){this.mask=0}test(t){return(this.mask&t.mask)!==0}isEnabled(t){return(this.mask&(1<<t|0))!==0}}let Sf=0;const Il=new A,fs=new xe,oi=new Et,qr=new A,$s=new A,wf=new A,Tf=new xe,Ll=new A(1,0,0),Ul=new A(0,1,0),Nl=new A(0,0,1),Fl={type:"added"},Ef={type:"removed"},ps={type:"childadded",child:null},pa={type:"childremoved",child:null};class pe extends rs{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:Sf++}),this.uuid=ti(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=pe.DEFAULT_UP.clone();const t=new A,e=new Ye,n=new xe,i=new A(1,1,1);function r(){n.setFromEuler(e,!1)}function o(){e.setFromQuaternion(n,void 0,!1)}e._onChange(r),n._onChange(o),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:t},rotation:{configurable:!0,enumerable:!0,value:e},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:i},modelViewMatrix:{value:new Et},normalMatrix:{value:new ne}}),this.matrix=new Et,this.matrixWorld=new Et,this.matrixAutoUpdate=pe.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=pe.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new mu,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(t){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(t),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(t){return this.quaternion.premultiply(t),this}setRotationFromAxisAngle(t,e){this.quaternion.setFromAxisAngle(t,e)}setRotationFromEuler(t){this.quaternion.setFromEuler(t,!0)}setRotationFromMatrix(t){this.quaternion.setFromRotationMatrix(t)}setRotationFromQuaternion(t){this.quaternion.copy(t)}rotateOnAxis(t,e){return fs.setFromAxisAngle(t,e),this.quaternion.multiply(fs),this}rotateOnWorldAxis(t,e){return fs.setFromAxisAngle(t,e),this.quaternion.premultiply(fs),this}rotateX(t){return this.rotateOnAxis(Ll,t)}rotateY(t){return this.rotateOnAxis(Ul,t)}rotateZ(t){return this.rotateOnAxis(Nl,t)}translateOnAxis(t,e){return Il.copy(t).applyQuaternion(this.quaternion),this.position.add(Il.multiplyScalar(e)),this}translateX(t){return this.translateOnAxis(Ll,t)}translateY(t){return this.translateOnAxis(Ul,t)}translateZ(t){return this.translateOnAxis(Nl,t)}localToWorld(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(this.matrixWorld)}worldToLocal(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(oi.copy(this.matrixWorld).invert())}lookAt(t,e,n){t.isVector3?qr.copy(t):qr.set(t,e,n);const i=this.parent;this.updateWorldMatrix(!0,!1),$s.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?oi.lookAt($s,qr,this.up):oi.lookAt(qr,$s,this.up),this.quaternion.setFromRotationMatrix(oi),i&&(oi.extractRotation(i.matrixWorld),fs.setFromRotationMatrix(oi),this.quaternion.premultiply(fs.invert()))}add(t){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.add(arguments[e]);return this}return t===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",t),this):(t&&t.isObject3D?(t.removeFromParent(),t.parent=this,this.children.push(t),t.dispatchEvent(Fl),ps.child=t,this.dispatchEvent(ps),ps.child=null):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",t),this)}remove(t){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}const e=this.children.indexOf(t);return e!==-1&&(t.parent=null,this.children.splice(e,1),t.dispatchEvent(Ef),pa.child=t,this.dispatchEvent(pa),pa.child=null),this}removeFromParent(){const t=this.parent;return t!==null&&t.remove(this),this}clear(){return this.remove(...this.children)}attach(t){return this.updateWorldMatrix(!0,!1),oi.copy(this.matrixWorld).invert(),t.parent!==null&&(t.parent.updateWorldMatrix(!0,!1),oi.multiply(t.parent.matrixWorld)),t.applyMatrix4(oi),t.removeFromParent(),t.parent=this,this.children.push(t),t.updateWorldMatrix(!1,!0),t.dispatchEvent(Fl),ps.child=t,this.dispatchEvent(ps),ps.child=null,this}getObjectById(t){return this.getObjectByProperty("id",t)}getObjectByName(t){return this.getObjectByProperty("name",t)}getObjectByProperty(t,e){if(this[t]===e)return this;for(let n=0,i=this.children.length;n<i;n++){const o=this.children[n].getObjectByProperty(t,e);if(o!==void 0)return o}}getObjectsByProperty(t,e,n=[]){this[t]===e&&n.push(this);const i=this.children;for(let r=0,o=i.length;r<o;r++)i[r].getObjectsByProperty(t,e,n);return n}getWorldPosition(t){return this.updateWorldMatrix(!0,!1),t.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose($s,t,wf),t}getWorldScale(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose($s,Tf,t),t}getWorldDirection(t){this.updateWorldMatrix(!0,!1);const e=this.matrixWorld.elements;return t.set(e[8],e[9],e[10]).normalize()}raycast(){}traverse(t){t(this);const e=this.children;for(let n=0,i=e.length;n<i;n++)e[n].traverse(t)}traverseVisible(t){if(this.visible===!1)return;t(this);const e=this.children;for(let n=0,i=e.length;n<i;n++)e[n].traverseVisible(t)}traverseAncestors(t){const e=this.parent;e!==null&&(t(e),e.traverseAncestors(t))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(t){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||t)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,t=!0);const e=this.children;for(let n=0,i=e.length;n<i;n++)e[n].updateMatrixWorld(t)}updateWorldMatrix(t,e){const n=this.parent;if(t===!0&&n!==null&&n.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),e===!0){const i=this.children;for(let r=0,o=i.length;r<o;r++)i[r].updateWorldMatrix(!1,!0)}}toJSON(t){const e=t===void 0||typeof t=="string",n={};e&&(t={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});const i={};i.uuid=this.uuid,i.type=this.type,this.name!==""&&(i.name=this.name),this.castShadow===!0&&(i.castShadow=!0),this.receiveShadow===!0&&(i.receiveShadow=!0),this.visible===!1&&(i.visible=!1),this.frustumCulled===!1&&(i.frustumCulled=!1),this.renderOrder!==0&&(i.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(i.userData=this.userData),i.layers=this.layers.mask,i.matrix=this.matrix.toArray(),i.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(i.matrixAutoUpdate=!1),this.isInstancedMesh&&(i.type="InstancedMesh",i.count=this.count,i.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(i.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(i.type="BatchedMesh",i.perObjectFrustumCulled=this.perObjectFrustumCulled,i.sortObjects=this.sortObjects,i.drawRanges=this._drawRanges,i.reservedRanges=this._reservedRanges,i.geometryInfo=this._geometryInfo.map(a=>({...a,boundingBox:a.boundingBox?a.boundingBox.toJSON():void 0,boundingSphere:a.boundingSphere?a.boundingSphere.toJSON():void 0})),i.instanceInfo=this._instanceInfo.map(a=>({...a})),i.availableInstanceIds=this._availableInstanceIds.slice(),i.availableGeometryIds=this._availableGeometryIds.slice(),i.nextIndexStart=this._nextIndexStart,i.nextVertexStart=this._nextVertexStart,i.geometryCount=this._geometryCount,i.maxInstanceCount=this._maxInstanceCount,i.maxVertexCount=this._maxVertexCount,i.maxIndexCount=this._maxIndexCount,i.geometryInitialized=this._geometryInitialized,i.matricesTexture=this._matricesTexture.toJSON(t),i.indirectTexture=this._indirectTexture.toJSON(t),this._colorsTexture!==null&&(i.colorsTexture=this._colorsTexture.toJSON(t)),this.boundingSphere!==null&&(i.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(i.boundingBox=this.boundingBox.toJSON()));function r(a,c){return a[c.uuid]===void 0&&(a[c.uuid]=c.toJSON(t)),c.uuid}if(this.isScene)this.background&&(this.background.isColor?i.background=this.background.toJSON():this.background.isTexture&&(i.background=this.background.toJSON(t).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(i.environment=this.environment.toJSON(t).uuid);else if(this.isMesh||this.isLine||this.isPoints){i.geometry=r(t.geometries,this.geometry);const a=this.geometry.parameters;if(a!==void 0&&a.shapes!==void 0){const c=a.shapes;if(Array.isArray(c))for(let l=0,u=c.length;l<u;l++){const h=c[l];r(t.shapes,h)}else r(t.shapes,c)}}if(this.isSkinnedMesh&&(i.bindMode=this.bindMode,i.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(r(t.skeletons,this.skeleton),i.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const a=[];for(let c=0,l=this.material.length;c<l;c++)a.push(r(t.materials,this.material[c]));i.material=a}else i.material=r(t.materials,this.material);if(this.children.length>0){i.children=[];for(let a=0;a<this.children.length;a++)i.children.push(this.children[a].toJSON(t).object)}if(this.animations.length>0){i.animations=[];for(let a=0;a<this.animations.length;a++){const c=this.animations[a];i.animations.push(r(t.animations,c))}}if(e){const a=o(t.geometries),c=o(t.materials),l=o(t.textures),u=o(t.images),h=o(t.shapes),p=o(t.skeletons),d=o(t.animations),m=o(t.nodes);a.length>0&&(n.geometries=a),c.length>0&&(n.materials=c),l.length>0&&(n.textures=l),u.length>0&&(n.images=u),h.length>0&&(n.shapes=h),p.length>0&&(n.skeletons=p),d.length>0&&(n.animations=d),m.length>0&&(n.nodes=m)}return n.object=i,n;function o(a){const c=[];for(const l in a){const u=a[l];delete u.metadata,c.push(u)}return c}}clone(t){return new this.constructor().copy(this,t)}copy(t,e=!0){if(this.name=t.name,this.up.copy(t.up),this.position.copy(t.position),this.rotation.order=t.rotation.order,this.quaternion.copy(t.quaternion),this.scale.copy(t.scale),this.matrix.copy(t.matrix),this.matrixWorld.copy(t.matrixWorld),this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrixWorldAutoUpdate=t.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=t.matrixWorldNeedsUpdate,this.layers.mask=t.layers.mask,this.visible=t.visible,this.castShadow=t.castShadow,this.receiveShadow=t.receiveShadow,this.frustumCulled=t.frustumCulled,this.renderOrder=t.renderOrder,this.animations=t.animations.slice(),this.userData=JSON.parse(JSON.stringify(t.userData)),e===!0)for(let n=0;n<t.children.length;n++){const i=t.children[n];this.add(i.clone())}return this}}pe.DEFAULT_UP=new A(0,1,0);pe.DEFAULT_MATRIX_AUTO_UPDATE=!0;pe.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;const Dn=new A,ai=new A,ma=new A,ci=new A,ms=new A,gs=new A,zl=new A,ga=new A,va=new A,_a=new A,xa=new be,ya=new be,Ma=new be;class En{constructor(t=new A,e=new A,n=new A){this.a=t,this.b=e,this.c=n}static getNormal(t,e,n,i){i.subVectors(n,e),Dn.subVectors(t,e),i.cross(Dn);const r=i.lengthSq();return r>0?i.multiplyScalar(1/Math.sqrt(r)):i.set(0,0,0)}static getBarycoord(t,e,n,i,r){Dn.subVectors(i,e),ai.subVectors(n,e),ma.subVectors(t,e);const o=Dn.dot(Dn),a=Dn.dot(ai),c=Dn.dot(ma),l=ai.dot(ai),u=ai.dot(ma),h=o*l-a*a;if(h===0)return r.set(0,0,0),null;const p=1/h,d=(l*c-a*u)*p,m=(o*u-a*c)*p;return r.set(1-d-m,m,d)}static containsPoint(t,e,n,i){return this.getBarycoord(t,e,n,i,ci)===null?!1:ci.x>=0&&ci.y>=0&&ci.x+ci.y<=1}static getInterpolation(t,e,n,i,r,o,a,c){return this.getBarycoord(t,e,n,i,ci)===null?(c.x=0,c.y=0,"z"in c&&(c.z=0),"w"in c&&(c.w=0),null):(c.setScalar(0),c.addScaledVector(r,ci.x),c.addScaledVector(o,ci.y),c.addScaledVector(a,ci.z),c)}static getInterpolatedAttribute(t,e,n,i,r,o){return xa.setScalar(0),ya.setScalar(0),Ma.setScalar(0),xa.fromBufferAttribute(t,e),ya.fromBufferAttribute(t,n),Ma.fromBufferAttribute(t,i),o.setScalar(0),o.addScaledVector(xa,r.x),o.addScaledVector(ya,r.y),o.addScaledVector(Ma,r.z),o}static isFrontFacing(t,e,n,i){return Dn.subVectors(n,e),ai.subVectors(t,e),Dn.cross(ai).dot(i)<0}set(t,e,n){return this.a.copy(t),this.b.copy(e),this.c.copy(n),this}setFromPointsAndIndices(t,e,n,i){return this.a.copy(t[e]),this.b.copy(t[n]),this.c.copy(t[i]),this}setFromAttributeAndIndices(t,e,n,i){return this.a.fromBufferAttribute(t,e),this.b.fromBufferAttribute(t,n),this.c.fromBufferAttribute(t,i),this}clone(){return new this.constructor().copy(this)}copy(t){return this.a.copy(t.a),this.b.copy(t.b),this.c.copy(t.c),this}getArea(){return Dn.subVectors(this.c,this.b),ai.subVectors(this.a,this.b),Dn.cross(ai).length()*.5}getMidpoint(t){return t.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(t){return En.getNormal(this.a,this.b,this.c,t)}getPlane(t){return t.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(t,e){return En.getBarycoord(t,this.a,this.b,this.c,e)}getInterpolation(t,e,n,i,r){return En.getInterpolation(t,this.a,this.b,this.c,e,n,i,r)}containsPoint(t){return En.containsPoint(t,this.a,this.b,this.c)}isFrontFacing(t){return En.isFrontFacing(this.a,this.b,this.c,t)}intersectsBox(t){return t.intersectsTriangle(this)}closestPointToPoint(t,e){const n=this.a,i=this.b,r=this.c;let o,a;ms.subVectors(i,n),gs.subVectors(r,n),ga.subVectors(t,n);const c=ms.dot(ga),l=gs.dot(ga);if(c<=0&&l<=0)return e.copy(n);va.subVectors(t,i);const u=ms.dot(va),h=gs.dot(va);if(u>=0&&h<=u)return e.copy(i);const p=c*h-u*l;if(p<=0&&c>=0&&u<=0)return o=c/(c-u),e.copy(n).addScaledVector(ms,o);_a.subVectors(t,r);const d=ms.dot(_a),m=gs.dot(_a);if(m>=0&&d<=m)return e.copy(r);const v=d*l-c*m;if(v<=0&&l>=0&&m<=0)return a=l/(l-m),e.copy(n).addScaledVector(gs,a);const g=u*m-d*h;if(g<=0&&h-u>=0&&d-m>=0)return zl.subVectors(r,i),a=(h-u)/(h-u+(d-m)),e.copy(i).addScaledVector(zl,a);const f=1/(g+v+p);return o=v*f,a=p*f,e.copy(n).addScaledVector(ms,o).addScaledVector(gs,a)}equals(t){return t.a.equals(this.a)&&t.b.equals(this.b)&&t.c.equals(this.c)}}const gu={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},xi={h:0,s:0,l:0},Yr={h:0,s:0,l:0};function ba(s,t,e){return e<0&&(e+=1),e>1&&(e-=1),e<1/6?s+(t-s)*6*e:e<1/2?t:e<2/3?s+(t-s)*6*(2/3-e):s}class lt{constructor(t,e,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(t,e,n)}set(t,e,n){if(e===void 0&&n===void 0){const i=t;i&&i.isColor?this.copy(i):typeof i=="number"?this.setHex(i):typeof i=="string"&&this.setStyle(i)}else this.setRGB(t,e,n);return this}setScalar(t){return this.r=t,this.g=t,this.b=t,this}setHex(t,e=ae){return t=Math.floor(t),this.r=(t>>16&255)/255,this.g=(t>>8&255)/255,this.b=(t&255)/255,fe.colorSpaceToWorking(this,e),this}setRGB(t,e,n,i=fe.workingColorSpace){return this.r=t,this.g=e,this.b=n,fe.colorSpaceToWorking(this,i),this}setHSL(t,e,n,i=fe.workingColorSpace){if(t=Kc(t,1),e=ie(e,0,1),n=ie(n,0,1),e===0)this.r=this.g=this.b=n;else{const r=n<=.5?n*(1+e):n+e-n*e,o=2*n-r;this.r=ba(o,r,t+1/3),this.g=ba(o,r,t),this.b=ba(o,r,t-1/3)}return fe.colorSpaceToWorking(this,i),this}setStyle(t,e=ae){function n(r){r!==void 0&&parseFloat(r)<1&&console.warn("THREE.Color: Alpha component of "+t+" will be ignored.")}let i;if(i=/^(\w+)\(([^\)]*)\)/.exec(t)){let r;const o=i[1],a=i[2];switch(o){case"rgb":case"rgba":if(r=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(r[4]),this.setRGB(Math.min(255,parseInt(r[1],10))/255,Math.min(255,parseInt(r[2],10))/255,Math.min(255,parseInt(r[3],10))/255,e);if(r=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(r[4]),this.setRGB(Math.min(100,parseInt(r[1],10))/100,Math.min(100,parseInt(r[2],10))/100,Math.min(100,parseInt(r[3],10))/100,e);break;case"hsl":case"hsla":if(r=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(r[4]),this.setHSL(parseFloat(r[1])/360,parseFloat(r[2])/100,parseFloat(r[3])/100,e);break;default:console.warn("THREE.Color: Unknown color model "+t)}}else if(i=/^\#([A-Fa-f\d]+)$/.exec(t)){const r=i[1],o=r.length;if(o===3)return this.setRGB(parseInt(r.charAt(0),16)/15,parseInt(r.charAt(1),16)/15,parseInt(r.charAt(2),16)/15,e);if(o===6)return this.setHex(parseInt(r,16),e);console.warn("THREE.Color: Invalid hex color "+t)}else if(t&&t.length>0)return this.setColorName(t,e);return this}setColorName(t,e=ae){const n=gu[t.toLowerCase()];return n!==void 0?this.setHex(n,e):console.warn("THREE.Color: Unknown color "+t),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(t){return this.r=t.r,this.g=t.g,this.b=t.b,this}copySRGBToLinear(t){return this.r=fi(t.r),this.g=fi(t.g),this.b=fi(t.b),this}copyLinearToSRGB(t){return this.r=Ns(t.r),this.g=Ns(t.g),this.b=Ns(t.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(t=ae){return fe.workingToColorSpace(je.copy(this),t),Math.round(ie(je.r*255,0,255))*65536+Math.round(ie(je.g*255,0,255))*256+Math.round(ie(je.b*255,0,255))}getHexString(t=ae){return("000000"+this.getHex(t).toString(16)).slice(-6)}getHSL(t,e=fe.workingColorSpace){fe.workingToColorSpace(je.copy(this),e);const n=je.r,i=je.g,r=je.b,o=Math.max(n,i,r),a=Math.min(n,i,r);let c,l;const u=(a+o)/2;if(a===o)c=0,l=0;else{const h=o-a;switch(l=u<=.5?h/(o+a):h/(2-o-a),o){case n:c=(i-r)/h+(i<r?6:0);break;case i:c=(r-n)/h+2;break;case r:c=(n-i)/h+4;break}c/=6}return t.h=c,t.s=l,t.l=u,t}getRGB(t,e=fe.workingColorSpace){return fe.workingToColorSpace(je.copy(this),e),t.r=je.r,t.g=je.g,t.b=je.b,t}getStyle(t=ae){fe.workingToColorSpace(je.copy(this),t);const e=je.r,n=je.g,i=je.b;return t!==ae?`color(${t} ${e.toFixed(3)} ${n.toFixed(3)} ${i.toFixed(3)})`:`rgb(${Math.round(e*255)},${Math.round(n*255)},${Math.round(i*255)})`}offsetHSL(t,e,n){return this.getHSL(xi),this.setHSL(xi.h+t,xi.s+e,xi.l+n)}add(t){return this.r+=t.r,this.g+=t.g,this.b+=t.b,this}addColors(t,e){return this.r=t.r+e.r,this.g=t.g+e.g,this.b=t.b+e.b,this}addScalar(t){return this.r+=t,this.g+=t,this.b+=t,this}sub(t){return this.r=Math.max(0,this.r-t.r),this.g=Math.max(0,this.g-t.g),this.b=Math.max(0,this.b-t.b),this}multiply(t){return this.r*=t.r,this.g*=t.g,this.b*=t.b,this}multiplyScalar(t){return this.r*=t,this.g*=t,this.b*=t,this}lerp(t,e){return this.r+=(t.r-this.r)*e,this.g+=(t.g-this.g)*e,this.b+=(t.b-this.b)*e,this}lerpColors(t,e,n){return this.r=t.r+(e.r-t.r)*n,this.g=t.g+(e.g-t.g)*n,this.b=t.b+(e.b-t.b)*n,this}lerpHSL(t,e){this.getHSL(xi),t.getHSL(Yr);const n=xr(xi.h,Yr.h,e),i=xr(xi.s,Yr.s,e),r=xr(xi.l,Yr.l,e);return this.setHSL(n,i,r),this}setFromVector3(t){return this.r=t.x,this.g=t.y,this.b=t.z,this}applyMatrix3(t){const e=this.r,n=this.g,i=this.b,r=t.elements;return this.r=r[0]*e+r[3]*n+r[6]*i,this.g=r[1]*e+r[4]*n+r[7]*i,this.b=r[2]*e+r[5]*n+r[8]*i,this}equals(t){return t.r===this.r&&t.g===this.g&&t.b===this.b}fromArray(t,e=0){return this.r=t[e],this.g=t[e+1],this.b=t[e+2],this}toArray(t=[],e=0){return t[e]=this.r,t[e+1]=this.g,t[e+2]=this.b,t}fromBufferAttribute(t,e){return this.r=t.getX(e),this.g=t.getY(e),this.b=t.getZ(e),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}const je=new lt;lt.NAMES=gu;let Af=0;class Li extends rs{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:Af++}),this.uuid=ti(),this.name="",this.type="Material",this.blending=Us,this.side=pi,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=ja,this.blendDst=$a,this.blendEquation=ji,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new lt(0,0,0),this.blendAlpha=0,this.depthFunc=Fs,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=Sl,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=as,this.stencilZFail=as,this.stencilZPass=as,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(t){this._alphaTest>0!=t>0&&this.version++,this._alphaTest=t}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(t){if(t!==void 0)for(const e in t){const n=t[e];if(n===void 0){console.warn(`THREE.Material: parameter '${e}' has value of undefined.`);continue}const i=this[e];if(i===void 0){console.warn(`THREE.Material: '${e}' is not a property of THREE.${this.type}.`);continue}i&&i.isColor?i.set(n):i&&i.isVector3&&n&&n.isVector3?i.copy(n):this[e]=n}}toJSON(t){const e=t===void 0||typeof t=="string";e&&(t={textures:{},images:{}});const n={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,this.name!==""&&(n.name=this.name),this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(t).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(t).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(t).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(n.sheenColorMap=this.sheenColorMap.toJSON(t).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(n.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(t).uuid),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(t).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(t).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(t).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(t).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(t).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(t).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(t).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(t).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(t).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(t).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(t).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(t).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(t).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(t).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(t).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(t).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(t).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(t).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(t).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(t).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(t).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.shadowSide!==null&&(n.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),this.blending!==Us&&(n.blending=this.blending),this.side!==pi&&(n.side=this.side),this.vertexColors===!0&&(n.vertexColors=!0),this.opacity<1&&(n.opacity=this.opacity),this.transparent===!0&&(n.transparent=!0),this.blendSrc!==ja&&(n.blendSrc=this.blendSrc),this.blendDst!==$a&&(n.blendDst=this.blendDst),this.blendEquation!==ji&&(n.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(n.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(n.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(n.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(n.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(n.blendAlpha=this.blendAlpha),this.depthFunc!==Fs&&(n.depthFunc=this.depthFunc),this.depthTest===!1&&(n.depthTest=this.depthTest),this.depthWrite===!1&&(n.depthWrite=this.depthWrite),this.colorWrite===!1&&(n.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(n.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==Sl&&(n.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(n.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(n.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==as&&(n.stencilFail=this.stencilFail),this.stencilZFail!==as&&(n.stencilZFail=this.stencilZFail),this.stencilZPass!==as&&(n.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(n.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(n.rotation=this.rotation),this.polygonOffset===!0&&(n.polygonOffset=!0),this.polygonOffsetFactor!==0&&(n.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(n.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(n.linewidth=this.linewidth),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.dithering===!0&&(n.dithering=!0),this.alphaTest>0&&(n.alphaTest=this.alphaTest),this.alphaHash===!0&&(n.alphaHash=!0),this.alphaToCoverage===!0&&(n.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(n.premultipliedAlpha=!0),this.forceSinglePass===!0&&(n.forceSinglePass=!0),this.wireframe===!0&&(n.wireframe=!0),this.wireframeLinewidth>1&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(n.flatShading=!0),this.visible===!1&&(n.visible=!1),this.toneMapped===!1&&(n.toneMapped=!1),this.fog===!1&&(n.fog=!1),Object.keys(this.userData).length>0&&(n.userData=this.userData);function i(r){const o=[];for(const a in r){const c=r[a];delete c.metadata,o.push(c)}return o}if(e){const r=i(t.textures),o=i(t.images);r.length>0&&(n.textures=r),o.length>0&&(n.images=o)}return n}clone(){return new this.constructor().copy(this)}copy(t){this.name=t.name,this.blending=t.blending,this.side=t.side,this.vertexColors=t.vertexColors,this.opacity=t.opacity,this.transparent=t.transparent,this.blendSrc=t.blendSrc,this.blendDst=t.blendDst,this.blendEquation=t.blendEquation,this.blendSrcAlpha=t.blendSrcAlpha,this.blendDstAlpha=t.blendDstAlpha,this.blendEquationAlpha=t.blendEquationAlpha,this.blendColor.copy(t.blendColor),this.blendAlpha=t.blendAlpha,this.depthFunc=t.depthFunc,this.depthTest=t.depthTest,this.depthWrite=t.depthWrite,this.stencilWriteMask=t.stencilWriteMask,this.stencilFunc=t.stencilFunc,this.stencilRef=t.stencilRef,this.stencilFuncMask=t.stencilFuncMask,this.stencilFail=t.stencilFail,this.stencilZFail=t.stencilZFail,this.stencilZPass=t.stencilZPass,this.stencilWrite=t.stencilWrite;const e=t.clippingPlanes;let n=null;if(e!==null){const i=e.length;n=new Array(i);for(let r=0;r!==i;++r)n[r]=e[r].clone()}return this.clippingPlanes=n,this.clipIntersection=t.clipIntersection,this.clipShadows=t.clipShadows,this.shadowSide=t.shadowSide,this.colorWrite=t.colorWrite,this.precision=t.precision,this.polygonOffset=t.polygonOffset,this.polygonOffsetFactor=t.polygonOffsetFactor,this.polygonOffsetUnits=t.polygonOffsetUnits,this.dithering=t.dithering,this.alphaTest=t.alphaTest,this.alphaHash=t.alphaHash,this.alphaToCoverage=t.alphaToCoverage,this.premultipliedAlpha=t.premultipliedAlpha,this.forceSinglePass=t.forceSinglePass,this.visible=t.visible,this.toneMapped=t.toneMapped,this.userData=JSON.parse(JSON.stringify(t.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(t){t===!0&&this.version++}}class Di extends Li{constructor(t){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new lt(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Ye,this.combine=eu,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.combine=t.combine,this.reflectivity=t.reflectivity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.fog=t.fog,this}}const Fe=new A,Zr=new tt;let Rf=0;class Ae{constructor(t,e,n=!1){if(Array.isArray(t))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:Rf++}),this.name="",this.array=t,this.itemSize=e,this.count=t!==void 0?t.length/e:0,this.normalized=n,this.usage=Fc,this.updateRanges=[],this.gpuType=An,this.version=0}onUploadCallback(){}set needsUpdate(t){t===!0&&this.version++}setUsage(t){return this.usage=t,this}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.name=t.name,this.array=new t.array.constructor(t.array),this.itemSize=t.itemSize,this.count=t.count,this.normalized=t.normalized,this.usage=t.usage,this.gpuType=t.gpuType,this}copyAt(t,e,n){t*=this.itemSize,n*=e.itemSize;for(let i=0,r=this.itemSize;i<r;i++)this.array[t+i]=e.array[n+i];return this}copyArray(t){return this.array.set(t),this}applyMatrix3(t){if(this.itemSize===2)for(let e=0,n=this.count;e<n;e++)Zr.fromBufferAttribute(this,e),Zr.applyMatrix3(t),this.setXY(e,Zr.x,Zr.y);else if(this.itemSize===3)for(let e=0,n=this.count;e<n;e++)Fe.fromBufferAttribute(this,e),Fe.applyMatrix3(t),this.setXYZ(e,Fe.x,Fe.y,Fe.z);return this}applyMatrix4(t){for(let e=0,n=this.count;e<n;e++)Fe.fromBufferAttribute(this,e),Fe.applyMatrix4(t),this.setXYZ(e,Fe.x,Fe.y,Fe.z);return this}applyNormalMatrix(t){for(let e=0,n=this.count;e<n;e++)Fe.fromBufferAttribute(this,e),Fe.applyNormalMatrix(t),this.setXYZ(e,Fe.x,Fe.y,Fe.z);return this}transformDirection(t){for(let e=0,n=this.count;e<n;e++)Fe.fromBufferAttribute(this,e),Fe.transformDirection(t),this.setXYZ(e,Fe.x,Fe.y,Fe.z);return this}set(t,e=0){return this.array.set(t,e),this}getComponent(t,e){let n=this.array[t*this.itemSize+e];return this.normalized&&(n=Nn(n,this.array)),n}setComponent(t,e,n){return this.normalized&&(n=Me(n,this.array)),this.array[t*this.itemSize+e]=n,this}getX(t){let e=this.array[t*this.itemSize];return this.normalized&&(e=Nn(e,this.array)),e}setX(t,e){return this.normalized&&(e=Me(e,this.array)),this.array[t*this.itemSize]=e,this}getY(t){let e=this.array[t*this.itemSize+1];return this.normalized&&(e=Nn(e,this.array)),e}setY(t,e){return this.normalized&&(e=Me(e,this.array)),this.array[t*this.itemSize+1]=e,this}getZ(t){let e=this.array[t*this.itemSize+2];return this.normalized&&(e=Nn(e,this.array)),e}setZ(t,e){return this.normalized&&(e=Me(e,this.array)),this.array[t*this.itemSize+2]=e,this}getW(t){let e=this.array[t*this.itemSize+3];return this.normalized&&(e=Nn(e,this.array)),e}setW(t,e){return this.normalized&&(e=Me(e,this.array)),this.array[t*this.itemSize+3]=e,this}setXY(t,e,n){return t*=this.itemSize,this.normalized&&(e=Me(e,this.array),n=Me(n,this.array)),this.array[t+0]=e,this.array[t+1]=n,this}setXYZ(t,e,n,i){return t*=this.itemSize,this.normalized&&(e=Me(e,this.array),n=Me(n,this.array),i=Me(i,this.array)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=i,this}setXYZW(t,e,n,i,r){return t*=this.itemSize,this.normalized&&(e=Me(e,this.array),n=Me(n,this.array),i=Me(i,this.array),r=Me(r,this.array)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=i,this.array[t+3]=r,this}onUpload(t){return this.onUploadCallback=t,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const t={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(t.name=this.name),this.usage!==Fc&&(t.usage=this.usage),t}}class Qc extends Ae{constructor(t,e,n){super(new Uint16Array(t),e,n)}}class tl extends Ae{constructor(t,e,n){super(new Uint32Array(t),e,n)}}class Gt extends Ae{constructor(t,e,n){super(new Float32Array(t),e,n)}}let Cf=0;const wn=new Et,Sa=new pe,vs=new A,pn=new On,Ks=new On,Ge=new A;class me extends rs{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:Cf++}),this.uuid=ti(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(t){return Array.isArray(t)?this.index=new(fu(t)?tl:Qc)(t,1):this.index=t,this}setIndirect(t){return this.indirect=t,this}getIndirect(){return this.indirect}getAttribute(t){return this.attributes[t]}setAttribute(t,e){return this.attributes[t]=e,this}deleteAttribute(t){return delete this.attributes[t],this}hasAttribute(t){return this.attributes[t]!==void 0}addGroup(t,e,n=0){this.groups.push({start:t,count:e,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(t,e){this.drawRange.start=t,this.drawRange.count=e}applyMatrix4(t){const e=this.attributes.position;e!==void 0&&(e.applyMatrix4(t),e.needsUpdate=!0);const n=this.attributes.normal;if(n!==void 0){const r=new ne().getNormalMatrix(t);n.applyNormalMatrix(r),n.needsUpdate=!0}const i=this.attributes.tangent;return i!==void 0&&(i.transformDirection(t),i.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(t){return wn.makeRotationFromQuaternion(t),this.applyMatrix4(wn),this}rotateX(t){return wn.makeRotationX(t),this.applyMatrix4(wn),this}rotateY(t){return wn.makeRotationY(t),this.applyMatrix4(wn),this}rotateZ(t){return wn.makeRotationZ(t),this.applyMatrix4(wn),this}translate(t,e,n){return wn.makeTranslation(t,e,n),this.applyMatrix4(wn),this}scale(t,e,n){return wn.makeScale(t,e,n),this.applyMatrix4(wn),this}lookAt(t){return Sa.lookAt(t),Sa.updateMatrix(),this.applyMatrix4(Sa.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(vs).negate(),this.translate(vs.x,vs.y,vs.z),this}setFromPoints(t){const e=this.getAttribute("position");if(e===void 0){const n=[];for(let i=0,r=t.length;i<r;i++){const o=t[i];n.push(o.x,o.y,o.z||0)}this.setAttribute("position",new Gt(n,3))}else{const n=Math.min(t.length,e.count);for(let i=0;i<n;i++){const r=t[i];e.setXYZ(i,r.x,r.y,r.z||0)}t.length>e.count&&console.warn("THREE.BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),e.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new On);const t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new A(-1/0,-1/0,-1/0),new A(1/0,1/0,1/0));return}if(t!==void 0){if(this.boundingBox.setFromBufferAttribute(t),e)for(let n=0,i=e.length;n<i;n++){const r=e[n];pn.setFromBufferAttribute(r),this.morphTargetsRelative?(Ge.addVectors(this.boundingBox.min,pn.min),this.boundingBox.expandByPoint(Ge),Ge.addVectors(this.boundingBox.max,pn.max),this.boundingBox.expandByPoint(Ge)):(this.boundingBox.expandByPoint(pn.min),this.boundingBox.expandByPoint(pn.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Bn);const t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new A,1/0);return}if(t){const n=this.boundingSphere.center;if(pn.setFromBufferAttribute(t),e)for(let r=0,o=e.length;r<o;r++){const a=e[r];Ks.setFromBufferAttribute(a),this.morphTargetsRelative?(Ge.addVectors(pn.min,Ks.min),pn.expandByPoint(Ge),Ge.addVectors(pn.max,Ks.max),pn.expandByPoint(Ge)):(pn.expandByPoint(Ks.min),pn.expandByPoint(Ks.max))}pn.getCenter(n);let i=0;for(let r=0,o=t.count;r<o;r++)Ge.fromBufferAttribute(t,r),i=Math.max(i,n.distanceToSquared(Ge));if(e)for(let r=0,o=e.length;r<o;r++){const a=e[r],c=this.morphTargetsRelative;for(let l=0,u=a.count;l<u;l++)Ge.fromBufferAttribute(a,l),c&&(vs.fromBufferAttribute(t,l),Ge.add(vs)),i=Math.max(i,n.distanceToSquared(Ge))}this.boundingSphere.radius=Math.sqrt(i),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){const t=this.index,e=this.attributes;if(t===null||e.position===void 0||e.normal===void 0||e.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}const n=e.position,i=e.normal,r=e.uv;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new Ae(new Float32Array(4*n.count),4));const o=this.getAttribute("tangent"),a=[],c=[];for(let C=0;C<n.count;C++)a[C]=new A,c[C]=new A;const l=new A,u=new A,h=new A,p=new tt,d=new tt,m=new tt,v=new A,g=new A;function f(C,b,M){l.fromBufferAttribute(n,C),u.fromBufferAttribute(n,b),h.fromBufferAttribute(n,M),p.fromBufferAttribute(r,C),d.fromBufferAttribute(r,b),m.fromBufferAttribute(r,M),u.sub(l),h.sub(l),d.sub(p),m.sub(p);const E=1/(d.x*m.y-m.x*d.y);isFinite(E)&&(v.copy(u).multiplyScalar(m.y).addScaledVector(h,-d.y).multiplyScalar(E),g.copy(h).multiplyScalar(d.x).addScaledVector(u,-m.x).multiplyScalar(E),a[C].add(v),a[b].add(v),a[M].add(v),c[C].add(g),c[b].add(g),c[M].add(g))}let x=this.groups;x.length===0&&(x=[{start:0,count:t.count}]);for(let C=0,b=x.length;C<b;++C){const M=x[C],E=M.start,D=M.count;for(let N=E,I=E+D;N<I;N+=3)f(t.getX(N+0),t.getX(N+1),t.getX(N+2))}const _=new A,y=new A,w=new A,S=new A;function T(C){w.fromBufferAttribute(i,C),S.copy(w);const b=a[C];_.copy(b),_.sub(w.multiplyScalar(w.dot(b))).normalize(),y.crossVectors(S,b);const E=y.dot(c[C])<0?-1:1;o.setXYZW(C,_.x,_.y,_.z,E)}for(let C=0,b=x.length;C<b;++C){const M=x[C],E=M.start,D=M.count;for(let N=E,I=E+D;N<I;N+=3)T(t.getX(N+0)),T(t.getX(N+1)),T(t.getX(N+2))}}computeVertexNormals(){const t=this.index,e=this.getAttribute("position");if(e!==void 0){let n=this.getAttribute("normal");if(n===void 0)n=new Ae(new Float32Array(e.count*3),3),this.setAttribute("normal",n);else for(let p=0,d=n.count;p<d;p++)n.setXYZ(p,0,0,0);const i=new A,r=new A,o=new A,a=new A,c=new A,l=new A,u=new A,h=new A;if(t)for(let p=0,d=t.count;p<d;p+=3){const m=t.getX(p+0),v=t.getX(p+1),g=t.getX(p+2);i.fromBufferAttribute(e,m),r.fromBufferAttribute(e,v),o.fromBufferAttribute(e,g),u.subVectors(o,r),h.subVectors(i,r),u.cross(h),a.fromBufferAttribute(n,m),c.fromBufferAttribute(n,v),l.fromBufferAttribute(n,g),a.add(u),c.add(u),l.add(u),n.setXYZ(m,a.x,a.y,a.z),n.setXYZ(v,c.x,c.y,c.z),n.setXYZ(g,l.x,l.y,l.z)}else for(let p=0,d=e.count;p<d;p+=3)i.fromBufferAttribute(e,p+0),r.fromBufferAttribute(e,p+1),o.fromBufferAttribute(e,p+2),u.subVectors(o,r),h.subVectors(i,r),u.cross(h),n.setXYZ(p+0,u.x,u.y,u.z),n.setXYZ(p+1,u.x,u.y,u.z),n.setXYZ(p+2,u.x,u.y,u.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){const t=this.attributes.normal;for(let e=0,n=t.count;e<n;e++)Ge.fromBufferAttribute(t,e),Ge.normalize(),t.setXYZ(e,Ge.x,Ge.y,Ge.z)}toNonIndexed(){function t(a,c){const l=a.array,u=a.itemSize,h=a.normalized,p=new l.constructor(c.length*u);let d=0,m=0;for(let v=0,g=c.length;v<g;v++){a.isInterleavedBufferAttribute?d=c[v]*a.data.stride+a.offset:d=c[v]*u;for(let f=0;f<u;f++)p[m++]=l[d++]}return new Ae(p,u,h)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;const e=new me,n=this.index.array,i=this.attributes;for(const a in i){const c=i[a],l=t(c,n);e.setAttribute(a,l)}const r=this.morphAttributes;for(const a in r){const c=[],l=r[a];for(let u=0,h=l.length;u<h;u++){const p=l[u],d=t(p,n);c.push(d)}e.morphAttributes[a]=c}e.morphTargetsRelative=this.morphTargetsRelative;const o=this.groups;for(let a=0,c=o.length;a<c;a++){const l=o[a];e.addGroup(l.start,l.count,l.materialIndex)}return e}toJSON(){const t={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(t.uuid=this.uuid,t.type=this.type,this.name!==""&&(t.name=this.name),Object.keys(this.userData).length>0&&(t.userData=this.userData),this.parameters!==void 0){const c=this.parameters;for(const l in c)c[l]!==void 0&&(t[l]=c[l]);return t}t.data={attributes:{}};const e=this.index;e!==null&&(t.data.index={type:e.array.constructor.name,array:Array.prototype.slice.call(e.array)});const n=this.attributes;for(const c in n){const l=n[c];t.data.attributes[c]=l.toJSON(t.data)}const i={};let r=!1;for(const c in this.morphAttributes){const l=this.morphAttributes[c],u=[];for(let h=0,p=l.length;h<p;h++){const d=l[h];u.push(d.toJSON(t.data))}u.length>0&&(i[c]=u,r=!0)}r&&(t.data.morphAttributes=i,t.data.morphTargetsRelative=this.morphTargetsRelative);const o=this.groups;o.length>0&&(t.data.groups=JSON.parse(JSON.stringify(o)));const a=this.boundingSphere;return a!==null&&(t.data.boundingSphere=a.toJSON()),t}clone(){return new this.constructor().copy(this)}copy(t){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;const e={};this.name=t.name;const n=t.index;n!==null&&this.setIndex(n.clone());const i=t.attributes;for(const l in i){const u=i[l];this.setAttribute(l,u.clone(e))}const r=t.morphAttributes;for(const l in r){const u=[],h=r[l];for(let p=0,d=h.length;p<d;p++)u.push(h[p].clone(e));this.morphAttributes[l]=u}this.morphTargetsRelative=t.morphTargetsRelative;const o=t.groups;for(let l=0,u=o.length;l<u;l++){const h=o[l];this.addGroup(h.start,h.count,h.materialIndex)}const a=t.boundingBox;a!==null&&(this.boundingBox=a.clone());const c=t.boundingSphere;return c!==null&&(this.boundingSphere=c.clone()),this.drawRange.start=t.drawRange.start,this.drawRange.count=t.drawRange.count,this.userData=t.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}}const Ol=new Et,Bi=new Zo,jr=new Bn,Bl=new A,$r=new A,Kr=new A,Jr=new A,wa=new A,Qr=new A,kl=new A,to=new A;class ue extends pe{constructor(t=new me,e=new Di){super(),this.isMesh=!0,this.type="Mesh",this.geometry=t,this.material=e,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),t.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=t.morphTargetInfluences.slice()),t.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},t.morphTargetDictionary)),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}updateMorphTargets(){const e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){const i=e[n[0]];if(i!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=i.length;r<o;r++){const a=i[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}getVertexPosition(t,e){const n=this.geometry,i=n.attributes.position,r=n.morphAttributes.position,o=n.morphTargetsRelative;e.fromBufferAttribute(i,t);const a=this.morphTargetInfluences;if(r&&a){Qr.set(0,0,0);for(let c=0,l=r.length;c<l;c++){const u=a[c],h=r[c];u!==0&&(wa.fromBufferAttribute(h,t),o?Qr.addScaledVector(wa,u):Qr.addScaledVector(wa.sub(e),u))}e.add(Qr)}return e}raycast(t,e){const n=this.geometry,i=this.material,r=this.matrixWorld;i!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),jr.copy(n.boundingSphere),jr.applyMatrix4(r),Bi.copy(t.ray).recast(t.near),!(jr.containsPoint(Bi.origin)===!1&&(Bi.intersectSphere(jr,Bl)===null||Bi.origin.distanceToSquared(Bl)>(t.far-t.near)**2))&&(Ol.copy(r).invert(),Bi.copy(t.ray).applyMatrix4(Ol),!(n.boundingBox!==null&&Bi.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(t,e,Bi)))}_computeIntersections(t,e,n){let i;const r=this.geometry,o=this.material,a=r.index,c=r.attributes.position,l=r.attributes.uv,u=r.attributes.uv1,h=r.attributes.normal,p=r.groups,d=r.drawRange;if(a!==null)if(Array.isArray(o))for(let m=0,v=p.length;m<v;m++){const g=p[m],f=o[g.materialIndex],x=Math.max(g.start,d.start),_=Math.min(a.count,Math.min(g.start+g.count,d.start+d.count));for(let y=x,w=_;y<w;y+=3){const S=a.getX(y),T=a.getX(y+1),C=a.getX(y+2);i=eo(this,f,t,n,l,u,h,S,T,C),i&&(i.faceIndex=Math.floor(y/3),i.face.materialIndex=g.materialIndex,e.push(i))}}else{const m=Math.max(0,d.start),v=Math.min(a.count,d.start+d.count);for(let g=m,f=v;g<f;g+=3){const x=a.getX(g),_=a.getX(g+1),y=a.getX(g+2);i=eo(this,o,t,n,l,u,h,x,_,y),i&&(i.faceIndex=Math.floor(g/3),e.push(i))}}else if(c!==void 0)if(Array.isArray(o))for(let m=0,v=p.length;m<v;m++){const g=p[m],f=o[g.materialIndex],x=Math.max(g.start,d.start),_=Math.min(c.count,Math.min(g.start+g.count,d.start+d.count));for(let y=x,w=_;y<w;y+=3){const S=y,T=y+1,C=y+2;i=eo(this,f,t,n,l,u,h,S,T,C),i&&(i.faceIndex=Math.floor(y/3),i.face.materialIndex=g.materialIndex,e.push(i))}}else{const m=Math.max(0,d.start),v=Math.min(c.count,d.start+d.count);for(let g=m,f=v;g<f;g+=3){const x=g,_=g+1,y=g+2;i=eo(this,o,t,n,l,u,h,x,_,y),i&&(i.faceIndex=Math.floor(g/3),e.push(i))}}}}function Pf(s,t,e,n,i,r,o,a){let c;if(t.side===nn?c=n.intersectTriangle(o,r,i,!0,a):c=n.intersectTriangle(i,r,o,t.side===pi,a),c===null)return null;to.copy(a),to.applyMatrix4(s.matrixWorld);const l=e.ray.origin.distanceTo(to);return l<e.near||l>e.far?null:{distance:l,point:to.clone(),object:s}}function eo(s,t,e,n,i,r,o,a,c,l){s.getVertexPosition(a,$r),s.getVertexPosition(c,Kr),s.getVertexPosition(l,Jr);const u=Pf(s,t,e,n,$r,Kr,Jr,kl);if(u){const h=new A;En.getBarycoord(kl,$r,Kr,Jr,h),i&&(u.uv=En.getInterpolatedAttribute(i,a,c,l,h,new tt)),r&&(u.uv1=En.getInterpolatedAttribute(r,a,c,l,h,new tt)),o&&(u.normal=En.getInterpolatedAttribute(o,a,c,l,h,new A),u.normal.dot(n.direction)>0&&u.normal.multiplyScalar(-1));const p={a,b:c,c:l,normal:new A,materialIndex:0};En.getNormal($r,Kr,Jr,p.normal),u.face=p,u.barycoord=h}return u}class We extends me{constructor(t=1,e=1,n=1,i=1,r=1,o=1){super(),this.type="BoxGeometry",this.parameters={width:t,height:e,depth:n,widthSegments:i,heightSegments:r,depthSegments:o};const a=this;i=Math.floor(i),r=Math.floor(r),o=Math.floor(o);const c=[],l=[],u=[],h=[];let p=0,d=0;m("z","y","x",-1,-1,n,e,t,o,r,0),m("z","y","x",1,-1,n,e,-t,o,r,1),m("x","z","y",1,1,t,n,e,i,o,2),m("x","z","y",1,-1,t,n,-e,i,o,3),m("x","y","z",1,-1,t,e,n,i,r,4),m("x","y","z",-1,-1,t,e,-n,i,r,5),this.setIndex(c),this.setAttribute("position",new Gt(l,3)),this.setAttribute("normal",new Gt(u,3)),this.setAttribute("uv",new Gt(h,2));function m(v,g,f,x,_,y,w,S,T,C,b){const M=y/T,E=w/C,D=y/2,N=w/2,I=S/2,F=T+1,z=C+1;let X=0,k=0;const K=new A;for(let rt=0;rt<z;rt++){const Z=rt*E-N;for(let mt=0;mt<F;mt++){const Vt=mt*M-D;K[v]=Vt*x,K[g]=Z*_,K[f]=I,l.push(K.x,K.y,K.z),K[v]=0,K[g]=0,K[f]=S>0?1:-1,u.push(K.x,K.y,K.z),h.push(mt/T),h.push(1-rt/C),X+=1}}for(let rt=0;rt<C;rt++)for(let Z=0;Z<T;Z++){const mt=p+Z+F*rt,Vt=p+Z+F*(rt+1),Zt=p+(Z+1)+F*(rt+1),Kt=p+(Z+1)+F*rt;c.push(mt,Vt,Kt),c.push(Vt,Zt,Kt),k+=6}a.addGroup(d,k,b),d+=k,p+=X}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new We(t.width,t.height,t.depth,t.widthSegments,t.heightSegments,t.depthSegments)}}function Vs(s){const t={};for(const e in s){t[e]={};for(const n in s[e]){const i=s[e][n];i&&(i.isColor||i.isMatrix3||i.isMatrix4||i.isVector2||i.isVector3||i.isVector4||i.isTexture||i.isQuaternion)?i.isRenderTargetTexture?(console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),t[e][n]=null):t[e][n]=i.clone():Array.isArray(i)?t[e][n]=i.slice():t[e][n]=i}}return t}function tn(s){const t={};for(let e=0;e<s.length;e++){const n=Vs(s[e]);for(const i in n)t[i]=n[i]}return t}function Df(s){const t=[];for(let e=0;e<s.length;e++)t.push(s[e].clone());return t}function vu(s){const t=s.getRenderTarget();return t===null?s.outputColorSpace:t.isXRRenderTarget===!0?t.texture.colorSpace:fe.workingColorSpace}const Hs={clone:Vs,merge:tn};var If=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,Lf=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;class Be extends Li{constructor(t){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=If,this.fragmentShader=Lf,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,t!==void 0&&this.setValues(t)}copy(t){return super.copy(t),this.fragmentShader=t.fragmentShader,this.vertexShader=t.vertexShader,this.uniforms=Vs(t.uniforms),this.uniformsGroups=Df(t.uniformsGroups),this.defines=Object.assign({},t.defines),this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.fog=t.fog,this.lights=t.lights,this.clipping=t.clipping,this.extensions=Object.assign({},t.extensions),this.glslVersion=t.glslVersion,this}toJSON(t){const e=super.toJSON(t);e.glslVersion=this.glslVersion,e.uniforms={};for(const i in this.uniforms){const o=this.uniforms[i].value;o&&o.isTexture?e.uniforms[i]={type:"t",value:o.toJSON(t).uuid}:o&&o.isColor?e.uniforms[i]={type:"c",value:o.getHex()}:o&&o.isVector2?e.uniforms[i]={type:"v2",value:o.toArray()}:o&&o.isVector3?e.uniforms[i]={type:"v3",value:o.toArray()}:o&&o.isVector4?e.uniforms[i]={type:"v4",value:o.toArray()}:o&&o.isMatrix3?e.uniforms[i]={type:"m3",value:o.toArray()}:o&&o.isMatrix4?e.uniforms[i]={type:"m4",value:o.toArray()}:e.uniforms[i]={value:o}}Object.keys(this.defines).length>0&&(e.defines=this.defines),e.vertexShader=this.vertexShader,e.fragmentShader=this.fragmentShader,e.lights=this.lights,e.clipping=this.clipping;const n={};for(const i in this.extensions)this.extensions[i]===!0&&(n[i]=!0);return Object.keys(n).length>0&&(e.extensions=n),e}}class _u extends pe{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new Et,this.projectionMatrix=new Et,this.projectionMatrixInverse=new Et,this.coordinateSystem=zn,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(t,e){return super.copy(t,e),this.matrixWorldInverse.copy(t.matrixWorldInverse),this.projectionMatrix.copy(t.projectionMatrix),this.projectionMatrixInverse.copy(t.projectionMatrixInverse),this.coordinateSystem=t.coordinateSystem,this}getWorldDirection(t){return super.getWorldDirection(t).negate()}updateMatrixWorld(t){super.updateMatrixWorld(t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(t,e){super.updateWorldMatrix(t,e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}}const yi=new A,Vl=new tt,Hl=new tt;class ln extends _u{constructor(t=50,e=1,n=.1,i=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=t,this.zoom=1,this.near=n,this.far=i,this.focus=10,this.aspect=e,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.fov=t.fov,this.zoom=t.zoom,this.near=t.near,this.far=t.far,this.focus=t.focus,this.aspect=t.aspect,this.view=t.view===null?null:Object.assign({},t.view),this.filmGauge=t.filmGauge,this.filmOffset=t.filmOffset,this}setFocalLength(t){const e=.5*this.getFilmHeight()/t;this.fov=ks*2*Math.atan(e),this.updateProjectionMatrix()}getFocalLength(){const t=Math.tan(_r*.5*this.fov);return .5*this.getFilmHeight()/t}getEffectiveFOV(){return ks*2*Math.atan(Math.tan(_r*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(t,e,n){yi.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),e.set(yi.x,yi.y).multiplyScalar(-t/yi.z),yi.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(yi.x,yi.y).multiplyScalar(-t/yi.z)}getViewSize(t,e){return this.getViewBounds(t,Vl,Hl),e.subVectors(Hl,Vl)}setViewOffset(t,e,n,i,r,o){this.aspect=t/e,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=i,this.view.width=r,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const t=this.near;let e=t*Math.tan(_r*.5*this.fov)/this.zoom,n=2*e,i=this.aspect*n,r=-.5*i;const o=this.view;if(this.view!==null&&this.view.enabled){const c=o.fullWidth,l=o.fullHeight;r+=o.offsetX*i/c,e-=o.offsetY*n/l,i*=o.width/c,n*=o.height/l}const a=this.filmOffset;a!==0&&(r+=t*a/this.getFilmWidth()),this.projectionMatrix.makePerspective(r,r+i,e,e-n,t,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){const e=super.toJSON(t);return e.object.fov=this.fov,e.object.zoom=this.zoom,e.object.near=this.near,e.object.far=this.far,e.object.focus=this.focus,e.object.aspect=this.aspect,this.view!==null&&(e.object.view=Object.assign({},this.view)),e.object.filmGauge=this.filmGauge,e.object.filmOffset=this.filmOffset,e}}const _s=-90,xs=1;class Uf extends pe{constructor(t,e,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;const i=new ln(_s,xs,t,e);i.layers=this.layers,this.add(i);const r=new ln(_s,xs,t,e);r.layers=this.layers,this.add(r);const o=new ln(_s,xs,t,e);o.layers=this.layers,this.add(o);const a=new ln(_s,xs,t,e);a.layers=this.layers,this.add(a);const c=new ln(_s,xs,t,e);c.layers=this.layers,this.add(c);const l=new ln(_s,xs,t,e);l.layers=this.layers,this.add(l)}updateCoordinateSystem(){const t=this.coordinateSystem,e=this.children.concat(),[n,i,r,o,a,c]=e;for(const l of e)this.remove(l);if(t===zn)n.up.set(0,1,0),n.lookAt(1,0,0),i.up.set(0,1,0),i.lookAt(-1,0,0),r.up.set(0,0,-1),r.lookAt(0,1,0),o.up.set(0,0,1),o.lookAt(0,-1,0),a.up.set(0,1,0),a.lookAt(0,0,1),c.up.set(0,1,0),c.lookAt(0,0,-1);else if(t===zo)n.up.set(0,-1,0),n.lookAt(-1,0,0),i.up.set(0,-1,0),i.lookAt(1,0,0),r.up.set(0,0,1),r.lookAt(0,1,0),o.up.set(0,0,-1),o.lookAt(0,-1,0),a.up.set(0,-1,0),a.lookAt(0,0,1),c.up.set(0,-1,0),c.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+t);for(const l of e)this.add(l),l.updateMatrixWorld()}update(t,e){this.parent===null&&this.updateMatrixWorld();const{renderTarget:n,activeMipmapLevel:i}=this;this.coordinateSystem!==t.coordinateSystem&&(this.coordinateSystem=t.coordinateSystem,this.updateCoordinateSystem());const[r,o,a,c,l,u]=this.children,h=t.getRenderTarget(),p=t.getActiveCubeFace(),d=t.getActiveMipmapLevel(),m=t.xr.enabled;t.xr.enabled=!1;const v=n.texture.generateMipmaps;n.texture.generateMipmaps=!1,t.setRenderTarget(n,0,i),t.render(e,r),t.setRenderTarget(n,1,i),t.render(e,o),t.setRenderTarget(n,2,i),t.render(e,a),t.setRenderTarget(n,3,i),t.render(e,c),t.setRenderTarget(n,4,i),t.render(e,l),n.texture.generateMipmaps=v,t.setRenderTarget(n,5,i),t.render(e,u),t.setRenderTarget(h,p,d),t.xr.enabled=m,n.texture.needsPMREMUpdate=!0}}class xu extends qe{constructor(t=[],e=zs,n,i,r,o,a,c,l,u){super(t,e,n,i,r,o,a,c,l,u),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(t){this.image=t}}class Nf extends Rn{constructor(t=1,e={}){super(t,t,e),this.isWebGLCubeRenderTarget=!0;const n={width:t,height:t,depth:1},i=[n,n,n,n,n,n];this.texture=new xu(i),this._setTextureOptions(e),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(t,e){this.texture.type=e.type,this.texture.colorSpace=e.colorSpace,this.texture.generateMipmaps=e.generateMipmaps,this.texture.minFilter=e.minFilter,this.texture.magFilter=e.magFilter;const n={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},i=new We(5,5,5),r=new Be({name:"CubemapFromEquirect",uniforms:Vs(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:nn,blending:di});r.uniforms.tEquirect.value=e;const o=new ue(i,r),a=e.minFilter;return e.minFilter===Ji&&(e.minFilter=Kn),new Uf(1,10,this).update(t,o),e.minFilter=a,o.geometry.dispose(),o.material.dispose(),this}clear(t,e=!0,n=!0,i=!0){const r=t.getRenderTarget();for(let o=0;o<6;o++)t.setRenderTarget(this,o),t.clear(e,n,i);t.setRenderTarget(r)}}class Ne extends pe{constructor(){super(),this.isGroup=!0,this.type="Group"}}const Ff={type:"move"};class Ta{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new Ne,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new Ne,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new A,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new A),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new Ne,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new A,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new A),this._grip}dispatchEvent(t){return this._targetRay!==null&&this._targetRay.dispatchEvent(t),this._grip!==null&&this._grip.dispatchEvent(t),this._hand!==null&&this._hand.dispatchEvent(t),this}connect(t){if(t&&t.hand){const e=this._hand;if(e)for(const n of t.hand.values())this._getHandJoint(e,n)}return this.dispatchEvent({type:"connected",data:t}),this}disconnect(t){return this.dispatchEvent({type:"disconnected",data:t}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(t,e,n){let i=null,r=null,o=null;const a=this._targetRay,c=this._grip,l=this._hand;if(t&&e.session.visibilityState!=="visible-blurred"){if(l&&t.hand){o=!0;for(const v of t.hand.values()){const g=e.getJointPose(v,n),f=this._getHandJoint(l,v);g!==null&&(f.matrix.fromArray(g.transform.matrix),f.matrix.decompose(f.position,f.rotation,f.scale),f.matrixWorldNeedsUpdate=!0,f.jointRadius=g.radius),f.visible=g!==null}const u=l.joints["index-finger-tip"],h=l.joints["thumb-tip"],p=u.position.distanceTo(h.position),d=.02,m=.005;l.inputState.pinching&&p>d+m?(l.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:t.handedness,target:this})):!l.inputState.pinching&&p<=d-m&&(l.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:t.handedness,target:this}))}else c!==null&&t.gripSpace&&(r=e.getPose(t.gripSpace,n),r!==null&&(c.matrix.fromArray(r.transform.matrix),c.matrix.decompose(c.position,c.rotation,c.scale),c.matrixWorldNeedsUpdate=!0,r.linearVelocity?(c.hasLinearVelocity=!0,c.linearVelocity.copy(r.linearVelocity)):c.hasLinearVelocity=!1,r.angularVelocity?(c.hasAngularVelocity=!0,c.angularVelocity.copy(r.angularVelocity)):c.hasAngularVelocity=!1));a!==null&&(i=e.getPose(t.targetRaySpace,n),i===null&&r!==null&&(i=r),i!==null&&(a.matrix.fromArray(i.transform.matrix),a.matrix.decompose(a.position,a.rotation,a.scale),a.matrixWorldNeedsUpdate=!0,i.linearVelocity?(a.hasLinearVelocity=!0,a.linearVelocity.copy(i.linearVelocity)):a.hasLinearVelocity=!1,i.angularVelocity?(a.hasAngularVelocity=!0,a.angularVelocity.copy(i.angularVelocity)):a.hasAngularVelocity=!1,this.dispatchEvent(Ff)))}return a!==null&&(a.visible=i!==null),c!==null&&(c.visible=r!==null),l!==null&&(l.visible=o!==null),this}_getHandJoint(t,e){if(t.joints[e.jointName]===void 0){const n=new Ne;n.matrixAutoUpdate=!1,n.visible=!1,t.joints[e.jointName]=n,t.add(n)}return t.joints[e.jointName]}}class el{constructor(t,e=1,n=1e3){this.isFog=!0,this.name="",this.color=new lt(t),this.near=e,this.far=n}clone(){return new el(this.color,this.near,this.far)}toJSON(){return{type:"Fog",name:this.name,color:this.color.getHex(),near:this.near,far:this.far}}}class yu extends pe{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new Ye,this.environmentIntensity=1,this.environmentRotation=new Ye,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(t,e){return super.copy(t,e),t.background!==null&&(this.background=t.background.clone()),t.environment!==null&&(this.environment=t.environment.clone()),t.fog!==null&&(this.fog=t.fog.clone()),this.backgroundBlurriness=t.backgroundBlurriness,this.backgroundIntensity=t.backgroundIntensity,this.backgroundRotation.copy(t.backgroundRotation),this.environmentIntensity=t.environmentIntensity,this.environmentRotation.copy(t.environmentRotation),t.overrideMaterial!==null&&(this.overrideMaterial=t.overrideMaterial.clone()),this.matrixAutoUpdate=t.matrixAutoUpdate,this}toJSON(t){const e=super.toJSON(t);return this.fog!==null&&(e.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(e.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(e.object.backgroundIntensity=this.backgroundIntensity),e.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(e.object.environmentIntensity=this.environmentIntensity),e.object.environmentRotation=this.environmentRotation.toArray(),e}}class zf{constructor(t,e){this.isInterleavedBuffer=!0,this.array=t,this.stride=e,this.count=t!==void 0?t.length/e:0,this.usage=Fc,this.updateRanges=[],this.version=0,this.uuid=ti()}onUploadCallback(){}set needsUpdate(t){t===!0&&this.version++}setUsage(t){return this.usage=t,this}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.array=new t.array.constructor(t.array),this.count=t.count,this.stride=t.stride,this.usage=t.usage,this}copyAt(t,e,n){t*=this.stride,n*=e.stride;for(let i=0,r=this.stride;i<r;i++)this.array[t+i]=e.array[n+i];return this}set(t,e=0){return this.array.set(t,e),this}clone(t){t.arrayBuffers===void 0&&(t.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=ti()),t.arrayBuffers[this.array.buffer._uuid]===void 0&&(t.arrayBuffers[this.array.buffer._uuid]=this.array.slice(0).buffer);const e=new this.array.constructor(t.arrayBuffers[this.array.buffer._uuid]),n=new this.constructor(e,this.stride);return n.setUsage(this.usage),n}onUpload(t){return this.onUploadCallback=t,this}toJSON(t){return t.arrayBuffers===void 0&&(t.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=ti()),t.arrayBuffers[this.array.buffer._uuid]===void 0&&(t.arrayBuffers[this.array.buffer._uuid]=Array.from(new Uint32Array(this.array.buffer))),{uuid:this.uuid,buffer:this.array.buffer._uuid,type:this.array.constructor.name,stride:this.stride}}}const Qe=new A;class ko{constructor(t,e,n,i=!1){this.isInterleavedBufferAttribute=!0,this.name="",this.data=t,this.itemSize=e,this.offset=n,this.normalized=i}get count(){return this.data.count}get array(){return this.data.array}set needsUpdate(t){this.data.needsUpdate=t}applyMatrix4(t){for(let e=0,n=this.data.count;e<n;e++)Qe.fromBufferAttribute(this,e),Qe.applyMatrix4(t),this.setXYZ(e,Qe.x,Qe.y,Qe.z);return this}applyNormalMatrix(t){for(let e=0,n=this.count;e<n;e++)Qe.fromBufferAttribute(this,e),Qe.applyNormalMatrix(t),this.setXYZ(e,Qe.x,Qe.y,Qe.z);return this}transformDirection(t){for(let e=0,n=this.count;e<n;e++)Qe.fromBufferAttribute(this,e),Qe.transformDirection(t),this.setXYZ(e,Qe.x,Qe.y,Qe.z);return this}getComponent(t,e){let n=this.array[t*this.data.stride+this.offset+e];return this.normalized&&(n=Nn(n,this.array)),n}setComponent(t,e,n){return this.normalized&&(n=Me(n,this.array)),this.data.array[t*this.data.stride+this.offset+e]=n,this}setX(t,e){return this.normalized&&(e=Me(e,this.array)),this.data.array[t*this.data.stride+this.offset]=e,this}setY(t,e){return this.normalized&&(e=Me(e,this.array)),this.data.array[t*this.data.stride+this.offset+1]=e,this}setZ(t,e){return this.normalized&&(e=Me(e,this.array)),this.data.array[t*this.data.stride+this.offset+2]=e,this}setW(t,e){return this.normalized&&(e=Me(e,this.array)),this.data.array[t*this.data.stride+this.offset+3]=e,this}getX(t){let e=this.data.array[t*this.data.stride+this.offset];return this.normalized&&(e=Nn(e,this.array)),e}getY(t){let e=this.data.array[t*this.data.stride+this.offset+1];return this.normalized&&(e=Nn(e,this.array)),e}getZ(t){let e=this.data.array[t*this.data.stride+this.offset+2];return this.normalized&&(e=Nn(e,this.array)),e}getW(t){let e=this.data.array[t*this.data.stride+this.offset+3];return this.normalized&&(e=Nn(e,this.array)),e}setXY(t,e,n){return t=t*this.data.stride+this.offset,this.normalized&&(e=Me(e,this.array),n=Me(n,this.array)),this.data.array[t+0]=e,this.data.array[t+1]=n,this}setXYZ(t,e,n,i){return t=t*this.data.stride+this.offset,this.normalized&&(e=Me(e,this.array),n=Me(n,this.array),i=Me(i,this.array)),this.data.array[t+0]=e,this.data.array[t+1]=n,this.data.array[t+2]=i,this}setXYZW(t,e,n,i,r){return t=t*this.data.stride+this.offset,this.normalized&&(e=Me(e,this.array),n=Me(n,this.array),i=Me(i,this.array),r=Me(r,this.array)),this.data.array[t+0]=e,this.data.array[t+1]=n,this.data.array[t+2]=i,this.data.array[t+3]=r,this}clone(t){if(t===void 0){console.log("THREE.InterleavedBufferAttribute.clone(): Cloning an interleaved buffer attribute will de-interleave buffer data.");const e=[];for(let n=0;n<this.count;n++){const i=n*this.data.stride+this.offset;for(let r=0;r<this.itemSize;r++)e.push(this.data.array[i+r])}return new Ae(new this.array.constructor(e),this.itemSize,this.normalized)}else return t.interleavedBuffers===void 0&&(t.interleavedBuffers={}),t.interleavedBuffers[this.data.uuid]===void 0&&(t.interleavedBuffers[this.data.uuid]=this.data.clone(t)),new ko(t.interleavedBuffers[this.data.uuid],this.itemSize,this.offset,this.normalized)}toJSON(t){if(t===void 0){console.log("THREE.InterleavedBufferAttribute.toJSON(): Serializing an interleaved buffer attribute will de-interleave buffer data.");const e=[];for(let n=0;n<this.count;n++){const i=n*this.data.stride+this.offset;for(let r=0;r<this.itemSize;r++)e.push(this.data.array[i+r])}return{itemSize:this.itemSize,type:this.array.constructor.name,array:e,normalized:this.normalized}}else return t.interleavedBuffers===void 0&&(t.interleavedBuffers={}),t.interleavedBuffers[this.data.uuid]===void 0&&(t.interleavedBuffers[this.data.uuid]=this.data.toJSON(t)),{isInterleavedBufferAttribute:!0,itemSize:this.itemSize,data:this.data.uuid,offset:this.offset,normalized:this.normalized}}}class Mu extends Li{constructor(t){super(),this.isSpriteMaterial=!0,this.type="SpriteMaterial",this.color=new lt(16777215),this.map=null,this.alphaMap=null,this.rotation=0,this.sizeAttenuation=!0,this.transparent=!0,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.alphaMap=t.alphaMap,this.rotation=t.rotation,this.sizeAttenuation=t.sizeAttenuation,this.fog=t.fog,this}}let ys;const Js=new A,Ms=new A,bs=new A,Ss=new tt,Qs=new tt,bu=new Et,no=new A,tr=new A,io=new A,Gl=new tt,Ea=new tt,Wl=new tt;class Of extends pe{constructor(t=new Mu){if(super(),this.isSprite=!0,this.type="Sprite",ys===void 0){ys=new me;const e=new Float32Array([-.5,-.5,0,0,0,.5,-.5,0,1,0,.5,.5,0,1,1,-.5,.5,0,0,1]),n=new zf(e,5);ys.setIndex([0,1,2,0,2,3]),ys.setAttribute("position",new ko(n,3,0,!1)),ys.setAttribute("uv",new ko(n,2,3,!1))}this.geometry=ys,this.material=t,this.center=new tt(.5,.5),this.count=1}raycast(t,e){t.camera===null&&console.error('THREE.Sprite: "Raycaster.camera" needs to be set in order to raycast against sprites.'),Ms.setFromMatrixScale(this.matrixWorld),bu.copy(t.camera.matrixWorld),this.modelViewMatrix.multiplyMatrices(t.camera.matrixWorldInverse,this.matrixWorld),bs.setFromMatrixPosition(this.modelViewMatrix),t.camera.isPerspectiveCamera&&this.material.sizeAttenuation===!1&&Ms.multiplyScalar(-bs.z);const n=this.material.rotation;let i,r;n!==0&&(r=Math.cos(n),i=Math.sin(n));const o=this.center;so(no.set(-.5,-.5,0),bs,o,Ms,i,r),so(tr.set(.5,-.5,0),bs,o,Ms,i,r),so(io.set(.5,.5,0),bs,o,Ms,i,r),Gl.set(0,0),Ea.set(1,0),Wl.set(1,1);let a=t.ray.intersectTriangle(no,tr,io,!1,Js);if(a===null&&(so(tr.set(-.5,.5,0),bs,o,Ms,i,r),Ea.set(0,1),a=t.ray.intersectTriangle(no,io,tr,!1,Js),a===null))return;const c=t.ray.origin.distanceTo(Js);c<t.near||c>t.far||e.push({distance:c,point:Js.clone(),uv:En.getInterpolation(Js,no,tr,io,Gl,Ea,Wl,new tt),face:null,object:this})}copy(t,e){return super.copy(t,e),t.center!==void 0&&this.center.copy(t.center),this.material=t.material,this}}function so(s,t,e,n,i,r){Ss.subVectors(s,e).addScalar(.5).multiply(n),i!==void 0?(Qs.x=r*Ss.x-i*Ss.y,Qs.y=i*Ss.x+r*Ss.y):Qs.copy(Ss),s.copy(t),s.x+=Qs.x,s.y+=Qs.y,s.applyMatrix4(bu)}class Po extends qe{constructor(t=null,e=1,n=1,i,r,o,a,c,l=yn,u=yn,h,p){super(null,o,a,c,l,u,i,r,h,p),this.isDataTexture=!0,this.image={data:t,width:e,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class ts extends Ae{constructor(t,e,n,i=1){super(t,e,n),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=i}copy(t){return super.copy(t),this.meshPerAttribute=t.meshPerAttribute,this}toJSON(){const t=super.toJSON();return t.meshPerAttribute=this.meshPerAttribute,t.isInstancedBufferAttribute=!0,t}}const ws=new Et,Xl=new Et,ro=[],ql=new On,Bf=new Et,er=new ue,nr=new Bn;class sn extends ue{constructor(t,e,n){super(t,e),this.isInstancedMesh=!0,this.instanceMatrix=new ts(new Float32Array(n*16),16),this.instanceColor=null,this.morphTexture=null,this.count=n,this.boundingBox=null,this.boundingSphere=null;for(let i=0;i<n;i++)this.setMatrixAt(i,Bf)}computeBoundingBox(){const t=this.geometry,e=this.count;this.boundingBox===null&&(this.boundingBox=new On),t.boundingBox===null&&t.computeBoundingBox(),this.boundingBox.makeEmpty();for(let n=0;n<e;n++)this.getMatrixAt(n,ws),ql.copy(t.boundingBox).applyMatrix4(ws),this.boundingBox.union(ql)}computeBoundingSphere(){const t=this.geometry,e=this.count;this.boundingSphere===null&&(this.boundingSphere=new Bn),t.boundingSphere===null&&t.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let n=0;n<e;n++)this.getMatrixAt(n,ws),nr.copy(t.boundingSphere).applyMatrix4(ws),this.boundingSphere.union(nr)}copy(t,e){return super.copy(t,e),this.instanceMatrix.copy(t.instanceMatrix),t.morphTexture!==null&&(this.morphTexture=t.morphTexture.clone()),t.instanceColor!==null&&(this.instanceColor=t.instanceColor.clone()),this.count=t.count,t.boundingBox!==null&&(this.boundingBox=t.boundingBox.clone()),t.boundingSphere!==null&&(this.boundingSphere=t.boundingSphere.clone()),this}getColorAt(t,e){e.fromArray(this.instanceColor.array,t*3)}getMatrixAt(t,e){e.fromArray(this.instanceMatrix.array,t*16)}getMorphAt(t,e){const n=e.morphTargetInfluences,i=this.morphTexture.source.data.data,r=n.length+1,o=t*r+1;for(let a=0;a<n.length;a++)n[a]=i[o+a]}raycast(t,e){const n=this.matrixWorld,i=this.count;if(er.geometry=this.geometry,er.material=this.material,er.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),nr.copy(this.boundingSphere),nr.applyMatrix4(n),t.ray.intersectsSphere(nr)!==!1))for(let r=0;r<i;r++){this.getMatrixAt(r,ws),Xl.multiplyMatrices(n,ws),er.matrixWorld=Xl,er.raycast(t,ro);for(let o=0,a=ro.length;o<a;o++){const c=ro[o];c.instanceId=r,c.object=this,e.push(c)}ro.length=0}}setColorAt(t,e){this.instanceColor===null&&(this.instanceColor=new ts(new Float32Array(this.instanceMatrix.count*3).fill(1),3)),e.toArray(this.instanceColor.array,t*3)}setMatrixAt(t,e){e.toArray(this.instanceMatrix.array,t*16)}setMorphAt(t,e){const n=e.morphTargetInfluences,i=n.length+1;this.morphTexture===null&&(this.morphTexture=new Po(new Float32Array(i*this.count),i,this.count,Zc,An));const r=this.morphTexture.source.data.data;let o=0;for(let l=0;l<n.length;l++)o+=n[l];const a=this.geometry.morphTargetsRelative?1:1-o,c=i*t;r[c]=a,r.set(n,c+1)}updateMorphTargets(){}dispose(){this.dispatchEvent({type:"dispose"}),this.morphTexture!==null&&(this.morphTexture.dispose(),this.morphTexture=null)}}const Aa=new A,kf=new A,Vf=new ne;class wi{constructor(t=new A(1,0,0),e=0){this.isPlane=!0,this.normal=t,this.constant=e}set(t,e){return this.normal.copy(t),this.constant=e,this}setComponents(t,e,n,i){return this.normal.set(t,e,n),this.constant=i,this}setFromNormalAndCoplanarPoint(t,e){return this.normal.copy(t),this.constant=-e.dot(this.normal),this}setFromCoplanarPoints(t,e,n){const i=Aa.subVectors(n,e).cross(kf.subVectors(t,e)).normalize();return this.setFromNormalAndCoplanarPoint(i,t),this}copy(t){return this.normal.copy(t.normal),this.constant=t.constant,this}normalize(){const t=1/this.normal.length();return this.normal.multiplyScalar(t),this.constant*=t,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(t){return this.normal.dot(t)+this.constant}distanceToSphere(t){return this.distanceToPoint(t.center)-t.radius}projectPoint(t,e){return e.copy(t).addScaledVector(this.normal,-this.distanceToPoint(t))}intersectLine(t,e){const n=t.delta(Aa),i=this.normal.dot(n);if(i===0)return this.distanceToPoint(t.start)===0?e.copy(t.start):null;const r=-(t.start.dot(this.normal)+this.constant)/i;return r<0||r>1?null:e.copy(t.start).addScaledVector(n,r)}intersectsLine(t){const e=this.distanceToPoint(t.start),n=this.distanceToPoint(t.end);return e<0&&n>0||n<0&&e>0}intersectsBox(t){return t.intersectsPlane(this)}intersectsSphere(t){return t.intersectsPlane(this)}coplanarPoint(t){return t.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(t,e){const n=e||Vf.getNormalMatrix(t),i=this.coplanarPoint(Aa).applyMatrix4(t),r=this.normal.applyMatrix3(n).normalize();return this.constant=-i.dot(r),this}translate(t){return this.constant-=t.dot(this.normal),this}equals(t){return t.normal.equals(this.normal)&&t.constant===this.constant}clone(){return new this.constructor().copy(this)}}const ki=new Bn,Hf=new tt(.5,.5),oo=new A;class Lr{constructor(t=new wi,e=new wi,n=new wi,i=new wi,r=new wi,o=new wi){this.planes=[t,e,n,i,r,o]}set(t,e,n,i,r,o){const a=this.planes;return a[0].copy(t),a[1].copy(e),a[2].copy(n),a[3].copy(i),a[4].copy(r),a[5].copy(o),this}copy(t){const e=this.planes;for(let n=0;n<6;n++)e[n].copy(t.planes[n]);return this}setFromProjectionMatrix(t,e=zn,n=!1){const i=this.planes,r=t.elements,o=r[0],a=r[1],c=r[2],l=r[3],u=r[4],h=r[5],p=r[6],d=r[7],m=r[8],v=r[9],g=r[10],f=r[11],x=r[12],_=r[13],y=r[14],w=r[15];if(i[0].setComponents(l-o,d-u,f-m,w-x).normalize(),i[1].setComponents(l+o,d+u,f+m,w+x).normalize(),i[2].setComponents(l+a,d+h,f+v,w+_).normalize(),i[3].setComponents(l-a,d-h,f-v,w-_).normalize(),n)i[4].setComponents(c,p,g,y).normalize(),i[5].setComponents(l-c,d-p,f-g,w-y).normalize();else if(i[4].setComponents(l-c,d-p,f-g,w-y).normalize(),e===zn)i[5].setComponents(l+c,d+p,f+g,w+y).normalize();else if(e===zo)i[5].setComponents(c,p,g,y).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+e);return this}intersectsObject(t){if(t.boundingSphere!==void 0)t.boundingSphere===null&&t.computeBoundingSphere(),ki.copy(t.boundingSphere).applyMatrix4(t.matrixWorld);else{const e=t.geometry;e.boundingSphere===null&&e.computeBoundingSphere(),ki.copy(e.boundingSphere).applyMatrix4(t.matrixWorld)}return this.intersectsSphere(ki)}intersectsSprite(t){ki.center.set(0,0,0);const e=Hf.distanceTo(t.center);return ki.radius=.7071067811865476+e,ki.applyMatrix4(t.matrixWorld),this.intersectsSphere(ki)}intersectsSphere(t){const e=this.planes,n=t.center,i=-t.radius;for(let r=0;r<6;r++)if(e[r].distanceToPoint(n)<i)return!1;return!0}intersectsBox(t){const e=this.planes;for(let n=0;n<6;n++){const i=e[n];if(oo.x=i.normal.x>0?t.max.x:t.min.x,oo.y=i.normal.y>0?t.max.y:t.min.y,oo.z=i.normal.z>0?t.max.z:t.min.z,i.distanceToPoint(oo)<0)return!1}return!0}containsPoint(t){const e=this.planes;for(let n=0;n<6;n++)if(e[n].distanceToPoint(t)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}const Wn=new Et,Xn=new Lr;class nl{constructor(){this.coordinateSystem=zn}intersectsObject(t,e){if(!e.isArrayCamera||e.cameras.length===0)return!1;for(let n=0;n<e.cameras.length;n++){const i=e.cameras[n];if(Wn.multiplyMatrices(i.projectionMatrix,i.matrixWorldInverse),Xn.setFromProjectionMatrix(Wn,i.coordinateSystem,i.reversedDepth),Xn.intersectsObject(t))return!0}return!1}intersectsSprite(t,e){if(!e||!e.cameras||e.cameras.length===0)return!1;for(let n=0;n<e.cameras.length;n++){const i=e.cameras[n];if(Wn.multiplyMatrices(i.projectionMatrix,i.matrixWorldInverse),Xn.setFromProjectionMatrix(Wn,i.coordinateSystem,i.reversedDepth),Xn.intersectsSprite(t))return!0}return!1}intersectsSphere(t,e){if(!e||!e.cameras||e.cameras.length===0)return!1;for(let n=0;n<e.cameras.length;n++){const i=e.cameras[n];if(Wn.multiplyMatrices(i.projectionMatrix,i.matrixWorldInverse),Xn.setFromProjectionMatrix(Wn,i.coordinateSystem,i.reversedDepth),Xn.intersectsSphere(t))return!0}return!1}intersectsBox(t,e){if(!e||!e.cameras||e.cameras.length===0)return!1;for(let n=0;n<e.cameras.length;n++){const i=e.cameras[n];if(Wn.multiplyMatrices(i.projectionMatrix,i.matrixWorldInverse),Xn.setFromProjectionMatrix(Wn,i.coordinateSystem,i.reversedDepth),Xn.intersectsBox(t))return!0}return!1}containsPoint(t,e){if(!e||!e.cameras||e.cameras.length===0)return!1;for(let n=0;n<e.cameras.length;n++){const i=e.cameras[n];if(Wn.multiplyMatrices(i.projectionMatrix,i.matrixWorldInverse),Xn.setFromProjectionMatrix(Wn,i.coordinateSystem,i.reversedDepth),Xn.containsPoint(t))return!0}return!1}clone(){return new nl}}function Ra(s,t){return s-t}function Gf(s,t){return s.z-t.z}function Wf(s,t){return t.z-s.z}class Xf{constructor(){this.index=0,this.pool=[],this.list=[]}push(t,e,n,i){const r=this.pool,o=this.list;this.index>=r.length&&r.push({start:-1,count:-1,z:-1,index:-1});const a=r[this.index];o.push(a),this.index++,a.start=t,a.count=e,a.z=n,a.index=i}reset(){this.list.length=0,this.index=0}}const on=new Et,qf=new lt(1,1,1),Yl=new Lr,Yf=new nl,ao=new On,Vi=new Bn,ir=new A,Zl=new A,Zf=new A,Ca=new Xf,$e=new ue,co=[];function jf(s,t,e=0){const n=t.itemSize;if(s.isInterleavedBufferAttribute||s.array.constructor!==t.array.constructor){const i=s.count;for(let r=0;r<i;r++)for(let o=0;o<n;o++)t.setComponent(r+e,o,s.getComponent(r,o))}else t.array.set(s.array,e*n);t.needsUpdate=!0}function Hi(s,t){if(s.constructor!==t.constructor){const e=Math.min(s.length,t.length);for(let n=0;n<e;n++)t[n]=s[n]}else{const e=Math.min(s.length,t.length);t.set(new s.constructor(s.buffer,0,e))}}class $f extends ue{constructor(t,e,n=e*2,i){super(new me,i),this.isBatchedMesh=!0,this.perObjectFrustumCulled=!0,this.sortObjects=!0,this.boundingBox=null,this.boundingSphere=null,this.customSort=null,this._instanceInfo=[],this._geometryInfo=[],this._availableInstanceIds=[],this._availableGeometryIds=[],this._nextIndexStart=0,this._nextVertexStart=0,this._geometryCount=0,this._visibilityChanged=!0,this._geometryInitialized=!1,this._maxInstanceCount=t,this._maxVertexCount=e,this._maxIndexCount=n,this._multiDrawCounts=new Int32Array(t),this._multiDrawStarts=new Int32Array(t),this._multiDrawCount=0,this._multiDrawInstances=null,this._matricesTexture=null,this._indirectTexture=null,this._colorsTexture=null,this._initMatricesTexture(),this._initIndirectTexture()}get maxInstanceCount(){return this._maxInstanceCount}get instanceCount(){return this._instanceInfo.length-this._availableInstanceIds.length}get unusedVertexCount(){return this._maxVertexCount-this._nextVertexStart}get unusedIndexCount(){return this._maxIndexCount-this._nextIndexStart}_initMatricesTexture(){let t=Math.sqrt(this._maxInstanceCount*4);t=Math.ceil(t/4)*4,t=Math.max(t,4);const e=new Float32Array(t*t*4),n=new Po(e,t,t,_n,An);this._matricesTexture=n}_initIndirectTexture(){let t=Math.sqrt(this._maxInstanceCount);t=Math.ceil(t);const e=new Uint32Array(t*t),n=new Po(e,t,t,Yo,Pi);this._indirectTexture=n}_initColorsTexture(){let t=Math.sqrt(this._maxInstanceCount);t=Math.ceil(t);const e=new Float32Array(t*t*4).fill(1),n=new Po(e,t,t,_n,An);n.colorSpace=fe.workingColorSpace,this._colorsTexture=n}_initializeGeometry(t){const e=this.geometry,n=this._maxVertexCount,i=this._maxIndexCount;if(this._geometryInitialized===!1){for(const r in t.attributes){const o=t.getAttribute(r),{array:a,itemSize:c,normalized:l}=o,u=new a.constructor(n*c),h=new Ae(u,c,l);e.setAttribute(r,h)}if(t.getIndex()!==null){const r=n>65535?new Uint32Array(i):new Uint16Array(i);e.setIndex(new Ae(r,1))}this._geometryInitialized=!0}}_validateGeometry(t){const e=this.geometry;if(!!t.getIndex()!=!!e.getIndex())throw new Error('THREE.BatchedMesh: All geometries must consistently have "index".');for(const n in e.attributes){if(!t.hasAttribute(n))throw new Error(`THREE.BatchedMesh: Added geometry missing "${n}". All geometries must have consistent attributes.`);const i=t.getAttribute(n),r=e.getAttribute(n);if(i.itemSize!==r.itemSize||i.normalized!==r.normalized)throw new Error("THREE.BatchedMesh: All attributes must have a consistent itemSize and normalized value.")}}validateInstanceId(t){const e=this._instanceInfo;if(t<0||t>=e.length||e[t].active===!1)throw new Error(`THREE.BatchedMesh: Invalid instanceId ${t}. Instance is either out of range or has been deleted.`)}validateGeometryId(t){const e=this._geometryInfo;if(t<0||t>=e.length||e[t].active===!1)throw new Error(`THREE.BatchedMesh: Invalid geometryId ${t}. Geometry is either out of range or has been deleted.`)}setCustomSort(t){return this.customSort=t,this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new On);const t=this.boundingBox,e=this._instanceInfo;t.makeEmpty();for(let n=0,i=e.length;n<i;n++){if(e[n].active===!1)continue;const r=e[n].geometryIndex;this.getMatrixAt(n,on),this.getBoundingBoxAt(r,ao).applyMatrix4(on),t.union(ao)}}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Bn);const t=this.boundingSphere,e=this._instanceInfo;t.makeEmpty();for(let n=0,i=e.length;n<i;n++){if(e[n].active===!1)continue;const r=e[n].geometryIndex;this.getMatrixAt(n,on),this.getBoundingSphereAt(r,Vi).applyMatrix4(on),t.union(Vi)}}addInstance(t){if(this._instanceInfo.length>=this.maxInstanceCount&&this._availableInstanceIds.length===0)throw new Error("THREE.BatchedMesh: Maximum item count reached.");const n={visible:!0,active:!0,geometryIndex:t};let i=null;this._availableInstanceIds.length>0?(this._availableInstanceIds.sort(Ra),i=this._availableInstanceIds.shift(),this._instanceInfo[i]=n):(i=this._instanceInfo.length,this._instanceInfo.push(n));const r=this._matricesTexture;on.identity().toArray(r.image.data,i*16),r.needsUpdate=!0;const o=this._colorsTexture;return o&&(qf.toArray(o.image.data,i*4),o.needsUpdate=!0),this._visibilityChanged=!0,i}addGeometry(t,e=-1,n=-1){this._initializeGeometry(t),this._validateGeometry(t);const i={vertexStart:-1,vertexCount:-1,reservedVertexCount:-1,indexStart:-1,indexCount:-1,reservedIndexCount:-1,start:-1,count:-1,boundingBox:null,boundingSphere:null,active:!0},r=this._geometryInfo;i.vertexStart=this._nextVertexStart,i.reservedVertexCount=e===-1?t.getAttribute("position").count:e;const o=t.getIndex();if(o!==null&&(i.indexStart=this._nextIndexStart,i.reservedIndexCount=n===-1?o.count:n),i.indexStart!==-1&&i.indexStart+i.reservedIndexCount>this._maxIndexCount||i.vertexStart+i.reservedVertexCount>this._maxVertexCount)throw new Error("THREE.BatchedMesh: Reserved space request exceeds the maximum buffer size.");let c;return this._availableGeometryIds.length>0?(this._availableGeometryIds.sort(Ra),c=this._availableGeometryIds.shift(),r[c]=i):(c=this._geometryCount,this._geometryCount++,r.push(i)),this.setGeometryAt(c,t),this._nextIndexStart=i.indexStart+i.reservedIndexCount,this._nextVertexStart=i.vertexStart+i.reservedVertexCount,c}setGeometryAt(t,e){if(t>=this._geometryCount)throw new Error("THREE.BatchedMesh: Maximum geometry count reached.");this._validateGeometry(e);const n=this.geometry,i=n.getIndex()!==null,r=n.getIndex(),o=e.getIndex(),a=this._geometryInfo[t];if(i&&o.count>a.reservedIndexCount||e.attributes.position.count>a.reservedVertexCount)throw new Error("THREE.BatchedMesh: Reserved space not large enough for provided geometry.");const c=a.vertexStart,l=a.reservedVertexCount;a.vertexCount=e.getAttribute("position").count;for(const u in n.attributes){const h=e.getAttribute(u),p=n.getAttribute(u);jf(h,p,c);const d=h.itemSize;for(let m=h.count,v=l;m<v;m++){const g=c+m;for(let f=0;f<d;f++)p.setComponent(g,f,0)}p.needsUpdate=!0,p.addUpdateRange(c*d,l*d)}if(i){const u=a.indexStart,h=a.reservedIndexCount;a.indexCount=e.getIndex().count;for(let p=0;p<o.count;p++)r.setX(u+p,c+o.getX(p));for(let p=o.count,d=h;p<d;p++)r.setX(u+p,c);r.needsUpdate=!0,r.addUpdateRange(u,a.reservedIndexCount)}return a.start=i?a.indexStart:a.vertexStart,a.count=i?a.indexCount:a.vertexCount,a.boundingBox=null,e.boundingBox!==null&&(a.boundingBox=e.boundingBox.clone()),a.boundingSphere=null,e.boundingSphere!==null&&(a.boundingSphere=e.boundingSphere.clone()),this._visibilityChanged=!0,t}deleteGeometry(t){const e=this._geometryInfo;if(t>=e.length||e[t].active===!1)return this;const n=this._instanceInfo;for(let i=0,r=n.length;i<r;i++)n[i].active&&n[i].geometryIndex===t&&this.deleteInstance(i);return e[t].active=!1,this._availableGeometryIds.push(t),this._visibilityChanged=!0,this}deleteInstance(t){return this.validateInstanceId(t),this._instanceInfo[t].active=!1,this._availableInstanceIds.push(t),this._visibilityChanged=!0,this}optimize(){let t=0,e=0;const n=this._geometryInfo,i=n.map((o,a)=>a).sort((o,a)=>n[o].vertexStart-n[a].vertexStart),r=this.geometry;for(let o=0,a=n.length;o<a;o++){const c=i[o],l=n[c];if(l.active!==!1){if(r.index!==null){if(l.indexStart!==e){const{indexStart:u,vertexStart:h,reservedIndexCount:p}=l,d=r.index,m=d.array,v=t-h;for(let g=u;g<u+p;g++)m[g]=m[g]+v;d.array.copyWithin(e,u,u+p),d.addUpdateRange(e,p),l.indexStart=e}e+=l.reservedIndexCount}if(l.vertexStart!==t){const{vertexStart:u,reservedVertexCount:h}=l,p=r.attributes;for(const d in p){const m=p[d],{array:v,itemSize:g}=m;v.copyWithin(t*g,u*g,(u+h)*g),m.addUpdateRange(t*g,h*g)}l.vertexStart=t}t+=l.reservedVertexCount,l.start=r.index?l.indexStart:l.vertexStart,this._nextIndexStart=r.index?l.indexStart+l.reservedIndexCount:0,this._nextVertexStart=l.vertexStart+l.reservedVertexCount}}return this}getBoundingBoxAt(t,e){if(t>=this._geometryCount)return null;const n=this.geometry,i=this._geometryInfo[t];if(i.boundingBox===null){const r=new On,o=n.index,a=n.attributes.position;for(let c=i.start,l=i.start+i.count;c<l;c++){let u=c;o&&(u=o.getX(u)),r.expandByPoint(ir.fromBufferAttribute(a,u))}i.boundingBox=r}return e.copy(i.boundingBox),e}getBoundingSphereAt(t,e){if(t>=this._geometryCount)return null;const n=this.geometry,i=this._geometryInfo[t];if(i.boundingSphere===null){const r=new Bn;this.getBoundingBoxAt(t,ao),ao.getCenter(r.center);const o=n.index,a=n.attributes.position;let c=0;for(let l=i.start,u=i.start+i.count;l<u;l++){let h=l;o&&(h=o.getX(h)),ir.fromBufferAttribute(a,h),c=Math.max(c,r.center.distanceToSquared(ir))}r.radius=Math.sqrt(c),i.boundingSphere=r}return e.copy(i.boundingSphere),e}setMatrixAt(t,e){this.validateInstanceId(t);const n=this._matricesTexture,i=this._matricesTexture.image.data;return e.toArray(i,t*16),n.needsUpdate=!0,this}getMatrixAt(t,e){return this.validateInstanceId(t),e.fromArray(this._matricesTexture.image.data,t*16)}setColorAt(t,e){return this.validateInstanceId(t),this._colorsTexture===null&&this._initColorsTexture(),e.toArray(this._colorsTexture.image.data,t*4),this._colorsTexture.needsUpdate=!0,this}getColorAt(t,e){return this.validateInstanceId(t),e.fromArray(this._colorsTexture.image.data,t*4)}setVisibleAt(t,e){return this.validateInstanceId(t),this._instanceInfo[t].visible===e?this:(this._instanceInfo[t].visible=e,this._visibilityChanged=!0,this)}getVisibleAt(t){return this.validateInstanceId(t),this._instanceInfo[t].visible}setGeometryIdAt(t,e){return this.validateInstanceId(t),this.validateGeometryId(e),this._instanceInfo[t].geometryIndex=e,this}getGeometryIdAt(t){return this.validateInstanceId(t),this._instanceInfo[t].geometryIndex}getGeometryRangeAt(t,e={}){this.validateGeometryId(t);const n=this._geometryInfo[t];return e.vertexStart=n.vertexStart,e.vertexCount=n.vertexCount,e.reservedVertexCount=n.reservedVertexCount,e.indexStart=n.indexStart,e.indexCount=n.indexCount,e.reservedIndexCount=n.reservedIndexCount,e.start=n.start,e.count=n.count,e}setInstanceCount(t){const e=this._availableInstanceIds,n=this._instanceInfo;for(e.sort(Ra);e[e.length-1]===n.length-1;)n.pop(),e.pop();if(t<n.length)throw new Error(`BatchedMesh: Instance ids outside the range ${t} are being used. Cannot shrink instance count.`);const i=new Int32Array(t),r=new Int32Array(t);Hi(this._multiDrawCounts,i),Hi(this._multiDrawStarts,r),this._multiDrawCounts=i,this._multiDrawStarts=r,this._maxInstanceCount=t;const o=this._indirectTexture,a=this._matricesTexture,c=this._colorsTexture;o.dispose(),this._initIndirectTexture(),Hi(o.image.data,this._indirectTexture.image.data),a.dispose(),this._initMatricesTexture(),Hi(a.image.data,this._matricesTexture.image.data),c&&(c.dispose(),this._initColorsTexture(),Hi(c.image.data,this._colorsTexture.image.data))}setGeometrySize(t,e){const n=[...this._geometryInfo].filter(a=>a.active);if(Math.max(...n.map(a=>a.vertexStart+a.reservedVertexCount))>t)throw new Error(`BatchedMesh: Geometry vertex values are being used outside the range ${e}. Cannot shrink further.`);if(this.geometry.index&&Math.max(...n.map(c=>c.indexStart+c.reservedIndexCount))>e)throw new Error(`BatchedMesh: Geometry index values are being used outside the range ${e}. Cannot shrink further.`);const r=this.geometry;r.dispose(),this._maxVertexCount=t,this._maxIndexCount=e,this._geometryInitialized&&(this._geometryInitialized=!1,this.geometry=new me,this._initializeGeometry(r));const o=this.geometry;r.index&&Hi(r.index.array,o.index.array);for(const a in r.attributes)Hi(r.attributes[a].array,o.attributes[a].array)}raycast(t,e){const n=this._instanceInfo,i=this._geometryInfo,r=this.matrixWorld,o=this.geometry;$e.material=this.material,$e.geometry.index=o.index,$e.geometry.attributes=o.attributes,$e.geometry.boundingBox===null&&($e.geometry.boundingBox=new On),$e.geometry.boundingSphere===null&&($e.geometry.boundingSphere=new Bn);for(let a=0,c=n.length;a<c;a++){if(!n[a].visible||!n[a].active)continue;const l=n[a].geometryIndex,u=i[l];$e.geometry.setDrawRange(u.start,u.count),this.getMatrixAt(a,$e.matrixWorld).premultiply(r),this.getBoundingBoxAt(l,$e.geometry.boundingBox),this.getBoundingSphereAt(l,$e.geometry.boundingSphere),$e.raycast(t,co);for(let h=0,p=co.length;h<p;h++){const d=co[h];d.object=this,d.batchId=a,e.push(d)}co.length=0}$e.material=null,$e.geometry.index=null,$e.geometry.attributes={},$e.geometry.setDrawRange(0,1/0)}copy(t){return super.copy(t),this.geometry=t.geometry.clone(),this.perObjectFrustumCulled=t.perObjectFrustumCulled,this.sortObjects=t.sortObjects,this.boundingBox=t.boundingBox!==null?t.boundingBox.clone():null,this.boundingSphere=t.boundingSphere!==null?t.boundingSphere.clone():null,this._geometryInfo=t._geometryInfo.map(e=>({...e,boundingBox:e.boundingBox!==null?e.boundingBox.clone():null,boundingSphere:e.boundingSphere!==null?e.boundingSphere.clone():null})),this._instanceInfo=t._instanceInfo.map(e=>({...e})),this._availableInstanceIds=t._availableInstanceIds.slice(),this._availableGeometryIds=t._availableGeometryIds.slice(),this._nextIndexStart=t._nextIndexStart,this._nextVertexStart=t._nextVertexStart,this._geometryCount=t._geometryCount,this._maxInstanceCount=t._maxInstanceCount,this._maxVertexCount=t._maxVertexCount,this._maxIndexCount=t._maxIndexCount,this._geometryInitialized=t._geometryInitialized,this._multiDrawCounts=t._multiDrawCounts.slice(),this._multiDrawStarts=t._multiDrawStarts.slice(),this._indirectTexture=t._indirectTexture.clone(),this._indirectTexture.image.data=this._indirectTexture.image.data.slice(),this._matricesTexture=t._matricesTexture.clone(),this._matricesTexture.image.data=this._matricesTexture.image.data.slice(),this._colorsTexture!==null&&(this._colorsTexture=t._colorsTexture.clone(),this._colorsTexture.image.data=this._colorsTexture.image.data.slice()),this}dispose(){this.geometry.dispose(),this._matricesTexture.dispose(),this._matricesTexture=null,this._indirectTexture.dispose(),this._indirectTexture=null,this._colorsTexture!==null&&(this._colorsTexture.dispose(),this._colorsTexture=null)}onBeforeRender(t,e,n,i,r){if(!this._visibilityChanged&&!this.perObjectFrustumCulled&&!this.sortObjects)return;const o=i.getIndex(),a=o===null?1:o.array.BYTES_PER_ELEMENT,c=this._instanceInfo,l=this._multiDrawStarts,u=this._multiDrawCounts,h=this._geometryInfo,p=this.perObjectFrustumCulled,d=this._indirectTexture,m=d.image.data,v=n.isArrayCamera?Yf:Yl;p&&!n.isArrayCamera&&(on.multiplyMatrices(n.projectionMatrix,n.matrixWorldInverse).multiply(this.matrixWorld),Yl.setFromProjectionMatrix(on,n.coordinateSystem,n.reversedDepth));let g=0;if(this.sortObjects){on.copy(this.matrixWorld).invert(),ir.setFromMatrixPosition(n.matrixWorld).applyMatrix4(on),Zl.set(0,0,-1).transformDirection(n.matrixWorld).transformDirection(on);for(let _=0,y=c.length;_<y;_++)if(c[_].visible&&c[_].active){const w=c[_].geometryIndex;this.getMatrixAt(_,on),this.getBoundingSphereAt(w,Vi).applyMatrix4(on);let S=!1;if(p&&(S=!v.intersectsSphere(Vi,n)),!S){const T=h[w],C=Zf.subVectors(Vi.center,ir).dot(Zl);Ca.push(T.start,T.count,C,_)}}const f=Ca.list,x=this.customSort;x===null?f.sort(r.transparent?Wf:Gf):x.call(this,f,n);for(let _=0,y=f.length;_<y;_++){const w=f[_];l[g]=w.start*a,u[g]=w.count,m[g]=w.index,g++}Ca.reset()}else for(let f=0,x=c.length;f<x;f++)if(c[f].visible&&c[f].active){const _=c[f].geometryIndex;let y=!1;if(p&&(this.getMatrixAt(f,on),this.getBoundingSphereAt(_,Vi).applyMatrix4(on),y=!v.intersectsSphere(Vi,n)),!y){const w=h[_];l[g]=w.start*a,u[g]=w.count,m[g]=f,g++}}d.needsUpdate=!0,this._multiDrawCount=g,this._visibilityChanged=!1}onBeforeShadow(t,e,n,i,r,o){this.onBeforeRender(t,null,i,r,o)}}class zc extends Li{constructor(t){super(),this.isLineBasicMaterial=!0,this.type="LineBasicMaterial",this.color=new lt(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.linewidth=t.linewidth,this.linecap=t.linecap,this.linejoin=t.linejoin,this.fog=t.fog,this}}const Vo=new A,Ho=new A,jl=new Et,sr=new Zo,lo=new Bn,Pa=new A,$l=new A;class Kf extends pe{constructor(t=new me,e=new zc){super(),this.isLine=!0,this.type="Line",this.geometry=t,this.material=e,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}computeLineDistances(){const t=this.geometry;if(t.index===null){const e=t.attributes.position,n=[0];for(let i=1,r=e.count;i<r;i++)Vo.fromBufferAttribute(e,i-1),Ho.fromBufferAttribute(e,i),n[i]=n[i-1],n[i]+=Vo.distanceTo(Ho);t.setAttribute("lineDistance",new Gt(n,1))}else console.warn("THREE.Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}raycast(t,e){const n=this.geometry,i=this.matrixWorld,r=t.params.Line.threshold,o=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),lo.copy(n.boundingSphere),lo.applyMatrix4(i),lo.radius+=r,t.ray.intersectsSphere(lo)===!1)return;jl.copy(i).invert(),sr.copy(t.ray).applyMatrix4(jl);const a=r/((this.scale.x+this.scale.y+this.scale.z)/3),c=a*a,l=this.isLineSegments?2:1,u=n.index,p=n.attributes.position;if(u!==null){const d=Math.max(0,o.start),m=Math.min(u.count,o.start+o.count);for(let v=d,g=m-1;v<g;v+=l){const f=u.getX(v),x=u.getX(v+1),_=ho(this,t,sr,c,f,x,v);_&&e.push(_)}if(this.isLineLoop){const v=u.getX(m-1),g=u.getX(d),f=ho(this,t,sr,c,v,g,m-1);f&&e.push(f)}}else{const d=Math.max(0,o.start),m=Math.min(p.count,o.start+o.count);for(let v=d,g=m-1;v<g;v+=l){const f=ho(this,t,sr,c,v,v+1,v);f&&e.push(f)}if(this.isLineLoop){const v=ho(this,t,sr,c,m-1,d,m-1);v&&e.push(v)}}}updateMorphTargets(){const e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){const i=e[n[0]];if(i!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=i.length;r<o;r++){const a=i[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}}function ho(s,t,e,n,i,r,o){const a=s.geometry.attributes.position;if(Vo.fromBufferAttribute(a,i),Ho.fromBufferAttribute(a,r),e.distanceSqToSegment(Vo,Ho,Pa,$l)>n)return;Pa.applyMatrix4(s.matrixWorld);const l=t.ray.origin.distanceTo(Pa);if(!(l<t.near||l>t.far))return{distance:l,point:$l.clone().applyMatrix4(s.matrixWorld),index:o,face:null,faceIndex:null,barycoord:null,object:s}}const Kl=new A,Jl=new A;class Ql extends Kf{constructor(t,e){super(t,e),this.isLineSegments=!0,this.type="LineSegments"}computeLineDistances(){const t=this.geometry;if(t.index===null){const e=t.attributes.position,n=[];for(let i=0,r=e.count;i<r;i+=2)Kl.fromBufferAttribute(e,i),Jl.fromBufferAttribute(e,i+1),n[i]=i===0?0:n[i-1],n[i+1]=n[i]+Kl.distanceTo(Jl);t.setAttribute("lineDistance",new Gt(n,1))}else console.warn("THREE.LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}}class Jf extends Li{constructor(t){super(),this.isPointsMaterial=!0,this.type="PointsMaterial",this.color=new lt(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.alphaMap=t.alphaMap,this.size=t.size,this.sizeAttenuation=t.sizeAttenuation,this.fog=t.fog,this}}const th=new Et,Oc=new Zo,uo=new Bn,fo=new A;class Qf extends pe{constructor(t=new me,e=new Jf){super(),this.isPoints=!0,this.type="Points",this.geometry=t,this.material=e,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}raycast(t,e){const n=this.geometry,i=this.matrixWorld,r=t.params.Points.threshold,o=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),uo.copy(n.boundingSphere),uo.applyMatrix4(i),uo.radius+=r,t.ray.intersectsSphere(uo)===!1)return;th.copy(i).invert(),Oc.copy(t.ray).applyMatrix4(th);const a=r/((this.scale.x+this.scale.y+this.scale.z)/3),c=a*a,l=n.index,h=n.attributes.position;if(l!==null){const p=Math.max(0,o.start),d=Math.min(l.count,o.start+o.count);for(let m=p,v=d;m<v;m++){const g=l.getX(m);fo.fromBufferAttribute(h,g),eh(fo,g,c,i,t,e,this)}}else{const p=Math.max(0,o.start),d=Math.min(h.count,o.start+o.count);for(let m=p,v=d;m<v;m++)fo.fromBufferAttribute(h,m),eh(fo,m,c,i,t,e,this)}}updateMorphTargets(){const e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){const i=e[n[0]];if(i!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=i.length;r<o;r++){const a=i[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}}function eh(s,t,e,n,i,r,o){const a=Oc.distanceSqToPoint(s);if(a<e){const c=new A;Oc.closestPointToPoint(s,c),c.applyMatrix4(n);const l=i.ray.origin.distanceTo(c);if(l<i.near||l>i.far)return;r.push({distance:l,distanceToRay:Math.sqrt(a),point:c,index:t,face:null,faceIndex:null,barycoord:null,object:o})}}class Su extends qe{constructor(t,e,n,i,r,o,a,c,l){super(t,e,n,i,r,o,a,c,l),this.isCanvasTexture=!0,this.needsUpdate=!0}}class wu extends qe{constructor(t,e,n=Pi,i,r,o,a=yn,c=yn,l,u=Ar,h=1){if(u!==Ar&&u!==Rr)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");const p={width:t,height:e,depth:h};super(p,i,r,o,a,c,u,n,l),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(t){return super.copy(t),this.source=new Jc(Object.assign({},t.image)),this.compareFunction=t.compareFunction,this}toJSON(t){const e=super.toJSON(t);return this.compareFunction!==null&&(e.compareFunction=this.compareFunction),e}}class Tu extends qe{constructor(t=null){super(),this.sourceTexture=t,this.isExternalTexture=!0}copy(t){return super.copy(t),this.sourceTexture=t.sourceTexture,this}}class jo extends me{constructor(t=1,e=32,n=0,i=Math.PI*2){super(),this.type="CircleGeometry",this.parameters={radius:t,segments:e,thetaStart:n,thetaLength:i},e=Math.max(3,e);const r=[],o=[],a=[],c=[],l=new A,u=new tt;o.push(0,0,0),a.push(0,0,1),c.push(.5,.5);for(let h=0,p=3;h<=e;h++,p+=3){const d=n+h/e*i;l.x=t*Math.cos(d),l.y=t*Math.sin(d),o.push(l.x,l.y,l.z),a.push(0,0,1),u.x=(o[p]/t+1)/2,u.y=(o[p+1]/t+1)/2,c.push(u.x,u.y)}for(let h=1;h<=e;h++)r.push(h,h+1,0);this.setIndex(r),this.setAttribute("position",new Gt(o,3)),this.setAttribute("normal",new Gt(a,3)),this.setAttribute("uv",new Gt(c,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new jo(t.radius,t.segments,t.thetaStart,t.thetaLength)}}class hn extends me{constructor(t=1,e=1,n=1,i=32,r=1,o=!1,a=0,c=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:t,radiusBottom:e,height:n,radialSegments:i,heightSegments:r,openEnded:o,thetaStart:a,thetaLength:c};const l=this;i=Math.floor(i),r=Math.floor(r);const u=[],h=[],p=[],d=[];let m=0;const v=[],g=n/2;let f=0;x(),o===!1&&(t>0&&_(!0),e>0&&_(!1)),this.setIndex(u),this.setAttribute("position",new Gt(h,3)),this.setAttribute("normal",new Gt(p,3)),this.setAttribute("uv",new Gt(d,2));function x(){const y=new A,w=new A;let S=0;const T=(e-t)/n;for(let C=0;C<=r;C++){const b=[],M=C/r,E=M*(e-t)+t;for(let D=0;D<=i;D++){const N=D/i,I=N*c+a,F=Math.sin(I),z=Math.cos(I);w.x=E*F,w.y=-M*n+g,w.z=E*z,h.push(w.x,w.y,w.z),y.set(F,T,z).normalize(),p.push(y.x,y.y,y.z),d.push(N,1-M),b.push(m++)}v.push(b)}for(let C=0;C<i;C++)for(let b=0;b<r;b++){const M=v[b][C],E=v[b+1][C],D=v[b+1][C+1],N=v[b][C+1];(t>0||b!==0)&&(u.push(M,E,N),S+=3),(e>0||b!==r-1)&&(u.push(E,D,N),S+=3)}l.addGroup(f,S,0),f+=S}function _(y){const w=m,S=new tt,T=new A;let C=0;const b=y===!0?t:e,M=y===!0?1:-1;for(let D=1;D<=i;D++)h.push(0,g*M,0),p.push(0,M,0),d.push(.5,.5),m++;const E=m;for(let D=0;D<=i;D++){const I=D/i*c+a,F=Math.cos(I),z=Math.sin(I);T.x=b*z,T.y=g*M,T.z=b*F,h.push(T.x,T.y,T.z),p.push(0,M,0),S.x=F*.5+.5,S.y=z*.5*M+.5,d.push(S.x,S.y),m++}for(let D=0;D<i;D++){const N=w+D,I=E+D;y===!0?u.push(I,I+1,N):u.push(I+1,I,N),C+=3}l.addGroup(f,C,y===!0?1:2),f+=C}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new hn(t.radiusTop,t.radiusBottom,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}}class $o extends hn{constructor(t=1,e=1,n=32,i=1,r=!1,o=0,a=Math.PI*2){super(0,t,e,n,i,r,o,a),this.type="ConeGeometry",this.parameters={radius:t,height:e,radialSegments:n,heightSegments:i,openEnded:r,thetaStart:o,thetaLength:a}}static fromJSON(t){return new $o(t.radius,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}}class Ko extends me{constructor(t=[],e=[],n=1,i=0){super(),this.type="PolyhedronGeometry",this.parameters={vertices:t,indices:e,radius:n,detail:i};const r=[],o=[];a(i),l(n),u(),this.setAttribute("position",new Gt(r,3)),this.setAttribute("normal",new Gt(r.slice(),3)),this.setAttribute("uv",new Gt(o,2)),i===0?this.computeVertexNormals():this.normalizeNormals();function a(x){const _=new A,y=new A,w=new A;for(let S=0;S<e.length;S+=3)d(e[S+0],_),d(e[S+1],y),d(e[S+2],w),c(_,y,w,x)}function c(x,_,y,w){const S=w+1,T=[];for(let C=0;C<=S;C++){T[C]=[];const b=x.clone().lerp(y,C/S),M=_.clone().lerp(y,C/S),E=S-C;for(let D=0;D<=E;D++)D===0&&C===S?T[C][D]=b:T[C][D]=b.clone().lerp(M,D/E)}for(let C=0;C<S;C++)for(let b=0;b<2*(S-C)-1;b++){const M=Math.floor(b/2);b%2===0?(p(T[C][M+1]),p(T[C+1][M]),p(T[C][M])):(p(T[C][M+1]),p(T[C+1][M+1]),p(T[C+1][M]))}}function l(x){const _=new A;for(let y=0;y<r.length;y+=3)_.x=r[y+0],_.y=r[y+1],_.z=r[y+2],_.normalize().multiplyScalar(x),r[y+0]=_.x,r[y+1]=_.y,r[y+2]=_.z}function u(){const x=new A;for(let _=0;_<r.length;_+=3){x.x=r[_+0],x.y=r[_+1],x.z=r[_+2];const y=g(x)/2/Math.PI+.5,w=f(x)/Math.PI+.5;o.push(y,1-w)}m(),h()}function h(){for(let x=0;x<o.length;x+=6){const _=o[x+0],y=o[x+2],w=o[x+4],S=Math.max(_,y,w),T=Math.min(_,y,w);S>.9&&T<.1&&(_<.2&&(o[x+0]+=1),y<.2&&(o[x+2]+=1),w<.2&&(o[x+4]+=1))}}function p(x){r.push(x.x,x.y,x.z)}function d(x,_){const y=x*3;_.x=t[y+0],_.y=t[y+1],_.z=t[y+2]}function m(){const x=new A,_=new A,y=new A,w=new A,S=new tt,T=new tt,C=new tt;for(let b=0,M=0;b<r.length;b+=9,M+=6){x.set(r[b+0],r[b+1],r[b+2]),_.set(r[b+3],r[b+4],r[b+5]),y.set(r[b+6],r[b+7],r[b+8]),S.set(o[M+0],o[M+1]),T.set(o[M+2],o[M+3]),C.set(o[M+4],o[M+5]),w.copy(x).add(_).add(y).divideScalar(3);const E=g(w);v(S,M+0,x,E),v(T,M+2,_,E),v(C,M+4,y,E)}}function v(x,_,y,w){w<0&&x.x===1&&(o[_]=x.x-1),y.x===0&&y.z===0&&(o[_]=w/2/Math.PI+.5)}function g(x){return Math.atan2(x.z,-x.x)}function f(x){return Math.atan2(-x.y,Math.sqrt(x.x*x.x+x.z*x.z))}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Ko(t.vertices,t.indices,t.radius,t.details)}}class il extends Ko{constructor(t=1,e=0){const n=(1+Math.sqrt(5))/2,i=1/n,r=[-1,-1,-1,-1,-1,1,-1,1,-1,-1,1,1,1,-1,-1,1,-1,1,1,1,-1,1,1,1,0,-i,-n,0,-i,n,0,i,-n,0,i,n,-i,-n,0,-i,n,0,i,-n,0,i,n,0,-n,0,-i,n,0,-i,-n,0,i,n,0,i],o=[3,11,7,3,7,15,3,15,13,7,19,17,7,17,6,7,6,15,17,4,8,17,8,10,17,10,6,8,0,16,8,16,2,8,2,10,0,12,1,0,1,18,0,18,16,6,10,2,6,2,13,6,13,15,2,16,18,2,18,3,2,3,13,18,1,9,18,9,11,18,11,3,4,14,12,4,12,0,4,0,8,11,9,5,11,5,19,11,19,7,19,5,14,19,14,4,19,4,17,1,12,14,1,14,5,1,5,9];super(r,o,t,e),this.type="DodecahedronGeometry",this.parameters={radius:t,detail:e}}static fromJSON(t){return new il(t.radius,t.detail)}}class ni{constructor(){this.type="Curve",this.arcLengthDivisions=200,this.needsUpdate=!1,this.cacheArcLengths=null}getPoint(){console.warn("THREE.Curve: .getPoint() not implemented.")}getPointAt(t,e){const n=this.getUtoTmapping(t);return this.getPoint(n,e)}getPoints(t=5){const e=[];for(let n=0;n<=t;n++)e.push(this.getPoint(n/t));return e}getSpacedPoints(t=5){const e=[];for(let n=0;n<=t;n++)e.push(this.getPointAt(n/t));return e}getLength(){const t=this.getLengths();return t[t.length-1]}getLengths(t=this.arcLengthDivisions){if(this.cacheArcLengths&&this.cacheArcLengths.length===t+1&&!this.needsUpdate)return this.cacheArcLengths;this.needsUpdate=!1;const e=[];let n,i=this.getPoint(0),r=0;e.push(0);for(let o=1;o<=t;o++)n=this.getPoint(o/t),r+=n.distanceTo(i),e.push(r),i=n;return this.cacheArcLengths=e,e}updateArcLengths(){this.needsUpdate=!0,this.getLengths()}getUtoTmapping(t,e=null){const n=this.getLengths();let i=0;const r=n.length;let o;e?o=e:o=t*n[r-1];let a=0,c=r-1,l;for(;a<=c;)if(i=Math.floor(a+(c-a)/2),l=n[i]-o,l<0)a=i+1;else if(l>0)c=i-1;else{c=i;break}if(i=c,n[i]===o)return i/(r-1);const u=n[i],p=n[i+1]-u,d=(o-u)/p;return(i+d)/(r-1)}getTangent(t,e){let i=t-1e-4,r=t+1e-4;i<0&&(i=0),r>1&&(r=1);const o=this.getPoint(i),a=this.getPoint(r),c=e||(o.isVector2?new tt:new A);return c.copy(a).sub(o).normalize(),c}getTangentAt(t,e){const n=this.getUtoTmapping(t);return this.getTangent(n,e)}computeFrenetFrames(t,e=!1){const n=new A,i=[],r=[],o=[],a=new A,c=new Et;for(let d=0;d<=t;d++){const m=d/t;i[d]=this.getTangentAt(m,new A)}r[0]=new A,o[0]=new A;let l=Number.MAX_VALUE;const u=Math.abs(i[0].x),h=Math.abs(i[0].y),p=Math.abs(i[0].z);u<=l&&(l=u,n.set(1,0,0)),h<=l&&(l=h,n.set(0,1,0)),p<=l&&n.set(0,0,1),a.crossVectors(i[0],n).normalize(),r[0].crossVectors(i[0],a),o[0].crossVectors(i[0],r[0]);for(let d=1;d<=t;d++){if(r[d]=r[d-1].clone(),o[d]=o[d-1].clone(),a.crossVectors(i[d-1],i[d]),a.length()>Number.EPSILON){a.normalize();const m=Math.acos(ie(i[d-1].dot(i[d]),-1,1));r[d].applyMatrix4(c.makeRotationAxis(a,m))}o[d].crossVectors(i[d],r[d])}if(e===!0){let d=Math.acos(ie(r[0].dot(r[t]),-1,1));d/=t,i[0].dot(a.crossVectors(r[0],r[t]))>0&&(d=-d);for(let m=1;m<=t;m++)r[m].applyMatrix4(c.makeRotationAxis(i[m],d*m)),o[m].crossVectors(i[m],r[m])}return{tangents:i,normals:r,binormals:o}}clone(){return new this.constructor().copy(this)}copy(t){return this.arcLengthDivisions=t.arcLengthDivisions,this}toJSON(){const t={metadata:{version:4.7,type:"Curve",generator:"Curve.toJSON"}};return t.arcLengthDivisions=this.arcLengthDivisions,t.type=this.type,t}fromJSON(t){return this.arcLengthDivisions=t.arcLengthDivisions,this}}class sl extends ni{constructor(t=0,e=0,n=1,i=1,r=0,o=Math.PI*2,a=!1,c=0){super(),this.isEllipseCurve=!0,this.type="EllipseCurve",this.aX=t,this.aY=e,this.xRadius=n,this.yRadius=i,this.aStartAngle=r,this.aEndAngle=o,this.aClockwise=a,this.aRotation=c}getPoint(t,e=new tt){const n=e,i=Math.PI*2;let r=this.aEndAngle-this.aStartAngle;const o=Math.abs(r)<Number.EPSILON;for(;r<0;)r+=i;for(;r>i;)r-=i;r<Number.EPSILON&&(o?r=0:r=i),this.aClockwise===!0&&!o&&(r===i?r=-i:r=r-i);const a=this.aStartAngle+t*r;let c=this.aX+this.xRadius*Math.cos(a),l=this.aY+this.yRadius*Math.sin(a);if(this.aRotation!==0){const u=Math.cos(this.aRotation),h=Math.sin(this.aRotation),p=c-this.aX,d=l-this.aY;c=p*u-d*h+this.aX,l=p*h+d*u+this.aY}return n.set(c,l)}copy(t){return super.copy(t),this.aX=t.aX,this.aY=t.aY,this.xRadius=t.xRadius,this.yRadius=t.yRadius,this.aStartAngle=t.aStartAngle,this.aEndAngle=t.aEndAngle,this.aClockwise=t.aClockwise,this.aRotation=t.aRotation,this}toJSON(){const t=super.toJSON();return t.aX=this.aX,t.aY=this.aY,t.xRadius=this.xRadius,t.yRadius=this.yRadius,t.aStartAngle=this.aStartAngle,t.aEndAngle=this.aEndAngle,t.aClockwise=this.aClockwise,t.aRotation=this.aRotation,t}fromJSON(t){return super.fromJSON(t),this.aX=t.aX,this.aY=t.aY,this.xRadius=t.xRadius,this.yRadius=t.yRadius,this.aStartAngle=t.aStartAngle,this.aEndAngle=t.aEndAngle,this.aClockwise=t.aClockwise,this.aRotation=t.aRotation,this}}class t0 extends sl{constructor(t,e,n,i,r,o){super(t,e,n,n,i,r,o),this.isArcCurve=!0,this.type="ArcCurve"}}function rl(){let s=0,t=0,e=0,n=0;function i(r,o,a,c){s=r,t=a,e=-3*r+3*o-2*a-c,n=2*r-2*o+a+c}return{initCatmullRom:function(r,o,a,c,l){i(o,a,l*(a-r),l*(c-o))},initNonuniformCatmullRom:function(r,o,a,c,l,u,h){let p=(o-r)/l-(a-r)/(l+u)+(a-o)/u,d=(a-o)/u-(c-o)/(u+h)+(c-a)/h;p*=u,d*=u,i(o,a,p,d)},calc:function(r){const o=r*r,a=o*r;return s+t*r+e*o+n*a}}}const po=new A,Da=new rl,Ia=new rl,La=new rl;class is extends ni{constructor(t=[],e=!1,n="centripetal",i=.5){super(),this.isCatmullRomCurve3=!0,this.type="CatmullRomCurve3",this.points=t,this.closed=e,this.curveType=n,this.tension=i}getPoint(t,e=new A){const n=e,i=this.points,r=i.length,o=(r-(this.closed?0:1))*t;let a=Math.floor(o),c=o-a;this.closed?a+=a>0?0:(Math.floor(Math.abs(a)/r)+1)*r:c===0&&a===r-1&&(a=r-2,c=1);let l,u;this.closed||a>0?l=i[(a-1)%r]:(po.subVectors(i[0],i[1]).add(i[0]),l=po);const h=i[a%r],p=i[(a+1)%r];if(this.closed||a+2<r?u=i[(a+2)%r]:(po.subVectors(i[r-1],i[r-2]).add(i[r-1]),u=po),this.curveType==="centripetal"||this.curveType==="chordal"){const d=this.curveType==="chordal"?.5:.25;let m=Math.pow(l.distanceToSquared(h),d),v=Math.pow(h.distanceToSquared(p),d),g=Math.pow(p.distanceToSquared(u),d);v<1e-4&&(v=1),m<1e-4&&(m=v),g<1e-4&&(g=v),Da.initNonuniformCatmullRom(l.x,h.x,p.x,u.x,m,v,g),Ia.initNonuniformCatmullRom(l.y,h.y,p.y,u.y,m,v,g),La.initNonuniformCatmullRom(l.z,h.z,p.z,u.z,m,v,g)}else this.curveType==="catmullrom"&&(Da.initCatmullRom(l.x,h.x,p.x,u.x,this.tension),Ia.initCatmullRom(l.y,h.y,p.y,u.y,this.tension),La.initCatmullRom(l.z,h.z,p.z,u.z,this.tension));return n.set(Da.calc(c),Ia.calc(c),La.calc(c)),n}copy(t){super.copy(t),this.points=[];for(let e=0,n=t.points.length;e<n;e++){const i=t.points[e];this.points.push(i.clone())}return this.closed=t.closed,this.curveType=t.curveType,this.tension=t.tension,this}toJSON(){const t=super.toJSON();t.points=[];for(let e=0,n=this.points.length;e<n;e++){const i=this.points[e];t.points.push(i.toArray())}return t.closed=this.closed,t.curveType=this.curveType,t.tension=this.tension,t}fromJSON(t){super.fromJSON(t),this.points=[];for(let e=0,n=t.points.length;e<n;e++){const i=t.points[e];this.points.push(new A().fromArray(i))}return this.closed=t.closed,this.curveType=t.curveType,this.tension=t.tension,this}}function nh(s,t,e,n,i){const r=(n-t)*.5,o=(i-e)*.5,a=s*s,c=s*a;return(2*e-2*n+r+o)*c+(-3*e+3*n-2*r-o)*a+r*s+e}function e0(s,t){const e=1-s;return e*e*t}function n0(s,t){return 2*(1-s)*s*t}function i0(s,t){return s*s*t}function yr(s,t,e,n){return e0(s,t)+n0(s,e)+i0(s,n)}function s0(s,t){const e=1-s;return e*e*e*t}function r0(s,t){const e=1-s;return 3*e*e*s*t}function o0(s,t){return 3*(1-s)*s*s*t}function a0(s,t){return s*s*s*t}function Mr(s,t,e,n,i){return s0(s,t)+r0(s,e)+o0(s,n)+a0(s,i)}class Eu extends ni{constructor(t=new tt,e=new tt,n=new tt,i=new tt){super(),this.isCubicBezierCurve=!0,this.type="CubicBezierCurve",this.v0=t,this.v1=e,this.v2=n,this.v3=i}getPoint(t,e=new tt){const n=e,i=this.v0,r=this.v1,o=this.v2,a=this.v3;return n.set(Mr(t,i.x,r.x,o.x,a.x),Mr(t,i.y,r.y,o.y,a.y)),n}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this.v3.copy(t.v3),this}toJSON(){const t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t.v3=this.v3.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this.v3.fromArray(t.v3),this}}class c0 extends ni{constructor(t=new A,e=new A,n=new A,i=new A){super(),this.isCubicBezierCurve3=!0,this.type="CubicBezierCurve3",this.v0=t,this.v1=e,this.v2=n,this.v3=i}getPoint(t,e=new A){const n=e,i=this.v0,r=this.v1,o=this.v2,a=this.v3;return n.set(Mr(t,i.x,r.x,o.x,a.x),Mr(t,i.y,r.y,o.y,a.y),Mr(t,i.z,r.z,o.z,a.z)),n}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this.v3.copy(t.v3),this}toJSON(){const t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t.v3=this.v3.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this.v3.fromArray(t.v3),this}}class Au extends ni{constructor(t=new tt,e=new tt){super(),this.isLineCurve=!0,this.type="LineCurve",this.v1=t,this.v2=e}getPoint(t,e=new tt){const n=e;return t===1?n.copy(this.v2):(n.copy(this.v2).sub(this.v1),n.multiplyScalar(t).add(this.v1)),n}getPointAt(t,e){return this.getPoint(t,e)}getTangent(t,e=new tt){return e.subVectors(this.v2,this.v1).normalize()}getTangentAt(t,e){return this.getTangent(t,e)}copy(t){return super.copy(t),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){const t=super.toJSON();return t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}}class l0 extends ni{constructor(t=new A,e=new A){super(),this.isLineCurve3=!0,this.type="LineCurve3",this.v1=t,this.v2=e}getPoint(t,e=new A){const n=e;return t===1?n.copy(this.v2):(n.copy(this.v2).sub(this.v1),n.multiplyScalar(t).add(this.v1)),n}getPointAt(t,e){return this.getPoint(t,e)}getTangent(t,e=new A){return e.subVectors(this.v2,this.v1).normalize()}getTangentAt(t,e){return this.getTangent(t,e)}copy(t){return super.copy(t),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){const t=super.toJSON();return t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}}class Ru extends ni{constructor(t=new tt,e=new tt,n=new tt){super(),this.isQuadraticBezierCurve=!0,this.type="QuadraticBezierCurve",this.v0=t,this.v1=e,this.v2=n}getPoint(t,e=new tt){const n=e,i=this.v0,r=this.v1,o=this.v2;return n.set(yr(t,i.x,r.x,o.x),yr(t,i.y,r.y,o.y)),n}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){const t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}}class Cu extends ni{constructor(t=new A,e=new A,n=new A){super(),this.isQuadraticBezierCurve3=!0,this.type="QuadraticBezierCurve3",this.v0=t,this.v1=e,this.v2=n}getPoint(t,e=new A){const n=e,i=this.v0,r=this.v1,o=this.v2;return n.set(yr(t,i.x,r.x,o.x),yr(t,i.y,r.y,o.y),yr(t,i.z,r.z,o.z)),n}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){const t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}}class Pu extends ni{constructor(t=[]){super(),this.isSplineCurve=!0,this.type="SplineCurve",this.points=t}getPoint(t,e=new tt){const n=e,i=this.points,r=(i.length-1)*t,o=Math.floor(r),a=r-o,c=i[o===0?o:o-1],l=i[o],u=i[o>i.length-2?i.length-1:o+1],h=i[o>i.length-3?i.length-1:o+2];return n.set(nh(a,c.x,l.x,u.x,h.x),nh(a,c.y,l.y,u.y,h.y)),n}copy(t){super.copy(t),this.points=[];for(let e=0,n=t.points.length;e<n;e++){const i=t.points[e];this.points.push(i.clone())}return this}toJSON(){const t=super.toJSON();t.points=[];for(let e=0,n=this.points.length;e<n;e++){const i=this.points[e];t.points.push(i.toArray())}return t}fromJSON(t){super.fromJSON(t),this.points=[];for(let e=0,n=t.points.length;e<n;e++){const i=t.points[e];this.points.push(new tt().fromArray(i))}return this}}var Go=Object.freeze({__proto__:null,ArcCurve:t0,CatmullRomCurve3:is,CubicBezierCurve:Eu,CubicBezierCurve3:c0,EllipseCurve:sl,LineCurve:Au,LineCurve3:l0,QuadraticBezierCurve:Ru,QuadraticBezierCurve3:Cu,SplineCurve:Pu});class h0 extends ni{constructor(){super(),this.type="CurvePath",this.curves=[],this.autoClose=!1}add(t){this.curves.push(t)}closePath(){const t=this.curves[0].getPoint(0),e=this.curves[this.curves.length-1].getPoint(1);if(!t.equals(e)){const n=t.isVector2===!0?"LineCurve":"LineCurve3";this.curves.push(new Go[n](e,t))}return this}getPoint(t,e){const n=t*this.getLength(),i=this.getCurveLengths();let r=0;for(;r<i.length;){if(i[r]>=n){const o=i[r]-n,a=this.curves[r],c=a.getLength(),l=c===0?0:1-o/c;return a.getPointAt(l,e)}r++}return null}getLength(){const t=this.getCurveLengths();return t[t.length-1]}updateArcLengths(){this.needsUpdate=!0,this.cacheLengths=null,this.getCurveLengths()}getCurveLengths(){if(this.cacheLengths&&this.cacheLengths.length===this.curves.length)return this.cacheLengths;const t=[];let e=0;for(let n=0,i=this.curves.length;n<i;n++)e+=this.curves[n].getLength(),t.push(e);return this.cacheLengths=t,t}getSpacedPoints(t=40){const e=[];for(let n=0;n<=t;n++)e.push(this.getPoint(n/t));return this.autoClose&&e.push(e[0]),e}getPoints(t=12){const e=[];let n;for(let i=0,r=this.curves;i<r.length;i++){const o=r[i],a=o.isEllipseCurve?t*2:o.isLineCurve||o.isLineCurve3?1:o.isSplineCurve?t*o.points.length:t,c=o.getPoints(a);for(let l=0;l<c.length;l++){const u=c[l];n&&n.equals(u)||(e.push(u),n=u)}}return this.autoClose&&e.length>1&&!e[e.length-1].equals(e[0])&&e.push(e[0]),e}copy(t){super.copy(t),this.curves=[];for(let e=0,n=t.curves.length;e<n;e++){const i=t.curves[e];this.curves.push(i.clone())}return this.autoClose=t.autoClose,this}toJSON(){const t=super.toJSON();t.autoClose=this.autoClose,t.curves=[];for(let e=0,n=this.curves.length;e<n;e++){const i=this.curves[e];t.curves.push(i.toJSON())}return t}fromJSON(t){super.fromJSON(t),this.autoClose=t.autoClose,this.curves=[];for(let e=0,n=t.curves.length;e<n;e++){const i=t.curves[e];this.curves.push(new Go[i.type]().fromJSON(i))}return this}}class Ai extends h0{constructor(t){super(),this.type="Path",this.currentPoint=new tt,t&&this.setFromPoints(t)}setFromPoints(t){this.moveTo(t[0].x,t[0].y);for(let e=1,n=t.length;e<n;e++)this.lineTo(t[e].x,t[e].y);return this}moveTo(t,e){return this.currentPoint.set(t,e),this}lineTo(t,e){const n=new Au(this.currentPoint.clone(),new tt(t,e));return this.curves.push(n),this.currentPoint.set(t,e),this}quadraticCurveTo(t,e,n,i){const r=new Ru(this.currentPoint.clone(),new tt(t,e),new tt(n,i));return this.curves.push(r),this.currentPoint.set(n,i),this}bezierCurveTo(t,e,n,i,r,o){const a=new Eu(this.currentPoint.clone(),new tt(t,e),new tt(n,i),new tt(r,o));return this.curves.push(a),this.currentPoint.set(r,o),this}splineThru(t){const e=[this.currentPoint.clone()].concat(t),n=new Pu(e);return this.curves.push(n),this.currentPoint.copy(t[t.length-1]),this}arc(t,e,n,i,r,o){const a=this.currentPoint.x,c=this.currentPoint.y;return this.absarc(t+a,e+c,n,i,r,o),this}absarc(t,e,n,i,r,o){return this.absellipse(t,e,n,n,i,r,o),this}ellipse(t,e,n,i,r,o,a,c){const l=this.currentPoint.x,u=this.currentPoint.y;return this.absellipse(t+l,e+u,n,i,r,o,a,c),this}absellipse(t,e,n,i,r,o,a,c){const l=new sl(t,e,n,i,r,o,a,c);if(this.curves.length>0){const h=l.getPoint(0);h.equals(this.currentPoint)||this.lineTo(h.x,h.y)}this.curves.push(l);const u=l.getPoint(1);return this.currentPoint.copy(u),this}copy(t){return super.copy(t),this.currentPoint.copy(t.currentPoint),this}toJSON(){const t=super.toJSON();return t.currentPoint=this.currentPoint.toArray(),t}fromJSON(t){return super.fromJSON(t),this.currentPoint.fromArray(t.currentPoint),this}}class cn extends Ai{constructor(t){super(t),this.uuid=ti(),this.type="Shape",this.holes=[]}getPointsHoles(t){const e=[];for(let n=0,i=this.holes.length;n<i;n++)e[n]=this.holes[n].getPoints(t);return e}extractPoints(t){return{shape:this.getPoints(t),holes:this.getPointsHoles(t)}}copy(t){super.copy(t),this.holes=[];for(let e=0,n=t.holes.length;e<n;e++){const i=t.holes[e];this.holes.push(i.clone())}return this}toJSON(){const t=super.toJSON();t.uuid=this.uuid,t.holes=[];for(let e=0,n=this.holes.length;e<n;e++){const i=this.holes[e];t.holes.push(i.toJSON())}return t}fromJSON(t){super.fromJSON(t),this.uuid=t.uuid,this.holes=[];for(let e=0,n=t.holes.length;e<n;e++){const i=t.holes[e];this.holes.push(new Ai().fromJSON(i))}return this}}function u0(s,t,e=2){const n=t&&t.length,i=n?t[0]*e:s.length;let r=Du(s,0,i,e,!0);const o=[];if(!r||r.next===r.prev)return o;let a,c,l;if(n&&(r=g0(s,t,r,e)),s.length>80*e){a=1/0,c=1/0;let u=-1/0,h=-1/0;for(let p=e;p<i;p+=e){const d=s[p],m=s[p+1];d<a&&(a=d),m<c&&(c=m),d>u&&(u=d),m>h&&(h=m)}l=Math.max(u-a,h-c),l=l!==0?32767/l:0}return Pr(r,o,e,a,c,l,0),o}function Du(s,t,e,n,i){let r;if(i===A0(s,t,e,n)>0)for(let o=t;o<e;o+=n)r=ih(o/n|0,s[o],s[o+1],r);else for(let o=e-n;o>=t;o-=n)r=ih(o/n|0,s[o],s[o+1],r);return r&&Gs(r,r.next)&&(Ir(r),r=r.next),r}function ss(s,t){if(!s)return s;t||(t=s);let e=s,n;do if(n=!1,!e.steiner&&(Gs(e,e.next)||Le(e.prev,e,e.next)===0)){if(Ir(e),e=t=e.prev,e===e.next)break;n=!0}else e=e.next;while(n||e!==t);return t}function Pr(s,t,e,n,i,r,o){if(!s)return;!o&&r&&M0(s,n,i,r);let a=s;for(;s.prev!==s.next;){const c=s.prev,l=s.next;if(r?f0(s,n,i,r):d0(s)){t.push(c.i,s.i,l.i),Ir(s),s=l.next,a=l.next;continue}if(s=l,s===a){o?o===1?(s=p0(ss(s),t),Pr(s,t,e,n,i,r,2)):o===2&&m0(s,t,e,n,i,r):Pr(ss(s),t,e,n,i,r,1);break}}}function d0(s){const t=s.prev,e=s,n=s.next;if(Le(t,e,n)>=0)return!1;const i=t.x,r=e.x,o=n.x,a=t.y,c=e.y,l=n.y,u=Math.min(i,r,o),h=Math.min(a,c,l),p=Math.max(i,r,o),d=Math.max(a,c,l);let m=n.next;for(;m!==t;){if(m.x>=u&&m.x<=p&&m.y>=h&&m.y<=d&&pr(i,a,r,c,o,l,m.x,m.y)&&Le(m.prev,m,m.next)>=0)return!1;m=m.next}return!0}function f0(s,t,e,n){const i=s.prev,r=s,o=s.next;if(Le(i,r,o)>=0)return!1;const a=i.x,c=r.x,l=o.x,u=i.y,h=r.y,p=o.y,d=Math.min(a,c,l),m=Math.min(u,h,p),v=Math.max(a,c,l),g=Math.max(u,h,p),f=Bc(d,m,t,e,n),x=Bc(v,g,t,e,n);let _=s.prevZ,y=s.nextZ;for(;_&&_.z>=f&&y&&y.z<=x;){if(_.x>=d&&_.x<=v&&_.y>=m&&_.y<=g&&_!==i&&_!==o&&pr(a,u,c,h,l,p,_.x,_.y)&&Le(_.prev,_,_.next)>=0||(_=_.prevZ,y.x>=d&&y.x<=v&&y.y>=m&&y.y<=g&&y!==i&&y!==o&&pr(a,u,c,h,l,p,y.x,y.y)&&Le(y.prev,y,y.next)>=0))return!1;y=y.nextZ}for(;_&&_.z>=f;){if(_.x>=d&&_.x<=v&&_.y>=m&&_.y<=g&&_!==i&&_!==o&&pr(a,u,c,h,l,p,_.x,_.y)&&Le(_.prev,_,_.next)>=0)return!1;_=_.prevZ}for(;y&&y.z<=x;){if(y.x>=d&&y.x<=v&&y.y>=m&&y.y<=g&&y!==i&&y!==o&&pr(a,u,c,h,l,p,y.x,y.y)&&Le(y.prev,y,y.next)>=0)return!1;y=y.nextZ}return!0}function p0(s,t){let e=s;do{const n=e.prev,i=e.next.next;!Gs(n,i)&&Lu(n,e,e.next,i)&&Dr(n,i)&&Dr(i,n)&&(t.push(n.i,e.i,i.i),Ir(e),Ir(e.next),e=s=i),e=e.next}while(e!==s);return ss(e)}function m0(s,t,e,n,i,r){let o=s;do{let a=o.next.next;for(;a!==o.prev;){if(o.i!==a.i&&w0(o,a)){let c=Uu(o,a);o=ss(o,o.next),c=ss(c,c.next),Pr(o,t,e,n,i,r,0),Pr(c,t,e,n,i,r,0);return}a=a.next}o=o.next}while(o!==s)}function g0(s,t,e,n){const i=[];for(let r=0,o=t.length;r<o;r++){const a=t[r]*n,c=r<o-1?t[r+1]*n:s.length,l=Du(s,a,c,n,!1);l===l.next&&(l.steiner=!0),i.push(S0(l))}i.sort(v0);for(let r=0;r<i.length;r++)e=_0(i[r],e);return e}function v0(s,t){let e=s.x-t.x;if(e===0&&(e=s.y-t.y,e===0)){const n=(s.next.y-s.y)/(s.next.x-s.x),i=(t.next.y-t.y)/(t.next.x-t.x);e=n-i}return e}function _0(s,t){const e=x0(s,t);if(!e)return t;const n=Uu(e,s);return ss(n,n.next),ss(e,e.next)}function x0(s,t){let e=t;const n=s.x,i=s.y;let r=-1/0,o;if(Gs(s,e))return e;do{if(Gs(s,e.next))return e.next;if(i<=e.y&&i>=e.next.y&&e.next.y!==e.y){const h=e.x+(i-e.y)*(e.next.x-e.x)/(e.next.y-e.y);if(h<=n&&h>r&&(r=h,o=e.x<e.next.x?e:e.next,h===n))return o}e=e.next}while(e!==t);if(!o)return null;const a=o,c=o.x,l=o.y;let u=1/0;e=o;do{if(n>=e.x&&e.x>=c&&n!==e.x&&Iu(i<l?n:r,i,c,l,i<l?r:n,i,e.x,e.y)){const h=Math.abs(i-e.y)/(n-e.x);Dr(e,s)&&(h<u||h===u&&(e.x>o.x||e.x===o.x&&y0(o,e)))&&(o=e,u=h)}e=e.next}while(e!==a);return o}function y0(s,t){return Le(s.prev,s,t.prev)<0&&Le(t.next,s,s.next)<0}function M0(s,t,e,n){let i=s;do i.z===0&&(i.z=Bc(i.x,i.y,t,e,n)),i.prevZ=i.prev,i.nextZ=i.next,i=i.next;while(i!==s);i.prevZ.nextZ=null,i.prevZ=null,b0(i)}function b0(s){let t,e=1;do{let n=s,i;s=null;let r=null;for(t=0;n;){t++;let o=n,a=0;for(let l=0;l<e&&(a++,o=o.nextZ,!!o);l++);let c=e;for(;a>0||c>0&&o;)a!==0&&(c===0||!o||n.z<=o.z)?(i=n,n=n.nextZ,a--):(i=o,o=o.nextZ,c--),r?r.nextZ=i:s=i,i.prevZ=r,r=i;n=o}r.nextZ=null,e*=2}while(t>1);return s}function Bc(s,t,e,n,i){return s=(s-e)*i|0,t=(t-n)*i|0,s=(s|s<<8)&16711935,s=(s|s<<4)&252645135,s=(s|s<<2)&858993459,s=(s|s<<1)&1431655765,t=(t|t<<8)&16711935,t=(t|t<<4)&252645135,t=(t|t<<2)&858993459,t=(t|t<<1)&1431655765,s|t<<1}function S0(s){let t=s,e=s;do(t.x<e.x||t.x===e.x&&t.y<e.y)&&(e=t),t=t.next;while(t!==s);return e}function Iu(s,t,e,n,i,r,o,a){return(i-o)*(t-a)>=(s-o)*(r-a)&&(s-o)*(n-a)>=(e-o)*(t-a)&&(e-o)*(r-a)>=(i-o)*(n-a)}function pr(s,t,e,n,i,r,o,a){return!(s===o&&t===a)&&Iu(s,t,e,n,i,r,o,a)}function w0(s,t){return s.next.i!==t.i&&s.prev.i!==t.i&&!T0(s,t)&&(Dr(s,t)&&Dr(t,s)&&E0(s,t)&&(Le(s.prev,s,t.prev)||Le(s,t.prev,t))||Gs(s,t)&&Le(s.prev,s,s.next)>0&&Le(t.prev,t,t.next)>0)}function Le(s,t,e){return(t.y-s.y)*(e.x-t.x)-(t.x-s.x)*(e.y-t.y)}function Gs(s,t){return s.x===t.x&&s.y===t.y}function Lu(s,t,e,n){const i=go(Le(s,t,e)),r=go(Le(s,t,n)),o=go(Le(e,n,s)),a=go(Le(e,n,t));return!!(i!==r&&o!==a||i===0&&mo(s,e,t)||r===0&&mo(s,n,t)||o===0&&mo(e,s,n)||a===0&&mo(e,t,n))}function mo(s,t,e){return t.x<=Math.max(s.x,e.x)&&t.x>=Math.min(s.x,e.x)&&t.y<=Math.max(s.y,e.y)&&t.y>=Math.min(s.y,e.y)}function go(s){return s>0?1:s<0?-1:0}function T0(s,t){let e=s;do{if(e.i!==s.i&&e.next.i!==s.i&&e.i!==t.i&&e.next.i!==t.i&&Lu(e,e.next,s,t))return!0;e=e.next}while(e!==s);return!1}function Dr(s,t){return Le(s.prev,s,s.next)<0?Le(s,t,s.next)>=0&&Le(s,s.prev,t)>=0:Le(s,t,s.prev)<0||Le(s,s.next,t)<0}function E0(s,t){let e=s,n=!1;const i=(s.x+t.x)/2,r=(s.y+t.y)/2;do e.y>r!=e.next.y>r&&e.next.y!==e.y&&i<(e.next.x-e.x)*(r-e.y)/(e.next.y-e.y)+e.x&&(n=!n),e=e.next;while(e!==s);return n}function Uu(s,t){const e=kc(s.i,s.x,s.y),n=kc(t.i,t.x,t.y),i=s.next,r=t.prev;return s.next=t,t.prev=s,e.next=i,i.prev=e,n.next=e,e.prev=n,r.next=n,n.prev=r,n}function ih(s,t,e,n){const i=kc(s,t,e);return n?(i.next=n.next,i.prev=n,n.next.prev=i,n.next=i):(i.prev=i,i.next=i),i}function Ir(s){s.next.prev=s.prev,s.prev.next=s.next,s.prevZ&&(s.prevZ.nextZ=s.nextZ),s.nextZ&&(s.nextZ.prevZ=s.prevZ)}function kc(s,t,e){return{i:s,x:t,y:e,prev:null,next:null,z:0,prevZ:null,nextZ:null,steiner:!1}}function A0(s,t,e,n){let i=0;for(let r=t,o=e-n;r<e;r+=n)i+=(s[o]-s[r])*(s[r+1]+s[o+1]),o=r;return i}class R0{static triangulate(t,e,n=2){return u0(t,e,n)}}class Ds{static area(t){const e=t.length;let n=0;for(let i=e-1,r=0;r<e;i=r++)n+=t[i].x*t[r].y-t[r].x*t[i].y;return n*.5}static isClockWise(t){return Ds.area(t)<0}static triangulateShape(t,e){const n=[],i=[],r=[];sh(t),rh(n,t);let o=t.length;e.forEach(sh);for(let c=0;c<e.length;c++)i.push(o),o+=e[c].length,rh(n,e[c]);const a=R0.triangulate(n,i);for(let c=0;c<a.length;c+=3)r.push(a.slice(c,c+3));return r}}function sh(s){const t=s.length;t>2&&s[t-1].equals(s[0])&&s.pop()}function rh(s,t){for(let e=0;e<t.length;e++)s.push(t[e].x),s.push(t[e].y)}class Jn extends me{constructor(t=new cn([new tt(.5,.5),new tt(-.5,.5),new tt(-.5,-.5),new tt(.5,-.5)]),e={}){super(),this.type="ExtrudeGeometry",this.parameters={shapes:t,options:e},t=Array.isArray(t)?t:[t];const n=this,i=[],r=[];for(let a=0,c=t.length;a<c;a++){const l=t[a];o(l)}this.setAttribute("position",new Gt(i,3)),this.setAttribute("uv",new Gt(r,2)),this.computeVertexNormals();function o(a){const c=[],l=e.curveSegments!==void 0?e.curveSegments:12,u=e.steps!==void 0?e.steps:1,h=e.depth!==void 0?e.depth:1;let p=e.bevelEnabled!==void 0?e.bevelEnabled:!0,d=e.bevelThickness!==void 0?e.bevelThickness:.2,m=e.bevelSize!==void 0?e.bevelSize:d-.1,v=e.bevelOffset!==void 0?e.bevelOffset:0,g=e.bevelSegments!==void 0?e.bevelSegments:3;const f=e.extrudePath,x=e.UVGenerator!==void 0?e.UVGenerator:C0;let _,y=!1,w,S,T,C;f&&(_=f.getSpacedPoints(u),y=!0,p=!1,w=f.computeFrenetFrames(u,!1),S=new A,T=new A,C=new A),p||(g=0,d=0,m=0,v=0);const b=a.extractPoints(l);let M=b.shape;const E=b.holes;if(!Ds.isClockWise(M)){M=M.reverse();for(let it=0,J=E.length;it<J;it++){const Q=E[it];Ds.isClockWise(Q)&&(E[it]=Q.reverse())}}function N(it){const Q=10000000000000001e-36;let et=it[0];for(let vt=1;vt<=it.length;vt++){const ct=vt%it.length,xt=it[ct],Qt=xt.x-et.x,jt=xt.y-et.y,L=Qt*Qt+jt*jt,R=Math.max(Math.abs(xt.x),Math.abs(xt.y),Math.abs(et.x),Math.abs(et.y)),H=Q*R*R;if(L<=H){it.splice(ct,1),vt--;continue}et=xt}}N(M),E.forEach(N);const I=E.length,F=M;for(let it=0;it<I;it++){const J=E[it];M=M.concat(J)}function z(it,J,Q){return J||console.error("THREE.ExtrudeGeometry: vec does not exist"),it.clone().addScaledVector(J,Q)}const X=M.length;function k(it,J,Q){let et,vt,ct;const xt=it.x-J.x,Qt=it.y-J.y,jt=Q.x-it.x,L=Q.y-it.y,R=xt*xt+Qt*Qt,H=xt*L-Qt*jt;if(Math.abs(H)>Number.EPSILON){const Y=Math.sqrt(R),ot=Math.sqrt(jt*jt+L*L),j=J.x-Qt/Y,zt=J.y+xt/Y,gt=Q.x-L/ot,Ut=Q.y+jt/ot,Nt=((gt-j)*L-(Ut-zt)*jt)/(xt*L-Qt*jt);et=j+xt*Nt-it.x,vt=zt+Qt*Nt-it.y;const ht=et*et+vt*vt;if(ht<=2)return new tt(et,vt);ct=Math.sqrt(ht/2)}else{let Y=!1;xt>Number.EPSILON?jt>Number.EPSILON&&(Y=!0):xt<-Number.EPSILON?jt<-Number.EPSILON&&(Y=!0):Math.sign(Qt)===Math.sign(L)&&(Y=!0),Y?(et=-Qt,vt=xt,ct=Math.sqrt(R)):(et=xt,vt=Qt,ct=Math.sqrt(R/2))}return new tt(et/ct,vt/ct)}const K=[];for(let it=0,J=F.length,Q=J-1,et=it+1;it<J;it++,Q++,et++)Q===J&&(Q=0),et===J&&(et=0),K[it]=k(F[it],F[Q],F[et]);const rt=[];let Z,mt=K.concat();for(let it=0,J=I;it<J;it++){const Q=E[it];Z=[];for(let et=0,vt=Q.length,ct=vt-1,xt=et+1;et<vt;et++,ct++,xt++)ct===vt&&(ct=0),xt===vt&&(xt=0),Z[et]=k(Q[et],Q[ct],Q[xt]);rt.push(Z),mt=mt.concat(Z)}let Vt;if(g===0)Vt=Ds.triangulateShape(F,E);else{const it=[],J=[];for(let Q=0;Q<g;Q++){const et=Q/g,vt=d*Math.cos(et*Math.PI/2),ct=m*Math.sin(et*Math.PI/2)+v;for(let xt=0,Qt=F.length;xt<Qt;xt++){const jt=z(F[xt],K[xt],ct);Lt(jt.x,jt.y,-vt),et===0&&it.push(jt)}for(let xt=0,Qt=I;xt<Qt;xt++){const jt=E[xt];Z=rt[xt];const L=[];for(let R=0,H=jt.length;R<H;R++){const Y=z(jt[R],Z[R],ct);Lt(Y.x,Y.y,-vt),et===0&&L.push(Y)}et===0&&J.push(L)}}Vt=Ds.triangulateShape(it,J)}const Zt=Vt.length,Kt=m+v;for(let it=0;it<X;it++){const J=p?z(M[it],mt[it],Kt):M[it];y?(T.copy(w.normals[0]).multiplyScalar(J.x),S.copy(w.binormals[0]).multiplyScalar(J.y),C.copy(_[0]).add(T).add(S),Lt(C.x,C.y,C.z)):Lt(J.x,J.y,0)}for(let it=1;it<=u;it++)for(let J=0;J<X;J++){const Q=p?z(M[J],mt[J],Kt):M[J];y?(T.copy(w.normals[it]).multiplyScalar(Q.x),S.copy(w.binormals[it]).multiplyScalar(Q.y),C.copy(_[it]).add(T).add(S),Lt(C.x,C.y,C.z)):Lt(Q.x,Q.y,h/u*it)}for(let it=g-1;it>=0;it--){const J=it/g,Q=d*Math.cos(J*Math.PI/2),et=m*Math.sin(J*Math.PI/2)+v;for(let vt=0,ct=F.length;vt<ct;vt++){const xt=z(F[vt],K[vt],et);Lt(xt.x,xt.y,h+Q)}for(let vt=0,ct=E.length;vt<ct;vt++){const xt=E[vt];Z=rt[vt];for(let Qt=0,jt=xt.length;Qt<jt;Qt++){const L=z(xt[Qt],Z[Qt],et);y?Lt(L.x,L.y+_[u-1].y,_[u-1].x+Q):Lt(L.x,L.y,h+Q)}}}$(),st();function $(){const it=i.length/3;if(p){let J=0,Q=X*J;for(let et=0;et<Zt;et++){const vt=Vt[et];Rt(vt[2]+Q,vt[1]+Q,vt[0]+Q)}J=u+g*2,Q=X*J;for(let et=0;et<Zt;et++){const vt=Vt[et];Rt(vt[0]+Q,vt[1]+Q,vt[2]+Q)}}else{for(let J=0;J<Zt;J++){const Q=Vt[J];Rt(Q[2],Q[1],Q[0])}for(let J=0;J<Zt;J++){const Q=Vt[J];Rt(Q[0]+X*u,Q[1]+X*u,Q[2]+X*u)}}n.addGroup(it,i.length/3-it,0)}function st(){const it=i.length/3;let J=0;wt(F,J),J+=F.length;for(let Q=0,et=E.length;Q<et;Q++){const vt=E[Q];wt(vt,J),J+=vt.length}n.addGroup(it,i.length/3-it,1)}function wt(it,J){let Q=it.length;for(;--Q>=0;){const et=Q;let vt=Q-1;vt<0&&(vt=it.length-1);for(let ct=0,xt=u+g*2;ct<xt;ct++){const Qt=X*ct,jt=X*(ct+1),L=J+et+Qt,R=J+vt+Qt,H=J+vt+jt,Y=J+et+jt;ee(L,R,H,Y)}}}function Lt(it,J,Q){c.push(it),c.push(J),c.push(Q)}function Rt(it,J,Q){se(it),se(J),se(Q);const et=i.length/3,vt=x.generateTopUV(n,i,et-3,et-2,et-1);U(vt[0]),U(vt[1]),U(vt[2])}function ee(it,J,Q,et){se(it),se(J),se(et),se(J),se(Q),se(et);const vt=i.length/3,ct=x.generateSideWallUV(n,i,vt-6,vt-3,vt-2,vt-1);U(ct[0]),U(ct[1]),U(ct[3]),U(ct[1]),U(ct[2]),U(ct[3])}function se(it){i.push(c[it*3+0]),i.push(c[it*3+1]),i.push(c[it*3+2])}function U(it){r.push(it.x),r.push(it.y)}}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}toJSON(){const t=super.toJSON(),e=this.parameters.shapes,n=this.parameters.options;return P0(e,n,t)}static fromJSON(t,e){const n=[];for(let r=0,o=t.shapes.length;r<o;r++){const a=e[t.shapes[r]];n.push(a)}const i=t.options.extrudePath;return i!==void 0&&(t.options.extrudePath=new Go[i.type]().fromJSON(i)),new Jn(n,t.options)}}const C0={generateTopUV:function(s,t,e,n,i){const r=t[e*3],o=t[e*3+1],a=t[n*3],c=t[n*3+1],l=t[i*3],u=t[i*3+1];return[new tt(r,o),new tt(a,c),new tt(l,u)]},generateSideWallUV:function(s,t,e,n,i,r){const o=t[e*3],a=t[e*3+1],c=t[e*3+2],l=t[n*3],u=t[n*3+1],h=t[n*3+2],p=t[i*3],d=t[i*3+1],m=t[i*3+2],v=t[r*3],g=t[r*3+1],f=t[r*3+2];return Math.abs(a-u)<Math.abs(o-l)?[new tt(o,1-c),new tt(l,1-h),new tt(p,1-m),new tt(v,1-f)]:[new tt(a,1-c),new tt(u,1-h),new tt(d,1-m),new tt(g,1-f)]}};function P0(s,t,e){if(e.shapes=[],Array.isArray(s))for(let n=0,i=s.length;n<i;n++){const r=s[n];e.shapes.push(r.uuid)}else e.shapes.push(s.uuid);return e.options=Object.assign({},t),t.extrudePath!==void 0&&(e.options.extrudePath=t.extrudePath.toJSON()),e}class Mn extends Ko{constructor(t=1,e=0){const n=(1+Math.sqrt(5))/2,i=[-1,n,0,1,n,0,-1,-n,0,1,-n,0,0,-1,n,0,1,n,0,-1,-n,0,1,-n,n,0,-1,n,0,1,-n,0,-1,-n,0,1],r=[0,11,5,0,5,1,0,1,7,0,7,10,0,10,11,1,5,9,5,11,4,11,10,2,10,7,6,7,1,8,3,9,4,3,4,2,3,2,6,3,6,8,3,8,9,4,9,5,2,4,11,6,2,10,8,6,7,9,8,1];super(i,r,t,e),this.type="IcosahedronGeometry",this.parameters={radius:t,detail:e}}static fromJSON(t){return new Mn(t.radius,t.detail)}}class Jo extends me{constructor(t=[new tt(0,-.5),new tt(.5,0),new tt(0,.5)],e=12,n=0,i=Math.PI*2){super(),this.type="LatheGeometry",this.parameters={points:t,segments:e,phiStart:n,phiLength:i},e=Math.floor(e),i=ie(i,0,Math.PI*2);const r=[],o=[],a=[],c=[],l=[],u=1/e,h=new A,p=new tt,d=new A,m=new A,v=new A;let g=0,f=0;for(let x=0;x<=t.length-1;x++)switch(x){case 0:g=t[x+1].x-t[x].x,f=t[x+1].y-t[x].y,d.x=f*1,d.y=-g,d.z=f*0,v.copy(d),d.normalize(),c.push(d.x,d.y,d.z);break;case t.length-1:c.push(v.x,v.y,v.z);break;default:g=t[x+1].x-t[x].x,f=t[x+1].y-t[x].y,d.x=f*1,d.y=-g,d.z=f*0,m.copy(d),d.x+=v.x,d.y+=v.y,d.z+=v.z,d.normalize(),c.push(d.x,d.y,d.z),v.copy(m)}for(let x=0;x<=e;x++){const _=n+x*u*i,y=Math.sin(_),w=Math.cos(_);for(let S=0;S<=t.length-1;S++){h.x=t[S].x*y,h.y=t[S].y,h.z=t[S].x*w,o.push(h.x,h.y,h.z),p.x=x/e,p.y=S/(t.length-1),a.push(p.x,p.y);const T=c[3*S+0]*y,C=c[3*S+1],b=c[3*S+0]*w;l.push(T,C,b)}}for(let x=0;x<e;x++)for(let _=0;_<t.length-1;_++){const y=_+x*t.length,w=y,S=y+t.length,T=y+t.length+1,C=y+1;r.push(w,S,C),r.push(T,C,S)}this.setIndex(r),this.setAttribute("position",new Gt(o,3)),this.setAttribute("uv",new Gt(a,2)),this.setAttribute("normal",new Gt(l,3))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Jo(t.points,t.segments,t.phiStart,t.phiLength)}}class Ui extends me{constructor(t=1,e=1,n=1,i=1){super(),this.type="PlaneGeometry",this.parameters={width:t,height:e,widthSegments:n,heightSegments:i};const r=t/2,o=e/2,a=Math.floor(n),c=Math.floor(i),l=a+1,u=c+1,h=t/a,p=e/c,d=[],m=[],v=[],g=[];for(let f=0;f<u;f++){const x=f*p-o;for(let _=0;_<l;_++){const y=_*h-r;m.push(y,-x,0),v.push(0,0,1),g.push(_/a),g.push(1-f/c)}}for(let f=0;f<c;f++)for(let x=0;x<a;x++){const _=x+l*f,y=x+l*(f+1),w=x+1+l*(f+1),S=x+1+l*f;d.push(_,y,S),d.push(y,w,S)}this.setIndex(d),this.setAttribute("position",new Gt(m,3)),this.setAttribute("normal",new Gt(v,3)),this.setAttribute("uv",new Gt(g,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Ui(t.width,t.height,t.widthSegments,t.heightSegments)}}class Zn extends me{constructor(t=1,e=32,n=16,i=0,r=Math.PI*2,o=0,a=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:t,widthSegments:e,heightSegments:n,phiStart:i,phiLength:r,thetaStart:o,thetaLength:a},e=Math.max(3,Math.floor(e)),n=Math.max(2,Math.floor(n));const c=Math.min(o+a,Math.PI);let l=0;const u=[],h=new A,p=new A,d=[],m=[],v=[],g=[];for(let f=0;f<=n;f++){const x=[],_=f/n;let y=0;f===0&&o===0?y=.5/e:f===n&&c===Math.PI&&(y=-.5/e);for(let w=0;w<=e;w++){const S=w/e;h.x=-t*Math.cos(i+S*r)*Math.sin(o+_*a),h.y=t*Math.cos(o+_*a),h.z=t*Math.sin(i+S*r)*Math.sin(o+_*a),m.push(h.x,h.y,h.z),p.copy(h).normalize(),v.push(p.x,p.y,p.z),g.push(S+y,1-_),x.push(l++)}u.push(x)}for(let f=0;f<n;f++)for(let x=0;x<e;x++){const _=u[f][x+1],y=u[f][x],w=u[f+1][x],S=u[f+1][x+1];(f!==0||o>0)&&d.push(_,y,S),(f!==n-1||c<Math.PI)&&d.push(y,w,S)}this.setIndex(d),this.setAttribute("position",new Gt(m,3)),this.setAttribute("normal",new Gt(v,3)),this.setAttribute("uv",new Gt(g,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Zn(t.radius,t.widthSegments,t.heightSegments,t.phiStart,t.phiLength,t.thetaStart,t.thetaLength)}}class Ur extends me{constructor(t=1,e=.4,n=12,i=48,r=Math.PI*2){super(),this.type="TorusGeometry",this.parameters={radius:t,tube:e,radialSegments:n,tubularSegments:i,arc:r},n=Math.floor(n),i=Math.floor(i);const o=[],a=[],c=[],l=[],u=new A,h=new A,p=new A;for(let d=0;d<=n;d++)for(let m=0;m<=i;m++){const v=m/i*r,g=d/n*Math.PI*2;h.x=(t+e*Math.cos(g))*Math.cos(v),h.y=(t+e*Math.cos(g))*Math.sin(v),h.z=e*Math.sin(g),a.push(h.x,h.y,h.z),u.x=t*Math.cos(v),u.y=t*Math.sin(v),p.subVectors(h,u).normalize(),c.push(p.x,p.y,p.z),l.push(m/i),l.push(d/n)}for(let d=1;d<=n;d++)for(let m=1;m<=i;m++){const v=(i+1)*d+m-1,g=(i+1)*(d-1)+m-1,f=(i+1)*(d-1)+m,x=(i+1)*d+m;o.push(v,g,x),o.push(g,f,x)}this.setIndex(o),this.setAttribute("position",new Gt(a,3)),this.setAttribute("normal",new Gt(c,3)),this.setAttribute("uv",new Gt(l,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Ur(t.radius,t.tube,t.radialSegments,t.tubularSegments,t.arc)}}class Nr extends me{constructor(t=new Cu(new A(-1,-1,0),new A(-1,1,0),new A(1,1,0)),e=64,n=1,i=8,r=!1){super(),this.type="TubeGeometry",this.parameters={path:t,tubularSegments:e,radius:n,radialSegments:i,closed:r};const o=t.computeFrenetFrames(e,r);this.tangents=o.tangents,this.normals=o.normals,this.binormals=o.binormals;const a=new A,c=new A,l=new tt;let u=new A;const h=[],p=[],d=[],m=[];v(),this.setIndex(m),this.setAttribute("position",new Gt(h,3)),this.setAttribute("normal",new Gt(p,3)),this.setAttribute("uv",new Gt(d,2));function v(){for(let _=0;_<e;_++)g(_);g(r===!1?e:0),x(),f()}function g(_){u=t.getPointAt(_/e,u);const y=o.normals[_],w=o.binormals[_];for(let S=0;S<=i;S++){const T=S/i*Math.PI*2,C=Math.sin(T),b=-Math.cos(T);c.x=b*y.x+C*w.x,c.y=b*y.y+C*w.y,c.z=b*y.z+C*w.z,c.normalize(),p.push(c.x,c.y,c.z),a.x=u.x+n*c.x,a.y=u.y+n*c.y,a.z=u.z+n*c.z,h.push(a.x,a.y,a.z)}}function f(){for(let _=1;_<=e;_++)for(let y=1;y<=i;y++){const w=(i+1)*(_-1)+(y-1),S=(i+1)*_+(y-1),T=(i+1)*_+y,C=(i+1)*(_-1)+y;m.push(w,S,C),m.push(S,T,C)}}function x(){for(let _=0;_<=e;_++)for(let y=0;y<=i;y++)l.x=_/e,l.y=y/i,d.push(l.x,l.y)}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}toJSON(){const t=super.toJSON();return t.path=this.parameters.path.toJSON(),t}static fromJSON(t){return new Nr(new Go[t.path.type]().fromJSON(t.path),t.tubularSegments,t.radius,t.radialSegments,t.closed)}}class D0 extends Be{constructor(t){super(t),this.isRawShaderMaterial=!0,this.type="RawShaderMaterial"}}class _e extends Li{constructor(t){super(),this.isMeshStandardMaterial=!0,this.type="MeshStandardMaterial",this.defines={STANDARD:""},this.color=new lt(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new lt(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=uu,this.normalScale=new tt(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Ye,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.defines={STANDARD:""},this.color.copy(t.color),this.roughness=t.roughness,this.metalness=t.metalness,this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.emissive.copy(t.emissive),this.emissiveMap=t.emissiveMap,this.emissiveIntensity=t.emissiveIntensity,this.bumpMap=t.bumpMap,this.bumpScale=t.bumpScale,this.normalMap=t.normalMap,this.normalMapType=t.normalMapType,this.normalScale.copy(t.normalScale),this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.roughnessMap=t.roughnessMap,this.metalnessMap=t.metalnessMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.envMapIntensity=t.envMapIntensity,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.flatShading=t.flatShading,this.fog=t.fog,this}}class Qo extends _e{constructor(t){super(),this.isMeshPhysicalMaterial=!0,this.defines={STANDARD:"",PHYSICAL:""},this.type="MeshPhysicalMaterial",this.anisotropyRotation=0,this.anisotropyMap=null,this.clearcoatMap=null,this.clearcoatRoughness=0,this.clearcoatRoughnessMap=null,this.clearcoatNormalScale=new tt(1,1),this.clearcoatNormalMap=null,this.ior=1.5,Object.defineProperty(this,"reflectivity",{get:function(){return ie(2.5*(this.ior-1)/(this.ior+1),0,1)},set:function(e){this.ior=(1+.4*e)/(1-.4*e)}}),this.iridescenceMap=null,this.iridescenceIOR=1.3,this.iridescenceThicknessRange=[100,400],this.iridescenceThicknessMap=null,this.sheenColor=new lt(0),this.sheenColorMap=null,this.sheenRoughness=1,this.sheenRoughnessMap=null,this.transmissionMap=null,this.thickness=0,this.thicknessMap=null,this.attenuationDistance=1/0,this.attenuationColor=new lt(1,1,1),this.specularIntensity=1,this.specularIntensityMap=null,this.specularColor=new lt(1,1,1),this.specularColorMap=null,this._anisotropy=0,this._clearcoat=0,this._dispersion=0,this._iridescence=0,this._sheen=0,this._transmission=0,this.setValues(t)}get anisotropy(){return this._anisotropy}set anisotropy(t){this._anisotropy>0!=t>0&&this.version++,this._anisotropy=t}get clearcoat(){return this._clearcoat}set clearcoat(t){this._clearcoat>0!=t>0&&this.version++,this._clearcoat=t}get iridescence(){return this._iridescence}set iridescence(t){this._iridescence>0!=t>0&&this.version++,this._iridescence=t}get dispersion(){return this._dispersion}set dispersion(t){this._dispersion>0!=t>0&&this.version++,this._dispersion=t}get sheen(){return this._sheen}set sheen(t){this._sheen>0!=t>0&&this.version++,this._sheen=t}get transmission(){return this._transmission}set transmission(t){this._transmission>0!=t>0&&this.version++,this._transmission=t}copy(t){return super.copy(t),this.defines={STANDARD:"",PHYSICAL:""},this.anisotropy=t.anisotropy,this.anisotropyRotation=t.anisotropyRotation,this.anisotropyMap=t.anisotropyMap,this.clearcoat=t.clearcoat,this.clearcoatMap=t.clearcoatMap,this.clearcoatRoughness=t.clearcoatRoughness,this.clearcoatRoughnessMap=t.clearcoatRoughnessMap,this.clearcoatNormalMap=t.clearcoatNormalMap,this.clearcoatNormalScale.copy(t.clearcoatNormalScale),this.dispersion=t.dispersion,this.ior=t.ior,this.iridescence=t.iridescence,this.iridescenceMap=t.iridescenceMap,this.iridescenceIOR=t.iridescenceIOR,this.iridescenceThicknessRange=[...t.iridescenceThicknessRange],this.iridescenceThicknessMap=t.iridescenceThicknessMap,this.sheen=t.sheen,this.sheenColor.copy(t.sheenColor),this.sheenColorMap=t.sheenColorMap,this.sheenRoughness=t.sheenRoughness,this.sheenRoughnessMap=t.sheenRoughnessMap,this.transmission=t.transmission,this.transmissionMap=t.transmissionMap,this.thickness=t.thickness,this.thicknessMap=t.thicknessMap,this.attenuationDistance=t.attenuationDistance,this.attenuationColor.copy(t.attenuationColor),this.specularIntensity=t.specularIntensity,this.specularIntensityMap=t.specularIntensityMap,this.specularColor.copy(t.specularColor),this.specularColorMap=t.specularColorMap,this}}class I0 extends Li{constructor(t){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=Bd,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(t)}copy(t){return super.copy(t),this.depthPacking=t.depthPacking,this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this}}class L0 extends Li{constructor(t){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(t)}copy(t){return super.copy(t),this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this}}class ta extends pe{constructor(t,e=1){super(),this.isLight=!0,this.type="Light",this.color=new lt(t),this.intensity=e}dispose(){}copy(t,e){return super.copy(t,e),this.color.copy(t.color),this.intensity=t.intensity,this}toJSON(t){const e=super.toJSON(t);return e.object.color=this.color.getHex(),e.object.intensity=this.intensity,this.groundColor!==void 0&&(e.object.groundColor=this.groundColor.getHex()),this.distance!==void 0&&(e.object.distance=this.distance),this.angle!==void 0&&(e.object.angle=this.angle),this.decay!==void 0&&(e.object.decay=this.decay),this.penumbra!==void 0&&(e.object.penumbra=this.penumbra),this.shadow!==void 0&&(e.object.shadow=this.shadow.toJSON()),this.target!==void 0&&(e.object.target=this.target.uuid),e}}class U0 extends ta{constructor(t,e,n){super(t,n),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(pe.DEFAULT_UP),this.updateMatrix(),this.groundColor=new lt(e)}copy(t,e){return super.copy(t,e),this.groundColor.copy(t.groundColor),this}}const Ua=new Et,oh=new A,ah=new A;class ol{constructor(t){this.camera=t,this.intensity=1,this.bias=0,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new tt(512,512),this.mapType=ei,this.map=null,this.mapPass=null,this.matrix=new Et,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new Lr,this._frameExtents=new tt(1,1),this._viewportCount=1,this._viewports=[new be(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(t){const e=this.camera,n=this.matrix;oh.setFromMatrixPosition(t.matrixWorld),e.position.copy(oh),ah.setFromMatrixPosition(t.target.matrixWorld),e.lookAt(ah),e.updateMatrixWorld(),Ua.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),this._frustum.setFromProjectionMatrix(Ua,e.coordinateSystem,e.reversedDepth),e.reversedDepth?n.set(.5,0,0,.5,0,.5,0,.5,0,0,1,0,0,0,0,1):n.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),n.multiply(Ua)}getViewport(t){return this._viewports[t]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(t){return this.camera=t.camera.clone(),this.intensity=t.intensity,this.bias=t.bias,this.radius=t.radius,this.autoUpdate=t.autoUpdate,this.needsUpdate=t.needsUpdate,this.normalBias=t.normalBias,this.blurSamples=t.blurSamples,this.mapSize.copy(t.mapSize),this}clone(){return new this.constructor().copy(this)}toJSON(){const t={};return this.intensity!==1&&(t.intensity=this.intensity),this.bias!==0&&(t.bias=this.bias),this.normalBias!==0&&(t.normalBias=this.normalBias),this.radius!==1&&(t.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(t.mapSize=this.mapSize.toArray()),t.camera=this.camera.toJSON(!1).object,delete t.camera.matrix,t}}class N0 extends ol{constructor(){super(new ln(50,1,.5,500)),this.isSpotLightShadow=!0,this.focus=1,this.aspect=1}updateMatrices(t){const e=this.camera,n=ks*2*t.angle*this.focus,i=this.mapSize.width/this.mapSize.height*this.aspect,r=t.distance||e.far;(n!==e.fov||i!==e.aspect||r!==e.far)&&(e.fov=n,e.aspect=i,e.far=r,e.updateProjectionMatrix()),super.updateMatrices(t)}copy(t){return super.copy(t),this.focus=t.focus,this}}class F0 extends ta{constructor(t,e,n=0,i=Math.PI/3,r=0,o=2){super(t,e),this.isSpotLight=!0,this.type="SpotLight",this.position.copy(pe.DEFAULT_UP),this.updateMatrix(),this.target=new pe,this.distance=n,this.angle=i,this.penumbra=r,this.decay=o,this.map=null,this.shadow=new N0}get power(){return this.intensity*Math.PI}set power(t){this.intensity=t/Math.PI}dispose(){this.shadow.dispose()}copy(t,e){return super.copy(t,e),this.distance=t.distance,this.angle=t.angle,this.penumbra=t.penumbra,this.decay=t.decay,this.target=t.target.clone(),this.shadow=t.shadow.clone(),this}}const ch=new Et,rr=new A,Na=new A;class z0 extends ol{constructor(){super(new ln(90,1,.5,500)),this.isPointLightShadow=!0,this._frameExtents=new tt(4,2),this._viewportCount=6,this._viewports=[new be(2,1,1,1),new be(0,1,1,1),new be(3,1,1,1),new be(1,1,1,1),new be(3,0,1,1),new be(1,0,1,1)],this._cubeDirections=[new A(1,0,0),new A(-1,0,0),new A(0,0,1),new A(0,0,-1),new A(0,1,0),new A(0,-1,0)],this._cubeUps=[new A(0,1,0),new A(0,1,0),new A(0,1,0),new A(0,1,0),new A(0,0,1),new A(0,0,-1)]}updateMatrices(t,e=0){const n=this.camera,i=this.matrix,r=t.distance||n.far;r!==n.far&&(n.far=r,n.updateProjectionMatrix()),rr.setFromMatrixPosition(t.matrixWorld),n.position.copy(rr),Na.copy(n.position),Na.add(this._cubeDirections[e]),n.up.copy(this._cubeUps[e]),n.lookAt(Na),n.updateMatrixWorld(),i.makeTranslation(-rr.x,-rr.y,-rr.z),ch.multiplyMatrices(n.projectionMatrix,n.matrixWorldInverse),this._frustum.setFromProjectionMatrix(ch,n.coordinateSystem,n.reversedDepth)}}class O0 extends ta{constructor(t,e,n=0,i=2){super(t,e),this.isPointLight=!0,this.type="PointLight",this.distance=n,this.decay=i,this.shadow=new z0}get power(){return this.intensity*4*Math.PI}set power(t){this.intensity=t/(4*Math.PI)}dispose(){this.shadow.dispose()}copy(t,e){return super.copy(t,e),this.distance=t.distance,this.decay=t.decay,this.shadow=t.shadow.clone(),this}}class al extends _u{constructor(t=-1,e=1,n=1,i=-1,r=.1,o=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=t,this.right=e,this.top=n,this.bottom=i,this.near=r,this.far=o,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.left=t.left,this.right=t.right,this.top=t.top,this.bottom=t.bottom,this.near=t.near,this.far=t.far,this.zoom=t.zoom,this.view=t.view===null?null:Object.assign({},t.view),this}setViewOffset(t,e,n,i,r,o){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=i,this.view.width=r,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const t=(this.right-this.left)/(2*this.zoom),e=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,i=(this.top+this.bottom)/2;let r=n-t,o=n+t,a=i+e,c=i-e;if(this.view!==null&&this.view.enabled){const l=(this.right-this.left)/this.view.fullWidth/this.zoom,u=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=l*this.view.offsetX,o=r+l*this.view.width,a-=u*this.view.offsetY,c=a-u*this.view.height}this.projectionMatrix.makeOrthographic(r,o,a,c,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){const e=super.toJSON(t);return e.object.zoom=this.zoom,e.object.left=this.left,e.object.right=this.right,e.object.top=this.top,e.object.bottom=this.bottom,e.object.near=this.near,e.object.far=this.far,this.view!==null&&(e.object.view=Object.assign({},this.view)),e}}class B0 extends ol{constructor(){super(new al(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}}class k0 extends ta{constructor(t,e){super(t,e),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(pe.DEFAULT_UP),this.updateMatrix(),this.target=new pe,this.shadow=new B0}dispose(){this.shadow.dispose()}copy(t){return super.copy(t),this.target=t.target.clone(),this.shadow=t.shadow.clone(),this}}class V0 extends me{constructor(){super(),this.isInstancedBufferGeometry=!0,this.type="InstancedBufferGeometry",this.instanceCount=1/0}copy(t){return super.copy(t),this.instanceCount=t.instanceCount,this}toJSON(){const t=super.toJSON();return t.instanceCount=this.instanceCount,t.isInstancedBufferGeometry=!0,t}}class H0 extends ln{constructor(t=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=t}}class Nu{constructor(t=!0){this.autoStart=t,this.startTime=0,this.oldTime=0,this.elapsedTime=0,this.running=!1}start(){this.startTime=performance.now(),this.oldTime=this.startTime,this.elapsedTime=0,this.running=!0}stop(){this.getElapsedTime(),this.running=!1,this.autoStart=!1}getElapsedTime(){return this.getDelta(),this.elapsedTime}getDelta(){let t=0;if(this.autoStart&&!this.running)return this.start(),0;if(this.running){const e=performance.now();t=(e-this.oldTime)/1e3,this.oldTime=e,this.elapsedTime+=t}return t}}class lh{constructor(t=1,e=0,n=0){this.radius=t,this.phi=e,this.theta=n}set(t,e,n){return this.radius=t,this.phi=e,this.theta=n,this}copy(t){return this.radius=t.radius,this.phi=t.phi,this.theta=t.theta,this}makeSafe(){return this.phi=ie(this.phi,1e-6,Math.PI-1e-6),this}setFromVector3(t){return this.setFromCartesianCoords(t.x,t.y,t.z)}setFromCartesianCoords(t,e,n){return this.radius=Math.sqrt(t*t+e*e+n*n),this.radius===0?(this.theta=0,this.phi=0):(this.theta=Math.atan2(t,n),this.phi=Math.acos(ie(e/this.radius,-1,1))),this}clone(){return new this.constructor().copy(this)}}class G0 extends rs{constructor(t,e=null){super(),this.object=t,this.domElement=e,this.enabled=!0,this.state=-1,this.keys={},this.mouseButtons={LEFT:null,MIDDLE:null,RIGHT:null},this.touches={ONE:null,TWO:null}}connect(t){if(t===void 0){console.warn("THREE.Controls: connect() now requires an element.");return}this.domElement!==null&&this.disconnect(),this.domElement=t}disconnect(){}dispose(){}update(){}}function hh(s,t,e,n){const i=W0(n);switch(e){case cu:return s*t;case Zc:return s*t/i.components*i.byteLength;case Yo:return s*t/i.components*i.byteLength;case hu:return s*t*2/i.components*i.byteLength;case jc:return s*t*2/i.components*i.byteLength;case lu:return s*t*3/i.components*i.byteLength;case _n:return s*t*4/i.components*i.byteLength;case $c:return s*t*4/i.components*i.byteLength;case Eo:case Ao:return Math.floor((s+3)/4)*Math.floor((t+3)/4)*8;case Ro:case Co:return Math.floor((s+3)/4)*Math.floor((t+3)/4)*16;case lc:case uc:return Math.max(s,16)*Math.max(t,8)/4;case cc:case hc:return Math.max(s,8)*Math.max(t,8)/2;case dc:case fc:return Math.floor((s+3)/4)*Math.floor((t+3)/4)*8;case pc:return Math.floor((s+3)/4)*Math.floor((t+3)/4)*16;case mc:return Math.floor((s+3)/4)*Math.floor((t+3)/4)*16;case gc:return Math.floor((s+4)/5)*Math.floor((t+3)/4)*16;case vc:return Math.floor((s+4)/5)*Math.floor((t+4)/5)*16;case _c:return Math.floor((s+5)/6)*Math.floor((t+4)/5)*16;case xc:return Math.floor((s+5)/6)*Math.floor((t+5)/6)*16;case yc:return Math.floor((s+7)/8)*Math.floor((t+4)/5)*16;case Mc:return Math.floor((s+7)/8)*Math.floor((t+5)/6)*16;case bc:return Math.floor((s+7)/8)*Math.floor((t+7)/8)*16;case Sc:return Math.floor((s+9)/10)*Math.floor((t+4)/5)*16;case wc:return Math.floor((s+9)/10)*Math.floor((t+5)/6)*16;case Tc:return Math.floor((s+9)/10)*Math.floor((t+7)/8)*16;case Ec:return Math.floor((s+9)/10)*Math.floor((t+9)/10)*16;case Ac:return Math.floor((s+11)/12)*Math.floor((t+9)/10)*16;case Rc:return Math.floor((s+11)/12)*Math.floor((t+11)/12)*16;case Cc:case Pc:case Dc:return Math.ceil(s/4)*Math.ceil(t/4)*16;case Ic:case Lc:return Math.ceil(s/4)*Math.ceil(t/4)*8;case Uc:case Nc:return Math.ceil(s/4)*Math.ceil(t/4)*16}throw new Error(`Unable to determine texture byte length for ${e} format.`)}function W0(s){switch(s){case ei:case su:return{byteLength:1,components:1};case Tr:case ru:case Qn:return{byteLength:2,components:1};case qc:case Yc:return{byteLength:2,components:4};case Pi:case Xc:case An:return{byteLength:4,components:1};case ou:case au:return{byteLength:4,components:3}}throw new Error(`Unknown texture type ${s}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:Wc}}));typeof window<"u"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=Wc);function Fu(){let s=null,t=!1,e=null,n=null;function i(r,o){e(r,o),n=s.requestAnimationFrame(i)}return{start:function(){t!==!0&&e!==null&&(n=s.requestAnimationFrame(i),t=!0)},stop:function(){s.cancelAnimationFrame(n),t=!1},setAnimationLoop:function(r){e=r},setContext:function(r){s=r}}}function X0(s){const t=new WeakMap;function e(a,c){const l=a.array,u=a.usage,h=l.byteLength,p=s.createBuffer();s.bindBuffer(c,p),s.bufferData(c,l,u),a.onUploadCallback();let d;if(l instanceof Float32Array)d=s.FLOAT;else if(typeof Float16Array<"u"&&l instanceof Float16Array)d=s.HALF_FLOAT;else if(l instanceof Uint16Array)a.isFloat16BufferAttribute?d=s.HALF_FLOAT:d=s.UNSIGNED_SHORT;else if(l instanceof Int16Array)d=s.SHORT;else if(l instanceof Uint32Array)d=s.UNSIGNED_INT;else if(l instanceof Int32Array)d=s.INT;else if(l instanceof Int8Array)d=s.BYTE;else if(l instanceof Uint8Array)d=s.UNSIGNED_BYTE;else if(l instanceof Uint8ClampedArray)d=s.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+l);return{buffer:p,type:d,bytesPerElement:l.BYTES_PER_ELEMENT,version:a.version,size:h}}function n(a,c,l){const u=c.array,h=c.updateRanges;if(s.bindBuffer(l,a),h.length===0)s.bufferSubData(l,0,u);else{h.sort((d,m)=>d.start-m.start);let p=0;for(let d=1;d<h.length;d++){const m=h[p],v=h[d];v.start<=m.start+m.count+1?m.count=Math.max(m.count,v.start+v.count-m.start):(++p,h[p]=v)}h.length=p+1;for(let d=0,m=h.length;d<m;d++){const v=h[d];s.bufferSubData(l,v.start*u.BYTES_PER_ELEMENT,u,v.start,v.count)}c.clearUpdateRanges()}c.onUploadCallback()}function i(a){return a.isInterleavedBufferAttribute&&(a=a.data),t.get(a)}function r(a){a.isInterleavedBufferAttribute&&(a=a.data);const c=t.get(a);c&&(s.deleteBuffer(c.buffer),t.delete(a))}function o(a,c){if(a.isInterleavedBufferAttribute&&(a=a.data),a.isGLBufferAttribute){const u=t.get(a);(!u||u.version<a.version)&&t.set(a,{buffer:a.buffer,type:a.type,bytesPerElement:a.elementSize,version:a.version});return}const l=t.get(a);if(l===void 0)t.set(a,e(a,c));else if(l.version<a.version){if(l.size!==a.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");n(l.buffer,a,c),l.version=a.version}}return{get:i,remove:r,update:o}}var q0=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,Y0=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,Z0=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,j0=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,$0=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,K0=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,J0=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,Q0=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,tp=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec3 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 ).rgb;
	}
#endif`,ep=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,np=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,ip=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,sp=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,rp=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,op=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,ap=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,cp=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,lp=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,hp=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,up=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,dp=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,fp=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec3 vColor;
#endif`,pp=`#if defined( USE_COLOR_ALPHA )
	vColor = vec4( 1.0 );
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec3( 1.0 );
#endif
#ifdef USE_COLOR
	vColor *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.xyz *= instanceColor.xyz;
#endif
#ifdef USE_BATCHING_COLOR
	vec3 batchingColor = getBatchingColor( getIndirectIndex( gl_DrawID ) );
	vColor.xyz *= batchingColor.xyz;
#endif`,mp=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
}
mat3 transposeMat3( const in mat3 m ) {
	mat3 tmp;
	tmp[ 0 ] = vec3( m[ 0 ].x, m[ 1 ].x, m[ 2 ].x );
	tmp[ 1 ] = vec3( m[ 0 ].y, m[ 1 ].y, m[ 2 ].y );
	tmp[ 2 ] = vec3( m[ 0 ].z, m[ 1 ].z, m[ 2 ].z );
	return tmp;
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,gp=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,vp=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
	#ifdef FLIP_SIDED
		transformedTangent = - transformedTangent;
	#endif
#endif`,_p=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,xp=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,yp=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,Mp=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,bp="gl_FragColor = linearToOutputTexel( gl_FragColor );",Sp=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,wp=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );
	#else
		vec4 envColor = vec4( 0.0 );
	#endif
	#ifdef ENVMAP_BLENDING_MULTIPLY
		outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_MIX )
		outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_ADD )
		outgoingLight += envColor.xyz * specularStrength * reflectivity;
	#endif
#endif`,Tp=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,Ep=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,Ap=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,Rp=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,Cp=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,Pp=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,Dp=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,Ip=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,Lp=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,Up=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,Np=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,Fp=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,zp=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif`,Op=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );
			reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
#endif`,Bp=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,kp=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,Vp=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,Hp=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,Gp=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb * ( 1.0 - metalnessFactor );
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = mix( min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = mix( vec3( 0.04 ), diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.07, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,Wp=`struct PhysicalMaterial {
	vec3 diffuseColor;
	float roughness;
	vec3 specularColor;
	float specularF90;
	float dispersion;
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		float v = 0.5 / ( gv + gl );
		return saturate(v);
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColor;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transposeMat3( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float a = roughness < 0.25 ? -339.2 * r2 + 161.4 * roughness - 25.9 : -8.48 * r2 + 14.3 * roughness - 9.95;
	float b = roughness < 0.25 ? 44.0 * r2 - 23.7 * roughness + 3.26 : 1.97 * r2 - 3.27 * roughness + 0.72;
	float DG = exp( a * dotNV + b ) + ( roughness < 0.25 ? 0.0 : 0.1 * ( roughness - 0.25 ) );
	return saturate( DG * RECIPROCAL_PI );
}
vec2 DFGApprox( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	const vec4 c0 = vec4( - 1, - 0.0275, - 0.572, 0.022 );
	const vec4 c1 = vec4( 1, 0.0425, 1.04, - 0.04 );
	vec4 r = roughness * c0 + c1;
	float a004 = min( r.x * r.x, exp2( - 9.28 * dotNV ) ) * r.x + r.y;
	vec2 fab = vec2( - 1.04, 1.04 ) * a004 + r.zw;
	return fab;
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColor * t2.x + ( vec3( 1.0 ) - material.specularColor ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseColor * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
	#endif
	reflectedLight.directSpecular += irradiance * BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
	#endif
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnel, material.roughness, singleScattering, multiScattering );
	#else
		computeMultiscattering( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness, singleScattering, multiScattering );
	#endif
	vec3 totalScattering = singleScattering + multiScattering;
	vec3 diffuse = material.diffuseColor * ( 1.0 - max( max( totalScattering.r, totalScattering.g ), totalScattering.b ) );
	reflectedLight.indirectSpecular += radiance * singleScattering;
	reflectedLight.indirectSpecular += multiScattering * cosineWeightedIrradiance;
	reflectedLight.indirectDiffuse += diffuse * cosineWeightedIrradiance;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,Xp=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		material.iridescenceFresnel = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,qp=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD ) && defined( ENVMAP_TYPE_CUBE_UV )
		iblIrradiance += getIBLIrradiance( geometryNormal );
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		radiance += getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,Yp=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,Zp=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,jp=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,$p=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Kp=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,Jp=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,Qp=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,tm=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,em=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,nm=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,im=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,sm=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,rm=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,om=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,am=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,cm=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,lm=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,hm=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,um=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,dm=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,fm=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,pm=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,mm=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,gm=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,vm=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,_m=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,xm=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,ym=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return depth * ( near - far ) - near;
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return ( near * far ) / ( ( far - near ) * depth - far );
}`,Mm=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,bm=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,Sm=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,wm=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,Tm=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,Em=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,Am=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform sampler2D pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	float texture2DCompare( sampler2D depths, vec2 uv, float compare ) {
		float depth = unpackRGBAToDepth( texture2D( depths, uv ) );
		#ifdef USE_REVERSED_DEPTH_BUFFER
			return step( depth, compare );
		#else
			return step( compare, depth );
		#endif
	}
	vec2 texture2DDistribution( sampler2D shadow, vec2 uv ) {
		return unpackRGBATo2Half( texture2D( shadow, uv ) );
	}
	float VSMShadow( sampler2D shadow, vec2 uv, float compare ) {
		float occlusion = 1.0;
		vec2 distribution = texture2DDistribution( shadow, uv );
		#ifdef USE_REVERSED_DEPTH_BUFFER
			float hard_shadow = step( distribution.x, compare );
		#else
			float hard_shadow = step( compare, distribution.x );
		#endif
		if ( hard_shadow != 1.0 ) {
			float distance = compare - distribution.x;
			float variance = max( 0.00000, distribution.y * distribution.y );
			float softness_probability = variance / (variance + distance * distance );			softness_probability = clamp( ( softness_probability - 0.3 ) / ( 0.95 - 0.3 ), 0.0, 1.0 );			occlusion = clamp( max( hard_shadow, softness_probability ), 0.0, 1.0 );
		}
		return occlusion;
	}
	float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
		float shadow = 1.0;
		shadowCoord.xyz /= shadowCoord.w;
		shadowCoord.z += shadowBias;
		bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
		bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
		if ( frustumTest ) {
		#if defined( SHADOWMAP_TYPE_PCF )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx0 = - texelSize.x * shadowRadius;
			float dy0 = - texelSize.y * shadowRadius;
			float dx1 = + texelSize.x * shadowRadius;
			float dy1 = + texelSize.y * shadowRadius;
			float dx2 = dx0 / 2.0;
			float dy2 = dy0 / 2.0;
			float dx3 = dx1 / 2.0;
			float dy3 = dy1 / 2.0;
			shadow = (
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )
			) * ( 1.0 / 17.0 );
		#elif defined( SHADOWMAP_TYPE_PCF_SOFT )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx = texelSize.x;
			float dy = texelSize.y;
			vec2 uv = shadowCoord.xy;
			vec2 f = fract( uv * shadowMapSize + 0.5 );
			uv -= f * texelSize;
			shadow = (
				texture2DCompare( shadowMap, uv, shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( dx, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( 0.0, dy ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + texelSize, shadowCoord.z ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, 0.0 ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 0.0 ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, dy ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( 0.0, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 0.0, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( texture2DCompare( shadowMap, uv + vec2( dx, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( dx, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( mix( texture2DCompare( shadowMap, uv + vec2( -dx, -dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, -dy ), shadowCoord.z ),
						  f.x ),
					 mix( texture2DCompare( shadowMap, uv + vec2( -dx, 2.0 * dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 2.0 * dy ), shadowCoord.z ),
						  f.x ),
					 f.y )
			) * ( 1.0 / 9.0 );
		#elif defined( SHADOWMAP_TYPE_VSM )
			shadow = VSMShadow( shadowMap, shadowCoord.xy, shadowCoord.z );
		#else
			shadow = texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z );
		#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	vec2 cubeToUV( vec3 v, float texelSizeY ) {
		vec3 absV = abs( v );
		float scaleToCube = 1.0 / max( absV.x, max( absV.y, absV.z ) );
		absV *= scaleToCube;
		v *= scaleToCube * ( 1.0 - 2.0 * texelSizeY );
		vec2 planar = v.xy;
		float almostATexel = 1.5 * texelSizeY;
		float almostOne = 1.0 - almostATexel;
		if ( absV.z >= almostOne ) {
			if ( v.z > 0.0 )
				planar.x = 4.0 - v.x;
		} else if ( absV.x >= almostOne ) {
			float signX = sign( v.x );
			planar.x = v.z * signX + 2.0 * signX;
		} else if ( absV.y >= almostOne ) {
			float signY = sign( v.y );
			planar.x = v.x + 2.0 * signY + 2.0;
			planar.y = v.z * signY - 2.0;
		}
		return vec2( 0.125, 0.25 ) * planar + vec2( 0.375, 0.75 );
	}
	float getPointShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		
		float lightToPositionLength = length( lightToPosition );
		if ( lightToPositionLength - shadowCameraFar <= 0.0 && lightToPositionLength - shadowCameraNear >= 0.0 ) {
			float dp = ( lightToPositionLength - shadowCameraNear ) / ( shadowCameraFar - shadowCameraNear );			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			vec2 texelSize = vec2( 1.0 ) / ( shadowMapSize * vec2( 4.0, 2.0 ) );
			#if defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_PCF_SOFT ) || defined( SHADOWMAP_TYPE_VSM )
				vec2 offset = vec2( - 1, 1 ) * shadowRadius * texelSize.y;
				shadow = (
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxx, texelSize.y ), dp )
				) * ( 1.0 / 9.0 );
			#else
				shadow = texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp );
			#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
#endif`,Rm=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,Cm=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	vec3 shadowWorldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,Pm=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,Dm=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,Im=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,Lm=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,Um=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,Nm=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,Fm=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,zm=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,Om=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,Bm=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = inverseTransformDirection( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseColor, material.specularColor, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,km=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		#else
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,Vm=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,Hm=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,Gm=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,Wm=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`;const Xm=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,qm=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Ym=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Zm=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float flipEnvMap;
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,jm=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,$m=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Km=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,Jm=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	#ifdef USE_REVERSED_DEPTH_BUFFER
		float fragCoordZ = vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ];
	#else
		float fragCoordZ = 0.5 * vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ] + 0.5;
	#endif
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,Qm=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,tg=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main () {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = packDepthToRGBA( dist );
}`,eg=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,ng=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,ig=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,sg=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,rg=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,og=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,ag=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,cg=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,lg=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,hg=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,ug=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,dg=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <packing>
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( packNormalToRGB( normal ), diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,fg=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,pg=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,mg=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,gg=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
		float sheenEnergyComp = 1.0 - 0.157 * max3( material.sheenColor );
		outgoingLight = outgoingLight * sheenEnergyComp + sheenSpecularDirect + sheenSpecularIndirect;
	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,vg=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,_g=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,xg=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,yg=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Mg=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,bg=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <packing>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,Sg=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,wg=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,Jt={alphahash_fragment:q0,alphahash_pars_fragment:Y0,alphamap_fragment:Z0,alphamap_pars_fragment:j0,alphatest_fragment:$0,alphatest_pars_fragment:K0,aomap_fragment:J0,aomap_pars_fragment:Q0,batching_pars_vertex:tp,batching_vertex:ep,begin_vertex:np,beginnormal_vertex:ip,bsdfs:sp,iridescence_fragment:rp,bumpmap_pars_fragment:op,clipping_planes_fragment:ap,clipping_planes_pars_fragment:cp,clipping_planes_pars_vertex:lp,clipping_planes_vertex:hp,color_fragment:up,color_pars_fragment:dp,color_pars_vertex:fp,color_vertex:pp,common:mp,cube_uv_reflection_fragment:gp,defaultnormal_vertex:vp,displacementmap_pars_vertex:_p,displacementmap_vertex:xp,emissivemap_fragment:yp,emissivemap_pars_fragment:Mp,colorspace_fragment:bp,colorspace_pars_fragment:Sp,envmap_fragment:wp,envmap_common_pars_fragment:Tp,envmap_pars_fragment:Ep,envmap_pars_vertex:Ap,envmap_physical_pars_fragment:Op,envmap_vertex:Rp,fog_vertex:Cp,fog_pars_vertex:Pp,fog_fragment:Dp,fog_pars_fragment:Ip,gradientmap_pars_fragment:Lp,lightmap_pars_fragment:Up,lights_lambert_fragment:Np,lights_lambert_pars_fragment:Fp,lights_pars_begin:zp,lights_toon_fragment:Bp,lights_toon_pars_fragment:kp,lights_phong_fragment:Vp,lights_phong_pars_fragment:Hp,lights_physical_fragment:Gp,lights_physical_pars_fragment:Wp,lights_fragment_begin:Xp,lights_fragment_maps:qp,lights_fragment_end:Yp,logdepthbuf_fragment:Zp,logdepthbuf_pars_fragment:jp,logdepthbuf_pars_vertex:$p,logdepthbuf_vertex:Kp,map_fragment:Jp,map_pars_fragment:Qp,map_particle_fragment:tm,map_particle_pars_fragment:em,metalnessmap_fragment:nm,metalnessmap_pars_fragment:im,morphinstance_vertex:sm,morphcolor_vertex:rm,morphnormal_vertex:om,morphtarget_pars_vertex:am,morphtarget_vertex:cm,normal_fragment_begin:lm,normal_fragment_maps:hm,normal_pars_fragment:um,normal_pars_vertex:dm,normal_vertex:fm,normalmap_pars_fragment:pm,clearcoat_normal_fragment_begin:mm,clearcoat_normal_fragment_maps:gm,clearcoat_pars_fragment:vm,iridescence_pars_fragment:_m,opaque_fragment:xm,packing:ym,premultiplied_alpha_fragment:Mm,project_vertex:bm,dithering_fragment:Sm,dithering_pars_fragment:wm,roughnessmap_fragment:Tm,roughnessmap_pars_fragment:Em,shadowmap_pars_fragment:Am,shadowmap_pars_vertex:Rm,shadowmap_vertex:Cm,shadowmask_pars_fragment:Pm,skinbase_vertex:Dm,skinning_pars_vertex:Im,skinning_vertex:Lm,skinnormal_vertex:Um,specularmap_fragment:Nm,specularmap_pars_fragment:Fm,tonemapping_fragment:zm,tonemapping_pars_fragment:Om,transmission_fragment:Bm,transmission_pars_fragment:km,uv_pars_fragment:Vm,uv_pars_vertex:Hm,uv_vertex:Gm,worldpos_vertex:Wm,background_vert:Xm,background_frag:qm,backgroundCube_vert:Ym,backgroundCube_frag:Zm,cube_vert:jm,cube_frag:$m,depth_vert:Km,depth_frag:Jm,distanceRGBA_vert:Qm,distanceRGBA_frag:tg,equirect_vert:eg,equirect_frag:ng,linedashed_vert:ig,linedashed_frag:sg,meshbasic_vert:rg,meshbasic_frag:og,meshlambert_vert:ag,meshlambert_frag:cg,meshmatcap_vert:lg,meshmatcap_frag:hg,meshnormal_vert:ug,meshnormal_frag:dg,meshphong_vert:fg,meshphong_frag:pg,meshphysical_vert:mg,meshphysical_frag:gg,meshtoon_vert:vg,meshtoon_frag:_g,points_vert:xg,points_frag:yg,shadow_vert:Mg,shadow_frag:bg,sprite_vert:Sg,sprite_frag:wg},Mt={common:{diffuse:{value:new lt(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new ne},alphaMap:{value:null},alphaMapTransform:{value:new ne},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new ne}},envmap:{envMap:{value:null},envMapRotation:{value:new ne},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new ne}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new ne}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new ne},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new ne},normalScale:{value:new tt(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new ne},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new ne}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new ne}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new ne}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new lt(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new lt(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new ne},alphaTest:{value:0},uvTransform:{value:new ne}},sprite:{diffuse:{value:new lt(16777215)},opacity:{value:1},center:{value:new tt(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new ne},alphaMap:{value:null},alphaMapTransform:{value:new ne},alphaTest:{value:0}}},jn={basic:{uniforms:tn([Mt.common,Mt.specularmap,Mt.envmap,Mt.aomap,Mt.lightmap,Mt.fog]),vertexShader:Jt.meshbasic_vert,fragmentShader:Jt.meshbasic_frag},lambert:{uniforms:tn([Mt.common,Mt.specularmap,Mt.envmap,Mt.aomap,Mt.lightmap,Mt.emissivemap,Mt.bumpmap,Mt.normalmap,Mt.displacementmap,Mt.fog,Mt.lights,{emissive:{value:new lt(0)}}]),vertexShader:Jt.meshlambert_vert,fragmentShader:Jt.meshlambert_frag},phong:{uniforms:tn([Mt.common,Mt.specularmap,Mt.envmap,Mt.aomap,Mt.lightmap,Mt.emissivemap,Mt.bumpmap,Mt.normalmap,Mt.displacementmap,Mt.fog,Mt.lights,{emissive:{value:new lt(0)},specular:{value:new lt(1118481)},shininess:{value:30}}]),vertexShader:Jt.meshphong_vert,fragmentShader:Jt.meshphong_frag},standard:{uniforms:tn([Mt.common,Mt.envmap,Mt.aomap,Mt.lightmap,Mt.emissivemap,Mt.bumpmap,Mt.normalmap,Mt.displacementmap,Mt.roughnessmap,Mt.metalnessmap,Mt.fog,Mt.lights,{emissive:{value:new lt(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Jt.meshphysical_vert,fragmentShader:Jt.meshphysical_frag},toon:{uniforms:tn([Mt.common,Mt.aomap,Mt.lightmap,Mt.emissivemap,Mt.bumpmap,Mt.normalmap,Mt.displacementmap,Mt.gradientmap,Mt.fog,Mt.lights,{emissive:{value:new lt(0)}}]),vertexShader:Jt.meshtoon_vert,fragmentShader:Jt.meshtoon_frag},matcap:{uniforms:tn([Mt.common,Mt.bumpmap,Mt.normalmap,Mt.displacementmap,Mt.fog,{matcap:{value:null}}]),vertexShader:Jt.meshmatcap_vert,fragmentShader:Jt.meshmatcap_frag},points:{uniforms:tn([Mt.points,Mt.fog]),vertexShader:Jt.points_vert,fragmentShader:Jt.points_frag},dashed:{uniforms:tn([Mt.common,Mt.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Jt.linedashed_vert,fragmentShader:Jt.linedashed_frag},depth:{uniforms:tn([Mt.common,Mt.displacementmap]),vertexShader:Jt.depth_vert,fragmentShader:Jt.depth_frag},normal:{uniforms:tn([Mt.common,Mt.bumpmap,Mt.normalmap,Mt.displacementmap,{opacity:{value:1}}]),vertexShader:Jt.meshnormal_vert,fragmentShader:Jt.meshnormal_frag},sprite:{uniforms:tn([Mt.sprite,Mt.fog]),vertexShader:Jt.sprite_vert,fragmentShader:Jt.sprite_frag},background:{uniforms:{uvTransform:{value:new ne},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Jt.background_vert,fragmentShader:Jt.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new ne}},vertexShader:Jt.backgroundCube_vert,fragmentShader:Jt.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Jt.cube_vert,fragmentShader:Jt.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Jt.equirect_vert,fragmentShader:Jt.equirect_frag},distanceRGBA:{uniforms:tn([Mt.common,Mt.displacementmap,{referencePosition:{value:new A},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Jt.distanceRGBA_vert,fragmentShader:Jt.distanceRGBA_frag},shadow:{uniforms:tn([Mt.lights,Mt.fog,{color:{value:new lt(0)},opacity:{value:1}}]),vertexShader:Jt.shadow_vert,fragmentShader:Jt.shadow_frag}};jn.physical={uniforms:tn([jn.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new ne},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new ne},clearcoatNormalScale:{value:new tt(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new ne},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new ne},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new ne},sheen:{value:0},sheenColor:{value:new lt(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new ne},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new ne},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new ne},transmissionSamplerSize:{value:new tt},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new ne},attenuationDistance:{value:0},attenuationColor:{value:new lt(0)},specularColor:{value:new lt(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new ne},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new ne},anisotropyVector:{value:new tt},anisotropyMap:{value:null},anisotropyMapTransform:{value:new ne}}]),vertexShader:Jt.meshphysical_vert,fragmentShader:Jt.meshphysical_frag};const vo={r:0,b:0,g:0},Gi=new Ye,Tg=new Et;function Eg(s,t,e,n,i,r,o){const a=new lt(0);let c=r===!0?0:1,l,u,h=null,p=0,d=null;function m(_){let y=_.isScene===!0?_.background:null;return y&&y.isTexture&&(y=(_.backgroundBlurriness>0?e:t).get(y)),y}function v(_){let y=!1;const w=m(_);w===null?f(a,c):w&&w.isColor&&(f(w,1),y=!0);const S=s.xr.getEnvironmentBlendMode();S==="additive"?n.buffers.color.setClear(0,0,0,1,o):S==="alpha-blend"&&n.buffers.color.setClear(0,0,0,0,o),(s.autoClear||y)&&(n.buffers.depth.setTest(!0),n.buffers.depth.setMask(!0),n.buffers.color.setMask(!0),s.clear(s.autoClearColor,s.autoClearDepth,s.autoClearStencil))}function g(_,y){const w=m(y);w&&(w.isCubeTexture||w.mapping===qo)?(u===void 0&&(u=new ue(new We(1,1,1),new Be({name:"BackgroundCubeMaterial",uniforms:Vs(jn.backgroundCube.uniforms),vertexShader:jn.backgroundCube.vertexShader,fragmentShader:jn.backgroundCube.fragmentShader,side:nn,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),u.geometry.deleteAttribute("normal"),u.geometry.deleteAttribute("uv"),u.onBeforeRender=function(S,T,C){this.matrixWorld.copyPosition(C.matrixWorld)},Object.defineProperty(u.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),i.update(u)),Gi.copy(y.backgroundRotation),Gi.x*=-1,Gi.y*=-1,Gi.z*=-1,w.isCubeTexture&&w.isRenderTargetTexture===!1&&(Gi.y*=-1,Gi.z*=-1),u.material.uniforms.envMap.value=w,u.material.uniforms.flipEnvMap.value=w.isCubeTexture&&w.isRenderTargetTexture===!1?-1:1,u.material.uniforms.backgroundBlurriness.value=y.backgroundBlurriness,u.material.uniforms.backgroundIntensity.value=y.backgroundIntensity,u.material.uniforms.backgroundRotation.value.setFromMatrix4(Tg.makeRotationFromEuler(Gi)),u.material.toneMapped=fe.getTransfer(w.colorSpace)!==we,(h!==w||p!==w.version||d!==s.toneMapping)&&(u.material.needsUpdate=!0,h=w,p=w.version,d=s.toneMapping),u.layers.enableAll(),_.unshift(u,u.geometry,u.material,0,0,null)):w&&w.isTexture&&(l===void 0&&(l=new ue(new Ui(2,2),new Be({name:"BackgroundMaterial",uniforms:Vs(jn.background.uniforms),vertexShader:jn.background.vertexShader,fragmentShader:jn.background.fragmentShader,side:pi,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),l.geometry.deleteAttribute("normal"),Object.defineProperty(l.material,"map",{get:function(){return this.uniforms.t2D.value}}),i.update(l)),l.material.uniforms.t2D.value=w,l.material.uniforms.backgroundIntensity.value=y.backgroundIntensity,l.material.toneMapped=fe.getTransfer(w.colorSpace)!==we,w.matrixAutoUpdate===!0&&w.updateMatrix(),l.material.uniforms.uvTransform.value.copy(w.matrix),(h!==w||p!==w.version||d!==s.toneMapping)&&(l.material.needsUpdate=!0,h=w,p=w.version,d=s.toneMapping),l.layers.enableAll(),_.unshift(l,l.geometry,l.material,0,0,null))}function f(_,y){_.getRGB(vo,vu(s)),n.buffers.color.setClear(vo.r,vo.g,vo.b,y,o)}function x(){u!==void 0&&(u.geometry.dispose(),u.material.dispose(),u=void 0),l!==void 0&&(l.geometry.dispose(),l.material.dispose(),l=void 0)}return{getClearColor:function(){return a},setClearColor:function(_,y=1){a.set(_),c=y,f(a,c)},getClearAlpha:function(){return c},setClearAlpha:function(_){c=_,f(a,c)},render:v,addToRenderList:g,dispose:x}}function Ag(s,t){const e=s.getParameter(s.MAX_VERTEX_ATTRIBS),n={},i=p(null);let r=i,o=!1;function a(M,E,D,N,I){let F=!1;const z=h(N,D,E);r!==z&&(r=z,l(r.object)),F=d(M,N,D,I),F&&m(M,N,D,I),I!==null&&t.update(I,s.ELEMENT_ARRAY_BUFFER),(F||o)&&(o=!1,y(M,E,D,N),I!==null&&s.bindBuffer(s.ELEMENT_ARRAY_BUFFER,t.get(I).buffer))}function c(){return s.createVertexArray()}function l(M){return s.bindVertexArray(M)}function u(M){return s.deleteVertexArray(M)}function h(M,E,D){const N=D.wireframe===!0;let I=n[M.id];I===void 0&&(I={},n[M.id]=I);let F=I[E.id];F===void 0&&(F={},I[E.id]=F);let z=F[N];return z===void 0&&(z=p(c()),F[N]=z),z}function p(M){const E=[],D=[],N=[];for(let I=0;I<e;I++)E[I]=0,D[I]=0,N[I]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:E,enabledAttributes:D,attributeDivisors:N,object:M,attributes:{},index:null}}function d(M,E,D,N){const I=r.attributes,F=E.attributes;let z=0;const X=D.getAttributes();for(const k in X)if(X[k].location>=0){const rt=I[k];let Z=F[k];if(Z===void 0&&(k==="instanceMatrix"&&M.instanceMatrix&&(Z=M.instanceMatrix),k==="instanceColor"&&M.instanceColor&&(Z=M.instanceColor)),rt===void 0||rt.attribute!==Z||Z&&rt.data!==Z.data)return!0;z++}return r.attributesNum!==z||r.index!==N}function m(M,E,D,N){const I={},F=E.attributes;let z=0;const X=D.getAttributes();for(const k in X)if(X[k].location>=0){let rt=F[k];rt===void 0&&(k==="instanceMatrix"&&M.instanceMatrix&&(rt=M.instanceMatrix),k==="instanceColor"&&M.instanceColor&&(rt=M.instanceColor));const Z={};Z.attribute=rt,rt&&rt.data&&(Z.data=rt.data),I[k]=Z,z++}r.attributes=I,r.attributesNum=z,r.index=N}function v(){const M=r.newAttributes;for(let E=0,D=M.length;E<D;E++)M[E]=0}function g(M){f(M,0)}function f(M,E){const D=r.newAttributes,N=r.enabledAttributes,I=r.attributeDivisors;D[M]=1,N[M]===0&&(s.enableVertexAttribArray(M),N[M]=1),I[M]!==E&&(s.vertexAttribDivisor(M,E),I[M]=E)}function x(){const M=r.newAttributes,E=r.enabledAttributes;for(let D=0,N=E.length;D<N;D++)E[D]!==M[D]&&(s.disableVertexAttribArray(D),E[D]=0)}function _(M,E,D,N,I,F,z){z===!0?s.vertexAttribIPointer(M,E,D,I,F):s.vertexAttribPointer(M,E,D,N,I,F)}function y(M,E,D,N){v();const I=N.attributes,F=D.getAttributes(),z=E.defaultAttributeValues;for(const X in F){const k=F[X];if(k.location>=0){let K=I[X];if(K===void 0&&(X==="instanceMatrix"&&M.instanceMatrix&&(K=M.instanceMatrix),X==="instanceColor"&&M.instanceColor&&(K=M.instanceColor)),K!==void 0){const rt=K.normalized,Z=K.itemSize,mt=t.get(K);if(mt===void 0)continue;const Vt=mt.buffer,Zt=mt.type,Kt=mt.bytesPerElement,$=Zt===s.INT||Zt===s.UNSIGNED_INT||K.gpuType===Xc;if(K.isInterleavedBufferAttribute){const st=K.data,wt=st.stride,Lt=K.offset;if(st.isInstancedInterleavedBuffer){for(let Rt=0;Rt<k.locationSize;Rt++)f(k.location+Rt,st.meshPerAttribute);M.isInstancedMesh!==!0&&N._maxInstanceCount===void 0&&(N._maxInstanceCount=st.meshPerAttribute*st.count)}else for(let Rt=0;Rt<k.locationSize;Rt++)g(k.location+Rt);s.bindBuffer(s.ARRAY_BUFFER,Vt);for(let Rt=0;Rt<k.locationSize;Rt++)_(k.location+Rt,Z/k.locationSize,Zt,rt,wt*Kt,(Lt+Z/k.locationSize*Rt)*Kt,$)}else{if(K.isInstancedBufferAttribute){for(let st=0;st<k.locationSize;st++)f(k.location+st,K.meshPerAttribute);M.isInstancedMesh!==!0&&N._maxInstanceCount===void 0&&(N._maxInstanceCount=K.meshPerAttribute*K.count)}else for(let st=0;st<k.locationSize;st++)g(k.location+st);s.bindBuffer(s.ARRAY_BUFFER,Vt);for(let st=0;st<k.locationSize;st++)_(k.location+st,Z/k.locationSize,Zt,rt,Z*Kt,Z/k.locationSize*st*Kt,$)}}else if(z!==void 0){const rt=z[X];if(rt!==void 0)switch(rt.length){case 2:s.vertexAttrib2fv(k.location,rt);break;case 3:s.vertexAttrib3fv(k.location,rt);break;case 4:s.vertexAttrib4fv(k.location,rt);break;default:s.vertexAttrib1fv(k.location,rt)}}}}x()}function w(){C();for(const M in n){const E=n[M];for(const D in E){const N=E[D];for(const I in N)u(N[I].object),delete N[I];delete E[D]}delete n[M]}}function S(M){if(n[M.id]===void 0)return;const E=n[M.id];for(const D in E){const N=E[D];for(const I in N)u(N[I].object),delete N[I];delete E[D]}delete n[M.id]}function T(M){for(const E in n){const D=n[E];if(D[M.id]===void 0)continue;const N=D[M.id];for(const I in N)u(N[I].object),delete N[I];delete D[M.id]}}function C(){b(),o=!0,r!==i&&(r=i,l(r.object))}function b(){i.geometry=null,i.program=null,i.wireframe=!1}return{setup:a,reset:C,resetDefaultState:b,dispose:w,releaseStatesOfGeometry:S,releaseStatesOfProgram:T,initAttributes:v,enableAttribute:g,disableUnusedAttributes:x}}function Rg(s,t,e){let n;function i(l){n=l}function r(l,u){s.drawArrays(n,l,u),e.update(u,n,1)}function o(l,u,h){h!==0&&(s.drawArraysInstanced(n,l,u,h),e.update(u,n,h))}function a(l,u,h){if(h===0)return;t.get("WEBGL_multi_draw").multiDrawArraysWEBGL(n,l,0,u,0,h);let d=0;for(let m=0;m<h;m++)d+=u[m];e.update(d,n,1)}function c(l,u,h,p){if(h===0)return;const d=t.get("WEBGL_multi_draw");if(d===null)for(let m=0;m<l.length;m++)o(l[m],u[m],p[m]);else{d.multiDrawArraysInstancedWEBGL(n,l,0,u,0,p,0,h);let m=0;for(let v=0;v<h;v++)m+=u[v]*p[v];e.update(m,n,1)}}this.setMode=i,this.render=r,this.renderInstances=o,this.renderMultiDraw=a,this.renderMultiDrawInstances=c}function Cg(s,t,e,n){let i;function r(){if(i!==void 0)return i;if(t.has("EXT_texture_filter_anisotropic")===!0){const T=t.get("EXT_texture_filter_anisotropic");i=s.getParameter(T.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else i=0;return i}function o(T){return!(T!==_n&&n.convert(T)!==s.getParameter(s.IMPLEMENTATION_COLOR_READ_FORMAT))}function a(T){const C=T===Qn&&(t.has("EXT_color_buffer_half_float")||t.has("EXT_color_buffer_float"));return!(T!==ei&&n.convert(T)!==s.getParameter(s.IMPLEMENTATION_COLOR_READ_TYPE)&&T!==An&&!C)}function c(T){if(T==="highp"){if(s.getShaderPrecisionFormat(s.VERTEX_SHADER,s.HIGH_FLOAT).precision>0&&s.getShaderPrecisionFormat(s.FRAGMENT_SHADER,s.HIGH_FLOAT).precision>0)return"highp";T="mediump"}return T==="mediump"&&s.getShaderPrecisionFormat(s.VERTEX_SHADER,s.MEDIUM_FLOAT).precision>0&&s.getShaderPrecisionFormat(s.FRAGMENT_SHADER,s.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let l=e.precision!==void 0?e.precision:"highp";const u=c(l);u!==l&&(console.warn("THREE.WebGLRenderer:",l,"not supported, using",u,"instead."),l=u);const h=e.logarithmicDepthBuffer===!0,p=e.reversedDepthBuffer===!0&&t.has("EXT_clip_control"),d=s.getParameter(s.MAX_TEXTURE_IMAGE_UNITS),m=s.getParameter(s.MAX_VERTEX_TEXTURE_IMAGE_UNITS),v=s.getParameter(s.MAX_TEXTURE_SIZE),g=s.getParameter(s.MAX_CUBE_MAP_TEXTURE_SIZE),f=s.getParameter(s.MAX_VERTEX_ATTRIBS),x=s.getParameter(s.MAX_VERTEX_UNIFORM_VECTORS),_=s.getParameter(s.MAX_VARYING_VECTORS),y=s.getParameter(s.MAX_FRAGMENT_UNIFORM_VECTORS),w=m>0,S=s.getParameter(s.MAX_SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:r,getMaxPrecision:c,textureFormatReadable:o,textureTypeReadable:a,precision:l,logarithmicDepthBuffer:h,reversedDepthBuffer:p,maxTextures:d,maxVertexTextures:m,maxTextureSize:v,maxCubemapSize:g,maxAttributes:f,maxVertexUniforms:x,maxVaryings:_,maxFragmentUniforms:y,vertexTextures:w,maxSamples:S}}function Pg(s){const t=this;let e=null,n=0,i=!1,r=!1;const o=new wi,a=new ne,c={value:null,needsUpdate:!1};this.uniform=c,this.numPlanes=0,this.numIntersection=0,this.init=function(h,p){const d=h.length!==0||p||n!==0||i;return i=p,n=h.length,d},this.beginShadows=function(){r=!0,u(null)},this.endShadows=function(){r=!1},this.setGlobalState=function(h,p){e=u(h,p,0)},this.setState=function(h,p,d){const m=h.clippingPlanes,v=h.clipIntersection,g=h.clipShadows,f=s.get(h);if(!i||m===null||m.length===0||r&&!g)r?u(null):l();else{const x=r?0:n,_=x*4;let y=f.clippingState||null;c.value=y,y=u(m,p,_,d);for(let w=0;w!==_;++w)y[w]=e[w];f.clippingState=y,this.numIntersection=v?this.numPlanes:0,this.numPlanes+=x}};function l(){c.value!==e&&(c.value=e,c.needsUpdate=n>0),t.numPlanes=n,t.numIntersection=0}function u(h,p,d,m){const v=h!==null?h.length:0;let g=null;if(v!==0){if(g=c.value,m!==!0||g===null){const f=d+v*4,x=p.matrixWorldInverse;a.getNormalMatrix(x),(g===null||g.length<f)&&(g=new Float32Array(f));for(let _=0,y=d;_!==v;++_,y+=4)o.copy(h[_]).applyMatrix4(x,a),o.normal.toArray(g,y),g[y+3]=o.constant}c.value=g,c.needsUpdate=!0}return t.numPlanes=v,t.numIntersection=0,g}}function Dg(s){let t=new WeakMap;function e(o,a){return a===sc?o.mapping=zs:a===rc&&(o.mapping=Os),o}function n(o){if(o&&o.isTexture){const a=o.mapping;if(a===sc||a===rc)if(t.has(o)){const c=t.get(o).texture;return e(c,o.mapping)}else{const c=o.image;if(c&&c.height>0){const l=new Nf(c.height);return l.fromEquirectangularTexture(s,o),t.set(o,l),o.addEventListener("dispose",i),e(l.texture,o.mapping)}else return null}}return o}function i(o){const a=o.target;a.removeEventListener("dispose",i);const c=t.get(a);c!==void 0&&(t.delete(a),c.dispose())}function r(){t=new WeakMap}return{get:n,dispose:r}}const Is=4,uh=[.125,.215,.35,.446,.526,.582],$i=20,Fa=new al,dh=new lt;let za=null,Oa=0,Ba=0,ka=!1;const Zi=(1+Math.sqrt(5))/2,Ts=1/Zi,fh=[new A(-Zi,Ts,0),new A(Zi,Ts,0),new A(-Ts,0,Zi),new A(Ts,0,Zi),new A(0,Zi,-Ts),new A(0,Zi,Ts),new A(-1,1,-1),new A(1,1,-1),new A(-1,1,1),new A(1,1,1)],Ig=new A;class Vc{constructor(t){this._renderer=t,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(t,e=0,n=.1,i=100,r={}){const{size:o=256,position:a=Ig}=r;za=this._renderer.getRenderTarget(),Oa=this._renderer.getActiveCubeFace(),Ba=this._renderer.getActiveMipmapLevel(),ka=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(o);const c=this._allocateTargets();return c.depthBuffer=!0,this._sceneToCubeUV(t,n,i,c,a),e>0&&this._blur(c,0,0,e),this._applyPMREM(c),this._cleanup(c),c}fromEquirectangular(t,e=null){return this._fromTexture(t,e)}fromCubemap(t,e=null){return this._fromTexture(t,e)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=gh(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=mh(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(t){this._lodMax=Math.floor(Math.log2(t)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let t=0;t<this._lodPlanes.length;t++)this._lodPlanes[t].dispose()}_cleanup(t){this._renderer.setRenderTarget(za,Oa,Ba),this._renderer.xr.enabled=ka,t.scissorTest=!1,_o(t,0,0,t.width,t.height)}_fromTexture(t,e){t.mapping===zs||t.mapping===Os?this._setSize(t.image.length===0?16:t.image[0].width||t.image[0].image.width):this._setSize(t.image.width/4),za=this._renderer.getRenderTarget(),Oa=this._renderer.getActiveCubeFace(),Ba=this._renderer.getActiveMipmapLevel(),ka=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;const n=e||this._allocateTargets();return this._textureToCubeUV(t,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){const t=3*Math.max(this._cubeSize,112),e=4*this._cubeSize,n={magFilter:Kn,minFilter:Kn,generateMipmaps:!1,type:Qn,format:_n,colorSpace:Bs,depthBuffer:!1},i=ph(t,e,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==t||this._pingPongRenderTarget.height!==e){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=ph(t,e,n);const{_lodMax:r}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=Lg(r)),this._blurMaterial=Ug(r,t,e)}return i}_compileMaterial(t){const e=new ue(this._lodPlanes[0],t);this._renderer.compile(e,Fa)}_sceneToCubeUV(t,e,n,i,r){const c=new ln(90,1,e,n),l=[1,-1,1,1,1,1],u=[1,1,1,-1,-1,-1],h=this._renderer,p=h.autoClear,d=h.toneMapping;h.getClearColor(dh),h.toneMapping=Ci,h.autoClear=!1,h.state.buffers.depth.getReversed()&&(h.setRenderTarget(i),h.clearDepth(),h.setRenderTarget(null));const v=new Di({name:"PMREM.Background",side:nn,depthWrite:!1,depthTest:!1}),g=new ue(new We,v);let f=!1;const x=t.background;x?x.isColor&&(v.color.copy(x),t.background=null,f=!0):(v.color.copy(dh),f=!0);for(let _=0;_<6;_++){const y=_%3;y===0?(c.up.set(0,l[_],0),c.position.set(r.x,r.y,r.z),c.lookAt(r.x+u[_],r.y,r.z)):y===1?(c.up.set(0,0,l[_]),c.position.set(r.x,r.y,r.z),c.lookAt(r.x,r.y+u[_],r.z)):(c.up.set(0,l[_],0),c.position.set(r.x,r.y,r.z),c.lookAt(r.x,r.y,r.z+u[_]));const w=this._cubeSize;_o(i,y*w,_>2?w:0,w,w),h.setRenderTarget(i),f&&h.render(g,c),h.render(t,c)}g.geometry.dispose(),g.material.dispose(),h.toneMapping=d,h.autoClear=p,t.background=x}_textureToCubeUV(t,e){const n=this._renderer,i=t.mapping===zs||t.mapping===Os;i?(this._cubemapMaterial===null&&(this._cubemapMaterial=gh()),this._cubemapMaterial.uniforms.flipEnvMap.value=t.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=mh());const r=i?this._cubemapMaterial:this._equirectMaterial,o=new ue(this._lodPlanes[0],r),a=r.uniforms;a.envMap.value=t;const c=this._cubeSize;_o(e,0,0,3*c,2*c),n.setRenderTarget(e),n.render(o,Fa)}_applyPMREM(t){const e=this._renderer,n=e.autoClear;e.autoClear=!1;const i=this._lodPlanes.length;for(let r=1;r<i;r++){const o=Math.sqrt(this._sigmas[r]*this._sigmas[r]-this._sigmas[r-1]*this._sigmas[r-1]),a=fh[(i-r-1)%fh.length];this._blur(t,r-1,r,o,a)}e.autoClear=n}_blur(t,e,n,i,r){const o=this._pingPongRenderTarget;this._halfBlur(t,o,e,n,i,"latitudinal",r),this._halfBlur(o,t,n,n,i,"longitudinal",r)}_halfBlur(t,e,n,i,r,o,a){const c=this._renderer,l=this._blurMaterial;o!=="latitudinal"&&o!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");const u=3,h=new ue(this._lodPlanes[i],l),p=l.uniforms,d=this._sizeLods[n]-1,m=isFinite(r)?Math.PI/(2*d):2*Math.PI/(2*$i-1),v=r/m,g=isFinite(r)?1+Math.floor(u*v):$i;g>$i&&console.warn(`sigmaRadians, ${r}, is too large and will clip, as it requested ${g} samples when the maximum is set to ${$i}`);const f=[];let x=0;for(let T=0;T<$i;++T){const C=T/v,b=Math.exp(-C*C/2);f.push(b),T===0?x+=b:T<g&&(x+=2*b)}for(let T=0;T<f.length;T++)f[T]=f[T]/x;p.envMap.value=t.texture,p.samples.value=g,p.weights.value=f,p.latitudinal.value=o==="latitudinal",a&&(p.poleAxis.value=a);const{_lodMax:_}=this;p.dTheta.value=m,p.mipInt.value=_-n;const y=this._sizeLods[i],w=3*y*(i>_-Is?i-_+Is:0),S=4*(this._cubeSize-y);_o(e,w,S,3*y,2*y),c.setRenderTarget(e),c.render(h,Fa)}}function Lg(s){const t=[],e=[],n=[];let i=s;const r=s-Is+1+uh.length;for(let o=0;o<r;o++){const a=Math.pow(2,i);e.push(a);let c=1/a;o>s-Is?c=uh[o-s+Is-1]:o===0&&(c=0),n.push(c);const l=1/(a-2),u=-l,h=1+l,p=[u,u,h,u,h,h,u,u,h,h,u,h],d=6,m=6,v=3,g=2,f=1,x=new Float32Array(v*m*d),_=new Float32Array(g*m*d),y=new Float32Array(f*m*d);for(let S=0;S<d;S++){const T=S%3*2/3-1,C=S>2?0:-1,b=[T,C,0,T+2/3,C,0,T+2/3,C+1,0,T,C,0,T+2/3,C+1,0,T,C+1,0];x.set(b,v*m*S),_.set(p,g*m*S);const M=[S,S,S,S,S,S];y.set(M,f*m*S)}const w=new me;w.setAttribute("position",new Ae(x,v)),w.setAttribute("uv",new Ae(_,g)),w.setAttribute("faceIndex",new Ae(y,f)),t.push(w),i>Is&&i--}return{lodPlanes:t,sizeLods:e,sigmas:n}}function ph(s,t,e){const n=new Rn(s,t,e);return n.texture.mapping=qo,n.texture.name="PMREM.cubeUv",n.scissorTest=!0,n}function _o(s,t,e,n,i){s.viewport.set(t,e,n,i),s.scissor.set(t,e,n,i)}function Ug(s,t,e){const n=new Float32Array($i),i=new A(0,1,0);return new Be({name:"SphericalGaussianBlur",defines:{n:$i,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/e,CUBEUV_MAX_MIP:`${s}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:n},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:i}},vertexShader:cl(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		`,blending:di,depthTest:!1,depthWrite:!1})}function mh(){return new Be({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:cl(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:di,depthTest:!1,depthWrite:!1})}function gh(){return new Be({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:cl(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:di,depthTest:!1,depthWrite:!1})}function cl(){return`

		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	`}function Ng(s){let t=new WeakMap,e=null;function n(a){if(a&&a.isTexture){const c=a.mapping,l=c===sc||c===rc,u=c===zs||c===Os;if(l||u){let h=t.get(a);const p=h!==void 0?h.texture.pmremVersion:0;if(a.isRenderTargetTexture&&a.pmremVersion!==p)return e===null&&(e=new Vc(s)),h=l?e.fromEquirectangular(a,h):e.fromCubemap(a,h),h.texture.pmremVersion=a.pmremVersion,t.set(a,h),h.texture;if(h!==void 0)return h.texture;{const d=a.image;return l&&d&&d.height>0||u&&d&&i(d)?(e===null&&(e=new Vc(s)),h=l?e.fromEquirectangular(a):e.fromCubemap(a),h.texture.pmremVersion=a.pmremVersion,t.set(a,h),a.addEventListener("dispose",r),h.texture):null}}}return a}function i(a){let c=0;const l=6;for(let u=0;u<l;u++)a[u]!==void 0&&c++;return c===l}function r(a){const c=a.target;c.removeEventListener("dispose",r);const l=t.get(c);l!==void 0&&(t.delete(c),l.dispose())}function o(){t=new WeakMap,e!==null&&(e.dispose(),e=null)}return{get:n,dispose:o}}function Fg(s){const t={};function e(n){if(t[n]!==void 0)return t[n];let i;switch(n){case"WEBGL_depth_texture":i=s.getExtension("WEBGL_depth_texture")||s.getExtension("MOZ_WEBGL_depth_texture")||s.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":i=s.getExtension("EXT_texture_filter_anisotropic")||s.getExtension("MOZ_EXT_texture_filter_anisotropic")||s.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":i=s.getExtension("WEBGL_compressed_texture_s3tc")||s.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||s.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":i=s.getExtension("WEBGL_compressed_texture_pvrtc")||s.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:i=s.getExtension(n)}return t[n]=i,i}return{has:function(n){return e(n)!==null},init:function(){e("EXT_color_buffer_float"),e("WEBGL_clip_cull_distance"),e("OES_texture_float_linear"),e("EXT_color_buffer_half_float"),e("WEBGL_multisampled_render_to_texture"),e("WEBGL_render_shared_exponent")},get:function(n){const i=e(n);return i===null&&Cr("THREE.WebGLRenderer: "+n+" extension not supported."),i}}}function zg(s,t,e,n){const i={},r=new WeakMap;function o(h){const p=h.target;p.index!==null&&t.remove(p.index);for(const m in p.attributes)t.remove(p.attributes[m]);p.removeEventListener("dispose",o),delete i[p.id];const d=r.get(p);d&&(t.remove(d),r.delete(p)),n.releaseStatesOfGeometry(p),p.isInstancedBufferGeometry===!0&&delete p._maxInstanceCount,e.memory.geometries--}function a(h,p){return i[p.id]===!0||(p.addEventListener("dispose",o),i[p.id]=!0,e.memory.geometries++),p}function c(h){const p=h.attributes;for(const d in p)t.update(p[d],s.ARRAY_BUFFER)}function l(h){const p=[],d=h.index,m=h.attributes.position;let v=0;if(d!==null){const x=d.array;v=d.version;for(let _=0,y=x.length;_<y;_+=3){const w=x[_+0],S=x[_+1],T=x[_+2];p.push(w,S,S,T,T,w)}}else if(m!==void 0){const x=m.array;v=m.version;for(let _=0,y=x.length/3-1;_<y;_+=3){const w=_+0,S=_+1,T=_+2;p.push(w,S,S,T,T,w)}}else return;const g=new(fu(p)?tl:Qc)(p,1);g.version=v;const f=r.get(h);f&&t.remove(f),r.set(h,g)}function u(h){const p=r.get(h);if(p){const d=h.index;d!==null&&p.version<d.version&&l(h)}else l(h);return r.get(h)}return{get:a,update:c,getWireframeAttribute:u}}function Og(s,t,e){let n;function i(p){n=p}let r,o;function a(p){r=p.type,o=p.bytesPerElement}function c(p,d){s.drawElements(n,d,r,p*o),e.update(d,n,1)}function l(p,d,m){m!==0&&(s.drawElementsInstanced(n,d,r,p*o,m),e.update(d,n,m))}function u(p,d,m){if(m===0)return;t.get("WEBGL_multi_draw").multiDrawElementsWEBGL(n,d,0,r,p,0,m);let g=0;for(let f=0;f<m;f++)g+=d[f];e.update(g,n,1)}function h(p,d,m,v){if(m===0)return;const g=t.get("WEBGL_multi_draw");if(g===null)for(let f=0;f<p.length;f++)l(p[f]/o,d[f],v[f]);else{g.multiDrawElementsInstancedWEBGL(n,d,0,r,p,0,v,0,m);let f=0;for(let x=0;x<m;x++)f+=d[x]*v[x];e.update(f,n,1)}}this.setMode=i,this.setIndex=a,this.render=c,this.renderInstances=l,this.renderMultiDraw=u,this.renderMultiDrawInstances=h}function Bg(s){const t={geometries:0,textures:0},e={frame:0,calls:0,triangles:0,points:0,lines:0};function n(r,o,a){switch(e.calls++,o){case s.TRIANGLES:e.triangles+=a*(r/3);break;case s.LINES:e.lines+=a*(r/2);break;case s.LINE_STRIP:e.lines+=a*(r-1);break;case s.LINE_LOOP:e.lines+=a*r;break;case s.POINTS:e.points+=a*r;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",o);break}}function i(){e.calls=0,e.triangles=0,e.points=0,e.lines=0}return{memory:t,render:e,programs:null,autoReset:!0,reset:i,update:n}}function kg(s,t,e){const n=new WeakMap,i=new be;function r(o,a,c){const l=o.morphTargetInfluences,u=a.morphAttributes.position||a.morphAttributes.normal||a.morphAttributes.color,h=u!==void 0?u.length:0;let p=n.get(a);if(p===void 0||p.count!==h){let b=function(){T.dispose(),n.delete(a),a.removeEventListener("dispose",b)};p!==void 0&&p.texture.dispose();const d=a.morphAttributes.position!==void 0,m=a.morphAttributes.normal!==void 0,v=a.morphAttributes.color!==void 0,g=a.morphAttributes.position||[],f=a.morphAttributes.normal||[],x=a.morphAttributes.color||[];let _=0;d===!0&&(_=1),m===!0&&(_=2),v===!0&&(_=3);let y=a.attributes.position.count*_,w=1;y>t.maxTextureSize&&(w=Math.ceil(y/t.maxTextureSize),y=t.maxTextureSize);const S=new Float32Array(y*w*4*h),T=new pu(S,y,w,h);T.type=An,T.needsUpdate=!0;const C=_*4;for(let M=0;M<h;M++){const E=g[M],D=f[M],N=x[M],I=y*w*4*M;for(let F=0;F<E.count;F++){const z=F*C;d===!0&&(i.fromBufferAttribute(E,F),S[I+z+0]=i.x,S[I+z+1]=i.y,S[I+z+2]=i.z,S[I+z+3]=0),m===!0&&(i.fromBufferAttribute(D,F),S[I+z+4]=i.x,S[I+z+5]=i.y,S[I+z+6]=i.z,S[I+z+7]=0),v===!0&&(i.fromBufferAttribute(N,F),S[I+z+8]=i.x,S[I+z+9]=i.y,S[I+z+10]=i.z,S[I+z+11]=N.itemSize===4?i.w:1)}}p={count:h,texture:T,size:new tt(y,w)},n.set(a,p),a.addEventListener("dispose",b)}if(o.isInstancedMesh===!0&&o.morphTexture!==null)c.getUniforms().setValue(s,"morphTexture",o.morphTexture,e);else{let d=0;for(let v=0;v<l.length;v++)d+=l[v];const m=a.morphTargetsRelative?1:1-d;c.getUniforms().setValue(s,"morphTargetBaseInfluence",m),c.getUniforms().setValue(s,"morphTargetInfluences",l)}c.getUniforms().setValue(s,"morphTargetsTexture",p.texture,e),c.getUniforms().setValue(s,"morphTargetsTextureSize",p.size)}return{update:r}}function Vg(s,t,e,n){let i=new WeakMap;function r(c){const l=n.render.frame,u=c.geometry,h=t.get(c,u);if(i.get(h)!==l&&(t.update(h),i.set(h,l)),c.isInstancedMesh&&(c.hasEventListener("dispose",a)===!1&&c.addEventListener("dispose",a),i.get(c)!==l&&(e.update(c.instanceMatrix,s.ARRAY_BUFFER),c.instanceColor!==null&&e.update(c.instanceColor,s.ARRAY_BUFFER),i.set(c,l))),c.isSkinnedMesh){const p=c.skeleton;i.get(p)!==l&&(p.update(),i.set(p,l))}return h}function o(){i=new WeakMap}function a(c){const l=c.target;l.removeEventListener("dispose",a),e.remove(l.instanceMatrix),l.instanceColor!==null&&e.remove(l.instanceColor)}return{update:r,dispose:o}}const zu=new qe,vh=new wu(1,1),Ou=new pu,Bu=new xf,ku=new xu,_h=[],xh=[],yh=new Float32Array(16),Mh=new Float32Array(9),bh=new Float32Array(4);function Xs(s,t,e){const n=s[0];if(n<=0||n>0)return s;const i=t*e;let r=_h[i];if(r===void 0&&(r=new Float32Array(i),_h[i]=r),t!==0){n.toArray(r,0);for(let o=1,a=0;o!==t;++o)a+=e,s[o].toArray(r,a)}return r}function ke(s,t){if(s.length!==t.length)return!1;for(let e=0,n=s.length;e<n;e++)if(s[e]!==t[e])return!1;return!0}function Ve(s,t){for(let e=0,n=t.length;e<n;e++)s[e]=t[e]}function ea(s,t){let e=xh[t];e===void 0&&(e=new Int32Array(t),xh[t]=e);for(let n=0;n!==t;++n)e[n]=s.allocateTextureUnit();return e}function Hg(s,t){const e=this.cache;e[0]!==t&&(s.uniform1f(this.addr,t),e[0]=t)}function Gg(s,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(s.uniform2f(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(ke(e,t))return;s.uniform2fv(this.addr,t),Ve(e,t)}}function Wg(s,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(s.uniform3f(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else if(t.r!==void 0)(e[0]!==t.r||e[1]!==t.g||e[2]!==t.b)&&(s.uniform3f(this.addr,t.r,t.g,t.b),e[0]=t.r,e[1]=t.g,e[2]=t.b);else{if(ke(e,t))return;s.uniform3fv(this.addr,t),Ve(e,t)}}function Xg(s,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(s.uniform4f(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(ke(e,t))return;s.uniform4fv(this.addr,t),Ve(e,t)}}function qg(s,t){const e=this.cache,n=t.elements;if(n===void 0){if(ke(e,t))return;s.uniformMatrix2fv(this.addr,!1,t),Ve(e,t)}else{if(ke(e,n))return;bh.set(n),s.uniformMatrix2fv(this.addr,!1,bh),Ve(e,n)}}function Yg(s,t){const e=this.cache,n=t.elements;if(n===void 0){if(ke(e,t))return;s.uniformMatrix3fv(this.addr,!1,t),Ve(e,t)}else{if(ke(e,n))return;Mh.set(n),s.uniformMatrix3fv(this.addr,!1,Mh),Ve(e,n)}}function Zg(s,t){const e=this.cache,n=t.elements;if(n===void 0){if(ke(e,t))return;s.uniformMatrix4fv(this.addr,!1,t),Ve(e,t)}else{if(ke(e,n))return;yh.set(n),s.uniformMatrix4fv(this.addr,!1,yh),Ve(e,n)}}function jg(s,t){const e=this.cache;e[0]!==t&&(s.uniform1i(this.addr,t),e[0]=t)}function $g(s,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(s.uniform2i(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(ke(e,t))return;s.uniform2iv(this.addr,t),Ve(e,t)}}function Kg(s,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(s.uniform3i(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(ke(e,t))return;s.uniform3iv(this.addr,t),Ve(e,t)}}function Jg(s,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(s.uniform4i(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(ke(e,t))return;s.uniform4iv(this.addr,t),Ve(e,t)}}function Qg(s,t){const e=this.cache;e[0]!==t&&(s.uniform1ui(this.addr,t),e[0]=t)}function tv(s,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(s.uniform2ui(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(ke(e,t))return;s.uniform2uiv(this.addr,t),Ve(e,t)}}function ev(s,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(s.uniform3ui(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(ke(e,t))return;s.uniform3uiv(this.addr,t),Ve(e,t)}}function nv(s,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(s.uniform4ui(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(ke(e,t))return;s.uniform4uiv(this.addr,t),Ve(e,t)}}function iv(s,t,e){const n=this.cache,i=e.allocateTextureUnit();n[0]!==i&&(s.uniform1i(this.addr,i),n[0]=i);let r;this.type===s.SAMPLER_2D_SHADOW?(vh.compareFunction=du,r=vh):r=zu,e.setTexture2D(t||r,i)}function sv(s,t,e){const n=this.cache,i=e.allocateTextureUnit();n[0]!==i&&(s.uniform1i(this.addr,i),n[0]=i),e.setTexture3D(t||Bu,i)}function rv(s,t,e){const n=this.cache,i=e.allocateTextureUnit();n[0]!==i&&(s.uniform1i(this.addr,i),n[0]=i),e.setTextureCube(t||ku,i)}function ov(s,t,e){const n=this.cache,i=e.allocateTextureUnit();n[0]!==i&&(s.uniform1i(this.addr,i),n[0]=i),e.setTexture2DArray(t||Ou,i)}function av(s){switch(s){case 5126:return Hg;case 35664:return Gg;case 35665:return Wg;case 35666:return Xg;case 35674:return qg;case 35675:return Yg;case 35676:return Zg;case 5124:case 35670:return jg;case 35667:case 35671:return $g;case 35668:case 35672:return Kg;case 35669:case 35673:return Jg;case 5125:return Qg;case 36294:return tv;case 36295:return ev;case 36296:return nv;case 35678:case 36198:case 36298:case 36306:case 35682:return iv;case 35679:case 36299:case 36307:return sv;case 35680:case 36300:case 36308:case 36293:return rv;case 36289:case 36303:case 36311:case 36292:return ov}}function cv(s,t){s.uniform1fv(this.addr,t)}function lv(s,t){const e=Xs(t,this.size,2);s.uniform2fv(this.addr,e)}function hv(s,t){const e=Xs(t,this.size,3);s.uniform3fv(this.addr,e)}function uv(s,t){const e=Xs(t,this.size,4);s.uniform4fv(this.addr,e)}function dv(s,t){const e=Xs(t,this.size,4);s.uniformMatrix2fv(this.addr,!1,e)}function fv(s,t){const e=Xs(t,this.size,9);s.uniformMatrix3fv(this.addr,!1,e)}function pv(s,t){const e=Xs(t,this.size,16);s.uniformMatrix4fv(this.addr,!1,e)}function mv(s,t){s.uniform1iv(this.addr,t)}function gv(s,t){s.uniform2iv(this.addr,t)}function vv(s,t){s.uniform3iv(this.addr,t)}function _v(s,t){s.uniform4iv(this.addr,t)}function xv(s,t){s.uniform1uiv(this.addr,t)}function yv(s,t){s.uniform2uiv(this.addr,t)}function Mv(s,t){s.uniform3uiv(this.addr,t)}function bv(s,t){s.uniform4uiv(this.addr,t)}function Sv(s,t,e){const n=this.cache,i=t.length,r=ea(e,i);ke(n,r)||(s.uniform1iv(this.addr,r),Ve(n,r));for(let o=0;o!==i;++o)e.setTexture2D(t[o]||zu,r[o])}function wv(s,t,e){const n=this.cache,i=t.length,r=ea(e,i);ke(n,r)||(s.uniform1iv(this.addr,r),Ve(n,r));for(let o=0;o!==i;++o)e.setTexture3D(t[o]||Bu,r[o])}function Tv(s,t,e){const n=this.cache,i=t.length,r=ea(e,i);ke(n,r)||(s.uniform1iv(this.addr,r),Ve(n,r));for(let o=0;o!==i;++o)e.setTextureCube(t[o]||ku,r[o])}function Ev(s,t,e){const n=this.cache,i=t.length,r=ea(e,i);ke(n,r)||(s.uniform1iv(this.addr,r),Ve(n,r));for(let o=0;o!==i;++o)e.setTexture2DArray(t[o]||Ou,r[o])}function Av(s){switch(s){case 5126:return cv;case 35664:return lv;case 35665:return hv;case 35666:return uv;case 35674:return dv;case 35675:return fv;case 35676:return pv;case 5124:case 35670:return mv;case 35667:case 35671:return gv;case 35668:case 35672:return vv;case 35669:case 35673:return _v;case 5125:return xv;case 36294:return yv;case 36295:return Mv;case 36296:return bv;case 35678:case 36198:case 36298:case 36306:case 35682:return Sv;case 35679:case 36299:case 36307:return wv;case 35680:case 36300:case 36308:case 36293:return Tv;case 36289:case 36303:case 36311:case 36292:return Ev}}class Rv{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.setValue=av(e.type)}}class Cv{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.size=e.size,this.setValue=Av(e.type)}}class Pv{constructor(t){this.id=t,this.seq=[],this.map={}}setValue(t,e,n){const i=this.seq;for(let r=0,o=i.length;r!==o;++r){const a=i[r];a.setValue(t,e[a.id],n)}}}const Va=/(\w+)(\])?(\[|\.)?/g;function Sh(s,t){s.seq.push(t),s.map[t.id]=t}function Dv(s,t,e){const n=s.name,i=n.length;for(Va.lastIndex=0;;){const r=Va.exec(n),o=Va.lastIndex;let a=r[1];const c=r[2]==="]",l=r[3];if(c&&(a=a|0),l===void 0||l==="["&&o+2===i){Sh(e,l===void 0?new Rv(a,s,t):new Cv(a,s,t));break}else{let h=e.map[a];h===void 0&&(h=new Pv(a),Sh(e,h)),e=h}}}class Do{constructor(t,e){this.seq=[],this.map={};const n=t.getProgramParameter(e,t.ACTIVE_UNIFORMS);for(let i=0;i<n;++i){const r=t.getActiveUniform(e,i),o=t.getUniformLocation(e,r.name);Dv(r,o,this)}}setValue(t,e,n,i){const r=this.map[e];r!==void 0&&r.setValue(t,n,i)}setOptional(t,e,n){const i=e[n];i!==void 0&&this.setValue(t,n,i)}static upload(t,e,n,i){for(let r=0,o=e.length;r!==o;++r){const a=e[r],c=n[a.id];c.needsUpdate!==!1&&a.setValue(t,c.value,i)}}static seqWithValue(t,e){const n=[];for(let i=0,r=t.length;i!==r;++i){const o=t[i];o.id in e&&n.push(o)}return n}}function wh(s,t,e){const n=s.createShader(t);return s.shaderSource(n,e),s.compileShader(n),n}const Iv=37297;let Lv=0;function Uv(s,t){const e=s.split(`
`),n=[],i=Math.max(t-6,0),r=Math.min(t+6,e.length);for(let o=i;o<r;o++){const a=o+1;n.push(`${a===t?">":" "} ${a}: ${e[o]}`)}return n.join(`
`)}const Th=new ne;function Nv(s){fe._getMatrix(Th,fe.workingColorSpace,s);const t=`mat3( ${Th.elements.map(e=>e.toFixed(4))} )`;switch(fe.getTransfer(s)){case Fo:return[t,"LinearTransferOETF"];case we:return[t,"sRGBTransferOETF"];default:return console.warn("THREE.WebGLProgram: Unsupported color space: ",s),[t,"LinearTransferOETF"]}}function Eh(s,t,e){const n=s.getShaderParameter(t,s.COMPILE_STATUS),r=(s.getShaderInfoLog(t)||"").trim();if(n&&r==="")return"";const o=/ERROR: 0:(\d+)/.exec(r);if(o){const a=parseInt(o[1]);return e.toUpperCase()+`

`+r+`

`+Uv(s.getShaderSource(t),a)}else return r}function Fv(s,t){const e=Nv(t);return[`vec4 ${s}( vec4 value ) {`,`	return ${e[1]}( vec4( value.rgb * ${e[0]}, value.a ) );`,"}"].join(`
`)}function zv(s,t){let e;switch(t){case Id:e="Linear";break;case Ld:e="Reinhard";break;case Ud:e="Cineon";break;case nu:e="ACESFilmic";break;case Fd:e="AgX";break;case zd:e="Neutral";break;case Nd:e="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",t),e="Linear"}return"vec3 "+s+"( vec3 color ) { return "+e+"ToneMapping( color ); }"}const xo=new A;function Ov(){fe.getLuminanceCoefficients(xo);const s=xo.x.toFixed(4),t=xo.y.toFixed(4),e=xo.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${s}, ${t}, ${e} );`,"	return dot( weights, rgb );","}"].join(`
`)}function Bv(s){return[s.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",s.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(mr).join(`
`)}function kv(s){const t=[];for(const e in s){const n=s[e];n!==!1&&t.push("#define "+e+" "+n)}return t.join(`
`)}function Vv(s,t){const e={},n=s.getProgramParameter(t,s.ACTIVE_ATTRIBUTES);for(let i=0;i<n;i++){const r=s.getActiveAttrib(t,i),o=r.name;let a=1;r.type===s.FLOAT_MAT2&&(a=2),r.type===s.FLOAT_MAT3&&(a=3),r.type===s.FLOAT_MAT4&&(a=4),e[o]={type:r.type,location:s.getAttribLocation(t,o),locationSize:a}}return e}function mr(s){return s!==""}function Ah(s,t){const e=t.numSpotLightShadows+t.numSpotLightMaps-t.numSpotLightShadowsWithMaps;return s.replace(/NUM_DIR_LIGHTS/g,t.numDirLights).replace(/NUM_SPOT_LIGHTS/g,t.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,t.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,e).replace(/NUM_RECT_AREA_LIGHTS/g,t.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,t.numPointLights).replace(/NUM_HEMI_LIGHTS/g,t.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,t.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,t.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,t.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,t.numPointLightShadows)}function Rh(s,t){return s.replace(/NUM_CLIPPING_PLANES/g,t.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,t.numClippingPlanes-t.numClipIntersection)}const Hv=/^[ \t]*#include +<([\w\d./]+)>/gm;function Hc(s){return s.replace(Hv,Wv)}const Gv=new Map;function Wv(s,t){let e=Jt[t];if(e===void 0){const n=Gv.get(t);if(n!==void 0)e=Jt[n],console.warn('THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',t,n);else throw new Error("Can not resolve #include <"+t+">")}return Hc(e)}const Xv=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Ch(s){return s.replace(Xv,qv)}function qv(s,t,e,n){let i="";for(let r=parseInt(t);r<parseInt(e);r++)i+=n.replace(/\[\s*i\s*\]/g,"[ "+r+" ]").replace(/UNROLLED_LOOP_INDEX/g,r);return i}function Ph(s){let t=`precision ${s.precision} float;
	precision ${s.precision} int;
	precision ${s.precision} sampler2D;
	precision ${s.precision} samplerCube;
	precision ${s.precision} sampler3D;
	precision ${s.precision} sampler2DArray;
	precision ${s.precision} sampler2DShadow;
	precision ${s.precision} samplerCubeShadow;
	precision ${s.precision} sampler2DArrayShadow;
	precision ${s.precision} isampler2D;
	precision ${s.precision} isampler3D;
	precision ${s.precision} isamplerCube;
	precision ${s.precision} isampler2DArray;
	precision ${s.precision} usampler2D;
	precision ${s.precision} usampler3D;
	precision ${s.precision} usamplerCube;
	precision ${s.precision} usampler2DArray;
	`;return s.precision==="highp"?t+=`
#define HIGH_PRECISION`:s.precision==="mediump"?t+=`
#define MEDIUM_PRECISION`:s.precision==="lowp"&&(t+=`
#define LOW_PRECISION`),t}function Yv(s){let t="SHADOWMAP_TYPE_BASIC";return s.shadowMapType===Qh?t="SHADOWMAP_TYPE_PCF":s.shadowMapType===tu?t="SHADOWMAP_TYPE_PCF_SOFT":s.shadowMapType===ui&&(t="SHADOWMAP_TYPE_VSM"),t}function Zv(s){let t="ENVMAP_TYPE_CUBE";if(s.envMap)switch(s.envMapMode){case zs:case Os:t="ENVMAP_TYPE_CUBE";break;case qo:t="ENVMAP_TYPE_CUBE_UV";break}return t}function jv(s){let t="ENVMAP_MODE_REFLECTION";return s.envMap&&s.envMapMode===Os&&(t="ENVMAP_MODE_REFRACTION"),t}function $v(s){let t="ENVMAP_BLENDING_NONE";if(s.envMap)switch(s.combine){case eu:t="ENVMAP_BLENDING_MULTIPLY";break;case Pd:t="ENVMAP_BLENDING_MIX";break;case Dd:t="ENVMAP_BLENDING_ADD";break}return t}function Kv(s){const t=s.envMapCubeUVHeight;if(t===null)return null;const e=Math.log2(t)-2,n=1/t;return{texelWidth:1/(3*Math.max(Math.pow(2,e),112)),texelHeight:n,maxMip:e}}function Jv(s,t,e,n){const i=s.getContext(),r=e.defines;let o=e.vertexShader,a=e.fragmentShader;const c=Yv(e),l=Zv(e),u=jv(e),h=$v(e),p=Kv(e),d=Bv(e),m=kv(r),v=i.createProgram();let g,f,x=e.glslVersion?"#version "+e.glslVersion+`
`:"";e.isRawShaderMaterial?(g=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,m].filter(mr).join(`
`),g.length>0&&(g+=`
`),f=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,m].filter(mr).join(`
`),f.length>0&&(f+=`
`)):(g=[Ph(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,m,e.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",e.batching?"#define USE_BATCHING":"",e.batchingColor?"#define USE_BATCHING_COLOR":"",e.instancing?"#define USE_INSTANCING":"",e.instancingColor?"#define USE_INSTANCING_COLOR":"",e.instancingMorph?"#define USE_INSTANCING_MORPH":"",e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.map?"#define USE_MAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+u:"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.displacementMap?"#define USE_DISPLACEMENTMAP":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.mapUv?"#define MAP_UV "+e.mapUv:"",e.alphaMapUv?"#define ALPHAMAP_UV "+e.alphaMapUv:"",e.lightMapUv?"#define LIGHTMAP_UV "+e.lightMapUv:"",e.aoMapUv?"#define AOMAP_UV "+e.aoMapUv:"",e.emissiveMapUv?"#define EMISSIVEMAP_UV "+e.emissiveMapUv:"",e.bumpMapUv?"#define BUMPMAP_UV "+e.bumpMapUv:"",e.normalMapUv?"#define NORMALMAP_UV "+e.normalMapUv:"",e.displacementMapUv?"#define DISPLACEMENTMAP_UV "+e.displacementMapUv:"",e.metalnessMapUv?"#define METALNESSMAP_UV "+e.metalnessMapUv:"",e.roughnessMapUv?"#define ROUGHNESSMAP_UV "+e.roughnessMapUv:"",e.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+e.anisotropyMapUv:"",e.clearcoatMapUv?"#define CLEARCOATMAP_UV "+e.clearcoatMapUv:"",e.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+e.clearcoatNormalMapUv:"",e.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+e.clearcoatRoughnessMapUv:"",e.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+e.iridescenceMapUv:"",e.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+e.iridescenceThicknessMapUv:"",e.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+e.sheenColorMapUv:"",e.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+e.sheenRoughnessMapUv:"",e.specularMapUv?"#define SPECULARMAP_UV "+e.specularMapUv:"",e.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+e.specularColorMapUv:"",e.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+e.specularIntensityMapUv:"",e.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+e.transmissionMapUv:"",e.thicknessMapUv?"#define THICKNESSMAP_UV "+e.thicknessMapUv:"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.flatShading?"#define FLAT_SHADED":"",e.skinning?"#define USE_SKINNING":"",e.morphTargets?"#define USE_MORPHTARGETS":"",e.morphNormals&&e.flatShading===!1?"#define USE_MORPHNORMALS":"",e.morphColors?"#define USE_MORPHCOLORS":"",e.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+e.morphTextureStride:"",e.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+e.morphTargetsCount:"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+c:"",e.sizeAttenuation?"#define USE_SIZEATTENUATION":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",e.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(mr).join(`
`),f=[Ph(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,m,e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",e.map?"#define USE_MAP":"",e.matcap?"#define USE_MATCAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+l:"",e.envMap?"#define "+u:"",e.envMap?"#define "+h:"",p?"#define CUBEUV_TEXEL_WIDTH "+p.texelWidth:"",p?"#define CUBEUV_TEXEL_HEIGHT "+p.texelHeight:"",p?"#define CUBEUV_MAX_MIP "+p.maxMip+".0":"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoat?"#define USE_CLEARCOAT":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.dispersion?"#define USE_DISPERSION":"",e.iridescence?"#define USE_IRIDESCENCE":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaTest?"#define USE_ALPHATEST":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.sheen?"#define USE_SHEEN":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors||e.instancingColor||e.batchingColor?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.gradientMap?"#define USE_GRADIENTMAP":"",e.flatShading?"#define FLAT_SHADED":"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+c:"",e.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",e.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",e.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",e.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",e.toneMapping!==Ci?"#define TONE_MAPPING":"",e.toneMapping!==Ci?Jt.tonemapping_pars_fragment:"",e.toneMapping!==Ci?zv("toneMapping",e.toneMapping):"",e.dithering?"#define DITHERING":"",e.opaque?"#define OPAQUE":"",Jt.colorspace_pars_fragment,Fv("linearToOutputTexel",e.outputColorSpace),Ov(),e.useDepthPacking?"#define DEPTH_PACKING "+e.depthPacking:"",`
`].filter(mr).join(`
`)),o=Hc(o),o=Ah(o,e),o=Rh(o,e),a=Hc(a),a=Ah(a,e),a=Rh(a,e),o=Ch(o),a=Ch(a),e.isRawShaderMaterial!==!0&&(x=`#version 300 es
`,g=[d,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+g,f=["#define varying in",e.glslVersion===wl?"":"layout(location = 0) out highp vec4 pc_fragColor;",e.glslVersion===wl?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+f);const _=x+g+o,y=x+f+a,w=wh(i,i.VERTEX_SHADER,_),S=wh(i,i.FRAGMENT_SHADER,y);i.attachShader(v,w),i.attachShader(v,S),e.index0AttributeName!==void 0?i.bindAttribLocation(v,0,e.index0AttributeName):e.morphTargets===!0&&i.bindAttribLocation(v,0,"position"),i.linkProgram(v);function T(E){if(s.debug.checkShaderErrors){const D=i.getProgramInfoLog(v)||"",N=i.getShaderInfoLog(w)||"",I=i.getShaderInfoLog(S)||"",F=D.trim(),z=N.trim(),X=I.trim();let k=!0,K=!0;if(i.getProgramParameter(v,i.LINK_STATUS)===!1)if(k=!1,typeof s.debug.onShaderError=="function")s.debug.onShaderError(i,v,w,S);else{const rt=Eh(i,w,"vertex"),Z=Eh(i,S,"fragment");console.error("THREE.WebGLProgram: Shader Error "+i.getError()+" - VALIDATE_STATUS "+i.getProgramParameter(v,i.VALIDATE_STATUS)+`

Material Name: `+E.name+`
Material Type: `+E.type+`

Program Info Log: `+F+`
`+rt+`
`+Z)}else F!==""?console.warn("THREE.WebGLProgram: Program Info Log:",F):(z===""||X==="")&&(K=!1);K&&(E.diagnostics={runnable:k,programLog:F,vertexShader:{log:z,prefix:g},fragmentShader:{log:X,prefix:f}})}i.deleteShader(w),i.deleteShader(S),C=new Do(i,v),b=Vv(i,v)}let C;this.getUniforms=function(){return C===void 0&&T(this),C};let b;this.getAttributes=function(){return b===void 0&&T(this),b};let M=e.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return M===!1&&(M=i.getProgramParameter(v,Iv)),M},this.destroy=function(){n.releaseStatesOfProgram(this),i.deleteProgram(v),this.program=void 0},this.type=e.shaderType,this.name=e.shaderName,this.id=Lv++,this.cacheKey=t,this.usedTimes=1,this.program=v,this.vertexShader=w,this.fragmentShader=S,this}let Qv=0;class t_{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(t){const e=t.vertexShader,n=t.fragmentShader,i=this._getShaderStage(e),r=this._getShaderStage(n),o=this._getShaderCacheForMaterial(t);return o.has(i)===!1&&(o.add(i),i.usedTimes++),o.has(r)===!1&&(o.add(r),r.usedTimes++),this}remove(t){const e=this.materialCache.get(t);for(const n of e)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(t),this}getVertexShaderID(t){return this._getShaderStage(t.vertexShader).id}getFragmentShaderID(t){return this._getShaderStage(t.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(t){const e=this.materialCache;let n=e.get(t);return n===void 0&&(n=new Set,e.set(t,n)),n}_getShaderStage(t){const e=this.shaderCache;let n=e.get(t);return n===void 0&&(n=new e_(t),e.set(t,n)),n}}class e_{constructor(t){this.id=Qv++,this.code=t,this.usedTimes=0}}function n_(s,t,e,n,i,r,o){const a=new mu,c=new t_,l=new Set,u=[],h=i.logarithmicDepthBuffer,p=i.vertexTextures;let d=i.precision;const m={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function v(b){return l.add(b),b===0?"uv":`uv${b}`}function g(b,M,E,D,N){const I=D.fog,F=N.geometry,z=b.isMeshStandardMaterial?D.environment:null,X=(b.isMeshStandardMaterial?e:t).get(b.envMap||z),k=X&&X.mapping===qo?X.image.height:null,K=m[b.type];b.precision!==null&&(d=i.getMaxPrecision(b.precision),d!==b.precision&&console.warn("THREE.WebGLProgram.getParameters:",b.precision,"not supported, using",d,"instead."));const rt=F.morphAttributes.position||F.morphAttributes.normal||F.morphAttributes.color,Z=rt!==void 0?rt.length:0;let mt=0;F.morphAttributes.position!==void 0&&(mt=1),F.morphAttributes.normal!==void 0&&(mt=2),F.morphAttributes.color!==void 0&&(mt=3);let Vt,Zt,Kt,$;if(K){const ve=jn[K];Vt=ve.vertexShader,Zt=ve.fragmentShader}else Vt=b.vertexShader,Zt=b.fragmentShader,c.update(b),Kt=c.getVertexShaderID(b),$=c.getFragmentShaderID(b);const st=s.getRenderTarget(),wt=s.state.buffers.depth.getReversed(),Lt=N.isInstancedMesh===!0,Rt=N.isBatchedMesh===!0,ee=!!b.map,se=!!b.matcap,U=!!X,it=!!b.aoMap,J=!!b.lightMap,Q=!!b.bumpMap,et=!!b.normalMap,vt=!!b.displacementMap,ct=!!b.emissiveMap,xt=!!b.metalnessMap,Qt=!!b.roughnessMap,jt=b.anisotropy>0,L=b.clearcoat>0,R=b.dispersion>0,H=b.iridescence>0,Y=b.sheen>0,ot=b.transmission>0,j=jt&&!!b.anisotropyMap,zt=L&&!!b.clearcoatMap,gt=L&&!!b.clearcoatNormalMap,Ut=L&&!!b.clearcoatRoughnessMap,Nt=H&&!!b.iridescenceMap,ht=H&&!!b.iridescenceThicknessMap,At=Y&&!!b.sheenColorMap,qt=Y&&!!b.sheenRoughnessMap,Bt=!!b.specularMap,St=!!b.specularColorMap,re=!!b.specularIntensityMap,O=ot&&!!b.transmissionMap,ft=ot&&!!b.thicknessMap,yt=!!b.gradientMap,Dt=!!b.alphaMap,ut=b.alphaTest>0,nt=!!b.alphaHash,Ft=!!b.extensions;let te=Ci;b.toneMapped&&(st===null||st.isXRRenderTarget===!0)&&(te=s.toneMapping);const Re={shaderID:K,shaderType:b.type,shaderName:b.name,vertexShader:Vt,fragmentShader:Zt,defines:b.defines,customVertexShaderID:Kt,customFragmentShaderID:$,isRawShaderMaterial:b.isRawShaderMaterial===!0,glslVersion:b.glslVersion,precision:d,batching:Rt,batchingColor:Rt&&N._colorsTexture!==null,instancing:Lt,instancingColor:Lt&&N.instanceColor!==null,instancingMorph:Lt&&N.morphTexture!==null,supportsVertexTextures:p,outputColorSpace:st===null?s.outputColorSpace:st.isXRRenderTarget===!0?st.texture.colorSpace:Bs,alphaToCoverage:!!b.alphaToCoverage,map:ee,matcap:se,envMap:U,envMapMode:U&&X.mapping,envMapCubeUVHeight:k,aoMap:it,lightMap:J,bumpMap:Q,normalMap:et,displacementMap:p&&vt,emissiveMap:ct,normalMapObjectSpace:et&&b.normalMapType===Vd,normalMapTangentSpace:et&&b.normalMapType===uu,metalnessMap:xt,roughnessMap:Qt,anisotropy:jt,anisotropyMap:j,clearcoat:L,clearcoatMap:zt,clearcoatNormalMap:gt,clearcoatRoughnessMap:Ut,dispersion:R,iridescence:H,iridescenceMap:Nt,iridescenceThicknessMap:ht,sheen:Y,sheenColorMap:At,sheenRoughnessMap:qt,specularMap:Bt,specularColorMap:St,specularIntensityMap:re,transmission:ot,transmissionMap:O,thicknessMap:ft,gradientMap:yt,opaque:b.transparent===!1&&b.blending===Us&&b.alphaToCoverage===!1,alphaMap:Dt,alphaTest:ut,alphaHash:nt,combine:b.combine,mapUv:ee&&v(b.map.channel),aoMapUv:it&&v(b.aoMap.channel),lightMapUv:J&&v(b.lightMap.channel),bumpMapUv:Q&&v(b.bumpMap.channel),normalMapUv:et&&v(b.normalMap.channel),displacementMapUv:vt&&v(b.displacementMap.channel),emissiveMapUv:ct&&v(b.emissiveMap.channel),metalnessMapUv:xt&&v(b.metalnessMap.channel),roughnessMapUv:Qt&&v(b.roughnessMap.channel),anisotropyMapUv:j&&v(b.anisotropyMap.channel),clearcoatMapUv:zt&&v(b.clearcoatMap.channel),clearcoatNormalMapUv:gt&&v(b.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:Ut&&v(b.clearcoatRoughnessMap.channel),iridescenceMapUv:Nt&&v(b.iridescenceMap.channel),iridescenceThicknessMapUv:ht&&v(b.iridescenceThicknessMap.channel),sheenColorMapUv:At&&v(b.sheenColorMap.channel),sheenRoughnessMapUv:qt&&v(b.sheenRoughnessMap.channel),specularMapUv:Bt&&v(b.specularMap.channel),specularColorMapUv:St&&v(b.specularColorMap.channel),specularIntensityMapUv:re&&v(b.specularIntensityMap.channel),transmissionMapUv:O&&v(b.transmissionMap.channel),thicknessMapUv:ft&&v(b.thicknessMap.channel),alphaMapUv:Dt&&v(b.alphaMap.channel),vertexTangents:!!F.attributes.tangent&&(et||jt),vertexColors:b.vertexColors,vertexAlphas:b.vertexColors===!0&&!!F.attributes.color&&F.attributes.color.itemSize===4,pointsUvs:N.isPoints===!0&&!!F.attributes.uv&&(ee||Dt),fog:!!I,useFog:b.fog===!0,fogExp2:!!I&&I.isFogExp2,flatShading:b.flatShading===!0&&b.wireframe===!1,sizeAttenuation:b.sizeAttenuation===!0,logarithmicDepthBuffer:h,reversedDepthBuffer:wt,skinning:N.isSkinnedMesh===!0,morphTargets:F.morphAttributes.position!==void 0,morphNormals:F.morphAttributes.normal!==void 0,morphColors:F.morphAttributes.color!==void 0,morphTargetsCount:Z,morphTextureStride:mt,numDirLights:M.directional.length,numPointLights:M.point.length,numSpotLights:M.spot.length,numSpotLightMaps:M.spotLightMap.length,numRectAreaLights:M.rectArea.length,numHemiLights:M.hemi.length,numDirLightShadows:M.directionalShadowMap.length,numPointLightShadows:M.pointShadowMap.length,numSpotLightShadows:M.spotShadowMap.length,numSpotLightShadowsWithMaps:M.numSpotLightShadowsWithMaps,numLightProbes:M.numLightProbes,numClippingPlanes:o.numPlanes,numClipIntersection:o.numIntersection,dithering:b.dithering,shadowMapEnabled:s.shadowMap.enabled&&E.length>0,shadowMapType:s.shadowMap.type,toneMapping:te,decodeVideoTexture:ee&&b.map.isVideoTexture===!0&&fe.getTransfer(b.map.colorSpace)===we,decodeVideoTextureEmissive:ct&&b.emissiveMap.isVideoTexture===!0&&fe.getTransfer(b.emissiveMap.colorSpace)===we,premultipliedAlpha:b.premultipliedAlpha,doubleSided:b.side===Xe,flipSided:b.side===nn,useDepthPacking:b.depthPacking>=0,depthPacking:b.depthPacking||0,index0AttributeName:b.index0AttributeName,extensionClipCullDistance:Ft&&b.extensions.clipCullDistance===!0&&n.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(Ft&&b.extensions.multiDraw===!0||Rt)&&n.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:n.has("KHR_parallel_shader_compile"),customProgramCacheKey:b.customProgramCacheKey()};return Re.vertexUv1s=l.has(1),Re.vertexUv2s=l.has(2),Re.vertexUv3s=l.has(3),l.clear(),Re}function f(b){const M=[];if(b.shaderID?M.push(b.shaderID):(M.push(b.customVertexShaderID),M.push(b.customFragmentShaderID)),b.defines!==void 0)for(const E in b.defines)M.push(E),M.push(b.defines[E]);return b.isRawShaderMaterial===!1&&(x(M,b),_(M,b),M.push(s.outputColorSpace)),M.push(b.customProgramCacheKey),M.join()}function x(b,M){b.push(M.precision),b.push(M.outputColorSpace),b.push(M.envMapMode),b.push(M.envMapCubeUVHeight),b.push(M.mapUv),b.push(M.alphaMapUv),b.push(M.lightMapUv),b.push(M.aoMapUv),b.push(M.bumpMapUv),b.push(M.normalMapUv),b.push(M.displacementMapUv),b.push(M.emissiveMapUv),b.push(M.metalnessMapUv),b.push(M.roughnessMapUv),b.push(M.anisotropyMapUv),b.push(M.clearcoatMapUv),b.push(M.clearcoatNormalMapUv),b.push(M.clearcoatRoughnessMapUv),b.push(M.iridescenceMapUv),b.push(M.iridescenceThicknessMapUv),b.push(M.sheenColorMapUv),b.push(M.sheenRoughnessMapUv),b.push(M.specularMapUv),b.push(M.specularColorMapUv),b.push(M.specularIntensityMapUv),b.push(M.transmissionMapUv),b.push(M.thicknessMapUv),b.push(M.combine),b.push(M.fogExp2),b.push(M.sizeAttenuation),b.push(M.morphTargetsCount),b.push(M.morphAttributeCount),b.push(M.numDirLights),b.push(M.numPointLights),b.push(M.numSpotLights),b.push(M.numSpotLightMaps),b.push(M.numHemiLights),b.push(M.numRectAreaLights),b.push(M.numDirLightShadows),b.push(M.numPointLightShadows),b.push(M.numSpotLightShadows),b.push(M.numSpotLightShadowsWithMaps),b.push(M.numLightProbes),b.push(M.shadowMapType),b.push(M.toneMapping),b.push(M.numClippingPlanes),b.push(M.numClipIntersection),b.push(M.depthPacking)}function _(b,M){a.disableAll(),M.supportsVertexTextures&&a.enable(0),M.instancing&&a.enable(1),M.instancingColor&&a.enable(2),M.instancingMorph&&a.enable(3),M.matcap&&a.enable(4),M.envMap&&a.enable(5),M.normalMapObjectSpace&&a.enable(6),M.normalMapTangentSpace&&a.enable(7),M.clearcoat&&a.enable(8),M.iridescence&&a.enable(9),M.alphaTest&&a.enable(10),M.vertexColors&&a.enable(11),M.vertexAlphas&&a.enable(12),M.vertexUv1s&&a.enable(13),M.vertexUv2s&&a.enable(14),M.vertexUv3s&&a.enable(15),M.vertexTangents&&a.enable(16),M.anisotropy&&a.enable(17),M.alphaHash&&a.enable(18),M.batching&&a.enable(19),M.dispersion&&a.enable(20),M.batchingColor&&a.enable(21),M.gradientMap&&a.enable(22),b.push(a.mask),a.disableAll(),M.fog&&a.enable(0),M.useFog&&a.enable(1),M.flatShading&&a.enable(2),M.logarithmicDepthBuffer&&a.enable(3),M.reversedDepthBuffer&&a.enable(4),M.skinning&&a.enable(5),M.morphTargets&&a.enable(6),M.morphNormals&&a.enable(7),M.morphColors&&a.enable(8),M.premultipliedAlpha&&a.enable(9),M.shadowMapEnabled&&a.enable(10),M.doubleSided&&a.enable(11),M.flipSided&&a.enable(12),M.useDepthPacking&&a.enable(13),M.dithering&&a.enable(14),M.transmission&&a.enable(15),M.sheen&&a.enable(16),M.opaque&&a.enable(17),M.pointsUvs&&a.enable(18),M.decodeVideoTexture&&a.enable(19),M.decodeVideoTextureEmissive&&a.enable(20),M.alphaToCoverage&&a.enable(21),b.push(a.mask)}function y(b){const M=m[b.type];let E;if(M){const D=jn[M];E=Hs.clone(D.uniforms)}else E=b.uniforms;return E}function w(b,M){let E;for(let D=0,N=u.length;D<N;D++){const I=u[D];if(I.cacheKey===M){E=I,++E.usedTimes;break}}return E===void 0&&(E=new Jv(s,M,b,r),u.push(E)),E}function S(b){if(--b.usedTimes===0){const M=u.indexOf(b);u[M]=u[u.length-1],u.pop(),b.destroy()}}function T(b){c.remove(b)}function C(){c.dispose()}return{getParameters:g,getProgramCacheKey:f,getUniforms:y,acquireProgram:w,releaseProgram:S,releaseShaderCache:T,programs:u,dispose:C}}function i_(){let s=new WeakMap;function t(o){return s.has(o)}function e(o){let a=s.get(o);return a===void 0&&(a={},s.set(o,a)),a}function n(o){s.delete(o)}function i(o,a,c){s.get(o)[a]=c}function r(){s=new WeakMap}return{has:t,get:e,remove:n,update:i,dispose:r}}function s_(s,t){return s.groupOrder!==t.groupOrder?s.groupOrder-t.groupOrder:s.renderOrder!==t.renderOrder?s.renderOrder-t.renderOrder:s.material.id!==t.material.id?s.material.id-t.material.id:s.z!==t.z?s.z-t.z:s.id-t.id}function Dh(s,t){return s.groupOrder!==t.groupOrder?s.groupOrder-t.groupOrder:s.renderOrder!==t.renderOrder?s.renderOrder-t.renderOrder:s.z!==t.z?t.z-s.z:s.id-t.id}function Ih(){const s=[];let t=0;const e=[],n=[],i=[];function r(){t=0,e.length=0,n.length=0,i.length=0}function o(h,p,d,m,v,g){let f=s[t];return f===void 0?(f={id:h.id,object:h,geometry:p,material:d,groupOrder:m,renderOrder:h.renderOrder,z:v,group:g},s[t]=f):(f.id=h.id,f.object=h,f.geometry=p,f.material=d,f.groupOrder=m,f.renderOrder=h.renderOrder,f.z=v,f.group=g),t++,f}function a(h,p,d,m,v,g){const f=o(h,p,d,m,v,g);d.transmission>0?n.push(f):d.transparent===!0?i.push(f):e.push(f)}function c(h,p,d,m,v,g){const f=o(h,p,d,m,v,g);d.transmission>0?n.unshift(f):d.transparent===!0?i.unshift(f):e.unshift(f)}function l(h,p){e.length>1&&e.sort(h||s_),n.length>1&&n.sort(p||Dh),i.length>1&&i.sort(p||Dh)}function u(){for(let h=t,p=s.length;h<p;h++){const d=s[h];if(d.id===null)break;d.id=null,d.object=null,d.geometry=null,d.material=null,d.group=null}}return{opaque:e,transmissive:n,transparent:i,init:r,push:a,unshift:c,finish:u,sort:l}}function r_(){let s=new WeakMap;function t(n,i){const r=s.get(n);let o;return r===void 0?(o=new Ih,s.set(n,[o])):i>=r.length?(o=new Ih,r.push(o)):o=r[i],o}function e(){s=new WeakMap}return{get:t,dispose:e}}function o_(){const s={};return{get:function(t){if(s[t.id]!==void 0)return s[t.id];let e;switch(t.type){case"DirectionalLight":e={direction:new A,color:new lt};break;case"SpotLight":e={position:new A,direction:new A,color:new lt,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":e={position:new A,color:new lt,distance:0,decay:0};break;case"HemisphereLight":e={direction:new A,skyColor:new lt,groundColor:new lt};break;case"RectAreaLight":e={color:new lt,position:new A,halfWidth:new A,halfHeight:new A};break}return s[t.id]=e,e}}}function a_(){const s={};return{get:function(t){if(s[t.id]!==void 0)return s[t.id];let e;switch(t.type){case"DirectionalLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new tt};break;case"SpotLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new tt};break;case"PointLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new tt,shadowCameraNear:1,shadowCameraFar:1e3};break}return s[t.id]=e,e}}}let c_=0;function l_(s,t){return(t.castShadow?2:0)-(s.castShadow?2:0)+(t.map?1:0)-(s.map?1:0)}function h_(s){const t=new o_,e=a_(),n={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let l=0;l<9;l++)n.probe.push(new A);const i=new A,r=new Et,o=new Et;function a(l){let u=0,h=0,p=0;for(let b=0;b<9;b++)n.probe[b].set(0,0,0);let d=0,m=0,v=0,g=0,f=0,x=0,_=0,y=0,w=0,S=0,T=0;l.sort(l_);for(let b=0,M=l.length;b<M;b++){const E=l[b],D=E.color,N=E.intensity,I=E.distance,F=E.shadow&&E.shadow.map?E.shadow.map.texture:null;if(E.isAmbientLight)u+=D.r*N,h+=D.g*N,p+=D.b*N;else if(E.isLightProbe){for(let z=0;z<9;z++)n.probe[z].addScaledVector(E.sh.coefficients[z],N);T++}else if(E.isDirectionalLight){const z=t.get(E);if(z.color.copy(E.color).multiplyScalar(E.intensity),E.castShadow){const X=E.shadow,k=e.get(E);k.shadowIntensity=X.intensity,k.shadowBias=X.bias,k.shadowNormalBias=X.normalBias,k.shadowRadius=X.radius,k.shadowMapSize=X.mapSize,n.directionalShadow[d]=k,n.directionalShadowMap[d]=F,n.directionalShadowMatrix[d]=E.shadow.matrix,x++}n.directional[d]=z,d++}else if(E.isSpotLight){const z=t.get(E);z.position.setFromMatrixPosition(E.matrixWorld),z.color.copy(D).multiplyScalar(N),z.distance=I,z.coneCos=Math.cos(E.angle),z.penumbraCos=Math.cos(E.angle*(1-E.penumbra)),z.decay=E.decay,n.spot[v]=z;const X=E.shadow;if(E.map&&(n.spotLightMap[w]=E.map,w++,X.updateMatrices(E),E.castShadow&&S++),n.spotLightMatrix[v]=X.matrix,E.castShadow){const k=e.get(E);k.shadowIntensity=X.intensity,k.shadowBias=X.bias,k.shadowNormalBias=X.normalBias,k.shadowRadius=X.radius,k.shadowMapSize=X.mapSize,n.spotShadow[v]=k,n.spotShadowMap[v]=F,y++}v++}else if(E.isRectAreaLight){const z=t.get(E);z.color.copy(D).multiplyScalar(N),z.halfWidth.set(E.width*.5,0,0),z.halfHeight.set(0,E.height*.5,0),n.rectArea[g]=z,g++}else if(E.isPointLight){const z=t.get(E);if(z.color.copy(E.color).multiplyScalar(E.intensity),z.distance=E.distance,z.decay=E.decay,E.castShadow){const X=E.shadow,k=e.get(E);k.shadowIntensity=X.intensity,k.shadowBias=X.bias,k.shadowNormalBias=X.normalBias,k.shadowRadius=X.radius,k.shadowMapSize=X.mapSize,k.shadowCameraNear=X.camera.near,k.shadowCameraFar=X.camera.far,n.pointShadow[m]=k,n.pointShadowMap[m]=F,n.pointShadowMatrix[m]=E.shadow.matrix,_++}n.point[m]=z,m++}else if(E.isHemisphereLight){const z=t.get(E);z.skyColor.copy(E.color).multiplyScalar(N),z.groundColor.copy(E.groundColor).multiplyScalar(N),n.hemi[f]=z,f++}}g>0&&(s.has("OES_texture_float_linear")===!0?(n.rectAreaLTC1=Mt.LTC_FLOAT_1,n.rectAreaLTC2=Mt.LTC_FLOAT_2):(n.rectAreaLTC1=Mt.LTC_HALF_1,n.rectAreaLTC2=Mt.LTC_HALF_2)),n.ambient[0]=u,n.ambient[1]=h,n.ambient[2]=p;const C=n.hash;(C.directionalLength!==d||C.pointLength!==m||C.spotLength!==v||C.rectAreaLength!==g||C.hemiLength!==f||C.numDirectionalShadows!==x||C.numPointShadows!==_||C.numSpotShadows!==y||C.numSpotMaps!==w||C.numLightProbes!==T)&&(n.directional.length=d,n.spot.length=v,n.rectArea.length=g,n.point.length=m,n.hemi.length=f,n.directionalShadow.length=x,n.directionalShadowMap.length=x,n.pointShadow.length=_,n.pointShadowMap.length=_,n.spotShadow.length=y,n.spotShadowMap.length=y,n.directionalShadowMatrix.length=x,n.pointShadowMatrix.length=_,n.spotLightMatrix.length=y+w-S,n.spotLightMap.length=w,n.numSpotLightShadowsWithMaps=S,n.numLightProbes=T,C.directionalLength=d,C.pointLength=m,C.spotLength=v,C.rectAreaLength=g,C.hemiLength=f,C.numDirectionalShadows=x,C.numPointShadows=_,C.numSpotShadows=y,C.numSpotMaps=w,C.numLightProbes=T,n.version=c_++)}function c(l,u){let h=0,p=0,d=0,m=0,v=0;const g=u.matrixWorldInverse;for(let f=0,x=l.length;f<x;f++){const _=l[f];if(_.isDirectionalLight){const y=n.directional[h];y.direction.setFromMatrixPosition(_.matrixWorld),i.setFromMatrixPosition(_.target.matrixWorld),y.direction.sub(i),y.direction.transformDirection(g),h++}else if(_.isSpotLight){const y=n.spot[d];y.position.setFromMatrixPosition(_.matrixWorld),y.position.applyMatrix4(g),y.direction.setFromMatrixPosition(_.matrixWorld),i.setFromMatrixPosition(_.target.matrixWorld),y.direction.sub(i),y.direction.transformDirection(g),d++}else if(_.isRectAreaLight){const y=n.rectArea[m];y.position.setFromMatrixPosition(_.matrixWorld),y.position.applyMatrix4(g),o.identity(),r.copy(_.matrixWorld),r.premultiply(g),o.extractRotation(r),y.halfWidth.set(_.width*.5,0,0),y.halfHeight.set(0,_.height*.5,0),y.halfWidth.applyMatrix4(o),y.halfHeight.applyMatrix4(o),m++}else if(_.isPointLight){const y=n.point[p];y.position.setFromMatrixPosition(_.matrixWorld),y.position.applyMatrix4(g),p++}else if(_.isHemisphereLight){const y=n.hemi[v];y.direction.setFromMatrixPosition(_.matrixWorld),y.direction.transformDirection(g),v++}}}return{setup:a,setupView:c,state:n}}function Lh(s){const t=new h_(s),e=[],n=[];function i(u){l.camera=u,e.length=0,n.length=0}function r(u){e.push(u)}function o(u){n.push(u)}function a(){t.setup(e)}function c(u){t.setupView(e,u)}const l={lightsArray:e,shadowsArray:n,camera:null,lights:t,transmissionRenderTarget:{}};return{init:i,state:l,setupLights:a,setupLightsView:c,pushLight:r,pushShadow:o}}function u_(s){let t=new WeakMap;function e(i,r=0){const o=t.get(i);let a;return o===void 0?(a=new Lh(s),t.set(i,[a])):r>=o.length?(a=new Lh(s),o.push(a)):a=o[r],a}function n(){t=new WeakMap}return{get:e,dispose:n}}const d_=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,f_=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
#include <packing>
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = unpackRGBATo2Half( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ) );
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = unpackRGBAToDepth( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ) );
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( squared_mean - mean * mean );
	gl_FragColor = pack2HalfToRGBA( vec2( mean, std_dev ) );
}`;function p_(s,t,e){let n=new Lr;const i=new tt,r=new tt,o=new be,a=new I0({depthPacking:kd}),c=new L0,l={},u=e.maxTextureSize,h={[pi]:nn,[nn]:pi,[Xe]:Xe},p=new Be({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new tt},radius:{value:4}},vertexShader:d_,fragmentShader:f_}),d=p.clone();d.defines.HORIZONTAL_PASS=1;const m=new me;m.setAttribute("position",new Ae(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));const v=new ue(m,p),g=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=Qh;let f=this.type;this.render=function(S,T,C){if(g.enabled===!1||g.autoUpdate===!1&&g.needsUpdate===!1||S.length===0)return;const b=s.getRenderTarget(),M=s.getActiveCubeFace(),E=s.getActiveMipmapLevel(),D=s.state;D.setBlending(di),D.buffers.depth.getReversed()===!0?D.buffers.color.setClear(0,0,0,0):D.buffers.color.setClear(1,1,1,1),D.buffers.depth.setTest(!0),D.setScissorTest(!1);const N=f!==ui&&this.type===ui,I=f===ui&&this.type!==ui;for(let F=0,z=S.length;F<z;F++){const X=S[F],k=X.shadow;if(k===void 0){console.warn("THREE.WebGLShadowMap:",X,"has no shadow.");continue}if(k.autoUpdate===!1&&k.needsUpdate===!1)continue;i.copy(k.mapSize);const K=k.getFrameExtents();if(i.multiply(K),r.copy(k.mapSize),(i.x>u||i.y>u)&&(i.x>u&&(r.x=Math.floor(u/K.x),i.x=r.x*K.x,k.mapSize.x=r.x),i.y>u&&(r.y=Math.floor(u/K.y),i.y=r.y*K.y,k.mapSize.y=r.y)),k.map===null||N===!0||I===!0){const Z=this.type!==ui?{minFilter:yn,magFilter:yn}:{};k.map!==null&&k.map.dispose(),k.map=new Rn(i.x,i.y,Z),k.map.texture.name=X.name+".shadowMap",k.camera.updateProjectionMatrix()}s.setRenderTarget(k.map),s.clear();const rt=k.getViewportCount();for(let Z=0;Z<rt;Z++){const mt=k.getViewport(Z);o.set(r.x*mt.x,r.y*mt.y,r.x*mt.z,r.y*mt.w),D.viewport(o),k.updateMatrices(X,Z),n=k.getFrustum(),y(T,C,k.camera,X,this.type)}k.isPointLightShadow!==!0&&this.type===ui&&x(k,C),k.needsUpdate=!1}f=this.type,g.needsUpdate=!1,s.setRenderTarget(b,M,E)};function x(S,T){const C=t.update(v);p.defines.VSM_SAMPLES!==S.blurSamples&&(p.defines.VSM_SAMPLES=S.blurSamples,d.defines.VSM_SAMPLES=S.blurSamples,p.needsUpdate=!0,d.needsUpdate=!0),S.mapPass===null&&(S.mapPass=new Rn(i.x,i.y)),p.uniforms.shadow_pass.value=S.map.texture,p.uniforms.resolution.value=S.mapSize,p.uniforms.radius.value=S.radius,s.setRenderTarget(S.mapPass),s.clear(),s.renderBufferDirect(T,null,C,p,v,null),d.uniforms.shadow_pass.value=S.mapPass.texture,d.uniforms.resolution.value=S.mapSize,d.uniforms.radius.value=S.radius,s.setRenderTarget(S.map),s.clear(),s.renderBufferDirect(T,null,C,d,v,null)}function _(S,T,C,b){let M=null;const E=C.isPointLight===!0?S.customDistanceMaterial:S.customDepthMaterial;if(E!==void 0)M=E;else if(M=C.isPointLight===!0?c:a,s.localClippingEnabled&&T.clipShadows===!0&&Array.isArray(T.clippingPlanes)&&T.clippingPlanes.length!==0||T.displacementMap&&T.displacementScale!==0||T.alphaMap&&T.alphaTest>0||T.map&&T.alphaTest>0||T.alphaToCoverage===!0){const D=M.uuid,N=T.uuid;let I=l[D];I===void 0&&(I={},l[D]=I);let F=I[N];F===void 0&&(F=M.clone(),I[N]=F,T.addEventListener("dispose",w)),M=F}if(M.visible=T.visible,M.wireframe=T.wireframe,b===ui?M.side=T.shadowSide!==null?T.shadowSide:T.side:M.side=T.shadowSide!==null?T.shadowSide:h[T.side],M.alphaMap=T.alphaMap,M.alphaTest=T.alphaToCoverage===!0?.5:T.alphaTest,M.map=T.map,M.clipShadows=T.clipShadows,M.clippingPlanes=T.clippingPlanes,M.clipIntersection=T.clipIntersection,M.displacementMap=T.displacementMap,M.displacementScale=T.displacementScale,M.displacementBias=T.displacementBias,M.wireframeLinewidth=T.wireframeLinewidth,M.linewidth=T.linewidth,C.isPointLight===!0&&M.isMeshDistanceMaterial===!0){const D=s.properties.get(M);D.light=C}return M}function y(S,T,C,b,M){if(S.visible===!1)return;if(S.layers.test(T.layers)&&(S.isMesh||S.isLine||S.isPoints)&&(S.castShadow||S.receiveShadow&&M===ui)&&(!S.frustumCulled||n.intersectsObject(S))){S.modelViewMatrix.multiplyMatrices(C.matrixWorldInverse,S.matrixWorld);const N=t.update(S),I=S.material;if(Array.isArray(I)){const F=N.groups;for(let z=0,X=F.length;z<X;z++){const k=F[z],K=I[k.materialIndex];if(K&&K.visible){const rt=_(S,K,b,M);S.onBeforeShadow(s,S,T,C,N,rt,k),s.renderBufferDirect(C,null,N,rt,S,k),S.onAfterShadow(s,S,T,C,N,rt,k)}}}else if(I.visible){const F=_(S,I,b,M);S.onBeforeShadow(s,S,T,C,N,F,null),s.renderBufferDirect(C,null,N,F,S,null),S.onAfterShadow(s,S,T,C,N,F,null)}}const D=S.children;for(let N=0,I=D.length;N<I;N++)y(D[N],T,C,b,M)}function w(S){S.target.removeEventListener("dispose",w);for(const C in l){const b=l[C],M=S.target.uuid;M in b&&(b[M].dispose(),delete b[M])}}}const m_={[Ka]:Ja,[Qa]:nc,[tc]:ic,[Fs]:ec,[Ja]:Ka,[nc]:Qa,[ic]:tc,[ec]:Fs};function g_(s,t){function e(){let O=!1;const ft=new be;let yt=null;const Dt=new be(0,0,0,0);return{setMask:function(ut){yt!==ut&&!O&&(s.colorMask(ut,ut,ut,ut),yt=ut)},setLocked:function(ut){O=ut},setClear:function(ut,nt,Ft,te,Re){Re===!0&&(ut*=te,nt*=te,Ft*=te),ft.set(ut,nt,Ft,te),Dt.equals(ft)===!1&&(s.clearColor(ut,nt,Ft,te),Dt.copy(ft))},reset:function(){O=!1,yt=null,Dt.set(-1,0,0,0)}}}function n(){let O=!1,ft=!1,yt=null,Dt=null,ut=null;return{setReversed:function(nt){if(ft!==nt){const Ft=t.get("EXT_clip_control");nt?Ft.clipControlEXT(Ft.LOWER_LEFT_EXT,Ft.ZERO_TO_ONE_EXT):Ft.clipControlEXT(Ft.LOWER_LEFT_EXT,Ft.NEGATIVE_ONE_TO_ONE_EXT),ft=nt;const te=ut;ut=null,this.setClear(te)}},getReversed:function(){return ft},setTest:function(nt){nt?st(s.DEPTH_TEST):wt(s.DEPTH_TEST)},setMask:function(nt){yt!==nt&&!O&&(s.depthMask(nt),yt=nt)},setFunc:function(nt){if(ft&&(nt=m_[nt]),Dt!==nt){switch(nt){case Ka:s.depthFunc(s.NEVER);break;case Ja:s.depthFunc(s.ALWAYS);break;case Qa:s.depthFunc(s.LESS);break;case Fs:s.depthFunc(s.LEQUAL);break;case tc:s.depthFunc(s.EQUAL);break;case ec:s.depthFunc(s.GEQUAL);break;case nc:s.depthFunc(s.GREATER);break;case ic:s.depthFunc(s.NOTEQUAL);break;default:s.depthFunc(s.LEQUAL)}Dt=nt}},setLocked:function(nt){O=nt},setClear:function(nt){ut!==nt&&(ft&&(nt=1-nt),s.clearDepth(nt),ut=nt)},reset:function(){O=!1,yt=null,Dt=null,ut=null,ft=!1}}}function i(){let O=!1,ft=null,yt=null,Dt=null,ut=null,nt=null,Ft=null,te=null,Re=null;return{setTest:function(ve){O||(ve?st(s.STENCIL_TEST):wt(s.STENCIL_TEST))},setMask:function(ve){ft!==ve&&!O&&(s.stencilMask(ve),ft=ve)},setFunc:function(ve,ii,Gn){(yt!==ve||Dt!==ii||ut!==Gn)&&(s.stencilFunc(ve,ii,Gn),yt=ve,Dt=ii,ut=Gn)},setOp:function(ve,ii,Gn){(nt!==ve||Ft!==ii||te!==Gn)&&(s.stencilOp(ve,ii,Gn),nt=ve,Ft=ii,te=Gn)},setLocked:function(ve){O=ve},setClear:function(ve){Re!==ve&&(s.clearStencil(ve),Re=ve)},reset:function(){O=!1,ft=null,yt=null,Dt=null,ut=null,nt=null,Ft=null,te=null,Re=null}}}const r=new e,o=new n,a=new i,c=new WeakMap,l=new WeakMap;let u={},h={},p=new WeakMap,d=[],m=null,v=!1,g=null,f=null,x=null,_=null,y=null,w=null,S=null,T=new lt(0,0,0),C=0,b=!1,M=null,E=null,D=null,N=null,I=null;const F=s.getParameter(s.MAX_COMBINED_TEXTURE_IMAGE_UNITS);let z=!1,X=0;const k=s.getParameter(s.VERSION);k.indexOf("WebGL")!==-1?(X=parseFloat(/^WebGL (\d)/.exec(k)[1]),z=X>=1):k.indexOf("OpenGL ES")!==-1&&(X=parseFloat(/^OpenGL ES (\d)/.exec(k)[1]),z=X>=2);let K=null,rt={};const Z=s.getParameter(s.SCISSOR_BOX),mt=s.getParameter(s.VIEWPORT),Vt=new be().fromArray(Z),Zt=new be().fromArray(mt);function Kt(O,ft,yt,Dt){const ut=new Uint8Array(4),nt=s.createTexture();s.bindTexture(O,nt),s.texParameteri(O,s.TEXTURE_MIN_FILTER,s.NEAREST),s.texParameteri(O,s.TEXTURE_MAG_FILTER,s.NEAREST);for(let Ft=0;Ft<yt;Ft++)O===s.TEXTURE_3D||O===s.TEXTURE_2D_ARRAY?s.texImage3D(ft,0,s.RGBA,1,1,Dt,0,s.RGBA,s.UNSIGNED_BYTE,ut):s.texImage2D(ft+Ft,0,s.RGBA,1,1,0,s.RGBA,s.UNSIGNED_BYTE,ut);return nt}const $={};$[s.TEXTURE_2D]=Kt(s.TEXTURE_2D,s.TEXTURE_2D,1),$[s.TEXTURE_CUBE_MAP]=Kt(s.TEXTURE_CUBE_MAP,s.TEXTURE_CUBE_MAP_POSITIVE_X,6),$[s.TEXTURE_2D_ARRAY]=Kt(s.TEXTURE_2D_ARRAY,s.TEXTURE_2D_ARRAY,1,1),$[s.TEXTURE_3D]=Kt(s.TEXTURE_3D,s.TEXTURE_3D,1,1),r.setClear(0,0,0,1),o.setClear(1),a.setClear(0),st(s.DEPTH_TEST),o.setFunc(Fs),Q(!1),et(yl),st(s.CULL_FACE),it(di);function st(O){u[O]!==!0&&(s.enable(O),u[O]=!0)}function wt(O){u[O]!==!1&&(s.disable(O),u[O]=!1)}function Lt(O,ft){return h[O]!==ft?(s.bindFramebuffer(O,ft),h[O]=ft,O===s.DRAW_FRAMEBUFFER&&(h[s.FRAMEBUFFER]=ft),O===s.FRAMEBUFFER&&(h[s.DRAW_FRAMEBUFFER]=ft),!0):!1}function Rt(O,ft){let yt=d,Dt=!1;if(O){yt=p.get(ft),yt===void 0&&(yt=[],p.set(ft,yt));const ut=O.textures;if(yt.length!==ut.length||yt[0]!==s.COLOR_ATTACHMENT0){for(let nt=0,Ft=ut.length;nt<Ft;nt++)yt[nt]=s.COLOR_ATTACHMENT0+nt;yt.length=ut.length,Dt=!0}}else yt[0]!==s.BACK&&(yt[0]=s.BACK,Dt=!0);Dt&&s.drawBuffers(yt)}function ee(O){return m!==O?(s.useProgram(O),m=O,!0):!1}const se={[ji]:s.FUNC_ADD,[fd]:s.FUNC_SUBTRACT,[pd]:s.FUNC_REVERSE_SUBTRACT};se[md]=s.MIN,se[gd]=s.MAX;const U={[vd]:s.ZERO,[_d]:s.ONE,[xd]:s.SRC_COLOR,[ja]:s.SRC_ALPHA,[Td]:s.SRC_ALPHA_SATURATE,[Sd]:s.DST_COLOR,[Md]:s.DST_ALPHA,[yd]:s.ONE_MINUS_SRC_COLOR,[$a]:s.ONE_MINUS_SRC_ALPHA,[wd]:s.ONE_MINUS_DST_COLOR,[bd]:s.ONE_MINUS_DST_ALPHA,[Ed]:s.CONSTANT_COLOR,[Ad]:s.ONE_MINUS_CONSTANT_COLOR,[Rd]:s.CONSTANT_ALPHA,[Cd]:s.ONE_MINUS_CONSTANT_ALPHA};function it(O,ft,yt,Dt,ut,nt,Ft,te,Re,ve){if(O===di){v===!0&&(wt(s.BLEND),v=!1);return}if(v===!1&&(st(s.BLEND),v=!0),O!==dd){if(O!==g||ve!==b){if((f!==ji||y!==ji)&&(s.blendEquation(s.FUNC_ADD),f=ji,y=ji),ve)switch(O){case Us:s.blendFuncSeparate(s.ONE,s.ONE_MINUS_SRC_ALPHA,s.ONE,s.ONE_MINUS_SRC_ALPHA);break;case wr:s.blendFunc(s.ONE,s.ONE);break;case Ml:s.blendFuncSeparate(s.ZERO,s.ONE_MINUS_SRC_COLOR,s.ZERO,s.ONE);break;case bl:s.blendFuncSeparate(s.DST_COLOR,s.ONE_MINUS_SRC_ALPHA,s.ZERO,s.ONE);break;default:console.error("THREE.WebGLState: Invalid blending: ",O);break}else switch(O){case Us:s.blendFuncSeparate(s.SRC_ALPHA,s.ONE_MINUS_SRC_ALPHA,s.ONE,s.ONE_MINUS_SRC_ALPHA);break;case wr:s.blendFuncSeparate(s.SRC_ALPHA,s.ONE,s.ONE,s.ONE);break;case Ml:console.error("THREE.WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case bl:console.error("THREE.WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:console.error("THREE.WebGLState: Invalid blending: ",O);break}x=null,_=null,w=null,S=null,T.set(0,0,0),C=0,g=O,b=ve}return}ut=ut||ft,nt=nt||yt,Ft=Ft||Dt,(ft!==f||ut!==y)&&(s.blendEquationSeparate(se[ft],se[ut]),f=ft,y=ut),(yt!==x||Dt!==_||nt!==w||Ft!==S)&&(s.blendFuncSeparate(U[yt],U[Dt],U[nt],U[Ft]),x=yt,_=Dt,w=nt,S=Ft),(te.equals(T)===!1||Re!==C)&&(s.blendColor(te.r,te.g,te.b,Re),T.copy(te),C=Re),g=O,b=!1}function J(O,ft){O.side===Xe?wt(s.CULL_FACE):st(s.CULL_FACE);let yt=O.side===nn;ft&&(yt=!yt),Q(yt),O.blending===Us&&O.transparent===!1?it(di):it(O.blending,O.blendEquation,O.blendSrc,O.blendDst,O.blendEquationAlpha,O.blendSrcAlpha,O.blendDstAlpha,O.blendColor,O.blendAlpha,O.premultipliedAlpha),o.setFunc(O.depthFunc),o.setTest(O.depthTest),o.setMask(O.depthWrite),r.setMask(O.colorWrite);const Dt=O.stencilWrite;a.setTest(Dt),Dt&&(a.setMask(O.stencilWriteMask),a.setFunc(O.stencilFunc,O.stencilRef,O.stencilFuncMask),a.setOp(O.stencilFail,O.stencilZFail,O.stencilZPass)),ct(O.polygonOffset,O.polygonOffsetFactor,O.polygonOffsetUnits),O.alphaToCoverage===!0?st(s.SAMPLE_ALPHA_TO_COVERAGE):wt(s.SAMPLE_ALPHA_TO_COVERAGE)}function Q(O){M!==O&&(O?s.frontFace(s.CW):s.frontFace(s.CCW),M=O)}function et(O){O!==hd?(st(s.CULL_FACE),O!==E&&(O===yl?s.cullFace(s.BACK):O===ud?s.cullFace(s.FRONT):s.cullFace(s.FRONT_AND_BACK))):wt(s.CULL_FACE),E=O}function vt(O){O!==D&&(z&&s.lineWidth(O),D=O)}function ct(O,ft,yt){O?(st(s.POLYGON_OFFSET_FILL),(N!==ft||I!==yt)&&(s.polygonOffset(ft,yt),N=ft,I=yt)):wt(s.POLYGON_OFFSET_FILL)}function xt(O){O?st(s.SCISSOR_TEST):wt(s.SCISSOR_TEST)}function Qt(O){O===void 0&&(O=s.TEXTURE0+F-1),K!==O&&(s.activeTexture(O),K=O)}function jt(O,ft,yt){yt===void 0&&(K===null?yt=s.TEXTURE0+F-1:yt=K);let Dt=rt[yt];Dt===void 0&&(Dt={type:void 0,texture:void 0},rt[yt]=Dt),(Dt.type!==O||Dt.texture!==ft)&&(K!==yt&&(s.activeTexture(yt),K=yt),s.bindTexture(O,ft||$[O]),Dt.type=O,Dt.texture=ft)}function L(){const O=rt[K];O!==void 0&&O.type!==void 0&&(s.bindTexture(O.type,null),O.type=void 0,O.texture=void 0)}function R(){try{s.compressedTexImage2D(...arguments)}catch(O){console.error("THREE.WebGLState:",O)}}function H(){try{s.compressedTexImage3D(...arguments)}catch(O){console.error("THREE.WebGLState:",O)}}function Y(){try{s.texSubImage2D(...arguments)}catch(O){console.error("THREE.WebGLState:",O)}}function ot(){try{s.texSubImage3D(...arguments)}catch(O){console.error("THREE.WebGLState:",O)}}function j(){try{s.compressedTexSubImage2D(...arguments)}catch(O){console.error("THREE.WebGLState:",O)}}function zt(){try{s.compressedTexSubImage3D(...arguments)}catch(O){console.error("THREE.WebGLState:",O)}}function gt(){try{s.texStorage2D(...arguments)}catch(O){console.error("THREE.WebGLState:",O)}}function Ut(){try{s.texStorage3D(...arguments)}catch(O){console.error("THREE.WebGLState:",O)}}function Nt(){try{s.texImage2D(...arguments)}catch(O){console.error("THREE.WebGLState:",O)}}function ht(){try{s.texImage3D(...arguments)}catch(O){console.error("THREE.WebGLState:",O)}}function At(O){Vt.equals(O)===!1&&(s.scissor(O.x,O.y,O.z,O.w),Vt.copy(O))}function qt(O){Zt.equals(O)===!1&&(s.viewport(O.x,O.y,O.z,O.w),Zt.copy(O))}function Bt(O,ft){let yt=l.get(ft);yt===void 0&&(yt=new WeakMap,l.set(ft,yt));let Dt=yt.get(O);Dt===void 0&&(Dt=s.getUniformBlockIndex(ft,O.name),yt.set(O,Dt))}function St(O,ft){const Dt=l.get(ft).get(O);c.get(ft)!==Dt&&(s.uniformBlockBinding(ft,Dt,O.__bindingPointIndex),c.set(ft,Dt))}function re(){s.disable(s.BLEND),s.disable(s.CULL_FACE),s.disable(s.DEPTH_TEST),s.disable(s.POLYGON_OFFSET_FILL),s.disable(s.SCISSOR_TEST),s.disable(s.STENCIL_TEST),s.disable(s.SAMPLE_ALPHA_TO_COVERAGE),s.blendEquation(s.FUNC_ADD),s.blendFunc(s.ONE,s.ZERO),s.blendFuncSeparate(s.ONE,s.ZERO,s.ONE,s.ZERO),s.blendColor(0,0,0,0),s.colorMask(!0,!0,!0,!0),s.clearColor(0,0,0,0),s.depthMask(!0),s.depthFunc(s.LESS),o.setReversed(!1),s.clearDepth(1),s.stencilMask(4294967295),s.stencilFunc(s.ALWAYS,0,4294967295),s.stencilOp(s.KEEP,s.KEEP,s.KEEP),s.clearStencil(0),s.cullFace(s.BACK),s.frontFace(s.CCW),s.polygonOffset(0,0),s.activeTexture(s.TEXTURE0),s.bindFramebuffer(s.FRAMEBUFFER,null),s.bindFramebuffer(s.DRAW_FRAMEBUFFER,null),s.bindFramebuffer(s.READ_FRAMEBUFFER,null),s.useProgram(null),s.lineWidth(1),s.scissor(0,0,s.canvas.width,s.canvas.height),s.viewport(0,0,s.canvas.width,s.canvas.height),u={},K=null,rt={},h={},p=new WeakMap,d=[],m=null,v=!1,g=null,f=null,x=null,_=null,y=null,w=null,S=null,T=new lt(0,0,0),C=0,b=!1,M=null,E=null,D=null,N=null,I=null,Vt.set(0,0,s.canvas.width,s.canvas.height),Zt.set(0,0,s.canvas.width,s.canvas.height),r.reset(),o.reset(),a.reset()}return{buffers:{color:r,depth:o,stencil:a},enable:st,disable:wt,bindFramebuffer:Lt,drawBuffers:Rt,useProgram:ee,setBlending:it,setMaterial:J,setFlipSided:Q,setCullFace:et,setLineWidth:vt,setPolygonOffset:ct,setScissorTest:xt,activeTexture:Qt,bindTexture:jt,unbindTexture:L,compressedTexImage2D:R,compressedTexImage3D:H,texImage2D:Nt,texImage3D:ht,updateUBOMapping:Bt,uniformBlockBinding:St,texStorage2D:gt,texStorage3D:Ut,texSubImage2D:Y,texSubImage3D:ot,compressedTexSubImage2D:j,compressedTexSubImage3D:zt,scissor:At,viewport:qt,reset:re}}function v_(s,t,e,n,i,r,o){const a=t.has("WEBGL_multisampled_render_to_texture")?t.get("WEBGL_multisampled_render_to_texture"):null,c=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),l=new tt,u=new WeakMap;let h;const p=new WeakMap;let d=!1;try{d=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function m(L,R){return d?new OffscreenCanvas(L,R):Bo("canvas")}function v(L,R,H){let Y=1;const ot=jt(L);if((ot.width>H||ot.height>H)&&(Y=H/Math.max(ot.width,ot.height)),Y<1)if(typeof HTMLImageElement<"u"&&L instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&L instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&L instanceof ImageBitmap||typeof VideoFrame<"u"&&L instanceof VideoFrame){const j=Math.floor(Y*ot.width),zt=Math.floor(Y*ot.height);h===void 0&&(h=m(j,zt));const gt=R?m(j,zt):h;return gt.width=j,gt.height=zt,gt.getContext("2d").drawImage(L,0,0,j,zt),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+ot.width+"x"+ot.height+") to ("+j+"x"+zt+")."),gt}else return"data"in L&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+ot.width+"x"+ot.height+")."),L;return L}function g(L){return L.generateMipmaps}function f(L){s.generateMipmap(L)}function x(L){return L.isWebGLCubeRenderTarget?s.TEXTURE_CUBE_MAP:L.isWebGL3DRenderTarget?s.TEXTURE_3D:L.isWebGLArrayRenderTarget||L.isCompressedArrayTexture?s.TEXTURE_2D_ARRAY:s.TEXTURE_2D}function _(L,R,H,Y,ot=!1){if(L!==null){if(s[L]!==void 0)return s[L];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+L+"'")}let j=R;if(R===s.RED&&(H===s.FLOAT&&(j=s.R32F),H===s.HALF_FLOAT&&(j=s.R16F),H===s.UNSIGNED_BYTE&&(j=s.R8)),R===s.RED_INTEGER&&(H===s.UNSIGNED_BYTE&&(j=s.R8UI),H===s.UNSIGNED_SHORT&&(j=s.R16UI),H===s.UNSIGNED_INT&&(j=s.R32UI),H===s.BYTE&&(j=s.R8I),H===s.SHORT&&(j=s.R16I),H===s.INT&&(j=s.R32I)),R===s.RG&&(H===s.FLOAT&&(j=s.RG32F),H===s.HALF_FLOAT&&(j=s.RG16F),H===s.UNSIGNED_BYTE&&(j=s.RG8)),R===s.RG_INTEGER&&(H===s.UNSIGNED_BYTE&&(j=s.RG8UI),H===s.UNSIGNED_SHORT&&(j=s.RG16UI),H===s.UNSIGNED_INT&&(j=s.RG32UI),H===s.BYTE&&(j=s.RG8I),H===s.SHORT&&(j=s.RG16I),H===s.INT&&(j=s.RG32I)),R===s.RGB_INTEGER&&(H===s.UNSIGNED_BYTE&&(j=s.RGB8UI),H===s.UNSIGNED_SHORT&&(j=s.RGB16UI),H===s.UNSIGNED_INT&&(j=s.RGB32UI),H===s.BYTE&&(j=s.RGB8I),H===s.SHORT&&(j=s.RGB16I),H===s.INT&&(j=s.RGB32I)),R===s.RGBA_INTEGER&&(H===s.UNSIGNED_BYTE&&(j=s.RGBA8UI),H===s.UNSIGNED_SHORT&&(j=s.RGBA16UI),H===s.UNSIGNED_INT&&(j=s.RGBA32UI),H===s.BYTE&&(j=s.RGBA8I),H===s.SHORT&&(j=s.RGBA16I),H===s.INT&&(j=s.RGBA32I)),R===s.RGB&&(H===s.UNSIGNED_INT_5_9_9_9_REV&&(j=s.RGB9_E5),H===s.UNSIGNED_INT_10F_11F_11F_REV&&(j=s.R11F_G11F_B10F)),R===s.RGBA){const zt=ot?Fo:fe.getTransfer(Y);H===s.FLOAT&&(j=s.RGBA32F),H===s.HALF_FLOAT&&(j=s.RGBA16F),H===s.UNSIGNED_BYTE&&(j=zt===we?s.SRGB8_ALPHA8:s.RGBA8),H===s.UNSIGNED_SHORT_4_4_4_4&&(j=s.RGBA4),H===s.UNSIGNED_SHORT_5_5_5_1&&(j=s.RGB5_A1)}return(j===s.R16F||j===s.R32F||j===s.RG16F||j===s.RG32F||j===s.RGBA16F||j===s.RGBA32F)&&t.get("EXT_color_buffer_float"),j}function y(L,R){let H;return L?R===null||R===Pi||R===Er?H=s.DEPTH24_STENCIL8:R===An?H=s.DEPTH32F_STENCIL8:R===Tr&&(H=s.DEPTH24_STENCIL8,console.warn("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):R===null||R===Pi||R===Er?H=s.DEPTH_COMPONENT24:R===An?H=s.DEPTH_COMPONENT32F:R===Tr&&(H=s.DEPTH_COMPONENT16),H}function w(L,R){return g(L)===!0||L.isFramebufferTexture&&L.minFilter!==yn&&L.minFilter!==Kn?Math.log2(Math.max(R.width,R.height))+1:L.mipmaps!==void 0&&L.mipmaps.length>0?L.mipmaps.length:L.isCompressedTexture&&Array.isArray(L.image)?R.mipmaps.length:1}function S(L){const R=L.target;R.removeEventListener("dispose",S),C(R),R.isVideoTexture&&u.delete(R)}function T(L){const R=L.target;R.removeEventListener("dispose",T),M(R)}function C(L){const R=n.get(L);if(R.__webglInit===void 0)return;const H=L.source,Y=p.get(H);if(Y){const ot=Y[R.__cacheKey];ot.usedTimes--,ot.usedTimes===0&&b(L),Object.keys(Y).length===0&&p.delete(H)}n.remove(L)}function b(L){const R=n.get(L);s.deleteTexture(R.__webglTexture);const H=L.source,Y=p.get(H);delete Y[R.__cacheKey],o.memory.textures--}function M(L){const R=n.get(L);if(L.depthTexture&&(L.depthTexture.dispose(),n.remove(L.depthTexture)),L.isWebGLCubeRenderTarget)for(let Y=0;Y<6;Y++){if(Array.isArray(R.__webglFramebuffer[Y]))for(let ot=0;ot<R.__webglFramebuffer[Y].length;ot++)s.deleteFramebuffer(R.__webglFramebuffer[Y][ot]);else s.deleteFramebuffer(R.__webglFramebuffer[Y]);R.__webglDepthbuffer&&s.deleteRenderbuffer(R.__webglDepthbuffer[Y])}else{if(Array.isArray(R.__webglFramebuffer))for(let Y=0;Y<R.__webglFramebuffer.length;Y++)s.deleteFramebuffer(R.__webglFramebuffer[Y]);else s.deleteFramebuffer(R.__webglFramebuffer);if(R.__webglDepthbuffer&&s.deleteRenderbuffer(R.__webglDepthbuffer),R.__webglMultisampledFramebuffer&&s.deleteFramebuffer(R.__webglMultisampledFramebuffer),R.__webglColorRenderbuffer)for(let Y=0;Y<R.__webglColorRenderbuffer.length;Y++)R.__webglColorRenderbuffer[Y]&&s.deleteRenderbuffer(R.__webglColorRenderbuffer[Y]);R.__webglDepthRenderbuffer&&s.deleteRenderbuffer(R.__webglDepthRenderbuffer)}const H=L.textures;for(let Y=0,ot=H.length;Y<ot;Y++){const j=n.get(H[Y]);j.__webglTexture&&(s.deleteTexture(j.__webglTexture),o.memory.textures--),n.remove(H[Y])}n.remove(L)}let E=0;function D(){E=0}function N(){const L=E;return L>=i.maxTextures&&console.warn("THREE.WebGLTextures: Trying to use "+L+" texture units while this GPU supports only "+i.maxTextures),E+=1,L}function I(L){const R=[];return R.push(L.wrapS),R.push(L.wrapT),R.push(L.wrapR||0),R.push(L.magFilter),R.push(L.minFilter),R.push(L.anisotropy),R.push(L.internalFormat),R.push(L.format),R.push(L.type),R.push(L.generateMipmaps),R.push(L.premultiplyAlpha),R.push(L.flipY),R.push(L.unpackAlignment),R.push(L.colorSpace),R.join()}function F(L,R){const H=n.get(L);if(L.isVideoTexture&&xt(L),L.isRenderTargetTexture===!1&&L.isExternalTexture!==!0&&L.version>0&&H.__version!==L.version){const Y=L.image;if(Y===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else if(Y.complete===!1)console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");else{$(H,L,R);return}}else L.isExternalTexture&&(H.__webglTexture=L.sourceTexture?L.sourceTexture:null);e.bindTexture(s.TEXTURE_2D,H.__webglTexture,s.TEXTURE0+R)}function z(L,R){const H=n.get(L);if(L.isRenderTargetTexture===!1&&L.version>0&&H.__version!==L.version){$(H,L,R);return}e.bindTexture(s.TEXTURE_2D_ARRAY,H.__webglTexture,s.TEXTURE0+R)}function X(L,R){const H=n.get(L);if(L.isRenderTargetTexture===!1&&L.version>0&&H.__version!==L.version){$(H,L,R);return}e.bindTexture(s.TEXTURE_3D,H.__webglTexture,s.TEXTURE0+R)}function k(L,R){const H=n.get(L);if(L.version>0&&H.__version!==L.version){st(H,L,R);return}e.bindTexture(s.TEXTURE_CUBE_MAP,H.__webglTexture,s.TEXTURE0+R)}const K={[oc]:s.REPEAT,[Ki]:s.CLAMP_TO_EDGE,[ac]:s.MIRRORED_REPEAT},rt={[yn]:s.NEAREST,[Od]:s.NEAREST_MIPMAP_NEAREST,[Br]:s.NEAREST_MIPMAP_LINEAR,[Kn]:s.LINEAR,[sa]:s.LINEAR_MIPMAP_NEAREST,[Ji]:s.LINEAR_MIPMAP_LINEAR},Z={[Hd]:s.NEVER,[Zd]:s.ALWAYS,[Gd]:s.LESS,[du]:s.LEQUAL,[Wd]:s.EQUAL,[Yd]:s.GEQUAL,[Xd]:s.GREATER,[qd]:s.NOTEQUAL};function mt(L,R){if(R.type===An&&t.has("OES_texture_float_linear")===!1&&(R.magFilter===Kn||R.magFilter===sa||R.magFilter===Br||R.magFilter===Ji||R.minFilter===Kn||R.minFilter===sa||R.minFilter===Br||R.minFilter===Ji)&&console.warn("THREE.WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),s.texParameteri(L,s.TEXTURE_WRAP_S,K[R.wrapS]),s.texParameteri(L,s.TEXTURE_WRAP_T,K[R.wrapT]),(L===s.TEXTURE_3D||L===s.TEXTURE_2D_ARRAY)&&s.texParameteri(L,s.TEXTURE_WRAP_R,K[R.wrapR]),s.texParameteri(L,s.TEXTURE_MAG_FILTER,rt[R.magFilter]),s.texParameteri(L,s.TEXTURE_MIN_FILTER,rt[R.minFilter]),R.compareFunction&&(s.texParameteri(L,s.TEXTURE_COMPARE_MODE,s.COMPARE_REF_TO_TEXTURE),s.texParameteri(L,s.TEXTURE_COMPARE_FUNC,Z[R.compareFunction])),t.has("EXT_texture_filter_anisotropic")===!0){if(R.magFilter===yn||R.minFilter!==Br&&R.minFilter!==Ji||R.type===An&&t.has("OES_texture_float_linear")===!1)return;if(R.anisotropy>1||n.get(R).__currentAnisotropy){const H=t.get("EXT_texture_filter_anisotropic");s.texParameterf(L,H.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(R.anisotropy,i.getMaxAnisotropy())),n.get(R).__currentAnisotropy=R.anisotropy}}}function Vt(L,R){let H=!1;L.__webglInit===void 0&&(L.__webglInit=!0,R.addEventListener("dispose",S));const Y=R.source;let ot=p.get(Y);ot===void 0&&(ot={},p.set(Y,ot));const j=I(R);if(j!==L.__cacheKey){ot[j]===void 0&&(ot[j]={texture:s.createTexture(),usedTimes:0},o.memory.textures++,H=!0),ot[j].usedTimes++;const zt=ot[L.__cacheKey];zt!==void 0&&(ot[L.__cacheKey].usedTimes--,zt.usedTimes===0&&b(R)),L.__cacheKey=j,L.__webglTexture=ot[j].texture}return H}function Zt(L,R,H){return Math.floor(Math.floor(L/H)/R)}function Kt(L,R,H,Y){const j=L.updateRanges;if(j.length===0)e.texSubImage2D(s.TEXTURE_2D,0,0,0,R.width,R.height,H,Y,R.data);else{j.sort((ht,At)=>ht.start-At.start);let zt=0;for(let ht=1;ht<j.length;ht++){const At=j[zt],qt=j[ht],Bt=At.start+At.count,St=Zt(qt.start,R.width,4),re=Zt(At.start,R.width,4);qt.start<=Bt+1&&St===re&&Zt(qt.start+qt.count-1,R.width,4)===St?At.count=Math.max(At.count,qt.start+qt.count-At.start):(++zt,j[zt]=qt)}j.length=zt+1;const gt=s.getParameter(s.UNPACK_ROW_LENGTH),Ut=s.getParameter(s.UNPACK_SKIP_PIXELS),Nt=s.getParameter(s.UNPACK_SKIP_ROWS);s.pixelStorei(s.UNPACK_ROW_LENGTH,R.width);for(let ht=0,At=j.length;ht<At;ht++){const qt=j[ht],Bt=Math.floor(qt.start/4),St=Math.ceil(qt.count/4),re=Bt%R.width,O=Math.floor(Bt/R.width),ft=St,yt=1;s.pixelStorei(s.UNPACK_SKIP_PIXELS,re),s.pixelStorei(s.UNPACK_SKIP_ROWS,O),e.texSubImage2D(s.TEXTURE_2D,0,re,O,ft,yt,H,Y,R.data)}L.clearUpdateRanges(),s.pixelStorei(s.UNPACK_ROW_LENGTH,gt),s.pixelStorei(s.UNPACK_SKIP_PIXELS,Ut),s.pixelStorei(s.UNPACK_SKIP_ROWS,Nt)}}function $(L,R,H){let Y=s.TEXTURE_2D;(R.isDataArrayTexture||R.isCompressedArrayTexture)&&(Y=s.TEXTURE_2D_ARRAY),R.isData3DTexture&&(Y=s.TEXTURE_3D);const ot=Vt(L,R),j=R.source;e.bindTexture(Y,L.__webglTexture,s.TEXTURE0+H);const zt=n.get(j);if(j.version!==zt.__version||ot===!0){e.activeTexture(s.TEXTURE0+H);const gt=fe.getPrimaries(fe.workingColorSpace),Ut=R.colorSpace===Ti?null:fe.getPrimaries(R.colorSpace),Nt=R.colorSpace===Ti||gt===Ut?s.NONE:s.BROWSER_DEFAULT_WEBGL;s.pixelStorei(s.UNPACK_FLIP_Y_WEBGL,R.flipY),s.pixelStorei(s.UNPACK_PREMULTIPLY_ALPHA_WEBGL,R.premultiplyAlpha),s.pixelStorei(s.UNPACK_ALIGNMENT,R.unpackAlignment),s.pixelStorei(s.UNPACK_COLORSPACE_CONVERSION_WEBGL,Nt);let ht=v(R.image,!1,i.maxTextureSize);ht=Qt(R,ht);const At=r.convert(R.format,R.colorSpace),qt=r.convert(R.type);let Bt=_(R.internalFormat,At,qt,R.colorSpace,R.isVideoTexture);mt(Y,R);let St;const re=R.mipmaps,O=R.isVideoTexture!==!0,ft=zt.__version===void 0||ot===!0,yt=j.dataReady,Dt=w(R,ht);if(R.isDepthTexture)Bt=y(R.format===Rr,R.type),ft&&(O?e.texStorage2D(s.TEXTURE_2D,1,Bt,ht.width,ht.height):e.texImage2D(s.TEXTURE_2D,0,Bt,ht.width,ht.height,0,At,qt,null));else if(R.isDataTexture)if(re.length>0){O&&ft&&e.texStorage2D(s.TEXTURE_2D,Dt,Bt,re[0].width,re[0].height);for(let ut=0,nt=re.length;ut<nt;ut++)St=re[ut],O?yt&&e.texSubImage2D(s.TEXTURE_2D,ut,0,0,St.width,St.height,At,qt,St.data):e.texImage2D(s.TEXTURE_2D,ut,Bt,St.width,St.height,0,At,qt,St.data);R.generateMipmaps=!1}else O?(ft&&e.texStorage2D(s.TEXTURE_2D,Dt,Bt,ht.width,ht.height),yt&&Kt(R,ht,At,qt)):e.texImage2D(s.TEXTURE_2D,0,Bt,ht.width,ht.height,0,At,qt,ht.data);else if(R.isCompressedTexture)if(R.isCompressedArrayTexture){O&&ft&&e.texStorage3D(s.TEXTURE_2D_ARRAY,Dt,Bt,re[0].width,re[0].height,ht.depth);for(let ut=0,nt=re.length;ut<nt;ut++)if(St=re[ut],R.format!==_n)if(At!==null)if(O){if(yt)if(R.layerUpdates.size>0){const Ft=hh(St.width,St.height,R.format,R.type);for(const te of R.layerUpdates){const Re=St.data.subarray(te*Ft/St.data.BYTES_PER_ELEMENT,(te+1)*Ft/St.data.BYTES_PER_ELEMENT);e.compressedTexSubImage3D(s.TEXTURE_2D_ARRAY,ut,0,0,te,St.width,St.height,1,At,Re)}R.clearLayerUpdates()}else e.compressedTexSubImage3D(s.TEXTURE_2D_ARRAY,ut,0,0,0,St.width,St.height,ht.depth,At,St.data)}else e.compressedTexImage3D(s.TEXTURE_2D_ARRAY,ut,Bt,St.width,St.height,ht.depth,0,St.data,0,0);else console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else O?yt&&e.texSubImage3D(s.TEXTURE_2D_ARRAY,ut,0,0,0,St.width,St.height,ht.depth,At,qt,St.data):e.texImage3D(s.TEXTURE_2D_ARRAY,ut,Bt,St.width,St.height,ht.depth,0,At,qt,St.data)}else{O&&ft&&e.texStorage2D(s.TEXTURE_2D,Dt,Bt,re[0].width,re[0].height);for(let ut=0,nt=re.length;ut<nt;ut++)St=re[ut],R.format!==_n?At!==null?O?yt&&e.compressedTexSubImage2D(s.TEXTURE_2D,ut,0,0,St.width,St.height,At,St.data):e.compressedTexImage2D(s.TEXTURE_2D,ut,Bt,St.width,St.height,0,St.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):O?yt&&e.texSubImage2D(s.TEXTURE_2D,ut,0,0,St.width,St.height,At,qt,St.data):e.texImage2D(s.TEXTURE_2D,ut,Bt,St.width,St.height,0,At,qt,St.data)}else if(R.isDataArrayTexture)if(O){if(ft&&e.texStorage3D(s.TEXTURE_2D_ARRAY,Dt,Bt,ht.width,ht.height,ht.depth),yt)if(R.layerUpdates.size>0){const ut=hh(ht.width,ht.height,R.format,R.type);for(const nt of R.layerUpdates){const Ft=ht.data.subarray(nt*ut/ht.data.BYTES_PER_ELEMENT,(nt+1)*ut/ht.data.BYTES_PER_ELEMENT);e.texSubImage3D(s.TEXTURE_2D_ARRAY,0,0,0,nt,ht.width,ht.height,1,At,qt,Ft)}R.clearLayerUpdates()}else e.texSubImage3D(s.TEXTURE_2D_ARRAY,0,0,0,0,ht.width,ht.height,ht.depth,At,qt,ht.data)}else e.texImage3D(s.TEXTURE_2D_ARRAY,0,Bt,ht.width,ht.height,ht.depth,0,At,qt,ht.data);else if(R.isData3DTexture)O?(ft&&e.texStorage3D(s.TEXTURE_3D,Dt,Bt,ht.width,ht.height,ht.depth),yt&&e.texSubImage3D(s.TEXTURE_3D,0,0,0,0,ht.width,ht.height,ht.depth,At,qt,ht.data)):e.texImage3D(s.TEXTURE_3D,0,Bt,ht.width,ht.height,ht.depth,0,At,qt,ht.data);else if(R.isFramebufferTexture){if(ft)if(O)e.texStorage2D(s.TEXTURE_2D,Dt,Bt,ht.width,ht.height);else{let ut=ht.width,nt=ht.height;for(let Ft=0;Ft<Dt;Ft++)e.texImage2D(s.TEXTURE_2D,Ft,Bt,ut,nt,0,At,qt,null),ut>>=1,nt>>=1}}else if(re.length>0){if(O&&ft){const ut=jt(re[0]);e.texStorage2D(s.TEXTURE_2D,Dt,Bt,ut.width,ut.height)}for(let ut=0,nt=re.length;ut<nt;ut++)St=re[ut],O?yt&&e.texSubImage2D(s.TEXTURE_2D,ut,0,0,At,qt,St):e.texImage2D(s.TEXTURE_2D,ut,Bt,At,qt,St);R.generateMipmaps=!1}else if(O){if(ft){const ut=jt(ht);e.texStorage2D(s.TEXTURE_2D,Dt,Bt,ut.width,ut.height)}yt&&e.texSubImage2D(s.TEXTURE_2D,0,0,0,At,qt,ht)}else e.texImage2D(s.TEXTURE_2D,0,Bt,At,qt,ht);g(R)&&f(Y),zt.__version=j.version,R.onUpdate&&R.onUpdate(R)}L.__version=R.version}function st(L,R,H){if(R.image.length!==6)return;const Y=Vt(L,R),ot=R.source;e.bindTexture(s.TEXTURE_CUBE_MAP,L.__webglTexture,s.TEXTURE0+H);const j=n.get(ot);if(ot.version!==j.__version||Y===!0){e.activeTexture(s.TEXTURE0+H);const zt=fe.getPrimaries(fe.workingColorSpace),gt=R.colorSpace===Ti?null:fe.getPrimaries(R.colorSpace),Ut=R.colorSpace===Ti||zt===gt?s.NONE:s.BROWSER_DEFAULT_WEBGL;s.pixelStorei(s.UNPACK_FLIP_Y_WEBGL,R.flipY),s.pixelStorei(s.UNPACK_PREMULTIPLY_ALPHA_WEBGL,R.premultiplyAlpha),s.pixelStorei(s.UNPACK_ALIGNMENT,R.unpackAlignment),s.pixelStorei(s.UNPACK_COLORSPACE_CONVERSION_WEBGL,Ut);const Nt=R.isCompressedTexture||R.image[0].isCompressedTexture,ht=R.image[0]&&R.image[0].isDataTexture,At=[];for(let nt=0;nt<6;nt++)!Nt&&!ht?At[nt]=v(R.image[nt],!0,i.maxCubemapSize):At[nt]=ht?R.image[nt].image:R.image[nt],At[nt]=Qt(R,At[nt]);const qt=At[0],Bt=r.convert(R.format,R.colorSpace),St=r.convert(R.type),re=_(R.internalFormat,Bt,St,R.colorSpace),O=R.isVideoTexture!==!0,ft=j.__version===void 0||Y===!0,yt=ot.dataReady;let Dt=w(R,qt);mt(s.TEXTURE_CUBE_MAP,R);let ut;if(Nt){O&&ft&&e.texStorage2D(s.TEXTURE_CUBE_MAP,Dt,re,qt.width,qt.height);for(let nt=0;nt<6;nt++){ut=At[nt].mipmaps;for(let Ft=0;Ft<ut.length;Ft++){const te=ut[Ft];R.format!==_n?Bt!==null?O?yt&&e.compressedTexSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+nt,Ft,0,0,te.width,te.height,Bt,te.data):e.compressedTexImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+nt,Ft,re,te.width,te.height,0,te.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):O?yt&&e.texSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+nt,Ft,0,0,te.width,te.height,Bt,St,te.data):e.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+nt,Ft,re,te.width,te.height,0,Bt,St,te.data)}}}else{if(ut=R.mipmaps,O&&ft){ut.length>0&&Dt++;const nt=jt(At[0]);e.texStorage2D(s.TEXTURE_CUBE_MAP,Dt,re,nt.width,nt.height)}for(let nt=0;nt<6;nt++)if(ht){O?yt&&e.texSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+nt,0,0,0,At[nt].width,At[nt].height,Bt,St,At[nt].data):e.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+nt,0,re,At[nt].width,At[nt].height,0,Bt,St,At[nt].data);for(let Ft=0;Ft<ut.length;Ft++){const Re=ut[Ft].image[nt].image;O?yt&&e.texSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+nt,Ft+1,0,0,Re.width,Re.height,Bt,St,Re.data):e.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+nt,Ft+1,re,Re.width,Re.height,0,Bt,St,Re.data)}}else{O?yt&&e.texSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+nt,0,0,0,Bt,St,At[nt]):e.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+nt,0,re,Bt,St,At[nt]);for(let Ft=0;Ft<ut.length;Ft++){const te=ut[Ft];O?yt&&e.texSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+nt,Ft+1,0,0,Bt,St,te.image[nt]):e.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+nt,Ft+1,re,Bt,St,te.image[nt])}}}g(R)&&f(s.TEXTURE_CUBE_MAP),j.__version=ot.version,R.onUpdate&&R.onUpdate(R)}L.__version=R.version}function wt(L,R,H,Y,ot,j){const zt=r.convert(H.format,H.colorSpace),gt=r.convert(H.type),Ut=_(H.internalFormat,zt,gt,H.colorSpace),Nt=n.get(R),ht=n.get(H);if(ht.__renderTarget=R,!Nt.__hasExternalTextures){const At=Math.max(1,R.width>>j),qt=Math.max(1,R.height>>j);ot===s.TEXTURE_3D||ot===s.TEXTURE_2D_ARRAY?e.texImage3D(ot,j,Ut,At,qt,R.depth,0,zt,gt,null):e.texImage2D(ot,j,Ut,At,qt,0,zt,gt,null)}e.bindFramebuffer(s.FRAMEBUFFER,L),ct(R)?a.framebufferTexture2DMultisampleEXT(s.FRAMEBUFFER,Y,ot,ht.__webglTexture,0,vt(R)):(ot===s.TEXTURE_2D||ot>=s.TEXTURE_CUBE_MAP_POSITIVE_X&&ot<=s.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&s.framebufferTexture2D(s.FRAMEBUFFER,Y,ot,ht.__webglTexture,j),e.bindFramebuffer(s.FRAMEBUFFER,null)}function Lt(L,R,H){if(s.bindRenderbuffer(s.RENDERBUFFER,L),R.depthBuffer){const Y=R.depthTexture,ot=Y&&Y.isDepthTexture?Y.type:null,j=y(R.stencilBuffer,ot),zt=R.stencilBuffer?s.DEPTH_STENCIL_ATTACHMENT:s.DEPTH_ATTACHMENT,gt=vt(R);ct(R)?a.renderbufferStorageMultisampleEXT(s.RENDERBUFFER,gt,j,R.width,R.height):H?s.renderbufferStorageMultisample(s.RENDERBUFFER,gt,j,R.width,R.height):s.renderbufferStorage(s.RENDERBUFFER,j,R.width,R.height),s.framebufferRenderbuffer(s.FRAMEBUFFER,zt,s.RENDERBUFFER,L)}else{const Y=R.textures;for(let ot=0;ot<Y.length;ot++){const j=Y[ot],zt=r.convert(j.format,j.colorSpace),gt=r.convert(j.type),Ut=_(j.internalFormat,zt,gt,j.colorSpace),Nt=vt(R);H&&ct(R)===!1?s.renderbufferStorageMultisample(s.RENDERBUFFER,Nt,Ut,R.width,R.height):ct(R)?a.renderbufferStorageMultisampleEXT(s.RENDERBUFFER,Nt,Ut,R.width,R.height):s.renderbufferStorage(s.RENDERBUFFER,Ut,R.width,R.height)}}s.bindRenderbuffer(s.RENDERBUFFER,null)}function Rt(L,R){if(R&&R.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(e.bindFramebuffer(s.FRAMEBUFFER,L),!(R.depthTexture&&R.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");const Y=n.get(R.depthTexture);Y.__renderTarget=R,(!Y.__webglTexture||R.depthTexture.image.width!==R.width||R.depthTexture.image.height!==R.height)&&(R.depthTexture.image.width=R.width,R.depthTexture.image.height=R.height,R.depthTexture.needsUpdate=!0),F(R.depthTexture,0);const ot=Y.__webglTexture,j=vt(R);if(R.depthTexture.format===Ar)ct(R)?a.framebufferTexture2DMultisampleEXT(s.FRAMEBUFFER,s.DEPTH_ATTACHMENT,s.TEXTURE_2D,ot,0,j):s.framebufferTexture2D(s.FRAMEBUFFER,s.DEPTH_ATTACHMENT,s.TEXTURE_2D,ot,0);else if(R.depthTexture.format===Rr)ct(R)?a.framebufferTexture2DMultisampleEXT(s.FRAMEBUFFER,s.DEPTH_STENCIL_ATTACHMENT,s.TEXTURE_2D,ot,0,j):s.framebufferTexture2D(s.FRAMEBUFFER,s.DEPTH_STENCIL_ATTACHMENT,s.TEXTURE_2D,ot,0);else throw new Error("Unknown depthTexture format")}function ee(L){const R=n.get(L),H=L.isWebGLCubeRenderTarget===!0;if(R.__boundDepthTexture!==L.depthTexture){const Y=L.depthTexture;if(R.__depthDisposeCallback&&R.__depthDisposeCallback(),Y){const ot=()=>{delete R.__boundDepthTexture,delete R.__depthDisposeCallback,Y.removeEventListener("dispose",ot)};Y.addEventListener("dispose",ot),R.__depthDisposeCallback=ot}R.__boundDepthTexture=Y}if(L.depthTexture&&!R.__autoAllocateDepthBuffer){if(H)throw new Error("target.depthTexture not supported in Cube render targets");const Y=L.texture.mipmaps;Y&&Y.length>0?Rt(R.__webglFramebuffer[0],L):Rt(R.__webglFramebuffer,L)}else if(H){R.__webglDepthbuffer=[];for(let Y=0;Y<6;Y++)if(e.bindFramebuffer(s.FRAMEBUFFER,R.__webglFramebuffer[Y]),R.__webglDepthbuffer[Y]===void 0)R.__webglDepthbuffer[Y]=s.createRenderbuffer(),Lt(R.__webglDepthbuffer[Y],L,!1);else{const ot=L.stencilBuffer?s.DEPTH_STENCIL_ATTACHMENT:s.DEPTH_ATTACHMENT,j=R.__webglDepthbuffer[Y];s.bindRenderbuffer(s.RENDERBUFFER,j),s.framebufferRenderbuffer(s.FRAMEBUFFER,ot,s.RENDERBUFFER,j)}}else{const Y=L.texture.mipmaps;if(Y&&Y.length>0?e.bindFramebuffer(s.FRAMEBUFFER,R.__webglFramebuffer[0]):e.bindFramebuffer(s.FRAMEBUFFER,R.__webglFramebuffer),R.__webglDepthbuffer===void 0)R.__webglDepthbuffer=s.createRenderbuffer(),Lt(R.__webglDepthbuffer,L,!1);else{const ot=L.stencilBuffer?s.DEPTH_STENCIL_ATTACHMENT:s.DEPTH_ATTACHMENT,j=R.__webglDepthbuffer;s.bindRenderbuffer(s.RENDERBUFFER,j),s.framebufferRenderbuffer(s.FRAMEBUFFER,ot,s.RENDERBUFFER,j)}}e.bindFramebuffer(s.FRAMEBUFFER,null)}function se(L,R,H){const Y=n.get(L);R!==void 0&&wt(Y.__webglFramebuffer,L,L.texture,s.COLOR_ATTACHMENT0,s.TEXTURE_2D,0),H!==void 0&&ee(L)}function U(L){const R=L.texture,H=n.get(L),Y=n.get(R);L.addEventListener("dispose",T);const ot=L.textures,j=L.isWebGLCubeRenderTarget===!0,zt=ot.length>1;if(zt||(Y.__webglTexture===void 0&&(Y.__webglTexture=s.createTexture()),Y.__version=R.version,o.memory.textures++),j){H.__webglFramebuffer=[];for(let gt=0;gt<6;gt++)if(R.mipmaps&&R.mipmaps.length>0){H.__webglFramebuffer[gt]=[];for(let Ut=0;Ut<R.mipmaps.length;Ut++)H.__webglFramebuffer[gt][Ut]=s.createFramebuffer()}else H.__webglFramebuffer[gt]=s.createFramebuffer()}else{if(R.mipmaps&&R.mipmaps.length>0){H.__webglFramebuffer=[];for(let gt=0;gt<R.mipmaps.length;gt++)H.__webglFramebuffer[gt]=s.createFramebuffer()}else H.__webglFramebuffer=s.createFramebuffer();if(zt)for(let gt=0,Ut=ot.length;gt<Ut;gt++){const Nt=n.get(ot[gt]);Nt.__webglTexture===void 0&&(Nt.__webglTexture=s.createTexture(),o.memory.textures++)}if(L.samples>0&&ct(L)===!1){H.__webglMultisampledFramebuffer=s.createFramebuffer(),H.__webglColorRenderbuffer=[],e.bindFramebuffer(s.FRAMEBUFFER,H.__webglMultisampledFramebuffer);for(let gt=0;gt<ot.length;gt++){const Ut=ot[gt];H.__webglColorRenderbuffer[gt]=s.createRenderbuffer(),s.bindRenderbuffer(s.RENDERBUFFER,H.__webglColorRenderbuffer[gt]);const Nt=r.convert(Ut.format,Ut.colorSpace),ht=r.convert(Ut.type),At=_(Ut.internalFormat,Nt,ht,Ut.colorSpace,L.isXRRenderTarget===!0),qt=vt(L);s.renderbufferStorageMultisample(s.RENDERBUFFER,qt,At,L.width,L.height),s.framebufferRenderbuffer(s.FRAMEBUFFER,s.COLOR_ATTACHMENT0+gt,s.RENDERBUFFER,H.__webglColorRenderbuffer[gt])}s.bindRenderbuffer(s.RENDERBUFFER,null),L.depthBuffer&&(H.__webglDepthRenderbuffer=s.createRenderbuffer(),Lt(H.__webglDepthRenderbuffer,L,!0)),e.bindFramebuffer(s.FRAMEBUFFER,null)}}if(j){e.bindTexture(s.TEXTURE_CUBE_MAP,Y.__webglTexture),mt(s.TEXTURE_CUBE_MAP,R);for(let gt=0;gt<6;gt++)if(R.mipmaps&&R.mipmaps.length>0)for(let Ut=0;Ut<R.mipmaps.length;Ut++)wt(H.__webglFramebuffer[gt][Ut],L,R,s.COLOR_ATTACHMENT0,s.TEXTURE_CUBE_MAP_POSITIVE_X+gt,Ut);else wt(H.__webglFramebuffer[gt],L,R,s.COLOR_ATTACHMENT0,s.TEXTURE_CUBE_MAP_POSITIVE_X+gt,0);g(R)&&f(s.TEXTURE_CUBE_MAP),e.unbindTexture()}else if(zt){for(let gt=0,Ut=ot.length;gt<Ut;gt++){const Nt=ot[gt],ht=n.get(Nt);let At=s.TEXTURE_2D;(L.isWebGL3DRenderTarget||L.isWebGLArrayRenderTarget)&&(At=L.isWebGL3DRenderTarget?s.TEXTURE_3D:s.TEXTURE_2D_ARRAY),e.bindTexture(At,ht.__webglTexture),mt(At,Nt),wt(H.__webglFramebuffer,L,Nt,s.COLOR_ATTACHMENT0+gt,At,0),g(Nt)&&f(At)}e.unbindTexture()}else{let gt=s.TEXTURE_2D;if((L.isWebGL3DRenderTarget||L.isWebGLArrayRenderTarget)&&(gt=L.isWebGL3DRenderTarget?s.TEXTURE_3D:s.TEXTURE_2D_ARRAY),e.bindTexture(gt,Y.__webglTexture),mt(gt,R),R.mipmaps&&R.mipmaps.length>0)for(let Ut=0;Ut<R.mipmaps.length;Ut++)wt(H.__webglFramebuffer[Ut],L,R,s.COLOR_ATTACHMENT0,gt,Ut);else wt(H.__webglFramebuffer,L,R,s.COLOR_ATTACHMENT0,gt,0);g(R)&&f(gt),e.unbindTexture()}L.depthBuffer&&ee(L)}function it(L){const R=L.textures;for(let H=0,Y=R.length;H<Y;H++){const ot=R[H];if(g(ot)){const j=x(L),zt=n.get(ot).__webglTexture;e.bindTexture(j,zt),f(j),e.unbindTexture()}}}const J=[],Q=[];function et(L){if(L.samples>0){if(ct(L)===!1){const R=L.textures,H=L.width,Y=L.height;let ot=s.COLOR_BUFFER_BIT;const j=L.stencilBuffer?s.DEPTH_STENCIL_ATTACHMENT:s.DEPTH_ATTACHMENT,zt=n.get(L),gt=R.length>1;if(gt)for(let Nt=0;Nt<R.length;Nt++)e.bindFramebuffer(s.FRAMEBUFFER,zt.__webglMultisampledFramebuffer),s.framebufferRenderbuffer(s.FRAMEBUFFER,s.COLOR_ATTACHMENT0+Nt,s.RENDERBUFFER,null),e.bindFramebuffer(s.FRAMEBUFFER,zt.__webglFramebuffer),s.framebufferTexture2D(s.DRAW_FRAMEBUFFER,s.COLOR_ATTACHMENT0+Nt,s.TEXTURE_2D,null,0);e.bindFramebuffer(s.READ_FRAMEBUFFER,zt.__webglMultisampledFramebuffer);const Ut=L.texture.mipmaps;Ut&&Ut.length>0?e.bindFramebuffer(s.DRAW_FRAMEBUFFER,zt.__webglFramebuffer[0]):e.bindFramebuffer(s.DRAW_FRAMEBUFFER,zt.__webglFramebuffer);for(let Nt=0;Nt<R.length;Nt++){if(L.resolveDepthBuffer&&(L.depthBuffer&&(ot|=s.DEPTH_BUFFER_BIT),L.stencilBuffer&&L.resolveStencilBuffer&&(ot|=s.STENCIL_BUFFER_BIT)),gt){s.framebufferRenderbuffer(s.READ_FRAMEBUFFER,s.COLOR_ATTACHMENT0,s.RENDERBUFFER,zt.__webglColorRenderbuffer[Nt]);const ht=n.get(R[Nt]).__webglTexture;s.framebufferTexture2D(s.DRAW_FRAMEBUFFER,s.COLOR_ATTACHMENT0,s.TEXTURE_2D,ht,0)}s.blitFramebuffer(0,0,H,Y,0,0,H,Y,ot,s.NEAREST),c===!0&&(J.length=0,Q.length=0,J.push(s.COLOR_ATTACHMENT0+Nt),L.depthBuffer&&L.resolveDepthBuffer===!1&&(J.push(j),Q.push(j),s.invalidateFramebuffer(s.DRAW_FRAMEBUFFER,Q)),s.invalidateFramebuffer(s.READ_FRAMEBUFFER,J))}if(e.bindFramebuffer(s.READ_FRAMEBUFFER,null),e.bindFramebuffer(s.DRAW_FRAMEBUFFER,null),gt)for(let Nt=0;Nt<R.length;Nt++){e.bindFramebuffer(s.FRAMEBUFFER,zt.__webglMultisampledFramebuffer),s.framebufferRenderbuffer(s.FRAMEBUFFER,s.COLOR_ATTACHMENT0+Nt,s.RENDERBUFFER,zt.__webglColorRenderbuffer[Nt]);const ht=n.get(R[Nt]).__webglTexture;e.bindFramebuffer(s.FRAMEBUFFER,zt.__webglFramebuffer),s.framebufferTexture2D(s.DRAW_FRAMEBUFFER,s.COLOR_ATTACHMENT0+Nt,s.TEXTURE_2D,ht,0)}e.bindFramebuffer(s.DRAW_FRAMEBUFFER,zt.__webglMultisampledFramebuffer)}else if(L.depthBuffer&&L.resolveDepthBuffer===!1&&c){const R=L.stencilBuffer?s.DEPTH_STENCIL_ATTACHMENT:s.DEPTH_ATTACHMENT;s.invalidateFramebuffer(s.DRAW_FRAMEBUFFER,[R])}}}function vt(L){return Math.min(i.maxSamples,L.samples)}function ct(L){const R=n.get(L);return L.samples>0&&t.has("WEBGL_multisampled_render_to_texture")===!0&&R.__useRenderToTexture!==!1}function xt(L){const R=o.render.frame;u.get(L)!==R&&(u.set(L,R),L.update())}function Qt(L,R){const H=L.colorSpace,Y=L.format,ot=L.type;return L.isCompressedTexture===!0||L.isVideoTexture===!0||H!==Bs&&H!==Ti&&(fe.getTransfer(H)===we?(Y!==_n||ot!==ei)&&console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture color space:",H)),R}function jt(L){return typeof HTMLImageElement<"u"&&L instanceof HTMLImageElement?(l.width=L.naturalWidth||L.width,l.height=L.naturalHeight||L.height):typeof VideoFrame<"u"&&L instanceof VideoFrame?(l.width=L.displayWidth,l.height=L.displayHeight):(l.width=L.width,l.height=L.height),l}this.allocateTextureUnit=N,this.resetTextureUnits=D,this.setTexture2D=F,this.setTexture2DArray=z,this.setTexture3D=X,this.setTextureCube=k,this.rebindTextures=se,this.setupRenderTarget=U,this.updateRenderTargetMipmap=it,this.updateMultisampleRenderTarget=et,this.setupDepthRenderbuffer=ee,this.setupFrameBufferTexture=wt,this.useMultisampledRTT=ct}function __(s,t){function e(n,i=Ti){let r;const o=fe.getTransfer(i);if(n===ei)return s.UNSIGNED_BYTE;if(n===qc)return s.UNSIGNED_SHORT_4_4_4_4;if(n===Yc)return s.UNSIGNED_SHORT_5_5_5_1;if(n===ou)return s.UNSIGNED_INT_5_9_9_9_REV;if(n===au)return s.UNSIGNED_INT_10F_11F_11F_REV;if(n===su)return s.BYTE;if(n===ru)return s.SHORT;if(n===Tr)return s.UNSIGNED_SHORT;if(n===Xc)return s.INT;if(n===Pi)return s.UNSIGNED_INT;if(n===An)return s.FLOAT;if(n===Qn)return s.HALF_FLOAT;if(n===cu)return s.ALPHA;if(n===lu)return s.RGB;if(n===_n)return s.RGBA;if(n===Ar)return s.DEPTH_COMPONENT;if(n===Rr)return s.DEPTH_STENCIL;if(n===Zc)return s.RED;if(n===Yo)return s.RED_INTEGER;if(n===hu)return s.RG;if(n===jc)return s.RG_INTEGER;if(n===$c)return s.RGBA_INTEGER;if(n===Eo||n===Ao||n===Ro||n===Co)if(o===we)if(r=t.get("WEBGL_compressed_texture_s3tc_srgb"),r!==null){if(n===Eo)return r.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===Ao)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===Ro)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===Co)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(r=t.get("WEBGL_compressed_texture_s3tc"),r!==null){if(n===Eo)return r.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===Ao)return r.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===Ro)return r.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===Co)return r.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(n===cc||n===lc||n===hc||n===uc)if(r=t.get("WEBGL_compressed_texture_pvrtc"),r!==null){if(n===cc)return r.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===lc)return r.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===hc)return r.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===uc)return r.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(n===dc||n===fc||n===pc)if(r=t.get("WEBGL_compressed_texture_etc"),r!==null){if(n===dc||n===fc)return o===we?r.COMPRESSED_SRGB8_ETC2:r.COMPRESSED_RGB8_ETC2;if(n===pc)return o===we?r.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:r.COMPRESSED_RGBA8_ETC2_EAC}else return null;if(n===mc||n===gc||n===vc||n===_c||n===xc||n===yc||n===Mc||n===bc||n===Sc||n===wc||n===Tc||n===Ec||n===Ac||n===Rc)if(r=t.get("WEBGL_compressed_texture_astc"),r!==null){if(n===mc)return o===we?r.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:r.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===gc)return o===we?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:r.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===vc)return o===we?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:r.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===_c)return o===we?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:r.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===xc)return o===we?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:r.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===yc)return o===we?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:r.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===Mc)return o===we?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:r.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===bc)return o===we?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:r.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===Sc)return o===we?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:r.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===wc)return o===we?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:r.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===Tc)return o===we?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:r.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===Ec)return o===we?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:r.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===Ac)return o===we?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:r.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===Rc)return o===we?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:r.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(n===Cc||n===Pc||n===Dc)if(r=t.get("EXT_texture_compression_bptc"),r!==null){if(n===Cc)return o===we?r.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:r.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===Pc)return r.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===Dc)return r.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(n===Ic||n===Lc||n===Uc||n===Nc)if(r=t.get("EXT_texture_compression_rgtc"),r!==null){if(n===Ic)return r.COMPRESSED_RED_RGTC1_EXT;if(n===Lc)return r.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===Uc)return r.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===Nc)return r.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return n===Er?s.UNSIGNED_INT_24_8:s[n]!==void 0?s[n]:null}return{convert:e}}const x_=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,y_=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`;class M_{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(t,e){if(this.texture===null){const n=new Tu(t.texture);(t.depthNear!==e.depthNear||t.depthFar!==e.depthFar)&&(this.depthNear=t.depthNear,this.depthFar=t.depthFar),this.texture=n}}getMesh(t){if(this.texture!==null&&this.mesh===null){const e=t.cameras[0].viewport,n=new Be({vertexShader:x_,fragmentShader:y_,uniforms:{depthColor:{value:this.texture},depthWidth:{value:e.z},depthHeight:{value:e.w}}});this.mesh=new ue(new Ui(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}}class b_ extends rs{constructor(t,e){super();const n=this;let i=null,r=1,o=null,a="local-floor",c=1,l=null,u=null,h=null,p=null,d=null,m=null;const v=typeof XRWebGLBinding<"u",g=new M_,f={},x=e.getContextAttributes();let _=null,y=null;const w=[],S=[],T=new tt;let C=null;const b=new ln;b.viewport=new be;const M=new ln;M.viewport=new be;const E=[b,M],D=new H0;let N=null,I=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function($){let st=w[$];return st===void 0&&(st=new Ta,w[$]=st),st.getTargetRaySpace()},this.getControllerGrip=function($){let st=w[$];return st===void 0&&(st=new Ta,w[$]=st),st.getGripSpace()},this.getHand=function($){let st=w[$];return st===void 0&&(st=new Ta,w[$]=st),st.getHandSpace()};function F($){const st=S.indexOf($.inputSource);if(st===-1)return;const wt=w[st];wt!==void 0&&(wt.update($.inputSource,$.frame,l||o),wt.dispatchEvent({type:$.type,data:$.inputSource}))}function z(){i.removeEventListener("select",F),i.removeEventListener("selectstart",F),i.removeEventListener("selectend",F),i.removeEventListener("squeeze",F),i.removeEventListener("squeezestart",F),i.removeEventListener("squeezeend",F),i.removeEventListener("end",z),i.removeEventListener("inputsourceschange",X);for(let $=0;$<w.length;$++){const st=S[$];st!==null&&(S[$]=null,w[$].disconnect(st))}N=null,I=null,g.reset();for(const $ in f)delete f[$];t.setRenderTarget(_),d=null,p=null,h=null,i=null,y=null,Kt.stop(),n.isPresenting=!1,t.setPixelRatio(C),t.setSize(T.width,T.height,!1),n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function($){r=$,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function($){a=$,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return l||o},this.setReferenceSpace=function($){l=$},this.getBaseLayer=function(){return p!==null?p:d},this.getBinding=function(){return h===null&&v&&(h=new XRWebGLBinding(i,e)),h},this.getFrame=function(){return m},this.getSession=function(){return i},this.setSession=async function($){if(i=$,i!==null){if(_=t.getRenderTarget(),i.addEventListener("select",F),i.addEventListener("selectstart",F),i.addEventListener("selectend",F),i.addEventListener("squeeze",F),i.addEventListener("squeezestart",F),i.addEventListener("squeezeend",F),i.addEventListener("end",z),i.addEventListener("inputsourceschange",X),x.xrCompatible!==!0&&await e.makeXRCompatible(),C=t.getPixelRatio(),t.getSize(T),v&&"createProjectionLayer"in XRWebGLBinding.prototype){let wt=null,Lt=null,Rt=null;x.depth&&(Rt=x.stencil?e.DEPTH24_STENCIL8:e.DEPTH_COMPONENT24,wt=x.stencil?Rr:Ar,Lt=x.stencil?Er:Pi);const ee={colorFormat:e.RGBA8,depthFormat:Rt,scaleFactor:r};h=this.getBinding(),p=h.createProjectionLayer(ee),i.updateRenderState({layers:[p]}),t.setPixelRatio(1),t.setSize(p.textureWidth,p.textureHeight,!1),y=new Rn(p.textureWidth,p.textureHeight,{format:_n,type:ei,depthTexture:new wu(p.textureWidth,p.textureHeight,Lt,void 0,void 0,void 0,void 0,void 0,void 0,wt),stencilBuffer:x.stencil,colorSpace:t.outputColorSpace,samples:x.antialias?4:0,resolveDepthBuffer:p.ignoreDepthValues===!1,resolveStencilBuffer:p.ignoreDepthValues===!1})}else{const wt={antialias:x.antialias,alpha:!0,depth:x.depth,stencil:x.stencil,framebufferScaleFactor:r};d=new XRWebGLLayer(i,e,wt),i.updateRenderState({baseLayer:d}),t.setPixelRatio(1),t.setSize(d.framebufferWidth,d.framebufferHeight,!1),y=new Rn(d.framebufferWidth,d.framebufferHeight,{format:_n,type:ei,colorSpace:t.outputColorSpace,stencilBuffer:x.stencil,resolveDepthBuffer:d.ignoreDepthValues===!1,resolveStencilBuffer:d.ignoreDepthValues===!1})}y.isXRRenderTarget=!0,this.setFoveation(c),l=null,o=await i.requestReferenceSpace(a),Kt.setContext(i),Kt.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(i!==null)return i.environmentBlendMode},this.getDepthTexture=function(){return g.getDepthTexture()};function X($){for(let st=0;st<$.removed.length;st++){const wt=$.removed[st],Lt=S.indexOf(wt);Lt>=0&&(S[Lt]=null,w[Lt].disconnect(wt))}for(let st=0;st<$.added.length;st++){const wt=$.added[st];let Lt=S.indexOf(wt);if(Lt===-1){for(let ee=0;ee<w.length;ee++)if(ee>=S.length){S.push(wt),Lt=ee;break}else if(S[ee]===null){S[ee]=wt,Lt=ee;break}if(Lt===-1)break}const Rt=w[Lt];Rt&&Rt.connect(wt)}}const k=new A,K=new A;function rt($,st,wt){k.setFromMatrixPosition(st.matrixWorld),K.setFromMatrixPosition(wt.matrixWorld);const Lt=k.distanceTo(K),Rt=st.projectionMatrix.elements,ee=wt.projectionMatrix.elements,se=Rt[14]/(Rt[10]-1),U=Rt[14]/(Rt[10]+1),it=(Rt[9]+1)/Rt[5],J=(Rt[9]-1)/Rt[5],Q=(Rt[8]-1)/Rt[0],et=(ee[8]+1)/ee[0],vt=se*Q,ct=se*et,xt=Lt/(-Q+et),Qt=xt*-Q;if(st.matrixWorld.decompose($.position,$.quaternion,$.scale),$.translateX(Qt),$.translateZ(xt),$.matrixWorld.compose($.position,$.quaternion,$.scale),$.matrixWorldInverse.copy($.matrixWorld).invert(),Rt[10]===-1)$.projectionMatrix.copy(st.projectionMatrix),$.projectionMatrixInverse.copy(st.projectionMatrixInverse);else{const jt=se+xt,L=U+xt,R=vt-Qt,H=ct+(Lt-Qt),Y=it*U/L*jt,ot=J*U/L*jt;$.projectionMatrix.makePerspective(R,H,Y,ot,jt,L),$.projectionMatrixInverse.copy($.projectionMatrix).invert()}}function Z($,st){st===null?$.matrixWorld.copy($.matrix):$.matrixWorld.multiplyMatrices(st.matrixWorld,$.matrix),$.matrixWorldInverse.copy($.matrixWorld).invert()}this.updateCamera=function($){if(i===null)return;let st=$.near,wt=$.far;g.texture!==null&&(g.depthNear>0&&(st=g.depthNear),g.depthFar>0&&(wt=g.depthFar)),D.near=M.near=b.near=st,D.far=M.far=b.far=wt,(N!==D.near||I!==D.far)&&(i.updateRenderState({depthNear:D.near,depthFar:D.far}),N=D.near,I=D.far),D.layers.mask=$.layers.mask|6,b.layers.mask=D.layers.mask&3,M.layers.mask=D.layers.mask&5;const Lt=$.parent,Rt=D.cameras;Z(D,Lt);for(let ee=0;ee<Rt.length;ee++)Z(Rt[ee],Lt);Rt.length===2?rt(D,b,M):D.projectionMatrix.copy(b.projectionMatrix),mt($,D,Lt)};function mt($,st,wt){wt===null?$.matrix.copy(st.matrixWorld):($.matrix.copy(wt.matrixWorld),$.matrix.invert(),$.matrix.multiply(st.matrixWorld)),$.matrix.decompose($.position,$.quaternion,$.scale),$.updateMatrixWorld(!0),$.projectionMatrix.copy(st.projectionMatrix),$.projectionMatrixInverse.copy(st.projectionMatrixInverse),$.isPerspectiveCamera&&($.fov=ks*2*Math.atan(1/$.projectionMatrix.elements[5]),$.zoom=1)}this.getCamera=function(){return D},this.getFoveation=function(){if(!(p===null&&d===null))return c},this.setFoveation=function($){c=$,p!==null&&(p.fixedFoveation=$),d!==null&&d.fixedFoveation!==void 0&&(d.fixedFoveation=$)},this.hasDepthSensing=function(){return g.texture!==null},this.getDepthSensingMesh=function(){return g.getMesh(D)},this.getCameraTexture=function($){return f[$]};let Vt=null;function Zt($,st){if(u=st.getViewerPose(l||o),m=st,u!==null){const wt=u.views;d!==null&&(t.setRenderTargetFramebuffer(y,d.framebuffer),t.setRenderTarget(y));let Lt=!1;wt.length!==D.cameras.length&&(D.cameras.length=0,Lt=!0);for(let U=0;U<wt.length;U++){const it=wt[U];let J=null;if(d!==null)J=d.getViewport(it);else{const et=h.getViewSubImage(p,it);J=et.viewport,U===0&&(t.setRenderTargetTextures(y,et.colorTexture,et.depthStencilTexture),t.setRenderTarget(y))}let Q=E[U];Q===void 0&&(Q=new ln,Q.layers.enable(U),Q.viewport=new be,E[U]=Q),Q.matrix.fromArray(it.transform.matrix),Q.matrix.decompose(Q.position,Q.quaternion,Q.scale),Q.projectionMatrix.fromArray(it.projectionMatrix),Q.projectionMatrixInverse.copy(Q.projectionMatrix).invert(),Q.viewport.set(J.x,J.y,J.width,J.height),U===0&&(D.matrix.copy(Q.matrix),D.matrix.decompose(D.position,D.quaternion,D.scale)),Lt===!0&&D.cameras.push(Q)}const Rt=i.enabledFeatures;if(Rt&&Rt.includes("depth-sensing")&&i.depthUsage=="gpu-optimized"&&v){h=n.getBinding();const U=h.getDepthInformation(wt[0]);U&&U.isValid&&U.texture&&g.init(U,i.renderState)}if(Rt&&Rt.includes("camera-access")&&v){t.state.unbindTexture(),h=n.getBinding();for(let U=0;U<wt.length;U++){const it=wt[U].camera;if(it){let J=f[it];J||(J=new Tu,f[it]=J);const Q=h.getCameraImage(it);J.sourceTexture=Q}}}}for(let wt=0;wt<w.length;wt++){const Lt=S[wt],Rt=w[wt];Lt!==null&&Rt!==void 0&&Rt.update(Lt,st,l||o)}Vt&&Vt($,st),st.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:st}),m=null}const Kt=new Fu;Kt.setAnimationLoop(Zt),this.setAnimationLoop=function($){Vt=$},this.dispose=function(){}}}const Wi=new Ye,S_=new Et;function w_(s,t){function e(g,f){g.matrixAutoUpdate===!0&&g.updateMatrix(),f.value.copy(g.matrix)}function n(g,f){f.color.getRGB(g.fogColor.value,vu(s)),f.isFog?(g.fogNear.value=f.near,g.fogFar.value=f.far):f.isFogExp2&&(g.fogDensity.value=f.density)}function i(g,f,x,_,y){f.isMeshBasicMaterial||f.isMeshLambertMaterial?r(g,f):f.isMeshToonMaterial?(r(g,f),h(g,f)):f.isMeshPhongMaterial?(r(g,f),u(g,f)):f.isMeshStandardMaterial?(r(g,f),p(g,f),f.isMeshPhysicalMaterial&&d(g,f,y)):f.isMeshMatcapMaterial?(r(g,f),m(g,f)):f.isMeshDepthMaterial?r(g,f):f.isMeshDistanceMaterial?(r(g,f),v(g,f)):f.isMeshNormalMaterial?r(g,f):f.isLineBasicMaterial?(o(g,f),f.isLineDashedMaterial&&a(g,f)):f.isPointsMaterial?c(g,f,x,_):f.isSpriteMaterial?l(g,f):f.isShadowMaterial?(g.color.value.copy(f.color),g.opacity.value=f.opacity):f.isShaderMaterial&&(f.uniformsNeedUpdate=!1)}function r(g,f){g.opacity.value=f.opacity,f.color&&g.diffuse.value.copy(f.color),f.emissive&&g.emissive.value.copy(f.emissive).multiplyScalar(f.emissiveIntensity),f.map&&(g.map.value=f.map,e(f.map,g.mapTransform)),f.alphaMap&&(g.alphaMap.value=f.alphaMap,e(f.alphaMap,g.alphaMapTransform)),f.bumpMap&&(g.bumpMap.value=f.bumpMap,e(f.bumpMap,g.bumpMapTransform),g.bumpScale.value=f.bumpScale,f.side===nn&&(g.bumpScale.value*=-1)),f.normalMap&&(g.normalMap.value=f.normalMap,e(f.normalMap,g.normalMapTransform),g.normalScale.value.copy(f.normalScale),f.side===nn&&g.normalScale.value.negate()),f.displacementMap&&(g.displacementMap.value=f.displacementMap,e(f.displacementMap,g.displacementMapTransform),g.displacementScale.value=f.displacementScale,g.displacementBias.value=f.displacementBias),f.emissiveMap&&(g.emissiveMap.value=f.emissiveMap,e(f.emissiveMap,g.emissiveMapTransform)),f.specularMap&&(g.specularMap.value=f.specularMap,e(f.specularMap,g.specularMapTransform)),f.alphaTest>0&&(g.alphaTest.value=f.alphaTest);const x=t.get(f),_=x.envMap,y=x.envMapRotation;_&&(g.envMap.value=_,Wi.copy(y),Wi.x*=-1,Wi.y*=-1,Wi.z*=-1,_.isCubeTexture&&_.isRenderTargetTexture===!1&&(Wi.y*=-1,Wi.z*=-1),g.envMapRotation.value.setFromMatrix4(S_.makeRotationFromEuler(Wi)),g.flipEnvMap.value=_.isCubeTexture&&_.isRenderTargetTexture===!1?-1:1,g.reflectivity.value=f.reflectivity,g.ior.value=f.ior,g.refractionRatio.value=f.refractionRatio),f.lightMap&&(g.lightMap.value=f.lightMap,g.lightMapIntensity.value=f.lightMapIntensity,e(f.lightMap,g.lightMapTransform)),f.aoMap&&(g.aoMap.value=f.aoMap,g.aoMapIntensity.value=f.aoMapIntensity,e(f.aoMap,g.aoMapTransform))}function o(g,f){g.diffuse.value.copy(f.color),g.opacity.value=f.opacity,f.map&&(g.map.value=f.map,e(f.map,g.mapTransform))}function a(g,f){g.dashSize.value=f.dashSize,g.totalSize.value=f.dashSize+f.gapSize,g.scale.value=f.scale}function c(g,f,x,_){g.diffuse.value.copy(f.color),g.opacity.value=f.opacity,g.size.value=f.size*x,g.scale.value=_*.5,f.map&&(g.map.value=f.map,e(f.map,g.uvTransform)),f.alphaMap&&(g.alphaMap.value=f.alphaMap,e(f.alphaMap,g.alphaMapTransform)),f.alphaTest>0&&(g.alphaTest.value=f.alphaTest)}function l(g,f){g.diffuse.value.copy(f.color),g.opacity.value=f.opacity,g.rotation.value=f.rotation,f.map&&(g.map.value=f.map,e(f.map,g.mapTransform)),f.alphaMap&&(g.alphaMap.value=f.alphaMap,e(f.alphaMap,g.alphaMapTransform)),f.alphaTest>0&&(g.alphaTest.value=f.alphaTest)}function u(g,f){g.specular.value.copy(f.specular),g.shininess.value=Math.max(f.shininess,1e-4)}function h(g,f){f.gradientMap&&(g.gradientMap.value=f.gradientMap)}function p(g,f){g.metalness.value=f.metalness,f.metalnessMap&&(g.metalnessMap.value=f.metalnessMap,e(f.metalnessMap,g.metalnessMapTransform)),g.roughness.value=f.roughness,f.roughnessMap&&(g.roughnessMap.value=f.roughnessMap,e(f.roughnessMap,g.roughnessMapTransform)),f.envMap&&(g.envMapIntensity.value=f.envMapIntensity)}function d(g,f,x){g.ior.value=f.ior,f.sheen>0&&(g.sheenColor.value.copy(f.sheenColor).multiplyScalar(f.sheen),g.sheenRoughness.value=f.sheenRoughness,f.sheenColorMap&&(g.sheenColorMap.value=f.sheenColorMap,e(f.sheenColorMap,g.sheenColorMapTransform)),f.sheenRoughnessMap&&(g.sheenRoughnessMap.value=f.sheenRoughnessMap,e(f.sheenRoughnessMap,g.sheenRoughnessMapTransform))),f.clearcoat>0&&(g.clearcoat.value=f.clearcoat,g.clearcoatRoughness.value=f.clearcoatRoughness,f.clearcoatMap&&(g.clearcoatMap.value=f.clearcoatMap,e(f.clearcoatMap,g.clearcoatMapTransform)),f.clearcoatRoughnessMap&&(g.clearcoatRoughnessMap.value=f.clearcoatRoughnessMap,e(f.clearcoatRoughnessMap,g.clearcoatRoughnessMapTransform)),f.clearcoatNormalMap&&(g.clearcoatNormalMap.value=f.clearcoatNormalMap,e(f.clearcoatNormalMap,g.clearcoatNormalMapTransform),g.clearcoatNormalScale.value.copy(f.clearcoatNormalScale),f.side===nn&&g.clearcoatNormalScale.value.negate())),f.dispersion>0&&(g.dispersion.value=f.dispersion),f.iridescence>0&&(g.iridescence.value=f.iridescence,g.iridescenceIOR.value=f.iridescenceIOR,g.iridescenceThicknessMinimum.value=f.iridescenceThicknessRange[0],g.iridescenceThicknessMaximum.value=f.iridescenceThicknessRange[1],f.iridescenceMap&&(g.iridescenceMap.value=f.iridescenceMap,e(f.iridescenceMap,g.iridescenceMapTransform)),f.iridescenceThicknessMap&&(g.iridescenceThicknessMap.value=f.iridescenceThicknessMap,e(f.iridescenceThicknessMap,g.iridescenceThicknessMapTransform))),f.transmission>0&&(g.transmission.value=f.transmission,g.transmissionSamplerMap.value=x.texture,g.transmissionSamplerSize.value.set(x.width,x.height),f.transmissionMap&&(g.transmissionMap.value=f.transmissionMap,e(f.transmissionMap,g.transmissionMapTransform)),g.thickness.value=f.thickness,f.thicknessMap&&(g.thicknessMap.value=f.thicknessMap,e(f.thicknessMap,g.thicknessMapTransform)),g.attenuationDistance.value=f.attenuationDistance,g.attenuationColor.value.copy(f.attenuationColor)),f.anisotropy>0&&(g.anisotropyVector.value.set(f.anisotropy*Math.cos(f.anisotropyRotation),f.anisotropy*Math.sin(f.anisotropyRotation)),f.anisotropyMap&&(g.anisotropyMap.value=f.anisotropyMap,e(f.anisotropyMap,g.anisotropyMapTransform))),g.specularIntensity.value=f.specularIntensity,g.specularColor.value.copy(f.specularColor),f.specularColorMap&&(g.specularColorMap.value=f.specularColorMap,e(f.specularColorMap,g.specularColorMapTransform)),f.specularIntensityMap&&(g.specularIntensityMap.value=f.specularIntensityMap,e(f.specularIntensityMap,g.specularIntensityMapTransform))}function m(g,f){f.matcap&&(g.matcap.value=f.matcap)}function v(g,f){const x=t.get(f).light;g.referencePosition.value.setFromMatrixPosition(x.matrixWorld),g.nearDistance.value=x.shadow.camera.near,g.farDistance.value=x.shadow.camera.far}return{refreshFogUniforms:n,refreshMaterialUniforms:i}}function T_(s,t,e,n){let i={},r={},o=[];const a=s.getParameter(s.MAX_UNIFORM_BUFFER_BINDINGS);function c(x,_){const y=_.program;n.uniformBlockBinding(x,y)}function l(x,_){let y=i[x.id];y===void 0&&(m(x),y=u(x),i[x.id]=y,x.addEventListener("dispose",g));const w=_.program;n.updateUBOMapping(x,w);const S=t.render.frame;r[x.id]!==S&&(p(x),r[x.id]=S)}function u(x){const _=h();x.__bindingPointIndex=_;const y=s.createBuffer(),w=x.__size,S=x.usage;return s.bindBuffer(s.UNIFORM_BUFFER,y),s.bufferData(s.UNIFORM_BUFFER,w,S),s.bindBuffer(s.UNIFORM_BUFFER,null),s.bindBufferBase(s.UNIFORM_BUFFER,_,y),y}function h(){for(let x=0;x<a;x++)if(o.indexOf(x)===-1)return o.push(x),x;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function p(x){const _=i[x.id],y=x.uniforms,w=x.__cache;s.bindBuffer(s.UNIFORM_BUFFER,_);for(let S=0,T=y.length;S<T;S++){const C=Array.isArray(y[S])?y[S]:[y[S]];for(let b=0,M=C.length;b<M;b++){const E=C[b];if(d(E,S,b,w)===!0){const D=E.__offset,N=Array.isArray(E.value)?E.value:[E.value];let I=0;for(let F=0;F<N.length;F++){const z=N[F],X=v(z);typeof z=="number"||typeof z=="boolean"?(E.__data[0]=z,s.bufferSubData(s.UNIFORM_BUFFER,D+I,E.__data)):z.isMatrix3?(E.__data[0]=z.elements[0],E.__data[1]=z.elements[1],E.__data[2]=z.elements[2],E.__data[3]=0,E.__data[4]=z.elements[3],E.__data[5]=z.elements[4],E.__data[6]=z.elements[5],E.__data[7]=0,E.__data[8]=z.elements[6],E.__data[9]=z.elements[7],E.__data[10]=z.elements[8],E.__data[11]=0):(z.toArray(E.__data,I),I+=X.storage/Float32Array.BYTES_PER_ELEMENT)}s.bufferSubData(s.UNIFORM_BUFFER,D,E.__data)}}}s.bindBuffer(s.UNIFORM_BUFFER,null)}function d(x,_,y,w){const S=x.value,T=_+"_"+y;if(w[T]===void 0)return typeof S=="number"||typeof S=="boolean"?w[T]=S:w[T]=S.clone(),!0;{const C=w[T];if(typeof S=="number"||typeof S=="boolean"){if(C!==S)return w[T]=S,!0}else if(C.equals(S)===!1)return C.copy(S),!0}return!1}function m(x){const _=x.uniforms;let y=0;const w=16;for(let T=0,C=_.length;T<C;T++){const b=Array.isArray(_[T])?_[T]:[_[T]];for(let M=0,E=b.length;M<E;M++){const D=b[M],N=Array.isArray(D.value)?D.value:[D.value];for(let I=0,F=N.length;I<F;I++){const z=N[I],X=v(z),k=y%w,K=k%X.boundary,rt=k+K;y+=K,rt!==0&&w-rt<X.storage&&(y+=w-rt),D.__data=new Float32Array(X.storage/Float32Array.BYTES_PER_ELEMENT),D.__offset=y,y+=X.storage}}}const S=y%w;return S>0&&(y+=w-S),x.__size=y,x.__cache={},this}function v(x){const _={boundary:0,storage:0};return typeof x=="number"||typeof x=="boolean"?(_.boundary=4,_.storage=4):x.isVector2?(_.boundary=8,_.storage=8):x.isVector3||x.isColor?(_.boundary=16,_.storage=12):x.isVector4?(_.boundary=16,_.storage=16):x.isMatrix3?(_.boundary=48,_.storage=48):x.isMatrix4?(_.boundary=64,_.storage=64):x.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",x),_}function g(x){const _=x.target;_.removeEventListener("dispose",g);const y=o.indexOf(_.__bindingPointIndex);o.splice(y,1),s.deleteBuffer(i[_.id]),delete i[_.id],delete r[_.id]}function f(){for(const x in i)s.deleteBuffer(i[x]);o=[],i={},r={}}return{bind:c,update:l,dispose:f}}class E_{constructor(t={}){const{canvas:e=df(),context:n=null,depth:i=!0,stencil:r=!1,alpha:o=!1,antialias:a=!1,premultipliedAlpha:c=!0,preserveDrawingBuffer:l=!1,powerPreference:u="default",failIfMajorPerformanceCaveat:h=!1,reversedDepthBuffer:p=!1}=t;this.isWebGLRenderer=!0;let d;if(n!==null){if(typeof WebGLRenderingContext<"u"&&n instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");d=n.getContextAttributes().alpha}else d=o;const m=new Uint32Array(4),v=new Int32Array(4);let g=null,f=null;const x=[],_=[];this.domElement=e,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=Ci,this.toneMappingExposure=1,this.transmissionResolutionScale=1;const y=this;let w=!1;this._outputColorSpace=ae;let S=0,T=0,C=null,b=-1,M=null;const E=new be,D=new be;let N=null;const I=new lt(0);let F=0,z=e.width,X=e.height,k=1,K=null,rt=null;const Z=new be(0,0,z,X),mt=new be(0,0,z,X);let Vt=!1;const Zt=new Lr;let Kt=!1,$=!1;const st=new Et,wt=new A,Lt=new be,Rt={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};let ee=!1;function se(){return C===null?k:1}let U=n;function it(P,B){return e.getContext(P,B)}try{const P={alpha:!0,depth:i,stencil:r,antialias:a,premultipliedAlpha:c,preserveDrawingBuffer:l,powerPreference:u,failIfMajorPerformanceCaveat:h};if("setAttribute"in e&&e.setAttribute("data-engine",`three.js r${Wc}`),e.addEventListener("webglcontextlost",yt,!1),e.addEventListener("webglcontextrestored",Dt,!1),e.addEventListener("webglcontextcreationerror",ut,!1),U===null){const B="webgl2";if(U=it(B,P),U===null)throw it(B)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}}catch(P){throw console.error("THREE.WebGLRenderer: "+P.message),P}let J,Q,et,vt,ct,xt,Qt,jt,L,R,H,Y,ot,j,zt,gt,Ut,Nt,ht,At,qt,Bt,St,re;function O(){J=new Fg(U),J.init(),Bt=new __(U,J),Q=new Cg(U,J,t,Bt),et=new g_(U,J),Q.reversedDepthBuffer&&p&&et.buffers.depth.setReversed(!0),vt=new Bg(U),ct=new i_,xt=new v_(U,J,et,ct,Q,Bt,vt),Qt=new Dg(y),jt=new Ng(y),L=new X0(U),St=new Ag(U,L),R=new zg(U,L,vt,St),H=new Vg(U,R,L,vt),ht=new kg(U,Q,xt),gt=new Pg(ct),Y=new n_(y,Qt,jt,J,Q,St,gt),ot=new w_(y,ct),j=new r_,zt=new u_(J),Nt=new Eg(y,Qt,jt,et,H,d,c),Ut=new p_(y,H,Q),re=new T_(U,vt,Q,et),At=new Rg(U,J,vt),qt=new Og(U,J,vt),vt.programs=Y.programs,y.capabilities=Q,y.extensions=J,y.properties=ct,y.renderLists=j,y.shadowMap=Ut,y.state=et,y.info=vt}O();const ft=new b_(y,U);this.xr=ft,this.getContext=function(){return U},this.getContextAttributes=function(){return U.getContextAttributes()},this.forceContextLoss=function(){const P=J.get("WEBGL_lose_context");P&&P.loseContext()},this.forceContextRestore=function(){const P=J.get("WEBGL_lose_context");P&&P.restoreContext()},this.getPixelRatio=function(){return k},this.setPixelRatio=function(P){P!==void 0&&(k=P,this.setSize(z,X,!1))},this.getSize=function(P){return P.set(z,X)},this.setSize=function(P,B,W=!0){if(ft.isPresenting){console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");return}z=P,X=B,e.width=Math.floor(P*k),e.height=Math.floor(B*k),W===!0&&(e.style.width=P+"px",e.style.height=B+"px"),this.setViewport(0,0,P,B)},this.getDrawingBufferSize=function(P){return P.set(z*k,X*k).floor()},this.setDrawingBufferSize=function(P,B,W){z=P,X=B,k=W,e.width=Math.floor(P*W),e.height=Math.floor(B*W),this.setViewport(0,0,P,B)},this.getCurrentViewport=function(P){return P.copy(E)},this.getViewport=function(P){return P.copy(Z)},this.setViewport=function(P,B,W,q){P.isVector4?Z.set(P.x,P.y,P.z,P.w):Z.set(P,B,W,q),et.viewport(E.copy(Z).multiplyScalar(k).round())},this.getScissor=function(P){return P.copy(mt)},this.setScissor=function(P,B,W,q){P.isVector4?mt.set(P.x,P.y,P.z,P.w):mt.set(P,B,W,q),et.scissor(D.copy(mt).multiplyScalar(k).round())},this.getScissorTest=function(){return Vt},this.setScissorTest=function(P){et.setScissorTest(Vt=P)},this.setOpaqueSort=function(P){K=P},this.setTransparentSort=function(P){rt=P},this.getClearColor=function(P){return P.copy(Nt.getClearColor())},this.setClearColor=function(){Nt.setClearColor(...arguments)},this.getClearAlpha=function(){return Nt.getClearAlpha()},this.setClearAlpha=function(){Nt.setClearAlpha(...arguments)},this.clear=function(P=!0,B=!0,W=!0){let q=0;if(P){let V=!1;if(C!==null){const dt=C.texture.format;V=dt===$c||dt===jc||dt===Yo}if(V){const dt=C.texture.type,Tt=dt===ei||dt===Pi||dt===Tr||dt===Er||dt===qc||dt===Yc,It=Nt.getClearColor(),Pt=Nt.getClearAlpha(),Xt=It.r,Yt=It.g,kt=It.b;Tt?(m[0]=Xt,m[1]=Yt,m[2]=kt,m[3]=Pt,U.clearBufferuiv(U.COLOR,0,m)):(v[0]=Xt,v[1]=Yt,v[2]=kt,v[3]=Pt,U.clearBufferiv(U.COLOR,0,v))}else q|=U.COLOR_BUFFER_BIT}B&&(q|=U.DEPTH_BUFFER_BIT),W&&(q|=U.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),U.clear(q)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){e.removeEventListener("webglcontextlost",yt,!1),e.removeEventListener("webglcontextrestored",Dt,!1),e.removeEventListener("webglcontextcreationerror",ut,!1),Nt.dispose(),j.dispose(),zt.dispose(),ct.dispose(),Qt.dispose(),jt.dispose(),H.dispose(),St.dispose(),re.dispose(),Y.dispose(),ft.dispose(),ft.removeEventListener("sessionstart",Gn),ft.removeEventListener("sessionend",fl),Ni.stop()};function yt(P){P.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),w=!0}function Dt(){console.log("THREE.WebGLRenderer: Context Restored."),w=!1;const P=vt.autoReset,B=Ut.enabled,W=Ut.autoUpdate,q=Ut.needsUpdate,V=Ut.type;O(),vt.autoReset=P,Ut.enabled=B,Ut.autoUpdate=W,Ut.needsUpdate=q,Ut.type=V}function ut(P){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",P.statusMessage)}function nt(P){const B=P.target;B.removeEventListener("dispose",nt),Ft(B)}function Ft(P){te(P),ct.remove(P)}function te(P){const B=ct.get(P).programs;B!==void 0&&(B.forEach(function(W){Y.releaseProgram(W)}),P.isShaderMaterial&&Y.releaseShaderCache(P))}this.renderBufferDirect=function(P,B,W,q,V,dt){B===null&&(B=Rt);const Tt=V.isMesh&&V.matrixWorld.determinant()<0,It=ed(P,B,W,q,V);et.setMaterial(q,Tt);let Pt=W.index,Xt=1;if(q.wireframe===!0){if(Pt=R.getWireframeAttribute(W),Pt===void 0)return;Xt=2}const Yt=W.drawRange,kt=W.attributes.position;let he=Yt.start*Xt,Se=(Yt.start+Yt.count)*Xt;dt!==null&&(he=Math.max(he,dt.start*Xt),Se=Math.min(Se,(dt.start+dt.count)*Xt)),Pt!==null?(he=Math.max(he,0),Se=Math.min(Se,Pt.count)):kt!=null&&(he=Math.max(he,0),Se=Math.min(Se,kt.count));const Ue=Se-he;if(Ue<0||Ue===1/0)return;St.setup(V,q,It,W,Pt);let Ce,Ee=At;if(Pt!==null&&(Ce=L.get(Pt),Ee=qt,Ee.setIndex(Ce)),V.isMesh)q.wireframe===!0?(et.setLineWidth(q.wireframeLinewidth*se()),Ee.setMode(U.LINES)):Ee.setMode(U.TRIANGLES);else if(V.isLine){let Wt=q.linewidth;Wt===void 0&&(Wt=1),et.setLineWidth(Wt*se()),V.isLineSegments?Ee.setMode(U.LINES):V.isLineLoop?Ee.setMode(U.LINE_LOOP):Ee.setMode(U.LINE_STRIP)}else V.isPoints?Ee.setMode(U.POINTS):V.isSprite&&Ee.setMode(U.TRIANGLES);if(V.isBatchedMesh)if(V._multiDrawInstances!==null)Cr("THREE.WebGLRenderer: renderMultiDrawInstances has been deprecated and will be removed in r184. Append to renderMultiDraw arguments and use indirection."),Ee.renderMultiDrawInstances(V._multiDrawStarts,V._multiDrawCounts,V._multiDrawCount,V._multiDrawInstances);else if(J.get("WEBGL_multi_draw"))Ee.renderMultiDraw(V._multiDrawStarts,V._multiDrawCounts,V._multiDrawCount);else{const Wt=V._multiDrawStarts,De=V._multiDrawCounts,ge=V._multiDrawCount,un=Pt?L.get(Pt).bytesPerElement:1,os=ct.get(q).currentProgram.getUniforms();for(let dn=0;dn<ge;dn++)os.setValue(U,"_gl_DrawID",dn),Ee.render(Wt[dn]/un,De[dn])}else if(V.isInstancedMesh)Ee.renderInstances(he,Ue,V.count);else if(W.isInstancedBufferGeometry){const Wt=W._maxInstanceCount!==void 0?W._maxInstanceCount:1/0,De=Math.min(W.instanceCount,Wt);Ee.renderInstances(he,Ue,De)}else Ee.render(he,Ue)};function Re(P,B,W){P.transparent===!0&&P.side===Xe&&P.forceSinglePass===!1?(P.side=nn,P.needsUpdate=!0,Or(P,B,W),P.side=pi,P.needsUpdate=!0,Or(P,B,W),P.side=Xe):Or(P,B,W)}this.compile=function(P,B,W=null){W===null&&(W=P),f=zt.get(W),f.init(B),_.push(f),W.traverseVisible(function(V){V.isLight&&V.layers.test(B.layers)&&(f.pushLight(V),V.castShadow&&f.pushShadow(V))}),P!==W&&P.traverseVisible(function(V){V.isLight&&V.layers.test(B.layers)&&(f.pushLight(V),V.castShadow&&f.pushShadow(V))}),f.setupLights();const q=new Set;return P.traverse(function(V){if(!(V.isMesh||V.isPoints||V.isLine||V.isSprite))return;const dt=V.material;if(dt)if(Array.isArray(dt))for(let Tt=0;Tt<dt.length;Tt++){const It=dt[Tt];Re(It,W,V),q.add(It)}else Re(dt,W,V),q.add(dt)}),f=_.pop(),q},this.compileAsync=function(P,B,W=null){const q=this.compile(P,B,W);return new Promise(V=>{function dt(){if(q.forEach(function(Tt){ct.get(Tt).currentProgram.isReady()&&q.delete(Tt)}),q.size===0){V(P);return}setTimeout(dt,10)}J.get("KHR_parallel_shader_compile")!==null?dt():setTimeout(dt,10)})};let ve=null;function ii(P){ve&&ve(P)}function Gn(){Ni.stop()}function fl(){Ni.start()}const Ni=new Fu;Ni.setAnimationLoop(ii),typeof self<"u"&&Ni.setContext(self),this.setAnimationLoop=function(P){ve=P,ft.setAnimationLoop(P),P===null?Ni.stop():Ni.start()},ft.addEventListener("sessionstart",Gn),ft.addEventListener("sessionend",fl),this.render=function(P,B){if(B!==void 0&&B.isCamera!==!0){console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(w===!0)return;if(P.matrixWorldAutoUpdate===!0&&P.updateMatrixWorld(),B.parent===null&&B.matrixWorldAutoUpdate===!0&&B.updateMatrixWorld(),ft.enabled===!0&&ft.isPresenting===!0&&(ft.cameraAutoUpdate===!0&&ft.updateCamera(B),B=ft.getCamera()),P.isScene===!0&&P.onBeforeRender(y,P,B,C),f=zt.get(P,_.length),f.init(B),_.push(f),st.multiplyMatrices(B.projectionMatrix,B.matrixWorldInverse),Zt.setFromProjectionMatrix(st,zn,B.reversedDepth),$=this.localClippingEnabled,Kt=gt.init(this.clippingPlanes,$),g=j.get(P,x.length),g.init(),x.push(g),ft.enabled===!0&&ft.isPresenting===!0){const dt=y.xr.getDepthSensingMesh();dt!==null&&na(dt,B,-1/0,y.sortObjects)}na(P,B,0,y.sortObjects),g.finish(),y.sortObjects===!0&&g.sort(K,rt),ee=ft.enabled===!1||ft.isPresenting===!1||ft.hasDepthSensing()===!1,ee&&Nt.addToRenderList(g,P),this.info.render.frame++,Kt===!0&&gt.beginShadows();const W=f.state.shadowsArray;Ut.render(W,P,B),Kt===!0&&gt.endShadows(),this.info.autoReset===!0&&this.info.reset();const q=g.opaque,V=g.transmissive;if(f.setupLights(),B.isArrayCamera){const dt=B.cameras;if(V.length>0)for(let Tt=0,It=dt.length;Tt<It;Tt++){const Pt=dt[Tt];ml(q,V,P,Pt)}ee&&Nt.render(P);for(let Tt=0,It=dt.length;Tt<It;Tt++){const Pt=dt[Tt];pl(g,P,Pt,Pt.viewport)}}else V.length>0&&ml(q,V,P,B),ee&&Nt.render(P),pl(g,P,B);C!==null&&T===0&&(xt.updateMultisampleRenderTarget(C),xt.updateRenderTargetMipmap(C)),P.isScene===!0&&P.onAfterRender(y,P,B),St.resetDefaultState(),b=-1,M=null,_.pop(),_.length>0?(f=_[_.length-1],Kt===!0&&gt.setGlobalState(y.clippingPlanes,f.state.camera)):f=null,x.pop(),x.length>0?g=x[x.length-1]:g=null};function na(P,B,W,q){if(P.visible===!1)return;if(P.layers.test(B.layers)){if(P.isGroup)W=P.renderOrder;else if(P.isLOD)P.autoUpdate===!0&&P.update(B);else if(P.isLight)f.pushLight(P),P.castShadow&&f.pushShadow(P);else if(P.isSprite){if(!P.frustumCulled||Zt.intersectsSprite(P)){q&&Lt.setFromMatrixPosition(P.matrixWorld).applyMatrix4(st);const Tt=H.update(P),It=P.material;It.visible&&g.push(P,Tt,It,W,Lt.z,null)}}else if((P.isMesh||P.isLine||P.isPoints)&&(!P.frustumCulled||Zt.intersectsObject(P))){const Tt=H.update(P),It=P.material;if(q&&(P.boundingSphere!==void 0?(P.boundingSphere===null&&P.computeBoundingSphere(),Lt.copy(P.boundingSphere.center)):(Tt.boundingSphere===null&&Tt.computeBoundingSphere(),Lt.copy(Tt.boundingSphere.center)),Lt.applyMatrix4(P.matrixWorld).applyMatrix4(st)),Array.isArray(It)){const Pt=Tt.groups;for(let Xt=0,Yt=Pt.length;Xt<Yt;Xt++){const kt=Pt[Xt],he=It[kt.materialIndex];he&&he.visible&&g.push(P,Tt,he,W,Lt.z,kt)}}else It.visible&&g.push(P,Tt,It,W,Lt.z,null)}}const dt=P.children;for(let Tt=0,It=dt.length;Tt<It;Tt++)na(dt[Tt],B,W,q)}function pl(P,B,W,q){const V=P.opaque,dt=P.transmissive,Tt=P.transparent;f.setupLightsView(W),Kt===!0&&gt.setGlobalState(y.clippingPlanes,W),q&&et.viewport(E.copy(q)),V.length>0&&zr(V,B,W),dt.length>0&&zr(dt,B,W),Tt.length>0&&zr(Tt,B,W),et.buffers.depth.setTest(!0),et.buffers.depth.setMask(!0),et.buffers.color.setMask(!0),et.setPolygonOffset(!1)}function ml(P,B,W,q){if((W.isScene===!0?W.overrideMaterial:null)!==null)return;f.state.transmissionRenderTarget[q.id]===void 0&&(f.state.transmissionRenderTarget[q.id]=new Rn(1,1,{generateMipmaps:!0,type:J.has("EXT_color_buffer_half_float")||J.has("EXT_color_buffer_float")?Qn:ei,minFilter:Ji,samples:4,stencilBuffer:r,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:fe.workingColorSpace}));const dt=f.state.transmissionRenderTarget[q.id],Tt=q.viewport||E;dt.setSize(Tt.z*y.transmissionResolutionScale,Tt.w*y.transmissionResolutionScale);const It=y.getRenderTarget(),Pt=y.getActiveCubeFace(),Xt=y.getActiveMipmapLevel();y.setRenderTarget(dt),y.getClearColor(I),F=y.getClearAlpha(),F<1&&y.setClearColor(16777215,.5),y.clear(),ee&&Nt.render(W);const Yt=y.toneMapping;y.toneMapping=Ci;const kt=q.viewport;if(q.viewport!==void 0&&(q.viewport=void 0),f.setupLightsView(q),Kt===!0&&gt.setGlobalState(y.clippingPlanes,q),zr(P,W,q),xt.updateMultisampleRenderTarget(dt),xt.updateRenderTargetMipmap(dt),J.has("WEBGL_multisampled_render_to_texture")===!1){let he=!1;for(let Se=0,Ue=B.length;Se<Ue;Se++){const Ce=B[Se],Ee=Ce.object,Wt=Ce.geometry,De=Ce.material,ge=Ce.group;if(De.side===Xe&&Ee.layers.test(q.layers)){const un=De.side;De.side=nn,De.needsUpdate=!0,gl(Ee,W,q,Wt,De,ge),De.side=un,De.needsUpdate=!0,he=!0}}he===!0&&(xt.updateMultisampleRenderTarget(dt),xt.updateRenderTargetMipmap(dt))}y.setRenderTarget(It,Pt,Xt),y.setClearColor(I,F),kt!==void 0&&(q.viewport=kt),y.toneMapping=Yt}function zr(P,B,W){const q=B.isScene===!0?B.overrideMaterial:null;for(let V=0,dt=P.length;V<dt;V++){const Tt=P[V],It=Tt.object,Pt=Tt.geometry,Xt=Tt.group;let Yt=Tt.material;Yt.allowOverride===!0&&q!==null&&(Yt=q),It.layers.test(W.layers)&&gl(It,B,W,Pt,Yt,Xt)}}function gl(P,B,W,q,V,dt){P.onBeforeRender(y,B,W,q,V,dt),P.modelViewMatrix.multiplyMatrices(W.matrixWorldInverse,P.matrixWorld),P.normalMatrix.getNormalMatrix(P.modelViewMatrix),V.onBeforeRender(y,B,W,q,P,dt),V.transparent===!0&&V.side===Xe&&V.forceSinglePass===!1?(V.side=nn,V.needsUpdate=!0,y.renderBufferDirect(W,B,q,V,P,dt),V.side=pi,V.needsUpdate=!0,y.renderBufferDirect(W,B,q,V,P,dt),V.side=Xe):y.renderBufferDirect(W,B,q,V,P,dt),P.onAfterRender(y,B,W,q,V,dt)}function Or(P,B,W){B.isScene!==!0&&(B=Rt);const q=ct.get(P),V=f.state.lights,dt=f.state.shadowsArray,Tt=V.state.version,It=Y.getParameters(P,V.state,dt,B,W),Pt=Y.getProgramCacheKey(It);let Xt=q.programs;q.environment=P.isMeshStandardMaterial?B.environment:null,q.fog=B.fog,q.envMap=(P.isMeshStandardMaterial?jt:Qt).get(P.envMap||q.environment),q.envMapRotation=q.environment!==null&&P.envMap===null?B.environmentRotation:P.envMapRotation,Xt===void 0&&(P.addEventListener("dispose",nt),Xt=new Map,q.programs=Xt);let Yt=Xt.get(Pt);if(Yt!==void 0){if(q.currentProgram===Yt&&q.lightsStateVersion===Tt)return _l(P,It),Yt}else It.uniforms=Y.getUniforms(P),P.onBeforeCompile(It,y),Yt=Y.acquireProgram(It,Pt),Xt.set(Pt,Yt),q.uniforms=It.uniforms;const kt=q.uniforms;return(!P.isShaderMaterial&&!P.isRawShaderMaterial||P.clipping===!0)&&(kt.clippingPlanes=gt.uniform),_l(P,It),q.needsLights=id(P),q.lightsStateVersion=Tt,q.needsLights&&(kt.ambientLightColor.value=V.state.ambient,kt.lightProbe.value=V.state.probe,kt.directionalLights.value=V.state.directional,kt.directionalLightShadows.value=V.state.directionalShadow,kt.spotLights.value=V.state.spot,kt.spotLightShadows.value=V.state.spotShadow,kt.rectAreaLights.value=V.state.rectArea,kt.ltc_1.value=V.state.rectAreaLTC1,kt.ltc_2.value=V.state.rectAreaLTC2,kt.pointLights.value=V.state.point,kt.pointLightShadows.value=V.state.pointShadow,kt.hemisphereLights.value=V.state.hemi,kt.directionalShadowMap.value=V.state.directionalShadowMap,kt.directionalShadowMatrix.value=V.state.directionalShadowMatrix,kt.spotShadowMap.value=V.state.spotShadowMap,kt.spotLightMatrix.value=V.state.spotLightMatrix,kt.spotLightMap.value=V.state.spotLightMap,kt.pointShadowMap.value=V.state.pointShadowMap,kt.pointShadowMatrix.value=V.state.pointShadowMatrix),q.currentProgram=Yt,q.uniformsList=null,Yt}function vl(P){if(P.uniformsList===null){const B=P.currentProgram.getUniforms();P.uniformsList=Do.seqWithValue(B.seq,P.uniforms)}return P.uniformsList}function _l(P,B){const W=ct.get(P);W.outputColorSpace=B.outputColorSpace,W.batching=B.batching,W.batchingColor=B.batchingColor,W.instancing=B.instancing,W.instancingColor=B.instancingColor,W.instancingMorph=B.instancingMorph,W.skinning=B.skinning,W.morphTargets=B.morphTargets,W.morphNormals=B.morphNormals,W.morphColors=B.morphColors,W.morphTargetsCount=B.morphTargetsCount,W.numClippingPlanes=B.numClippingPlanes,W.numIntersection=B.numClipIntersection,W.vertexAlphas=B.vertexAlphas,W.vertexTangents=B.vertexTangents,W.toneMapping=B.toneMapping}function ed(P,B,W,q,V){B.isScene!==!0&&(B=Rt),xt.resetTextureUnits();const dt=B.fog,Tt=q.isMeshStandardMaterial?B.environment:null,It=C===null?y.outputColorSpace:C.isXRRenderTarget===!0?C.texture.colorSpace:Bs,Pt=(q.isMeshStandardMaterial?jt:Qt).get(q.envMap||Tt),Xt=q.vertexColors===!0&&!!W.attributes.color&&W.attributes.color.itemSize===4,Yt=!!W.attributes.tangent&&(!!q.normalMap||q.anisotropy>0),kt=!!W.morphAttributes.position,he=!!W.morphAttributes.normal,Se=!!W.morphAttributes.color;let Ue=Ci;q.toneMapped&&(C===null||C.isXRRenderTarget===!0)&&(Ue=y.toneMapping);const Ce=W.morphAttributes.position||W.morphAttributes.normal||W.morphAttributes.color,Ee=Ce!==void 0?Ce.length:0,Wt=ct.get(q),De=f.state.lights;if(Kt===!0&&($===!0||P!==M)){const Je=P===M&&q.id===b;gt.setState(q,P,Je)}let ge=!1;q.version===Wt.__version?(Wt.needsLights&&Wt.lightsStateVersion!==De.state.version||Wt.outputColorSpace!==It||V.isBatchedMesh&&Wt.batching===!1||!V.isBatchedMesh&&Wt.batching===!0||V.isBatchedMesh&&Wt.batchingColor===!0&&V.colorTexture===null||V.isBatchedMesh&&Wt.batchingColor===!1&&V.colorTexture!==null||V.isInstancedMesh&&Wt.instancing===!1||!V.isInstancedMesh&&Wt.instancing===!0||V.isSkinnedMesh&&Wt.skinning===!1||!V.isSkinnedMesh&&Wt.skinning===!0||V.isInstancedMesh&&Wt.instancingColor===!0&&V.instanceColor===null||V.isInstancedMesh&&Wt.instancingColor===!1&&V.instanceColor!==null||V.isInstancedMesh&&Wt.instancingMorph===!0&&V.morphTexture===null||V.isInstancedMesh&&Wt.instancingMorph===!1&&V.morphTexture!==null||Wt.envMap!==Pt||q.fog===!0&&Wt.fog!==dt||Wt.numClippingPlanes!==void 0&&(Wt.numClippingPlanes!==gt.numPlanes||Wt.numIntersection!==gt.numIntersection)||Wt.vertexAlphas!==Xt||Wt.vertexTangents!==Yt||Wt.morphTargets!==kt||Wt.morphNormals!==he||Wt.morphColors!==Se||Wt.toneMapping!==Ue||Wt.morphTargetsCount!==Ee)&&(ge=!0):(ge=!0,Wt.__version=q.version);let un=Wt.currentProgram;ge===!0&&(un=Or(q,B,V));let os=!1,dn=!1,Ys=!1;const Ie=un.getUniforms(),bn=Wt.uniforms;if(et.useProgram(un.program)&&(os=!0,dn=!0,Ys=!0),q.id!==b&&(b=q.id,dn=!0),os||M!==P){et.buffers.depth.getReversed()&&P.reversedDepth!==!0&&(P._reversedDepth=!0,P.updateProjectionMatrix()),Ie.setValue(U,"projectionMatrix",P.projectionMatrix),Ie.setValue(U,"viewMatrix",P.matrixWorldInverse);const rn=Ie.map.cameraPosition;rn!==void 0&&rn.setValue(U,wt.setFromMatrixPosition(P.matrixWorld)),Q.logarithmicDepthBuffer&&Ie.setValue(U,"logDepthBufFC",2/(Math.log(P.far+1)/Math.LN2)),(q.isMeshPhongMaterial||q.isMeshToonMaterial||q.isMeshLambertMaterial||q.isMeshBasicMaterial||q.isMeshStandardMaterial||q.isShaderMaterial)&&Ie.setValue(U,"isOrthographic",P.isOrthographicCamera===!0),M!==P&&(M=P,dn=!0,Ys=!0)}if(V.isSkinnedMesh){Ie.setOptional(U,V,"bindMatrix"),Ie.setOptional(U,V,"bindMatrixInverse");const Je=V.skeleton;Je&&(Je.boneTexture===null&&Je.computeBoneTexture(),Ie.setValue(U,"boneTexture",Je.boneTexture,xt))}V.isBatchedMesh&&(Ie.setOptional(U,V,"batchingTexture"),Ie.setValue(U,"batchingTexture",V._matricesTexture,xt),Ie.setOptional(U,V,"batchingIdTexture"),Ie.setValue(U,"batchingIdTexture",V._indirectTexture,xt),Ie.setOptional(U,V,"batchingColorTexture"),V._colorsTexture!==null&&Ie.setValue(U,"batchingColorTexture",V._colorsTexture,xt));const Sn=W.morphAttributes;if((Sn.position!==void 0||Sn.normal!==void 0||Sn.color!==void 0)&&ht.update(V,W,un),(dn||Wt.receiveShadow!==V.receiveShadow)&&(Wt.receiveShadow=V.receiveShadow,Ie.setValue(U,"receiveShadow",V.receiveShadow)),q.isMeshGouraudMaterial&&q.envMap!==null&&(bn.envMap.value=Pt,bn.flipEnvMap.value=Pt.isCubeTexture&&Pt.isRenderTargetTexture===!1?-1:1),q.isMeshStandardMaterial&&q.envMap===null&&B.environment!==null&&(bn.envMapIntensity.value=B.environmentIntensity),dn&&(Ie.setValue(U,"toneMappingExposure",y.toneMappingExposure),Wt.needsLights&&nd(bn,Ys),dt&&q.fog===!0&&ot.refreshFogUniforms(bn,dt),ot.refreshMaterialUniforms(bn,q,k,X,f.state.transmissionRenderTarget[P.id]),Do.upload(U,vl(Wt),bn,xt)),q.isShaderMaterial&&q.uniformsNeedUpdate===!0&&(Do.upload(U,vl(Wt),bn,xt),q.uniformsNeedUpdate=!1),q.isSpriteMaterial&&Ie.setValue(U,"center",V.center),Ie.setValue(U,"modelViewMatrix",V.modelViewMatrix),Ie.setValue(U,"normalMatrix",V.normalMatrix),Ie.setValue(U,"modelMatrix",V.matrixWorld),q.isShaderMaterial||q.isRawShaderMaterial){const Je=q.uniformsGroups;for(let rn=0,ia=Je.length;rn<ia;rn++){const Fi=Je[rn];re.update(Fi,un),re.bind(Fi,un)}}return un}function nd(P,B){P.ambientLightColor.needsUpdate=B,P.lightProbe.needsUpdate=B,P.directionalLights.needsUpdate=B,P.directionalLightShadows.needsUpdate=B,P.pointLights.needsUpdate=B,P.pointLightShadows.needsUpdate=B,P.spotLights.needsUpdate=B,P.spotLightShadows.needsUpdate=B,P.rectAreaLights.needsUpdate=B,P.hemisphereLights.needsUpdate=B}function id(P){return P.isMeshLambertMaterial||P.isMeshToonMaterial||P.isMeshPhongMaterial||P.isMeshStandardMaterial||P.isShadowMaterial||P.isShaderMaterial&&P.lights===!0}this.getActiveCubeFace=function(){return S},this.getActiveMipmapLevel=function(){return T},this.getRenderTarget=function(){return C},this.setRenderTargetTextures=function(P,B,W){const q=ct.get(P);q.__autoAllocateDepthBuffer=P.resolveDepthBuffer===!1,q.__autoAllocateDepthBuffer===!1&&(q.__useRenderToTexture=!1),ct.get(P.texture).__webglTexture=B,ct.get(P.depthTexture).__webglTexture=q.__autoAllocateDepthBuffer?void 0:W,q.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(P,B){const W=ct.get(P);W.__webglFramebuffer=B,W.__useDefaultFramebuffer=B===void 0};const sd=U.createFramebuffer();this.setRenderTarget=function(P,B=0,W=0){C=P,S=B,T=W;let q=!0,V=null,dt=!1,Tt=!1;if(P){const Pt=ct.get(P);if(Pt.__useDefaultFramebuffer!==void 0)et.bindFramebuffer(U.FRAMEBUFFER,null),q=!1;else if(Pt.__webglFramebuffer===void 0)xt.setupRenderTarget(P);else if(Pt.__hasExternalTextures)xt.rebindTextures(P,ct.get(P.texture).__webglTexture,ct.get(P.depthTexture).__webglTexture);else if(P.depthBuffer){const kt=P.depthTexture;if(Pt.__boundDepthTexture!==kt){if(kt!==null&&ct.has(kt)&&(P.width!==kt.image.width||P.height!==kt.image.height))throw new Error("WebGLRenderTarget: Attached DepthTexture is initialized to the incorrect size.");xt.setupDepthRenderbuffer(P)}}const Xt=P.texture;(Xt.isData3DTexture||Xt.isDataArrayTexture||Xt.isCompressedArrayTexture)&&(Tt=!0);const Yt=ct.get(P).__webglFramebuffer;P.isWebGLCubeRenderTarget?(Array.isArray(Yt[B])?V=Yt[B][W]:V=Yt[B],dt=!0):P.samples>0&&xt.useMultisampledRTT(P)===!1?V=ct.get(P).__webglMultisampledFramebuffer:Array.isArray(Yt)?V=Yt[W]:V=Yt,E.copy(P.viewport),D.copy(P.scissor),N=P.scissorTest}else E.copy(Z).multiplyScalar(k).floor(),D.copy(mt).multiplyScalar(k).floor(),N=Vt;if(W!==0&&(V=sd),et.bindFramebuffer(U.FRAMEBUFFER,V)&&q&&et.drawBuffers(P,V),et.viewport(E),et.scissor(D),et.setScissorTest(N),dt){const Pt=ct.get(P.texture);U.framebufferTexture2D(U.FRAMEBUFFER,U.COLOR_ATTACHMENT0,U.TEXTURE_CUBE_MAP_POSITIVE_X+B,Pt.__webglTexture,W)}else if(Tt){const Pt=B;for(let Xt=0;Xt<P.textures.length;Xt++){const Yt=ct.get(P.textures[Xt]);U.framebufferTextureLayer(U.FRAMEBUFFER,U.COLOR_ATTACHMENT0+Xt,Yt.__webglTexture,W,Pt)}}else if(P!==null&&W!==0){const Pt=ct.get(P.texture);U.framebufferTexture2D(U.FRAMEBUFFER,U.COLOR_ATTACHMENT0,U.TEXTURE_2D,Pt.__webglTexture,W)}b=-1},this.readRenderTargetPixels=function(P,B,W,q,V,dt,Tt,It=0){if(!(P&&P.isWebGLRenderTarget)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let Pt=ct.get(P).__webglFramebuffer;if(P.isWebGLCubeRenderTarget&&Tt!==void 0&&(Pt=Pt[Tt]),Pt){et.bindFramebuffer(U.FRAMEBUFFER,Pt);try{const Xt=P.textures[It],Yt=Xt.format,kt=Xt.type;if(!Q.textureFormatReadable(Yt)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!Q.textureTypeReadable(kt)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}B>=0&&B<=P.width-q&&W>=0&&W<=P.height-V&&(P.textures.length>1&&U.readBuffer(U.COLOR_ATTACHMENT0+It),U.readPixels(B,W,q,V,Bt.convert(Yt),Bt.convert(kt),dt))}finally{const Xt=C!==null?ct.get(C).__webglFramebuffer:null;et.bindFramebuffer(U.FRAMEBUFFER,Xt)}}},this.readRenderTargetPixelsAsync=async function(P,B,W,q,V,dt,Tt,It=0){if(!(P&&P.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let Pt=ct.get(P).__webglFramebuffer;if(P.isWebGLCubeRenderTarget&&Tt!==void 0&&(Pt=Pt[Tt]),Pt)if(B>=0&&B<=P.width-q&&W>=0&&W<=P.height-V){et.bindFramebuffer(U.FRAMEBUFFER,Pt);const Xt=P.textures[It],Yt=Xt.format,kt=Xt.type;if(!Q.textureFormatReadable(Yt))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!Q.textureTypeReadable(kt))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");const he=U.createBuffer();U.bindBuffer(U.PIXEL_PACK_BUFFER,he),U.bufferData(U.PIXEL_PACK_BUFFER,dt.byteLength,U.STREAM_READ),P.textures.length>1&&U.readBuffer(U.COLOR_ATTACHMENT0+It),U.readPixels(B,W,q,V,Bt.convert(Yt),Bt.convert(kt),0);const Se=C!==null?ct.get(C).__webglFramebuffer:null;et.bindFramebuffer(U.FRAMEBUFFER,Se);const Ue=U.fenceSync(U.SYNC_GPU_COMMANDS_COMPLETE,0);return U.flush(),await ff(U,Ue,4),U.bindBuffer(U.PIXEL_PACK_BUFFER,he),U.getBufferSubData(U.PIXEL_PACK_BUFFER,0,dt),U.deleteBuffer(he),U.deleteSync(Ue),dt}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(P,B=null,W=0){const q=Math.pow(2,-W),V=Math.floor(P.image.width*q),dt=Math.floor(P.image.height*q),Tt=B!==null?B.x:0,It=B!==null?B.y:0;xt.setTexture2D(P,0),U.copyTexSubImage2D(U.TEXTURE_2D,W,0,0,Tt,It,V,dt),et.unbindTexture()};const rd=U.createFramebuffer(),od=U.createFramebuffer();this.copyTextureToTexture=function(P,B,W=null,q=null,V=0,dt=null){dt===null&&(V!==0?(Cr("WebGLRenderer: copyTextureToTexture function signature has changed to support src and dst mipmap levels."),dt=V,V=0):dt=0);let Tt,It,Pt,Xt,Yt,kt,he,Se,Ue;const Ce=P.isCompressedTexture?P.mipmaps[dt]:P.image;if(W!==null)Tt=W.max.x-W.min.x,It=W.max.y-W.min.y,Pt=W.isBox3?W.max.z-W.min.z:1,Xt=W.min.x,Yt=W.min.y,kt=W.isBox3?W.min.z:0;else{const Sn=Math.pow(2,-V);Tt=Math.floor(Ce.width*Sn),It=Math.floor(Ce.height*Sn),P.isDataArrayTexture?Pt=Ce.depth:P.isData3DTexture?Pt=Math.floor(Ce.depth*Sn):Pt=1,Xt=0,Yt=0,kt=0}q!==null?(he=q.x,Se=q.y,Ue=q.z):(he=0,Se=0,Ue=0);const Ee=Bt.convert(B.format),Wt=Bt.convert(B.type);let De;B.isData3DTexture?(xt.setTexture3D(B,0),De=U.TEXTURE_3D):B.isDataArrayTexture||B.isCompressedArrayTexture?(xt.setTexture2DArray(B,0),De=U.TEXTURE_2D_ARRAY):(xt.setTexture2D(B,0),De=U.TEXTURE_2D),U.pixelStorei(U.UNPACK_FLIP_Y_WEBGL,B.flipY),U.pixelStorei(U.UNPACK_PREMULTIPLY_ALPHA_WEBGL,B.premultiplyAlpha),U.pixelStorei(U.UNPACK_ALIGNMENT,B.unpackAlignment);const ge=U.getParameter(U.UNPACK_ROW_LENGTH),un=U.getParameter(U.UNPACK_IMAGE_HEIGHT),os=U.getParameter(U.UNPACK_SKIP_PIXELS),dn=U.getParameter(U.UNPACK_SKIP_ROWS),Ys=U.getParameter(U.UNPACK_SKIP_IMAGES);U.pixelStorei(U.UNPACK_ROW_LENGTH,Ce.width),U.pixelStorei(U.UNPACK_IMAGE_HEIGHT,Ce.height),U.pixelStorei(U.UNPACK_SKIP_PIXELS,Xt),U.pixelStorei(U.UNPACK_SKIP_ROWS,Yt),U.pixelStorei(U.UNPACK_SKIP_IMAGES,kt);const Ie=P.isDataArrayTexture||P.isData3DTexture,bn=B.isDataArrayTexture||B.isData3DTexture;if(P.isDepthTexture){const Sn=ct.get(P),Je=ct.get(B),rn=ct.get(Sn.__renderTarget),ia=ct.get(Je.__renderTarget);et.bindFramebuffer(U.READ_FRAMEBUFFER,rn.__webglFramebuffer),et.bindFramebuffer(U.DRAW_FRAMEBUFFER,ia.__webglFramebuffer);for(let Fi=0;Fi<Pt;Fi++)Ie&&(U.framebufferTextureLayer(U.READ_FRAMEBUFFER,U.COLOR_ATTACHMENT0,ct.get(P).__webglTexture,V,kt+Fi),U.framebufferTextureLayer(U.DRAW_FRAMEBUFFER,U.COLOR_ATTACHMENT0,ct.get(B).__webglTexture,dt,Ue+Fi)),U.blitFramebuffer(Xt,Yt,Tt,It,he,Se,Tt,It,U.DEPTH_BUFFER_BIT,U.NEAREST);et.bindFramebuffer(U.READ_FRAMEBUFFER,null),et.bindFramebuffer(U.DRAW_FRAMEBUFFER,null)}else if(V!==0||P.isRenderTargetTexture||ct.has(P)){const Sn=ct.get(P),Je=ct.get(B);et.bindFramebuffer(U.READ_FRAMEBUFFER,rd),et.bindFramebuffer(U.DRAW_FRAMEBUFFER,od);for(let rn=0;rn<Pt;rn++)Ie?U.framebufferTextureLayer(U.READ_FRAMEBUFFER,U.COLOR_ATTACHMENT0,Sn.__webglTexture,V,kt+rn):U.framebufferTexture2D(U.READ_FRAMEBUFFER,U.COLOR_ATTACHMENT0,U.TEXTURE_2D,Sn.__webglTexture,V),bn?U.framebufferTextureLayer(U.DRAW_FRAMEBUFFER,U.COLOR_ATTACHMENT0,Je.__webglTexture,dt,Ue+rn):U.framebufferTexture2D(U.DRAW_FRAMEBUFFER,U.COLOR_ATTACHMENT0,U.TEXTURE_2D,Je.__webglTexture,dt),V!==0?U.blitFramebuffer(Xt,Yt,Tt,It,he,Se,Tt,It,U.COLOR_BUFFER_BIT,U.NEAREST):bn?U.copyTexSubImage3D(De,dt,he,Se,Ue+rn,Xt,Yt,Tt,It):U.copyTexSubImage2D(De,dt,he,Se,Xt,Yt,Tt,It);et.bindFramebuffer(U.READ_FRAMEBUFFER,null),et.bindFramebuffer(U.DRAW_FRAMEBUFFER,null)}else bn?P.isDataTexture||P.isData3DTexture?U.texSubImage3D(De,dt,he,Se,Ue,Tt,It,Pt,Ee,Wt,Ce.data):B.isCompressedArrayTexture?U.compressedTexSubImage3D(De,dt,he,Se,Ue,Tt,It,Pt,Ee,Ce.data):U.texSubImage3D(De,dt,he,Se,Ue,Tt,It,Pt,Ee,Wt,Ce):P.isDataTexture?U.texSubImage2D(U.TEXTURE_2D,dt,he,Se,Tt,It,Ee,Wt,Ce.data):P.isCompressedTexture?U.compressedTexSubImage2D(U.TEXTURE_2D,dt,he,Se,Ce.width,Ce.height,Ee,Ce.data):U.texSubImage2D(U.TEXTURE_2D,dt,he,Se,Tt,It,Ee,Wt,Ce);U.pixelStorei(U.UNPACK_ROW_LENGTH,ge),U.pixelStorei(U.UNPACK_IMAGE_HEIGHT,un),U.pixelStorei(U.UNPACK_SKIP_PIXELS,os),U.pixelStorei(U.UNPACK_SKIP_ROWS,dn),U.pixelStorei(U.UNPACK_SKIP_IMAGES,Ys),dt===0&&B.generateMipmaps&&U.generateMipmap(De),et.unbindTexture()},this.initRenderTarget=function(P){ct.get(P).__webglFramebuffer===void 0&&xt.setupRenderTarget(P)},this.initTexture=function(P){P.isCubeTexture?xt.setTextureCube(P,0):P.isData3DTexture?xt.setTexture3D(P,0):P.isDataArrayTexture||P.isCompressedArrayTexture?xt.setTexture2DArray(P,0):xt.setTexture2D(P,0),et.unbindTexture()},this.resetState=function(){S=0,T=0,C=null,et.reset(),St.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return zn}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(t){this._outputColorSpace=t;const e=this.getContext();e.drawingBufferColorSpace=fe._getDrawingBufferColorSpace(t),e.unpackColorSpace=fe._getUnpackColorSpace()}}const Io={name:"CopyShader",uniforms:{tDiffuse:{value:null},opacity:{value:1}},vertexShader:`

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		uniform float opacity;

		uniform sampler2D tDiffuse;

		varying vec2 vUv;

		void main() {

			vec4 texel = texture2D( tDiffuse, vUv );
			gl_FragColor = opacity * texel;


		}`};class qs{constructor(){this.isPass=!0,this.enabled=!0,this.needsSwap=!0,this.clear=!1,this.renderToScreen=!1}setSize(){}render(){console.error("THREE.Pass: .render() must be implemented in derived pass.")}dispose(){}}const A_=new al(-1,1,1,-1,0,1);class R_ extends me{constructor(){super(),this.setAttribute("position",new Gt([-1,3,0,-1,-1,0,3,-1,0],3)),this.setAttribute("uv",new Gt([0,2,0,0,2,0],2))}}const C_=new R_;class ll{constructor(t){this._mesh=new ue(C_,t)}dispose(){this._mesh.geometry.dispose()}render(t){t.render(this._mesh,A_)}get material(){return this._mesh.material}set material(t){this._mesh.material=t}}class P_ extends qs{constructor(t,e="tDiffuse"){super(),this.textureID=e,this.uniforms=null,this.material=null,t instanceof Be?(this.uniforms=t.uniforms,this.material=t):t&&(this.uniforms=Hs.clone(t.uniforms),this.material=new Be({name:t.name!==void 0?t.name:"unspecified",defines:Object.assign({},t.defines),uniforms:this.uniforms,vertexShader:t.vertexShader,fragmentShader:t.fragmentShader})),this._fsQuad=new ll(this.material)}render(t,e,n){this.uniforms[this.textureID]&&(this.uniforms[this.textureID].value=n.texture),this._fsQuad.material=this.material,this.renderToScreen?(t.setRenderTarget(null),this._fsQuad.render(t)):(t.setRenderTarget(e),this.clear&&t.clear(t.autoClearColor,t.autoClearDepth,t.autoClearStencil),this._fsQuad.render(t))}dispose(){this.material.dispose(),this._fsQuad.dispose()}}class Uh extends qs{constructor(t,e){super(),this.scene=t,this.camera=e,this.clear=!0,this.needsSwap=!1,this.inverse=!1}render(t,e,n){const i=t.getContext(),r=t.state;r.buffers.color.setMask(!1),r.buffers.depth.setMask(!1),r.buffers.color.setLocked(!0),r.buffers.depth.setLocked(!0);let o,a;this.inverse?(o=0,a=1):(o=1,a=0),r.buffers.stencil.setTest(!0),r.buffers.stencil.setOp(i.REPLACE,i.REPLACE,i.REPLACE),r.buffers.stencil.setFunc(i.ALWAYS,o,4294967295),r.buffers.stencil.setClear(a),r.buffers.stencil.setLocked(!0),t.setRenderTarget(n),this.clear&&t.clear(),t.render(this.scene,this.camera),t.setRenderTarget(e),this.clear&&t.clear(),t.render(this.scene,this.camera),r.buffers.color.setLocked(!1),r.buffers.depth.setLocked(!1),r.buffers.color.setMask(!0),r.buffers.depth.setMask(!0),r.buffers.stencil.setLocked(!1),r.buffers.stencil.setFunc(i.EQUAL,1,4294967295),r.buffers.stencil.setOp(i.KEEP,i.KEEP,i.KEEP),r.buffers.stencil.setLocked(!0)}}class D_ extends qs{constructor(){super(),this.needsSwap=!1}render(t){t.state.buffers.stencil.setLocked(!1),t.state.buffers.stencil.setTest(!1)}}class I_{constructor(t,e){if(this.renderer=t,this._pixelRatio=t.getPixelRatio(),e===void 0){const n=t.getSize(new tt);this._width=n.width,this._height=n.height,e=new Rn(this._width*this._pixelRatio,this._height*this._pixelRatio,{type:Qn}),e.texture.name="EffectComposer.rt1"}else this._width=e.width,this._height=e.height;this.renderTarget1=e,this.renderTarget2=e.clone(),this.renderTarget2.texture.name="EffectComposer.rt2",this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2,this.renderToScreen=!0,this.passes=[],this.copyPass=new P_(Io),this.copyPass.material.blending=di,this.clock=new Nu}swapBuffers(){const t=this.readBuffer;this.readBuffer=this.writeBuffer,this.writeBuffer=t}addPass(t){this.passes.push(t),t.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}insertPass(t,e){this.passes.splice(e,0,t),t.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}removePass(t){const e=this.passes.indexOf(t);e!==-1&&this.passes.splice(e,1)}isLastEnabledPass(t){for(let e=t+1;e<this.passes.length;e++)if(this.passes[e].enabled)return!1;return!0}render(t){t===void 0&&(t=this.clock.getDelta());const e=this.renderer.getRenderTarget();let n=!1;for(let i=0,r=this.passes.length;i<r;i++){const o=this.passes[i];if(o.enabled!==!1){if(o.renderToScreen=this.renderToScreen&&this.isLastEnabledPass(i),o.render(this.renderer,this.writeBuffer,this.readBuffer,t,n),o.needsSwap){if(n){const a=this.renderer.getContext(),c=this.renderer.state.buffers.stencil;c.setFunc(a.NOTEQUAL,1,4294967295),this.copyPass.render(this.renderer,this.writeBuffer,this.readBuffer,t),c.setFunc(a.EQUAL,1,4294967295)}this.swapBuffers()}Uh!==void 0&&(o instanceof Uh?n=!0:o instanceof D_&&(n=!1))}}this.renderer.setRenderTarget(e)}reset(t){if(t===void 0){const e=this.renderer.getSize(new tt);this._pixelRatio=this.renderer.getPixelRatio(),this._width=e.width,this._height=e.height,t=this.renderTarget1.clone(),t.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.renderTarget1=t,this.renderTarget2=t.clone(),this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2}setSize(t,e){this._width=t,this._height=e;const n=this._width*this._pixelRatio,i=this._height*this._pixelRatio;this.renderTarget1.setSize(n,i),this.renderTarget2.setSize(n,i);for(let r=0;r<this.passes.length;r++)this.passes[r].setSize(n,i)}setPixelRatio(t){this._pixelRatio=t,this.setSize(this._width,this._height)}dispose(){this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.copyPass.dispose()}}class L_ extends qs{constructor(t,e,n=null,i=null,r=null){super(),this.scene=t,this.camera=e,this.overrideMaterial=n,this.clearColor=i,this.clearAlpha=r,this.clear=!0,this.clearDepth=!1,this.needsSwap=!1,this._oldClearColor=new lt}render(t,e,n){const i=t.autoClear;t.autoClear=!1;let r,o;this.overrideMaterial!==null&&(o=this.scene.overrideMaterial,this.scene.overrideMaterial=this.overrideMaterial),this.clearColor!==null&&(t.getClearColor(this._oldClearColor),t.setClearColor(this.clearColor,t.getClearAlpha())),this.clearAlpha!==null&&(r=t.getClearAlpha(),t.setClearAlpha(this.clearAlpha)),this.clearDepth==!0&&t.clearDepth(),t.setRenderTarget(this.renderToScreen?null:n),this.clear===!0&&t.clear(t.autoClearColor,t.autoClearDepth,t.autoClearStencil),t.render(this.scene,this.camera),this.clearColor!==null&&t.setClearColor(this._oldClearColor),this.clearAlpha!==null&&t.setClearAlpha(r),this.overrideMaterial!==null&&(this.scene.overrideMaterial=o),t.autoClear=i}}const U_={uniforms:{tDiffuse:{value:null},luminosityThreshold:{value:1},smoothWidth:{value:1},defaultColor:{value:new lt(0)},defaultOpacity:{value:0}},vertexShader:`

		varying vec2 vUv;

		void main() {

			vUv = uv;

			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		uniform sampler2D tDiffuse;
		uniform vec3 defaultColor;
		uniform float defaultOpacity;
		uniform float luminosityThreshold;
		uniform float smoothWidth;

		varying vec2 vUv;

		void main() {

			vec4 texel = texture2D( tDiffuse, vUv );

			float v = luminance( texel.xyz );

			vec4 outputColor = vec4( defaultColor.rgb, defaultOpacity );

			float alpha = smoothstep( luminosityThreshold, luminosityThreshold + smoothWidth, v );

			gl_FragColor = mix( outputColor, texel, alpha );

		}`};class Ws extends qs{constructor(t,e=1,n,i){super(),this.strength=e,this.radius=n,this.threshold=i,this.resolution=t!==void 0?new tt(t.x,t.y):new tt(256,256),this.clearColor=new lt(0,0,0),this.needsSwap=!1,this.renderTargetsHorizontal=[],this.renderTargetsVertical=[],this.nMips=5;let r=Math.round(this.resolution.x/2),o=Math.round(this.resolution.y/2);this.renderTargetBright=new Rn(r,o,{type:Qn}),this.renderTargetBright.texture.name="UnrealBloomPass.bright",this.renderTargetBright.texture.generateMipmaps=!1;for(let u=0;u<this.nMips;u++){const h=new Rn(r,o,{type:Qn});h.texture.name="UnrealBloomPass.h"+u,h.texture.generateMipmaps=!1,this.renderTargetsHorizontal.push(h);const p=new Rn(r,o,{type:Qn});p.texture.name="UnrealBloomPass.v"+u,p.texture.generateMipmaps=!1,this.renderTargetsVertical.push(p),r=Math.round(r/2),o=Math.round(o/2)}const a=U_;this.highPassUniforms=Hs.clone(a.uniforms),this.highPassUniforms.luminosityThreshold.value=i,this.highPassUniforms.smoothWidth.value=.01,this.materialHighPassFilter=new Be({uniforms:this.highPassUniforms,vertexShader:a.vertexShader,fragmentShader:a.fragmentShader}),this.separableBlurMaterials=[];const c=[3,5,7,9,11];r=Math.round(this.resolution.x/2),o=Math.round(this.resolution.y/2);for(let u=0;u<this.nMips;u++)this.separableBlurMaterials.push(this._getSeparableBlurMaterial(c[u])),this.separableBlurMaterials[u].uniforms.invSize.value=new tt(1/r,1/o),r=Math.round(r/2),o=Math.round(o/2);this.compositeMaterial=this._getCompositeMaterial(this.nMips),this.compositeMaterial.uniforms.blurTexture1.value=this.renderTargetsVertical[0].texture,this.compositeMaterial.uniforms.blurTexture2.value=this.renderTargetsVertical[1].texture,this.compositeMaterial.uniforms.blurTexture3.value=this.renderTargetsVertical[2].texture,this.compositeMaterial.uniforms.blurTexture4.value=this.renderTargetsVertical[3].texture,this.compositeMaterial.uniforms.blurTexture5.value=this.renderTargetsVertical[4].texture,this.compositeMaterial.uniforms.bloomStrength.value=e,this.compositeMaterial.uniforms.bloomRadius.value=.1;const l=[1,.8,.6,.4,.2];this.compositeMaterial.uniforms.bloomFactors.value=l,this.bloomTintColors=[new A(1,1,1),new A(1,1,1),new A(1,1,1),new A(1,1,1),new A(1,1,1)],this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors,this.copyUniforms=Hs.clone(Io.uniforms),this.blendMaterial=new Be({uniforms:this.copyUniforms,vertexShader:Io.vertexShader,fragmentShader:Io.fragmentShader,blending:wr,depthTest:!1,depthWrite:!1,transparent:!0}),this._oldClearColor=new lt,this._oldClearAlpha=1,this._basic=new Di,this._fsQuad=new ll(null)}dispose(){for(let t=0;t<this.renderTargetsHorizontal.length;t++)this.renderTargetsHorizontal[t].dispose();for(let t=0;t<this.renderTargetsVertical.length;t++)this.renderTargetsVertical[t].dispose();this.renderTargetBright.dispose();for(let t=0;t<this.separableBlurMaterials.length;t++)this.separableBlurMaterials[t].dispose();this.compositeMaterial.dispose(),this.blendMaterial.dispose(),this._basic.dispose(),this._fsQuad.dispose()}setSize(t,e){let n=Math.round(t/2),i=Math.round(e/2);this.renderTargetBright.setSize(n,i);for(let r=0;r<this.nMips;r++)this.renderTargetsHorizontal[r].setSize(n,i),this.renderTargetsVertical[r].setSize(n,i),this.separableBlurMaterials[r].uniforms.invSize.value=new tt(1/n,1/i),n=Math.round(n/2),i=Math.round(i/2)}render(t,e,n,i,r){t.getClearColor(this._oldClearColor),this._oldClearAlpha=t.getClearAlpha();const o=t.autoClear;t.autoClear=!1,t.setClearColor(this.clearColor,0),r&&t.state.buffers.stencil.setTest(!1),this.renderToScreen&&(this._fsQuad.material=this._basic,this._basic.map=n.texture,t.setRenderTarget(null),t.clear(),this._fsQuad.render(t)),this.highPassUniforms.tDiffuse.value=n.texture,this.highPassUniforms.luminosityThreshold.value=this.threshold,this._fsQuad.material=this.materialHighPassFilter,t.setRenderTarget(this.renderTargetBright),t.clear(),this._fsQuad.render(t);let a=this.renderTargetBright;for(let c=0;c<this.nMips;c++)this._fsQuad.material=this.separableBlurMaterials[c],this.separableBlurMaterials[c].uniforms.colorTexture.value=a.texture,this.separableBlurMaterials[c].uniforms.direction.value=Ws.BlurDirectionX,t.setRenderTarget(this.renderTargetsHorizontal[c]),t.clear(),this._fsQuad.render(t),this.separableBlurMaterials[c].uniforms.colorTexture.value=this.renderTargetsHorizontal[c].texture,this.separableBlurMaterials[c].uniforms.direction.value=Ws.BlurDirectionY,t.setRenderTarget(this.renderTargetsVertical[c]),t.clear(),this._fsQuad.render(t),a=this.renderTargetsVertical[c];this._fsQuad.material=this.compositeMaterial,this.compositeMaterial.uniforms.bloomStrength.value=this.strength,this.compositeMaterial.uniforms.bloomRadius.value=this.radius,this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors,t.setRenderTarget(this.renderTargetsHorizontal[0]),t.clear(),this._fsQuad.render(t),this._fsQuad.material=this.blendMaterial,this.copyUniforms.tDiffuse.value=this.renderTargetsHorizontal[0].texture,r&&t.state.buffers.stencil.setTest(!0),this.renderToScreen?(t.setRenderTarget(null),this._fsQuad.render(t)):(t.setRenderTarget(n),this._fsQuad.render(t)),t.setClearColor(this._oldClearColor,this._oldClearAlpha),t.autoClear=o}_getSeparableBlurMaterial(t){const e=[];for(let n=0;n<t;n++)e.push(.39894*Math.exp(-.5*n*n/(t*t))/t);return new Be({defines:{KERNEL_RADIUS:t},uniforms:{colorTexture:{value:null},invSize:{value:new tt(.5,.5)},direction:{value:new tt(.5,.5)},gaussianCoefficients:{value:e}},vertexShader:`varying vec2 vUv;
				void main() {
					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
				}`,fragmentShader:`#include <common>
				varying vec2 vUv;
				uniform sampler2D colorTexture;
				uniform vec2 invSize;
				uniform vec2 direction;
				uniform float gaussianCoefficients[KERNEL_RADIUS];

				void main() {
					float weightSum = gaussianCoefficients[0];
					vec3 diffuseSum = texture2D( colorTexture, vUv ).rgb * weightSum;
					for( int i = 1; i < KERNEL_RADIUS; i ++ ) {
						float x = float(i);
						float w = gaussianCoefficients[i];
						vec2 uvOffset = direction * invSize * x;
						vec3 sample1 = texture2D( colorTexture, vUv + uvOffset ).rgb;
						vec3 sample2 = texture2D( colorTexture, vUv - uvOffset ).rgb;
						diffuseSum += (sample1 + sample2) * w;
						weightSum += 2.0 * w;
					}
					gl_FragColor = vec4(diffuseSum/weightSum, 1.0);
				}`})}_getCompositeMaterial(t){return new Be({defines:{NUM_MIPS:t},uniforms:{blurTexture1:{value:null},blurTexture2:{value:null},blurTexture3:{value:null},blurTexture4:{value:null},blurTexture5:{value:null},bloomStrength:{value:1},bloomFactors:{value:null},bloomTintColors:{value:null},bloomRadius:{value:0}},vertexShader:`varying vec2 vUv;
				void main() {
					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
				}`,fragmentShader:`varying vec2 vUv;
				uniform sampler2D blurTexture1;
				uniform sampler2D blurTexture2;
				uniform sampler2D blurTexture3;
				uniform sampler2D blurTexture4;
				uniform sampler2D blurTexture5;
				uniform float bloomStrength;
				uniform float bloomRadius;
				uniform float bloomFactors[NUM_MIPS];
				uniform vec3 bloomTintColors[NUM_MIPS];

				float lerpBloomFactor(const in float factor) {
					float mirrorFactor = 1.2 - factor;
					return mix(factor, mirrorFactor, bloomRadius);
				}

				void main() {
					gl_FragColor = bloomStrength * ( lerpBloomFactor(bloomFactors[0]) * vec4(bloomTintColors[0], 1.0) * texture2D(blurTexture1, vUv) +
						lerpBloomFactor(bloomFactors[1]) * vec4(bloomTintColors[1], 1.0) * texture2D(blurTexture2, vUv) +
						lerpBloomFactor(bloomFactors[2]) * vec4(bloomTintColors[2], 1.0) * texture2D(blurTexture3, vUv) +
						lerpBloomFactor(bloomFactors[3]) * vec4(bloomTintColors[3], 1.0) * texture2D(blurTexture4, vUv) +
						lerpBloomFactor(bloomFactors[4]) * vec4(bloomTintColors[4], 1.0) * texture2D(blurTexture5, vUv) );
				}`})}}Ws.BlurDirectionX=new tt(1,0);Ws.BlurDirectionY=new tt(0,1);class N_ extends qs{uniforms={tDiffuse:{value:null},toneMappingExposure:{value:1},uTime:{value:0},uVignette:{value:.3},uGrain:{value:.02},uSat:{value:1.06},uContrast:{value:1.07}};material;quad;constructor(){super(),this.material=new D0({uniforms:this.uniforms,defines:{ACES_FILMIC_TONE_MAPPING:"",SRGB_TRANSFER:""},vertexShader:`
        precision highp float;
        uniform mat4 modelViewMatrix; uniform mat4 projectionMatrix;
        attribute vec3 position; attribute vec2 uv;
        varying vec2 vUv;
        void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,fragmentShader:`
        precision highp float;
        uniform sampler2D tDiffuse;
        uniform float uTime, uVignette, uGrain, uSat, uContrast;
        #include <tonemapping_pars_fragment>
        #include <colorspace_pars_fragment>
        varying vec2 vUv;
        float hash(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
        void main(){
          vec3 c = texture2D(tDiffuse, vUv).rgb;
          c = ACESFilmicToneMapping(c);
          c = sRGBTransferOETF(vec4(c, 1.0)).rgb;
          float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
          c = (c - 0.5) * uContrast + 0.5;
          c = mix(vec3(l), c, uSat);
          c += vec3(-0.012, 0.002, 0.018) * (1.0 - smoothstep(0.0, 0.45, l));
          c += vec3(0.020, 0.008, -0.014) * smoothstep(0.45, 1.0, l);
          vec2 q = vUv - 0.5; q.x *= 1.15;
          float v = 1.0 - smoothstep(0.2, 0.85, length(q));
          c *= mix(1.0 - uVignette, 1.0, v);
          c += (hash(vUv * 1731.0 + fract(uTime)) - 0.5) * uGrain;
          gl_FragColor = vec4(max(c, 0.0), 1.0);
        }`}),this.quad=new ll(this.material)}render(t,e,n){this.uniforms.tDiffuse.value=n.texture,this.uniforms.toneMappingExposure.value=t.toneMappingExposure,this.renderToScreen?t.setRenderTarget(null):(t.setRenderTarget(e),this.clear&&t.clear()),this.quad.render(t)}dispose(){this.material.dispose(),this.quad.dispose()}}function Vu(s){let t=s|0;return()=>{t=t+1831565813|0;let e=Math.imul(t^t>>>15,1|t);return e=e+Math.imul(e^e>>>7,61|e)^e,((e^e>>>14)>>>0)/4294967296}}class He{r;constructor(t){this.r=Vu(t)}next(){return this.r()}range(t,e){return t+(e-t)*this.r()}int(t,e){return Math.floor(this.range(t,e+1))}chance(t){return this.r()<t}pick(t){return t[Math.floor(this.r()*t.length)%t.length]}gauss(){let t=0;for(let e=0;e<4;e++)t+=this.r();return(t-2)*1.7320508}}function Ot(s,t,e){const n=Math.min(1,Math.max(0,(e-s)/(t-s)));return n*n*(3-2*n)}function Fn(s,t,e){return s<t?t:s>e?e:s}function or(s,t,e){return s+(t-s)*e}function F_(s,t,e){const n=Math.max(e-Math.abs(s-t),0)/e;return Math.min(s,t)-n*n*e*.25}class z_{p=new Uint8Array(512);constructor(t=1337){const e=Vu(t),n=new Uint8Array(256);for(let i=0;i<256;i++)n[i]=i;for(let i=255;i>0;i--){const r=Math.floor(e()*(i+1)),o=n[i];n[i]=n[r],n[r]=o}for(let i=0;i<512;i++)this.p[i]=n[i&255]}n2(t,e){const n=this.p,i=Math.floor(t),r=Math.floor(e),o=i&255,a=r&255;t-=i,e-=r;const c=t*t*t*(t*(t*6-15)+10),l=e*e*e*(e*(e*6-15)+10),u=n[n[o]+a],h=n[n[o]+a+1],p=n[n[o+1]+a],d=n[n[o+1]+a+1],m=(f,x,_)=>{switch(f&7){case 0:return x+_;case 1:return x-_;case 2:return-x+_;case 3:return-x-_;case 4:return x*1.4142;case 5:return-x*1.4142;case 6:return _*1.4142;default:return-_*1.4142}},v=m(u,t,e)+c*(m(p,t-1,e)-m(u,t,e)),g=m(h,t,e-1)+c*(m(d,t-1,e-1)-m(h,t,e-1));return(v+l*(g-v))*.7}n3(t,e,n){const i=this.p,r=Math.floor(t),o=Math.floor(e),a=Math.floor(n),c=r&255,l=o&255,u=a&255;t-=r,e-=o,n-=a;const h=t*t*t*(t*(t*6-15)+10),p=e*e*e*(e*(e*6-15)+10),d=n*n*n*(n*(n*6-15)+10),m=i[c]+l,v=i[m]+u,g=i[m+1]+u,f=i[c+1]+l,x=i[f]+u,_=i[f+1]+u,y=(S,T,C,b)=>{S&=15;const M=S<8?T:C,E=S<4?C:S===12||S===14?T:b;return((S&1)===0?M:-M)+((S&2)===0?E:-E)},w=(S,T,C)=>T+S*(C-T);return w(d,w(p,w(h,y(i[v],t,e,n),y(i[x],t-1,e,n)),w(h,y(i[g],t,e-1,n),y(i[_],t-1,e-1,n))),w(p,w(h,y(i[v+1],t,e,n-1),y(i[x+1],t-1,e,n-1)),w(h,y(i[g+1],t,e-1,n-1),y(i[_+1],t-1,e-1,n-1))))*.95}fbm2(t,e,n=5,i=2.03,r=.5){let o=1,a=1,c=0,l=0;for(let u=0;u<n;u++)c+=o*this.n2(t*a+u*17.3,e*a-u*9.1),l+=o,o*=r,a*=i;return c/l}fbm3(t,e,n,i=4,r=2.03,o=.5){let a=1,c=1,l=0,u=0;for(let h=0;h<i;h++)l+=a*this.n3(t*c+h*5.1,e*c+h*3.7,n*c-h*8.3),u+=a,a*=o,c*=r;return l/u}ridged2(t,e,n=5,i=2.1,r=.5){let o=1,a=1,c=0,l=0,u=1;for(let h=0;h<n;h++){let p=1-Math.abs(this.n2(t*a+h*31.7,e*a-h*12.9));p*=p,p*=u,u=Fn(p*1.6,0,1),c+=p*o,l+=o,o*=r,a*=i}return c/l}}const Ht=new z_(2024),$t={radius:240,cx:0,cz:-240,halfLen:85.5,railY:38,deckY:37.4,width:6.4,parapetH:1.15,arches:9,span:14,pier:4.5,springY:28.2},Hu=$t.span+$t.pier;function O_(){const s=[],t=$t.halfLen/$t.radius,e=12;for(let n=0;n<=e;n++){const i=-t+2*t*n/e;s.push([$t.cx+$t.radius*Math.sin(i),$t.cz+$t.radius*Math.cos(i)])}return s.push([124,-33],[172,-68],[214,-118],[240,-184],[247,-262],[231,-340],[190,-408],[128,-455],[58,-480],[-18,-488],[-92,-472],[-158,-436],[-210,-382],[-242,-312],[-252,-236],[-238,-162],[-206,-98],[-162,-52]),s}const B_=[[-26,-352],[-18,-318],[-4,-284],[12,-236],[26,-190],[14,-150],[-6,-112],[-14,-72],[-6,-34],[0,-8],[3,22],[14,62],[36,110],[30,168],[4,232],[-30,306],[-42,392],[-18,486],[22,580],[74,690],[120,800],[170,930]];function Ha(s){const t=Ot(-352,-318,s);let e=38+(6.4-38)*t;s>-318&&(e=6.4-(s+318)*.0072);const n=Ot(-150,-138,s);return e-=3.2*n,s>-138&&(e-=(s+138)*.0036),e}const k_=1.1;function Gu(s,t){return 41.5+5.2*Ht.fbm2(s*.0085+3.1,t*.0085-1.7,3)+2.4*Ht.n2(s*.03+11.3,t*.03+4.2)}const en=new A(-.84,.36,.42).normalize(),V_=`
varying vec3 vDir;
void main(){
  vDir = position;
  vec4 p = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * p;
  gl_Position.z = gl_Position.w; // always at far plane
}`,H_=`
varying vec3 vDir;
uniform vec3 uSun;
uniform float uTime;
uniform float uGround;   // 1 = paint a ground colour below the horizon (environment capture)
uniform float uClouds;

float hash(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float vn(vec2 p){
  vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y);
}
float fbm(vec2 p){
  float s = 0.0, a = 0.5;
  for(int i=0;i<6;i++){ s += a*vn(p); p = mat2(1.6,1.2,-1.2,1.6)*p + 3.7; a *= 0.5; }
  return s;
}

void main(){
  vec3 d = normalize(vDir);
  float y = d.y;
  float h = clamp(y, 0.0, 1.0);
  vec3 zenith  = vec3(0.045, 0.13, 0.36);
  vec3 midc    = vec3(0.17, 0.33, 0.62);
  vec3 horizon = vec3(0.62, 0.66, 0.70);
  vec3 col = mix(horizon, midc, smoothstep(0.0, 0.30, h));
  col = mix(col, zenith, smoothstep(0.22, 0.95, h));
  float sd = max(dot(d, uSun), 0.0);
  // horizon warms towards the sun
  float horizonBand = exp(-abs(y) * 5.5);
  col += vec3(1.0, 0.52, 0.20) * pow(sd, 6.0) * horizonBand * 0.9;
  col += vec3(1.0, 0.62, 0.30) * pow(sd, 3.0) * 0.12;
  col += vec3(1.0, 0.75, 0.45) * pow(sd, 90.0) * 1.2;
  float disc = smoothstep(0.99935, 0.99975, sd);

  // clouds on a virtual plane
  float cl = 0.0; vec3 clCol = vec3(1.0);
  if (y > 0.015 && uClouds > 0.5) {
    vec2 uv = d.xz / (y + 0.09) * 0.55 + vec2(uTime * 0.0035, uTime * 0.0012);
    float base = fbm(uv * vec2(1.0, 1.35) + 2.0);
    float cover = smoothstep(0.50, 0.74, base);
    float sunSide = fbm(uv * vec2(1.0, 1.35) + 2.0 + normalize(uSun.xz + 1e-4) * 0.09);
    float lit = clamp((base - sunSide) * 6.0 + 0.55, 0.0, 1.0);
    vec3 shade = vec3(0.34, 0.40, 0.52);
    vec3 sunl  = vec3(1.25, 0.95, 0.72);
    clCol = mix(shade, sunl, lit);
    clCol += vec3(1.0, 0.7, 0.4) * pow(sd, 4.0) * 0.5 * (1.0 - cover * 0.5);
    float fade = smoothstep(0.015, 0.20, y);
    cl = cover * fade;
    // thin cirrus streaks
    float ci = fbm(vec2(uv.x * 0.7 + uv.y * 0.15, uv.y * 3.4) + 11.0);
    float cir = smoothstep(0.55, 0.8, ci) * 0.28 * fade * smoothstep(0.1, 0.5, y);
    col = mix(col, vec3(1.0, 0.9, 0.8), cir);
  }
  col = mix(col, clCol, cl * 0.92);

  if (y < 0.0) {
    vec3 gcol = vec3(0.10, 0.12, 0.07);
    col = mix(col, mix(horizon * 0.8, gcol, uGround), (1.0 - smoothstep(-0.05, 0.0, y)));
  }
  col += vec3(12.0, 9.5, 6.5) * disc * (1.0 - cl * 0.9);
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}`;class G_{mesh;uniforms={uSun:{value:en.clone()},uTime:{value:0},uGround:{value:0},uClouds:{value:1}};mat;constructor(){this.mat=new Be({vertexShader:V_,fragmentShader:H_,uniforms:this.uniforms,side:nn,depthWrite:!1,depthTest:!1,fog:!1}),this.mesh=new ue(new Zn(1,48,24),this.mat),this.mesh.scale.setScalar(9e3),this.mesh.frustumCulled=!1,this.mesh.renderOrder=-1e3}buildEnvironment(t){const e=new yu,n=new ue(this.mesh.geometry,this.mat.clone()),i=n.material;i.uniforms={uSun:{value:en.clone()},uTime:{value:20},uGround:{value:1},uClouds:{value:1}},n.scale.setScalar(900),e.add(n);const r=new Vc(t),o=r.fromScene(e,0,1,5e3);return r.dispose(),i.dispose(),o.texture}update(t,e){this.mesh.position.copy(t),this.uniforms.uTime.value=e}}const gr={density:52e-5,mistDensity:.0026,mistBase:-2,mistScale:.05};function W_(){const s=e=>e.toFixed(5),t=`vec3(${s(en.x)}, ${s(en.y)}, ${s(en.z)})`;Jt.fog_pars_vertex=`
#ifdef USE_FOG
  varying float vFogDepth;
  varying vec3 vFogWP;
#endif`,Jt.fog_vertex=`
#ifdef USE_FOG
  vFogDepth = - mvPosition.z;
  vFogWP = cameraPosition + transpose(mat3(viewMatrix)) * mvPosition.xyz;
#endif`,Jt.fog_pars_fragment=`
#ifdef USE_FOG
  uniform vec3 fogColor;
  uniform float fogNear;
  uniform float fogFar;
  varying float vFogDepth;
  varying vec3 vFogWP;
#endif`,Jt.fog_fragment=`
#ifdef USE_FOG
{
  vec3 heRd = vFogWP - cameraPosition;
  float heDist = length(heRd);
  vec3 heDir = heRd / max(heDist, 1e-4);
  float heF1 = 1.0 - exp(-fogNear * fogNear * heDist * heDist);
  float heK = heDir.y * ${s(gr.mistScale)};
  float heInteg = abs(heK * heDist) < 1e-3 ? heDist : (1.0 - exp(-heK * heDist)) / heK;
  float heOd = ${s(gr.mistDensity)} * exp(-(cameraPosition.y - ${s(gr.mistBase)}) * ${s(gr.mistScale)}) * heInteg;
  float heF2 = 1.0 - exp(-max(heOd, 0.0));
  float heFog = 1.0 - (1.0 - heF1) * (1.0 - heF2);
  float heSun = pow(max(dot(heDir, ${t}), 0.0), 5.0);
  vec3 heCol = mix(fogColor, vec3(1.0, 0.74, 0.46) * 1.15, heSun * 0.62 * heF1);
  heCol = mix(heCol, vec3(0.78, 0.84, 0.90), heF2 * (1.0 - heF1) * 0.55);
  gl_FragColor.rgb = mix(gl_FragColor.rgb, heCol, clamp(heFog, 0.0, 1.0));
}
#endif`}const es={uTime:{value:0},uWindDir:{value:new tt(.83,.55)},uWind:{value:1},uShadowFocus:{value:new be(0,0,0,80)},uSunDir:{value:new A(-.6,.3,.6).normalize()}},X_=`
float heHash13(vec3 p){
  p = fract(p * 0.1031);
  p += dot(p, p.zyx + 31.32);
  return fract((p.x + p.y) * p.z);
}
float heHash12(vec2 p){
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float heVNoise(vec3 p){
  vec3 i = floor(p); vec3 f = fract(p);
  f = f*f*(3.0-2.0*f);
  float a = heHash13(i), b = heHash13(i+vec3(1,0,0));
  float c = heHash13(i+vec3(0,1,0)), d = heHash13(i+vec3(1,1,0));
  float e = heHash13(i+vec3(0,0,1)), g = heHash13(i+vec3(1,0,1));
  float h = heHash13(i+vec3(0,1,1)), k = heHash13(i+vec3(1,1,1));
  return mix(mix(mix(a,b,f.x), mix(c,d,f.x), f.y), mix(mix(e,g,f.x), mix(h,k,f.x), f.y), f.z);
}
float heFbm(vec3 p){
  float s = 0.0, a = 0.5;
  for(int i=0;i<4;i++){ s += a*heVNoise(p); p = p*2.03 + 7.1; a *= 0.5; }
  return s;
}
float heFbm2L(vec2 p);
float heVNoise2(vec2 p){
  vec2 i = floor(p); vec2 f = fract(p);
  f = f*f*(3.0-2.0*f);
  float a = heHash12(i), b = heHash12(i+vec2(1,0));
  float c = heHash12(i+vec2(0,1)), d = heHash12(i+vec2(1,1));
  return mix(mix(a,b,f.x), mix(c,d,f.x), f.y);
}
float heFbm2(vec2 p){
  float s = 0.0, a = 0.5;
  for(int i=0;i<5;i++){ s += a*heVNoise2(p); p = p*2.03 + 5.7; a *= 0.5; }
  return s;
}
float heFbm2L(vec2 p){
  float s = 0.0, a = 0.5;
  for(int i=0;i<3;i++){ s += a*heVNoise2(p); p = p*2.03 + 5.7; a *= 0.5; }
  return s * 1.14;
}
vec3 hePerturb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
  vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
  vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
  vec3 vN = surf_norm;
  vec3 R1 = cross( vSigmaY, vN );
  vec3 R2 = cross( vN, vSigmaX );
  float fDet = dot( vSigmaX, R1 ) * faceDirection;
  vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
  vec3 pn = abs( fDet ) * surf_norm - vGrad;
  float pl = length( pn );
  return pl > 1e-5 && fDet == fDet ? pn / pl : surf_norm;
}
`;function Ke(s,t){return s.onBeforeCompile=e=>{Object.assign(e.uniforms,es,t.uniforms??{}),e.vertexShader=e.vertexShader.replace("#include <common>",`#include <common>
varying vec3 vWPos; varying vec3 vOPos; varying float vRand; varying vec3 vWNormal;
uniform float uTime; uniform vec2 uWindDir; uniform float uWind;
${t.vertDecl??""}`).replace("#include <begin_vertex>",`#include <begin_vertex>
vOPos = position;
mat4 heInst = mat4(1.0);
#ifdef USE_INSTANCING
  heInst = instanceMatrix;
#endif
#ifdef USE_BATCHING
  heInst = batchingMatrix;
#endif
vRand = fract(sin(dot(heInst[3].xz, vec2(12.9898,78.233)) + heInst[3].y*0.37) * 43758.5453);
${t.vertMain??""}
{
  vec4 hwp = heInst * vec4(transformed, 1.0);
  vWPos = (modelMatrix * hwp).xyz;
  vec3 hn = mat3(heInst) * normal;
  vWNormal = normalize(mat3(modelMatrix) * hn);
}`),e.fragmentShader=e.fragmentShader.replace("#include <common>",`#include <common>
varying vec3 vWPos; varying vec3 vOPos; varying float vRand; varying vec3 vWNormal;
uniform float uTime; uniform vec4 uShadowFocus; uniform vec3 uSunDir;
${X_}
${t.fragDecl??""}`);const n=(i,r)=>{r&&(e.fragmentShader=e.fragmentShader.replace(i,`${i}
{
${r}
}`))};n("#include <color_fragment>",t.fragColor),n("#include <roughnessmap_fragment>",t.fragRough),n("#include <metalnessmap_fragment>",t.fragMetal),n("#include <normal_fragment_maps>",t.fragNormal),n("#include <emissivemap_fragment>",t.fragEmissive),n("#include <lights_fragment_end>",t.fragLightsEnd),n("#include <opaque_fragment>",t.fragEnd)},s.customProgramCacheKey=()=>t.key,s}const q_=`
{
  float hH = max(position.y, 0.0);
  vec2 wp2 = heInst[3].xz;
  float ph = dot(wp2, vec2(0.05, 0.043)) + uTime * 1.3;
  float gust = sin(uTime * 0.37 + dot(wp2, uWindDir) * 0.012) * 0.5 + 0.5;
  float amp = (0.012 + 0.03 * gust) * uWind * heSwayAmp;
  float k = hH * hH * amp;
  transformed.xz += uWindDir * k * (sin(ph) + 0.4 * sin(ph * 2.3 + position.x * 3.0));
  transformed.xz += vec2(-uWindDir.y, uWindDir.x) * k * 0.4 * sin(ph * 1.7 + 1.3);
}
`;class Y_{constructor(t,e){this.container=t,this.quality=e,W_(),this.shadowSize=e.shadowMap,this.pixelRatioCap=e.pixelCap,this.pixelScale=e.startScale,this.renderer=new E_({antialias:!1,powerPreference:"high-performance",stencil:!1}),this.renderer.setPixelRatio(this.basePR()*this.pixelScale),this.renderer.setSize(t.clientWidth,t.clientHeight),this.renderer.toneMapping=nu,this.renderer.toneMappingExposure=.92,this.renderer.shadowMap.enabled=!0,this.renderer.shadowMap.type=tu,t.appendChild(this.renderer.domElement),this.camera=new ln(42,t.clientWidth/t.clientHeight,.25,16e3),this.camera.position.set(-150,70,180),this.scene.background=null,this.scene.fog=new el(new lt().setRGB(.5,.6,.72),gr.density,1),this.scene.add(this.sky.mesh),this.scene.environment=this.sky.buildEnvironment(this.renderer),this.scene.environmentIntensity=.78,this.sun=new k0(new lt().setRGB(1,.76,.52),5.8),this.sun.castShadow=!0,this.sun.shadow.mapSize.set(this.shadowSize,this.shadowSize),this.sun.shadow.bias=-35e-5,this.sun.shadow.normalBias=.06,this.sun.shadow.radius=2,this.sun.shadow.camera.near=10,this.sun.shadow.camera.far=1700,this.scene.add(this.sun,this.sun.target),this.hemi=new U0(new lt().setRGB(.5,.66,.92),new lt().setRGB(.2,.24,.12),.7),this.scene.add(this.hemi);const n=t.clientWidth,i=t.clientHeight,r=this.renderer.getPixelRatio(),o=new Rn(n*r,i*r,{type:Qn,samples:e.msaa});this.composer=new I_(this.renderer,o),this.composer.addPass(new L_(this.scene,this.camera)),this.bloom=new Ws(new tt(n*e.bloomScale,i*e.bloomScale),.26,.62,.92),this.composer.addPass(this.bloom),this.grade=new N_,this.composer.addPass(this.grade),this.composer.setSize(n,i),window.addEventListener("resize",this.onResize)}container;quality;renderer;scene=new yu;camera;composer;sky=new G_;sun;hemi;bloom;grade;shadowSize;pixelRatioCap;pixelScale;shadowFocus=new A;shadowRadius=90;basePR(){return Math.min(window.devicePixelRatio,this.pixelRatioCap)}setPixelScale(t){t=Math.max(this.quality.minScale,Math.min(1,t)),!(Math.abs(t-this.pixelScale)<.01)&&(this.pixelScale=t,this.onResize())}onResize=()=>{const t=this.container.clientWidth,e=this.container.clientHeight;t<2||e<2||(this.renderer.setPixelRatio(this.basePR()*this.pixelScale),this.renderer.setSize(t,e),this.camera.aspect=t/e,this.camera.updateProjectionMatrix(),this.composer.setPixelRatio(this.renderer.getPixelRatio()),this.composer.setSize(t,e),this.bloom.resolution.set(t*this.quality.bloomScale,e*this.quality.bloomScale))};updateShadow(t,e){e=Math.max(e,20),this.shadowRadius+=(e-this.shadowRadius)*.08;const n=this.shadowRadius,i=this.sun.shadow.camera;i.left=-n,i.right=n,i.top=n,i.bottom=-n,i.updateProjectionMatrix();const r=2*n/this.shadowSize,o=en,a=new A(0,1,0),c=new A().crossVectors(a,o).normalize(),l=new A().crossVectors(o,c).normalize(),u=Math.round(t.dot(c)/r)*r,h=Math.round(t.dot(l)/r)*r,p=t.dot(o),d=new A().addScaledVector(c,u).addScaledVector(l,h).addScaledVector(o,p);this.sun.target.position.copy(d),this.sun.position.copy(d).addScaledVector(o,800),this.sun.target.updateMatrixWorld(),this.shadowFocus.copy(d),es.uShadowFocus.value.set(d.x,d.y,d.z,n)}render(t){this.grade.uniforms.uTime.value=t,this.sky.update(this.camera.position,t),this.composer.render()}dispose(){window.removeEventListener("resize",this.onResize),this.composer.dispose(),this.renderer.dispose()}}function kn(){return{p:new A,t:new A,u:new A,r:new A}}const Z_=1.435,Lo=Z_/2+.034;class j_{length;n;ds;viaductS0;viaductS1;P;T;U;curvature;constructor(){const t=O_().map(([I,F])=>new A(I,0,F)),e=new is(t,!0,"centripetal");e.arcLengthDivisions=12e3;const n=e.getLength(),i=Math.round(n/.5);this.n=i,this.length=n,this.ds=n/i;const r=new Float64Array(i),o=new Float64Array(i),a=new A;for(let I=0;I<i;I++)e.getPointAt(I/i,a),r[I]=a.x,o[I]=a.z;const c=$t.cx+$t.radius*Math.sin(-.35625),l=$t.cz+$t.radius*Math.cos(-.35625);let u=0,h=1e9;for(let I=0;I<i;I++){const F=(r[I]-c)**2+(o[I]-l)**2;F<h&&(h=F,u=I)}const p=new Float64Array(i),d=new Float64Array(i);for(let I=0;I<i;I++)p[I]=r[(I+u)%i],d[I]=o[(I+u)%i];this.viaductS0=0,this.viaductS1=2*$t.halfLen;const m=new Float64Array(i);for(let I=0;I<i;I++)m[I]=Gu(p[I],d[I])+.2;const v=55/this.ds,g=Math.ceil(v*3),f=[];let x=0;for(let I=-g;I<=g;I++){const F=Math.exp(-.5*(I/v)**2);f.push(F),x+=F}const _=new Float64Array(i);for(let I=0;I<i;I++){let F=0;for(let z=-g;z<=g;z++)F+=m[(I+z+i*4)%i]*f[z+g];_[I]=F/x}const y=new Float64Array(i);for(let I=0;I<i;I++){const F=I*this.ds;let z=1;if(F>this.viaductS1){const X=Math.min(F-this.viaductS1,n-F+this.viaductS0);z=1-Ot(0,150,X)}y[I]=_[I]*(1-z)+$t.railY*z}const w=.023*this.ds;for(let I=0;I<3;I++){for(let F=0;F<i;F++){const z=(F+i-1)%i,X=y[F]-y[z];Math.abs(X)>w&&(y[F]=y[z]+Math.sign(X)*w)}for(let F=i-1;F>=0;F--){const z=(F+1)%i,X=y[F]-y[z];Math.abs(X)>w&&(y[F]=y[z]+Math.sign(X)*w)}}for(let I=0;I<i;I++){const F=I*this.ds;F>=this.viaductS0&&F<=this.viaductS1&&(y[I]=$t.railY)}const S=new Float64Array(i);for(let I=0;I<6;I++){for(let F=0;F<i;F++){const z=F*this.ds,X=z>=this.viaductS0&&z<=this.viaductS1;S[F]=X?$t.railY:(y[(F+i-2)%i]+2*y[(F+i-1)%i]+2*y[F]+2*y[(F+1)%i]+y[(F+2)%i])/8}y.set(S)}this.P=new Float32Array(i*3),this.T=new Float32Array(i*3),this.U=new Float32Array(i*3),this.curvature=new Float32Array(i);for(let I=0;I<i;I++)this.P[I*3]=p[I],this.P[I*3+1]=y[I],this.P[I*3+2]=d[I];const T=new A,C=new A,b=new A;for(let I=0;I<i;I++){const F=(I+i-1)%i,z=(I+1)%i;T.set(p[z]-p[F],y[z]-y[F],d[z]-d[F]).normalize(),this.T[I*3]=T.x,this.T[I*3+1]=T.y,this.T[I*3+2]=T.z}const M=new Float32Array(i);for(let I=0;I<i;I++){const F=(I+i-4)%i,z=(I+4)%i;C.set(this.T[F*3],0,this.T[F*3+2]).normalize(),b.set(this.T[z*3],0,this.T[z*3+2]).normalize(),M[I]=(C.x*b.z-C.z*b.x)*-1/(8*this.ds)}for(let I=0;I<i;I++){let F=0,z=0;for(let X=-40;X<=40;X++)F+=M[(I+X+i)%i],z++;this.curvature[I]=F/z}const E=new A(0,1,0),D=new A,N=new A;for(let I=0;I<i;I++){T.set(this.T[I*3],this.T[I*3+1],this.T[I*3+2]),D.crossVectors(T,E).normalize();const F=Oo.clamp(this.curvature[I]*7.5,-.05,.05);N.copy(E).multiplyScalar(Math.cos(F)).addScaledVector(D,-Math.sin(F)),N.addScaledVector(T,-T.dot(N)).normalize(),this.U[I*3]=N.x,this.U[I*3+1]=N.y,this.U[I*3+2]=N.z}}wrap(t){return t%=this.length,t<0?t+this.length:t}frame(t,e){t=this.wrap(t);const n=t/this.ds,i=Math.floor(n),r=i%this.n,o=(i+1)%this.n,a=n-i,c=this.P,l=this.T,u=this.U;return e.p.set(c[r*3]+(c[o*3]-c[r*3])*a,c[r*3+1]+(c[o*3+1]-c[r*3+1])*a,c[r*3+2]+(c[o*3+2]-c[r*3+2])*a),e.t.set(l[r*3]+(l[o*3]-l[r*3])*a,l[r*3+1]+(l[o*3+1]-l[r*3+1])*a,l[r*3+2]+(l[o*3+2]-l[r*3+2])*a).normalize(),e.u.set(u[r*3]+(u[o*3]-u[r*3])*a,u[r*3+1]+(u[o*3+1]-u[r*3+1])*a,u[r*3+2]+(u[o*3+2]-u[r*3+2])*a),e.u.addScaledVector(e.t,-e.t.dot(e.u)).normalize(),e.r.crossVectors(e.t,e.u).normalize(),e}nearestS(t,e){let n=1e12,i=0;for(let r=0;r<this.n;r+=2){const o=this.P[r*3]-t,a=this.P[r*3+2]-e,c=o*o+a*a;c<n&&(n=c,i=r)}return i*this.ds}sampleXYZ(t,e){return t=(t%this.n+this.n)%this.n,e.set(this.P[t*3],this.P[t*3+1],this.P[t*3+2])}inViaduct(t){return t=this.wrap(t),t>=this.viaductS0&&t<=this.viaductS1}}class Es{constructor(t,e,n,i,r,o=0){this.x0=t,this.z0=e,this.cell=n,this.nx=i,this.nz=r,this.data=new Float32Array(i*r).fill(o)}x0;z0;cell;nx;nz;data;sample(t,e){const n=Fn((t-this.x0)/this.cell,0,this.nx-1.001),i=Fn((e-this.z0)/this.cell,0,this.nz-1.001),r=Math.floor(n),o=Math.floor(i),a=n-r,c=i-o,l=this.data,u=this.nx,h=l[o*u+r],p=l[o*u+r+1],d=l[(o+1)*u+r],m=l[(o+1)*u+r+1];return(h+(p-h)*a)*(1-c)+(d+(m-d)*a)*c}inside(t,e){return t>=this.x0&&e>=this.z0&&t<this.x0+(this.nx-1)*this.cell&&e<this.z0+(this.nz-1)*this.cell}}class $_{constructor(t){this.track=t,this.buildRiver(),this.buildLoopField(),this.buildTrackField()}track;river=[];sdGrid;riverFine;riverCoarse;trackDist;trackY;fine;buildRiver(){const t=new is([...B_,[250,1160],[320,1400],[380,1700],[410,2100],[420,2500]].map(([x,_])=>new A(x,0,_)),!1,"centripetal");t.arcLengthDivisions=4e3;const e=t.getLength(),i=Math.floor(e/2),r=new A;for(let x=0;x<=i;x++){t.getPointAt(x/i,r);const _=Ha(r.z),y=Fn(2.6+(r.z+350)*.0045,2.6,7.5);this.river.push({x:r.x,z:r.z,y:_-.42,w:y})}const o=-120,a=-400,c=2,l=Math.ceil((300-o)/c),u=Math.ceil((1e3-a)/c);this.riverFine=new Es(o,a,c,l,u,999);const h=40;for(const x of this.river){const _=Math.max(0,Math.floor((x.x-h-o)/c)),y=Math.min(l-1,Math.ceil((x.x+h-o)/c)),w=Math.max(0,Math.floor((x.z-h-a)/c)),S=Math.min(u-1,Math.ceil((x.z+h-a)/c));for(let T=w;T<=S;T++){const C=a+T*c;for(let b=_;b<=y;b++){const M=o+b*c,E=Math.hypot(M-x.x,C-x.z),D=T*l+b;E<this.riverFine.data[D]&&(this.riverFine.data[D]=E)}}}const p=-900,d=-700,m=16,v=Math.ceil(2200/m),g=Math.ceil(3500/m);this.riverCoarse=new Es(p,d,m,v,g,0);const f=this.river.filter((x,_)=>_%3===0);for(let x=0;x<g;x++)for(let _=0;_<v;_++){const y=p+_*m,w=d+x*m;let S=1e12;for(let T=0;T<f.length;T++){const C=f[T].x-y,b=f[T].z-w,M=C*C+b*b;M<S&&(S=M)}this.riverCoarse.data[x*v+_]=Math.sqrt(S)}}riverDist(t,e){if(this.riverFine.inside(t,e)){const n=this.riverFine.sample(t,e);if(n<36)return n}return Math.max(this.riverCoarse.sample(t,e),36)}nearestRiver(t,e){let n=1e12,i=this.river[0];for(const r of this.river){const o=r.x-t,a=r.z-e,c=o*o+a*a;c<n&&(n=c,i=r)}return{s:i,d:Math.sqrt(n)}}buildLoopField(){const t=this.track,e=[],n=new A;for(let u=0;u<t.n;u+=8){t.sampleXYZ(u,n);const h=u*t.ds;e.push({x:n.x,z:n.z,open:!(h<=t.viaductS1+6)})}const i=-3600,r=-3800,o=24,a=Math.ceil(7200/o),c=Math.ceil(7200/o);this.sdGrid=new Es(i,r,o,a,c,0);const l=e.filter(u=>u.open);for(let u=0;u<c;u++){const h=r+u*o;for(let p=0;p<a;p++){const d=i+p*o;let m=1e12;for(let f=0;f<l.length;f++){const x=l[f].x-d,_=l[f].z-h,y=x*x+_*_;y<m&&(m=y)}let v=!1;for(let f=0,x=e.length-1;f<e.length;x=f++){const _=e[f],y=e[x];_.z>h!=y.z>h&&d<(y.x-_.x)*(h-_.z)/(y.z-_.z)+_.x&&(v=!v)}const g=Math.sqrt(m);this.sdGrid.data[u*a+p]=v?-g:g}}}buildTrackField(){const t=this.track,e=1.5,n=-300,i=-540,r=Math.ceil(600/e),o=Math.ceil(600/e);this.trackDist=new Es(n,i,e,r,o,999),this.trackY=new Es(n,i,e,r,o,0);const a=28,c=new A;for(let l=0;l<t.n;l++){t.sampleXYZ(l,c);const u=Math.max(0,Math.floor((c.x-a-n)/e)),h=Math.min(r-1,Math.ceil((c.x+a-n)/e)),p=Math.max(0,Math.floor((c.z-a-i)/e)),d=Math.min(o-1,Math.ceil((c.z+a-i)/e));for(let m=p;m<=d;m++){const v=i+m*e;for(let g=u;g<=h;g++){const f=n+g*e,x=Math.hypot(f-c.x,v-c.z),_=m*r+g;x<this.trackDist.data[_]&&(this.trackDist.data[_]=x,this.trackY.data[_]=c.y)}}}}setGrid(t,e,n,i,r,o){const a=new Es(t,e,n,i,r);a.data=o,this.fine=a}fastHeight(t,e){return this.fine&&this.fine.inside(t,e)?this.fine.sample(t,e):this.height(t,e,1)}fastSlope(t,e){const i=this.fastHeight(t+3,e)-this.fastHeight(t-3,e),r=this.fastHeight(t,e+3)-this.fastHeight(t,e-3);return Math.hypot(i,r)/6}trackDistance(t,e){return this.trackDist.inside(t,e)?this.trackDist.sample(t,e):999}sd(t,e){return this.sdGrid.sample(t,e)}smoothBase(t,e,n=0){const i=this.sdGrid.sample(t,e),r=Gu(t,e),o=Fn(e,-352,1200),a=Ha(o),c=t-$t.cx,l=e-$t.cz,u=Math.hypot(c,l)+1e-6,h=(c*.35+l*-.94)/u,p=.26+.74*Ot(-.35,.85,h);let d;if(i<0){const f=Ot(0,45,-i),x=i+f*34*Ht.fbm2(t*.0065+17,e*.0065-5,3),_=Fn(-x/(120+40*Ht.n2(t*.004,e*.004)),0,1),y=_*_*(3-2*_);if(d=r-(r-a)*Math.pow(y,.9),n<3){const S=Ot(.04,.3,_)*(1-Ot(.82,1,_));d+=S*15*(Ht.ridged2(t*.011+3,e*.011+9,n>1?2:4)-.45),d+=(1-S*.5)*1.6*Ht.fbm2(t*.02,e*.02,2)*Ot(.5,1,_)}const w=Ot(-300,-420,e)*Ot(-i,30,120);d+=14*w*(.55+.9*(Ht.fbm2(t*.011+8,e*.011,3)*.5+.5))}else{const f=i,x=26*Ot(0,220,f)+105*p*Ot(30,520,f),_=n>1?3:5,y=.25+.75*Ht.ridged2(t*.0017+5.3,e*.0017-2.9,_),w=.55+.9*Ht.ridged2(t*.0065+1.1,e*.0065+7.7,n>1?2:4),S=330*p*Math.pow(Ot(220,2400,f),1.2),T=26*Ht.fbm2(t*.004+9.1,e*.004+1.3,n>1?2:3)*Ot(0,300,f);d=r+x*w+S*y+T}const m=this.riverDist(t,e),v=1+1.6*Ot(0,450,e),g=a+21*Math.pow(m/(52*v),1.55);return d=F_(d,g,26),d}height(t,e,n=0){let i=this.smoothBase(t,e,n);if(n<=1){const a=this.smoothBase(t+5,e,n)-this.smoothBase(t-5,e,n),c=this.smoothBase(t,e+5,n)-this.smoothBase(t,e-5,n),l=Math.hypot(a,c)/10,u=Ot(.42,.95,l),h=Ht.fbm2(t*.045,e*.045,3);if(i+=1.4*h+.45*Ht.n2(t*.19,e*.19),u>.001){const p=(Ht.ridged2(t*.06+1.7,e*.06+8.3,3)*.7+.3*Ht.ridged2(t*.13,e*.13,2))*(.55+.9*(Ht.fbm2(t*.02-4,e*.02+6,2)*.5+.5)),d=Math.round(i*.4+Ht.n2(t*.02,e*.02)*2)*2.5;i=or(i,d,.18*u)+u*(2.6*p-.2+.8*Ht.n2(t*.21+4,e*.21))}}const r=this.riverDist(t,e);if(r<34){const o=Fn(e,-352,1200),a=Ha(o),c=1-Ot(14,34,r),l=a+.5*Ht.n2(t*.06,e*.06)+.35*Ot(5,20,r);i=or(i,Math.min(i,l+1.2+4*Ot(10,32,r)),c*.5);const u=1-Ot(4,12,r),h=a-.42-k_*(1-Ot(0,5.2,r)*.6),p=a+.4*Ot(5,14,r);i=or(i,p,u),r<6.2&&(i=or(i,h,1-Ot(2.4,6.2,r)))}if(this.trackDist.inside(t,e)){const o=this.trackDist.sample(t,e);if(o<28){const a=this.trackY.sample(t,e),c=a-.62,l=a-i,u=1-Ot(10,17,l);if(u>0){const h=Math.max(0,o-3.6),p=c-h*.66,d=c+h*.9+.35*Math.max(0,o-6)*Ht.n2(t*.2,e*.2),m=o<=3.6?c:Fn(i,p,d);i=or(i,m,u)}}}return i}normal(t,e,n=new A,i=1.2){const r=this.height(t+i,e)-this.height(t-i,e),o=this.height(t,e+i)-this.height(t,e-i);return n.set(-r,2*i,-o).normalize()}slope(t,e){const i=this.height(t+1.5,e)-this.height(t-1.5,e),r=this.height(t,e+1.5)-this.height(t,e-1.5);return Math.hypot(i,r)/(2*1.5)}isFree(t,e,n=6,i=6){if(this.trackDistance(t,e)<n||this.riverDist(t,e)<i)return!1;const r=t-$t.cx,o=e-$t.cz,a=Math.hypot(r,o);if(Math.abs(a-$t.radius)<$t.width/2+5){const c=Math.atan2(r,o);if(Math.abs(c*$t.radius)<$t.halfLen+5)return!1}return!0}}function Qi(s,t,e,n){const i=Ht.fbm2(s*.0072+40,t*.0072-12,3)*.5+.5,r=Ot(.5,.64,i),o=Ot(2,9,e)*(1-Ot(95,150,e)),a=1-Ot(.62,1,n);return r*o*a}function Wu(s,t,e,n){const i=Ht.fbm2(s*.011-7,t*.011+21,3)*.5+.5,r=1-Ot(18,50,e);return Ot(.42,.62,i)*r*(1-Ot(.5,.9,n))}function Xu(s,t,e){const n=Ht.fbm2(s*.02+90,t*.02+33,3)*.5+.5;return Ot(.35,.65,n)*Ot(20,70,e)}function qu(s,t,e){const n=Ht.fbm2(s*.017-50,t*.017+13,3)*.5+.5;return Ot(.55,.72,n)*(1-Ot(60,120,e))}const Uo=[{cell:3,x0:-432,x1:432,z0:-576,z1:768,lod:0},{cell:6,x0:-720,x1:720,z0:-864,z1:1056,lod:1},{cell:12,x0:-1200,x1:1200,z0:-1440,z1:1632,lod:2},{cell:24,x0:-2400,x1:2400,z0:-2640,z1:2880,lod:3},{cell:48,x0:-5040,x1:5040,z0:-5280,z1:5520,lod:4}],K_=[{cell:6,x0:-432,x1:432,z0:-576,z1:768,lod:0},Uo[2],Uo[3],Uo[4]],J_=new lt;function Hn(s,t,e,n=J_){return n.setRGB(s,t,e,ae)}const Q_=Hn(.3,.38,.15,new lt),tx=Hn(.22,.33,.11,new lt),ex=Hn(.44,.35,.2,new lt),nx=Hn(.45,.27,.36,new lt),ix=Hn(.58,.37,.14,new lt),Nh=Hn(.36,.35,.34,new lt),sx=Hn(.24,.24,.24,new lt),rx=Hn(.5,.48,.44,new lt),ox=Hn(.44,.41,.35,new lt),ax=Hn(.4,.38,.34,new lt),Fh=Hn(.14,.21,.09,new lt),zh=new lt;class cx{cell=16;x0=-2800;z0=-3e3;nx=350;nz=380;data;constructor(t){this.data=new Float32Array(this.nx*this.nz);for(let e=0;e<this.nz;e++)for(let n=0;n<this.nx;n++)this.data[e*this.nx+n]=t.height(this.x0+n*this.cell,this.z0+e*this.cell,3)}sample(t,e){const n=(t-this.x0)/this.cell,i=(e-this.z0)/this.cell;if(n<0||i<0||n>=this.nx-1.001||i>=this.nz-1.001)return-1e9;const r=n|0,o=i|0,a=n-r,c=i-o,l=this.data,u=this.nx,h=l[o*u+r],p=l[o*u+r+1],d=l[(o+1)*u+r],m=l[(o+1)*u+r+1];return(h+(p-h)*a)*(1-c)+(d+(m-d)*a)*c}}class lx{constructor(t,e=!1,n){this.land=t,this.rings=e?K_:Uo,this.material=Ke(new _e({vertexColors:!0,roughness:.96,metalness:0}),{key:"terrain",vertDecl:"attribute float aBake; varying float vBake;",vertMain:"vBake = aBake;",fragDecl:"varying float vBake;",fragColor:`
          float dist = length(vViewPosition);
          float n1 = heFbm2L(vWPos.xz * 0.33);
          float slopeF = 1.0 - clamp(vWNormal.y, 0.0, 1.0);
          diffuseColor.rgb *= 0.72 + 0.56 * n1;
          float fine = 1.0 - smoothstep(25.0, 140.0, dist);
          if (dist < 150.0) {
            float n2 = heVNoise2(vWPos.xz * 2.3);
            float n3 = heVNoise2(vWPos.xz * 11.0);
            diffuseColor.rgb *= 1.0 + (n2 - 0.5) * 0.28 * (0.4 + 0.6 * fine) + (n3 - 0.5) * 0.22 * fine;
          }
          float rockW = smoothstep(0.30, 0.52, slopeF);
          if (rockW > 0.01) {
            float strata = sin(vWPos.y * 2.6 + n1 * 5.0) * 0.5 + 0.5;
            float strataFade = 1.0 - smoothstep(60.0, 380.0, dist);
            vec3 rockTone = diffuseColor.rgb * (0.82 + 0.3 * strata * strataFade);
            float rockFade = 1.0 - smoothstep(120.0, 520.0, dist);
            if (rockFade > 0.01) {
              // weathered rock: blocky joints, vertical water staining, lichen
              float jx = heVNoise(vec3(vWPos.x * 0.55, vWPos.y * 1.3, vWPos.z * 0.55));
              float jy = heVNoise(vec3(vWPos.x * 1.9, vWPos.y * 0.7, vWPos.z * 1.9));
              float joint = smoothstep(0.46, 0.5, abs(jx - 0.5)) * 0.35 + smoothstep(0.44, 0.5, abs(jy - 0.5)) * 0.2;
              float stain = smoothstep(0.55, 0.85, heVNoise2(vec2((vWPos.x + vWPos.z) * 0.9, vWPos.y * 0.07)));
              float lich = smoothstep(0.7, 0.85, heVNoise(vWPos * 0.9 + 4.0));
              vec3 rt = rockTone * (1.0 - joint * 0.7 * rockFade) * (1.0 - stain * 0.35 * rockFade);
              rt = mix(rt, vec3(0.36, 0.34, 0.14) * (0.5 + 0.5 * jx), lich * 0.4 * rockFade);
              rockTone = rt;
            }
            diffuseColor.rgb = mix(diffuseColor.rgb, rockTone, rockW);
          }
        `,fragNormal:`
          float bdist = length(vViewPosition);
          if (bdist < 170.0) {
            float hb = (heVNoise2(vWPos.xz * 1.7) * 0.5 + heVNoise2(vWPos.xz * 6.1) * 0.25 + heVNoise2(vWPos.xz * 21.0) * 0.12);
            float rk = smoothstep(0.30, 0.55, 1.0 - clamp(vWNormal.y, 0.0, 1.0));
            if (rk > 0.01) hb += rk * (heVNoise(vec3(vWPos.x * 2.6, vWPos.y * 2.0, vWPos.z * 2.6)) * 1.6 + heVNoise(vWPos * 7.0) * 0.8);
            float bf = 1.0 - smoothstep(20.0, 160.0, bdist);
            normal = hePerturb(-vViewPosition, normal, vec2(dFdx(hb), dFdy(hb)) * (0.55 * bf), faceDirection);
          }
        `,fragLightsEnd:`
          float farFade = smoothstep(uShadowFocus.w * 0.72, uShadowFocus.w * 1.0, length(vWPos.xz - uShadowFocus.xz));
          float bk = mix(1.0, mix(0.1, 1.0, vBake), farFade);
          reflectedLight.directDiffuse *= bk;
          reflectedLight.directSpecular *= bk;
        `});const i=new cx(t);n?.(.1);const r=this.rings;r.forEach((o,a)=>{const c=this.buildRing(o,a,i,a>0?r[a-1]:null,a<r.length-1?r[a+1]:null);c.receiveShadow=!0,c.castShadow=!1,this.group.add(c),n?.(.1+.9*(a+1)/r.length)})}land;group=new Ne;material;rings;buildRing(t,e,n,i,r){const o=this.land,a=Math.round((t.x1-t.x0)/t.cell)+1,c=Math.round((t.z1-t.z0)/t.cell)+1,l=new Float32Array(a*c),u=new Uint8Array(a*c),h=(b,M)=>i!==null&&b>i.x0+.001&&b<i.x1-.001&&M>i.z0+.001&&M<i.z1-.001;for(let b=0;b<c;b++){const M=t.z0+b*t.cell;for(let E=0;E<a;E++){const D=t.x0+E*t.cell,N=b*a+E;if(h(D,M)){u[N]=1;continue}l[N]=o.height(D,M,t.lod)}}if(e===0&&this.land.setGrid(t.x0,t.z0,t.cell,a,c,l),r){const b=(M,E)=>{for(let D=1;D<E-1;D+=2)l[M(D)]=.5*(l[M(D-1)]+l[M(D+1)])};b(M=>M,a),b(M=>(c-1)*a+M,a),b(M=>M*a,c),b(M=>M*a+a-1,c)}const p=[];for(let b=0;b<c-1;b++)for(let M=0;M<a-1;M++){const E=b*a+M,D=E+1,N=E+a,I=N+1;i&&h(t.x0+(M+.5)*t.cell,t.z0+(b+.5)*t.cell)||(M+b&1?p.push(E,N,D,D,N,I):p.push(E,N,I,E,I,D))}const d=new Float32Array(a*c*3),m=new Float32Array(a*c*3),v=new Float32Array(a*c*3),g=new Float32Array(a*c).fill(1),f=new tt(en.x,en.z).normalize(),x=en.y/Math.hypot(en.x,en.z),_=t.cell<=24,y=t.cell<=3?10:t.cell<=6?14:22,w=t.cell<=6?1600:2400,S=new lt;for(let b=0;b<c;b++){const M=t.z0+b*t.cell;for(let E=0;E<a;E++){const D=b*a+E;if(u[D])continue;const N=t.x0+E*t.cell,I=l[D];d[D*3]=N,d[D*3+1]=I,d[D*3+2]=M;const F=Math.max(E-1,0),z=Math.min(E+1,a-1),X=Math.max(b-1,0),k=Math.min(b+1,c-1);let K=l[b*a+F],rt=l[b*a+z],Z=l[X*a+E],mt=l[k*a+E];u[b*a+F]&&(K=o.height(N-t.cell,M,t.lod)),u[b*a+z]&&(rt=o.height(N+t.cell,M,t.lod)),u[X*a+E]&&(Z=o.height(N,M-t.cell,t.lod)),u[k*a+E]&&(mt=o.height(N,M+t.cell,t.lod));const Vt=(z-F)*t.cell,Zt=(k-X)*t.cell,Kt=-(rt-K)/Vt,$=-(mt-Z)/Zt,st=1/Math.hypot(Kt,1,$);m[D*3]=Kt*st,m[D*3+1]=st,m[D*3+2]=$*st;const wt=Math.hypot(Kt,$),Rt=.25*(K+rt+Z+mt)-I,ee=1-.26*Ot(.2,3.2,Rt/(t.cell/3));if(this.colorAt(N,M,I,wt,Rt,S),v[D*3]=S.r*ee,v[D*3+1]=S.g*ee,v[D*3+2]=S.b*ee,_){let se=1;const U=f.x,it=f.y;for(let J=y;J<w;J+=y*(1+J/900)){const Q=n.sample(N+U*J,M+it*J);if(Q<-1e8)break;const et=I+1.5+J*x,vt=(Q-et)/(6+J*.035);if(vt>-1&&(se=Math.min(se,Fn(1-(vt+1)*.7,0,1))),se<=.001)break}g[D]=se}}}const T=new me;T.setAttribute("position",new Ae(d,3)),T.setAttribute("normal",new Ae(m,3)),T.setAttribute("color",new Ae(v,3)),T.setAttribute("aBake",new Ae(g,1)),T.setIndex(a*c>65535?new tl(p,1):new Qc(p,1)),T.computeBoundingSphere(),T.computeBoundingBox();const C=new ue(T,this.material);return C.frustumCulled=!0,C.name=`terrain-ring-${e}`,C}colorAt(t,e,n,i,r,o){const a=this.land,c=Ht.fbm2(t*.006+13,e*.006-4,3)*.5+.5,l=Ht.fbm2(t*.03+5,e*.03+2,3)*.5+.5;o.copy(Q_).lerp(tx,l);const u=Xu(t,e,n);o.lerp(ex,Ot(40,130,n)*.8),o.lerp(nx,u*.55*Ot(.4,.7,l)),o.lerp(ix,qu(t,e,n)*.65*Ot(.35,.65,c));const h=Qi(t,e,n,i);o.lerp(Fh,h*.7),o.lerp(Fh,Wu(t,e,n,i)*.35);const p=Ot(.5,.95,i+(l-.5)*.25);zh.copy(Nh).lerp(sx,Ot(.35,.75,l)),o.lerp(zh,p),o.lerp(rx,Ot(.85,1.25,i)*.5*l),o.multiplyScalar(1-.22*Ot(0,4,r));const d=a.riverDist(t,e);o.lerp(ox,(1-Ot(2.5,7.5,d))*.85);const m=a.trackDistance(t,e);m<5.5&&o.lerp(ax,1-Ot(3.6,5.5,m)),o.lerp(Nh,Ot(220,380,n)*.35)}}function Ii(s,t=!1){const e=s[0].index!==null,n=new Set(Object.keys(s[0].attributes)),i=new Set(Object.keys(s[0].morphAttributes)),r={},o={},a=s[0].morphTargetsRelative,c=new me;let l=0;for(let u=0;u<s.length;++u){const h=s[u];let p=0;if(e!==(h.index!==null))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+u+". All geometries must have compatible attributes; make sure index attribute exists among all geometries, or in none of them."),null;for(const d in h.attributes){if(!n.has(d))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+u+'. All geometries must have compatible attributes; make sure "'+d+'" attribute exists among all geometries, or in none of them.'),null;r[d]===void 0&&(r[d]=[]),r[d].push(h.attributes[d]),p++}if(p!==n.size)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+u+". Make sure all geometries have the same number of attributes."),null;if(a!==h.morphTargetsRelative)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+u+". .morphTargetsRelative must be consistent throughout all geometries."),null;for(const d in h.morphAttributes){if(!i.has(d))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+u+".  .morphAttributes must be consistent throughout all geometries."),null;o[d]===void 0&&(o[d]=[]),o[d].push(h.morphAttributes[d])}if(t){let d;if(e)d=h.index.count;else if(h.attributes.position!==void 0)d=h.attributes.position.count;else return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+u+". The geometry must have either an index or a position attribute"),null;c.addGroup(l,d,u),l+=d}}if(e){let u=0;const h=[];for(let p=0;p<s.length;++p){const d=s[p].index;for(let m=0;m<d.count;++m)h.push(d.getX(m)+u);u+=s[p].attributes.position.count}c.setIndex(h)}for(const u in r){const h=Oh(r[u]);if(!h)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the "+u+" attribute."),null;c.setAttribute(u,h)}for(const u in o){const h=o[u][0].length;if(h===0)break;c.morphAttributes=c.morphAttributes||{},c.morphAttributes[u]=[];for(let p=0;p<h;++p){const d=[];for(let v=0;v<o[u].length;++v)d.push(o[u][v][p]);const m=Oh(d);if(!m)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the "+u+" morphAttribute."),null;c.morphAttributes[u].push(m)}}return c}function Oh(s){let t,e,n,i=-1,r=0;for(let l=0;l<s.length;++l){const u=s[l];if(t===void 0&&(t=u.array.constructor),t!==u.array.constructor)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.array must be of consistent array types across matching attributes."),null;if(e===void 0&&(e=u.itemSize),e!==u.itemSize)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.itemSize must be consistent across matching attributes."),null;if(n===void 0&&(n=u.normalized),n!==u.normalized)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.normalized must be consistent across matching attributes."),null;if(i===-1&&(i=u.gpuType),i!==u.gpuType)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.gpuType must be consistent across matching attributes."),null;r+=u.count*e}const o=new t(r),a=new Ae(o,e,n);let c=0;for(let l=0;l<s.length;++l){const u=s[l];if(u.isInterleavedBufferAttribute){const h=c/e;for(let p=0,d=u.count;p<d;p++)for(let m=0;m<e;m++){const v=u.getComponent(p,m);a.setComponent(p+h,m,v)}}else o.set(u.array,c);c+=u.count*e}return i!==void 0&&(a.gpuType=i),a}const yo=[[-.032,0],[.032,0],[.035,-.009],[.034,-.03],[.013,-.046],[.009,-.062],[.009,-.118],[.07,-.134],[.07,-.146],[-.07,-.146],[-.07,-.134],[-.009,-.118],[-.009,-.062],[-.013,-.046],[-.034,-.03],[-.035,-.009]];class Wo{constructor(t){this.track=t,this.group.name="track",this.buildBallast(),this.buildRails(),this.buildSleepersAndFittings()}track;group=new Ne;static SLEEPER_TOP=-.146;buildBallast(){const t=this.track,e=kn(),n=[[3.05,-.82],[2.15,-.21],[1.9,-.172],[-1.9,-.172],[-2.15,-.21],[-3.05,-.82]],i=1,r=Math.floor(t.length/i),o=[],a=[],c=[],l=new He(77),u=new lt;for(let v=0;v<=r;v++){const g=v*i;t.frame(g,e);for(let f=0;f<n.length;f++){const[x,_]=n[f];o.push(e.p.x+e.r.x*x+e.u.x*_,e.p.y+e.r.y*x+e.u.y*_,e.p.z+e.r.z*x+e.u.z*_);const y=.5+l.range(-.08,.08);u.setRGB(y*.86,y*.83,y*.78,ae),a.push(u.r,u.g,u.b)}}const h=n.length;for(let v=0;v<r;v++)for(let g=0;g<h-1;g++){const f=v*h+g,x=f+1,_=f+h,y=_+1;c.push(f,_,x,x,_,y)}const p=new me;p.setAttribute("position",new Gt(o,3)),p.setAttribute("color",new Gt(a,3)),p.setIndex(c),p.computeVertexNormals();const d=Ke(new _e({vertexColors:!0,roughness:.97,metalness:0}),{key:"ballast",fragColor:`
        float g1 = heVNoise2(vWPos.xz * 26.0 + vWPos.y * 9.0);
        float g2 = heVNoise2(vWPos.xz * 71.0 - vWPos.y * 13.0);
        float g3 = heVNoise2(vWPos.xz * 7.0);
        diffuseColor.rgb *= 0.55 + 0.9 * g1 * (0.6 + 0.8 * g2);
        diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(1.15, 1.02, 0.85), smoothstep(0.55, 0.9, g3) * 0.5);
      `,fragNormal:`
        float hb = heVNoise2(vWPos.xz * 26.0 + vWPos.y * 9.0) * 0.5 + heVNoise2(vWPos.xz * 71.0 - vWPos.y * 13.0) * 0.35;
        float bf = 1.0 - smoothstep(10.0, 55.0, length(vViewPosition));
        normal = hePerturb(-vViewPosition, normal, vec2(dFdx(hb), dFdy(hb)) * 0.9 * bf, faceDirection);
      `}),m=new ue(p,d);m.receiveShadow=!0,m.castShadow=!1,this.group.add(m)}buildRails(){const t=this.track,e=kn(),n=1,i=Math.floor(t.length/n),r=yo.length,o=[],a=[],c=[],l=[],u=new lt().setRGB(.72,.72,.74,ae),h=new lt().setRGB(.3,.18,.11,ae),p=[];for(let g=0;g<r;g++){const[f,x]=yo[g],[_,y]=yo[(g+1)%r],w=_-f,S=y-x,T=Math.hypot(w,S);p.push([-S/T,w/T])}for(const g of[-1,1]){const f=o.length/3;for(let x=0;x<=i;x++){t.frame(x*n,e);for(let _=0;_<r;_++){const[y,w]=yo[_],S=g*Lo+y;o.push(e.p.x+e.r.x*S+e.u.x*w,e.p.y+e.r.y*S+e.u.y*w,e.p.z+e.r.z*S+e.u.z*w);const T=p[(_+r-1)%r],C=p[_];let b=T[0]+C[0],M=T[1]+C[1];const E=Math.hypot(b,M)||1;b/=E,M/=E,a.push(e.r.x*b+e.u.x*M,e.r.y*b+e.u.y*M,e.r.z*b+e.u.z*M);const N=(w>-.05?1:0)?u:h;c.push(N.r,N.g,N.b)}}for(let x=0;x<i;x++)for(let _=0;_<r;_++){const y=f+x*r+_,w=f+x*r+(_+1)%r,S=y+r,T=w+r;l.push(y,w,S,w,T,S)}}const d=new me;d.setAttribute("position",new Gt(o,3)),d.setAttribute("normal",new Gt(a,3)),d.setAttribute("color",new Gt(c,3)),d.setIndex(l);const m=new _e({vertexColors:!0,roughness:.38,metalness:.85,side:pi}),v=new ue(d,m);v.castShadow=!0,v.receiveShadow=!0,this.group.add(v)}buildSleepersAndFittings(){const t=this.track,e=kn(),n=.7,i=Math.floor(t.length/n),r=new We(2.6,.13,.26,1,1,1),o=new sn(r,Ke(new _e({roughness:.92,metalness:0}),{key:"sleeper",fragColor:`
          float grain = heVNoise2(vec2(vOPos.x * 3.0, vOPos.z * 90.0 + vRand * 40.0));
          float g2 = heVNoise2(vec2(vOPos.x * 14.0 + vRand * 9.0, vOPos.z * 30.0));
          diffuseColor.rgb *= 0.72 + 0.5 * grain * (0.7 + 0.5 * g2);
          // creosote/oil near the rail seats, pale weathered ends
          float endW = smoothstep(1.0, 1.3, abs(vOPos.x));
          diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(1.35, 1.25, 1.1), endW * 0.5);
        `}),i);o.castShadow=!1,o.receiveShadow=!0;const a=[],c=(b,M,E,D,N,I)=>{const F=new We(b,M,E).toNonIndexed();return F.translate(D,N,I),F};a.push(c(.2,.022,.13,0,.011,0)),a.push(c(.025,.07,.12,-.054,.045,0)),a.push(c(.025,.065,.12,.054,.04,0)),a.push(c(.012,.045,.1,.034,.055,0));const l=Ii(a.map(b=>(b.deleteAttribute("uv"),b))),u=new sn(l,new _e({color:new lt().setRGB(.2,.16,.13,ae),roughness:.7,metalness:.6}),i*2),h=new Et,p=new Et,d=new xe,m=new He(4242),v=new lt,g=new xe,f=new A(0,1,0),x=new A,_=new A(1,1,1),y=new A;for(let b=0;b<i;b++){t.frame(b*n,e),p.makeBasis(e.r,e.u,e.t),d.setFromRotationMatrix(p),g.setFromAxisAngle(f,0);const M=m.range(-.012,.012),E=new xe().setFromAxisAngle(new A().copy(e.u),M);d.premultiply(E),y.copy(e.r).multiplyScalar(m.range(-.025,.025)),x.copy(e.p).addScaledVector(e.u,Wo.SLEEPER_TOP-.065).add(y);const D=m.range(.97,1.04);h.compose(x,d,_.set(m.range(.99,1.01),D,1)),o.setMatrixAt(b,h);const N=m.range(.55,1);v.setRGB(.2*N,.16*N,.12*N,ae),m.chance(.08)&&v.setRGB(.36,.31,.25,ae),o.setColorAt(b,v);for(let I=0;I<2;I++){const F=I===0?-1:1;x.copy(e.p).addScaledVector(e.u,Wo.SLEEPER_TOP).addScaledVector(e.r,F*Lo).add(y),h.compose(x,d,_.set(F,1,1)),u.setMatrixAt(b*2+I,h)}}o.instanceMatrix.needsUpdate=!0,o.instanceColor&&(o.instanceColor.needsUpdate=!0),u.instanceMatrix.needsUpdate=!0,u.castShadow=!1,u.receiveShadow=!0,o.frustumCulled=!1,u.frustumCulled=!1,this.group.add(o,u);const w=18.3,S=Math.floor(t.length/w),T=Ii([c(.014,.075,.62,0,-.08,0),...[-.22,-.08,.08,.22].map(b=>{const M=new hn(.014,.014,.012,6).toNonIndexed();return M.rotateZ(Math.PI/2),M.translate(.01,-.08,b),M})].map(b=>(b.deleteAttribute("uv"),b))),C=new sn(T,new _e({color:new lt().setRGB(.28,.22,.18,ae),roughness:.6,metalness:.7}),S*4);for(let b=0;b<S;b++){t.frame(b*w+b%2*.3,e),p.makeBasis(e.r,e.u,e.t),d.setFromRotationMatrix(p);for(let M=0;M<4;M++){const E=M<2?-1:1,D=M%2===0?1:-1;x.copy(e.p).addScaledVector(e.r,E*Lo+D*.0105*1),h.compose(x,d,_.set(D,1,1)),C.setMatrixAt(b*4+M,h)}}C.instanceMatrix.needsUpdate=!0,C.frustumCulled=!1,C.receiveShadow=!0,this.group.add(C)}dispose(){this.group.traverse(t=>{const e=t;e.geometry&&e.geometry.dispose()})}}const _t=$t,ze=_t.radius,qn=_t.width/2,Yu=_t.pier/2,Xo=.03,li=_t.span/2,Mo=.9,Xi=.9,ar=s=>(s-(_t.arches-1)/2)*Hu,cr=s=>(s-_t.arches/2)*Hu,lr=s=>Yu+Xo*Math.max(0,_t.springY-s),bo=s=>qn+Xo*Math.max(0,_t.springY-s);class hx{constructor(t){this.land=t,this.group.name="viaduct";const e=Math.ceil(2*_t.halfLen/.5)+1;this.ground=new Float32Array(e),this.groundOuter=new Float32Array(e),this.groundInner=new Float32Array(e);for(let n=0;n<e;n++){const i=this.u0+n*.5;this.ground[n]=this.groundAt(i,0),this.groundOuter[n]=this.groundAt(i,qn+2),this.groundInner[n]=this.groundAt(i,-qn-2)}this.buildCore(),this.buildFaces(),this.buildFlanks(),this.buildArchRings(),this.buildParapetAndCornice(),this.finish()}land;group=new Ne;stones=[];rng=new He(9001);minGround=-2;ground;groundOuter;groundInner;u0=-85.5;world(t,e,n,i=new A){const r=t/ze,o=ze+e;return i.set(_t.cx+o*Math.sin(r),n,_t.cz+o*Math.cos(r))}groundAt(t,e){const n=this.world(t,e,0);return this.land.height(n.x,n.z)}gIndex(t){return Fn(Math.round((t-this.u0)/.5),0,this.ground.length-1)}stoneColor(t,e,n,i=new lt){const r=this.rng,a=.46+.1*(r.range(0,1)-.5);i.setRGB(a*1.04,a*.97,a*.88,ae),r.chance(.12)&&i.multiplyScalar(.8),r.chance(.07)&&i.lerp(new lt().setRGB(.55,.42,.32,ae),.4);const c=e-n,l=Ht.fbm2(t*.35+3,e*.5,3)*.5+.5,u=Fn(Ot(11,0,c)*(.35+.9*l)+(l>.72?(l-.72)*3:0),0,.85),h=Ot(.55,.9,Ht.n2(t*1.7,e*.08)*.5+.5)*.35;return i.multiplyScalar(1-h),i.lerp(new lt().setRGB(.2,.3,.11,ae),u*.7*r.range(.6,1)),i}addStone(t,e,n,i,r,o,a=0,c=0,l=-999,u=.975){const h=t/ze,p=new A(Math.cos(h),0,-Math.sin(h)),d=new A(Math.sin(h),0,Math.cos(h)),m=new Et().makeBasis(p,new A(0,1,0),d),v=new xe().setFromRotationMatrix(m),g=this.rng,f=new xe().setFromEuler(new Ye(a+g.range(-.008,.008),g.range(-.012,.012),c+g.range(-.008,.008)));v.multiply(f);const x=new A(_t.cx+e*Math.sin(h),n,_t.cz+e*Math.cos(h)),_=new Et().compose(x,v,new A(i*u,r*u,o*u));this.stones.push({m:_,c:this.stoneColor(t,n,l===-999?this.ground[this.gIndex(t)]:l)})}addOriented(t,e,n,i,r,o,a,c,l){const u=new Et().makeBasis(e,n,i),h=new xe().setFromRotationMatrix(u),p=this.rng;h.multiply(new xe().setFromEuler(new Ye(p.range(-.01,.01),p.range(-.01,.01),p.range(-.01,.01))));const d=new Et().compose(t,h,new A(r*.975,o*.975,a*.975));this.stones.push({m:d,c:this.stoneColor(c,t.y,l)})}courseSchedule(){const t=[],e=new He(31),n=this.minGround-1.2,i=_t.deckY-.62;let r=n;for(;r<i-.05;){let a=(.64-.26*((r-n)/(i-n)))*e.range(.92,1.08);r+a>i-.2&&(a=i-r),t.push([r,r+a]),r+=a}return t}buildCore(){const e=Math.round(2*_t.halfLen/.25),n=ze-qn+.12,i=ze+qn-.12,r=_t.deckY-.02,o=[],a=[],c=m=>{let v=_t.springY;for(let g=0;g<_t.arches;g++){const f=m-ar(g),x=li+.14;Math.abs(f)<x&&(v=Math.max(v,_t.springY+Math.sqrt(x*x-f*f)))}return v};for(let m=0;m<=e;m++){const v=-85.5+m*.25,g=v/ze,f=Math.sin(g),x=Math.cos(g),_=c(v);for(const[y,w]of[[n,r],[i,r],[n,_],[i,_]])o.push(_t.cx+y*f,w,_t.cz+y*x)}const l=(m,v,g,f)=>a.push(m,v,g,v,f,g);for(let m=0;m<e;m++){const v=m*4,g=(m+1)*4;l(v+0,g+0,v+1,g+1),l(v+2,v+3,g+2,g+3),l(v+1,g+1,v+3,g+3),l(v+0,v+2,g+0,g+2)}const u=[];for(let m=0;m<=_t.arches;m++){const v=cr(m),g=this.pierPrism(v);u.push(g)}const h=new me;h.setAttribute("position",new Gt(o,3)),h.setIndex(a),h.computeVertexNormals();const p=Ke(new _e({color:new lt().setRGB(.19,.18,.17,ae),roughness:1,side:Xe}),{key:"viaduct-core",fragColor:"diffuseColor.rgb *= 0.7 + 0.6 * heFbm2(vWPos.xz * 0.9 + vWPos.y * 0.7);"}),d=new ue(h,p);d.castShadow=!0,d.receiveShadow=!0,this.group.add(d);for(const m of u){const v=new ue(m,p);v.castShadow=!0,v.receiveShadow=!0,this.group.add(v)}}pierPrism(t){const n=[],i=[],r=_t.springY+.3,o=this.minGround-1.5;for(let c=0;c<=6;c++){const l=r+(o-r)*c/6,u=lr(Math.min(l,_t.springY))-.1,h=bo(Math.min(l,_t.springY))-.1;for(const[p,d]of[[-1,-1],[1,-1],[1,1],[-1,1]]){const v=(t+p*u)/ze,g=ze+d*h;n.push(_t.cx+g*Math.sin(v),l,_t.cz+g*Math.cos(v))}}for(let c=0;c<6;c++)for(let l=0;l<4;l++){const u=c*4+l,h=c*4+(l+1)%4,p=u+4,d=h+4;i.push(u,p,h,h,p,d)}i.push(0,1,2,0,2,3);const a=new me;return a.setAttribute("position",new Gt(n,3)),a.setIndex(i),a.computeVertexNormals(),a}faceIntervals(t,e){const n=(t+e)/2,i=[];if(t>=_t.springY-.02){let r=[];for(let a=0;a<_t.arches;a++){const c=ar(a),l=li+.75,u=t-_t.springY;if(u<l){const h=Math.sqrt(l*l-u*u);r.push([c-h,c+h])}}r.sort((a,c)=>a[0]-c[0]);let o=-85.5;for(const[a,c]of r)a>o+.3&&i.push([o,a]),o=Math.max(o,c);_t.halfLen>o+.3&&i.push([o,_t.halfLen])}else for(let r=0;r<=_t.arches;r++){const o=cr(r),a=lr(n),c=Math.max(o-a,-85.5),l=Math.min(o+a,_t.halfLen);l-c>.3&&i.push([c,l])}return i}buildFaces(){const t=this.courseSchedule(),e=this.rng;for(const n of[1,-1])for(const[i,r]of t){const o=r-i,a=(i+r)/2,c=bo(a),l=a<_t.springY?Math.atan(Xo):0;for(const[u,h]of this.faceIntervals(i,r)){let p=u;for(;p<h-.05;){let d=e.range(.8,1.75);h-p-d<.55&&(d=h-p);const m=p+d/2,v=this.gIndex(m),g=n>0?this.groundOuter[v]:this.groundInner[v];if(p+=d,r<g-.55)continue;const f=ze+n*(c-Xi/2);this.addStone(m,f,a,d,o,Xi,n>0?l:-l,0,g)}}}}buildFlanks(){const t=this.courseSchedule(),e=this.rng;for(let n=0;n<=_t.arches;n++){const i=cr(n);for(const r of[-1,1])if(!(Math.abs(i+r*Yu)>_t.halfLen+.01))for(const[o,a]of t){if(o>_t.springY+.02)break;const c=a-o,l=(o+a)/2,u=lr(l),h=bo(l)-Xi+.02,p=i+r*u,d=p-r*(Xi/2-.02),m=-r*Math.atan(Xo);let v=-h;for(;v<h-.05;){let g=e.range(.8,1.6);h-v-g<.5&&(g=h-v);const f=v+g/2;v+=g;const x=this.groundAt(p,f);a<x-.55||this.addStone(d,ze+f,l,Xi,c,g,0,m,x)}}}}buildArchRings(){const t=this.rng;for(let e=0;e<_t.arches;e++){const n=ar(e),i=n/ze,r=new A(Math.cos(i),0,-Math.sin(i)),o=new A(Math.sin(i),0,Math.cos(i)),a=new A(0,1,0),c=27,l=this.world(n,0,_t.springY),u=new A,h=new A,p=new A;for(let d=0;d<c;d++){const m=(d+.5)*Math.PI/c,v=d===(c-1)/2,g=-Math.cos(m),f=Math.sin(m),x=Math.sin(m),_=Math.cos(m),y=Math.PI*(li+Mo/2)/c*1,w=v?Mo+.45:Mo+t.range(-.05,.12),S=(b,M)=>new A().addScaledVector(r,b).addScaledVector(a,M);h.copy(S(x,_)),p.copy(S(g,f));const T=6,C=2*(qn-.25)/T;for(let b=0;b<T;b++){const M=-qn+.25+C*(b+.5);u.copy(l).addScaledVector(o,M).addScaledVector(r,g*(li+.45)).addScaledVector(a,f*(li+.45));const E=(b+d)%2===0?0:.12;this.addOriented(u,h,p,o,y*1,.9+E,C*.995,n+g*li,0)}for(const b of[-1,1]){const M=b*(qn+.12-.475),E=v?Mo+.45:w,D=li+E/2;u.copy(l).addScaledVector(o,M).addScaledVector(r,g*D).addScaledVector(a,f*D),this.addOriented(u,h,p,o,y*(v?1.15:1),E,.95,n+g*li,0)}}}}buildParapetAndCornice(){const t=this.rng,e=new Et;this.balusters=[],this.posts=[];for(const n of[1,-1]){const i=ze+n*qn;let r=-85.5;for(;r<_t.halfLen-.05;){let c=t.range(1.5,2.3);_t.halfLen-r-c<.8&&(c=_t.halfLen-r);const l=r+c/2;r+=c,this.addStone(l,i+n*(.3-Xi/2),_t.deckY-.38,c,.46,Xi,0,0,0)}const o=i-n*.28;for(r=-85.5;r<_t.halfLen-.05;){let c=t.range(1.4,2.2);_t.halfLen-r-c<.8&&(c=_t.halfLen-r);const l=r+c/2;this.addStone(l,o,_t.deckY+.16,c,.34,.58,0,0,0,.98),this.addStone(l,o,_t.deckY+_t.parapetH-.09,c,.18,.66,0,0,0,.99);const u=Math.max(1,Math.round(c/.42));for(let h=0;h<u;h++){const d=(r+(h+.5)*c/u)/ze;e.makeTranslation(_t.cx+o*Math.sin(d),_t.deckY+.33,_t.cz+o*Math.cos(d)),this.balusters.push(e.clone())}r+=c}const a=[];for(let c=0;c<=_t.arches;c++)a.push(cr(c));for(let c=0;c<_t.arches;c++)a.push(ar(c));a.push(-85.5+.4,_t.halfLen-.4);for(const c of a){if(Math.abs(c)>_t.halfLen-.2&&Math.abs(c)>_t.halfLen)continue;this.addStone(c,o,_t.deckY+.72,.62,1.36,.62,0,0,0,.99),this.addStone(c,o,_t.deckY+1.44,.74,.12,.74,0,0,0,.99);const l=c/ze,u=new Et().compose(new A(_t.cx+o*Math.sin(l),_t.deckY+1.5+.18,_t.cz+o*Math.cos(l)),new xe().setFromAxisAngle(new A(0,1,0),Math.PI/4+l),new A(.5,.38,.5));this.posts.push(u)}}}balusters=[];posts=[];finish(){const t=new We(1,1,1),e=Ke(new _e({roughness:.93,metalness:0}),{key:"stone",vertDecl:"varying vec3 vSize;",vertMain:`
          vSize = vec3(1.0);
          #ifdef USE_INSTANCING
            vSize = vec3(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz), length(instanceMatrix[2].xyz));
          #endif`,fragDecl:"varying vec3 vSize;",fragColor:`
          vec3 aq = abs(vOPos);
          float mq = max(aq.x, max(aq.y, aq.z));
          vec3 de = (0.5 - aq) * vSize + 10.0 * step(mq - 0.0007, aq);
          float ed = min(de.x, min(de.y, de.z));
          float rim = 1.0 - smoothstep(0.0, 0.045, ed);
          vec3 sp = vWPos * 7.0 + vRand * 31.0;
          float chisel = heFbm(sp);
          float grain = heVNoise(vWPos * 38.0);
          float streakN = heVNoise2(vec2((vWPos.x + vWPos.z) * 1.9, vWPos.y * 0.22 + vRand));
          diffuseColor.rgb *= 0.78 + 0.5 * chisel;
          diffuseColor.rgb *= 0.9 + 0.2 * grain;
          diffuseColor.rgb *= 1.0 - 0.28 * smoothstep(0.5, 0.85, streakN);
          diffuseColor.rgb *= 1.0 - 0.45 * rim;
          // lichen speckle
          float lich = smoothstep(0.74, 0.82, heVNoise(vWPos * 3.1 + 7.0));
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.42, 0.40, 0.18) * (0.6 + 0.4 * chisel), lich * 0.45);
        `,fragNormal:`
          vec3 aq2 = abs(vOPos);
          float mq2 = max(aq2.x, max(aq2.y, aq2.z));
          vec3 de2 = (0.5 - aq2) * vSize + 10.0 * step(mq2 - 0.0007, aq2);
          float ed2 = min(de2.x, min(de2.y, de2.z));
          float bump = smoothstep(0.0, 0.05, ed2) * 0.55 + heFbm(vWPos * 9.0 + vRand * 11.0) * 0.5 + heVNoise(vWPos * 34.0) * 0.18;
          float bfd = 1.0 - smoothstep(18.0, 90.0, length(vViewPosition));
          normal = hePerturb(-vViewPosition, normal, vec2(dFdx(bump), dFdy(bump)) * (0.9 * bfd), faceDirection);
        `,fragRough:"roughnessFactor = clamp(roughnessFactor + (heVNoise(vWPos * 5.0) - 0.5) * 0.18, 0.5, 1.0);"}),n=new sn(t,e,this.stones.length);this.stones.forEach((u,h)=>{n.setMatrixAt(h,u.m),n.setColorAt(h,u.c)}),n.instanceMatrix.needsUpdate=!0,n.instanceColor&&(n.instanceColor.needsUpdate=!0),n.castShadow=!0,n.receiveShadow=!0,n.frustumCulled=!1,n.name="viaduct-stones",this.group.add(n),this.stoneCount=this.stones.length,this.stones=[];const i=[[0,0],[.085,0],[.085,.05],[.06,.08],[.05,.12],[.07,.2],[.075,.28],[.055,.36],[.05,.44],[.07,.5],[.085,.53],[.085,.6],[0,.6]].map(([u,h])=>new tt(u,h)),r=new Jo(i,8),o=Ke(new _e({color:new lt().setRGB(.5,.46,.4,ae),roughness:.9}),{key:"baluster",fragColor:"diffuseColor.rgb *= 0.8 + 0.4 * heFbm(vWPos * 14.0);"}),a=new sn(r,o,this.balusters.length);this.balusters.forEach((u,h)=>a.setMatrixAt(h,u)),a.castShadow=!0,a.receiveShadow=!0,a.frustumCulled=!1,this.group.add(a);const c=new $o(1,1,4),l=new sn(c,o,this.posts.length);this.posts.forEach((u,h)=>l.setMatrixAt(h,u)),l.castShadow=!0,l.frustumCulled=!1,this.group.add(l)}stoneCount=0;pushOut(t,e=1.5){const n=t.x-_t.cx,i=t.z-_t.cz,r=Math.hypot(n,i),a=Math.atan2(n,i)*ze,c=r-ze;if(Math.abs(a)>_t.halfLen+e)return!1;const l=qn+e;if(Math.abs(c)>l+3)return!1;const u=_t.deckY+_t.parapetH+e;let h=_t.springY-e;for(let f=0;f<_t.arches;f++){const x=a-ar(f),_=li-e;Math.abs(x)<_&&(h=Math.max(h,_t.springY+Math.sqrt(_*_-x*x)))}let p=!1,d=0;for(let f=0;f<=_t.arches;f++){const x=cr(f);Math.abs(a-x)<lr(Math.min(t.y,_t.springY))+e&&(p=!0,d=x)}if(!(Math.abs(c)<bo(Math.min(t.y,_t.springY))+e))return!1;let v=!1;const g=new A;if(t.y>_t.springY-e*.2&&t.y<u&&t.y>h){const f=u-t.y,x=l-Math.abs(c);if(f<x+.2||t.y>_t.deckY-1)t.y=u+.05;else{const _=Math.sign(c)||1;g.copy(t);const y=_*(l+.05),w=a/ze;t.x=_t.cx+(ze+y)*Math.sin(w),t.z=_t.cz+(ze+y)*Math.cos(w)}v=!0}else if(t.y<=_t.springY&&p){const f=a-d,_=(d+(f>=0?1:-1)*(lr(t.y)+e+.05))/ze;t.x=_t.cx+r*Math.sin(_),t.z=_t.cz+r*Math.cos(_),v=!0}return v}}const ux=`
attribute float aLat;     // -1..1 across the channel
attribute float aAlong;   // metres along the flow
attribute float aSlope;   // |dy/ds| of the bed (0 flat, ~1 waterfall)
attribute float aWide;    // channel half width
varying float vLat; varying float vAlong; varying float vSlope; varying float vWide;
varying vec3 vWorld;
#include <fog_pars_vertex>
void main(){
  vLat = aLat; vAlong = aAlong; vSlope = aSlope; vWide = aWide;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorld = wp.xyz;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`,dx=`
uniform float uTime;
uniform vec3 uSun;
varying float vLat; varying float vAlong; varying float vSlope; varying float vWide;
varying vec3 vWorld;
#include <fog_pars_fragment>

float h21(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(h21(i), h21(i+vec2(1,0)), f.x), mix(h21(i+vec2(0,1)), h21(i+vec2(1,1)), f.x), f.y); }
float fbm(vec2 p){ float s = 0.0, a = 0.5; for(int i=0;i<4;i++){ s += a*vn(p); p = p*2.07 + 4.3; a *= 0.5; } return s; }

vec3 skyCol(vec3 d){
  float h = clamp(d.y, 0.0, 1.0);
  vec3 horizon = vec3(0.62, 0.66, 0.70), mid = vec3(0.17, 0.33, 0.62), zen = vec3(0.045, 0.13, 0.36);
  vec3 c = mix(horizon, mid, smoothstep(0.0, 0.3, h));
  c = mix(c, zen, smoothstep(0.22, 0.95, h));
  float sd = max(dot(d, uSun), 0.0);
  c += vec3(1.0, 0.52, 0.2) * pow(sd, 6.0) * exp(-abs(d.y) * 5.5) * 0.9;
  c += vec3(1.0, 0.75, 0.45) * pow(sd, 90.0) * 1.2;
  return c;
}

void main(){
  float steep = smoothstep(0.08, 0.5, vSlope);
  float speed = 1.2 + vSlope * 9.0;
  // flow-aligned coordinates (metres)
  vec2 q = vec2(vLat * vWide * 0.9, vAlong * (0.55 - 0.25 * steep) - uTime * speed * 0.5);
  float n1 = fbm(q * vec2(1.3, 0.6));
  float n2 = fbm(q * vec2(3.1, 1.4) + 9.0);
  float n3 = vn(q * vec2(7.0, 2.5) + 31.0);
  float eps = 0.06;
  float hx = fbm((q + vec2(eps, 0.0)) * vec2(1.3, 0.6)) - n1;
  float hz = fbm((q + vec2(0.0, eps)) * vec2(1.3, 0.6)) - n1;
  vec3 N = normalize(vec3(-hx * 6.0 * (1.0 + steep * 1.5), 1.0, -hz * 6.0));
  // world normal ~ up (river is nearly level except at falls); tilt along flow for falls
  N = normalize(vec3(N.x, N.y, N.z - steep * 0.5));
  vec3 V = normalize(cameraPosition - vWorld);
  float fres = 0.025 + 0.975 * pow(1.0 - max(dot(N, V), 0.0), 5.0);
  vec3 R = reflect(-V, N);
  R.y = abs(R.y);
  vec3 refl = skyCol(normalize(R));
  // body colour: peat-stained teal, lighter over shallow edges
  float edge = smoothstep(0.35, 1.0, abs(vLat));
  vec3 deep = vec3(0.012, 0.045, 0.045);
  vec3 shallow = vec3(0.07, 0.11, 0.075);
  vec3 body = mix(deep, shallow, edge * 0.8 + n2 * 0.25);
  // subsurface-ish glow on ripples facing the sun
  body += vec3(0.02, 0.05, 0.04) * smoothstep(0.5, 0.9, n1) * 0.7;
  vec3 col = mix(body, refl, clamp(fres + 0.06, 0.0, 1.0));
  // sun glints
  vec3 H = normalize(uSun + V);
  float spec = pow(max(dot(N, H), 0.0), 380.0);
  col += vec3(1.0, 0.82, 0.55) * spec * 4.0 * (1.0 - steep * 0.5);
  // foam: channel edges, rapids and falls
  float foamEdge = smoothstep(0.84, 1.0, abs(vLat) + (n2 - 0.5) * 0.45) * 0.3;
  float streak = smoothstep(0.42, 0.78, fbm(vec2(vLat * vWide * 2.2, vAlong * 0.12 - uTime * speed * 0.18)) + n3 * 0.25);
  float foam = clamp(foamEdge + steep * (0.45 + streak * 0.7) + smoothstep(0.03, 0.12, vSlope) * streak * 0.45, 0.0, 1.0);
  col = mix(col, vec3(0.88, 0.92, 0.95), foam * 0.88);
  float alpha = (1.0 - smoothstep(0.82, 1.0, abs(vLat))) * mix(0.92, 1.0, foam);
  gl_FragColor = vec4(col, alpha);
  #include <fog_fragment>
}`;class fx{constructor(t){this.land=t,this.material=new Be({vertexShader:ux,fragmentShader:dx,uniforms:Hs.merge([Mt.fog,{uTime:es.uTime,uSun:{value:en.clone()}}]),transparent:!0,depthWrite:!1,fog:!0,side:Xe}),this.material.uniforms.uTime=es.uTime;const e=t.river.filter(x=>x.z>-356&&x.z<1500),n=e.length,i=[],r=[],o=[],a=[],c=[],l=[];let u=0;const h=new A;for(let x=0;x<n;x++){const _=e[Math.max(0,x-1)],y=e[Math.min(n-1,x+1)];h.set(y.x-_.x,0,y.z-_.z).normalize();const w=-h.z,S=h.x;x>0&&(u+=Math.hypot(e[x].x-e[x-1].x,e[x].z-e[x-1].z));const T=(y.y-_.y)/Math.max(.01,Math.hypot(y.x-_.x,y.z-_.z)),C=Math.abs(T);for(const b of[-1,1]){const M=e[x].w*(1+.25*Math.min(1,C*4))+.4,E=e[x].x+w*M*b,D=e[x].z+S*M*b;i.push(E,e[x].y,D),r.push(b),o.push(u),a.push(C),c.push(M)}if(x<n-1){const b=x*2;l.push(b,b+1,b+2,b+1,b+3,b+2)}}const p=new me;p.setAttribute("position",new Gt(i,3)),p.setAttribute("aLat",new Gt(r,1)),p.setAttribute("aAlong",new Gt(o,1)),p.setAttribute("aSlope",new Gt(a,1)),p.setAttribute("aWide",new Gt(c,1)),p.setIndex(l),p.computeBoundingSphere();const d=new ue(p,this.material);d.renderOrder=2,d.frustumCulled=!1,this.group.add(d);const m=x=>e.reduce((_,y)=>Math.abs(y.z-x)<Math.abs(_.z-x)?y:_),v=m(-318),g=m(-350),f=m(-139);this.fallsBase.set(v.x,v.y+.3,v.z),this.fallsTop.set(g.x,g.y,g.z),this.rapids.set(f.x,f.y,f.z)}land;group=new Ne;material;fallsBase=new A;fallsTop=new A;rapids=new A}class Vn{pos=[];col=[];nor=[];tri(t,e,n,i,r,o,a,c,l){const u=new A().subVectors(e,t).cross(new A().subVectors(n,t)).normalize();for(const[h,p,d]of[[t,i,a],[e,r,c],[n,o,l]]){this.pos.push(h.x,h.y,h.z),this.col.push(p.r,p.g,p.b);const m=d??u;this.nor.push(m.x,m.y,m.z)}}geo(t,e,n){const i=t.index?t.toNonIndexed():t,r=i.attributes.position,o=i.attributes.normal,a=new ne().getNormalMatrix(e),c=new A,l=new A;for(let u=0;u<r.count;u++){c.fromBufferAttribute(r,u).applyMatrix4(e),l.fromBufferAttribute(o,u).applyMatrix3(a).normalize();const h=n(c,l);this.pos.push(c.x,c.y,c.z),this.col.push(h.r,h.g,h.b),this.nor.push(l.x,l.y,l.z)}}build(){const t=new me;return t.setAttribute("position",new Gt(this.pos,3)),t.setAttribute("color",new Gt(this.col,3)),t.setAttribute("normal",new Gt(this.nor,3)),t.computeBoundingSphere(),t.computeBoundingBox(),t}}const pt=(s=0,t=0,e=0)=>new A(s,t,e),Pe=(s,t,e)=>new lt().setRGB(s,t,e,ae),xn=(s,t,e)=>s.clone().lerp(t,e);function px(s,t){const e=new He(t),n=new Vn,i=Pe(.2,.12,.07),r=Pe(.12,.08,.05),o=new hn(.03,.2,s.height*.98,7,4);o.translate(0,s.height*.49,0),n.geo(o,new Et,m=>xn(i,r,Math.min(1,m.y/s.height)));const a=pt(),c=pt(),l=pt(),u=pt();for(let m=0;m<s.tiers;m++){const v=m/(s.tiers-1),g=s.clear+(s.height-s.clear)*(1-Math.pow(v,1.08))-.05,f=s.radius*Math.pow(1-v,s.taper)*e.range(.9,1.1)+.12,x=Math.round(s.blades[0]+(s.blades[1]-s.blades[0])*v),_=e.range(0,Math.PI*2);for(let y=0;y<x;y++){const w=_+(y+e.range(-.25,.25))*Math.PI*2/x,S=f*e.range(.78,1.18),T=s.droop*(1-.35*v)*e.range(.8,1.2),C=pt(Math.cos(w),0,Math.sin(w)),b=pt(C.x*S,g-T*S+.1,C.z*S),M=pt(C.x*.08,g+.04,C.z*.08),E=pt(-C.z,0,C.x),D=S*e.range(.13,.21)*(1+s.jag),N=M.clone().lerp(b,.5).add(pt(0,.12*S,0));a.copy(N).addScaledVector(E,D),c.copy(N).addScaledVector(E,-D);const I=.7+.5*v+e.range(-.1,.1),F=s.dark.clone().multiplyScalar(I*.8),z=xn(s.dark,s.light,.45+.5*v+e.range(-.1,.15)).multiplyScalar(I),X=k=>pt(k.x,k.y-(g-.4)*0+(s.height*.45-k.y)*-0,k.z).normalize().multiplyScalar(.6).add(pt(0,.8,0)).normalize();n.tri(M,a,b,F,z,z,pt(0,1,0).add(C).normalize(),X(a),X(b)),n.tri(M,b,c,F,z,z,pt(0,1,0).add(C).normalize(),X(b),X(c)),l.copy(N).add(pt(0,D*.9,0)),u.copy(N).add(pt(0,-D*.5,0)),n.tri(M,l,b,F,z,z,pt(0,1,0),C,C),n.tri(M,b,u,F,z,z,pt(0,1,0),C,C)}}const h=new Vn,p=new hn(.05,.2,s.height*.5,5,1);p.translate(0,s.height*.25,0),h.geo(p,new Et,()=>i);const d=4;for(let m=0;m<d;m++){const v=m/(d-1),g=s.clear+(s.height-s.clear)*(1-v)*.82-.2,f=(s.height-s.clear)*.45,x=s.radius*(1-v*.78)*.95+.15,_=new $o(x,f,7,1,!0);_.translate(0,g+f*.35,0);const y=xn(s.dark,s.light,.25+.5*v).multiplyScalar(.9+.2*v);h.geo(_,new Et,()=>y)}return{hi:n.build(),lo:h.build()}}function mx(s){const t=new He(s),e=new Vn,n=new Vn,i=t.range(10,13.5),r=Pe(.21,.15,.11),o=Pe(.38,.2,.1),a=pt(t.range(-.5,.5),0,t.range(-.5,.5)),c=[];for(let g=0;g<=5;g++){const f=g/5;c.push(pt(a.x*f*f*1.2+Math.sin(f*3+s)*.12,i*f,a.z*f*f*1.2))}const l=new is(c),u=(g,f,x,_,y,w,S,T)=>{const C=new Nr(g,_,1,y,!1),b=C.attributes.position,M=pt(),E=C.attributes.normal,D=_+1;for(let N=0;N<b.count;N++){const F=Math.floor(N/(y+1))/(D-1),z=g.getPointAt(Math.min(1,F));M.fromBufferAttribute(b,N).sub(z);const X=pt().fromBufferAttribute(E,N),k=f+(x-f)*F;b.setXYZ(N,z.x+X.x*k,z.y+X.y*k,z.z+X.z*k)}w.geo(C,new Et,N=>xn(S,T,Math.max(0,Math.min(1,N.y/i))))};u(l,.2,.07,14,7,e,r,o),u(l,.2,.07,6,5,n,r,o);const h=l.getPointAt(1),p=Pe(.055,.13,.07),d=Pe(.1,.2,.09),m=[{p:h.clone().add(pt(0,.4,0)),r:t.range(1.7,2.3)}],v=t.int(3,5);for(let g=0;g<v;g++){const f=g/v*Math.PI*2+t.range(-.4,.4),x=i*t.range(.62,.9),_=l.getPointAt(x/i),y=t.range(1.7,3),w=_.clone().add(pt(Math.cos(f)*y,t.range(.1,.9),Math.sin(f)*y)),S=new is([_,_.clone().lerp(w,.5).add(pt(0,.25,0)),w]);u(S,.07,.025,4,5,e,o,o),m.push({p:w.clone().add(pt(0,.3,0)),r:t.range(1.2,1.9)})}for(const g of m){const f=new Mn(1,1),x=f.attributes.position,_=pt();for(let S=0;S<x.count;S++){_.fromBufferAttribute(x,S);const T=1+.28*Ht.n3(_.x*2+s,_.y*2,_.z*2);x.setXYZ(S,_.x*T,_.y*T*.5,_.z*T)}f.computeVertexNormals();const y=new Et().compose(g.p,new xe,pt(g.r,g.r,g.r)),w=(S,T)=>{const C=Math.max(0,Math.min(1,(S.y-g.p.y)/(g.r*.55)*.5+.5));return xn(p,d,C*.9+t.range(-.08,.08))};e.geo(f,y,w);for(let S=0;S<5;S++){const T=t.range(0,Math.PI*2),C=g.p.clone().add(pt(Math.cos(T)*g.r*.8,t.range(-.1,.25)*g.r,Math.sin(T)*g.r*.8)),b=g.r*t.range(.28,.45);e.geo(new Mn(1,0),new Et().compose(C,new xe,pt(b,b*.6,b)),w)}n.geo(new Mn(1,0),y,w)}return{hi:e.build(),lo:n.build()}}function gx(s,t){const e=new He(t),n=new Vn,i=new Vn,r=[],o=(m,v,g,f,x)=>{const _=[m,x??m.clone().lerp(v,.5).add(pt(e.range(-.15,.15),.1,e.range(-.15,.15))),v],y=new is(_),w=new Nr(y,5,1,6,!1),S=w.attributes.position,T=w.attributes.normal;for(let C=0;C<S.count;C++){const M=Math.floor(C/7)/5,E=y.getPointAt(Math.min(1,M)),D=g+(f-g)*M,N=pt().fromBufferAttribute(T,C);S.setXYZ(C,E.x+N.x*D,E.y+N.y*D,E.z+N.z*D)}n.geo(w,new Et,C=>Ht.n3(C.x*9,C.y*3.5+t,C.z*9)>.28?s.barkMark:s.bark)},a=pt((e.next()-.5)*(s.trunkLean??.5),s.trunkH,(e.next()-.5)*(s.trunkLean??.5));o(pt(0,-.1,0),a,s.trunkR,s.trunkR*.55,pt(a.x*.3,s.trunkH*.5,a.z*.3));const c=(m,v,g,f,x)=>{const _=m.clone().addScaledVector(v,g);if(o(m,_,f,f*.55),x>=s.levels){r.push({p:_.clone().add(pt(0,s.blobR*.25,0)),r:s.blobR*e.range(.85,1.25)});return}const y=x===0?e.int(4,6):e.int(2,3);for(let w=0;w<y;w++){const S=w/y*Math.PI*2+e.range(-.5,.5),T=e.range(.35,.9)-s.droop*x*.25,C=pt(Math.cos(S)*(1-T*.5),T,Math.sin(S)*(1-T*.5)).normalize();c(_,C,g*e.range(.6,.85),f*.55,x+1)}x>=1&&r.push({p:_.clone().lerp(m,.3).add(pt(0,s.blobR*.3,0)),r:s.blobR*.8})};c(a.clone().add(pt(0,-s.trunkH*.12,0)),pt(0,1,0),s.spread*.6,s.trunkR*.55,0);for(const m of r){const v=new Mn(1,2),g=v.attributes.position,f=pt(),x=e.range(0,99);for(let w=0;w<g.count;w++){f.fromBufferAttribute(g,w);const S=1+.42*Ht.n3(f.x*2.4+x,f.y*2.4,f.z*2.4);g.setXYZ(w,f.x*S,f.y*S*.82,f.z*S)}v.computeVertexNormals();const _=new Et().compose(m.p,new xe().setFromEuler(new Ye(e.range(0,3),e.range(0,3),0)),pt(m.r,m.r,m.r)),y=e.range(0,1);if(n.geo(v,_,(w,S)=>{const T=Math.max(0,Math.min(1,S.y*.5+.5)),C=xn(s.leaf,s.leaf2,y*.7+T*.45);return C.multiplyScalar(.55+.6*T),C}),s.berries)for(let w=0;w<4;w++){const S=m.p.clone().add(pt(e.range(-1,1),e.range(-.1,.8),e.range(-1,1)).normalize().multiplyScalar(m.r*.95));n.geo(new Mn(.16,0),new Et().makeTranslation(S.x,S.y,S.z),()=>Pe(.72,.1,.06))}}const l=new hn(s.trunkR*.6,s.trunkR,s.trunkH,5,1);l.translate(0,s.trunkH/2,0),i.geo(l,new Et,()=>s.bark);const u=new Mn(1,1),h=u.attributes.position,p=pt();for(let m=0;m<h.count;m++){p.fromBufferAttribute(h,m);const v=1+.25*Ht.n3(p.x*2+t,p.y*2,p.z*2);h.setXYZ(m,p.x*v,p.y*v*.85,p.z*v)}u.computeVertexNormals();const d=s.spread*.95+s.blobR*.4;return i.geo(u,new Et().compose(pt(0,s.trunkH+d*.55,0),new xe,pt(d,d*.8,d)),(m,v)=>xn(s.leaf,s.leaf2,.4+v.y*.3).multiplyScalar(.7+.4*(v.y*.5+.5))),{hi:n.build(),lo:i.build()}}function vx(s){const t=new He(s),e=new Vn,n=4;for(let i=0;i<n;i++){const r=new Mn(1,1),o=r.attributes.position,a=pt();for(let u=0;u<o.count;u++){a.fromBufferAttribute(o,u);const h=1+.35*Ht.n3(a.x*3+s+i,a.y*3,a.z*3);o.setXYZ(u,a.x*h,Math.max(a.y,-.15)*h*.75,a.z*h)}r.computeVertexNormals();const c=t.range(.28,.5),l=new Et().compose(pt(t.range(-.3,.3),.1,t.range(-.3,.3)),new xe,pt(c,c*.9,c));e.geo(r,l,(u,h)=>(Ht.n3(u.x*18,u.y*18,u.z*18)>.1?Pe(.46,.2,.36):Pe(.17,.15,.08)).multiplyScalar(.55+.6*(h.y*.5+.5)))}return e.build()}function _x(s){const t=new He(s),e=new Vn;for(let n=0;n<5;n++){const i=new Mn(1,1),r=i.attributes.position,o=pt();for(let l=0;l<r.count;l++){o.fromBufferAttribute(r,l);const u=1+.5*Ht.n3(o.x*3+s+n,o.y*3,o.z*3);r.setXYZ(l,o.x*u,Math.max(o.y,-.2)*u*.9,o.z*u)}i.computeVertexNormals();const a=t.range(.4,.7),c=pt(t.range(-.4,.4),.15,t.range(-.4,.4));e.geo(i,new Et().compose(c,new xe,pt(a,a,a)),(l,u)=>(Ht.n3(l.x*41,l.y*41,l.z*41)>.22?Pe(.86,.64,.07):Pe(.12,.22,.07)).multiplyScalar(.7+.5*(u.y*.5+.5)))}return e.build()}function xx(s){const t=new He(s),e=new Vn,n=7,i=Pe(.15,.3,.07),r=Pe(.36,.44,.1),o=Pe(.58,.38,.12),a=t.range(0,1);for(let c=0;c<n;c++){const l=c/n*Math.PI*2+t.range(-.3,.3),u=t.range(.7,1.15),h=t.range(.7,1.2),p=6;let d=null;for(let m=0;m<=p;m++){const v=m/p,g=u*v*.85,f=Math.sin(v*1.9)*h*.55-v*v*.1,x=pt(Math.cos(l)*g,f,Math.sin(l)*g),_=.22*Math.sin(Math.min(1,v*1.08+.12)*Math.PI)*u*(1-v*.2)+.01,y=pt(-Math.sin(l),0,Math.cos(l)),w=x.clone().addScaledVector(y,_).add(pt(0,-.04*(1-v),0)),S=x.clone().addScaledVector(y,-_).add(pt(0,-.04*(1-v),0));if(d){const T=xn(i,xn(r,o,a),v*.9),C=xn(i,xn(r,o,a),Math.min(1,v*.9+.1));e.tri(d[0],d[1],w,T,T,C,pt(0,1,0),pt(0,1,0),pt(0,1,0)),e.tri(d[1],S,w,T,C,C,pt(0,1,0),pt(0,1,0),pt(0,1,0))}d=[w,S]}}return e.build()}function yx(s){const t=new He(s),e=new Vn,n=Pe(.1,.17,.04),i=Pe(.46,.52,.17),r=7;for(let o=0;o<r;o++){const a=t.range(0,Math.PI*2),c=t.range(0,.12),l=t.range(.28,.62),u=t.range(.06,.32),h=t.range(.016,.03),p=pt(Math.cos(a),0,Math.sin(a)),d=pt(-p.z,0,p.x),m=3;let v=null,g=null,f=null;for(let x=0;x<=m;x++){const _=x/m,y=pt(p.x*(c+u*_*_*l),l*_,p.z*(c+u*_*_*l)),w=h*(1-_*.92),S=y.clone().addScaledVector(d,w),T=y.clone().addScaledVector(d,-w),C=xn(n,i,Math.pow(_,.85)*t.range(.85,1.1));v&&g&&f&&(e.tri(v,g,S,f,f,C,pt(0,1,0),pt(0,1,0),pt(0,1,0)),e.tri(g,T,S,f,C,C,pt(0,1,0),pt(0,1,0),pt(0,1,0))),v=S,g=T,f=C}}return e.build()}function Mx(s){const t=new He(s),e=new Vn,n=Pe(.1,.25,.06),i=Pe(1,1,1),r=Pe(.95,.75,.2),o=t.range(.22,.4),a=pt(.008,0,0),c=pt(-.008,0,0),l=pt(0,o,0);e.tri(a,l,c,n,n,n,pt(0,0,1),pt(0,0,1),pt(0,0,1));const u=pt(0,o,0),h=6;for(let p=0;p<h;p++){const d=p/h*Math.PI*2,m=(p+1)/h*Math.PI*2,v=(d+m)/2,g=.07,f=pt(Math.cos(d)*g*.5,o+.01,Math.sin(d)*g*.5),x=pt(Math.cos(v)*g,o-.005,Math.sin(v)*g),_=pt(Math.cos(m)*g*.5,o+.01,Math.sin(m)*g*.5);e.tri(u,f,x,r,i,i,pt(0,1,0),pt(0,1,0),pt(0,1,0)),e.tri(u,x,_,r,i,i,pt(0,1,0),pt(0,1,0),pt(0,1,0))}return e.build()}function Bh(s,t=.7,e=3){const n=new He(s),i=new Mn(1,e),r=i.attributes.position,o=pt(),a=n.range(.8,1.3),c=n.range(.8,1.3),l=[],u=Pe(.52,.48,.42),h=Pe(.22,.21,.22),p=Pe(.16,.27,.08),d=Pe(.62,.54,.26),m=Pe(.55,.4,.3);for(let f=0;f<r.count;f++){o.fromBufferAttribute(r,f);const x=Ht.n3(o.x*1.3+s,o.y*1.3,o.z*1.3),_=Ht.ridged2(o.x*2.4+s,o.z*2.4+o.y*2,3);let y=1+.22*x+.14*(_-.5);y=Math.round(y*9)/9*.65+y*.35,r.setXYZ(f,o.x*y*a,Math.max(o.y*y*t,-.45*t),o.z*y*c)}i.computeVertexNormals();const v=i.attributes.normal,g=pt();for(let f=0;f<r.count;f++){o.fromBufferAttribute(r,f),g.fromBufferAttribute(v,f);const x=Math.sin(o.y*7+Ht.n3(o.x*2,o.y,o.z*2)*3)*.5+.5,_=xn(u,h,x*.55+(Ht.n3(o.x*5,o.y*5,o.z*5)*.5+.5)*.4);_.lerp(m,Math.max(0,Ht.n3(o.x*2+9,o.y*2,o.z*2))*.5);const y=Math.max(0,g.y-.45)*1.8*(.5+.5*Ht.n3(o.x*3+7,o.y*3,o.z*3));_.lerp(p,Math.min(1,y)),Ht.n3(o.x*6+3,o.y*6,o.z*6)>.4&&_.lerp(d,.4),l.push(_.r,_.g,_.b)}return i.setAttribute("color",new Gt(l,3)),i.deleteAttribute("uv"),i.computeBoundingSphere(),i}const oe=(s,t,e)=>new lt().setRGB(s,t,e,ae),As=150;class bx{constructor(t,e,n){this.land=t,this.track=e,this.q=n,this.group.name="vegetation",this.makeVariants(),this.place(),this.finalize(),this.buildContactAO(),this.colliders.forEach((i,r)=>{const o=Math.floor(i.x/16)*4096+Math.floor(i.z/16);let a=this.hash.get(o);a||this.hash.set(o,a=[]),a.push(r)})}land;track;group=new Ne;variants=new Map;buckets=new Map;cells=[];frame=0;batches=[];batchBuckets=new Map;ao=[];colliders=[];hash=new Map;stats={trees:0,shrubs:0,grass:0,flowers:0,rocks:0};q;pushOut(t,e=1.2){let n=!1;const i=Math.floor(t.x/16),r=Math.floor(t.z/16);for(let o=-1;o<=1;o++)for(let a=-1;a<=1;a++){const c=this.hash.get((i+o)*4096+(r+a));if(c)for(const l of c){const u=this.colliders[l],h=(t.y-u.y)/u.sy,p=u.c;if(h<-.5||h>p.y1+.8)continue;let d;if(p.kind==="cone")h<p.y0*.6?d=.35:d=p.r*Math.max(.12,1-Math.max(0,h-p.y0)/Math.max(.1,p.y1-p.y0));else{const x=(p.y0+p.y1)/2,_=(p.y1-p.y0)/2+.3,y=(h-x)/_;d=y*y>=1?h<p.y0?.4:0:p.r*Math.sqrt(1-y*y)}if(d<=0)continue;const m=d*u.sx+e,v=t.x-u.x,g=t.z-u.z,f=Math.hypot(v,g);if(f<m){const x=f>.001?v/f:1,_=f>.001?g/f:0;t.x=u.x+x*(m+.05),t.z=u.z+_*(m+.05),n=!0}}}return n}makeVariants(){const t=this.q.msaa>0,e=this.q.veg.distScale,n=(h,p)=>Ke(new _e({vertexColors:!0,roughness:.82,metalness:0,side:Xe,alphaToCoverage:p<=1&&this.q.msaa>0}),{key:h,vertDecl:`const float heSwayAmp = ${p.toFixed(2)};`,vertMain:q_,fragColor:`
          float hv = heVNoise(vWPos * 1.6 + vRand * 20.0);
          diffuseColor.rgb *= 0.82 + 0.36 * hv;
          ${p>1?"":`
          // leafy, ragged silhouettes: noise-driven cut-outs that grow towards the edges of each clump
          float leaf = step(vColor.r * 1.04, vColor.g);
          if (leaf > 0.5 && length(vViewPosition) < 420.0) {
            vec3 nn = normalize(vNormal);
            float facing = abs(dot(nn, normalize(vViewPosition)));
            float cn = heVNoise(vOPos * 10.0 + vRand * 11.0) * 0.6 + heVNoise(vOPos * 27.0 + 3.0) * 0.4;
            float cut = 0.22 + 0.5 * (1.0 - facing);
            diffuseColor.a = smoothstep(cut - 0.05, cut + 0.05, cn);
            if (diffuseColor.a < ${t?"0.02":"0.5"}) discard;
            diffuseColor.rgb *= 0.7 + 0.45 * heVNoise(vOPos * 16.0);
          }`}
        `,fragEmissive:`
          vec3 Vv = normalize(cameraPosition - vWPos);
          float back = pow(clamp(dot(-Vv, uSunDir), 0.0, 1.0), 2.5);
          totalEmissiveRadiance += diffuseColor.rgb * back * 0.55;
        `}),i=n("tree",.5),r=n("shrub",1.1),o=n("grass",2.2),a=n("flower",2),c=Ke(new _e({vertexColors:!0,roughness:.92,metalness:0}),{key:"rock",fragColor:`
        float rn = heFbm(vWPos * 2.2 + vRand * 9.0);
        float rg = heVNoise(vWPos * 18.0);
        diffuseColor.rgb *= 0.7 + 0.55 * rn;
        diffuseColor.rgb *= 0.9 + 0.2 * rg;
      `,fragNormal:`
        float hb = heFbm(vWPos * 6.0 + vRand * 5.0) * 0.8 + heVNoise(vWPos * 24.0) * 0.25;
        float bf = 1.0 - smoothstep(14.0, 70.0, length(vViewPosition));
        normal = hePerturb(-vViewPosition, normal, vec2(dFdx(hb), dFdy(hb)) * (0.5 * bf), faceDirection);
      `});[{height:11,clear:1.4,tiers:16,radius:2.2,droop:.42,blades:[22,10],dark:oe(.035,.1,.05),light:oe(.09,.22,.09),taper:.9,jag:0},{height:8.6,clear:1,tiers:13,radius:1.9,droop:.62,blades:[20,9],dark:oe(.04,.115,.055),light:oe(.11,.25,.1),taper:.85,jag:.1},{height:14,clear:2,tiers:19,radius:1.7,droop:.3,blades:[18,8],dark:oe(.03,.085,.045),light:oe(.07,.19,.09),taper:1,jag:0},{height:10,clear:1.6,tiers:14,radius:1.8,droop:.7,blades:[16,8],dark:oe(.09,.19,.07),light:oe(.22,.36,.12),taper:.9,jag:.2}].forEach((h,p)=>{const d=px(h,100+p*13);this.variants.set(`pine${p}`,{hi:d.hi,lo:d.lo,mat:i,hiDist:105*e,maxDist:1900,shadow:!0,batch:"trees",aoR:h.radius*.95,crown:{kind:"cone",r:h.radius,y0:h.clear,y1:h.height}})});for(let h=0;h<3;h++){const p=mx(300+h*7);this.variants.set(`scots${h}`,{hi:p.hi,lo:p.lo,mat:i,hiDist:105*e,maxDist:1700,shadow:!0,batch:"trees",aoR:1.7,crown:{kind:"ball",r:2.6,y0:6,y1:13.5}})}const u=[{key:"birch0",spec:{trunkH:4.6,trunkR:.11,spread:3.2,levels:2,blobR:1.15,bark:oe(.78,.76,.7),barkMark:oe(.07,.06,.05),leaf:oe(.26,.38,.1),leaf2:oe(.42,.5,.15),droop:.5}},{key:"birch1",spec:{trunkH:5.6,trunkR:.12,spread:3.6,levels:2,blobR:1.25,bark:oe(.8,.78,.72),barkMark:oe(.08,.07,.06),leaf:oe(.22,.34,.08),leaf2:oe(.38,.47,.12),droop:.7}},{key:"oak0",spec:{trunkH:2.6,trunkR:.3,spread:5.2,levels:2,blobR:2,bark:oe(.17,.12,.08),barkMark:oe(.08,.06,.04),leaf:oe(.1,.24,.06),leaf2:oe(.25,.38,.08),droop:.1}},{key:"oak1",spec:{trunkH:3.4,trunkR:.34,spread:6.2,levels:2,blobR:2.3,bark:oe(.19,.13,.09),barkMark:oe(.09,.07,.05),leaf:oe(.12,.26,.06),leaf2:oe(.34,.4,.08),droop:.2}},{key:"rowan0",spec:{trunkH:3.4,trunkR:.14,spread:3.2,levels:2,blobR:1.2,bark:oe(.3,.25,.22),barkMark:oe(.15,.12,.1),leaf:oe(.15,.3,.08),leaf2:oe(.32,.44,.12),droop:.3,berries:!0}}];for(const h of u){const p=gx(h.spec,500+h.key.charCodeAt(0)*3+h.key.charCodeAt(h.key.length-1));this.variants.set(h.key,{hi:p.hi,lo:p.lo,mat:i,hiDist:75*e,maxDist:900,shadow:!0,batch:"trees",aoR:h.spec.spread*.7+h.spec.blobR*.5,crown:{kind:"ball",r:h.spec.spread*.85+h.spec.blobR*.7,y0:h.spec.trunkH*.9,y1:h.spec.trunkH+h.spec.spread*1.3+h.spec.blobR}})}for(let h=0;h<3;h++)this.variants.set(`heather${h}`,{hi:vx(700+h),mat:r,hiDist:1e9,maxDist:320*e,shadow:!1});for(let h=0;h<2;h++)this.variants.set(`gorse${h}`,{hi:_x(800+h),mat:r,hiDist:1e9,maxDist:420*e,shadow:!1});for(let h=0;h<3;h++)this.variants.set(`bracken${h}`,{hi:xx(900+h),mat:r,hiDist:1e9,maxDist:300*e,shadow:!1});for(let h=0;h<2;h++)this.variants.set(`grass${h}`,{hi:yx(1e3+h),mat:o,hiDist:1e9,maxDist:115*e,shadow:!1});for(let h=0;h<2;h++)this.variants.set(`flower${h}`,{hi:Mx(1100+h),mat:a,hiDist:1e9,maxDist:95*e,shadow:!1});for(let h=0;h<8;h++)this.variants.set(`rock${h}`,{hi:Bh(1200+h*5,.5+h%3*.18,h<4?2:3),lo:Bh(1200+h*5,.5+h%3*.18,1),mat:c,hiDist:(h<4?70:220)*e,maxDist:(h<4?520:1600)*e,shadow:!0,batch:"rocks",aoR:1.25})}inViaductClearing(t,e,n=0){const i=t-$t.cx,r=e-$t.cz,o=Math.hypot(i,r),a=Math.atan2(i,r)*$t.radius;return Math.abs(a)<$t.halfLen+28+n&&o-$t.radius>-14-n&&o-$t.radius<92+n}add(t,e,n,i,r,o,a,c){const l=new Et,u=new xe().setFromEuler(new Ye(c?.[0]??0,n,c?.[1]??0,"YXZ"));l.compose(e,u,new A(i,r,o));const h=this.variants.get(t);if(h.batch){let v=this.batchBuckets.get(h.batch);v||this.batchBuckets.set(h.batch,v=[]),v.push({key:t,m:l,c:a??new lt(1,1,1),x:e.x,y:e.y,z:e.z,hiDist:h.hiDist,hiId:-1,loId:-1}),h.crown&&this.colliders.push({x:e.x,y:e.y,z:e.z,sx:i,sy:r,c:h.crown}),h.aoR&&this.ao.push({x:e.x,y:e.y,z:e.z,r:h.aoR*Math.max(i,o),op:t.startsWith("rock")?.5:.55});return}const p=`${Math.floor(e.x/As)},${Math.floor(e.z/As)}`;let d=this.buckets.get(p);d||this.buckets.set(p,d=new Map);let m=d.get(t);m||d.set(t,m=[]),m.push({m:l,c:a})}place(){const t=this.land,e=new He(2025),n=new A,i=[oe(.9,1,.7),oe(1,1,.8),oe(.8,.95,.65),oe(1.1,1,.7),oe(.95,.85,.6)],r=-560,o=560,a=-700,c=860,l=this.q.veg.pine;for(let C=a;C<c;C+=l)for(let b=r;b<o;b+=l){const M=l*.42,E=b+e.range(-M,M),D=C+e.range(-M,M),N=t.fastHeight(E,D),I=t.fastSlope(E,D),F=Qi(E,D,N,I);if(F<.05||e.next()>F*.8||!t.isFree(E,D,22,9)||this.inViaductClearing(E,D)||Ht.n2(E*.08,D*.08)>.55)continue;n.set(E,t.height(E,D),D);const z=e.next(),X=e.range(.7,1.35)*(.8+.3*Ot(0,40,100-Math.abs(N-50))),k=z<.7?`pine${e.int(0,2)}`:z<.84?"pine3":`scots${e.int(0,2)}`,K=k.startsWith("scots")?e.range(.8,1.2):X;this.add(k,n,e.range(0,6.28),K*e.range(.9,1.1),K,K*e.range(.9,1.1),void 0,[e.range(-.04,.04),e.range(-.04,.04)]),this.stats.trees++}const u=this.q.veg.broad;for(let C=-520;C<760;C+=u)for(let b=-420;b<420;b+=u){const M=b+e.range(-u*.43,u*.43),E=C+e.range(-u*.43,u*.43),D=t.fastHeight(M,E),N=t.fastSlope(M,E);let I=Wu(M,E,D,N);const F=t.riverDist(M,E);if(I+=.7*Ot(40,12,F)*(1-Ot(.4,.7,N)),I=Math.min(1,I),I<.1||e.next()>I*.55||Qi(M,E,D,N)>.5&&e.chance(.7)||!t.isFree(M,E,16,5.5)||this.inViaductClearing(M,E,-20)&&F>14)continue;n.set(M,t.height(M,E),E);const X=F<30?e.chance(.6)?`birch${e.int(0,1)}`:"rowan0":e.chance(.4)?`oak${e.int(0,1)}`:e.chance(.5)?`birch${e.int(0,1)}`:"rowan0",k=e.range(.6,1);this.add(X,n,e.range(0,6.28),k,k*e.range(.9,1.1),k),this.stats.trees++}const h=-380,p=380,d=-560,m=560,v=this.q.veg.shrub;for(let C=d;C<m;C+=v)for(let b=h;b<p;b+=v){const M=b+e.range(-v*.47,v*.47),E=C+e.range(-v*.47,v*.47),D=t.fastHeight(M,E),N=t.fastSlope(M,E);if(N>1||!t.isFree(M,E,4.5,3)||Qi(M,E,D,N)>.35&&e.chance(.75))continue;const F=Xu(M,E,D),z=qu(M,E,D),X=Ot(.55,.8,Ht.fbm2(M*.03+71,E*.03-9,2)*.5+.5),k=e.next();let K=null;if(k<F*.55?K=`heather${e.int(0,2)}`:k<F*.55+z*.5?K=`bracken${e.int(0,2)}`:k<F*.55+z*.5+X*.35?K=`gorse${e.int(0,1)}`:k<.06&&N<.6&&(K=`bracken${e.int(0,2)}`),!K)continue;n.set(M,t.height(M,E)-.05,E);const rt=e.range(.7,1.7);this.add(K,n,e.range(0,6.28),rt,rt*e.range(.7,1.2),rt,K.startsWith("heather")?oe(1+e.range(-.1,.2),.95,1+e.range(-.2,.1)):void 0),this.stats.shrubs++}const g=-340,f=340,x=-540,_=400,y=this.q.veg.grass;for(let C=x;C<_;C+=y)for(let b=g;b<f;b+=y){const M=b+e.range(-y*.48,y*.48),E=C+e.range(-y*.48,y*.48);if(this.land.trackDistance(M,E)<2.9)continue;const D=t.fastSlope(M,E);if(D>.85||t.riverDist(M,E)<3.5)continue;const I=t.fastHeight(M,E),F=Qi(M,E,I,D),z=(.35+.65*(1-Ot(60,140,I)))*(1-.7*F)*(.5+.5*(Ht.n2(M*.05,E*.05)*.5+.5)),k=this.land.trackDistance(M,E)<9?1.2:1;if(e.next()>z*k*.75)continue;n.set(M,t.fastHeight(M,E)-.02,E);const K=e.range(.55,1.15);this.add(`grass${e.int(0,1)}`,n,e.range(0,6.28),K,K*e.range(.8,1.5),K,e.pick(i)),this.stats.grass++}const w=[oe(.52,.3,.72),oe(.98,.82,.12),oe(.96,.96,.92),oe(.3,.4,.85),oe(.82,.48,.66),oe(.95,.6,.15)];for(let C=0;C<this.q.veg.flowerClusters;C++){const b=e.range(-300,300),M=e.range(-520,380),E=t.fastHeight(b,M);if(t.fastSlope(b,M)>.7||E>100||!t.isFree(b,M,5,3))continue;const D=w[Math.floor(e.next()*w.length)],N=e.int(10,28),I=e.range(2,6);for(let F=0;F<N;F++){const z=e.range(0,6.28),X=Math.sqrt(e.next())*I,k=b+Math.cos(z)*X,K=M+Math.sin(z)*X;if(!t.isFree(k,K,3.5,2.5))continue;n.set(k,t.fastHeight(k,K),K);const rt=e.range(.55,1),Z=D.clone().multiplyScalar(e.range(.85,1.15));this.add(`flower${e.int(0,1)}`,n,e.range(0,6.28),rt,rt,rt,Z),this.stats.flowers++}}const S=(C,b,M,E=.25)=>{n.set(C,t.height(C,b),b);const D=M?e.range(2,4.8):e.range(.35,1.5),N=`rock${M?e.int(4,7):e.int(0,3)}`;n.y-=D*E,this.add(N,n,e.range(0,6.28),D*e.range(.8,1.4),D*e.range(.6,1.1),D*e.range(.8,1.4),oe(1,1,1).multiplyScalar(e.range(.8,1.15)),[e.range(-.25,.25),e.range(-.25,.25)]),this.stats.rocks++},T=this.q.veg.rock;for(let C=-560;C<800;C+=T)for(let b=-420;b<420;b+=T){const M=b+e.range(-T*.44,T*.44),E=C+e.range(-T*.44,T*.44),D=t.fastSlope(M,E),N=t.riverDist(M,E),I=.25+1.3*Ot(.35,.8,Ht.n2(M*.022+5,E*.022-3)*.5+.5);let F=Ot(.42,.95,D)*.75*I+(N<14?.2:0)+Ht.n2(M*.02,E*.02)*.02;F<.02||e.next()>F||t.trackDistance(M,E)<4.5&&D<.6||t.isFree(M,E,3.2,N<14?1.6:4)&&S(M,E,D>.5&&e.chance(.55))}for(let C=0;C<=$t.arches;C++){const b=(C-$t.arches/2)*($t.span+$t.pier);for(let M=0;M<9;M++){const E=e.range(-5.2,5.2)*(e.chance(.5)?1:1.4),D=e.range(-5.2,5.2),N=(b+D)/$t.radius,I=$t.radius+E,F=$t.cx+I*Math.sin(N),z=$t.cz+I*Math.cos(N);t.height(F,z)>$t.springY-4||this.land.riverDist(F,z)<4||S(F,z,e.chance(.4))}}}buildContactAO(){const t=new Ui(1,1);t.rotateX(-Math.PI/2);const e=Ke(new Di({color:0,transparent:!0,opacity:1,depthWrite:!1,polygonOffset:!0,polygonOffsetFactor:-2,polygonOffsetUnits:-2}),{key:"contact-ao",fragColor:`
        float rr = length(vOPos.xz) * 2.0;
        float fall = pow(clamp(1.0 - rr, 0.0, 1.0), 1.6);
        diffuseColor.a = fall * (0.18 + 0.82 * vRand) * 0.6;
        diffuseColor.rgb = vec3(0.01, 0.015, 0.0);
      `}),n=new sn(t,e,this.ao.length),i=new Et,r=new xe,o=new A(0,1,0),a=new A;this.ao.forEach((c,l)=>{this.land.normal(c.x,c.z,a,2),r.setFromUnitVectors(o,a),i.compose(new A(c.x,c.y+.07+c.r*.01,c.z),r,new A(c.r*2,1,c.r*2)),n.setMatrixAt(l,i)}),n.instanceMatrix.needsUpdate=!0,n.renderOrder=1,n.frustumCulled=!1,n.name="contact-ao",this.group.add(n),this.ao=[]}finalize(){for(const[t,e]of this.batchBuckets){const n=[...new Set(e.map(p=>p.key))];let i=0;for(const p of n){const d=this.variants.get(p);i+=d.hi.attributes.position.count+(d.lo?.attributes.position.count??0)}const r=this.variants.get(n[0]).mat,o=()=>{const p=new $f(e.length,i+64,0,r);return p.sortObjects=!1,p.perObjectFrustumCulled=!0,p.receiveShadow=!0,p},a=o(),c=o(),l=this.q.tier==="high";a.castShadow=l,c.castShadow=t==="rocks"&&l;const u=new Map,h=new Map;for(const p of n){const d=this.variants.get(p);u.set(p,a.addGeometry(d.hi)),h.set(p,c.addGeometry(d.lo??d.hi))}for(const p of e)p.hiId=a.addInstance(u.get(p.key)),p.loId=c.addInstance(h.get(p.key)),a.setMatrixAt(p.hiId,p.m),c.setMatrixAt(p.loId,p.m),a.setColorAt(p.hiId,p.c),c.setColorAt(p.loId,p.c),c.setVisibleAt(p.loId,!1);a.name=`${t}-hi`,c.name=`${t}-lo`,this.group.add(a,c),this.batches.push({hi:a,lo:c,inst:e})}this.batchBuckets.clear();for(const[t,e]of this.buckets){const[n,i]=t.split(",").map(Number),r={cx:n,cz:i,groups:[]};for(const[o,a]of e){const c=this.variants.get(o),l=new sn(c.hi,c.mat,a.length);let u=!1;if(a.forEach((p,d)=>{l.setMatrixAt(d,p.m),p.c&&(l.setColorAt(d,p.c),u=!0)}),u&&l.instanceColor){const p=l.instanceColor.array;a.forEach((d,m)=>{d.c||p.set([1,1,1],m*3)})}l.instanceMatrix.needsUpdate=!0,l.castShadow=c.shadow,l.receiveShadow=!0,l.computeBoundingSphere();const h={hi:l,v:c};if(this.group.add(l),c.lo){const p=new sn(c.lo,c.mat,a.length);p.instanceMatrix=l.instanceMatrix,l.instanceColor&&(p.instanceColor=l.instanceColor),p.count=a.length,p.castShadow=c.shadow,p.receiveShadow=!0,p.boundingSphere=l.boundingSphere,p.visible=!1,h.lo=p,this.group.add(p)}r.groups.push(h)}this.cells.push(r)}this.buckets.clear()}update(t,e=!1){if(this.frame++,!(!e&&this.frame%6!==0)){for(const n of this.batches)for(const i of n.inst){const r=i.x-t.x,o=i.y-t.y,a=i.z-t.z,c=r*r+o*o+a*a<i.hiDist*i.hiDist;n.hi.setVisibleAt(i.hiId,c),n.lo.setVisibleAt(i.loId,!c)}for(const n of this.cells){const i=Math.max(0,Math.abs((n.cx+.5)*As-t.x)-As/2),r=Math.max(0,Math.abs((n.cz+.5)*As-t.z)-As/2),o=Math.hypot(i,r,0);for(const a of n.groups){const c=a.v;if(o>c.maxDist)a.hi.visible=!1,a.lo&&(a.lo.visible=!1);else if(a.lo){const l=o<c.hiDist;a.hi.visible=l,a.lo.visible=!l}else a.hi.visible=!0}}}}}new Et;const kh=new xe,Vh=new Ye,Hh=new A,Ga=new A;function Sx(s,t=new Et){const e=s.p??[0,0,0],n=s.r??[0,0,0],i=s.s??1;return Hh.set(e[0],e[1],e[2]),Vh.set(n[0],n[1],n[2],"XYZ"),kh.setFromEuler(Vh),typeof i=="number"?Ga.set(i,i,i):Ga.set(i[0],i[1],i[2]),t.compose(Hh,kh,Ga)}function Fr(s){let t=s;t.index&&(t=t.toNonIndexed());for(const e of Object.keys(t.attributes))e!=="position"&&e!=="normal"&&e!=="uv"&&t.deleteAttribute(e);return t.attributes.normal||t.computeVertexNormals(),t.attributes.uv||t.setAttribute("uv",new Ae(new Float32Array(t.attributes.position.count*2),2)),t}class ns{m=new Map;add(t,e,n){const i=Fr(e);n&&i.applyMatrix4(n instanceof Et?n:Sx(n));let r=this.m.get(t);return r||this.m.set(t,r=[]),r.push(i),this}keys(){return[...this.m.keys()]}merged(t){const e=this.m.get(t);if(!e||!e.length)return null;const n=Ii(e,!1);for(const i of e)i.dispose();return n}build(t,e=!0){const n=new Ne;for(const i of this.keys()){const r=this.merged(i);if(!r)continue;const o=t[i];if(!o)throw new Error(`missing material ${i}`);const a=new ue(r,o);a.name=i,a.castShadow=e,a.receiveShadow=e,n.add(a)}return n}}const G=(s,t,e)=>new We(s,t,e);function bt(s,t,e,n=16,i="y",r=!1){const o=new hn(s,t,e,n,1,r);return i==="x"?o.rotateZ(Math.PI/2):i==="z"&&o.rotateX(Math.PI/2),o}function de(s,t=24,e="y"){const n=new Jo(s.map(([i,r])=>new tt(i,r)),t);return e==="x"?n.rotateZ(-Math.PI/2):e==="z"&&n.rotateX(Math.PI/2),n}const gn=(s,t=16,e=12)=>new Zn(s,t,e);function vn(s,t,e=8,n=24,i="z"){const r=new Ur(s,t,e,n);return i==="x"?r.rotateY(Math.PI/2):i==="y"&&r.rotateX(Math.PI/2),r}function le(s,t,e=8,n=8,i=!1){const r=new is(s.map(o=>new A(...o)),i,"centripetal");return new Nr(r,Math.max(2,(s.length-1)*n),t,e,i)}function Gc(s,t,e){const n=new cn,i=-s/2,r=-t/2;return e=Math.min(e,s/2,t/2),n.moveTo(i+e,r),n.lineTo(i+s-e,r),n.absarc(i+s-e,r+e,e,-Math.PI/2,0,!1),n.lineTo(i+s,r+t-e),n.absarc(i+s-e,r+t-e,e,0,Math.PI/2,!1),n.lineTo(i+e,r+t),n.absarc(i+e,r+t-e,e,Math.PI/2,Math.PI,!1),n.lineTo(i,r+e),n.absarc(i+e,r+e,e,Math.PI,Math.PI*1.5,!1),n}function Ei(s,t,e=0,n=6){const i=new Jn(s,{depth:Math.max(1e-4,t-2*e),bevelEnabled:e>0,bevelThickness:e,bevelSize:e,bevelSegments:e>0?2:0,curveSegments:n});return i.translate(0,0,-(t-2*e)/2),i}function hl(s){const t=new Et().makeBasis(new A(0,0,1),new A(0,1,0),new A(1,0,0));s.applyMatrix4(t);const e=s.index;if(e)for(let n=0;n<e.count;n+=3){const i=e.getX(n+1),r=e.getX(n+2);e.setX(n+1,r),e.setX(n+2,i)}else for(const n of Object.keys(s.attributes)){const i=s.attributes[n],r=i.itemSize;for(let o=0;o+2<i.count;o+=3)for(let a=0;a<r;a++){const c=i.array[(o+1)*r+a];i.array[(o+1)*r+a]=i.array[(o+2)*r+a],i.array[(o+2)*r+a]=c}i.needsUpdate=!0}return s}function wx(s,t,e=1){const n=s.attributes.position;let i=e*9301+49297;const r=()=>(i=(i*9301+49297)%233280,i/233280),o=new Map,a=new A;for(let c=0;c<n.count;c++){a.fromBufferAttribute(n,c);const l=`${a.x.toFixed(4)},${a.y.toFixed(4)},${a.z.toFixed(4)}`;let u=o.get(l);u||(u=new A((r()-.5)*t,(r()-.5)*t,(r()-.5)*t),o.set(l,u)),n.setXYZ(c,a.x+u.x,a.y+u.y,a.z+u.z)}return s.computeVertexNormals(),s}const Mi=(s,t,e)=>new lt().setRGB(s,t,e,ae);class Tx{constructor(t,e){this.track=t,this.land=e,this.group.name="lineside",this.poles(),this.fences(),this.signal()}track;land;group=new Ne;timber(){return Ke(new _e({color:Mi(.3,.22,.15),roughness:.95}),{key:"timber-weathered",fragColor:"diffuseColor.rgb *= 0.65 + 0.7 * heVNoise(vec3(vOPos.x * 8.0, vOPos.y * 1.5, vOPos.z * 8.0) + vRand * 9.0);"})}poles(){const t=this.track,e=kn(),n=new He(88),i=55,r=7.2,o=new hn(.1,.17,r,8,1);o.translate(0,r/2-.4,0);const a=new We(2,.1,.12);a.translate(0,r-.7,0);const c=a.clone();c.translate(0,-.65,0);const l=Ii([o,a,c].map(Fr)),u=[];for(let S=220;S<t.length-10;S+=i){t.frame(S,e);const C=e.p.clone().addScaledVector(e.r,1*7.2);C.y=this.land.height(C.x,C.z),!(Math.abs(C.y-(e.p.y-.6))>5.5)&&u.push({p:C,yaw:Math.atan2(e.t.x,e.t.z)+Math.PI/2})}const h=new sn(l,this.timber(),u.length),p=new Et,d=new xe;u.forEach((S,T)=>{d.setFromAxisAngle(new A(0,1,0),S.yaw+n.range(-.03,.03)),p.compose(S.p,d,new A(1,n.range(.95,1.05),1)),h.setMatrixAt(T,p)}),h.castShadow=!0,h.frustumCulled=!1,this.group.add(h);const m=[],v=new hn(.035,.05,.13,6),g=new sn(v,new _e({color:Mi(.55,.62,.58),roughness:.4,metalness:.1}),u.length*6);let f=0;const x=[[-.85,0],[.85,0],[-.55,-.65],[.55,-.65],[-.15,-.65],[.15,0]],_=u.map(S=>{const T=new A(Math.cos(S.yaw),0,-Math.sin(S.yaw));return x.map(([C,b])=>S.p.clone().addScaledVector(T,C).setY(S.p.y+r-.4+b+.12))});_.forEach(S=>S.forEach(T=>{p.makeTranslation(T.x,T.y-.06,T.z),g.setMatrixAt(f++,p)})),g.count=f,g.frustumCulled=!1,this.group.add(g);for(let S=0;S+1<_.length;S++)if(!(u[S+1].p.distanceTo(u[S].p)>i*1.6))for(let T=0;T<4;T++){const C=_[S][T],b=_[S+1][T],M=10;let E=C.clone();for(let D=1;D<=M;D++){const N=D/M,I=C.clone().lerp(b,N);I.y-=Math.sin(N*Math.PI)*.9,m.push(E.x,E.y,E.z,I.x,I.y,I.z),E=I}}const y=new me;y.setAttribute("position",new Gt(m,3));const w=new Ql(y,new zc({color:Mi(.12,.12,.13)}));w.frustumCulled=!1,this.group.add(w)}fences(){const t=this.track,e=kn(),n=new He(21),i=new We(.09,1.25,.09);i.translate(0,.5,0);const r=[],o=[],a=2.6;for(const h of[-1,1]){let p=null;for(let d=175;d<t.length-6;d+=a){t.frame(d,e);const m=e.p.clone().addScaledVector(e.r,h*6.4),v=this.land.height(m.x,m.z);if(!(Math.abs(v-(e.p.y-.6))<2.6&&this.land.riverDist(m.x,m.z)>5)){p=null;continue}m.y=v;const f=new Et().compose(m,new xe().setFromAxisAngle(new A(0,1,0),n.range(0,3)),new A(1,n.range(.92,1.05),1));r.push(f);const x=[.25,.65,1.05].map(_=>m.clone().setY(m.y+_));if(p)for(let _=0;_<3;_++)o.push(p[_].x,p[_].y-.03*(_+1),p[_].z,x[_].x,x[_].y-.03*(_+1),x[_].z);p=x}}const c=new sn(i,this.timber(),r.length);r.forEach((h,p)=>c.setMatrixAt(p,h)),c.frustumCulled=!1,c.castShadow=!0,this.group.add(c);const l=new me;l.setAttribute("position",new Gt(o,3));const u=new Ql(l,new zc({color:Mi(.24,.24,.26)}));u.frustumCulled=!1,this.group.add(u)}signal(){const t=this.track,e=kn(),n=t.length-44;t.frame(n,e);const i=e.p.clone().addScaledVector(e.r,-3.6);i.y=Math.max(this.land.height(i.x,i.z),e.p.y-.9);const r=Math.atan2(e.t.x,e.t.z),o=new Ne;o.position.copy(i),o.rotation.y=r;const a=new _e({color:Mi(.86,.84,.78),roughness:.6}),c=new _e({color:Mi(.7,.05,.04),roughness:.5}),l=new _e({color:Mi(.04,.04,.045),roughness:.6}),u=new _e({color:Mi(.2,.2,.22),roughness:.5,metalness:.6}),h=new ue(new hn(.08,.16,7.2,8),a);h.position.y=3.2,o.add(h);for(const x of[-.16,.16]){const _=new ue(new We(.03,6.2,.03),u);_.position.set(x,3.1,.2),o.add(_)}for(let x=.4;x<6.4;x+=.38){const _=new ue(new We(.32,.025,.025),u);_.position.set(0,x,.2),o.add(_)}const p=new ue(new We(.9,.05,.6),u);p.position.set(0,6.55,0),o.add(p);const d=new Ne;d.position.set(0,6,.3);const m=new ue(new We(1.5,.22,.04),c);m.position.set(-.75,0,0),d.add(m);const v=new ue(new We(.22,.22,.045),a);v.position.set(-1.05,0,0),d.add(v),d.rotation.z=.82,o.add(d);const g=new ue(new We(.34,.5,.34),l);g.position.set(-.5,5.2,0),o.add(g);const f=new ue(new jo(.09,16),new Di({color:new lt(.7,3,1.2),toneMapped:!1}));f.position.set(-.5,5.25,-.18),f.rotation.y=Math.PI,o.add(f),o.traverse(x=>x.isMesh&&(x.castShadow=!0)),this.group.add(o)}}const qi=(s,t,e)=>new lt().setRGB(s,t,e,ae);class Ex{constructor(t,e,n){this.land=t,this.group.name="sheep";const i=new He(555);this.placeFlocks(i,e),this.count=this.sheep.length;const r=this.buildGeometry(!0),o=this.buildGeometry(!1),a=Ke(new _e({vertexColors:!0,roughness:.95,metalness:0}),{key:"sheep",vertDecl:"attribute vec4 aState; attribute vec3 aAnim; varying float vWool;",vertMain:`
        vWool = aAnim.z;
        float walk = aState.y;
        float ph = aState.x;
        // legs swing about the hip (diagonal pairs), weight grows towards the hoof
        float lw = clamp(1.0 - position.y / 0.36, 0.0, 1.0) * abs(aAnim.x);
        transformed.z += sin(ph + (aAnim.x > 0.0 ? 0.0 : 3.14159)) * 0.16 * walk * lw;
        transformed.y += max(0.0, cos(ph + (aAnim.x > 0.0 ? 0.0 : 3.14159))) * 0.05 * walk * lw;
        // body sway and head: down to graze (with chewing), alert head up
        float hw = aAnim.y;
        float graze = aState.z;
        transformed.y -= hw * graze * 0.34;
        transformed.z += hw * graze * 0.16;
        transformed.y += hw * (1.0 - graze) * (1.0 - walk) * 0.03;
        transformed.y += hw * graze * sin(uTime * 7.0 + aState.w * 20.0) * 0.012;
        transformed.y += sin(ph * 2.0) * 0.012 * walk;
        transformed.x += sin(ph) * 0.02 * walk * (1.0 - abs(aAnim.x));
      `,fragDecl:"varying float vWool;",fragColor:`
        float fl = heVNoise(vOPos * 22.0 + 3.0);
        diffuseColor.rgb *= mix(1.0, 0.8 + 0.4 * fl, vWool);
        // curly wool: darker pockets
        diffuseColor.rgb *= mix(1.0, 0.72 + 0.4 * heVNoise(vOPos * 46.0), vWool * 0.8);
      `});this.mesh=new sn(r,a,this.sheep.length),this.meshLo=new sn(o,a,this.sheep.length),this.stateLo=new ts(new Float32Array(this.sheep.length*4),4),this.stateLo.setUsage(Ps),o.setAttribute("aState",this.stateLo),this.meshLo.instanceMatrix.setUsage(Ps),this.meshLo.castShadow=!1,this.meshLo.receiveShadow=!0,this.meshLo.frustumCulled=!1,this.group.add(this.meshLo),this.state=new ts(new Float32Array(this.sheep.length*4),4),this.state.setUsage(Ps),r.setAttribute("aState",this.state),this.mesh.instanceMatrix.setUsage(Ps),this.mesh.castShadow=n,this.mesh.receiveShadow=!0,this.mesh.frustumCulled=!1,this.group.add(this.mesh),this.writeAll(0)}land;group=new Ne;sheep=[];flocks=[];mesh;meshLo;state;stateLo;frame=0;m=new Et;q=new xe;fwd=new A;right=new A;up=new A;pos=new A;scl=new A;bleat=0;count;buildGeometry(t){const e=[],n=(p,d,m,v)=>{const g=Fr(p);g.deleteAttribute("uv"),g.applyMatrix4(d);const f=g.attributes.position,x=new Float32Array(f.count*3),_=new Float32Array(f.count*3),y=new A;for(let w=0;w<f.count;w++){y.fromBufferAttribute(f,w);const S=m(y);x[w*3]=S.r,x[w*3+1]=S.g,x[w*3+2]=S.b;const T=v(y);_[w*3]=T[0],_[w*3+1]=T[1],_[w*3+2]=T[2]}g.setAttribute("color",new Ae(x,3)),g.setAttribute("aAnim",new Ae(_,3)),e.push(g)},i=(p,d,m,v=1,g=1,f=1,x=0)=>new Et().compose(new A(p,d,m),new xe().setFromEuler(new Ye(x,0,0)),new A(v,g,f)),r=qi(.8,.76,.66),o=qi(.62,.58,.5),a=qi(.07,.065,.06),c=(p,d,m,v,g,f,x)=>{const _=new Mn(1,t?2:0),y=_.attributes.position,w=new A;for(let S=0;S<y.count;S++){w.fromBufferAttribute(y,S);const T=1+.16*Ht.n3(w.x*3.2+x,w.y*3.2,w.z*3.2)+.07*Ht.n3(w.x*9+x,w.y*9,w.z*9);y.setXYZ(S,w.x*T,w.y*T,w.z*T)}_.computeVertexNormals(),n(_,i(v,g,f,p,d,m),S=>r.clone().lerp(o,Math.max(0,.45-S.y*.9)),()=>[0,0,1])};c(.27,.27,.46,0,.5,-.02,1),c(.22,.2,.2,0,.62,.3,7),c(.2,.2,.2,0,.55,-.34,4);const l=[[.12,.26,1],[-.12,.26,-1],[.12,-.26,-1],[-.12,-.26,1]];for(const[p,d,m]of l){const v=new hn(.032,.026,.4,t?6:4,1);n(v,i(p,.2,d),()=>a,()=>[m,0,0]),n(new Zn(.036,t?6:4,t?4:3),i(p,.02,d,1,.6,1.3),()=>qi(.04,.04,.04),()=>[m,0,0])}const u=new Zn(.1,t?10:6,t?8:4);n(u,i(0,.68,.58,.9,1,1.35),()=>a,()=>[0,1,0]),n(new Zn(.06,8,6),i(0,.64,.7,.9,.9,1.3),()=>qi(.12,.11,.1),()=>[0,1,0]),n(new hn(.078,.115,.52,t?8:5,t?4:2),i(0,.605,.4,1,1,1,1.22),()=>a,p=>[0,Math.min(1,Math.max(0,(p.z-.2)/.36)),0]),n(new Zn(.15,8,6),i(0,.56,.25,1,.95,1),()=>r,()=>[0,0,1]);for(const p of[-1,1])n(new Zn(.05,6,4),i(p*.13,.73,.54,1.2,.35,.8),()=>qi(.14,.12,.1),()=>[0,1,0]),n(new Ur(.06,.013,t?5:3,t?9:5,Math.PI*1.35),new Et().compose(new A(p*.1,.77,.5),new xe().setFromEuler(new Ye(.2,p*1.1,0)),new A(1,1,1)),()=>qi(.5,.44,.34),()=>[0,1,0]);n(new Zn(.05,6,5),i(0,.66,-.5,1,1.4,1),()=>r,()=>[0,0,1]);const h=Ii(e,!1);return h.computeBoundingSphere(),h}placeFlocks(t,e){const n=this.land,i=14,r=Math.max(2,Math.round(e/i)),o=[];for(let c=0;c<4200;c++){const l=c%2===0,u=l?t.range(-190,200):t.range(-360,360),h=l?t.range(-70,230):t.range(-520,330),p=n.fastHeight(u,h),d=n.fastSlope(u,h);if(d>.3||p<1.5||p>90)continue;const m=n.trackDistance(u,h);if(m<16||n.riverDist(u,h)<9||Qi(u,h,p,d)>.15)continue;const v=u-$t.cx,g=h-$t.cz,f=Math.hypot(v,g);if(Math.abs(f-$t.radius)<16&&Math.abs(Math.atan2(v,g)*$t.radius)<$t.halfLen+10)continue;let x=t.next();m<90&&(x+=.5),l&&(x+=.6),o.push({x:u,z:h,score:x})}o.sort((c,l)=>l.score-c.score);const a=[];for(const c of o){if(a.length>=r)break;a.every(l=>Math.hypot(l.x-c.x,l.z-c.z)>58)&&a.push(c)}a.forEach((c,l)=>{const u=Math.max(5,Math.round(i*t.range(.6,1.35))),h={cx:c.x,cz:c.z,radius:t.range(38,62),members:[]};for(let p=0;p<u;p++){const d=t.range(0,Math.PI*2),m=Math.sqrt(t.next())*14,v=c.x+Math.cos(d)*m,g=c.z+Math.sin(d)*m;if(n.fastSlope(v,g)>.45||n.riverDist(v,g)<5)continue;const f=t.chance(.18);h.members.push(this.sheep.length),this.sheep.push({x:v,z:g,h:t.range(0,Math.PI*2),speed:0,mode:t.chance(.7)?"graze":"walk",timer:t.range(1,9),graze:0,phase:t.range(0,6.28),seed:t.next(),scale:f?t.range(.55,.7):t.range(.9,1.12),flock:l,hx:0,hz:0,nextBleat:t.range(5,40)})}this.flocks.push(h)})}hazard(t,e){const n=this.land,i=n.fastHeight(t,e),r=n.fastSlope(t,e);let o=Ot(.35,.7,r);return o=Math.max(o,1-Ot(5,11,n.trackDistance(t,e))),o=Math.max(o,1-Ot(3.5,8,n.riverDist(t,e))),o=Math.max(o,Ot(.1,.45,Qi(t,e,i,r))),o}writeAll(t){const e=this.state.array;this.sheep.forEach((n,i)=>this.write(n,i,e,t)),this.mesh.count=this.sheep.length,this.meshLo.count=0,this.mesh.instanceMatrix.needsUpdate=!0,this.state.needsUpdate=!0}write(t,e,n,i,r=this.mesh){const o=this.land,a=o.fastHeight(t.x,t.z);this.fwd.set(Math.sin(t.h),0,Math.cos(t.h));const c=o.fastHeight(t.x+this.fwd.x*.45,t.z+this.fwd.z*.45),l=o.fastHeight(t.x-this.fwd.x*.45,t.z-this.fwd.z*.45),u=o.fastHeight(t.x+this.fwd.z*.3,t.z-this.fwd.x*.3),h=o.fastHeight(t.x-this.fwd.z*.3,t.z+this.fwd.x*.3);this.fwd.y=(c-l)/.9,this.fwd.normalize(),this.right.set(this.fwd.z,(u-h)/.6,-this.fwd.x).normalize(),this.up.crossVectors(this.fwd,this.right).normalize(),this.up.y<0&&this.up.negate(),this.right.crossVectors(this.up,this.fwd).normalize(),this.m.makeBasis(this.right,this.up,this.fwd),this.q.setFromRotationMatrix(this.m),this.pos.set(t.x,a-.02,t.z),this.scl.setScalar(t.scale),this.m.compose(this.pos,this.q,this.scl),r.setMatrixAt(e,this.m),n[e*4]=t.phase,n[e*4+1]=Math.min(1,t.speed/.8),n[e*4+2]=t.graze,n[e*4+3]=t.seed}update(t,e,n,i){this.frame++,this.bleat=0,t=Math.min(t,.1);const r=this.state.array,o=this.stateLo.array;let a=0,c=0;const l=this.sheep;for(let u=0;u<l.length;u++){const h=l[u],p=this.flocks[h.flock];if((this.frame+u)%14===0){const x=this.hazard(h.x+4,h.z)-this.hazard(h.x-4,h.z),_=this.hazard(h.x,h.z+4)-this.hazard(h.x,h.z-4);h.hx=-x,h.hz=-_,this.hazard(h.x,h.z)>.6&&(h.hx*=3,h.hz*=3)}const d=Math.hypot(h.x-n.x,h.z-n.z);if(h.timer-=t,d<55&&d>9&&h.mode!=="watch"&&(h.mode="watch",h.timer=3+h.seed*4),h.mode==="watch"){let x=Math.atan2(n.x-h.x,n.z-h.z)-h.h;x=Math.atan2(Math.sin(x),Math.cos(x)),h.h+=x*Math.min(1,t*2.2),h.speed*=Math.max(0,1-t*4),h.graze+=(0-h.graze)*Math.min(1,t*5),(d>70||d<9)&&(h.mode="graze",h.timer=2+h.seed*6)}else{if(h.timer<=0){let K=0,rt=0;for(const mt of p.members){if(mt===u)continue;const Vt=l[mt];Math.hypot(Vt.x-h.x,Vt.z-h.z)<14&&(rt++,Vt.mode==="walk"&&K++)}const Z=.2+.6*(rt?K/rt:0);h.mode==="graze"&&Math.random()<Z?(h.mode="walk",h.timer=3+Math.random()*6):(h.mode="graze",h.timer=4+Math.random()*9)}let f=0,x=0,_=0,y=0,w=0,S=0,T=0;for(const K of p.members){if(K===u)continue;const rt=l[K],Z=rt.x-h.x,mt=rt.z-h.z,Vt=Z*Z+mt*mt;if(!(Vt>324)&&(T++,w+=rt.x,S+=rt.z,_+=Math.sin(rt.h),y+=Math.cos(rt.h),Vt<1.7*1.7)){const Zt=Math.sqrt(Vt)+.001;f-=Z/Zt*(1.7-Zt),x-=mt/Zt*(1.7-Zt)}}let C=Math.sin(h.h),b=Math.cos(h.h);if(T){w=w/T-h.x,S=S/T-h.z;const K=Math.hypot(w,S)+.001,rt=Math.min(1,Math.max(0,(K-5)/10));C+=w/K*rt*.9+_/T*.35+f*1.6,b+=S/K*rt*.9+y/T*.35+x*1.6}const M=p.cx-h.x,E=p.cz-h.z,D=Math.hypot(M,E);if(D>p.radius*.7){const K=Math.min(2,(D-p.radius*.7)/12);C+=M/D*K,b+=E/D*K}C+=h.hx*5,b+=h.hz*5;const N=Ht.n2(e*.12+h.seed*50,h.seed*9);C+=Math.cos(N*6)*.4,b+=Math.sin(N*6)*.4;let F=Math.atan2(C,b)-h.h;F=Math.atan2(Math.sin(F),Math.cos(F));const z=.5+.3*h.seed,X=h.mode==="walk"?z:0;h.speed+=(X-h.speed)*Math.min(1,t*1.6),h.speed>.05&&(h.h+=F*Math.min(1,t*1.6));const k=h.mode==="graze"?1:0;h.graze+=(k-h.graze)*Math.min(1,t*1.4)}if(h.speed>.02&&(h.x+=Math.sin(h.h)*h.speed*t,h.z+=Math.cos(h.h)*h.speed*t,h.phase+=t*(3.2+h.speed*6)*(h.scale<.8?1.4:1)),h.nextBleat-=t,h.nextBleat<=0){h.nextBleat=12+Math.random()*40;const f=Math.hypot(h.x-i.x,h.z-i.z);f<160&&(this.bleat=Math.max(this.bleat,1-f/160))}const m=h.x-i.x,v=h.z-i.z,g=m*m+v*v;g<5625?this.write(h,a++,r,e,this.mesh):g<650*650&&this.write(h,c++,o,e,this.meshLo)}this.mesh.count=a,this.meshLo.count=c,this.mesh.instanceMatrix.needsUpdate=!0,this.meshLo.instanceMatrix.needsUpdate=!0,this.state.needsUpdate=!0,this.stateLo.needsUpdate=!0}dispose(){this.mesh.geometry.dispose(),this.meshLo.geometry.dispose(),this.mesh.material.dispose()}}const Gh=s=>new Et().makeRotationX(s),Wh=Lo;function Ax(s){const t=new ns,e=s.radius,n=s.hubR??Math.min(.2,e*.2),i=s.rimDepth??Math.max(.06,e*.075),r=s.axleR??Math.max(.06,e*.09);for(const a of[1,-1]){const c=a*Wh,l=c-a*.07,u=c+a*.07,h=c-a*.046,p=[[e-i-.005,l],[e+.03,l+a*.004],[e+.034,h-a*.008],[e+.004,h+a*.004],[e,u-a*.006],[e-.003,u],[e-i-.005,u],[e-i-.005,l]];a<0&&p.reverse(),t.add("tyre",de(p,Math.max(36,Math.round(e*60)),"x"));const d=[[e-i-.004,c-.055],[e-i-.045,c-.04],[e-i-.05,c+.04],[e-i-.004,c+.055]];a<0&&d.reverse(),t.add("wbody",de(d,Math.max(32,Math.round(e*50)),"x"));const m=[[.001,c-.1],[n*.92,c-.1],[n,c-.08],[n,c+.08],[n*.92,c+.1],[.001,c+.1]];a<0&&m.reverse(),t.add("wbody",de(m,20,"x"));const v=[[.001,c+a*.115],[n*.55,c+a*.112],[n*.6,c+a*.1],[.001,c+a*.1]];a<0&&v.reverse(),t.add("brass",de(v,16,"x"));const g=e-i-.05-n*.8;for(let f=0;f<s.spokes;f++){const x=f/s.spokes*Math.PI*2+.07,_=new hn(e*.028+.012,e*.04+.014,g,6);_.scale(.75,1,1.15),_.translate(c,n*.8+g/2,0),_.applyMatrix4(Gh(x)),t.add("wbody",_)}if(s.counterweight&&s.crank){const f=(a>0?s.crank.right:s.crank.left)+Math.PI,x=n+.1,_=e-i-.07,y=.9,w=new cn,S=14;for(let b=0;b<=S;b++){const M=-y/2+y*b/S,E=_,D=E*Math.cos(M),N=E*Math.sin(M);b===0?w.moveTo(D,N):w.lineTo(D,N)}for(let b=S;b>=0;b--){const M=-y/2*.8+y*.8*b/S;w.lineTo(x*1*Math.cos(M),x*1*Math.sin(M))}w.closePath();const T=new Jn(w,{depth:.05,bevelEnabled:!1,curveSegments:4}),C=new Et().makeBasis(new A(0,1,0),new A(0,0,1),new A(1,0,0));T.applyMatrix4(C),T.translate(c+a*.045-(a>0?0:.05),0,0),T.applyMatrix4(Gh(f)),t.add("wbody",T)}if(s.crank){const f=a>0?s.crank.right:s.crank.left,x=s.crank.r,_=c+a*.07,y=bt(.046,.046,s.crank.len,14,"x");y.translate(_+a*s.crank.len/2,x*Math.cos(f),x*Math.sin(f)),t.add("axle",y);const w=bt(s.crank.boss,s.crank.boss,.05,20,"x");w.translate(_+a*.025,x*Math.cos(f),x*Math.sin(f)),t.add("brass",w);const S=bt(.062,.062,.035,14,"x");S.translate(_+a*(s.crank.len+.005),x*Math.cos(f),x*Math.sin(f)),t.add("brass",S)}}const o=bt(r,r,2*Wh+.22,14,"x");return t.add("axle",o),t}const ul=(s,t,e)=>new lt().setRGB(s,t,e,ae);function mn(s){const t=[];for(const n of s){const i=Fr(n.geo);i.deleteAttribute("uv");const r=i.attributes.position.count,o=new Float32Array(r*3),a=new Float32Array(r*2);for(let c=0;c<r;c++)o[c*3]=n.color.r,o[c*3+1]=n.color.g,o[c*3+2]=n.color.b,a[c*2]=n.metal,a[c*2+1]=n.rough;i.setAttribute("color",new Ae(o,3)),i.setAttribute("aPbr",new Ae(a,2)),t.push(i)}const e=Ii(t,!1);for(const n of t)n.dispose();return e.computeBoundingSphere(),e}let So=null;function br(){if(So)return So;const s=new Qo({vertexColors:!0,roughness:.5,metalness:.5,side:Xe,envMapIntensity:1.1,clearcoat:.25,clearcoatRoughness:.3});return So=Ke(s,{key:"packed",vertDecl:"attribute vec2 aPbr; varying vec2 vPbr;",vertMain:"vPbr = aPbr;",fragDecl:"varying vec2 vPbr;",fragColor:`
      float pn = heFbm(vOPos * 9.0);
      float pg = 1.0 - smoothstep(0.0, 0.5, vOPos.y + 0.5);
      diffuseColor.rgb *= 0.82 + 0.3 * pn;
      diffuseColor.rgb *= 1.0 - 0.25 * pg * heVNoise(vOPos * 5.0);
    `,fragMetal:"metalnessFactor = vPbr.x;",fragRough:"roughnessFactor = clamp(vPbr.y + (heFbm(vOPos * 14.0) - 0.5) * 0.18, 0.1, 1.0);"}),So}const Zu=ul(.78,.78,.8),ju=ul(.42,.42,.44),vr=ul(.93,.7,.3);function Sr(s,t,e=[]){const n=Ax(s),i=[],r=(o,a,c,l)=>{const u=n.merged(o);u&&i.push({geo:u,color:a,metal:c,rough:l})};return r("wbody",t,.05,.42),r("tyre",Zu,1,.22),r("axle",ju,1,.38),r("brass",vr,1,.3),mn([...i,...e])}class $n{constructor(t,e,n,i=!0){this.nodes=n,this.mesh=new sn(t,e,n.length),this.mesh.frustumCulled=!1,this.mesh.castShadow=i,this.mesh.receiveShadow=!0,this.mesh.instanceMatrix.setUsage(Ps)}nodes;mesh;update(){const t=this.mesh;for(let e=0;e<this.nodes.length;e++){const n=this.nodes[e];n.updateWorldMatrix(!0,!1),t.setMatrixAt(e,n.matrixWorld)}t.instanceMatrix.needsUpdate=!0}}const ye=(s,t,e)=>new lt().setRGB(s,t,e,ae);function Un(s){const t=new Qo({color:s.color,roughness:s.rough??.42,metalness:s.metal??0,clearcoat:s.clearcoat??.55,clearcoatRoughness:.22,envMapIntensity:1,side:Xe}),e=(s.grimeBelow??1.2).toFixed(3),n=(s.grimeAmount??.45).toFixed(3),i=(s.soot??0).toFixed(3),r=(s.chips??.35).toFixed(3),o=(s.streaks??.35).toFixed(3);return Ke(t,{key:s.key,fragColor:`
      float gN = heFbm(vOPos * vec3(2.7, 2.7, 1.4) + 3.0);
      float fine = heVNoise(vOPos * 38.0);
      float low = 1.0 - smoothstep(0.0, ${e}, vOPos.y);
      float grime = clamp(low * ${n} * (0.55 + 0.9 * gN), 0.0, 0.85);
      // vertical rain / oil streaks
      float stk = heVNoise2(vec2(vOPos.x * 14.0 + vOPos.z * 6.5, vOPos.y * 0.9 + gN));
      float streak = smoothstep(0.58, 0.9, stk) * ${o};
      // soot toward the chimney end
      float sootAmt = ${i} * smoothstep(1.6, 5.0, vOPos.z) * smoothstep(1.2, 3.6, vOPos.y) * (0.5 + gN);
      diffuseColor.rgb *= 1.0 - 0.9 * (grime + streak * 0.5 + sootAmt);
      diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(1.18, 1.0, 0.8) * 0.8, grime * 0.4);
      // paint chips / dust patches
      float chipN = smoothstep(0.80, 0.92, heVNoise(vOPos * 21.0 + 5.0)) * ${r};
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.05, 0.045, 0.04), chipN * 0.6);
      diffuseColor.rgb *= 0.94 + 0.12 * fine;
    `,fragRough:`
      float rg = heFbm(vOPos * vec3(2.7, 2.7, 1.4) + 3.0);
      float lowR = 1.0 - smoothstep(0.0, ${e}, vOPos.y);
      roughnessFactor = clamp(roughnessFactor + (rg - 0.5) * 0.22 + lowR * 0.25 * ${n}, 0.18, 1.0);
    `})}function Ri(s,t,e=.3,n=0){const i=new _e({color:t,roughness:e,metalness:1,envMapIntensity:1.2,side:Xe});return Ke(i,{key:s,fragColor:`
      float mN = heFbm(vOPos * 11.0);
      diffuseColor.rgb *= 0.86 + 0.28 * mN;
      diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(0.55, 0.45, 0.38), ${n.toFixed(2)} * smoothstep(0.45, 0.85, heFbm(vOPos * 5.0 + 9.0)));
    `,fragRough:"roughnessFactor = clamp(roughnessFactor + (heFbm(vOPos * 17.0) - 0.5) * 0.25, 0.12, 0.9);"})}function $u(){const s=Un({key:"loco-green",color:ye(.055,.29,.16),rough:.36,clearcoat:.8,grimeBelow:2.1,grimeAmount:.5,soot:.5,streaks:.4}),t=Un({key:"loco-black",color:ye(.035,.036,.04),rough:.5,clearcoat:.35,grimeBelow:3,grimeAmount:.25,soot:.15,chips:.2,streaks:.2}),e=Un({key:"loco-red",color:ye(.5,.035,.03),rough:.4,clearcoat:.7,grimeBelow:1.2,grimeAmount:.5,chips:.5}),n=Un({key:"loco-cream",color:ye(.86,.76,.46),rough:.45,clearcoat:.6,grimeBelow:1,grimeAmount:.2,chips:0}),i=Un({key:"loco-wood",color:ye(.36,.2,.09),rough:.55,clearcoat:.5,grimeBelow:1,grimeAmount:.4}),r=new _e({color:ye(.18,.15,.12),roughness:.85,metalness:.2}),o=Ri("brass",ye(.93,.7,.3),.24,.1),a=Ri("copper",ye(.86,.45,.27),.3,.15),c=Ri("steel",ye(.8,.8,.82),.2,0),l=Ri("iron",ye(.22,.22,.23),.5,.2),u=Ke(new _e({color:ye(.045,.045,.05),roughness:.55,metalness:.25}),{key:"coal",fragColor:"diffuseColor.rgb *= 0.55 + 1.2 * heVNoise(vOPos * 22.0 + vRand * 10.0);",fragRough:"roughnessFactor = clamp(0.35 + 0.5 * heVNoise(vOPos * 31.0), 0.2, 0.95);"}),h=new Qo({color:ye(.75,.88,.92),roughness:.04,metalness:0,transparent:!0,opacity:.22,envMapIntensity:1.4,depthWrite:!1,side:Xe}),p=new Di({color:new lt(1,.38,.08),toneMapped:!1}),d=new Di({color:new lt(5.5,3.6,1.6),toneMapped:!1}),m=new _e({color:ye(.95,.93,.85),roughness:.4}),v=new _e({color:ye(.12,.07,.05),roughness:.7});return{green:s,black:t,red:e,cream:n,wood:i,footplate:r,brass:o,copper:a,steel:c,iron:l,coal:u,glass:h,fire:p,lamp:d,dial:m,leather:v}}function Rx(){const s=Un({key:"coach-lake",color:ye(.3,.025,.04),rough:.34,clearcoat:.85,grimeBelow:1.6,grimeAmount:.55,streaks:.5,chips:.25}),t=Un({key:"coach-cream",color:ye(.8,.7,.46),rough:.4,clearcoat:.7,grimeBelow:2.6,grimeAmount:.35,streaks:.5,chips:.2}),e=Un({key:"coach-roof",color:ye(.68,.66,.6),rough:.7,clearcoat:.1,grimeBelow:4,grimeAmount:.25,streaks:.6,chips:.1}),n=Un({key:"coach-under",color:ye(.04,.04,.045),rough:.7,clearcoat:0,grimeBelow:1.2,grimeAmount:.1,chips:.1,streaks:0}),i=Un({key:"coach-timber",color:ye(.3,.15,.06),rough:.5,clearcoat:.5,grimeBelow:1,grimeAmount:.3}),r=Ri("gold",ye(.95,.74,.25),.3,.05),o=Ri("cbrass",ye(.93,.7,.3),.26,.1),a=Ri("csteel",ye(.78,.78,.8),.22,0),c=Ri("ciron",ye(.18,.18,.19),.55,.25),l=new Qo({color:ye(.8,.9,.9),roughness:.05,metalness:0,transparent:!0,opacity:.14,envMapIntensity:1.5,depthWrite:!1,side:Xe}),u=Ke(new _e({color:ye(.55,.38,.2),roughness:.8,emissive:new lt(1,.62,.26),emissiveIntensity:1.1}),{key:"coach-interior",fragEmissive:`
      float lampFall = 0.45 + 0.9 * smoothstep(0.0, 1.0, (vOPos.y - 1.0) / 2.5);
      float n = 0.8 + 0.4 * heVNoise(vOPos * 7.0);
      totalEmissiveRadiance *= lampFall * n;
    `}),h=new _e({color:ye(.28,.06,.05),roughness:.9,emissive:new lt(.55,.16,.06),emissiveIntensity:.55}),p=new Di({color:new lt(5,3.2,1.4),toneMapped:!1}),d=new _e({color:ye(.03,.03,.03),roughness:.8}),m=Un({key:"coach-red",color:ye(.5,.04,.03),rough:.45,clearcoat:.5,grimeBelow:1.2,grimeAmount:.4}),v=new _e({color:ye(.16,.08,.04),roughness:.7});return{lake:s,cream:t,roof:e,under:n,timber:i,gold:r,brass:o,steel:a,iron:c,glass:l,interior:u,seat:h,lampGlow:p,rubber:d,red:m,leather:v}}const at={driverR:.97,driverZ:[2.15,0,-2.15],crankR:.32,yCyl:1.38,mainRod:2.75,pistonRod:1.26,cylRear:3.6,cylFront:4.75,bogieZ:[3.4,5.35],bogieR:.52,trailZ:-4.05,trailR:.55,bufferBeamZ:6.5,frontZ:7,rearZ:-4.75,boilerY:2.58,chimneyZ:5.5,chimneyTopY:4.3},hr=.12,Xh=.92,ur=1,bi=1.14;function Rs(s,t,e,n,i=.04,r=!0){const o=new cn,a=t/2,c=e/2,l=10;for(let p=0;p<=l;p++){const d=Math.PI/2+Math.PI*p/l,m=a*Math.cos(d)*1,v=a*Math.sin(d);p===0?o.moveTo(m,v):o.lineTo(m,v)}o.lineTo(s,-c);for(let p=0;p<=l;p++){const d=-Math.PI/2+Math.PI*p/l;o.lineTo(s+c*Math.cos(d),c*Math.sin(d))}o.lineTo(0,a);for(const p of[0,s]){const d=new Ai;d.absarc(p,0,i,0,Math.PI*2,!0),o.holes.push(d)}const u=new Jn(o,{depth:n,bevelEnabled:!0,bevelThickness:.004,bevelSize:.004,bevelSegments:1,curveSegments:10});if(u.translate(0,0,-n/2),hl(u),!r)return u;const h=G(n*1.25,Math.min(t,e)*.28,Math.max(.01,s-a-c-.06));return h.translate(0,0,s/2),Ii([u,h.toNonIndexed()].map(p=>{const d=p.index?p.toNonIndexed():p;for(const m of Object.keys(d.attributes))m!=="position"&&m!=="normal"&&m!=="uv"&&d.deleteAttribute(m);return d.attributes.uv||d.setAttribute("uv",new Ae(new Float32Array(d.attributes.position.count*2),2)),d}))}class Cx{root=new Ne;chassis=new Ne;bogie=new Ne;trailing=new Ne;mats;driverSets=[];bogieSets=[];trailSet;batches=[];sides=[];anchors={chimney:new A(0,at.chimneyTopY+.05,at.chimneyZ),safety:[new A(0,3.82,-.55)],whistle:new A(-.28,3.75,.1),cylCocks:[],injector:[new A(1.2,.85,-1.5),new A(-1.2,.85,-1.5)],domeTop:new A(0,3.95,2.2),headlamp:new A(0,3.62,6),firebox:new A(0,1.8,-2.5)};fireLight=new O0(16742954,0,6,2);headLight=new F0(16767392,0,90,.5,.7,1.5);glow;fireMat;lampMat;theta=0;constructor(){this.mats=$u(),this.fireMat=this.mats.fire,this.lampMat=this.mats.lamp,this.root.add(this.chassis),this.buildBody(),this.buildRunningGear(),this.buildBogies(),this.root.name="locomotive",this.fireLight.position.set(0,2.2,-2.9),this.chassis.add(this.fireLight);const t=document.createElement("canvas");t.width=t.height=128;const e=t.getContext("2d"),n=e.createRadialGradient(64,64,0,64,64,64);n.addColorStop(0,"rgba(255,236,190,1)"),n.addColorStop(.18,"rgba(255,200,120,0.55)"),n.addColorStop(1,"rgba(255,170,80,0)"),e.fillStyle=n,e.fillRect(0,0,128,128);const i=new Su(t);i.colorSpace=ae,this.glow=new Of(new Mu({map:i,blending:wr,depthWrite:!1,transparent:!0,fog:!1,toneMapped:!1,opacity:.9})),this.glow.scale.set(1.3,1.3,1),this.glow.position.set(0,3.78,6.22),this.chassis.add(this.glow),this.headLight.position.set(0,3.62,6.1),this.headLight.target.position.set(0,1,40),this.chassis.add(this.headLight,this.headLight.target)}buildBody(){const t=new ns,e=at.boilerY,i=de([[.001,.55],[.86,.55],[.845,1.4],[.82,2.6],[.8,3.8],[.79,4.84],[.805,4.86],[.86,4.88],[.865,5],[.865,6.2],[.86,6.24],[.001,6.24]],56,"z");i.translate(0,e,0),t.add("green",i);const r=de([[.001,4.86],[.875,4.86],[.878,5],[.878,6.2],[.87,6.26],[.001,6.26]],56,"z");r.translate(0,e,0),t.add("black",r),t.add("steel",de([[.84,6.24],[.9,6.26],[.9,6.32],[.84,6.32]],56,"z"),{p:[0,e,0]}),t.add("black",de([[.001,6.42],[.2,6.41],[.5,6.37],[.74,6.32],[.84,6.28],[.8,6.27],[.001,6.27]],56,"z"),{p:[0,e,0]}),t.add("brass",de([[.001,6.44],[.06,6.43],[.07,6.4],[.001,6.39]],20,"z"),{p:[0,e,0]});for(let f=0;f<3;f++){const x=f/3*Math.PI*2+.5,_=bt(.016,.016,.42,8,"y");_.translate(0,.21,0),_.rotateZ(x),t.add("brass",_,{p:[0,e,6.43]}),t.add("brass",gn(.034,10,8),{p:[Math.sin(-x)*.42,e+Math.cos(x)*.42,6.43]})}t.add("steel",bt(.025,.025,.14,10,"z"),{p:[0,e,6.4]});for(let f=0;f<28;f++){const x=f/28*Math.PI*2;t.add("steel",bt(.024,.024,.03,8,"z"),{p:[Math.cos(x)*.86,e+Math.sin(x)*.86,6.34]})}for(const f of[-1,1])for(const x of[.44,-.44]){const _=[];for(let y=0;y<=8;y++){const w=y/8;_.push([f*(.88-w*.55),e+x*(1-w*.35),6.43-Math.sin(w*3)*.02])}t.add("black",le(_,.026,6,3)),t.add("steel",bt(.035,.035,.1,10,"y"),{p:[f*.88,e+x,6.38]})}t.add("steel",G(.04,.2,.025),{p:[.58,e,6.42]});const o=[.75,1.9,3.1,4.25,5.1];for(const f of o){const x=.845-(f-.55)*.012;t.add("brass",de([[x+.004,f-.045],[x+.022,f-.04],[x+.026,f],[x+.022,f+.04],[x+.004,f+.045]],56,"z"),{p:[0,e,0]})}const a=gn(.014,6,4);a.scale(1,1,.6);const c=[],l=(f,x,_,y=0,w=Math.PI*2)=>{for(let S=0;S<_;S++){const T=y+(w-y)*(S+.5)/_,C=a.clone();new Et().lookAt(new A,new A(Math.sin(T),Math.cos(T),0),new A(0,0,1)),C.applyMatrix4(new Et().makeRotationFromQuaternion(new xe().setFromUnitVectors(new A(0,0,1),new A(Math.sin(T),Math.cos(T),0)))),C.translate(Math.sin(T)*x,e+Math.cos(T)*x,f),c.push(C)}};for(const f of o)l(f-.03,.845-(f-.55)*.012+.02,54);l(4.875,.87,60),l(.62,.86,54),l(6.2,.868,60),c.forEach(f=>t.add("iron",f));const u=new cn;{const _=e+.9,y=.1;u.moveTo(-.93+y,1.28),u.lineTo(.93-y,1.28),u.quadraticCurveTo(.93,1.28,.93,1.28+y),u.lineTo(.93,_-y),u.quadraticCurveTo(.93,_,.93-y,_),u.lineTo(-.93+y,_),u.quadraticCurveTo(-.93,_,-.93,_-y),u.lineTo(-.93,1.28+y),u.quadraticCurveTo(-.93,1.28,-.93+y,1.28)}const h=Ei(u,3.1,.035);h.translate(0,0,-1),t.add("green",h),t.add("green",G(1.35,.1,2.2),{p:[0,e+.93,-1.05]}),t.add("brass",G(1.9,.045,.08),{p:[0,e+.9,.58]});for(let f=0;f<40;f++){const x=-2.45+f*.075;for(const _ of[-1,1])t.add("iron",a,{p:[_*.955,2,x]})}for(const f of[-.2,-1.2,-2.2])for(const x of[-1,1])t.add("brass",G(.012,1.4,.04),{p:[x*.968,2,f]});const p=de([[.001,3.38],[.34,3.4],[.3,3.46],[.21,3.54],[.17,3.64],[.165,3.9],[.175,4.12],[.2,4.2],[.235,4.25],[.235,4.28],[.19,4.3],[.15,4.26],[.15,4.2]],40,"y");p.translate(0,0,at.chimneyZ),t.add("black",p),t.add("copper",de([[.152,4.23],[.19,4.31],[.24,4.3],[.245,4.265],[.2,4.24]],40,"y"),{p:[0,0,at.chimneyZ]}),t.add("iron",de([[.001,4],[.15,4],[.15,4.26],[.001,4.26]],24,"y"),{p:[0,0,at.chimneyZ],s:[.98,1,.98]});const d=de([[.001,3.38],[.44,3.4],[.42,3.48],[.3,3.56],[.27,3.7],[.3,3.82],[.31,3.9],[.27,3.98],[.18,4.04],[.07,4.08],[.001,4.09]],40,"y");d.translate(0,0,2.2),t.add("brass",d),t.add("steel",de([[.42,3.4],[.47,3.4],[.47,3.43],[.42,3.46]],40,"y"),{p:[0,0,2.2]}),t.add("green",de([[.001,3.36],[.3,3.38],[.26,3.5],[.22,3.6],[.2,3.7],[.12,3.76],[.001,3.77]],32,"y"),{p:[0,0,.95]}),t.add("brass",de([[.2,3.62],[.22,3.64],[.22,3.68],[.2,3.7]],32,"y"),{p:[0,0,.95]}),t.add("brass",gn(.05,10,8),{p:[0,3.8,.95]});const m=de([[.001,3.5],[.2,3.5],[.2,3.56],[.12,3.6],[.1,3.78],[.12,3.8],[.13,3.9],[.11,3.96],[.06,4],[.001,4.02]],24,"y");t.add("brass",m,{p:[0,0,-.55]}),t.add("brass",m.clone(),{p:[0,0,-1.05]}),t.add("steel",G(.03,.04,1.35),{p:[0,3.84,-.8]}),t.add("brass",G(.5,.03,.3),{p:[0,3.52,-.8]}),t.add("steel",bt(.018,.018,.26,8,"y"),{p:[0,3.65,-1.5]}),t.add("brass",bt(.04,.04,.12,12,"y"),{p:[0,3.55,-1.5]}),t.add("brass",de([[.001,3.4],[.05,3.4],[.04,3.55],[.075,3.62],[.08,3.78],[.07,3.8],[.05,3.72],[.05,3.62],[.001,3.6]],20,"y"),{p:[-.28,0,.1],s:1}),t.add("brass",bt(.012,.012,.3,6,"y"),{p:[-.28,3.5,.1]});for(const f of[-1,1]){const _=[[f*.98,2.86,6],[f*.93,2.98,5.7],[f*.9,2.98,4.5],[f*.9,2.98,.7],[f*.98,2.98,-.1],[f*1.02,2.98,-1]];t.add("brass",le(_,.019,8,14));for(const y of[5.6,4.2,3,1.8,.9,.2]){const w=Math.acos((2.98-e)/.82),S=f*Math.sin(w)*.82;t.add("brass",bt(.012,.012,Math.abs(f*.9-S)+.02,6,"x"),{p:[(S+f*.9)/2,2.98,y]}),t.add("brass",gn(.032,10,8),{p:[f*.9,2.98,y]})}t.add("brass",le([[f*.5,3.35,6.38],[f*.2,3.5,6.4],[f*.2,3.5,6]],.014,6,4))}for(const f of[-1,1])t.add("copper",le([[f*.74,2.05,1.9],[f*.95,2,1.9],[f*1.06,1.85,1.2],[f*1.08,1.7,-.6]],.03,8,8)),t.add("brass",de([[.001,2],[.07,2],[.07,2.1],[.05,2.14],[.001,2.16]],14,"y"),{p:[f*.78,0,1.9]}),t.add("brass",bt(.055,.055,.12,12,"x"),{p:[f*.86,2.28,1.9]}),t.add("brass",gn(.06,12,8),{p:[f*.84,2.55,1.2]}),t.add("iron",le([[f*1,1.52,6.3],[f*1.05,1.5,2],[f*1.05,1.5,-3.8]],.022,8,10));for(const f of[-1,1])t.add("copper",le([[f*.86,3,5.4],[f*1.08,2.6,5.2],[f*1.1,2.1,5],[f*1,1.95,4.7]],.045,10,8)),t.add("brass",vn(.06,.016,6,14,"x"),{p:[f*1.09,2.4,5.1]});for(const f of[-1,1]){const x=G(.58,.05,7.6);t.add("black",x,{p:[f*1.12,2.05,2.3]}),t.add("red",G(.03,.2,7.6),{p:[f*1.42,1.96,2.3]}),t.add("cream",G(.012,.012,7.6),{p:[f*1.434,2,2.3]});for(let _=-1;_<=5.8;_+=1.1)t.add("iron",G(.04,.3,.05),{p:[f*.9,1.88,_]});t.add("brass",G(.18,.12,.2),{p:[f*1.12,2.14,5.6]}),t.add("brass",de([[.001,2.2],[.06,2.2],[.05,2.3],[.001,2.32]],12,"y"),{p:[f*1.12,0,5.6]}),t.add("copper",le([[f*1.12,2.15,5.5],[f*1.06,2,5.1],[f*1.02,1.7,4.9]],.012,6,6))}t.add("black",G(2.6,.045,.62),{p:[0,1.62,6.17]}),t.add("black",G(1.7,.6,1.4),{p:[0,1.65,5.55]}),t.add("red",G(2.7,.42,.12),{p:[0,1,at.bufferBeamZ]});for(const f of[-1,1]){t.add("iron",G(.1,.5,.22),{p:[f*.92,1,at.bufferBeamZ-.16]});for(let x=0;x<3;x++)t.add("iron",bt(.025,.025,.04,8,"z"),{p:[f*(1.1+x*.07),1.18-x*.12,at.bufferBeamZ+.07]});t.add("steel",bt(.11,.11,.42,20,"z"),{p:[f*.9,1,at.bufferBeamZ+.28]}),t.add("brass",vn(.112,.014,6,20,"z"),{p:[f*.9,1,at.bufferBeamZ+.07]}),t.add("steel",de([[.001,0],[.22,0],[.23,.02],[.23,.055],[.2,.075],[.001,.08]],28,"z"),{p:[f*.9,1,at.bufferBeamZ+.46]})}t.add("iron",G(.1,.12,.34),{p:[0,.94,at.bufferBeamZ+.2]}),t.add("iron",le([[0,.94,at.bufferBeamZ+.32],[0,.94,at.bufferBeamZ+.5],[0,.82,at.bufferBeamZ+.55]],.025,8,6)),t.add("steel",vn(.1,.018,6,20,"x"),{p:[0,.8,at.bufferBeamZ+.58]});for(const f of[-1,1]){const x=[];for(let _=0;_<=8;_++){const y=_/8;x.push([f*(.22-y*.18),.82-Math.sin(y*Math.PI)*.12,at.bufferBeamZ+.1+y*.4])}t.add("iron",le(x,.008,5,4))}t.add("iron",le([[.3,1,at.bufferBeamZ+.06],[.34,1.22,at.bufferBeamZ+.18],[.3,1.42,at.bufferBeamZ+.1]],.03,8,6)),t.add("brass",bt(.045,.045,.05,10,"y"),{p:[.3,1.45,at.bufferBeamZ+.1]});for(const f of[-1,1])t.add("iron",G(.1,.06,.1),{p:[f*1,1.24,at.bufferBeamZ+.02]});this.buildPilot(t),t.add("black",G(.34,.2,.3),{p:[0,3.5,6]}),t.add("black",G(.34,.36,.3),{p:[0,3.78,6]}),t.add("brass",de([[.001,0],[.16,0],[.17,.03],[.1,.1],[.04,.15],[.001,.16]],16,"y"),{p:[0,3.96,6]}),t.add("lamp",bt(.085,.085,.02,20,"z"),{p:[0,3.78,6.16]}),t.add("brass",vn(.09,.015,8,20,"z"),{p:[0,3.78,6.16]}),t.add("iron",G(.1,.24,.1),{p:[0,3.35,5.98]});for(const f of[-1,1])t.add("black",G(.22,.28,.2),{p:[f*1,1.42,at.bufferBeamZ+.04]}),t.add("brass",de([[.001,0],[.1,0],[.08,.1],[.001,.12]],12,"y"),{p:[f*1,1.56,at.bufferBeamZ+.04]}),t.add("glass",bt(.07,.07,.02,14,"z"),{p:[f*1,1.42,at.bufferBeamZ+.15]});for(const f of[-1,1]){t.add("black",G(.04,.55,10.3),{p:[f*.6,1.05,1.9]}),t.add("black",G(.04,.8,1),{p:[f*.6,.95,-3.7]});for(const x of at.driverZ){t.add("iron",G(.1,.36,.34),{p:[f*.64,1.02,x]}),t.add("iron",G(.08,.48,.1),{p:[f*.64,.8,x+.28]}),t.add("iron",G(.08,.48,.1),{p:[f*.64,.8,x-.28]});const _=le([[f*.66,1.24,x-.62],[f*.66,1.3,x-.3],[f*.66,1.32,x],[f*.66,1.3,x+.3],[f*.66,1.24,x+.62]],.022,6,10);t.add("steel",_),t.add("iron",bt(.012,.012,.26,6,"y"),{p:[f*.66,1.1,x-.62]}),t.add("iron",bt(.012,.012,.26,6,"y"),{p:[f*.66,1.1,x+.62]})}for(const x of at.driverZ){for(const _ of[-1,1])t.add("iron",G(.12,.14,.34),{p:[f*.87,.4,x+_*.82]}),t.add("iron",G(.035,.5,.05),{p:[f*.87,.7,x+_*.8]});t.add("iron",bt(.025,.025,1.8,6,"x"),{p:[0,.52,x+.82]})}for(const x of[2.15,0])t.add("brass",le([[f*.88,1.55,x+1],[f*.86,1,x+1.12],[f*.78,.15,x+1]],.02,6,6));t.add("iron",G(.04,.05,.3),{p:[f*1.4,1.1,-2.7]}),t.add("iron",G(.35,.04,.5),{p:[f*1.28,1.15,-2.9]}),t.add("iron",G(.35,.04,.5),{p:[f*1.28,.5,-2.9]}),t.add("iron",G(.03,.7,.04),{p:[f*1.28,.82,-2.65]}),t.add("iron",G(.03,.7,.04),{p:[f*1.28,.82,-3.15]})}t.add("black",G(1.2,.3,.1),{p:[0,1,3.7]}),t.add("black",G(1.2,.3,.1),{p:[0,1,-3.2]}),t.add("red",G(2.6,.38,.1),{p:[0,1.05,at.rearZ+.1]});for(const f of[-1,1])t.add("steel",G(.36,.3,.05),{p:[f*.9,1.05,at.rearZ-0]});t.add("iron",G(.24,.2,.3),{p:[0,.95,at.rearZ-.1]}),this.buildCylinders(t),this.buildCab(t);const v=this.mats,g=t.build(v);g.traverse(f=>{const x=f;x.isMesh&&(x.name==="glass"||x.name==="lamp"||x.name==="fire")&&(x.castShadow=!1)}),this.chassis.add(g)}buildPilot(t){const e=at.bufferBeamZ-.02,n=7.55,i=.74,r=.3,o=[[-1.2,i,e],[-.55,.66,7],[0,r+.1,n]],a=[[1.2,i,e],[.55,.66,7],[0,r+.1,n]];t.add("black",le(o,.04,8,8)),t.add("black",le(a,.04,8,8)),t.add("black",le([[-1.05,.5,e+.02],[-.45,.4,7],[0,r,n-.05]],.022,8,8)),t.add("black",le([[1.05,.5,e+.02],[.45,.4,7],[0,r,n-.05]],.022,8,8));for(let c=0;c<=12;c++){const l=c/12;for(const u of[-1,1]){const h=u*(1.18-l*1),p=e+l*.9,d=i-l*.1,m=.52-l*.2,v=bt(.018,.018,d-m,6,"y");t.add("black",v,{p:[h,(d+m)/2,p+.14+l*.4]})}}for(const c of[-1,1])t.add("iron",G(.05,.08,.5),{p:[c*1.15,.78,e+.25]});t.add("black",le([[0,i-.05,e],[0,.5,7.2],[0,r+.05,n-.02]],.02,6,6))}buildCylinders(t){const e=(at.cylRear+at.cylFront)/2,n=at.cylFront-at.cylRear,i=[];for(const r of[-1,1]){const o=r*ur;t.add("green",bt(.29,.29,n,36,"z"),{p:[o,at.yCyl,e]});for(const a of[at.cylRear+.1,at.cylFront-.1])t.add("brass",bt(.3,.3,.06,36,"z"),{p:[o,at.yCyl,a]});t.add("black",de([[.001,0],[.24,0],[.3,.03],[.29,.07],[.15,.13],[.001,.14]],28,"z"),{p:[o,at.yCyl,at.cylFront]}),t.add("steel",bt(.06,.06,.05,12,"z"),{p:[o,at.yCyl,at.cylFront+.16]}),t.add("black",de([[.001,0],[.26,0],[.27,-.03],[.1,-.1],[.07,-.18],[.001,-.18]],24,"z"),{p:[o,at.yCyl,at.cylRear]}),t.add("brass",bt(.065,.065,.1,14,"z"),{p:[o,at.yCyl,at.cylRear-.2]}),t.add("green",bt(.2,.2,n-.1,32,"z"),{p:[o,1.76,e]});for(const a of[at.cylRear+.08,at.cylFront-.08])t.add("brass",bt(.21,.21,.05,28,"z"),{p:[o,1.76,a]});t.add("black",G(.34,.3,n-.1),{p:[o,1.57,e]}),t.add("brass",bt(.05,.05,.12,12,"z"),{p:[o,1.76,at.cylRear-.05]});for(const a of[at.cylRear+.2,at.cylFront-.2])t.add("brass",bt(.03,.03,.14,8,"y"),{p:[o,at.yCyl-.35,a]}),i.push(new A(o,at.yCyl-.45,a));for(const a of[.115,-.115])t.add("steel",G(.04,.03,1.16),{p:[o,at.yCyl+a,3]});t.add("iron",G(.1,.4,.1),{p:[o,1.3,2.35]}),t.add("iron",G(.1,.4,.08),{p:[o,1.3,3]}),t.add("iron",G(.45,.1,1),{p:[r*.82,1.15,e]}),t.add("iron",G(.55,.06,.12),{p:[r*.88,1.52,1.35]}),t.add("brass",bt(.05,.05,.1,12,"x"),{p:[r*bi,1.52,1.35]}),t.add("iron",G(.08,.14,.18),{p:[o+r*0,1.76,3.45]})}this.anchors.cylCocks=i}buildCab(t){const r=2.7500000000000004,o=(-1.65+-4.4)/2;for(const l of[-1,1]){const u=new cn,h=1.5,p=3.48;u.moveTo(0,h),u.lineTo(r,h),u.lineTo(r,p-.2),u.quadraticCurveTo(r,p,r-.2,p),u.lineTo(.2,p),u.quadraticCurveTo(0,p,0,p-.2),u.lineTo(0,h);const d=new Ai,m=.5,v=r-.5,g=2.3,f=3.18,x=.1;d.moveTo(m+x,g),d.lineTo(v-x,g),d.quadraticCurveTo(v,g,v,g+x),d.lineTo(v,f-x),d.quadraticCurveTo(v,f,v-x,f),d.lineTo(m+x,f),d.quadraticCurveTo(m,f,m,f-x),d.lineTo(m,g+x),d.quadraticCurveTo(m,g,m+x,g),u.holes.push(d);const _=new Jn(u,{depth:.04,bevelEnabled:!0,bevelThickness:.006,bevelSize:.006,bevelSegments:1,curveSegments:6});_.translate(0,0,-.02);const y=new Et().makeBasis(new A(0,0,-1),new A(0,1,0),new A(-1,0,0));_.applyMatrix4(y),_.translate(l*1.3,0,-1.65),t.add("green",_);const w=new cn,S=.045;w.moveTo(m-S,g-S),w.lineTo(v+S,g-S),w.lineTo(v+S,f+S),w.lineTo(m-S,f+S),w.lineTo(m-S,g-S);const T=new Ai;T.moveTo(m,g),T.lineTo(m,f),T.lineTo(v,f),T.lineTo(v,g),T.lineTo(m,g),w.holes.push(T);const C=new Jn(w,{depth:.02,bevelEnabled:!1});C.applyMatrix4(y),C.translate(l*(1.3+l*.018),0,-1.65),t.add("brass",C);const b=E=>t.add("cream",G(.012,.025,r-.3),{p:[l*(1.3+l*.024),E,o]});b(1.62),b(3.36),t.add("cream",G(.012,1.7,.025),{p:[l*(1.3+l*.024),2.5,-1.65-.14]}),t.add("cream",G(.012,1.7,.025),{p:[l*(1.3+l*.024),2.5,-4.4+.14]}),t.add("glass",G(.01,.88,r-1),{p:[l*1.3,2.74,o]}),t.add("brass",G(.014,.03,r-.9),{p:[l*(1.3+l*.02),2.74,o]});const M=gn(.014,6,4);for(let E=0;E<24;E++)t.add("iron",M,{p:[l*(1.3+l*.028),1.58+E*.077,-1.65-.06]}),t.add("iron",M,{p:[l*(1.3+l*.028),1.58+E*.077,-4.4+.06]});t.add("brass",G(.014,.22,1),{p:[l*(1.3+l*.03),1.92,o]}),t.add("brass",le([[l*(1.3+l*.07),3.2,-1.65-.25],[l*(1.3+l*.1),3.2,-1.65-.28],[l*(1.3+l*.1),1.8,-1.65-.28],[l*(1.3+l*.07),1.8,-1.65-.25]],.014,6,4)),t.add("wood",G(.5,.05,.55),{p:[l*.98,1.95,-4.4+.45]}),t.add("iron",G(.04,.34,.04),{p:[l*1.18,1.77,-4.4+.45]})}{const l=new cn,u=1.5,h=3.48;l.moveTo(-1.3,u),l.lineTo(1.3,u),l.lineTo(1.3,h-.2),l.quadraticCurveTo(1.3,h,1.3-.2,h),l.lineTo(-1.3+.2,h),l.quadraticCurveTo(-1.3,h,-1.3,h-.2),l.lineTo(-1.3,u);for(const d of[-.8,.8]){const m=new Ai;m.absarc(d,2.95,.2,0,Math.PI*2,!0),l.holes.push(m)}const p=new Jn(l,{depth:.05,bevelEnabled:!1,curveSegments:20});p.translate(0,0,-1.65-.1),t.add("green",p);for(const d of[-.8,.8])t.add("brass",vn(.215,.028,8,28,"z"),{p:[d,2.95,-1.65-.045]}),t.add("glass",bt(.2,.2,.01,24,"z"),{p:[d,2.95,-1.65-.075]})}{const l=new cn,u=24,h=3.4,p=.38,d=1.42;for(let v=0;v<=u;v++){const g=-1+2*v/u,f=g*d,x=h+p*(1-g*g);v===0?l.moveTo(f,x):l.lineTo(f,x)}for(let v=u;v>=0;v--){const g=-1+2*v/u;l.lineTo(g*(d-.04),h-.05+(p-.01)*(1-g*g))}const m=Ei(l,3.2,.012);m.translate(0,0,o-.05),t.add("cream",m);for(let v=0;v<9;v++){const g=-1.5999999999999999-v*.37,f=new cn,x=20;for(let _=0;_<=x;_++){const y=-1+2*_/x,w=y*(d+.01),S=h+.025+p*(1-y*y);_===0?f.moveTo(w,S):f.lineTo(w,S)}for(let _=x;_>=0;_--){const y=-1+2*_/x;f.lineTo(y*(d+.01),h+0+p*(1-y*y))}t.add("black",Ei(f,.03,0),{p:[0,0,g]})}t.add("brass",de([[.001,3.78],[.14,3.78],[.12,3.85],[.09,3.96],[.001,3.99]],20,"y"),{p:[0,0,o-.1]}),t.add("black",bt(.06,.06,.1,12,"y"),{p:[0,3.74,o-.1]});for(const v of[-1,1])t.add("iron",G(.03,.03,3.2),{p:[v*1.4,3.37,o-.05]});t.add("black",G(.1,.12,.1),{p:[0,3.86,-1.65+.15]})}t.add("footplate",G(2.6,.06,3.1),{p:[0,1.52,o-.15]});for(let l=0;l<8;l++)t.add("wood",G(.55,.025,.32),{p:[l%2?.34:-.34,1.56,-1.65-.25-l*.34]});t.add("wood",G(2.2,.06,.5),{p:[0,2.1,-4.4+.05]}),t.add("iron",G(2,.05,.05),{p:[0,2.06,-4.4+.32]}),t.add("leather",bt(.09,.09,2.5,12,"x"),{p:[0,3.34,-4.4+.03]});const a=-2.56;t.add("black",G(1.7,1.7,.06),{p:[0,2.35,a]}),t.add("green",G(1.7,.08,.1),{p:[0,3.22,a-.02]}),t.add("iron",Ei(Gc(.52,.42,.08),.06,.01),{p:[0,1.86,a-.06]}),t.add("brass",vn(.2,.016,8,24,"z"),{p:[0,1.86,a-.105],s:[1.1,.85,1]}),t.add("fire",G(.3,.2,.01),{p:[0,1.86,a-.04]}),t.add("iron",G(.32,.03,.03),{p:[0,2.1,a-.12]}),t.add("steel",bt(.02,.02,.22,8,"x"),{p:[0,2.15,a-.14]}),t.add("brass",bt(.025,.025,.7,10,"x"),{p:[-.25,3,a-.12]}),t.add("brass",bt(.018,.018,.45,8,"y"),{p:[-.58,3.22,a-.12]}),t.add("wood",gn(.04,10,8),{p:[-.58,3.47,a-.12]});for(const[l,u,h]of[[.32,3.05,.12],[.62,3.05,.1],[-.18,2.62,.075]])t.add("brass",vn(h,.016,8,20,"z"),{p:[l,u,a-.1]}),t.add("dial",bt(h,h,.012,20,"z"),{p:[l,u,a-.075]}),t.add("steel",G(.01,h*.8,.008),{p:[l,u+h*.2,a-.095],r:[0,0,.8]});for(const l of[-.72,.72])t.add("brass",bt(.028,.028,.66,10,"y"),{p:[l,2.65,a-.1]}),t.add("glass",bt(.02,.02,.5,8,"y"),{p:[l,2.65,a-.12]}),t.add("brass",bt(.04,.04,.06,10,"y"),{p:[l,2.98,a-.1]}),t.add("brass",bt(.04,.04,.06,10,"y"),{p:[l,2.32,a-.1]});for(let l=0;l<6;l++){const u=-.65+l*.26;t.add("brass",bt(.018,.018,.1,6,"z"),{p:[u,2.5,a-.1]}),t.add("brass",vn(.05,.011,6,12,"z"),{p:[u,2.5,a-.16]})}t.add("copper",le([[-.9,2.8,a-.05],[.9,2.8,a-.05]],.026,8,4)),t.add("steel",G(.03,1.2,.03),{p:[-1,2.1,a-.5],r:[.28,0,0]}),t.add("iron",Ei(Gc(.5,.16,.05),.025,0),{p:[-1,1.7,a-.7]}),t.add("brass",gn(.035,10,8),{p:[-1,2.65,a-.63]}),t.add("steel",bt(.02,.02,.9,8,"y"),{p:[1,2,a-.4]}),t.add("wood",bt(.028,.028,.35,8,"x"),{p:[1,2.45,a-.4]}),t.add("iron",G(.02,1,.02),{p:[.55,2,a-.4],r:[0,0,.12]}),t.add("iron",G(.2,.01,.22),{p:[.52,1.52,a-.4]}),t.add("brass",le([[-.28,3.4,.1],[-.5,3.3,-.5],[-.58,3.3,a-.12]],.006,4,6)),t.add("brass",de([[.001,0],[.06,0],[.05,.12],[.001,.14]],10,"y"),{p:[.9,3.24,-1.65-.3]});const c=new He(5);for(let l=0;l<24;l++)t.add("coal",gn(c.range(.03,.06),5,4),{p:[c.range(-.3,.9),1.6,c.range(a-.9,a-.4)]})}buildRunningGear(){const t=br(),e=new lt().setRGB(.055,.29,.16,ae),n=Sr({radius:at.driverR,spokes:18,hubR:.22,crank:{r:at.crankR,right:0,left:-Math.PI/2,len:.38,boss:.1},counterweight:!0,axleR:.11},e),i=[];for(const a of at.driverZ){const c=new pe;c.position.set(0,at.driverR,a),this.root.add(c),i.push(c),this.driverSets.push(c)}this.batches.push(new $n(n,t,i));const r=[];for(const a of[-1,1]){const c=a>0?0:-Math.PI/2,l=hr+.05,u=G(.025,.07,l);u.translate(0,0,l/2-.03),u.applyMatrix4(new Et().makeRotationX(c)),u.translate(a*bi,at.crankR*Math.cos(c),at.crankR*Math.sin(c)),r.push({geo:u,color:ju,metal:1,rough:.4});const h=bt(.05,.05,.05,12,"x");h.translate(a*(bi+.02),at.crankR*Math.cos(c)-hr*Math.sin(c),at.crankR*Math.sin(c)+hr*Math.cos(c)),r.push({geo:h,color:vr,metal:1,rough:.3})}const o=new pe;o.position.set(0,at.driverR,0),this.root.add(o),this.driverSets.push(o),this.batches.push(new $n(mn(r),t,[o])),this.buildRods()}buildRods(){const t=br(),e=M=>{const E=new pe;return E.position.x=M,this.chassis.add(E),E},n=(M,E,D,N=0)=>{const I=bt(M,M,E,16,"x");return I.translate(0,N,D),{geo:I,color:vr,metal:1,rough:.28}},i=M=>({geo:M,color:Zu,metal:1,rough:.24}),r=(M,E)=>{const D=e(E),N=e(-E);return this.batches.push(new $n(M,t,[D,N])),[D,N]},o=r(mn([i(Rs(at.mainRod,.26,.17,.045,.05)),n(.092,.06,0),n(.062,.06,at.mainRod)]),ur),a=r(mn([i(Rs(2.15,.17,.17,.035,.05)),n(.075,.045,0),n(.075,.045,2.15)]),Xh),c=r(mn([i(Rs(2.15,.17,.17,.035,.05)),n(.075,.045,0),n(.075,.045,2.15)]),Xh),l=G(.1,.24,.3),u=G(.06,.12,.22);u.translate(0,0,-.2);const h=G(.03,.2,.05);h.translate(0,-.14,.14);const p=mn([i(l),i(u),i(h),n(.05,.12,0)]),d=r(p,ur),m=bt(.03,.03,at.pistonRod,14,"z");m.translate(0,0,at.pistonRod/2);const v=bt(.045,.045,.03,14,"z"),g=r(mn([i(m),{geo:v,color:vr,metal:1,rough:.3}]),ur),f=r(mn([i(Rs(1.46,.07,.07,.03,.025,!1)),n(.04,.035,0),n(.04,.035,1.46)]),bi+.05),x=new cn;{x.moveTo(-.045,-.32),x.lineTo(.045,-.32),x.lineTo(.045,.32),x.lineTo(-.045,.32),x.lineTo(-.045,-.32);const D=new Ai;D.moveTo(-.014,-.26),D.lineTo(.014,-.26),D.lineTo(.014,.24),D.lineTo(-.014,.24),D.lineTo(-.014,-.26),x.holes.push(D)}const _=new Jn(x,{depth:.03,bevelEnabled:!1});_.translate(0,0,-.015),hl(_);const y=r(mn([i(_),n(.045,.05,0)]),bi+.02),w=r(mn([{geo:G(.05,.05,.026),color:vr,metal:1,rough:.3}]),bi+.02),S=r(mn([i(Rs(1.5,.05,.05,.025,.018,!1))]),bi+.03),T=r(mn([i(Rs(.6,.06,.05,.025,.018,!1))]),bi+.01),C=bt(.022,.022,1,10,"z");C.translate(0,0,.5);const b=r(mn([i(C)]),ur);[1,-1].forEach((M,E)=>{this.sides.push({s:M,main:o[E],coupF:a[E],coupR:c[E],crosshead:d[E],pistonRod:g[E],eccRod:f[E],link:y[E],radRod:S[E],lever:T[E],valveRod:b[E],dieBlock:w[E],beta:0,stroke:0})});for(const M of this.sides)for(const E of[M.main,M.coupF,M.coupR,M.crosshead,M.pistonRod,M.eccRod,M.link,M.radRod,M.lever,M.valveRod,M.dieBlock])E.position.x=M.s*Math.abs(E.position.x)}buildBogies(){const t=this.mats,e=br(),n=new lt().setRGB(.055,.29,.16,ae),i=new ns;for(const l of[-1,1]){i.add("black",G(.04,.3,2.7),{p:[l*.62,.78,0]});for(const u of[-.95,.95])i.add("iron",G(.12,.26,.3),{p:[l*.66,.66,u]}),i.add("steel",le([[l*.7,1,u-.5],[l*.7,1.06,u],[l*.7,1,u+.5]],.02,6,8));i.add("iron",G(.05,.1,1.9),{p:[l*.62,1,0]})}i.add("black",G(1.3,.14,.28),{p:[0,.82,0]}),i.add("iron",bt(.12,.12,.24,14,"y"),{p:[0,.97,0]}),i.add("iron",G(1.3,.1,.1),{p:[0,.6,.95]}),i.add("iron",G(1.3,.1,.1),{p:[0,.6,-.95]}),this.bogie.add(i.build(t));const r=Sr({radius:at.bogieR,spokes:12,hubR:.13,axleR:.07},n),o=[];for(const l of[-.95,.95]){const u=new pe;u.position.set(0,at.bogieR,l),this.bogie.add(u),o.push(u),this.bogieSets.push(u)}this.batches.push(new $n(r,e,o));const a=new ns;for(const l of[-1,1])a.add("black",G(.04,.3,1.4),{p:[l*.62,.78,0]}),a.add("iron",G(.12,.26,.3),{p:[l*.66,.66,0]}),a.add("steel",le([[l*.7,1,-.55],[l*.7,1.08,0],[l*.7,1,.55]],.02,6,8));this.trailing.add(a.build(t));const c=new pe;c.position.set(0,at.trailR,0),this.trailing.add(c),this.trailSet=c,this.batches.push(new $n(Sr({radius:at.trailR,spokes:12,hubR:.14,axleR:.07},n),e,[c]))}update(t,e,n,i){this.theta=t;for(const o of this.driverSets)o.rotation.x=t;for(const o of this.bogieSets)o.rotation.x=t*(at.driverR/at.bogieR);this.trailSet.rotation.x=t*(at.driverR/at.trailR);for(const o of this.sides){const a=t+(o.s>0?0:-Math.PI/2),c=Math.sin(a),l=Math.cos(a),h=at.driverR+at.crankR*l,p=[0,1,2].map(se=>at.driverZ[se]+at.crankR*c),d={y:h,z:p[1]},m=d.y-at.yCyl,v=d.z+Math.sqrt(at.mainRod*at.mainRod-m*m),g=(se,U,it,J,Q)=>{se.position.y=U,se.position.z=it,se.rotation.x=Math.atan2(-(J-U),Q-it)};g(o.main,d.y,d.z,at.yCyl,v),g(o.coupF,h,p[1],h,p[0]),g(o.coupR,h,p[2],h,p[1]),o.crosshead.position.set(o.crosshead.position.x,at.yCyl,v),o.pistonRod.position.set(o.pistonRod.position.x,at.yCyl,v),o.stroke=(v-2.43)/.64;const f=h-hr*c,x=p[1]+hr*l,_=1.52,y=1.35,w=.3,S=1.46,T=x-y,C=f-_,b=Math.hypot(T,C),M=(w*w+b*b-S*S)/(2*w*b),E=Math.acos(Math.max(-1,Math.min(1,M))),D=Math.atan2(C,T),N=[D+E,D-E];let I=N[0],F=1e9;for(const se of N){const U=Math.cos(se),it=Math.sin(se),J=Math.abs(Math.atan2(U,-it)-o.beta);J<F&&(F=J,I=se)}const z=y+w*Math.cos(I),X=_+w*Math.sin(I),k=Math.atan2(Math.cos(I),-Math.sin(I));o.beta=k,g(o.eccRod,f,x,X,z),o.link.position.set(o.link.position.x,_,y),o.link.rotation.x=-k;const K=.1,rt=_+K*Math.cos(k),Z=y-K*Math.sin(k);o.dieBlock.position.set(o.dieBlock.position.x,rt,Z),o.dieBlock.rotation.x=-k;const mt=1.616,Vt=1.2,Zt=1.72,Kt=.8,$=1.5,st=Z+Math.sqrt(Math.max(.01,$*$-(mt-rt)*(mt-rt)));g(o.radRod,rt,Z,mt,st);const wt=v+.14,Lt=wt+(st-wt)/Kt,Rt=o.lever,ee=Math.hypot(Lt-wt,Zt-Vt);Rt.position.set(Rt.position.x,Vt,wt),Rt.rotation.x=Math.atan2(-.52,Lt-wt),Rt.scale.z=ee/.6,o.valveRod.position.set(o.valveRod.position.x,Zt,Lt)}const r=.8+.2*Math.sin(i*13)*Math.sin(i*7.3+1);this.fireLight.intensity=e*7*r,this.fireMat.color.setRGB(1*(.9+.1*r),.34*r,.07),this.headLight.intensity=n?35:0,this.glow.visible=n,this.lampMat.visible=!0,this.lampMat.color.setRGB(n?5.5:.5,n?3.6:.4,n?1.6:.3)}}function Ku(s,t=1024,e=192,n={}){const i=document.createElement("canvas");i.width=t,i.height=e;const r=i.getContext("2d");r.clearRect(0,0,t,e);const o=Math.floor(e*.62);r.font=n.font??`600 ${o}px "Cormorant Garamond", Georgia, "Times New Roman", serif`,r.textAlign="center",r.textBaseline="middle",n.letterSpacing!==void 0&&(r.letterSpacing=`${n.letterSpacing}px`),n.shadow!==!1&&(r.fillStyle="rgba(30,8,4,0.85)",r.fillText(s,t/2+4,e/2+5));const a=r.createLinearGradient(0,e*.2,0,e*.8);n.gold!==!1?(a.addColorStop(0,"#fff0b0"),a.addColorStop(.45,"#e2b13c"),a.addColorStop(1,"#8a5a12")):(a.addColorStop(0,"#ffffff"),a.addColorStop(1,"#d8d0b8")),r.fillStyle=a,r.fillText(s,t/2,e/2),r.lineWidth=2,r.strokeStyle="rgba(60,30,6,0.7)",r.strokeText(s,t/2,e/2);const c=new Su(i);return c.colorSpace=ae,c.anisotropy=8,c.needsUpdate=!0,c}function Ju(s){return new _e({map:s,transparent:!0,alphaTest:.04,roughness:.35,metalness:.6,depthWrite:!1,polygonOffset:!0,polygonOffsetFactor:-2,polygonOffsetUnits:-2})}const Yn={wheelR:.58,axles:[-1.85,0,1.85],bodyHalf:3.3,frontBufferZ:3.55,rearBufferZ:-3.55};class Px{root=new Ne;body=new Ne;sets=[];batches=[];mats;constructor(t){this.mats=t??$u(),this.root.add(this.body),this.buildBody(),this.buildRunning()}buildBody(){const t=new ns,e=new He(77),n=1.25,i=Yn.bodyHalf,r=Gc(2*n,1.45,.1),o=Ei(r,2*i,.02);o.translate(0,1.7,0),t.add("green",o),t.add("black",G(2*n-.1,.18,2*i-.1),{p:[0,.98,0]}),t.add("green",G(2*n-.1,.05,3.55),{p:[0,2.43,-1.4]});for(const v of[-1,1])t.add("green",G(.06,.62,3),{p:[v*(n-.04),2.64,1.8]}),t.add("brass",G(.09,.03,3.02),{p:[v*(n-.04),2.97,1.8]});t.add("green",G(2*n-.1,.9,.06),{p:[0,2.85,i-.05]}),t.add("brass",G(2*n-.1,.03,.09),{p:[0,3.3,i-.05]}),t.add("green",G(2*n-.1,.42,.05),{p:[0,2.62,.32]});for(const v of[-.7,.7])t.add("iron",vn(.12,.012,6,14,"z"),{p:[v,3.05,i-.13]});t.add("iron",G(.025,.025,1.5),{p:[.2,3.08,i-.5]});const a=new Mn(1,4),c=a.attributes.position,l=new A;for(let v=0;v<c.count;v++){l.fromBufferAttribute(c,v);const f=1+(Ht.n3(l.x*3.2,l.y*3.2,l.z*3.2)*.12+Ht.n3(l.x*9,l.y*9,l.z*9)*.04);c.setXYZ(v,l.x*f*1.1,Math.max(l.y,-.1)*f*.55,l.z*f*1.4)}a.computeVertexNormals(),t.add("coal",a,{p:[0,2.42,1.85],s:[1,1,1.1]});const u=new il(.07,0);for(let v=0;v<160;v++){const g=e.range(-1.05,1.05),f=e.range(.4,3.2),x=2.42+.55*Math.max(0,1-Math.pow(Math.abs(g)/1.1,2))*Math.max(0,1-Math.pow((f-1.85)/1.5,2))+.05,_=wx(u.clone(),.05,v+1);t.add("coal",_,{p:[g,x,f],r:[e.range(0,6),e.range(0,6),e.range(0,6)],s:[e.range(.6,1.5),e.range(.5,1.2),e.range(.6,1.4)]})}t.add("brass",de([[.001,2.46],[.34,2.46],[.33,2.52],[.26,2.58],[.001,2.6]],24,"y"),{p:[0,0,-1.55]}),t.add("steel",vn(.34,.02,6,28,"y"),{p:[0,2.48,-1.55]}),t.add("iron",G(.04,.06,.4),{p:[0,2.62,-1.55]});for(const v of[-1,1])t.add("wood",G(.45,.22,1.2),{p:[v*.82,2.58,-2.4]}),t.add("brass",G(.03,.03,1.22),{p:[v*.82,2.7,-2.4]});for(const v of[-1,1]){const g=v*(n+.006),f=(_,y,w,S)=>{t.add("cream",G(.01,.02,w),{p:[g,y-S/2,_]}),t.add("cream",G(.01,.02,w),{p:[g,y+S/2,_]}),t.add("cream",G(.01,S,.02),{p:[g,y,_-w/2]}),t.add("cream",G(.01,S,.02),{p:[g,y,_+w/2]})};f(0,1.7,6,1.15),f(0,1.7,5.8,1);for(const _ of[-2.9,-1,1,2.9])t.add("green",G(.014,1.3,.1),{p:[g,1.7,_]});const x=gn(.014,6,4);for(let _=0;_<70;_++)t.add("iron",x,{p:[g+v*.004,1.02,-3.15+_*.09]}),t.add("iron",x,{p:[g+v*.004,2.38,-3.15+_*.09]});t.add("brass",le([[v*1.28,2.4,-3],[v*1.34,2.4,-3],[v*1.34,1.2,-3],[v*1.28,1.2,-3]],.014,6,4))}const h=(v,g)=>{t.add("red",G(2.6,.42,.12),{p:[0,1,v]});for(const f of[-1,1])t.add("steel",bt(.11,.11,.4,20,"z"),{p:[f*.9,1,v+g*.26]}),t.add("steel",de([[.001,0],[.22,0],[.23,.02],[.23,.055],[.2,.075],[.001,.08]],28,"z"),{p:[f*.9,1,v+g*.42],s:[1,1,g]}),t.add("iron",G(.1,.5,.2),{p:[f*.9,1,v-g*.14]})};h(Yn.frontBufferZ-.12,1),h(Yn.rearBufferZ+.12,-1),t.add("iron",G(.12,.1,.5),{p:[0,.95,3.7]}),t.add("iron",G(.1,.12,.34),{p:[0,.94,-3.75]}),t.add("steel",vn(.1,.018,6,20,"x"),{p:[0,.8,-4.1]}),t.add("iron",le([[0,.94,-3.9],[0,.94,-4],[0,.82,-4.05]],.025,8,6));for(const v of[-1,1]){const g=[];for(let f=0;f<=8;f++){const x=f/8;g.push([v*(.22-x*.18),.82-Math.sin(x*Math.PI)*.12,-3.62-x*.4])}t.add("iron",le(g,.008,5,4))}t.add("iron",le([[.32,1,-3.65],[.36,1.25,-3.8],[.3,1.45,-3.7]],.03,8,6)),t.add("brass",bt(.045,.045,.05,10,"y"),{p:[.3,1.48,-3.7]}),t.add("iron",G(.12,.08,.12),{p:[0,1.35,-3.68]}),t.add("black",G(.2,.26,.18),{p:[0,1.5,-3.73]}),t.add("lamp",G(.1,.12,.01),{p:[0,1.5,-3.83]}),t.add("iron",bt(.025,.025,1.1,8,"y"),{p:[-1,3.3,2.9]}),t.add("iron",vn(.2,.014,8,24,"y"),{p:[-1,3.8,2.9]}),t.add("brass",gn(.04,8,6),{p:[-1,3.85,2.9]}),t.add("iron",bt(.02,.02,.9,8,"y"),{p:[1,2.9,2.9]}),t.add("wood",bt(.03,.03,.3,8,"x"),{p:[1,3.35,2.9]});for(const v of[-1,1]){t.add("black",G(.05,.5,6.9),{p:[v*.64,1,0]});for(const g of Yn.axles)t.add("iron",G(.12,.34,.32),{p:[v*.7,.85,g]}),t.add("steel",le([[v*.72,1.15,g-.6],[v*.72,1.22,g-.2],[v*.72,1.24,g],[v*.72,1.22,g+.2],[v*.72,1.15,g+.6]],.02,6,8)),t.add("iron",bt(.012,.012,.3,6,"y"),{p:[v*.72,1,g-.6]}),t.add("iron",bt(.012,.012,.3,6,"y"),{p:[v*.72,1,g+.6]});for(const g of[-.93,.93,-2.78,2.78])t.add("iron",G(.1,.14,.34),{p:[v*.88,.5,g+(g>0?-0:0)]}),t.add("iron",G(.03,.5,.05),{p:[v*.88,.78,g]})}for(const v of[-.93,.93])t.add("iron",bt(.025,.025,1.8,6,"x"),{p:[0,.5,v]});t.add("iron",G(1.3,.2,.15),{p:[0,1,0]});const p=t.build(this.mats);p.traverse(v=>{const g=v;g.isMesh&&(g.name==="glass"||g.name==="lamp")&&(g.castShadow=!1)}),this.body.add(p);const d=Ku("HIGHLAND  RAILWAY",1024,160,{letterSpacing:6}),m=Ju(d);for(const v of[-1,1]){const g=new ue(new Ui(3.6,.56),m);g.position.set(v*(n+.012),1.7,0),g.rotation.y=v*Math.PI/2,this.body.add(g)}for(const v of[-1,1])for(const g of[-2.35,2.35]){const f=new ue(new jo(.2,24),new _e({color:new lt().setRGB(.62,.05,.05,ae),metalness:.2,roughness:.4}));f.position.set(v*(n+.011),1.7,g),f.rotation.y=v*Math.PI/2,this.body.add(f);const x=new ue(new Ur(.2,.014,8,28),this.mats.brass);x.position.set(v*(n+.012),1.7,g),x.rotation.y=v*Math.PI/2,this.body.add(x)}}buildRunning(){const t=new lt().setRGB(.055,.29,.16,ae),e=Sr({radius:Yn.wheelR,spokes:14,hubR:.15,axleR:.075},t),n=[];for(const i of Yn.axles){const r=new pe;r.position.set(0,Yn.wheelR,i),this.root.add(r),n.push(r),this.sets.push(r)}this.batches.push(new $n(e,br(),n))}update(t){for(const e of this.sets)e.rotation.x=t}}const ce={bodyHalf:7.5,beamZ:7.62,bufferTip:8.1,bogieZ:5.2,bogieAxle:1.2,wheelR:.5,halfW:1.31};function No(s,t,e,n,i=[],r=.05,o=.04){const a=new cn;a.moveTo(s,e),a.lineTo(t,e),a.lineTo(t,n),a.lineTo(s,n),a.lineTo(s,e);for(const[l,u,h,p]of i){const d=new Ai;d.moveTo(l+o,u),d.lineTo(h-o,u),d.quadraticCurveTo(h,u,h,u+o),d.lineTo(h,p-o),d.quadraticCurveTo(h,p,h-o,p),d.lineTo(l+o,p),d.quadraticCurveTo(l,p,l,p-o),d.lineTo(l,u+o),d.quadraticCurveTo(l,u,l+o,u),a.holes.push(d)}const c=new Jn(a,{depth:r,bevelEnabled:!1,curveSegments:4});return c.translate(0,0,-r/2),hl(c)}function wo(s,t,e,n,i,r){return No(s-i,t+i,e-i,n+i,[[s,e,t,n]],r,0)}class Dx{mats;built;labels=new Map;constructor(){this.mats=Rx(),this.built=this.buildAll()}buildAll(){const t=new ns,e=ce.halfW,n=ce.bodyHalf,i=[-6,-3,0,3,6],r=[];for(const d of i)r.push([d-1.17,2.12,d-.07,2.98]),r.push([d+.2,2.15,d+.96,2.98]);for(const d of[-1,1]){t.add("lake",No(-n,n,.86,2.04,[],.05),{p:[d*e,0,0]}),t.add("cream",No(-n,n,2.04,3.2,r,.05),{p:[d*e,0,0]}),t.add("gold",G(.03,.025,2*n),{p:[d*(e+.02),2.04,0]}),t.add("gold",G(.03,.02,2*n),{p:[d*(e+.02),.92,0]}),t.add("timber",G(.05,.07,2*n+.1),{p:[d*(e+0),3.22,0]}),t.add("timber",G(.06,.1,2*n+.05),{p:[d*(e+.01),.84,0]});for(const m of i){const v=m+.12,g=m+1.04;t.add("lake",No(v,g,.9,2.02,[],.02),{p:[d*(e+.03),0,0]}),t.add("gold",wo(v+.07,g-.07,1,1.92,.012,.01),{p:[d*(e+.045),0,0]}),t.add("timber",wo(m+.2,m+.96,2.15,2.98,.035,.07),{p:[d*(e+0),0,0]}),t.add("timber",wo(m-1.17,m-.07,2.12,2.98,.035,.07),{p:[d*(e+0),0,0]}),t.add("under",G(.03,2.2,.012),{p:[d*(e+.03),2,v]}),t.add("under",G(.03,2.2,.012),{p:[d*(e+.03),2,g]}),t.add("brass",bt(.015,.015,.16,8,"z"),{p:[d*(e+.07),2.05,v+.08]}),t.add("brass",gn(.03,8,6),{p:[d*(e+.07),2.05,v+.02]});for(const f of[1,2,2.9])t.add("iron",G(.025,.07,.14),{p:[d*(e+.045),f,g-.07]});t.add("brass",le([[d*(e+.03),3.05,g+.12],[d*(e+.1),3.05,g+.12],[d*(e+.1),1.2,g+.12],[d*(e+.03),1.2,g+.12]],.014,6,3)),t.add("glass",G(.012,.83,.76),{p:[d*(e-.01),2.565,m+.58]}),t.add("glass",G(.012,.86,1.1),{p:[d*(e-.01),2.55,m-.62]}),t.add("leather",G(.02,.22,.04),{p:[d*(e+.045),2.82,m+.58]}),t.add("timber",G(.04,.86,.035),{p:[d*(e+0),2.55,m-.62]}),t.add("iron",G(.04,.2,.05),{p:[d*(e+.18),.62,m+.3]}),t.add("iron",G(.04,.2,.05),{p:[d*(e+.18),.62,m+.88]});for(let f=0;f<4;f++)t.add("timber",G(.02,.02,.5),{p:[d*(e+.03),3.07+f*.025,m+.58]})}t.add("timber",G(.28,.04,2*n-.3),{p:[d*(e+.18),.66,0]}),t.add("iron",G(.02,.025,2*n-.3),{p:[d*(e+.32),.66,0]}),t.add("iron",bt(.02,.02,.2,6,"y"),{p:[d*(e+.05),3.3,7.3]})}for(const d of[-1,1]){t.add("lake",G(2*e,2.33,.05),{p:[0,2.04,d*(n+0)]}),t.add("gold",wo(-.9,.9,1.2,2.9,.012,.01).applyMatrix4(new Et),{p:[0,0,d*(n+.04)],r:[0,Math.PI/2,0]}),t.add("iron",G(.1,.07,.12),{p:[0,3,d*(n+.08)]}),t.add("iron",G(.1,.07,.12),{p:[.8,1.4,d*(n+.08)]}),t.add("iron",G(.1,.07,.12),{p:[-.8,1.4,d*(n+.08)]});for(const m of[-1,1])t.add("brass",le([[m*1.15,3.1,d*(n+.1)],[m*1.15,1,d*(n+.1)]],.014,6,2));t.add("red",G(2.64,.4,.1),{p:[0,.98,d*ce.beamZ]}),t.add("iron",G(2.5,.14,.12),{p:[0,.74,d*(ce.beamZ-.05)]});for(const m of[-1,1])t.add("steel",bt(.1,.1,.38,18,"z"),{p:[m*.9,.98,d*(ce.beamZ+.24)]}),t.add("steel",de([[.001,0],[.2,0],[.21,.02],[.21,.05],[.18,.07],[.001,.075]],24,"z"),{p:[m*.9,.98,d*(ce.beamZ+.4)],s:[1,1,d]}),t.add("iron",G(.1,.46,.2),{p:[m*.9,.98,d*(ce.beamZ-.12)]});t.add("iron",G(.1,.1,.4),{p:[0,.92,d*(ce.beamZ+.16)]}),t.add("steel",vn(.09,.016,6,18,"x"),{p:[0,.8,d*(ce.beamZ+.42)]}),t.add("steel",bt(.02,.02,.5,8,"z"),{p:[0,.8,d*(ce.beamZ+.3)]});for(const m of[-1,1]){const v=[];for(let g=0;g<=8;g++){const f=g/8;v.push([m*(.24-f*.2),.84-Math.sin(f*Math.PI)*.11,d*(ce.beamZ+.05+f*.4)])}t.add("iron",le(v,.008,5,4))}t.add("iron",le([[.34,.95,d*(ce.beamZ+.02)],[.36,1.2,d*(ce.beamZ+.18)],[.3,1.38,d*(ce.beamZ+.12)]],.028,8,6)),t.add("rubber",le([[-.34,.95,d*(ce.beamZ+.02)],[-.38,1.12,d*(ce.beamZ+.22)],[-.3,1.34,d*(ce.beamZ+.15)]],.036,8,6)),t.add("brass",bt(.05,.05,.05,10,"y"),{p:[-.3,1.38,d*(ce.beamZ+.15)]}),t.add("brass",bt(.045,.045,.05,10,"y"),{p:[.3,1.4,d*(ce.beamZ+.12)]})}{const f=new cn;for(let _=0;_<=28;_++){const y=-1+2*_/28,w=y*1.4,S=3.18+.5*Math.sqrt(Math.max(0,1-y*y*.96));_===0?f.moveTo(w,S):f.lineTo(w,S)}for(let _=28;_>=0;_--){const y=-1+2*_/28;f.lineTo(y*(1.4-.05),3.18-.04+(.5-.01)*Math.sqrt(Math.max(0,1-y*y*.96)))}const x=Ei(f,2*n+.5,.01);t.add("roof",x);for(let _=0;_<=30;_++){const y=-n-.2+_*(2*n+.4)/30,w=new cn,S=22;for(let T=0;T<=S;T++){const C=-1+2*T/S,b=3.18+.012+.5*Math.sqrt(Math.max(0,1-C*C*.96));T===0?w.moveTo(C*1.4,b):w.lineTo(C*1.4,b)}for(let T=S;T>=0;T--){const C=-1+2*T/S;w.lineTo(C*1.4,3.18-.01+.5*Math.sqrt(Math.max(0,1-C*C*.96)))}t.add("roof",Ei(w,.025,0),{p:[0,.003,y]})}for(const _ of[-1,1])t.add("iron",G(.04,.05,2*n+.5),{p:[_*1.4,3.16,0]});for(const _ of i)t.add("steel",de([[.001,-.38],[.07,-.34],[.1,-.2],[.11,0],[.1,.2],[.07,.34],[.001,.38]],14,"y").rotateX(Math.PI/2),{p:[0,3.18+.5+.07,_]}),t.add("iron",G(.18,.06,.07),{p:[0,3.18+.5+.01,_-.18]}),t.add("iron",G(.18,.06,.07),{p:[0,3.18+.5+.01,_+.18]}),t.add("brass",de([[.001,0],[.08,0],[.07,.07],[.05,.13],[.001,.15]],12,"y"),{p:[0,3.18+.5-.02,_+1.1]}),t.add("iron",bt(.045,.045,.1,10,"y"),{p:[0,3.18+.5-.04,_+1.1]});t.add("brass",de([[.001,0],[.08,0],[.07,.07],[.05,.13],[.001,.15]],12,"y"),{p:[0,3.18+.5-.02,-n+.5]})}for(const d of[-1,1])t.add("interior",G(.02,1.2,2*n-.1),{p:[d*(e-.06),2.6,0]});t.add("interior",G(2*e-.1,.04,2*n-.1),{p:[0,3.2,0]}),t.add("timber",G(2*e-.1,.06,2*n-.1),{p:[0,.97,0]});for(const d of i){for(const m of[-1.5,1.5]){if(m>0&&d===6){t.add("interior",G(2*e-.14,2.3,.04),{p:[0,2.1,d+m]});continue}t.add("interior",G(2*e-.14,2.3,.04),{p:[0,2.1,d+m]})}for(const m of[-1,1])for(const v of[-1,1]){const g=d+v*1;t.add("seat",G(.62,.28,1),{p:[m*.78,1.28,g-v*0]}),t.add("seat",G(.14,.9,1),{p:[m*1.08,1.8,g]})}t.add("lampGlow",gn(.11,12,8),{p:[0,3.05,d]}),t.add("brass",bt(.03,.03,.12,8,"y"),{p:[0,3.14,d]});for(const m of[-1,1])t.add("brass",le([[m*1.2,2.55,d-1.2],[m*1.2,2.55,d+1.2]],.012,6,2)),t.add("brass",le([[m*.9,2.5,d-1.2],[m*.9,2.5,d+1.2]],.012,6,2))}t.add("under",G(2.42,.1,2*n),{p:[0,.8,0]});for(const d of[-1,1]){t.add("iron",G(.08,.22,2*n+.2),{p:[d*1.18,.74,0]}),t.add("iron",le([[d*1,.7,-6.8],[d*1,.38,-2.6],[d*1,.38,2.6],[d*1,.7,6.8]],.022,8,14));for(const m of[-2.6,2.6])t.add("iron",G(.05,.36,.08),{p:[d*1,.55,m]})}t.add("iron",bt(.22,.22,1.1,16,"z"),{p:[0,.5,.4]}),t.add("steel",bt(.05,.05,.5,8,"z"),{p:[0,.5,-.5]});for(const d of[-1,1]){t.add("under",bt(.2,.2,3.2,16,"z"),{p:[d*.55,.5,4.2]}),t.add("under",bt(.2,.2,3.2,16,"z"),{p:[d*.55,.5,-4.2]});for(const m of[2.7,5.7,-2.7,-5.7])t.add("iron",G(.07,.07,.2),{p:[d*.55,.28,m]})}t.add("under",G(1.2,.3,.8),{p:[-.4,.55,-1.8]}),t.add("under",G(.9,.3,.6),{p:[.5,.55,-1.8]}),t.add("iron",le([[.34,.8,-7.7],[.34,.8,7.7]],.026,8,4));const o=[];for(const d of[-1,1])for(const m of i){const v=new Ui(.5,.3);v.rotateY(d*Math.PI/2),v.translate(d*(e+.045),1.45,m+.58),o.push(Fr(v))}const a=Ii(o),c={};for(const d of t.keys())c[d]=t.merged(d);const l=new ns,u=ce.bogieAxle;for(const d of[-1,1]){l.add("under",G(.05,.3,2*u+.5),{p:[d*.62,.72,0]}),l.add("iron",G(.04,.12,2*u+.6),{p:[d*.62,.9,0]});for(const m of[-u,u])l.add("iron",G(.12,.3,.3),{p:[d*.68,.6,m]}),l.add("steel",le([[d*.72,.86,m-.5],[d*.72,.93,m-.2],[d*.72,.95,m],[d*.72,.93,m+.2],[d*.72,.86,m+.5]],.018,6,8)),l.add("iron",bt(.012,.012,.3,6,"y"),{p:[d*.72,.78,m-.5]}),l.add("iron",bt(.012,.012,.3,6,"y"),{p:[d*.72,.78,m+.5]}),l.add("iron",G(.1,.13,.3),{p:[d*.86,.38,m+(m>0?.55:-.55)]})}l.add("under",G(1.3,.12,.28),{p:[0,.8,0]}),l.add("iron",bt(.12,.12,.2,12,"y"),{p:[0,.92,0]}),l.add("iron",G(1.3,.08,.1),{p:[0,.5,u+.6]}),l.add("iron",G(1.3,.08,.1),{p:[0,.5,-u-.6]});const h={};for(const d of l.keys())h[d]=l.merged(d);const p=Sr({radius:ce.wheelR,spokes:12,hubR:.14,axleR:.075},new lt().setRGB(.05,.05,.055,ae));return{statics:c,bogieStatics:h,wheelPacked:p,decals:a}}labelMaterial(t){let e=this.labels.get(t);return e||(e=Ju(Ku(t,256,160,{letterSpacing:2})),this.labels.set(t,e)),e}batches(t){const e=[],n=this.built,i=this.mats,r=t.map(l=>l.body);for(const l of Object.keys(n.statics)){const u=l==="glass"||l==="interior"||l==="lampGlow";e.push(new $n(n.statics[l],i[l],r,!u))}const o=new Map;t.forEach(l=>{const u=o.get(l.label)??[];u.push(l.body),o.set(l.label,u)});for(const[l,u]of o)e.push(new $n(n.decals,this.labelMaterial(l),u,!1));const a=t.flatMap(l=>[l.bogieF,l.bogieR]);for(const l of Object.keys(n.bogieStatics))e.push(new $n(n.bogieStatics[l],i[l],a,!0));const c=t.flatMap(l=>l.wheelNodes);return e.push(new $n(n.wheelPacked,br(),c,!0)),e}create(t){return new Ix(t)}}class Ix{constructor(t){this.label=t,this.root.add(this.body);for(const e of[this.bogieF,this.bogieR])for(const n of[-1.2,ce.bogieAxle]){const i=new pe;i.position.set(0,ce.wheelR,n),e.add(i),this.wheelNodes.push(i)}}label;body=new pe;root=new pe;bogieF=new pe;bogieR=new pe;wheelNodes=[];update(t){for(const e of this.wheelNodes)e.rotation.x=t}}const Lx=.05,Wa=.18,Ux=kn(),Nx=kn();kn();const dr=new A,fr=new A,qh=new A,Yh=new Et,Zh=new A;function Yi(s,t,e){dr.subVectors(t.p,e.p).normalize(),fr.addVectors(t.u,e.u).normalize(),fr.addScaledVector(dr,-dr.dot(fr)).normalize(),qh.crossVectors(fr,dr).normalize(),Yh.makeBasis(qh,fr,dr),s.quaternion.setFromRotationMatrix(Yh),Zh.addVectors(t.p,e.p).multiplyScalar(.5),s.position.copy(Zh)}class Fx{constructor(t,e=4){this.track=t,this.loco=new Cx,this.tender=new Px;const n=new Dx,i=["FIRST","THIRD","THIRD","BRAKE"];this.group.add(this.loco.root,this.loco.bogie,this.loco.trailing,this.tender.root);let r=at.rearZ-Lx-3.85;this.offsets.tender=r,r=r-3.85-Wa-ce.bufferTip;for(let o=0;o<e;o++){const a=n.create(i[o%i.length]);this.coaches.push(a),this.group.add(a.root,a.bogieF,a.bogieR),this.offsets.coaches.push(r),r-=ce.bufferTip*2+Wa}this.vehicles.push({obj:this.loco.root,hx:1.75,y1:4.5,z0:-4.9,z1:7.6}),this.vehicles.push({obj:this.tender.root,hx:1.7,y1:4.1,z0:-4.1,z1:4.1});for(const o of this.coaches)this.vehicles.push({obj:o.root,hx:1.75,y1:3.95,z0:-8.3,z1:8.3});this.batches.push(...this.loco.batches,...this.tender.batches,...n.batches(this.coaches));for(const o of this.batches)this.group.add(o.mesh);this.length=at.frontZ-(r+ce.bufferTip*2+Wa-ce.bufferTip),this.state.s=0,this.layout(0,0)}track;group=new Ne;loco;tender;coaches=[];state={s:0,speed:0,wheelAngle:0,chuffs:0,jointHits:0};locoFrame=kn();offsets={tender:0,coaches:[]};dist=0;batches=[];paused=!1;targetSpeed=8.5;length=0;vehicles=[];lastChuffPhase=0;lastJoint=0;f(t,e){return this.track.frame(t,e)}update(t,e){const n=this.state,i=this.paused?0:this.targetSpeed;n.speed+=(i-n.speed)*Math.min(1,t*1.2),Math.abs(n.speed)<.002&&(n.speed=0);const r=n.speed*t;n.s=this.track.wrap(n.s+r),this.dist+=r,n.wheelAngle+=r/at.driverR;const o=Math.floor(n.wheelAngle/(Math.PI/2));o>this.lastChuffPhase&&(n.chuffs+=o-this.lastChuffPhase),this.lastChuffPhase=o;const a=Math.floor((this.dist+at.driverZ[0])/18.3);a>this.lastJoint&&(n.jointHits+=a-this.lastJoint),this.lastJoint=a,this.layout(this.dist,e)}layout(t,e){const n=this.state,i=n.s;this.track;const r=Ux,o=Nx,a=Math.min(1,n.speed/8),c=(h,p)=>Math.sin(t*2*Math.PI/18.3+h)*p*a+Math.sin(t*1.7+h*2.1)*p*.5*a,l=(h,p)=>Math.sin(t*.9+h)*p*a;this.f(i+at.driverZ[0],r),this.f(i+at.driverZ[2],o),Yi(this.loco.root,r,o),this.loco.chassis.position.y=c(.4,.004),this.loco.chassis.rotation.z=l(.2,.0012),this.f(i,this.locoFrame),this.f(i+at.bogieZ[1]+0,r),this.f(i+at.bogieZ[0],o),Yi(this.loco.bogie,r,o),this.f(i+at.trailZ+.6,r),this.f(i+at.trailZ-.6,o),Yi(this.loco.trailing,r,o);const u=i+this.offsets.tender;this.f(u+Yn.axles[2],r),this.f(u+Yn.axles[0],o),Yi(this.tender.root,r,o),this.tender.body.position.y=c(1.3,.006),this.tender.body.rotation.z=l(1.1,.002),this.loco.update(n.wheelAngle,1,!0,e),this.tender.update(t/Yn.wheelR),this.coaches.forEach((h,p)=>{const d=i+this.offsets.coaches[p];this.f(d+ce.bogieZ,r),this.f(d-ce.bogieZ,o),Yi(h.root,r,o),h.body.position.y=c(2.2+p*1.7,.007),h.body.rotation.z=l(2+p*1.3,.0025),this.f(d+ce.bogieZ+ce.bogieAxle,r),this.f(d+ce.bogieZ-ce.bogieAxle,o),Yi(h.bogieF,r,o),this.f(d-ce.bogieZ+ce.bogieAxle,r),this.f(d-ce.bogieZ-ce.bogieAxle,o),Yi(h.bogieR,r,o),h.update(t/ce.wheelR)});for(const h of this.batches)h.update()}_inv=new Et;_lp=new A;pushOut(t,e=1.2){let n=!1;for(const i of this.vehicles){i.obj.updateMatrixWorld();const r=i.obj.matrixWorld,o=t.x-r.elements[12],a=t.z-r.elements[14];if(o*o+a*a>196*1.4)continue;this._inv.copy(r).invert();const c=this._lp.copy(t).applyMatrix4(this._inv),l=i.hx+e,u=i.y1+e,h=i.z0-e,p=i.z1+e;if(c.y<-.8||c.y>u||c.x<-l||c.x>l||c.z<h||c.z>p)continue;const d=[l-c.x,c.x+l,u-c.y,c.z-h,p-c.z];let m=0;for(let v=1;v<d.length;v++)d[v]<d[m]&&(m=v);m===0?c.x=l:m===1?c.x=-l:m===2?c.y=u:m===3?c.z=h:c.z=p,t.copy(c).applyMatrix4(r),n=!0}return n}setDistance(t){this.state.s=this.track.wrap(t),this.layout(this.dist,0)}frameAt(t,e){return this.track.frame(this.state.s+t,e)}}const zx=`
attribute vec3 aPos;
attribute vec4 aData;   // x: age01, y: size, z: seed, w: opacity
attribute vec2 aRot;    // x: rotation, y: tint seed
varying vec2 vUv; varying float vAge; varying float vSeed; varying float vOpac; varying float vTint;
varying vec3 vSunView;
uniform vec3 uSunView;
#include <fog_pars_vertex>
void main(){
  vUv = position.xy * 2.0;
  vAge = aData.x; vSeed = aData.z; vOpac = aData.w; vTint = aRot.y;
  vSunView = uSunView;
  vec4 mvPosition = viewMatrix * vec4(aPos, 1.0);
  float c = cos(aRot.x), s = sin(aRot.x);
  vec2 q = vec2(c * position.x - s * position.y, s * position.x + c * position.y) * aData.y;
  mvPosition.xy += q;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`,Ox=`
uniform vec3 uLit; uniform vec3 uShade; uniform vec3 uAgeTint;
uniform float uOpacity; uniform float uFadeIn; uniform float uSimple;
varying vec2 vUv; varying float vAge; varying float vSeed; varying float vOpac; varying float vTint;
varying vec3 vSunView;
#include <fog_pars_fragment>
float h21(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(h21(i), h21(i+vec2(1,0)), f.x), mix(h21(i+vec2(0,1)), h21(i+vec2(1,1)), f.x), f.y); }
float fbm(vec2 p){ float s = 0.0, a = 0.5; for(int i=0;i<4;i++){ s += a*vn(p); p = p*2.1 + 3.7; a *= 0.5; } return s; }
void main(){
  float r2 = dot(vUv, vUv);
  if (r2 > 1.0) discard;
  if (uSimple > 0.5) {
    float soft = (1.0 - r2) * (1.0 - r2);
    float nn = vn(vUv * 1.3 + vSeed * 31.0);
    float a = soft * (0.55 + 0.6 * nn) * pow(1.0 - vAge, 1.2) * smoothstep(0.0, uFadeIn, vAge) * vOpac * uOpacity;
    if (a < 0.002) discard;
    float lit = clamp(dot(normalize(vec3(vUv, 0.6)), normalize(vSunView)) * 0.5 + 0.55, 0.0, 1.0);
    gl_FragColor = vec4(mix(uShade, uLit, lit), a);
    #include <fog_fragment>
    return;
  }
  vec2 p = vUv * 1.7 + vec2(vSeed * 17.0, vSeed * 5.0);
  float n = fbm(p + vAge * 0.8);
  float n2 = fbm(p * 2.3 - 4.0 - vAge * 0.4);
  float body = smoothstep(1.0, 0.15, r2 + (n - 0.5) * 0.95 + (n2 - 0.5) * 0.4 + vAge * 0.35);
  float alpha = body * pow(1.0 - vAge, 1.35) * vOpac * uOpacity;
  alpha *= smoothstep(0.0, uFadeIn, vAge);
  if (alpha < 0.003) discard;
  // fake sphere normal in view space for sun shading
  vec3 N = normalize(vec3(vUv, sqrt(max(0.0, 1.0 - r2))));
  float lit = clamp(dot(N, normalize(vSunView)) * 0.55 + 0.5, 0.0, 1.0);
  lit = mix(lit, 0.75, 0.25 * (n - 0.5) + 0.2);
  vec3 col = mix(uShade, uLit, lit);
  col = mix(col, col * uAgeTint, smoothstep(0.0, 1.0, vAge) * 0.8);
  col *= 0.88 + 0.24 * vTint;
  // warm rim where the sun grazes the puff edge
  col += vec3(1.0, 0.7, 0.4) * pow(1.0 - r2, 2.0) * lit * 0.08;
  gl_FragColor = vec4(col, alpha);
  #include <fog_fragment>
}`;class Xa{constructor(t){this.cfg=t,this.ps=Array.from({length:t.max},()=>({x:0,y:0,z:0,vx:0,vy:0,vz:0,age:1,life:1,s0:1,s1:1,rot:0,spin:0,seed:0,op:1,tint:0,alive:!1})),this.depth=new Float32Array(t.max);const e=new Ui(1,1);this.geo=new V0,this.geo.index=e.index,this.geo.setAttribute("position",e.attributes.position),this.geo.setAttribute("uv",e.attributes.uv),this.aPos=new ts(new Float32Array(t.max*3),3),this.aData=new ts(new Float32Array(t.max*4),4),this.aRot=new ts(new Float32Array(t.max*2),2);for(const i of[this.aPos,this.aData,this.aRot])i.setUsage(Ps);this.geo.setAttribute("aPos",this.aPos),this.geo.setAttribute("aData",this.aData),this.geo.setAttribute("aRot",this.aRot),this.geo.instanceCount=0,this.uniforms=Hs.merge([Mt.fog,{uLit:{value:t.lit},uShade:{value:t.shade},uAgeTint:{value:t.ageTint},uOpacity:{value:t.opacity},uFadeIn:{value:t.fadeIn},uSimple:{value:t.simple?1:0},uSunView:{value:new A}}]);const n=new Be({vertexShader:zx,fragmentShader:Ox,uniforms:this.uniforms,transparent:!0,depthWrite:!1,fog:!0});this.mesh=new ue(this.geo,n),this.mesh.frustumCulled=!1,this.mesh.renderOrder=10}cfg;mesh;ps;n=0;cursor=0;geo;aPos;aData;aRot;order=[];depth;uniforms;wind=new A(1.4,0,.8);emit(t,e,n,i,r,o,a,c,l,u=1,h=.3,p=0){let d=0,m=this.cursor;for(;this.ps[m].alive&&d<this.cfg.max;)m=(m+1)%this.cfg.max,d++;d>=this.cfg.max&&(m=this.cursor),this.cursor=(m+1)%this.cfg.max;const v=this.ps[m];v.x=t,v.y=e,v.z=n,v.vx=i,v.vy=r,v.vz=o,v.age=p,v.life=l,v.s0=a,v.s1=c,v.rot=Math.random()*6.283,v.spin=(Math.random()-.5)*h*2,v.seed=Math.random(),v.op=u,v.tint=Math.random(),v.alive=!0}get count(){return this.n}update(t,e,n){const i=this.cfg,r=e.position,o=new A().copy(en).transformDirection(e.matrixWorldInverse);this.uniforms.uSunView.value.copy(o);let a=0;const c=this.order;c.length=0;for(let p=0;p<i.max;p++){const d=this.ps[p];if(!d.alive)continue;if(d.age+=t/d.life,d.age>=1){d.alive=!1;continue}const m=Math.exp(-i.drag*t),v=d.age,g=i.turbulence,f=this.wind.x+Math.sin(n*.7+d.y*.35+d.seed*9)*g,x=this.wind.z+Math.cos(n*.6+d.x*.3+d.seed*5)*g;d.vx=(d.vx-f)*m+f,d.vz=(d.vz-x)*m+x,d.vy=d.vy*m+i.buoyancy*t*(1-.5*v),d.x+=d.vx*t,d.y+=d.vy*t,d.z+=d.vz*t,d.rot+=d.spin*t,c.push(p),this.depth[p]=(d.x-r.x)*(d.x-r.x)+(d.y-r.y)*(d.y-r.y)+(d.z-r.z)*(d.z-r.z)}c.sort((p,d)=>this.depth[d]-this.depth[p]);const l=this.aPos.array,u=this.aData.array,h=this.aRot.array;for(const p of c){const d=this.ps[p],m=d.s0+(d.s1-d.s0)*Math.pow(d.age,i.growthPow);l[a*3]=d.x,l[a*3+1]=d.y,l[a*3+2]=d.z,u[a*4]=d.age,u[a*4+1]=m,u[a*4+2]=d.seed,u[a*4+3]=d.op,h[a*2]=d.rot,h[a*2+1]=d.tint,a++}this.n=a,this.geo.instanceCount=a,this.aPos.needsUpdate=!0,this.aData.needsUpdate=!0,this.aRot.needsUpdate=!0}}class Bx{constructor(t=700,e=38){this.radius=e,this.n=t,this.pos=new Float32Array(t*3),this.seeds=new Float32Array(t);for(let r=0;r<t;r++)this.pos[r*3]=(Math.random()-.5)*2*e,this.pos[r*3+1]=(Math.random()-.5)*2*e*.6,this.pos[r*3+2]=(Math.random()-.5)*2*e,this.seeds[r]=Math.random();const n=new me;n.setAttribute("position",new Ae(new Float32Array(t*3),3)),n.setAttribute("aSeed",new Ae(this.seeds,1));const i=new Be({uniforms:this.u,transparent:!0,depthWrite:!1,blending:wr,vertexShader:`
        attribute float aSeed; uniform float uTime; uniform float uSize;
        varying float vA;
        void main(){
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mv;
          float d = -mv.z;
          gl_PointSize = uSize * (2.0 + 2.5 * aSeed) * (260.0 / max(d, 1.0)) * 0.5;
          float tw = 0.5 + 0.5 * sin(uTime * (0.6 + aSeed) + aSeed * 40.0);
          vA = tw * smoothstep(60.0, 8.0, d) * smoothstep(0.5, 3.0, d);
        }`,fragmentShader:`
        varying float vA;
        void main(){
          vec2 c = gl_PointCoord - 0.5;
          float r = length(c) * 2.0;
          float a = smoothstep(1.0, 0.0, r);
          gl_FragColor = vec4(vec3(1.0, 0.86, 0.6) * a * vA * 0.9, a * vA);
        }`});this.points=new Qf(n,i),this.points.frustumCulled=!1,this.points.renderOrder=11}radius;points;pos;seeds;n;u={uTime:{value:0},uSun:{value:en.clone()},uSize:{value:1}};update(t,e,n){this.u.uTime.value=n;const i=this.points.geometry.attributes.position.array,r=this.radius;for(let o=0;o<this.n;o++){const a=this.seeds[o];this.pos[o*3]+=Math.sin(n*.3+a*20)*.12*t+.35*t,this.pos[o*3+1]+=(Math.sin(n*.4+a*11)*.15+.02)*t,this.pos[o*3+2]+=Math.cos(n*.25+a*7)*.12*t+.2*t;for(let c=0;c<3;c++){const l=e.getComponent(c);let u=this.pos[o*3+c]-l;const h=c===1?r*.6:r,p=h*2;u=((u+h)%p+p)%p-h,this.pos[o*3+c]=l+u,i[o*3+c]=l+u}}this.points.geometry.attributes.position.needsUpdate=!0}}const hi=(s,t,e)=>new lt().setRGB(s,t,e,ae),Ct=(s,t)=>s+Math.random()*(t-s);class kx{constructor(t,e,n,i){this.train=t,this.water=e,this.land=n,this.smoke=new Xa({max:i.smoke,lit:hi(.56,.53,.5),shade:hi(.07,.07,.08),opacity:.9,buoyancy:1.1,drag:.55,growthPow:.62,turbulence:.45,fadeIn:.05,ageTint:hi(1.1,1.08,1.05)}),this.steam=new Xa({max:Math.round(i.smoke*1.15),lit:hi(1,.98,.94),shade:hi(.62,.68,.76),opacity:.72,buoyancy:.5,drag:.9,growthPow:.5,turbulence:.35,fadeIn:.04,ageTint:hi(1,1,1)}),this.mist=new Xa({max:i.mist,lit:hi(.97,.93,.86),shade:hi(.62,.7,.8),opacity:.2,buoyancy:0,drag:.2,growthPow:.9,turbulence:.25,fadeIn:.25,ageTint:hi(1,1,1),simple:!0}),this.mistMax=i.mist,this.motes=new Bx(i.motes,38),this.group.add(this.mist.mesh,this.smoke.mesh,this.steam.mesh,this.motes.points),this.seedMist()}train;water;land;group=new Ne;smoke;steam;mist;motes;lastChuffs=0;tSafety=14;safetyLeft=0;cockLeft=7;tCock=40;injector=0;leak=0;whistle=!1;whistleFx=0;events={steamBurst:0,whistle:!1};tmp=new A;tmp2=new A;sprayT=0;fireTick=0;mistT=0;mistMax=90;emitMist(t){const e=this.land.river,n=e[Math.floor(Math.random()*Math.min(e.length-1,620))],i=n.x+Ct(-70,70),r=n.z+Ct(-40,40),o=this.land.fastHeight(i,r)+Ct(3,11);this.mist.emit(i,o,r,Ct(.2,.7),0,Ct(.1,.5),Ct(40,60),Ct(70,110),Ct(45,90),Ct(.6,1),.02,t)}seedMist(){for(let t=0;t<Math.round(this.mistMax*.78);t++)this.emitMist(Math.random()*.8)}dispose(){for(const t of[this.smoke.mesh,this.steam.mesh,this.mist.mesh])t.geometry.dispose(),t.material.dispose();this.motes.points.geometry.dispose(),this.motes.points.material.dispose()}anchor(t,e){return e.copy(t).applyMatrix4(this.train.loco.root.matrixWorld)}update(t,e,n){const i=this.train,r=i.state,o=i.loco;o.root.updateMatrixWorld(!0),this.events.steamBurst=0;const a=1.3+Math.sin(e*.13)*.5,c=.7+Math.cos(e*.11)*.4;for(const v of[this.smoke,this.steam,this.mist])v.wind.set(a*(v===this.mist?.3:1),0,c*(v===this.mist?.3:1));const l=i.locoFrame.t,u=this.tmp2.copy(l).multiplyScalar(r.speed),h=r.chuffs,p=Math.min(6,h-this.lastChuffs);this.lastChuffs=h;const d=Math.min(1,r.speed/8.5),m=this.anchor(o.anchors.chimney,new A);for(let v=0;v<p;v++){const g=(h-v)%2===0?1:.75,f=3;for(let x=0;x<f;x++){const _=Ct(-.12,.12),y=Ct(-.12,.12),w=Ct(3.2,5.6)*g*(.7+.5*d),S=.82;this.smoke.emit(m.x+_,m.y+x*.15,m.z+y,u.x*S+Ct(-.6,.6),w,u.z*S+Ct(-.6,.6),Ct(.35,.55)*g,Ct(3.6,6.4)*(.8+.3*g),Ct(5.5,8.5),Ct(.62,.9),.5)}this.steam.emit(m.x,m.y+.1,m.z,u.x*.85,Ct(3,5),u.z*.85,.3,Ct(1.4,2.2),Ct(.9,1.5),.55,.5)}if(r.speed<1.2&&Math.random()<t*12&&this.smoke.emit(m.x,m.y,m.z,Ct(-.2,.2),Ct(1.5,2.5),Ct(-.2,.2),.3,2.6,Ct(4,6),.35,.3),this.tCock-=t,this.tCock<=0&&(this.cockLeft=5+Math.random()*3,this.tCock=38+Math.random()*30),this.cockLeft>0&&(this.cockLeft-=t,this.events.steamBurst=Math.max(this.events.steamBurst,.45),p>0))for(const v of o.anchors.cylCocks){const g=this.anchor(v,new A);v.x>0;const f=i.locoFrame.r.x,x=i.locoFrame.r.z,_=v.x>0?-1:1;for(let y=0;y<2;y++)this.steam.emit(g.x,g.y,g.z,u.x*.5+f*_*Ct(1.4,2.8),Ct(.2,1.1),u.z*.5+x*_*Ct(1.4,2.8),.2,Ct(1.1,1.9),Ct(.9,1.6),.7,.5)}if(this.tSafety-=t,this.tSafety<=0&&(this.safetyLeft=3.5+Math.random()*1.5,this.tSafety=32+Math.random()*28),this.safetyLeft>0){this.safetyLeft-=t,this.events.steamBurst=Math.max(this.events.steamBurst,1);const v=this.anchor(o.anchors.safety[0],new A);let f=70*t;for(;f>0&&!(f<1&&Math.random()>f);){f-=1;const x=Ct(7,11),_=Ct(0,6.28),y=Ct(0,.35);this.steam.emit(v.x+Math.cos(_)*.1+Ct(-.1,.1),v.y+Ct(0,.3),v.z+Math.sin(_)*.1+Ct(-.1,.1),u.x*.7+Math.cos(_)*y*3,x,u.z*.7+Math.sin(_)*y*3,.35,Ct(3.5,6),Ct(1.6,2.6),.85,.4)}}if(this.whistle){this.whistleFx+=t;const v=this.anchor(o.anchors.whistle,new A);let g=55*t;for(;g>0&&!(g<1&&Math.random()>g);)g-=1,this.steam.emit(v.x,v.y,v.z,u.x*.8+Ct(-.6,.6),Ct(3,6),u.z*.8+Ct(-.6,.6),.2,Ct(1.5,2.8),Ct(1.1,1.8),.8,.4)}else this.whistleFx=0;if(this.events.whistle=this.whistle,this.injector+=t,this.injector>.16){this.injector=0;for(const v of o.anchors.injector)if(Math.random()<.6){const g=this.anchor(v,new A);this.steam.emit(g.x,g.y,g.z,u.x*.4+Ct(-.2,.2),Ct(-.1,.4),u.z*.4+Ct(-.2,.2),.15,Ct(.7,1.3),Ct(.8,1.4),.4,.3)}}if(this.leak+=t,this.leak>.35){this.leak=0;const v=i.coaches[Math.floor(Math.random()*i.coaches.length)];v&&Math.random()<.7&&(this.tmp.set(Ct(-.4,.4),.85,Math.random()<.5?7.7:-7.7),v.root.updateMatrixWorld(),this.tmp.applyMatrix4(v.root.matrixWorld),this.steam.emit(this.tmp.x,this.tmp.y,this.tmp.z,u.x*.5,Ct(.2,.8),u.z*.5,.12,Ct(.6,1),Ct(.9,1.4),.3,.3))}if(this.sprayT+=t,this.sprayT>.04){this.sprayT=0;const v=this.water.fallsBase;for(let g=0;g<2;g++)this.steam.emit(v.x+Ct(-4,4),v.y+Ct(0,1.5),v.z+Ct(-3,3)+3,Ct(-.4,.8),Ct(1.5,4.5),Ct(.2,1.4),Ct(1.5,3),Ct(7,13),Ct(4,7),.28,.1);if(Math.random()<.3){const g=this.water.rapids;this.steam.emit(g.x+Ct(-2,2),g.y+.2,g.z+Ct(-2,2),.1,Ct(.5,1.3),Ct(.2,.8),Ct(.8,1.4),Ct(3,5),Ct(2.5,4),.2,.1)}}for(this.mistT+=t;this.mistT>.7;)this.mistT-=.7,this.emitMist(0);this.smoke.update(t,n,e),this.steam.update(t,n,e),this.mist.update(t,n,e),this.motes.update(t,n.position,e)}}const jh={type:"change"},dl={type:"start"},Qu={type:"end"},To=new Zo,$h=new wi,Vx=Math.cos(70*Oo.DEG2RAD),Oe=new A,an=2*Math.PI,Te={NONE:-1,ROTATE:0,DOLLY:1,PAN:2,TOUCH_ROTATE:3,TOUCH_PAN:4,TOUCH_DOLLY_PAN:5,TOUCH_DOLLY_ROTATE:6},qa=1e-6;class Hx extends G0{constructor(t,e=null){super(t,e),this.state=Te.NONE,this.target=new A,this.cursor=new A,this.minDistance=0,this.maxDistance=1/0,this.minZoom=0,this.maxZoom=1/0,this.minTargetRadius=0,this.maxTargetRadius=1/0,this.minPolarAngle=0,this.maxPolarAngle=Math.PI,this.minAzimuthAngle=-1/0,this.maxAzimuthAngle=1/0,this.enableDamping=!1,this.dampingFactor=.05,this.enableZoom=!0,this.zoomSpeed=1,this.enableRotate=!0,this.rotateSpeed=1,this.keyRotateSpeed=1,this.enablePan=!0,this.panSpeed=1,this.screenSpacePanning=!0,this.keyPanSpeed=7,this.zoomToCursor=!1,this.autoRotate=!1,this.autoRotateSpeed=2,this.keys={LEFT:"ArrowLeft",UP:"ArrowUp",RIGHT:"ArrowRight",BOTTOM:"ArrowDown"},this.mouseButtons={LEFT:Ls.ROTATE,MIDDLE:Ls.DOLLY,RIGHT:Ls.PAN},this.touches={ONE:Cs.ROTATE,TWO:Cs.DOLLY_PAN},this.target0=this.target.clone(),this.position0=this.object.position.clone(),this.zoom0=this.object.zoom,this._domElementKeyEvents=null,this._lastPosition=new A,this._lastQuaternion=new xe,this._lastTargetPosition=new A,this._quat=new xe().setFromUnitVectors(t.up,new A(0,1,0)),this._quatInverse=this._quat.clone().invert(),this._spherical=new lh,this._sphericalDelta=new lh,this._scale=1,this._panOffset=new A,this._rotateStart=new tt,this._rotateEnd=new tt,this._rotateDelta=new tt,this._panStart=new tt,this._panEnd=new tt,this._panDelta=new tt,this._dollyStart=new tt,this._dollyEnd=new tt,this._dollyDelta=new tt,this._dollyDirection=new A,this._mouse=new tt,this._performCursorZoom=!1,this._pointers=[],this._pointerPositions={},this._controlActive=!1,this._onPointerMove=Wx.bind(this),this._onPointerDown=Gx.bind(this),this._onPointerUp=Xx.bind(this),this._onContextMenu=Jx.bind(this),this._onMouseWheel=Zx.bind(this),this._onKeyDown=jx.bind(this),this._onTouchStart=$x.bind(this),this._onTouchMove=Kx.bind(this),this._onMouseDown=qx.bind(this),this._onMouseMove=Yx.bind(this),this._interceptControlDown=Qx.bind(this),this._interceptControlUp=t1.bind(this),this.domElement!==null&&this.connect(this.domElement),this.update()}connect(t){super.connect(t),this.domElement.addEventListener("pointerdown",this._onPointerDown),this.domElement.addEventListener("pointercancel",this._onPointerUp),this.domElement.addEventListener("contextmenu",this._onContextMenu),this.domElement.addEventListener("wheel",this._onMouseWheel,{passive:!1}),this.domElement.getRootNode().addEventListener("keydown",this._interceptControlDown,{passive:!0,capture:!0}),this.domElement.style.touchAction="none"}disconnect(){this.domElement.removeEventListener("pointerdown",this._onPointerDown),this.domElement.removeEventListener("pointermove",this._onPointerMove),this.domElement.removeEventListener("pointerup",this._onPointerUp),this.domElement.removeEventListener("pointercancel",this._onPointerUp),this.domElement.removeEventListener("wheel",this._onMouseWheel),this.domElement.removeEventListener("contextmenu",this._onContextMenu),this.stopListenToKeyEvents(),this.domElement.getRootNode().removeEventListener("keydown",this._interceptControlDown,{capture:!0}),this.domElement.style.touchAction="auto"}dispose(){this.disconnect()}getPolarAngle(){return this._spherical.phi}getAzimuthalAngle(){return this._spherical.theta}getDistance(){return this.object.position.distanceTo(this.target)}listenToKeyEvents(t){t.addEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=t}stopListenToKeyEvents(){this._domElementKeyEvents!==null&&(this._domElementKeyEvents.removeEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=null)}saveState(){this.target0.copy(this.target),this.position0.copy(this.object.position),this.zoom0=this.object.zoom}reset(){this.target.copy(this.target0),this.object.position.copy(this.position0),this.object.zoom=this.zoom0,this.object.updateProjectionMatrix(),this.dispatchEvent(jh),this.update(),this.state=Te.NONE}update(t=null){const e=this.object.position;Oe.copy(e).sub(this.target),Oe.applyQuaternion(this._quat),this._spherical.setFromVector3(Oe),this.autoRotate&&this.state===Te.NONE&&this._rotateLeft(this._getAutoRotationAngle(t)),this.enableDamping?(this._spherical.theta+=this._sphericalDelta.theta*this.dampingFactor,this._spherical.phi+=this._sphericalDelta.phi*this.dampingFactor):(this._spherical.theta+=this._sphericalDelta.theta,this._spherical.phi+=this._sphericalDelta.phi);let n=this.minAzimuthAngle,i=this.maxAzimuthAngle;isFinite(n)&&isFinite(i)&&(n<-Math.PI?n+=an:n>Math.PI&&(n-=an),i<-Math.PI?i+=an:i>Math.PI&&(i-=an),n<=i?this._spherical.theta=Math.max(n,Math.min(i,this._spherical.theta)):this._spherical.theta=this._spherical.theta>(n+i)/2?Math.max(n,this._spherical.theta):Math.min(i,this._spherical.theta)),this._spherical.phi=Math.max(this.minPolarAngle,Math.min(this.maxPolarAngle,this._spherical.phi)),this._spherical.makeSafe(),this.enableDamping===!0?this.target.addScaledVector(this._panOffset,this.dampingFactor):this.target.add(this._panOffset),this.target.sub(this.cursor),this.target.clampLength(this.minTargetRadius,this.maxTargetRadius),this.target.add(this.cursor);let r=!1;if(this.zoomToCursor&&this._performCursorZoom||this.object.isOrthographicCamera)this._spherical.radius=this._clampDistance(this._spherical.radius);else{const o=this._spherical.radius;this._spherical.radius=this._clampDistance(this._spherical.radius*this._scale),r=o!=this._spherical.radius}if(Oe.setFromSpherical(this._spherical),Oe.applyQuaternion(this._quatInverse),e.copy(this.target).add(Oe),this.object.lookAt(this.target),this.enableDamping===!0?(this._sphericalDelta.theta*=1-this.dampingFactor,this._sphericalDelta.phi*=1-this.dampingFactor,this._panOffset.multiplyScalar(1-this.dampingFactor)):(this._sphericalDelta.set(0,0,0),this._panOffset.set(0,0,0)),this.zoomToCursor&&this._performCursorZoom){let o=null;if(this.object.isPerspectiveCamera){const a=Oe.length();o=this._clampDistance(a*this._scale);const c=a-o;this.object.position.addScaledVector(this._dollyDirection,c),this.object.updateMatrixWorld(),r=!!c}else if(this.object.isOrthographicCamera){const a=new A(this._mouse.x,this._mouse.y,0);a.unproject(this.object);const c=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),this.object.updateProjectionMatrix(),r=c!==this.object.zoom;const l=new A(this._mouse.x,this._mouse.y,0);l.unproject(this.object),this.object.position.sub(l).add(a),this.object.updateMatrixWorld(),o=Oe.length()}else console.warn("WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled."),this.zoomToCursor=!1;o!==null&&(this.screenSpacePanning?this.target.set(0,0,-1).transformDirection(this.object.matrix).multiplyScalar(o).add(this.object.position):(To.origin.copy(this.object.position),To.direction.set(0,0,-1).transformDirection(this.object.matrix),Math.abs(this.object.up.dot(To.direction))<Vx?this.object.lookAt(this.target):($h.setFromNormalAndCoplanarPoint(this.object.up,this.target),To.intersectPlane($h,this.target))))}else if(this.object.isOrthographicCamera){const o=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),o!==this.object.zoom&&(this.object.updateProjectionMatrix(),r=!0)}return this._scale=1,this._performCursorZoom=!1,r||this._lastPosition.distanceToSquared(this.object.position)>qa||8*(1-this._lastQuaternion.dot(this.object.quaternion))>qa||this._lastTargetPosition.distanceToSquared(this.target)>qa?(this.dispatchEvent(jh),this._lastPosition.copy(this.object.position),this._lastQuaternion.copy(this.object.quaternion),this._lastTargetPosition.copy(this.target),!0):!1}_getAutoRotationAngle(t){return t!==null?an/60*this.autoRotateSpeed*t:an/60/60*this.autoRotateSpeed}_getZoomScale(t){const e=Math.abs(t*.01);return Math.pow(.95,this.zoomSpeed*e)}_rotateLeft(t){this._sphericalDelta.theta-=t}_rotateUp(t){this._sphericalDelta.phi-=t}_panLeft(t,e){Oe.setFromMatrixColumn(e,0),Oe.multiplyScalar(-t),this._panOffset.add(Oe)}_panUp(t,e){this.screenSpacePanning===!0?Oe.setFromMatrixColumn(e,1):(Oe.setFromMatrixColumn(e,0),Oe.crossVectors(this.object.up,Oe)),Oe.multiplyScalar(t),this._panOffset.add(Oe)}_pan(t,e){const n=this.domElement;if(this.object.isPerspectiveCamera){const i=this.object.position;Oe.copy(i).sub(this.target);let r=Oe.length();r*=Math.tan(this.object.fov/2*Math.PI/180),this._panLeft(2*t*r/n.clientHeight,this.object.matrix),this._panUp(2*e*r/n.clientHeight,this.object.matrix)}else this.object.isOrthographicCamera?(this._panLeft(t*(this.object.right-this.object.left)/this.object.zoom/n.clientWidth,this.object.matrix),this._panUp(e*(this.object.top-this.object.bottom)/this.object.zoom/n.clientHeight,this.object.matrix)):(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - pan disabled."),this.enablePan=!1)}_dollyOut(t){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale/=t:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1)}_dollyIn(t){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale*=t:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1)}_updateZoomParameters(t,e){if(!this.zoomToCursor)return;this._performCursorZoom=!0;const n=this.domElement.getBoundingClientRect(),i=t-n.left,r=e-n.top,o=n.width,a=n.height;this._mouse.x=i/o*2-1,this._mouse.y=-(r/a)*2+1,this._dollyDirection.set(this._mouse.x,this._mouse.y,1).unproject(this.object).sub(this.object.position).normalize()}_clampDistance(t){return Math.max(this.minDistance,Math.min(this.maxDistance,t))}_handleMouseDownRotate(t){this._rotateStart.set(t.clientX,t.clientY)}_handleMouseDownDolly(t){this._updateZoomParameters(t.clientX,t.clientX),this._dollyStart.set(t.clientX,t.clientY)}_handleMouseDownPan(t){this._panStart.set(t.clientX,t.clientY)}_handleMouseMoveRotate(t){this._rotateEnd.set(t.clientX,t.clientY),this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);const e=this.domElement;this._rotateLeft(an*this._rotateDelta.x/e.clientHeight),this._rotateUp(an*this._rotateDelta.y/e.clientHeight),this._rotateStart.copy(this._rotateEnd),this.update()}_handleMouseMoveDolly(t){this._dollyEnd.set(t.clientX,t.clientY),this._dollyDelta.subVectors(this._dollyEnd,this._dollyStart),this._dollyDelta.y>0?this._dollyOut(this._getZoomScale(this._dollyDelta.y)):this._dollyDelta.y<0&&this._dollyIn(this._getZoomScale(this._dollyDelta.y)),this._dollyStart.copy(this._dollyEnd),this.update()}_handleMouseMovePan(t){this._panEnd.set(t.clientX,t.clientY),this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd),this.update()}_handleMouseWheel(t){this._updateZoomParameters(t.clientX,t.clientY),t.deltaY<0?this._dollyIn(this._getZoomScale(t.deltaY)):t.deltaY>0&&this._dollyOut(this._getZoomScale(t.deltaY)),this.update()}_handleKeyDown(t){let e=!1;switch(t.code){case this.keys.UP:t.ctrlKey||t.metaKey||t.shiftKey?this.enableRotate&&this._rotateUp(an*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(0,this.keyPanSpeed),e=!0;break;case this.keys.BOTTOM:t.ctrlKey||t.metaKey||t.shiftKey?this.enableRotate&&this._rotateUp(-an*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(0,-this.keyPanSpeed),e=!0;break;case this.keys.LEFT:t.ctrlKey||t.metaKey||t.shiftKey?this.enableRotate&&this._rotateLeft(an*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(this.keyPanSpeed,0),e=!0;break;case this.keys.RIGHT:t.ctrlKey||t.metaKey||t.shiftKey?this.enableRotate&&this._rotateLeft(-an*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(-this.keyPanSpeed,0),e=!0;break}e&&(t.preventDefault(),this.update())}_handleTouchStartRotate(t){if(this._pointers.length===1)this._rotateStart.set(t.pageX,t.pageY);else{const e=this._getSecondPointerPosition(t),n=.5*(t.pageX+e.x),i=.5*(t.pageY+e.y);this._rotateStart.set(n,i)}}_handleTouchStartPan(t){if(this._pointers.length===1)this._panStart.set(t.pageX,t.pageY);else{const e=this._getSecondPointerPosition(t),n=.5*(t.pageX+e.x),i=.5*(t.pageY+e.y);this._panStart.set(n,i)}}_handleTouchStartDolly(t){const e=this._getSecondPointerPosition(t),n=t.pageX-e.x,i=t.pageY-e.y,r=Math.sqrt(n*n+i*i);this._dollyStart.set(0,r)}_handleTouchStartDollyPan(t){this.enableZoom&&this._handleTouchStartDolly(t),this.enablePan&&this._handleTouchStartPan(t)}_handleTouchStartDollyRotate(t){this.enableZoom&&this._handleTouchStartDolly(t),this.enableRotate&&this._handleTouchStartRotate(t)}_handleTouchMoveRotate(t){if(this._pointers.length==1)this._rotateEnd.set(t.pageX,t.pageY);else{const n=this._getSecondPointerPosition(t),i=.5*(t.pageX+n.x),r=.5*(t.pageY+n.y);this._rotateEnd.set(i,r)}this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);const e=this.domElement;this._rotateLeft(an*this._rotateDelta.x/e.clientHeight),this._rotateUp(an*this._rotateDelta.y/e.clientHeight),this._rotateStart.copy(this._rotateEnd)}_handleTouchMovePan(t){if(this._pointers.length===1)this._panEnd.set(t.pageX,t.pageY);else{const e=this._getSecondPointerPosition(t),n=.5*(t.pageX+e.x),i=.5*(t.pageY+e.y);this._panEnd.set(n,i)}this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd)}_handleTouchMoveDolly(t){const e=this._getSecondPointerPosition(t),n=t.pageX-e.x,i=t.pageY-e.y,r=Math.sqrt(n*n+i*i);this._dollyEnd.set(0,r),this._dollyDelta.set(0,Math.pow(this._dollyEnd.y/this._dollyStart.y,this.zoomSpeed)),this._dollyOut(this._dollyDelta.y),this._dollyStart.copy(this._dollyEnd);const o=(t.pageX+e.x)*.5,a=(t.pageY+e.y)*.5;this._updateZoomParameters(o,a)}_handleTouchMoveDollyPan(t){this.enableZoom&&this._handleTouchMoveDolly(t),this.enablePan&&this._handleTouchMovePan(t)}_handleTouchMoveDollyRotate(t){this.enableZoom&&this._handleTouchMoveDolly(t),this.enableRotate&&this._handleTouchMoveRotate(t)}_addPointer(t){this._pointers.push(t.pointerId)}_removePointer(t){delete this._pointerPositions[t.pointerId];for(let e=0;e<this._pointers.length;e++)if(this._pointers[e]==t.pointerId){this._pointers.splice(e,1);return}}_isTrackingPointer(t){for(let e=0;e<this._pointers.length;e++)if(this._pointers[e]==t.pointerId)return!0;return!1}_trackPointer(t){let e=this._pointerPositions[t.pointerId];e===void 0&&(e=new tt,this._pointerPositions[t.pointerId]=e),e.set(t.pageX,t.pageY)}_getSecondPointerPosition(t){const e=t.pointerId===this._pointers[0]?this._pointers[1]:this._pointers[0];return this._pointerPositions[e]}_customWheelEvent(t){const e=t.deltaMode,n={clientX:t.clientX,clientY:t.clientY,deltaY:t.deltaY};switch(e){case 1:n.deltaY*=16;break;case 2:n.deltaY*=100;break}return t.ctrlKey&&!this._controlActive&&(n.deltaY*=10),n}}function Gx(s){this.enabled!==!1&&(this._pointers.length===0&&(this.domElement.setPointerCapture(s.pointerId),this.domElement.addEventListener("pointermove",this._onPointerMove),this.domElement.addEventListener("pointerup",this._onPointerUp)),!this._isTrackingPointer(s)&&(this._addPointer(s),s.pointerType==="touch"?this._onTouchStart(s):this._onMouseDown(s)))}function Wx(s){this.enabled!==!1&&(s.pointerType==="touch"?this._onTouchMove(s):this._onMouseMove(s))}function Xx(s){switch(this._removePointer(s),this._pointers.length){case 0:this.domElement.releasePointerCapture(s.pointerId),this.domElement.removeEventListener("pointermove",this._onPointerMove),this.domElement.removeEventListener("pointerup",this._onPointerUp),this.dispatchEvent(Qu),this.state=Te.NONE;break;case 1:const t=this._pointers[0],e=this._pointerPositions[t];this._onTouchStart({pointerId:t,pageX:e.x,pageY:e.y});break}}function qx(s){let t;switch(s.button){case 0:t=this.mouseButtons.LEFT;break;case 1:t=this.mouseButtons.MIDDLE;break;case 2:t=this.mouseButtons.RIGHT;break;default:t=-1}switch(t){case Ls.DOLLY:if(this.enableZoom===!1)return;this._handleMouseDownDolly(s),this.state=Te.DOLLY;break;case Ls.ROTATE:if(s.ctrlKey||s.metaKey||s.shiftKey){if(this.enablePan===!1)return;this._handleMouseDownPan(s),this.state=Te.PAN}else{if(this.enableRotate===!1)return;this._handleMouseDownRotate(s),this.state=Te.ROTATE}break;case Ls.PAN:if(s.ctrlKey||s.metaKey||s.shiftKey){if(this.enableRotate===!1)return;this._handleMouseDownRotate(s),this.state=Te.ROTATE}else{if(this.enablePan===!1)return;this._handleMouseDownPan(s),this.state=Te.PAN}break;default:this.state=Te.NONE}this.state!==Te.NONE&&this.dispatchEvent(dl)}function Yx(s){switch(this.state){case Te.ROTATE:if(this.enableRotate===!1)return;this._handleMouseMoveRotate(s);break;case Te.DOLLY:if(this.enableZoom===!1)return;this._handleMouseMoveDolly(s);break;case Te.PAN:if(this.enablePan===!1)return;this._handleMouseMovePan(s);break}}function Zx(s){this.enabled===!1||this.enableZoom===!1||this.state!==Te.NONE||(s.preventDefault(),this.dispatchEvent(dl),this._handleMouseWheel(this._customWheelEvent(s)),this.dispatchEvent(Qu))}function jx(s){this.enabled!==!1&&this._handleKeyDown(s)}function $x(s){switch(this._trackPointer(s),this._pointers.length){case 1:switch(this.touches.ONE){case Cs.ROTATE:if(this.enableRotate===!1)return;this._handleTouchStartRotate(s),this.state=Te.TOUCH_ROTATE;break;case Cs.PAN:if(this.enablePan===!1)return;this._handleTouchStartPan(s),this.state=Te.TOUCH_PAN;break;default:this.state=Te.NONE}break;case 2:switch(this.touches.TWO){case Cs.DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchStartDollyPan(s),this.state=Te.TOUCH_DOLLY_PAN;break;case Cs.DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchStartDollyRotate(s),this.state=Te.TOUCH_DOLLY_ROTATE;break;default:this.state=Te.NONE}break;default:this.state=Te.NONE}this.state!==Te.NONE&&this.dispatchEvent(dl)}function Kx(s){switch(this._trackPointer(s),this.state){case Te.TOUCH_ROTATE:if(this.enableRotate===!1)return;this._handleTouchMoveRotate(s),this.update();break;case Te.TOUCH_PAN:if(this.enablePan===!1)return;this._handleTouchMovePan(s),this.update();break;case Te.TOUCH_DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchMoveDollyPan(s),this.update();break;case Te.TOUCH_DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchMoveDollyRotate(s),this.update();break;default:this.state=Te.NONE}}function Jx(s){this.enabled!==!1&&s.preventDefault()}function Qx(s){s.key==="Control"&&(this._controlActive=!0,this.domElement.getRootNode().addEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0}))}function t1(s){s.key==="Control"&&(this._controlActive=!1,this.domElement.getRootNode().removeEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0}))}const Si=s=>(s=Math.min(1,Math.max(0,s)),s*s*s*(s*(s*6-15)+10)),e1=(s,t,e,n)=>(n.pos.lerpVectors(s.pos,t.pos,e),n.target.lerpVectors(s.target,t.target,e),n.fov=s.fov+(t.fov-s.fov)*e,n),Ya=()=>({pos:new A,target:new A,fov:40}),td=76;class n1{constructor(t,e,n,i,r){this.stage=t,this.train=e,this.land=n,this.viaduct=i,this.veg=r;const o=t.camera;this.controls=new Hx(o,t.renderer.domElement),this.controls.enableDamping=!0,this.controls.dampingFactor=.07,this.controls.minDistance=4,this.controls.maxDistance=1400,this.controls.maxPolarAngle=Math.PI*.495,this.controls.zoomSpeed=.9,this.controls.rotateSpeed=.6,this.controls.target.set(0,32,-60),this.controls.enabled=!1;const a=t.renderer.domElement,c=()=>{this.mode==="cinematic"&&this.t>1.5&&this.setMode("orbit")};a.addEventListener("pointerdown",c),a.addEventListener("wheel",c,{passive:!0})}stage;train;land;viaduct;veg;mode="cinematic";controls;t=0;fr=kn();tmp=new A;pa=Ya();pb=Ya();pc=Ya();lastTarget=new A;blending=0;userDrag=!1;onModeChange;fovFor(t){const e=this.stage.camera.aspect,n=1.35;if(e>=n)return t;const i=2*Math.atan(Math.tan(Oo.degToRad(t)/2)*n);return Math.min(95,Oo.radToDeg(2*Math.atan(Math.tan(i/2)/e)))}rel(t,e,n,i){const r=this.train.locoFrame;return i.copy(r.p).addScaledVector(r.r,t).addScaledVector(r.u,e).addScaledVector(r.t,n)}relP(t,e,n,i){const r=this.stage.camera.aspect,o=r<1.35?Math.min(2.1,1+(1.35-r)*1.1):1;return this.rel(t*o,e*(.6+.4*o),n*o,i)}setMode(t){if(t===this.mode)return;const e=this.stage.camera;if(t==="cinematic")this.t=0;else if(this.mode==="cinematic"&&this.controls.target.copy(this.lastTarget),t==="follow"){const n=this.train.locoFrame,i=e.position.clone().sub(this.controls.target);this.controls.target.copy(n.p).addScaledVector(n.u,2),(i.length()>70||this.mode==="cinematic")&&i.copy(n.r).multiplyScalar(14).addScaledVector(n.u,5).addScaledVector(n.t,-9),e.position.copy(this.controls.target).add(i)}this.mode=t,this.controls.enabled=t!=="cinematic",this.onModeChange?.(t)}restartIntro(t){this.train.setDistance(t),this.train.state.speed=this.train.targetSpeed,this.t=0,this.mode="cinematic",this.controls.enabled=!1,this.onModeChange?.("cinematic")}seek(t){this.mode="cinematic",this.controls.enabled=!1,this.t=t,this.onModeChange?.("cinematic")}get introTime(){return this.t}shotA(t,e){const n=Si(t/12);return e.pos.set(-125+62*n,96-28*n,305-60*n),e.target.set(-8+6*n,33,-45),e.fov=40,this.rel(0,2,0,this.tmp),e.target.lerp(this.tmp,.35*Si((t-4)/8)),e}shotB(t,e){const n=Si(t/12);return this.relP(14-8*n,5.2-2.8*n,30-22*n,e.pos),this.rel(0,1.9,1.5,e.target),e.fov=36-5*n,e}shotC(t,e){const n=Si(t/11);return this.relP(8.4-1.4*n,3+.2*n,5.5-7.5*n,e.pos),this.rel(0,1.05,.6-1.6*n,e.target),e.fov=37,e}shotD(t,e){const n=Si(t/13);return e.pos.set(-60+100*n,38+4*n,128-14*n),this.rel(0,1.8,0,e.target),e.fov=36-4*n,e}shotE(t,e){const n=Si(t/14);return e.pos.set(25-135*n,24+66*n,80+160*n),this.rel(0,3,0,this.tmp),this.pc.target.set(0,30,-35),e.target.lerpVectors(this.tmp,this.pc.target,Si((t-1)/11)),e.fov=34+6*n,e}shotF(t,e){const n=t/24;return e.pos.set(-215+55*n,118+8*n,330-15*n),e.target.set(10,32,-125),e.fov=41,e}director(t,e){const n=[[0,(l,u)=>this.shotA(l,u)],[11,(l,u)=>this.shotB(l,u)],[23,(l,u)=>this.shotC(l,u)],[34,(l,u)=>this.shotD(l,u)],[47,(l,u)=>this.shotE(l,u)],[60,(l,u)=>this.shotF(l,u)]],i=3.2;let r=0;for(let l=0;l<n.length;l++)t>=n[l][0]&&(r=l);const[o,a]=n[r];a(t-o,this.pa);const c=n[r+1];if(c&&t>c[0]-i){const l=Si((t-(c[0]-i))/i);c[1](t-c[0],this.pb),e1(this.pa,this.pb,l,e)}else e.pos.copy(this.pa.pos),e.target.copy(this.pa.target),e.fov=this.pa.fov;return e}resolve(t){for(let e=0;e<3;e++){const i=this.land.fastHeight(t.x,t.z)+2.2;t.y<i&&(t.y=i),this.viaduct.pushOut(t,1.6),this.train.pushOut(t,1),this.veg?.pushOut(t,1)}}update(t,e){const n=this.stage.camera;if(this.mode==="cinematic"){this.train.paused||(this.t+=t),this.director(this.t,this.pc),n.position.copy(this.pc.pos),this.resolve(n.position),this.lastTarget.copy(this.pc.target),n.lookAt(this.pc.target);const r=this.fovFor(this.pc.fov);Math.abs(n.fov-r)>.01&&(n.fov=r,n.updateProjectionMatrix()),this.t>td&&this.setMode("orbit");return}const i=this.fovFor(40);if(Math.abs(n.fov-i)>.01&&(n.fov+=(i-n.fov)*Math.min(1,t*3),n.updateProjectionMatrix()),this.mode==="follow"){const r=this.train.locoFrame,a=this.tmp.copy(r.p).addScaledVector(r.u,2.2).clone().sub(this.controls.target);this.controls.target.add(a),n.position.add(a)}this.controls.update(),this.resolve(n.position),this.blending,this.userDrag}}const Tn={pause:'<svg viewBox="0 0 24 24"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z"/></svg>',play:'<svg viewBox="0 0 24 24"><path d="M8 5l11 7-11 7z"/></svg>',cam:'<svg viewBox="0 0 24 24"><path d="M4 8h3l1.6-2h6.8L17 8h3v11H4z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><circle cx="12" cy="13.2" r="3.3" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',minus:'<svg viewBox="0 0 24 24"><path d="M6 12h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',plus:'<svg viewBox="0 0 24 24"><path d="M12 6v12M6 12h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',whistle:'<svg viewBox="0 0 24 24"><path d="M6 16V9.5C6 7 8 6 10 6h4.2c2 0 3.8 1.2 3.8 3.4V16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M5 16h14M9 19c0 1.5 1.2 2.5 3 2.5s3-1 3-2.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',sound:'<svg viewBox="0 0 24 24"><path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z" fill="currentColor"/><path d="M15.5 9a4.5 4.5 0 010 6M18 6.5a8 8 0 010 11" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',mute:'<svg viewBox="0 0 24 24"><path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z" fill="currentColor"/><path d="M16 9.5l5 5M21 9.5l-5 5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',replay:'<svg viewBox="0 0 24 24"><path d="M5 12a7 7 0 107-7H8.5M8.5 2.8L5.5 5.5 8.5 8.2" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',full:'<svg viewBox="0 0 24 24"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>'},i1={cinematic:"Cinematic",orbit:"Orbit",follow:"Follow train"},s1=[[1.2,8.2,"Glen Dessary","Western Highlands · 1894"],[12,19.5,"No. 17 “Glen Affric”","Highland Railway 4-6-2 · 6 ft 4 in drivers"],[24,31.5,"Walschaerts valve gear","Every rod driven from the wheel angle"],[35,45,"Nine arches, 168 metres","Dressed granite · 38 metres above the river"],[62,72,"The Highland Express","Drag the view to take control"]];class r1{constructor(t){this.act=t,this.root=document.createElement("div"),this.root.id="hud",this.root.innerHTML=`
      <div class="hud-title"><span class="t1">Highland Express</span><span class="t2" id="hud-status">Glen Dessary Viaduct</span></div>
      <div class="hud-cap" id="hud-cap"><div class="c1"></div><div class="c2"></div></div>
      <div class="hud-stat"><span id="hud-fps"></span></div>
      <div class="hud-bar" id="hud-bar">
        <button id="b-pause" title="Pause / resume (Space)"></button>
        <span class="sep"></span>
        <button id="b-cam" title="Camera mode (C)"></button><span class="camlabel" id="b-camlabel">Cinematic</span>
        <span class="sep"></span>
        <button id="b-slow" title="Slower (−)"></button>
        <span class="speed" id="b-speed">0<small> km/h</small></span>
        <button id="b-fast" title="Faster (+)"></button>
        <span class="sep"></span>
        <button id="b-whistle" title="Hold to blow the whistle (W)"></button>
        <button id="b-sound" title="Sound (M)"></button>
        <button id="b-qual" title="Graphics quality (Q)"><span class="qlabel">HI</span></button>
        <button id="b-full" title="Fullscreen (X)"></button>
        <button id="b-replay" title="Replay the opening sequence (R)"></button>
      </div>`,document.body.appendChild(this.root),this.bar=this.root.querySelector("#hud-bar"),this.cap=this.root.querySelector("#hud-cap"),this.speedEl=this.root.querySelector("#b-speed"),this.camLabel=this.root.querySelector("#b-camlabel"),this.statEl=this.root.querySelector("#hud-fps");const e=o=>this.root.querySelector(o);this.pauseBtn=e("#b-pause"),this.camBtn=e("#b-cam"),this.soundBtn=e("#b-sound"),this.fullBtn=e("#b-full"),this.qualBtn=e("#b-qual"),this.pauseBtn.innerHTML=Tn.pause,this.camBtn.innerHTML=Tn.cam,e("#b-slow").innerHTML=Tn.minus,e("#b-fast").innerHTML=Tn.plus,e("#b-whistle").innerHTML=Tn.whistle,this.soundBtn.innerHTML=Tn.mute,this.fullBtn.innerHTML=Tn.full,e("#b-replay").innerHTML=Tn.replay,this.pauseBtn.onclick=()=>t.togglePause(),this.camBtn.onclick=()=>t.cycleCamera(),e("#b-slow").onclick=()=>t.speed(-1),e("#b-fast").onclick=()=>t.speed(1),this.soundBtn.onclick=()=>t.toggleSound(),this.fullBtn.onclick=()=>t.toggleFullscreen(),this.qualBtn.onclick=()=>t.toggleQuality(),e("#b-replay").onclick=()=>t.replay();const n=e("#b-whistle"),i=o=>{o.preventDefault(),t.whistle(!0),n.classList.add("on")},r=()=>{t.whistle(!1),n.classList.remove("on")};n.addEventListener("pointerdown",i),window.addEventListener("pointerup",r),window.addEventListener("keydown",o=>{if(!o.repeat){switch(o.code){case"Space":o.preventDefault(),t.togglePause();break;case"KeyC":t.cycleCamera();break;case"KeyF":t.setCamera("follow");break;case"KeyO":t.setCamera("orbit");break;case"KeyM":t.toggleSound();break;case"KeyW":this.whistleDown||(this.whistleDown=!0,t.whistle(!0),n.classList.add("on"));break;case"KeyR":t.replay();break;case"KeyX":t.toggleFullscreen();break;case"KeyQ":t.toggleQuality();break;case"Equal":case"NumpadAdd":t.speed(1);break;case"Minus":case"NumpadSubtract":t.speed(-1);break;case"KeyH":this.toggleHidden();break}this.wake()}}),window.addEventListener("keyup",o=>{o.code==="KeyW"&&(this.whistleDown=!1,t.whistle(!1),n.classList.remove("on"))}),window.addEventListener("pointermove",()=>this.wake()),window.addEventListener("pointerdown",()=>this.wake())}act;root;bar;cap;speedEl;camBtn;camLabel;pauseBtn;soundBtn;fullBtn;qualBtn;hideT=0;hidden=!1;whistleDown=!1;statEl;setQuality(t){this.qualBtn.querySelector(".qlabel").textContent=t==="high"?"HI":"LITE",this.qualBtn.classList.toggle("on",t==="lite")}destroy(){this.root.remove()}toggleHidden(){this.hidden=!this.hidden,this.root.classList.toggle("off",this.hidden)}wake(){this.hideT=0,this.bar.classList.remove("idle")}setPaused(t){this.pauseBtn.innerHTML=t?Tn.play:Tn.pause,this.pauseBtn.classList.toggle("on",t)}setMode(t){this.camLabel.textContent=i1[t]}setSound(t){this.soundBtn.innerHTML=t?Tn.sound:Tn.mute,this.soundBtn.classList.toggle("on",t)}update(t,e,n,i){if(this.hideT+=t,this.hideT>6&&this.bar.classList.add("idle"),this.speedEl.innerHTML=`${Math.round(e)}<small> km/h</small>`,this.statEl.textContent=`${Math.round(i)} fps`,n!==null){let r=!1;for(const[o,a,c,l]of s1)if(n>=o&&n<=a){const u=Math.min(1,(n-o)/.9,(a-n)/.9);this.cap.style.opacity=String(Math.max(0,u)),this.cap.style.transform=`translateY(${(1-Math.max(0,Math.min(1,u)))*8}px)`,this.cap.children[0].textContent=c,this.cap.children[1].textContent=l,r=!0;break}r||(this.cap.style.opacity="0")}else this.cap.style.opacity="0"}}class o1{ctx=null;master;trainBus;panner;noiseBuf;brownBuf;rumble;hiss;wind;river;falls;whistleNodes=null;enabled=!1;nextBird=4;lastChuff=0;lastJoint=0;chuffToggle=0;lastT=0;get isOn(){return this.enabled&&!!this.ctx&&this.ctx.state==="running"}async enable(){this.ctx||this.init(),await this.ctx.resume(),this.enabled=!0,this.master.gain.setTargetAtTime(.9,this.ctx.currentTime,.3)}dispose(){this.stopWhistle(),this.enabled=!1,this.ctx?.close(),this.ctx=null}disable(){this.enabled=!1,this.ctx&&this.master.gain.setTargetAtTime(0,this.ctx.currentTime,.15)}init(){const t=new AudioContext;this.ctx=t,this.master=t.createGain(),this.master.gain.value=0;const e=t.createDynamicsCompressor();e.threshold.value=-14,e.ratio.value=3,this.master.connect(e).connect(t.destination);const n=t.sampleRate*3;this.noiseBuf=t.createBuffer(1,n,t.sampleRate);const i=this.noiseBuf.getChannelData(0);for(let d=0;d<n;d++)i[d]=Math.random()*2-1;this.brownBuf=t.createBuffer(1,n,t.sampleRate);const r=this.brownBuf.getChannelData(0);let o=0;for(let d=0;d<n;d++){const m=Math.random()*2-1;o=(o+.02*m)/1.02,r[d]=o*3.5}this.trainBus=t.createGain(),this.panner=t.createPanner(),this.panner.panningModel="HRTF",this.panner.distanceModel="inverse",this.panner.refDistance=14,this.panner.rolloffFactor=1.15,this.panner.maxDistance=2500,this.trainBus.connect(this.panner).connect(this.master);const a=d=>{const m=t.createBufferSource();return m.buffer=d,m.loop=!0,m.start(),m},c=(d,m,v,g,f)=>{const x=a(d),_=t.createBiquadFilter();_.type=m,_.frequency.value=v,_.Q.value=g;const y=t.createGain();return y.gain.value=0,x.connect(_).connect(y).connect(f),{gain:y,filter:_}};this.rumble=c(this.brownBuf,"lowpass",220,.7,this.trainBus),this.hiss=c(this.noiseBuf,"highpass",3200,.5,this.trainBus),this.wind=c(this.noiseBuf,"bandpass",380,.6,this.master),this.river=c(this.noiseBuf,"bandpass",1400,.45,this.master);const l=a(this.noiseBuf),u=t.createBiquadFilter();u.type="lowpass",u.frequency.value=1800;const h=t.createGain();h.gain.value=0;const p=t.createPanner();p.panningModel="HRTF",p.distanceModel="inverse",p.refDistance=30,p.rolloffFactor=1.2,l.connect(u).connect(h).connect(p).connect(this.master),this.falls={gain:h,panner:p}}noiseBurst(t,e,n,i,r,o,a,c="bandpass"){const l=this.ctx,u=l.createBufferSource();u.buffer=this.noiseBuf,u.loopStart=0;const h=l.createBiquadFilter();h.type=c,h.frequency.value=n,h.Q.value=i;const p=l.createGain();p.gain.setValueAtTime(1e-4,e),p.gain.exponentialRampToValueAtTime(r,e+o),p.gain.exponentialRampToValueAtTime(1e-4,e+o+a),u.connect(h).connect(p).connect(t),u.start(e,Math.random()*2,o+a+.05)}thump(t,e,n,i){const r=this.ctx,o=r.createOscillator();o.type="sine",o.frequency.setValueAtTime(e,t),o.frequency.exponentialRampToValueAtTime(e*.5,t+i);const a=r.createGain();a.gain.setValueAtTime(n,t),a.gain.exponentialRampToValueAtTime(1e-4,t+i),o.connect(a).connect(this.trainBus),o.start(t),o.stop(t+i+.02)}chuff(t){const n=this.ctx.currentTime+.005,i=this.chuffToggle++%2===0,r=Math.min(1,t/9),o=(.55+.35*r)*(i?1:.72);this.noiseBurst(this.trainBus,n,i?420:520,.9,o,.006,.11+.05*(1-r)),this.noiseBurst(this.trainBus,n,1500,.7,o*.22,.004,.06),this.thump(n,i?78:92,o*.9,.16),this.noiseBurst(this.trainBus,n+.02,180,3,o*.3,.01,.1,"bandpass")}clack(t){const e=this.ctx,n=e.currentTime+.002,r=.07+.2*Math.min(1,t/9);for(const c of[0,.045])this.noiseBurst(this.trainBus,n+c,1700+Math.random()*500,1.4,r,.002,.04),this.noiseBurst(this.trainBus,n+c,420,2.5,r*.9,.002,.07);const o=e.createOscillator();o.type="triangle",o.frequency.value=880+Math.random()*140;const a=e.createGain();a.gain.setValueAtTime(r*.25,n),a.gain.exponentialRampToValueAtTime(1e-4,n+.12),o.connect(a).connect(this.trainBus),o.start(n),o.stop(n+.14)}startWhistle(){if(!this.isOn||this.whistleNodes)return;const t=this.ctx,e=t.createGain();e.gain.setValueAtTime(1e-4,t.currentTime),e.gain.exponentialRampToValueAtTime(.5,t.currentTime+.07);const n=t.createBiquadFilter();n.type="lowpass",n.frequency.value=3e3;const i=t.createOscillator();i.frequency.value=5.2;const r=t.createGain();r.gain.value=6,i.connect(r);const o=[];for(const u of[392,466,587,1176]){const h=t.createOscillator();h.type=u>1e3?"sine":"sawtooth",h.frequency.value=u,r.connect(h.frequency);const p=t.createGain();p.gain.value=u>1e3?.12:.22,h.connect(p).connect(n),h.start(),o.push(h)}i.start(),o.push(i),n.connect(e).connect(this.trainBus);const a=t.createBufferSource();a.buffer=this.noiseBuf,a.loop=!0;const c=t.createBiquadFilter();c.type="bandpass",c.frequency.value=2400,c.Q.value=.8;const l=t.createGain();l.gain.value=.22,a.connect(c).connect(l).connect(e),a.start(),this.whistleNodes={osc:[...o],gain:e},this.whistleNodes.src=a}stopWhistle(){const t=this.whistleNodes;if(!t||!this.ctx)return;const e=this.ctx.currentTime;t.gain.gain.cancelScheduledValues(e),t.gain.gain.setValueAtTime(Math.max(1e-4,t.gain.gain.value),e),t.gain.gain.exponentialRampToValueAtTime(1e-4,e+.35);const n=t.src;for(const i of t.osc)i.stop(e+.4);n.stop(e+.4),this.whistleNodes=null}bleat(t){if(!this.isOn||!this.ctx)return;const e=this.ctx,n=e.currentTime+.02,i=.55+Math.random()*.5,r=240+Math.random()*120,o=e.createOscillator();o.type="sawtooth",o.frequency.setValueAtTime(r*1.15,n),o.frequency.linearRampToValueAtTime(r,n+i*.35),o.frequency.linearRampToValueAtTime(r*.82,n+i);const a=e.createOscillator();a.frequency.value=26+Math.random()*10;const c=e.createGain();c.gain.value=.35;const l=e.createGain();l.gain.setValueAtTime(1e-4,n),l.gain.exponentialRampToValueAtTime(.5,n+.07),l.gain.setValueAtTime(.5,n+i*.7),l.gain.exponentialRampToValueAtTime(1e-4,n+i),a.connect(c).connect(l.gain);const u=e.createBiquadFilter();u.type="bandpass",u.frequency.setValueAtTime(650,n),u.frequency.linearRampToValueAtTime(900,n+i*.5),u.Q.value=5;const h=e.createBiquadFilter();h.type="bandpass",h.frequency.value=1500,h.Q.value=4;const p=e.createGain();p.gain.value=.05+.16*t;const d=e.createStereoPanner();d.pan.value=Math.random()*1.6-.8,o.connect(u).connect(l),o.connect(h).connect(l),l.connect(p).connect(d).connect(this.master),o.start(n),a.start(n),o.stop(n+i+.05),a.stop(n+i+.05)}bird(){const t=this.ctx,e=t.currentTime+.01,n=2200+Math.random()*2200,i=2+Math.floor(Math.random()*5),r=t.createStereoPanner();r.pan.value=Math.random()*2-1;const o=t.createGain();o.gain.value=.035+Math.random()*.03,o.connect(r).connect(this.master);for(let a=0;a<i;a++){const c=e+a*(.09+Math.random()*.05),l=t.createOscillator();l.type="sine",l.frequency.setValueAtTime(n*(1+Math.random()*.2),c),l.frequency.exponentialRampToValueAtTime(n*(.6+Math.random()*.9),c+.07);const u=t.createGain();u.gain.setValueAtTime(1e-4,c),u.gain.exponentialRampToValueAtTime(1,c+.01),u.gain.exponentialRampToValueAtTime(1e-4,c+.085),l.connect(u).connect(o),l.start(c),l.stop(c+.1)}}update(t){if(!this.ctx||!this.enabled){this.lastChuff=t.chuffs,this.lastJoint=t.joints;return}const e=this.ctx,n=e.currentTime,i=e.listener,r=t.camera.position,o=new A(0,0,-1).applyQuaternion(t.camera.quaternion),a=new A(0,1,0).applyQuaternion(t.camera.quaternion);i.positionX&&(i.positionX.setTargetAtTime(r.x,n,.03),i.positionY.setTargetAtTime(r.y,n,.03),i.positionZ.setTargetAtTime(r.z,n,.03),i.forwardX.setTargetAtTime(o.x,n,.03),i.forwardY.setTargetAtTime(o.y,n,.03),i.forwardZ.setTargetAtTime(o.z,n,.03),i.upX.setTargetAtTime(a.x,n,.03),i.upY.setTargetAtTime(a.y,n,.03),i.upZ.setTargetAtTime(a.z,n,.03)),this.panner.positionX.setTargetAtTime(t.trainPos.x,n,.05),this.panner.positionY.setTargetAtTime(t.trainPos.y,n,.05),this.panner.positionZ.setTargetAtTime(t.trainPos.z,n,.05),this.falls.panner.positionX.value=t.fallsPos.x,this.falls.panner.positionY.value=t.fallsPos.y,this.falls.panner.positionZ.value=t.fallsPos.z;const c=Math.min(1,t.speed/9),l=Math.min(3,t.chuffs-this.lastChuff);for(let m=0;m<l;m++)this.chuff(t.speed);this.lastChuff=t.chuffs;const u=Math.min(3,t.joints-this.lastJoint);for(let m=0;m<u;m++)this.clack(t.speed);this.lastJoint=t.joints,this.rumble.gain.gain.setTargetAtTime(.5*c,n,.15),this.rumble.filter.frequency.setTargetAtTime(150+160*c,n,.2),this.hiss.gain.gain.setTargetAtTime(.02+.5*t.steam,n,.1);const h=.55+.45*Math.sin(t.time*.21)*Math.sin(t.time*.07+1.3),p=Math.min(1,Math.max(0,(t.camHeight-10)/100));this.wind.gain.gain.setTargetAtTime(.045+.1*h+.06*p,n,.4),this.wind.filter.frequency.setTargetAtTime(320+260*h,n,.3);const d=Math.max(0,1-t.riverDist/90);this.river.gain.gain.setTargetAtTime(.012+.07*d*d,n,.3),r.distanceTo(t.fallsPos),this.falls.gain.gain.setTargetAtTime(.55,n,.5),t.time>this.nextBird&&(this.bird(),this.nextBird=t.time+3+Math.random()*9),this.lastT=t.time}}const Kh={tier:"high",shadowMap:4096,msaa:2,pixelCap:1.75,minScale:.5,startScale:1,bloomScale:.5,terrainLite:!1,veg:{pine:5.2,broad:7,shrub:3.4,grass:2.1,flowerClusters:520,rock:9,distScale:1},mist:90,motes:700,smoke:1300},Jh={tier:"lite",shadowMap:2048,msaa:0,pixelCap:1.25,minScale:.4,startScale:.8,bloomScale:.3,terrainLite:!0,veg:{pine:8,broad:10,shrub:5.6,grass:3.6,flowerClusters:200,rock:13,distScale:.65},mist:40,motes:220,smoke:700};function a1(){try{const s=document.createElement("canvas"),t=s.getContext("webgl2")||s.getContext("webgl");if(!t)return"";const e=t.getExtension("WEBGL_debug_renderer_info"),n=e?String(t.getParameter(e.UNMASKED_RENDERER_WEBGL)):"";return t.getExtension("WEBGL_lose_context")?.loseContext(),n}catch{return""}}function c1(){const s=new URLSearchParams(location.search).get("quality");let t=null;try{t=localStorage.getItem("he-quality")}catch{}const e=s??t;if(e==="lite")return Jh;if(e==="high")return Kh;const n=matchMedia("(pointer: coarse)").matches,i=Math.min(screen.width,screen.height)<900,r=navigator.deviceMemory??8,o=navigator.hardwareConcurrency??8,a=a1(),c=/Mali|Adreno|PowerVR|SwiftShader|llvmpipe|Intel\(R\) (HD|UHD)|Intel.*(HD|UHD) Graphics/i.test(a);return n&&i||r<=4||o<=4||c?Jh:Kh}function l1(s){try{localStorage.setItem("he-quality",s)}catch{}}const Za=document.getElementById("app"),h1=document.getElementById("status"),u1=document.querySelector("#bar i"),In=()=>new Promise(s=>{const t=new MessageChannel;t.port1.onmessage=()=>s(),t.port2.postMessage(0)});function Ln(s,t){u1.style.width=`${Math.round(s*100)}%`,h1.textContent=t}async function d1(){const s=new URLSearchParams(location.search),t=s.get("view");if(t){const{runViewer:Z}=await ld(async()=>{const{runViewer:mt}=await import("./viewer-vAhAWaLW.js");return{runViewer:mt}},[],import.meta.url);Z(Za,t);return}const e=performance.now(),n=c1(),i=new Y_(Za,n);es.uSunDir.value.copy(en),Ln(.04,"Laying the permanent way…"),await In();const r=new j_;Ln(.12,"Surveying the glen…"),await In();const o=new $_(r);Ln(.22,"Raising mountains…"),await In();const a=new lx(o,n.terrainLite);i.scene.add(a.group),Ln(.45,"Laying rails…"),await In();const c=new Wo(r);i.scene.add(c.group),Ln(.52,"Quarrying stone…"),await In();const l=new hx(o);i.scene.add(l.group),Ln(.62,"Running the river…"),await In();const u=new fx(o);i.scene.add(u.group),Ln(.7,"Planting the glen…"),await In();const h=new bx(o,r,n);i.scene.add(h.group);const p=new Tx(r,o);i.scene.add(p.group),Ln(.82,"Gathering the flock…"),await In();const d=new Ex(o,n.tier==="high"?380:170,n.tier==="high");i.scene.add(d.group),Ln(.86,"Firing the boiler…"),await In();const m=new Fx(r,4);i.scene.add(m.group);const v=new kx(m,u,o,n);i.scene.add(v.group),Ln(.96,"Raising steam…"),await In(),console.log(`[highland] quality=${n.tier} ready in ${(performance.now()-e).toFixed(0)} ms`,h.stats,"stones",l.stoneCount);const g=r.length-190;m.targetSpeed=s.get("speed")?Number(s.get("speed")):8.5;const f=new n1(i,m,o,l,h),x=new o1,_=s.get("s")?Number(s.get("s")):g;m.setDistance(_),m.state.speed=m.targetSpeed;const y=s.get("cam");if(y){const Z=y.split(",").map(Number);i.camera.position.set(Z[0],Z[1],Z[2]),i.camera.lookAt(Z[3],Z[4],Z[5]),f.setMode("orbit"),f.controls.target.set(Z[3],Z[4],Z[5]),f.controls.update()}const w=s.get("t");if(w&&!y){const Z=Number(w);for(let mt=0;mt<Z;mt+=.1)m.update(.1,mt),f.update(.1,mt)}const S=new r1({togglePause:()=>{m.paused=!m.paused,S.setPaused(m.paused)},cycleCamera:()=>{const Z=["cinematic","orbit","follow"],mt=Z[(Z.indexOf(f.mode)+1)%Z.length];mt==="cinematic"?f.restartIntro(g):f.setMode(mt)},setCamera:Z=>f.setMode(Z),speed:Z=>{m.targetSpeed=Math.max(0,Math.min(22,m.targetSpeed+Z*1.5))},toggleSound:async()=>{x.enabled?x.disable():await x.enable(),S.setSound(x.enabled)},whistle:Z=>{v.whistle=Z,Z?x.startWhistle():x.stopWhistle()},replay:()=>f.restartIntro(g),toggleQuality:()=>{const Z=n.tier==="high"?"lite":"high";l1(Z);const mt=new URL(location.href);mt.searchParams.set("quality",Z),location.href=mt.toString()},toggleFullscreen:()=>{document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen?.()}});f.onModeChange=Z=>S.setMode(Z),S.setMode(f.mode),S.setQuality(n.tier),Ln(.99,"Compiling shaders…"),await In();try{await Promise.race([i.renderer.compileAsync(i.scene,i.camera),new Promise(Z=>setTimeout(Z,9e3))])}catch{}const T=document.getElementById("loader");T.style.opacity="0",setTimeout(()=>T.remove(),1300);const C=new Nu;let b=0,M=0,E=0,D=60,N=0,I=0;const F=new A(0,30,0),z=new A;let X=0;const k=()=>{const Z=C.getElapsedTime(),mt=Math.min(.05,Z-b);b=Z,M+=mt,E++,M>.5&&(D=E/M,M=0,E=0),es.uTime.value=Z,D<38?(N+=mt,I=0):D>56?(I+=mt,N=0):(N=0,I=0),N>2.5&&i.pixelScale>n.minScale&&(i.setPixelScale(i.pixelScale-.125),N=0),I>8&&i.pixelScale<1&&(i.setPixelScale(i.pixelScale+.125),I=0),m.update(mt,Z),f.update(mt,Z),v.update(m.paused?0:mt,Z,i.camera),h.update(i.camera.position),d.update(mt,Z,m.locoFrame.p,i.camera.position),d.bleat>0&&x.bleat(d.bleat);const Vt=i.camera.position.distanceTo(m.locoFrame.p),Zt=Vt<130,Kt=Zt?z.copy(m.locoFrame.p):z.set(-10,28,-30);F.lerp(Kt,Math.min(1,mt*2.5));const $=Zt?Math.max(48,Math.min(150,Vt*.9+32)):270;i.updateShadow(F,$),x.update({time:Z,camera:i.camera,trainPos:m.locoFrame.p,speed:m.state.speed,chuffs:m.state.chuffs,joints:m.state.jointHits,steam:v.events.steamBurst,camHeight:i.camera.position.y-o.fastHeight(i.camera.position.x,i.camera.position.z),riverDist:o.riverDist(i.camera.position.x,i.camera.position.z),fallsPos:u.fallsBase,paused:m.paused}),S.update(mt,m.state.speed*3.6,f.mode==="cinematic"?f.introTime:null,D),i.render(Z),X=requestAnimationFrame(k)},K=Z=>{m.setDistance(g+m.targetSpeed*Z),m.state.speed=m.targetSpeed,f.seek(Z)};window.__seek=K,window.__he={shared:es,stage:i,track:r,land:o,train:m,viaduct:l,rig:f,fx:v,veg:h,water:u,audio:x,sheep:d,INTRO_LENGTH:td},k();const rt=()=>{cancelAnimationFrame(X),f.controls.dispose(),x.dispose(),S.destroy(),v.dispose(),d.dispose(),i.scene.traverse(Z=>{const mt=Z;mt.geometry?.dispose?.();const Vt=Array.isArray(mt.material)?mt.material:mt.material?[mt.material]:[];for(const Zt of Vt){for(const Kt of Object.values(Zt))Kt instanceof qe&&Kt.dispose();Zt.dispose()}}),c.dispose(),i.dispose(),Za.innerHTML=""};window.addEventListener("pagehide",rt,{once:!0})}d1().catch(s=>{console.error(s);const t=document.getElementById("loader"),e=document.getElementById("status");t&&e&&(e.textContent=/webgl/i.test(String(s))?"This experience needs a WebGL 2 capable browser.":"Something went wrong while building the scene — see the console.",e.style.color="#e0907a")});export{We as B,Nu as C,Cx as L,ue as M,Hx as O,Ui as P,Y_ as S,A as V,_e as a,c1 as d};

import { Euler, Matrix4, Quaternion, Vector3 } from 'three';
import { Builder, SECTION_LABELS } from './Builder.js';
export { SECTION_LABELS };

// Coordinates are in model units; front is +Z. Armor has actual depth and a
// mechanical layer underneath. Temporary joint groups are flattened for animation.
function leg(b,s) {
  b.group('legs','frame',[s*1.10,9.14,0],[.025,s*.12,s*.085],()=>{
    b.sphere('Hip universal bearing','steel',[0,0,0],.58);
    b.cylinder('Hip retaining ring','dark',[0,-.4,0],.49,.37);
    b.hull('Femur load frame','dark',[0,-1.64,0],[[-1.25,.34,.36],[-.9,.43,.4],[.9,.43,.41],[1.2,.32,.34]]);
    for(const side of [-1,1]) {
      b.rod('Thigh hydraulic cylinder','steel',[side*.26,-.5,-.37],[side*.26,-1.93,-.37],.14);
      b.rod('Thigh polished piston','silver',[side*.26,-1.76,-.37],[side*.26,-2.64,-.37],.073);
      b.rod('Anterior thigh strut','steel',[side*.34,-.6,.32],[side*.28,-2.47,.35],.10);
    }
    b.jointDetail([0,-3.39,0],.56,1.18);
    b.box('Knee crosslink','steel',[0,-3.39,.32],[.77,.33,.37]);
    b.hull('Shin structural spine','dark',[0,-5.5,-.05],[[-1.65,.31,.3],[-.9,.4,.37],[.9,.38,.39],[1.63,.31,.29]]);
    for(const side of [-1,1]) {
      b.rod('Calf hydraulic cylinder','steel',[side*.31,-4.21,-.4],[side*.31,-5.91,-.4],.17);
      b.rod('Calf hydraulic piston','silver',[side*.31,-5.63,-.4],[side*.31,-7.28,-.29],.085);
      b.cylinder('Calf actuator collar','gold',[side*.31,-5.81,-.4],.183,.13);
      b.rod('Shin front support','steel',[side*.23,-4.18,.34],[side*.23,-7.32,.30],.09);
    }
    for(let n=0;n<9;n++) b.box('Shin frame heat sink','steel',[0,-4.2-n*.31,.37],[.61,.085,.16]);
    b.jointDetail([0,-7.9,0],.40,1.08);
    b.sphere('Ankle universal joint','dark',[0,-8.15,0],.41);
    b.scope('armor',()=>{
      // The thighs taper toward the knee and have clipped rather than square corners.
      b.hull('Thigh outer armor','white',[0,-1.61,-.02],[[-1.36,.53,.45],[-1.15,.66,.57],[.63,.72,.62],[1.25,.59,.48]],[],.27);
      b.panel('Thigh inset front facet','whiteLight',[0,-1.29,.613],[1.11,1.79,.085],[0,0,0],.86);
      b.profile('Thigh lateral inset','whiteDark',[s*.63,-1.65,.03],[[-.38,.87],[.28,.74],[.35,-.71],[.14,-1.03],[-.30,-.99]],.055,[0,Math.PI/2,0]);
      b.line('Thigh stepped seam','dark',[[-.49,-2.22,.51],[-.29,-2.22,.55],[-.18,-2.38,.55],[.40,-2.38,.51]],.012);
      b.slot([s*.35,-.92,.673],[.105,.26,.024]);
      b.slot([-s*.35,-2.01,.601],[.08,.20,.023]);
      b.mark([-.25,-.71,.67],[.22,.025,.014]);
      b.mark([-.25,-.77,.67],[.14,.017,.014],'dark');
      b.profile('Patellar armor','whiteLight',[0,-3.31,.56],[[-.49,.68],[.49,.68],[.56,.34],[.40,-.42],[.22,-.63],[-.22,-.63],[-.40,-.42],[-.56,.34]],.46,[-.07,0,0]);
      b.panel('Knee mechanical insert','whiteDark',[0,-3.25,.82],[.64,.51,.05]);
      b.seam([0,-3.56,.842],[.48,.034,.025]);
      // Sculpted calf has a pronounced rear bulge, narrowing again at the ankle.
      b.hull('Contoured calf rear armor','whiteDark',[0,-5.44,-.29],[[-1.76,.48,.42],[-1.05,.64,.69],[-.28,.8,.91,.0],[.61,.83,.83,.0],[1.20,.7,.60],[1.55,.54,.43]],[],.30);
      b.hull('Shin front armor','white',[0,-5.57,.40],[[-1.66,.45,.29],[-1.28,.54,.38],[.23,.64,.42],[1.25,.72,.40],[1.66,.54,.27]],[],.22);
      b.profile('Shin central armor ridge','whiteLight',[0,-5.21,.83],[[-.30,1.38],[.3,1.38],[.39,.90],[.23,-1.24],[.0,-1.55],[-.23,-1.24],[-.39,.90]],.15,[-.035,0,0]);
      b.profile('Shin stepped inlay','whiteDark',[s*.43,-5.15,.77],[[-.15,1.12],[.15,1.12],[.15,.49],[.08,.34],[.08,-.85],[-.16,-.85]],.034);
      b.line('Shin stepped panel line','dark',[[-.51,-6.09,.72],[-.27,-6.09,.82],[-.17,-6.25,.83],[.0,-6.25,.83]],.013);
      b.line('Shin upper seam','dark',[[-.61,-4.29,.72],[-.41,-4.29,.78],[-.25,-4.46,.91],[.25,-4.46,.91],[.40,-4.29,.78],[.61,-4.29,.72]],.010);
      b.panel('Ankle top cuff','whiteLight',[0,-7.17,.40],[1.25,.47,.89],[.15,0,0],1.04);
      b.box('Ankle cuff groove','dark',[0,-7.18,.886],[.93,.083,.036]);
      for(const side of [-1,1]) {
        b.panel('Calf outer service hatch','white',[side*.72,-5.20,-.30],[1.10,1.42,.085],[0,Math.PI/2,0],.8);
        b.box('Calf side vent well','black',[side*.775,-5.74,-.35],[.035,.78,.42]);
        for(let n=0;n<5;n++) b.box('Calf radiator fin','steel',[side*.802,-6.04+n*.145,-.35],[.03,.045,.34]);
        b.box('Calf corner fastener','dark',[side*.806,-4.50,-.29],[.03,.15,.11]);
        b.box('Calf small hatch','whiteDark',[side*.826,-5.0,-.3],[.02,.27,.31]);
      }
      b.slot([s*.37,-6.69,.69],[.075,.14,.025]);
      b.mark([s*.43,-4.69,.83],[.11,.043,.015]);
      b.mark([s*.43,-4.78,.83],[.17,.019,.015],'dark');
    });
    b.group('feet','frame',[0,-8.61,.48],[0,0,-s*.025],()=>{
      b.box('Foot skeleton','dark',[0,.04,0],[1.01,.53,1.94]);
      b.rod('Toe hinge','steel',[-.54,.19,.63],[.54,.19,.63],.14);
      b.scope('armor',()=>{
        b.hull('Red foot lower shell','red',[0,-.01,.0],[[-.30,.79,1.35],[-.21,.83,1.40],[.22,.80,1.34],[.39,.66,1.21]],[],.22);
        b.hull('Red toe upper armor','redLight',[0,.27,.72],[[-.12,.77,.63],[.12,.70,.65],[.38,.56,.51,-.12]],[],.25);
        b.panel('Toe center service inset','red',[0,.54,.79],[.65,.033,.57],[.18,0,0]);
        b.box('Toe front black recess','black',[0,.09,1.414],[.56,.13,.033]);
        b.box('Toe front inset lip','steel',[0,.02,1.434],[.43,.042,.026]);
        b.hull('White instep armor','whiteLight',[0,.54,-.29],[[-.10,.67,.67],[.16,.62,.60],[.45,.49,.47,-.10]],[],.25);
        b.panel('Ankle raised front plate','white',[0,.77,.10],[1.16,.38,.42],[.23,0,0]);
        b.box('Instep recessed joint gap','black',[0,.73,.37],[.96,.12,.08],[.22,0,0]);
        b.panel('Rear heel plate','whiteDark',[0,.44,-1.01],[1.23,.55,.42]);
        b.box('Foot underside','black',[0,-.31,0],[1.52,.10,2.55]);
        for(let n=0;n<6;n++) b.box('Sole tread','dark',[0,-.35,-1.02+n*.4],[1.55,.06,.09]);
        for(const side of [-1,1]) {
          b.box('Toe edge latch','dark',[side*.59,.31,1.29],[.085,.14,.055]);
          b.mark([side*.47,.53,.91],[.12,.025,.017]);
        }
      });
    });
  });
}

function torso(b) {
  b.group('torso','frame',[0,0,0],[0,0,0],()=>{
    b.hull('Chest load bearing chassis','dark',[0,12.47,0],[[-1.34,1.24,.64],[-.62,1.60,.80],[.69,1.75,.80],[1.2,1.45,.63]]);
    b.box('Reactor front chassis','steel',[0,12.38,.78],[1.05,1.54,.29]);
    b.cylinder('Central reactor cover','dark',[0,12.46,.98],.39,.14,[Math.PI/2,0,0]);
    b.torus('Reactor locking ring','gold',[0,12.46,1.06],.28,.035);
    b.box('Shoulder crossbeam','steel',[0,13.51,-.04],[3.87,.45,1.02]);
    for(const s of [-1,1]) {
      b.jointDetail([s*2.01,13.35,0],.58,.64);
      b.box('Chest heat exchanger','black',[s*1.13,12.83,.81],[1.09,1.41,.4]);
      for(let n=0;n<8;n++) b.box('Heat exchanger rib','steel',[s*1.13,12.27+n*.16,1.03],[.94,.055,.08]);
      b.rod('Chest hydraulic support','silver',[s*.86,11.19,.56],[s*1.47,13.11,.61],.10);
      b.rod('Rear shoulder actuator','steel',[s*.80,11.48,-.59],[s*1.47,13.42,-.59],.14);
    }
    for(let n=0;n<8;n++) b.box('Segmented spinal column','steel',[0,10.66+n*.4,-.58],[.86,.27,.66]);
    b.scope('armor',()=>{
      // The blue chest wraps around the red abdominal core rather than forming a box.
      b.hull('Chest main upper breastplate','blue',[0,13.18,.08],[[-.84,1.78,.86,.13],[-.31,2.12,1.01,.04],[.48,2.10,.94],[.91,1.56,.65]],[],.25);
      for(const s of [-1,1]) {
        b.group('torso','armor',[s*1.20,12.98,1.02],[0,s*.095,-s*.025],()=>{
          b.panel('Blue vent bezel','blueDark',[0,0,.0],[1.30,1.29,.13]);
          b.panel('Vent cavity','black',[0,0,.09],[1.07,1.07,.06]);
          b.box('Golden vent upper border','yellow',[0,.53,.18],[1.13,.13,.17]);
          b.box('Golden vent lower border','yellow',[0,-.53,.18],[1.13,.13,.17]);
          for(const side of [-1,1]) b.box('Golden vent side border','yellow',[side*.51,0,.18],[.12,1.01,.17]);
          for(let n=0;n<4;n++) {
            b.box('Chest intake louver','gold',[0,-.37+n*.247,.12],[.89,.14,.28],[.31,0,0]);
            b.box('Chest louver leading edge','yellow',[0,-.32+n*.247,.26],[.90,.045,.05],[.31,0,0]);
          }
        });
        b.profile('Chest side angular skirt','blue',[s*1.80,12.23,.54],[[s*-.48,.53],[s*.43,.50],[s*.48,-.21],[s*.14,-.44],[s*-.35,-.18]],.73,[0,s*.16,0]);
        b.profile('Chest collar slope','blueLight',[s*1.18,13.94,.02],[[-.79,.18],[.63,.20],[.91,-.20],[-.8,-.26]],1.25,[0,0,-s*.08]);
        b.panel('Yellow collar block','yellow',[s*.57,14.04,.14],[.49,.37,.83],[-.1,0,-s*.20]);
        b.box('Collar service recess','dark',[s*1.16,14.13,.39],[.21,.046,.23]);
        b.box('Chest side latch','dark',[s*1.84,13.44,1.02],[.10,.25,.035],[0,0,-s*.08]);
        b.box('Chest lower side inset','blueDark',[s*1.82,12.12,1.00],[.14,.27,.05]);
        b.line('Chest upper stepped seam','blueDark',[[s*.55,13.59,1.01],[s*.78,13.59,1.08],[s*.90,13.76,1.03],[s*1.54,13.76,1.03]],.013);
        b.mark([s*1.85,13.22,1.09],[.13,.034,.014],'white');
        b.slot([s*1.89,12.55,1.01],[.09,.17,.026]);
      }
      b.profile('Blue central chest keel','blueLight',[0,12.45,1.15],[[-.45,1.35],[.45,1.35],[.48,.49],[.33,.27],[.33,-1.48],[.12,-1.66],[-.28,-1.57],[-.43,-.84]],.44,[.015,0,0]);
      b.panel('Central keel recessed strip','blueDark',[0,13.02,1.402],[.42,.76,.028]);
      b.box('Center keel cross rib','blue',[0,12.54,1.42],[.66,.10,.10]);
      b.line('Center keel panel seam','blueDark',[[-.25,11.70,1.40],[.16,11.70,1.40],[.26,11.55,1.40]],.012);
      b.panel('Chest back armor','blueDark',[0,13.05,-.93],[3.51,2.01,.3]);
    });
    b.cylinder('Neck universal joint','black',[0,14.15,0],.36,.56);
    b.cylinder('Neck retaining flange','steel',[0,14.21,0],.45,.13);
    b.rod('Neck actuator','silver',[-.25,13.99,.18],[-.21,14.52,.15],.055);
  });
  b.group('waist','frame',[0,0,0],[0,0,0],()=>{
    b.cylinder('Waist rotary core','dark',[0,10.35,0],.91,1.8);
    for(let n=0;n<7;n++) b.cylinder('Waist bearing collar',n%2?'steel':'black',[0,9.62+n*.22,0],1.0,.1);
    b.box('Pelvic crossmember','dark',[0,9.15,-.05],[2.78,.83,1.18]);
    for(const s of [-1,1]) {
      b.rod('Abdominal piston','silver',[s*.76,9.61,.63],[s*1.07,11.66,.65],.115);
      b.rod('Hip diagonal strut','steel',[s*.75,9.18,.38],[s*1.0,10.21,.43],.1);
    }
    b.scope('armor',()=>{
      b.hull('Red abdominal core armor','red',[0,10.92,.06],[[-.73,1.09,.64],[-.35,1.28,.76],[.61,1.51,.84],[1.09,1.56,.78]],[],.26);
      for(const s of [-1,1]) {
        b.panel('Red abdominal front facet','redLight',[s*.82,11.41,.86],[.88,1.03,.13],[-.06,s*.11,-s*.025]);
        b.profile('Red torso side panel','red',[s*1.35,11.05,-.11],[[-.52,.58],[.34,.47],[.42,-.51],[-.37,-.58]],.17,[0,Math.PI/2,0]);
        b.box('Abdominal side vent','black',[s*1.45,10.65,.02],[.025,.32,.47]);
        for(let n=0;n<3;n++) b.box('Abdominal vent grille','steel',[s*1.47,10.56+n*.085,.02],[.024,.022,.34]);
        b.slot([s*1.05,11.70,.94],[.064,.19,.023]);
      }
      b.seam([0,10.84,.86],[2.09,.025,.02]);
      b.box('White waist belt','white',[0,9.86,.09],[2.69,.46,1.55]);
      b.profile('Central belt buckle','red',[0,9.83,1.0],[[-.39,.37],[.39,.37],[.27,-.39],[-.27,-.39]],.21);
      b.profile('Buckle golden chevron','yellow',[0,9.86,1.13],[[-.22,.11],[0,-.07],[.22,.11],[.14,-.10],[0,-.21],[-.14,-.10]],.025,[],.006);
      b.panel('White central codpiece','white',[0,8.80,.93],[.68,1.39,.44],[-.1,0,0],.70);
      b.panel('Codpiece inset','whiteDark',[0,8.39,1.19],[.30,.35,.022]);
      for(const s of [-1,1]) {
        b.group('waist','armor',[s*1.0,8.91,.96],[-.16,0,s*.16],()=>{
          b.panel('Front skirt main armor','white',[0,0,0],[1.29,1.74,.37],[],1.06);
          b.panel('Skirt upper yellow recess','gold',[0,.30,.235],[.84,.79,.12]);
          b.panel('Skirt upper yellow plate','yellow',[0,.34,.31],[.71,.65,.05]);
          b.slot([s*.45,-.44,.22],[.062,.20,.028]);
          b.slot([-s*.45,-.44,.22],[.062,.20,.028]);
          b.line('Skirt lower stepped seam','dark',[[-.48,-.66,.21],[-.32,-.66,.21],[-.25,-.75,.21],[.25,-.75,.21],[.34,-.66,.21],[.48,-.66,.21]],.012);
          b.box('Skirt upper latch','dark',[s*.49,.6,.22],[.075,.16,.02]);
        });
        b.group('waist','armor',[s*1.85,8.96,-.07],[.04,s*Math.PI/2,-s*.13],()=>{
          b.panel('Hip side skirt','white',[0,0,0],[1.57,1.71,.31],[],1.10);
          b.panel('Hip skirt outer hatch','whiteDark',[0,.12,.20],[.91,.89,.07]);
          b.panel('Hip skirt raised center','white',[0,.14,.25],[.66,.62,.04]);
          b.seam([0,-.56,.18],[1.1,.029,.02]);
          for(const side of [-1,1]) b.slot([side*.57,.51,.18],[.075,.17,.02]);
        });
        b.panel('Rear skirt armor','whiteDark',[s*.85,8.94,-.99],[1.42,1.69,.36],[.17,0,-s*.07]);
        b.box('Rear skirt maintenance inset','white',[s*.85,9.04,-1.20],[.83,.69,.065]);
      }
    });
  });
}

const PALM_GRIP = [0,-.16,.34];
const RIFLE_GRIP = [0,-.67,-.24];
const SHIELD_DOCK = [-.55,-.52,-.68];
const FOREARM_DOCK = [.665,-1.20,0];

function hand(b,s) {
  const gripRotation=Math.PI/2;
  const group=b.group('arms','frame',[0,-2.72,0],[0,gripRotation,0],()=>{
    b.box('Hand carpal block','dark',[0,0,0],[.78,.63,.28]);
    b.box('Hand dorsal armor','dark',[0,.01,-.17],[.72,.54,.12]);
    for(let n=0;n<4;n++) {
      const x=-.29+n*.194;
      b.cylinder('Finger proximal joint','dark',[x,.015,.205],.087,.17,[0,0,Math.PI/2],.087,12);
      b.box('Finger proximal segment','dark',[x,-.08,.40],[.168,.31,.22],[.43,0,0],.03);
      b.box('Finger middle segment','dark',[x,-.30,.53],[.16,.22,.21],[-.30,0,0],.03);
      b.box('Finger distal segment','dark',[x,-.44,.33],[.15,.18,.28],[-.85,0,0],.028);
      b.box('Finger knuckle armor','steel',[x,.045,.30],[.139,.095,.12],[.25,0,0],.018);
      b.seam([x,-.21,.58],[.12,.022,.016]);
    }
    const thumbSide=s===-1?-1:1;
    b.box('Thumb proximal','dark',[thumbSide*.43,-.05,.24],[.23,.33,.24],[.2,0,-thumbSide*.27],.035);
    b.box('Thumb distal','dark',[thumbSide*.36,-.24,.41],[.23,.24,.25],[-.40,0,thumbSide*.35],.035);
    b.socket(s===-1?'rightPalmGrip':'leftPalmGrip',PALM_GRIP);
  });
  return group;
}

function arm(b,s) {
  let forearm,handGroup;
  b.group('arms','frame',[s*3.0,13.3,-.03],[s===-1?-.055:-.025,0,s*.095],()=>{
    b.sphere('Shoulder ball','steel',[0,0,0],.59);
    b.cylinder('Humerus bearing','dark',[0,-1.48,0],.38,1.97);
    for(const side of [-1,1]) {
      b.rod('Bicep hydraulic housing','steel',[side*.27,-.57,-.23],[side*.27,-1.68,-.23],.11);
      b.rod('Bicep hydraulic rod','silver',[side*.27,-1.55,-.23],[side*.27,-2.25,-.23],.065);
    }
    b.jointDetail([0,-2.80,0],.44,.97);
    b.scope('armor',()=>{
      b.hull('Shoulder contoured outer shell','white',[0,.18,0],[[-.78,.77,.66],[-.45,1.02,.83],[.54,1.04,.85],[.88,.76,.64]],[],.21);
      b.profile('Pauldron forward armor','whiteLight',[0,.16,.865],[[-.98,.42],[-.76,.72],[.75,.72],[.99,.40],[.89,-.51],[.57,-.79],[-.72,-.69],[-.94,-.36]],.20);
      b.profile('Pauldron diagonal inset','white',[0,.13,.99],[[-.83,.20],[-.55,.41],[.67,.41],[.84,.22],[.75,-.34],[.42,-.58],[-.65,-.45]],.033);
      b.line('Shoulder angular seam','dark',[[-.88,.43,.99],[-.61,.43,1.00],[-.43,.61,.99],[.60,.61,.99],[.84,.39,.99]],.012);
      for(const side of [-1,1]) {
        b.slot([side*.67,.70,.94],[.22,.10,.027]);
        b.box('Shoulder lower latch','dark',[side*.65,-.40,1.02],[.07,.21,.03]);
      }
      b.mark([-.43,.29,1.023],[.20,.031,.015]);
      b.mark([-.43,.22,1.023],[.30,.019,.015],'dark');
      b.hull('Upper arm tapered armor','white',[0,-1.52,.0],[[-.94,.40,.40],[-.71,.50,.48],[.65,.51,.49],[.90,.43,.4]],[],.18);
      b.panel('Upper arm forward facet','whiteLight',[0,-1.46,.515],[.78,1.13,.07]);
      b.profile('Upper arm stepped inlay','whiteDark',[s*.34,-1.77,.54],[[-.17,.36],[.17,.36],[.17,-.03],[.05,-.03],[.05,-.45],[-.17,-.45]],.03);
      b.seam([0,-1.92,.56],[.70,.028,.02]);
      b.slot([-s*.25,-1.12,.56],[.075,.17,.022]);
    });
    forearm=b.group('arms','frame',[0,-2.8,0],[s===-1?-.15:-.12,0,0],()=>{
      for(let n=0;n<5;n++) b.box('Elbow exposed linkage','steel',[0,.17+n*.11,.31],[.72,.055,.13]);
      b.hull('Forearm skeleton','dark',[0,-1.14,0],[[-.95,.26,.29],[-.62,.37,.35],[.70,.35,.33],[.95,.26,.27]]);
      for(const side of [-1,1]) {
        b.rod('Forearm hydraulic housing','steel',[side*.24,-.42,-.3],[side*.24,-1.35,-.3],.1);
        b.rod('Forearm piston','silver',[side*.24,-1.24,-.3],[side*.24,-1.88,-.25],.06);
      }
      b.cylinder('Wrist ring','steel',[0,-2.25,0],.31,.34);
      b.cylinder('Wrist flange','black',[0,-2.35,0],.38,.13);
      b.group('arms','armor',[0,2.8,0],[0,0,0],()=>{
      b.panel('Elbow front guard','whiteDark',[0,-2.8,.45],[.69,.55,.22]);
      b.hull('Forearm tapered shell','white',[0,-4.01,0],[[-.93,.42,.44],[-.61,.56,.54],[.54,.65,.59],[.99,.48,.44]],[],.23);
      b.profile('Forearm raised armor','whiteLight',[0,-3.95,.59],[[-.49,.67],[.39,.76],[.53,.45],[.41,-.62],[.21,-.84],[-.33,-.80],[-.46,-.40]],.18);
      b.profile('Forearm recessed stripe','whiteDark',[0,-3.96,.704],[[-.24,.42],[.24,.42],[.24,-.06],[.12,-.22],[.12,-.55],[-.24,-.55]],.032);
      b.line('Forearm stepped seam','dark',[[-.42,-4.18,.71],[-.28,-4.18,.73],[-.19,-4.31,.73],[.34,-4.31,.71]],.013);
      b.box('Forearm wrist recess','black',[0,-4.75,.55],[.72,.11,.06]);
      for(const side of [-1,1]) {
        b.slot([side*.36,-3.45,.70],[.08,.17,.03]);
        b.box('Forearm side docking rail','whiteDark',[side*.61,-3.99,.0],[.07,.86,.26]);
      }
      });
      handGroup=hand(b,s);
      if(s===1)b.socket('leftForearmDock',FOREARM_DOCK);
    });
  });
  return {forearm,hand:handGroup};
}

function head(b) {
  b.group('head','frame',[0,15.12,.04],[0,-.065,0],()=>{
    b.sphere('Cranial sensor core','dark',[0,.42,-.03],.79,[1,1.12,.92]);
    b.box('Optical block','black',[0,.40,.65],[1.21,.48,.40]);
    for(const s of [-1,1]) {
      b.cylinder('Head side gimbal','steel',[s*.73,.19,-.01],.37,.18,[0,0,Math.PI/2]);
      b.profile('Amber optical sensor','eye',[s*.29,.44,.895],[[-.235,.077],[.235,.077],[.16,-.077],[-.17,-.077]],.04,[0,s*.09,s*.11],.005);
      b.box('Optical sensor lower border','gold',[s*.29,.33,.897],[.42,.035,.045],[0,0,s*.11]);
    }
    b.scope('armor',()=>{
      // A faceted dome wraps the back and crown; the face is recessed beneath a brow.
      b.hull('Helmet domed rear shell','white',[0,.43,-.24],[[-.87,.64,.51],[-.55,.83,.69],[.25,.86,.73],[.69,.73,.66],[.97,.45,.43],[1.05,.26,.31]],[],.37);
      b.hull('Helmet center crest','whiteLight',[0,.86,.02],[[-.03,.22,.57],[.37,.24,.54],[.74,.20,.38]],[],.20);
      b.profile('Red forehead cap','redLight',[0,1.05,.67],[[-.21,.23],[.21,.23],[.23,-.19],[-.20,-.23]],.22,[-.12,0,0]);
      b.panel('Forehead sensor inset','sensor',[0,1.16,.797],[.23,.12,.028]);
      for(const s of [-1,1]) {
        b.profile('Helmet side cheek shroud','whiteLight',[s*.73,.03,.10],[[s*-.22,.68],[s*.18,.65],[s*.33,.29],[s*.29,-.58],[s*.11,-.75],[s*-.21,-.61]],.90,[0,s*.05,-s*.035]);
        b.panel('Cheek vent recess','dark',[s*.77,.0,.587],[.26,.94,.065],[0,0,-s*.05]);
        for(let n=0;n<5;n++) b.box('Cheek vent horizontal slat','white',[s*.77,-.36+n*.17,.635],[.245,.077,.042],[0,0,-s*.05]);
        b.profile('Angled helmet brow','white',[s*.38,.70,.76],[[-.40,.12],[.26,.23],[.43,.10],[.41,-.08],[-.30,-.15]],.26,[0,s*.10,s*.09]);
        b.profile('Cheek face guard','white',[s*.39,-.02,.77],[[-.16,.25],[.16,.29],[.23,-.22],[.05,-.47],[-.17,-.29]],.20,[0,s*.18,-s*.05]);
        // The reference uses the original white antenna, with a red central mount.
        b.profile('White V-fin','whiteLight',[s*.10,.87,.98],[[0,-.065],[s*.27,-.04],[s*1.57,1.12],[s*.39,.22]],.085,[0,-s*.06,0],.01);
        b.profile('V-fin shaded edge','whiteDark',[s*.12,.87,.925],[[0,-.05],[s*.27,-.03],[s*1.57,1.12],[s*.34,.19]],.025,[0,-s*.06,0],.006);
        b.cylinder('Vulcan recessed housing','dark',[s*.66,.88,.57],.13,.18,[.75,s*.18,0],.13,16);
        b.cylinder('Vulcan gun barrel','steel',[s*.66,.81,.65],.078,.15,[Math.PI/2,s*.18,0],.078,12);
        b.cylinder('Vulcan aperture','black',[s*.66,.81,.735],.048,.025,[Math.PI/2,0,0],.048,12);
        b.slot([s*.59,.02,.91],[.055,.16,.02]);
      }
      b.profile('Sculpted white face mask','whiteLight',[0,-.035,.905],[[-.31,.27],[0,.35],[.31,.27],[.25,-.13],[.13,-.37],[-.13,-.37],[-.25,-.13]],.27);
      b.profile('Face mask center ridge','white',[0,.005,1.062],[[-.043,.27],[.043,.27],[.095,-.19],[0,-.32],[-.095,-.19]],.055);
      for(const s of [-1,1]) {
        b.box('Face mask breathing slit','dark',[s*.12,-.015,1.076],[.034,.23,.027],[0,0,-s*.16]);
        b.box('Face lower breathing slit','dark',[s*.16,-.12,1.056],[.033,.12,.024],[0,0,-s*.20]);
      }
      b.profile('Red chin guard','red',[0,-.50,.87],[[-.15,.24],[.15,.24],[.20,-.15],[0,-.31],[-.20,-.15]],.28);
      b.profile('Red V-fin center block','red',[0,.86,1.08],[[-.23,.30],[.18,.34],[.27,-.15],[-.08,-.31],[-.25,-.13]],.22);
      b.box('Rear head camera housing','red',[0,.83,-.99],[.36,.25,.09]);
      b.box('Rear head camera glass','sensor',[0,.84,-1.046],[.21,.11,.02]);
      b.line('Helmet rear panel seam','dark',[[-.50,.68,-.88],[-.25,.68,-.93],[-.14,.54,-.99],[.14,.54,-.99],[.25,.68,-.93],[.50,.68,-.88]],.01);
    });
  });
}

function backpack(b) {
  b.group('backpack','armor',[0,12.44,-1.60],[0,0,0],()=>{
    b.hull('Backpack main housing','dark',[0,0,0],[[-1.45,1.19,.54],[-1.19,1.44,.68],[.99,1.44,.68],[1.39,1.12,.52]],[],.21);
    b.panel('Backpack upper rear panel','whiteDark',[0,.58,-.72],[2.52,1.08,.16]);
    b.panel('Backpack lower rear panel','steel',[0,-.51,-.72],[2.44,.89,.17]);
    b.box('Backpack center spine','dark',[0,.2,-.87],[.32,2.04,.22]);
    for(const s of [-1,1]) {
      b.panel('Backpack side armor','whiteDark',[s*1.45,.05,0],[1.12,2.12,.16],[0,Math.PI/2,0]);
      b.cylinder('Thruster main bell','steel',[s*.74,-.72,-1.02],.48,.70,[Math.PI/2,0,0],.29,32);
      b.cylinder('Thruster interior','black',[s*.74,-.72,-1.39],.39,.04,[Math.PI/2,0,0],.39,32);
      b.torus('Thruster rim','silver',[s*.74,-.72,-1.42],.40,.035);
      b.cylinder('Thruster inner cone','steel',[s*.74,-.72,-1.43],.19,.06,[Math.PI/2,0,0],.08,20);
      for(let n=0;n<4;n++) b.box('Backpack heat sink','dark',[s*.70,.29+n*.17,-.84],[.83,.065,.1]);
      b.slot([s*.9,1.02,-.84],[.17,.09,.025]);
      b.group('backpack','armor',[s*1.07,1.05,.03],[0,0,-s*.13],()=>{
        b.cylinder('Beam saber locking dock','steel',[0,.1,0],.25,.71);
        b.cylinder('Beam saber lower grip','white',[0,.59,0],.195,.52,[],.195,24);
        b.cylinder('Beam saber main grip','whiteLight',[0,1.25,0],.19,1.01,[],.19,24);
        for(let n=0;n<5;n++) b.cylinder('Saber grip band','whiteDark',[0,.63+n*.24,0],.204,.054,[],.204,24);
        b.cylinder('Saber emitter neck','steel',[0,1.85,0],.15,.22);
        b.cylinder('Saber emitter collar','whiteLight',[0,2.02,0],.23,.16,[],.23,24);
        b.cylinder('Saber aperture','dark',[0,2.11,0],.14,.025);
        b.box('Saber activation switch','dark',[0,1.52,.193],[.10,.20,.029]);
      });
    }
  });
}

function equipment(b,rightArm,leftArm) {
  const previousParent=b.parent;
  // The left forearm rail and shield bracket are the same physical attachment.
  b.parent=leftArm.forearm;
  const shieldRotation=new Euler(0,.60,0);
  const shieldQuaternion=new Quaternion().setFromEuler(shieldRotation);
  const shieldPosition=new Vector3(...FOREARM_DOCK).sub(new Vector3(...SHIELD_DOCK).applyQuaternion(shieldQuaternion));
  b.group('equipment','armor',shieldPosition.toArray(),shieldRotation.toArray().slice(0,3),()=>{
    const outline=[[-1.28,2.91],[1.11,2.91],[1.45,2.38],[1.45,-1.91],[.74,-3.02],[-.68,-3.02],[-1.45,-2.08],[-1.45,2.39]];
    b.profile('Shield structural perimeter','whiteLight',[0,0,0],outline,.43,[],.065);
    b.profile('Shield red face base','red',[0,0,.28],outline.map(([x,y])=>[x*.84,y*.91]),.19,[],.045);
    b.profile('Shield left red facet','redLight',[-.66,.10,.41],[[-.44,2.39],[.43,2.39],[.43,-2.39],[-.31,-2.39],[-.44,-1.99]],.06);
    b.profile('Shield right red facet','red',[.65,.10,.41],[[-.45,2.39],[.18,2.39],[.47,1.93],[.47,-1.8],[-.06,-2.39],[-.45,-2.39]],.055);
    b.box('Shield viewport rim','whiteDark',[0,1.98,.43],[.82,.46,.17]);
    b.box('Shield viewport opening','black',[0,1.98,.53],[.62,.23,.03]);
    b.profile('Shield central cross','yellow',[0,-.40,.51],[[-.105,1.78],[.105,1.78],[.105,.31],[.91,.12],[.91,-.12],[.105,-.01],[.105,-1.98],[0,-2.14],[-.105,-1.98],[-.105,-.01],[-.91,-.12],[-.91,.12],[-.105,.31]],.11,[],.014);
    for(const s of [-1,1]) {
      b.profile('Shield edge raised armor','redLight',[s*.77,.0,.46],[[-.22,.76],[.22,.76],[.22,.49],[-.08,.36],[-.22,.36]],.14,[0,0,-s*.08]);
      b.profile('Shield lower reinforcement','redLight',[s*.78,-1.79,.47],[[-.24,.26],[.24,.26],[.24,-.16],[-.24,-.33]],.15);
      b.slot([s*1.22,1.10,.25],[.07,.22,.034]);
      b.slot([s*1.14,-1.96,.25],[.07,.17,.033]);
      b.line('Shield red panel seam','redDark' in b ? 'redDark' : 'dark',[[s*.31,2.41,.48],[s*.69,2.41,.48],[s*.80,2.22,.48]],.009);
      b.bolt([s*1.02,2.52,.28]);b.bolt([s*1.18,-1.72,.28]);
      b.mark([s*.71,2.27,.48],[.18,.037,.014],'white');
      b.box('Shield rear mounting lug','steel',[s*.57,-.15,-.43],[.33,.65,.38]);
    }
    b.socket('shieldForearmDock',SHIELD_DOCK);
    b.box('Shield forearm mounting shoe','dark',SHIELD_DOCK,[.36,.47,.25]);
    for(const side of [-1,1]) {
      b.rod('Shield articulated mounting link','steel',
        [SHIELD_DOCK[0]+side*.14,SHIELD_DOCK[1],SHIELD_DOCK[2]],
        [SHIELD_DOCK[0]+side*.14,SHIELD_DOCK[1],-.27],.085);
    }
    b.root.updateMatrixWorld(true);
    const palm=b.sockets.get('leftPalmGrip');
    const grip=b.parent.worldToLocal(palm.getWorldPosition(new Vector3()));
    const axis=new Vector3(1,0,0).applyQuaternion(palm.getWorldQuaternion(new Quaternion()))
      .applyQuaternion(b.parent.getWorldQuaternion(new Quaternion()).invert());
    const ends=[grip.clone().addScaledVector(axis,-.42),grip.clone().addScaledVector(axis,.42)];
    b.rod('Shield hand grip','black',ends[0].toArray(),ends[1].toArray(),.135);
    b.socket('shieldHandGrip',grip.toArray());
    for(const end of ends) {
      b.rod('Shield grip standoff','steel',end.toArray(),[end.x,end.y,-.27],.08);
      b.box('Shield grip anchor plate','dark',[end.x,end.y,-.29],[.30,.27,.08]);
    }
    b.panel('Shield rear service access','whiteDark',[0,1.24,-.29],[1.95,1.19,.12]);
    b.box('Shield rear lower spine','whiteDark',[0,-1.65,-.29],[.43,1.24,.15]);
    for(let n=0;n<5;n++) b.box('Shield rear reinforcement rib','steel',[0,-1.8+n*.72,-.26],[2.02,.06,.15]);
  });

  // Solve the rifle transform from its real pistol grip and the right palm.
  // Its barrel points down in the hand frame; its receiver sits ahead of the fist.
  b.parent=rightArm.hand;
  const rifleBasis=new Matrix4().makeBasis(new Vector3(0,0,1),new Vector3(-1,0,0),new Vector3(0,-1,0));
  const rifleRotation=new Euler().setFromRotationMatrix(rifleBasis);
  const rifleQuaternion=new Quaternion().setFromRotationMatrix(rifleBasis);
  const riflePosition=new Vector3(...PALM_GRIP).sub(new Vector3(...RIFLE_GRIP).applyQuaternion(rifleQuaternion));
  b.group('equipment','armor',riflePosition.toArray(),rifleRotation.toArray().slice(0,3),()=>{
    b.socket('riflePistolGrip',RIFLE_GRIP);
    b.hull('Beam rifle receiver','dark',[0,.16,-.08],[[-.42,.31,.86],[-.29,.37,1.0],[.47,.37,.99],[.64,.26,.83]],[],.16);
    for(const s of [-1,1]) {
      b.panel('Rifle side receiver armor','steel',[s*.38,.10,-.02],[1.59,.66,.055],[0,Math.PI/2,0]);
      b.box('Rifle side recessed rail','black',[s*.421,.08,.03],[.032,.13,1.19]);
      for(let n=0;n<4;n++) b.box('Receiver cooling slot','black',[s*.422,.40,-.57+n*.26],[.024,.12,.13]);
      b.cylinder('Receiver locking pin','steel',[s*.44,-.19,-.44],.095,.045,[0,0,Math.PI/2],.095,12);
      b.box('Rifle forward cooling rail','dark',[s*.19,.11,2.11],[.13,.23,1.22]);
    }
    b.box('Rifle top receiver rail','black',[0,.72,-.15],[.46,.16,1.87]);
    b.box('Rifle rear buttstock','dark',[0,.23,-1.34],[.48,.67,.75]);
    b.panel('Rifle stock butt plate','black',[0,.23,-1.77],[.55,.77,.15]);
    b.box('Rifle pistol grip','black',[0,-.67,-.24],[.37,.93,.42],[.19,0,0],.04);
    for(let n=0;n<5;n++) b.box('Rifle grip groove','steel',[0,-.36-n*.15,.025],[.28,.027,.025],[.19,0,0]);
    b.box('Trigger guard lower','steel',[0,-.80,.29],[.19,.11,.74]);
    b.box('Trigger guard forward','steel',[0,-.55,.64],[.19,.52,.11]);
    b.box('Trigger','dark',[0,-.47,.27],[.12,.3,.1],[.24,0,0]);
    b.cylinder('Rifle barrel housing','dark',[0,.19,1.16],.32,.67,[Math.PI/2,0,0],.32,24);
    b.cylinder('Rifle barrel collar','steel',[0,.19,1.57],.28,.15,[Math.PI/2,0,0],.28,24);
    b.cylinder('Beam rifle long barrel','dark',[0,.19,2.51],.19,1.81,[Math.PI/2,0,0],.19,24);
    b.cylinder('Rifle front barrel step','steel',[0,.19,3.48],.16,.22,[Math.PI/2,0,0],.16,24);
    b.cylinder('Rifle muzzle sleeve','dark',[0,.19,3.87],.22,.65,[Math.PI/2,0,0],.20,24);
    b.cylinder('Rifle muzzle aperture','black',[0,.19,4.21],.14,.026,[Math.PI/2,0,0],.14,24);
    b.torus('Rifle muzzle rim','steel',[0,.19,4.224],.16,.018);
    b.box('Rifle scope mount','steel',[0,.92,-.09],[.22,.45,.31]);
    b.cylinder('Beam rifle target sight','yellow',[0,1.22,-.09],.32,.55,[Math.PI/2,0,0],.30,24);
    b.cylinder('Rifle target sight bezel','dark',[0,1.22,.20],.25,.07,[Math.PI/2,0,0],.25,24);
    b.cylinder('Rifle optical lens','black',[0,1.22,.245],.19,.015,[Math.PI/2,0,0],.19,24);
    b.box('Rifle side auxiliary grip','dark',[-.69,.10,.65],[.96,.25,.27]);
    b.cylinder('Rifle auxiliary grip end','black',[-1.12,.10,.65],.22,.44,[Math.PI/2,0,0],.20,20);
  });
  b.parent=previousParent;
}

export function createGundam() {
  const b=new Builder();
  leg(b,-1);leg(b,1);torso(b);
  const rightArm=arm(b,-1),leftArm=arm(b,1);
  head(b);backpack(b);equipment(b,rightArm,leftArm);
  return b.finish();
}

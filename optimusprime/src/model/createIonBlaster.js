const PI=Math.PI;

/** Long, brushed-metal ion rifle based on the supplied movie-style reference. */
export function createIonBlaster(b,part,hand){
  const gun=part(hand,'Ion blaster deployment',
    {p:[0,.05,-.20],r:[PI/2,0,0]},
    {p:[0,-.08,.20],r:[0,0,0]},6.00,1.0);

  // Broad faceted receiver with a sloped shoulder stock.
  b.profile(gun,'gunmetal',[0,.23,.02],[[-.34,.29],[.34,.29],[.39,.15],[.35,-.29],[-.35,-.29],[-.39,.15]],1.22,[0,0,0]);
  b.box(gun,'steel',[0,.47,.02],[.58,.08,1.14]);
  b.box(gun,'dark',[0,-.09,.02],[.57,.09,1.15]);
  b.box(gun,'gunmetal',[0,.17,-.89],[.74,.72,.57],[.14,0,0],.045,'Rifle stock');
  b.box(gun,'dark',[0,.16,-1.19],[.71,.67,.09],[.14,0,0],.02,'Stock shoulder pad');
  for(const s of [-1,1]){
    b.plate(gun,'silver',[s*.397,.23,.02],.78,.46,.035,[0,s*PI/2,0]);
    b.box(gun,'steel',[s*.42,.46,.06],[.045,.055,.92]);
    b.box(gun,'dark',[s*.42,.13,.04],[.025,.035,.94]);
    for(let j=0;j<4;j++)b.box(gun,'black',[s*.423,.30,-.17+j*.18],[.022,.043,.11]);
    for(const z of [-.47,.45])b.cylinder(gun,'dark',[s*.43,.39,z],.027,.018,[0,0,PI/2],.027,6);
    b.rod(gun,'steel',[s*.33,-.17,-.45],[s*.33,-.17,.44],.045);
  }
  // Grip passes through the articulated fist. Magazine is forward of the hand.
  b.box(gun,'dark',[0,-.31,-.17],[.25,.48,.30],[.17,0,0],.025,'Pistol grip');
  for(let j=0;j<5;j++)b.box(gun,'black',[0,-.15-j*.065,-.015],[.27,.024,.025]);
  b.box(gun,'gunmetal',[0,-.48,.45],[.46,.81,.36],[-.16,0,0],.025,'Rifle magazine');
  b.box(gun,'silver',[0,-.89,.51],[.52,.07,.43],[-.16,0,0]);
  for(const s of [-1,1])for(let j=0;j<3;j++)b.box(gun,'dark',[s*.235,-.43,.36+j*.09],[.018,.46,.026],[-.16,0,0]);
  b.rod(gun,'steel',[-.16,-.12,.10],[-.16,-.38,.10],.026);
  b.rod(gun,'steel',[-.16,-.38,.10],[-.16,-.38,-.15],.026);

  // The barrel extends from a nested stowed position, with its shroud unfolding.
  const breech=part(gun,'Ion barrel extension',{p:[0,.25,-.16]},{p:[0,.25,.77]},6.43,.84);
  b.cylinder(breech,'steel',[0,0,.45],.22,1.04,[PI/2,0,0],.24,16);
  for(const z of [.07,.22,.83])b.torus(breech,'dark',[0,0,z],.24,.038);
  b.box(breech,'gunmetal',[0,.22,.4],[.25,.11,.76]);
  for(const s of [-1,1]){
    b.box(breech,'gunmetal',[s*.22,0,.38],[.10,.32,.70]);
    b.box(breech,'dark',[s*.28,0,.38],[.025,.09,.50]);
  }
  const shroud=part(breech,'Ion muzzle shroud',{p:[0,0,.05]},{p:[0,0,1.05]},6.78,.64);
  b.cylinder(shroud,'dark',[0,0,.57],.175,1.36,[PI/2,0,0],.175,24);
  b.cylinder(shroud,'gunmetal',[0,0,.02],.31,.17,[PI/2,0,0],.31,12);
  b.cylinder(shroud,'gunmetal',[0,0,1.14],.30,.20,[PI/2,0,0],.34,12);
  // Four long armor ribs leave deep, readable channels around the barrel.
  for(let j=0;j<4;j++){
    const a=PI/4+j*PI/2,x=Math.cos(a)*.235,y=Math.sin(a)*.235;
    b.box(shroud,'gunmetal',[x,y,.59],[.21,.14,1.13],[0,0,a-PI/2],.025,'Barrel shroud rail');
    b.box(shroud,'silver',[x*1.18,y*1.18,.59],[.11,.032,.94],[0,0,a-PI/2],.006);
  }
  b.cylinder(shroud,'black',[0,0,1.253],.22,.014,[PI/2,0,0],.22,24);
  b.torus(shroud,'steel',[0,0,1.27],.219,.026);
  b.torus(shroud,'gunmetal',[0,0,1.28],.145,.018);
  b.cylinder(shroud,'black',[0,0,1.285],.12,.01,[PI/2,0,0]);
  // Small sight and latches instead of ornamental glowing strips.
  b.box(shroud,'dark',[0,.34,1.09],[.07,.15,.15]);
  b.box(gun,'dark',[0,.55,-.27],[.12,.15,.16]);
  b.box(gun,'steel',[0,.54,.37],[.13,.10,.18]);
  return gun;
}

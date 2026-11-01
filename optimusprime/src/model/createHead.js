import * as THREE from 'three';

/** Broad G1-style helmet and folded faceplate from the supplied portrait. */
export function createHead(b,head){
  const PI=Math.PI;
  b.cylinder(head,'steel',[0,-.67,-.05],.24,.34);
  for(let i=0;i<4;i++)b.torus(head,'dark',[0,-.75+i*.075,-.05],.25,.029,[PI/2,0,0],24);
  head=b.group(head,'Helmet and face');
  head.scale.setScalar(.82);
  b.box(head,'black',[0,-.06,.03],[1.05,1.05,.74],undefined,.10,'Head inner frame');
  const dome=b.mesh(head,'Blue helmet dome',b.geometry('helmet-dome',()=>new THREE.SphereGeometry(.64,32,20)),'blue',[0,.36,-.03]);
  dome.scale.set(1,.98,.82);
  b.plate(head,'blueDark',[0,.10,-.30],1.20,1.11,.42);

  // A dark eye cavity sits behind the angular metal sockets and the strong blue brow.
  b.profile(head,'black',[0,.22,.49],[[-.58,.22],[.58,.22],[.54,-.17],[.40,-.24],[0,-.10],[-.40,-.24],[-.54,-.17]],.10);
  for(const s of [-1,1]){
    const mirror=points=>points.map(([x,y])=>[s*x,y]);
    b.profile(head,'silver',[0,0,.56],mirror([[.035,.36],[.55,.40],[.57,.20],[.43,.045],[.10,.15]]),.065);
    b.profile(head,'black',[0,0,.606],mirror([[.07,.335],[.515,.36],[.52,.21],[.425,.095],[.12,.18]]),.027);
    b.profile(head,'eye',[0,0,.626],mirror([[.105,.31],[.478,.335],[.475,.22],[.414,.14],[.14,.205]]),.018);
    b.profile(head,'blue',[0,0,.64],mirror([[.03,.355],[.57,.425],[.58,.50],[.10,.465]]),.08);

    // Side towers have broad blades and swept inner edges rather than needle antennae.
    b.profile(head,'blue',[0,0,.20],mirror([[.48,-.39],[.72,-.29],[.77,.27],[.68,1.15],[.59,1.18],[.60,.48],[.46,.23]]),.23);
    b.profile(head,'blueLight',[0,0,.336],mirror([[.62,.34],[.67,.43],[.65,1.08],[.62,1.08]]),.025);
    b.profile(head,'blue',[0,0,.43],mirror([[.49,-.05],[.68,-.16],[.61,-.61],[.46,-.68],[.42,-.39]]),.17);
    b.profile(head,'black',[0,0,.532],mirror([[.51,-.19],[.60,-.22],[.55,-.53],[.48,-.57]]),.018);
    for(let j=0;j<6;j++)b.box(head,'steel',[s*(.54-j*.005),-.25-j*.043,.55],[.07,.014,.015]);
    b.cylinder(head,'blue',[s*.65,-.10,-.02],.32,.20,[0,0,PI/2],.32,32);
    b.cylinder(head,'blueDark',[s*.76,-.10,-.02],.21,.034,[0,0,PI/2],.21,24);
    b.cylinder(head,'steel',[s*.783,-.10,-.02],.075,.018,[0,0,PI/2],.075,12);
    for(const y of [-.39,.20])b.bolt(head,[s*.66,y,.34],.022);
  }

  // Raised five-sided crest and recessed horizontal forehead ribs.
  b.profile(head,'blueDark',[0,0,.49],[[-.30,1.02],[0,1.065],[.30,1.02],[.235,.47],[0,.32],[-.235,.47]],.15);
  b.profile(head,'blueLight',[0,0,.58],[[-.25,.99],[0,1.025],[.25,.99],[.195,.49],[0,.37],[-.195,.49]],.065);
  b.profile(head,'black',[0,0,.623],[[-.19,.94],[.19,.94],[.155,.51],[0,.425],[-.155,.51]],.026);
  b.profile(head,'silver',[0,0,.646],[[-.165,.915],[.165,.915],[.132,.53],[0,.458],[-.132,.53]],.024);
  for(let j=0;j<10;j++){
    const y=.55+j*.035,w=.27+(y-.55)*.16;
    b.box(head,'steel',[0,y,.695],[w,.012,.013],undefined,.002,'Forehead crest rib');
  }
  b.profile(head,'steel',[0,.22,.69],[[-.10,.10],[.10,.10],[.065,-.025],[0,-.06],[-.065,-.025]],.06);

  // Two solid folded metal halves meet at a forward center ridge.
  const geometry=b.geometry('folded-faceplate',()=>{
    const positions=[],indices=[];
    for(const s of [-1,1]){
      const face=[[0,.18,.75],[s*.47,.085,.62],[s*.42,-.49,.63],[0,-.65,.79]];
      const offset=positions.length/3;
      for(const v of face)positions.push(...v);
      for(const [x,y,z] of face)positions.push(x,y,z-.09);
      const add=(a,c,d)=>{if(s===1)indices.push(offset+a,offset+d,offset+c);else indices.push(offset+a,offset+c,offset+d);};
      add(0,1,2);add(0,2,3);add(4,6,5);add(4,7,6);
      for(let j=0;j<4;j++){const k=(j+1)%4;add(j,j+4,k);add(k,j+4,k+4);}
    }
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setIndex(indices);geo.computeVertexNormals();return geo.toNonIndexed();
  });
  b.mesh(head,'Broad silver faceplate',geometry,'faceSilver');
  b.rod(head,'steel',[0,.135,.76],[0,-.59,.795],.009);
  b.profile(head,'blueDark',[0,-.62,.41],[[-.40,.075],[0,-.075],[.40,.075],[.34,-.055],[0,-.16],[-.34,-.055]],.13);
}

import { readdir, stat } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const project=fileURLToPath(new URL('../',import.meta.url));
const folder=`${project}artifacts/frames/`,total=1080;
const expected=Array.from({length:total},(_,i)=>`frame-${String(i).padStart(4,'0')}.jpg`);
const available=new Set(await readdir(folder));
const missing=expected.filter(name=>!available.has(name));
if(missing.length)throw new Error(`Capture incomplete: ${missing.length} of ${total} frames missing. Open ?frames=1 in the local preview.`);
for(const name of expected){if((await stat(folder+name)).size<1000)throw new Error(`Frame is incomplete: ${name}`);}
const output=`${project}mechanical-watch-showcase.mp4`;
const encoder=spawn('ffmpeg',[
  '-y','-framerate','60','-i',`${folder}frame-%04d.jpg`,
  '-vf','scale=in_range=full:out_range=limited:out_color_matrix=bt709,format=yuv420p',
  '-frames:v',String(total),'-c:v','libx264','-crf','17','-preset','slow',
  '-color_range','tv','-colorspace','bt709','-color_primaries','bt709','-color_trc','bt709',
  '-pix_fmt','yuv420p','-movflags','+faststart','-an',output,
],{stdio:'inherit'});
encoder.on('error',error=>{console.error(error.message);process.exitCode=1;});
encoder.on('exit',code=>{if(code!==0)process.exitCode=code??1;else console.log(`Saved ${output}`);});

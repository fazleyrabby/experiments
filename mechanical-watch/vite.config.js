import { defineConfig } from 'vite';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

// Capture files stay on this machine. This middleware is absent from production builds.
export default defineConfig({
  base: '/mechanical-watch/',
  plugins:[{
    name:'watch-local-film-export',
    configureServer(server){
      server.middlewares.use('/__watch_frame',async(req,res,next)=>{
        if(req.method!=='POST')return next();
        const origin=req.headers.origin;
        if(origin&&origin!==`http://${req.headers.host}`){res.statusCode=403;res.end('Local capture only');return;}
        const index=Number(req.headers['x-frame-index']);
        if(!Number.isInteger(index)||index<0||index>=1080||req.headers['content-type']!=='image/jpeg'){res.statusCode=400;res.end('Invalid frame');return;}
        try{
          const chunks=[];let size=0;
          for await(const chunk of req){size+=chunk.length;if(size>8*1024*1024){res.statusCode=413;res.end('Frame too large');return;}chunks.push(chunk);}
          const folder=fileURLToPath(new URL('./artifacts/frames/',import.meta.url));
          await mkdir(folder,{recursive:true});await writeFile(`${folder}frame-${String(index).padStart(4,'0')}.jpg`,Buffer.concat(chunks));
          res.statusCode=200;res.end('Saved');
        }catch(error){res.statusCode=500;res.end(error.message);}
      });
    },
  }],
});

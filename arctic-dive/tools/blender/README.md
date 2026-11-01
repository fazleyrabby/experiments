# Asset builders

Each script builds one GLB into `../../assets/` in a headless, factory-startup
Blender (your open Blender session and files are never touched):

    ./run.sh boat.py        # workboat with dive gate, ladder, twin outboards
    ./run.sh diver.py       # skinned diver (19-bone rig) with gear on bones
    ./run.sh ice.py         # tabular icebergs + growlers, vertex coloured
    ./run.sh mountains.py   # distant snow-streaked range

`run.sh` prepends `lib.py` (shared helpers) and expects Blender at
`/Applications/Blender.app`.

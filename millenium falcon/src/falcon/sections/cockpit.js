import { COCKPIT } from '../layout/dims.js';

// The off-centre cockpit: an access tube leaving the starboard bow quarter of
// the hull, and the pod at its end with the conical, many-paned canopy.

/** Euler ('YXZ') that lays a +y modelled piece along the horizontal direction (dx, dz). */
const alongXZ = (dx, dz) => [Math.PI / 2, Math.atan2(dx, dz), 0];

export function buildCockpit(b) {
  const { tubeStart, podX, podZ0, podZ1, podR, noseZ, noseR, tubeR } = COCKPIT;

  b.in('cockpit', () => {
    // --- Access tube, in three segments with ribbed collars at the joints.
    const start = tubeStart;
    const end = [podX + podR * 0.45, (podZ0 + podZ1) / 2 - 1.2];
    const dx = end[0] - start[0];
    const dz = end[1] - start[1];
    const length = Math.hypot(dx, dz);
    const rot = alongXZ(dx, dz);
    const at = (t) => [start[0] + dx * t, 0, start[1] + dz * t];
    const segments = 3;
    for (let i = 0; i < segments; i++) {
      const t = (i + 0.5) / segments;
      b.part({ shape: 'barrel', r: tubeR, length: length / segments }, at(t), rot, [2 * tubeR, 2 * tubeR, length / segments], i === 2 ? 'hullLight' : 'hull', {
        order: 'YXZ',
      });
    }
    for (const t of [0.66, 0.8, 0.93]) {
      b.part({ shape: 'ribbed', r: tubeR + 0.18, length: 0.42 }, at(t), rot, [4, 4, 0.5], 'dark', { order: 'YXZ' });
    }
    // Service conduit along the top of the tube.
    const conduit = at(0.82);
    b.part({ shape: 'barrel', r: 0.22, length: length * 0.32 }, [conduit[0], tubeR + 0.12, conduit[2]], rot, [0.5, 0.5, 4], 'metal', {
      order: 'YXZ',
    });

    // --- Pod: three barrel segments along +z.
    const podLength = podZ1 - podZ0;
    const forward = [Math.PI / 2, 0, 0];
    const colors = ['hull', 'hullLight', 'hull'];
    for (let i = 0; i < 3; i++) {
      const z = podZ0 + ((i + 0.5) * podLength) / 3;
      b.part({ shape: 'barrel', r: podR, length: podLength / 3 }, [podX, 0, z], forward, [2 * podR, 2 * podR, podLength / 3], colors[i]);
    }
    for (const z of [podZ0 + podLength / 3, podZ0 + (2 * podLength) / 3, podZ1]) {
      b.part({ shape: 'ribbed', r: podR + 0.14, length: 0.36 }, [podX, 0, z], forward, [5, 5, 0.4], 'dark');
    }
    // Rounded tail of the pod.
    b.part({ shape: 'cone', r: podR, r2: podR * 0.62, length: 0.9 }, [podX, 0, podZ0 - 0.45], [-Math.PI / 2, 0, 0], [5, 5, 0.9], 'hull');
    b.cylinder([podX, 0, podZ0 - 0.95], podR * 0.5, 0.2, 'dark', [Math.PI / 2, 0, 0]);
    // Greebles on the outboard flank and a little sensor on top.
    for (const [z, y, size, color] of [
      [podZ0 + 1.2, 0.5, [0.3, 0.6, 1.4], 'hullLight'],
      [podZ0 + 3.4, -0.4, [0.3, 0.9, 0.8], 'metal'],
      [podZ0 + 5.6, 0.3, [0.3, 0.5, 1.6], 'dark'],
    ]) {
      b.box([podX - podR - 0.05, y, z], size, color);
    }
    b.box([podX, podR + 0.12, podZ0 + 2.2], [0.8, 0.3, 2.6], 'dark');
    b.cylinder([podX + 0.6, podR + 0.45, podZ0 + 2.6], 0.22, 0.5, 'metal');

    // --- Canopy: smoked glass cone inside a lattice of window frames.
    const canopyLength = noseZ - podZ1;
    const centre = [podX, 0, podZ1 + canopyLength / 2];
    b.part({ shape: 'cone', r: podR - 0.12, r2: noseR - 0.1, length: canopyLength }, centre, forward, [5, 5, canopyLength], 'glass');
    b.part(
      { shape: 'canopyFrame', r: podR + 0.02, r2: noseR, length: canopyLength, rings: 4, struts: 10 },
      centre,
      forward,
      [5, 5, canopyLength],
      'hull',
    );
    b.part({ shape: 'barrel', r: noseR + 0.04, length: 0.32 }, [podX, 0, noseZ + 0.12], forward, [2.2, 2.2, 0.32], 'dark');
    b.part({ shape: 'barrel', r: 0.5, length: 0.18 }, [podX, 0, noseZ + 0.35], forward, [1, 1, 0.2], 'hull');
  });
}

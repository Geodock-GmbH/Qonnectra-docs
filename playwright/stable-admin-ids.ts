// Primary keys the Django administration shows in its inline forms.
//
// The colour mappings of conduit and cable types (chapter 21.4/21.5) have a
// UUID as primary key, and the inline renders it as an editable field in
// every row. The app's fixtures (conduit_type_color_mapping.json,
// cable_type_color_mapping.json) carry no pk, so `load_initial_data` draws a
// fresh uuid4 for every row on every install - each CI run and each local
// reset showed different ids, and admin_conduit_type / admin_cable_type never
// matched the published images.
//
// Like a stamped date, the value is pinned rather than hidden: each mapping
// gets a uuid5 derived from what makes it unique (type, position, ...). No
// other table refers to the mappings, so rewriting the key through
// QuerySet.update() touches nothing else, and running it twice is a no-op.
import { expectOutput, runInBackend } from './backend-shell'

export function pinColorMappingUuids(): void {
  const output = runInBackend(
    [
      'import uuid',
      'from apps.api.models import CableTypeColorMapping, ConduitTypeColorMapping',
      'ns = uuid.UUID("6f3c1f3e-5d1a-4c55-9a52-2b8f0c7e9d10")',
      'def pin(model, key):',
      '    n = 0',
      '    for m in list(model.objects.all()):',
      '        new = uuid.uuid5(ns, model.__name__ + ":" + key(m))',
      '        if m.pk != new:',
      '            model.objects.filter(pk=m.pk).update(uuid=new)',
      '        n += 1',
      '    return n',
      'a = pin(ConduitTypeColorMapping, lambda m: f"{m.conduit_type}:{m.position}")',
      'b = pin(CableTypeColorMapping, lambda m: f"{m.cable_type}:{m.position_type}:{m.layer}:{m.position}")',
      'print("pinned", a > 0 and b > 0)',
    ].join('\n'),
    'Pinning the colour-mapping ids',
  )
  expectOutput(output, 'pinned True', 'Pinning the colour-mapping ids')
}

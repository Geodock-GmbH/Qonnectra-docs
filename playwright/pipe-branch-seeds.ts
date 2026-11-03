// The saved trench selection of a pipe branch node, put back to the state of
// the demo data around every capture of chapter 12.
//
// Since v1.8.0 "Auf Canvas laden" in the window "Trassen auswählen" saves the
// selected trenches per node (`node-trench-selection/bulk-update/`), and the
// next visit of the node opens its canvas with them instead of with the
// conduits that carry connections only. A spec that loads the canvas therefore
// changes what the next run - and every other spec reaching the node - sees.
//
// The demo data carries no saved selection: `node-trench-selection` is one of
// the endpoints closed to the export account (scripts/qonnectra-demo-data/
// README.md). "The state of the demo data" is therefore "none", and clearing
// is the restore. The REST endpoint could do the same with an empty list, but
// it wants the node's uuid; the shell needs only its name.
import { expectOutput, pyLiteral, runInBackend } from './backend-shell'
import { TEST_PROJECT_ID } from './project'

/**
 * Removes every saved trench selection of the named node in the test project.
 * Call it before (an aborted run leaves one behind) and after every capture
 * that presses "Auf Canvas laden".
 */
export function clearTrenchSelection(nodeName: string): void {
  const what = `Clearing the saved trench selection of ${nodeName}`
  const output = runInBackend(
    [
      'import json',
      'from apps.api.models import NodeTrenchSelection',
      'NodeTrenchSelection.objects.filter(',
      `    node__name=${pyLiteral(nodeName)}, node__project_id=${pyLiteral(Number(TEST_PROJECT_ID))}`,
      ').delete()',
      'print("trench-selection-cleared")',
    ].join('\n'),
    what,
  )
  expectOutput(output, 'trench-selection-cleared', what)
}

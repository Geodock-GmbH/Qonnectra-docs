// Records the administration chapters show but the demo project does not
// bring: a GeoPackage schema configuration (chapters 22 and 24) and a stored
// user-settings snapshot (chapter 22). Each is created for the run and removed
// again, like the placeholder accounts of playwright/admin-users.ts; a spec
// calls seed...() in beforeAll and remove...() in afterAll.
//
// Every stamped date is pinned to CAPTURE_DATE through QuerySet.update(),
// which bypasses auto_now (see CLAUDE.md, "Dates in the Django administration
// cannot be frozen").
import { expectOutput, pyLiteral, runInBackend } from './backend-shell'
import { CAPTURE_DATE } from './stable-dates'

/** Name of the configuration the images show. */
export const GEOPACKAGE_CONFIG = 'Feldaufnahme Adressen'

/**
 * Layers of the configuration: the address layer with the master data its
 * columns refer to - the case section 22.4 describes.
 */
const GEOPACKAGE_LAYERS = ['address', 'attributes_status_development', 'projects', 'flags']

export function seedGeoPackageConfig(): void {
  const output = runInBackend(
    [
      'import json',
      'from apps.api.models import GeoPackageSchemaConfig',
      `name = ${pyLiteral(GEOPACKAGE_CONFIG)}`,
      `layers = ${pyLiteral(GEOPACKAGE_LAYERS)}`,
      'GeoPackageSchemaConfig.objects.filter(name=name).delete()',
      'GeoPackageSchemaConfig.objects.create(name=name, selected_layers=layers)',
      'print("seeded")',
    ].join('\n'),
    'Creating the GeoPackage schema configuration',
  )
  expectOutput(output, 'seeded', 'Creating the GeoPackage schema configuration')
}

export function removeGeoPackageConfig(): void {
  runInBackend(
    [
      'import json',
      'from apps.api.models import GeoPackageSchemaConfig',
      `GeoPackageSchemaConfig.objects.filter(name=${pyLiteral(GEOPACKAGE_CONFIG)}).delete()`,
      'print("removed")',
    ].join('\n'),
    'Removing the GeoPackage schema configuration',
  )
}

/**
 * A stored snapshot for a placeholder account. The keys are real keys of the
 * frontend (SYNCED_SETTINGS_KEYS in userSettingsSync.ts), so the JSON in the
 * detail view looks like what an account would store; the list itself shows
 * only the account and the date.
 */
export function seedUserSettings(username: string): void {
  const output = runInBackend(
    [
      'import json',
      'from django.contrib.auth import get_user_model',
      'from django.utils.dateparse import parse_datetime',
      'from apps.api.models import UserSettings',
      `user = get_user_model().objects.get(username=${pyLiteral(username)})`,
      'row, _ = UserSettings.objects.update_or_create(user=user, defaults={"settings": {"mode": "light", "sidebarExpanded": True}})',
      `UserSettings.objects.filter(pk=row.pk).update(updated_at=parse_datetime(${pyLiteral(CAPTURE_DATE)}))`,
      'print("seeded")',
    ].join('\n'),
    'Storing the user settings',
  )
  expectOutput(output, 'seeded', 'Storing the user settings')
}

export function removeUserSettings(username: string): void {
  runInBackend(
    [
      'import json',
      'from apps.api.models import UserSettings',
      `UserSettings.objects.filter(user__username=${pyLiteral(username)}).delete()`,
      'print("removed")',
    ].join('\n'),
    'Removing the user settings',
  )
}

/**
 * Two attachments whose object no longer exists - the case section 23.5 is
 * about, and one the demo data does not have. Fixed UUIDs, because the list
 * shows the ID of the missing object, and placeholder file names. There is no
 * file on disk - the images only show the entries - which is also why both are
 * PDFs: a photo without its file shows a broken preview image in the list.
 */
const ORPHANS = [
  {
    uuid: '6f1c2a4e-0d3b-4c1e-9a55-1b2c3d4e5f60',
    objectId: '0b9e7d1a-5c4f-4e2b-8a3d-7f6e5d4c3b2a',
    path: 'Testprojekt/nodes/Muster-Verteiler/documents/Lageplan_Muster-Verteiler.pdf',
  },
  {
    uuid: '6f1c2a4e-0d3b-4c1e-9a55-1b2c3d4e5f61',
    objectId: '0b9e7d1a-5c4f-4e2b-8a3d-7f6e5d4c3b2a',
    path: 'Testprojekt/nodes/Muster-Verteiler/documents/Abnahmeprotokoll_Muster-Verteiler.pdf',
  },
]

export function seedOrphanedFiles(): void {
  const output = runInBackend(
    [
      'import json',
      'from django.contrib.contenttypes.models import ContentType',
      'from django.utils.dateparse import parse_datetime',
      'from apps.api.models import FeatureFiles',
      `orphans = ${pyLiteral(ORPHANS)}`,
      'node = ContentType.objects.get(app_label="api", model="node")',
      'for o in orphans:',
      '    FeatureFiles.objects.filter(uuid=o["uuid"]).delete()',
      '    f = FeatureFiles(uuid=o["uuid"], content_type=node, object_id=o["objectId"])',
      '    f.file_path.name = o["path"]',
      '    f.save()',
      `FeatureFiles.objects.filter(uuid__in=[o["uuid"] for o in orphans]).update(created_at=parse_datetime(${pyLiteral(CAPTURE_DATE)}))`,
      'print("seeded", len(orphans))',
    ].join('\n'),
    'Creating the orphaned attachments',
  )
  expectOutput(output, `seeded ${ORPHANS.length}`, 'Creating the orphaned attachments')
}

export function removeOrphanedFiles(): void {
  runInBackend(
    [
      'import json',
      'from apps.api.models import FeatureFiles',
      `FeatureFiles.objects.filter(uuid__in=${pyLiteral(ORPHANS.map((o) => o.uuid))}).delete()`,
      'print("removed")',
    ].join('\n'),
    'Removing the orphaned attachments',
  )
}

/** Slug of the QGIS project chapter 27 uploads, see tests/27-*.spec.ts. */
export const QGIS_PROJECT = 'netzdokumentation'

/**
 * Fixed id of the WMS source of 27.4. The id is a UUID the model generates,
 * and it ends up in the URL of the form and in the cache key of the WMS proxy;
 * a fixed one keeps both the same from run to run.
 */
const WMS_SOURCE_ID = '3d9b1f60-27a4-4c1b-9e2d-5a7c8e9f0a14'

/**
 * Removes the uploaded QGIS project (its file goes with it, see
 * qgis_project_deleted in the backend) and the WMS source. Safe to call when
 * neither exists, so a spec calls it before and after.
 */
export function removeQgisProjectAndWmsSource(): void {
  runInBackend(
    [
      'import json',
      'from apps.api.models import QGISProject, WMSSource',
      `for p in QGISProject.objects.filter(name=${pyLiteral(QGIS_PROJECT)}): p.delete()`,
      `WMSSource.objects.filter(id=${pyLiteral(WMS_SOURCE_ID)}).delete()`,
      'print("removed")',
    ].join('\n'),
    'Removing the QGIS project and the WMS source',
  )
}

/**
 * Pins the stamps of the uploaded project: „Erstellt am“ and „Aktualisiert
 * am“ to CAPTURE_DATE. „Erstellt von“ stays the superuser, whose name is the
 * fixed "admin" of the local setup.
 */
export function pinQgisProjectDates(): void {
  const output = runInBackend(
    [
      'import json',
      'from django.utils.dateparse import parse_datetime',
      'from apps.api.models import QGISProject',
      `when = parse_datetime(${pyLiteral(CAPTURE_DATE)})`,
      `n = QGISProject.objects.filter(name=${pyLiteral(QGIS_PROJECT)}).update(created_at=when, updated_at=when)`,
      'print("pinned", n)',
    ].join('\n'),
    'Pinning the dates of the QGIS project',
  )
  expectOutput(output, 'pinned 1', 'Pinning the dates of the QGIS project')
}

/**
 * The WMS source of 27.4: the stack's own QGIS Server with the uploaded
 * project, so no image depends on a server outside the stack. Created through
 * the ORM with a fixed id, then filled with layers the way the admin form does
 * on save (fetch_wms_layers, which rewrites the stack's QGIS domain to the
 * container).
 */
export function seedWmsSource(qgisDomain: string): void {
  const output = runInBackend(
    [
      'import json',
      'from apps.api.models import Projects, WMSLayer, WMSSource',
      'from apps.api.wms_service import fetch_wms_layers',
      `url = ${pyLiteral(`https://${qgisDomain}/ows/?MAP=/projects/${QGIS_PROJECT}.qgs`)}`,
      `source = WMSSource.objects.create(id=${pyLiteral(WMS_SOURCE_ID)}, project=Projects.objects.get(id=2), name="Netzdokumentation (eigener QGIS-Server)", url=url, attribution="Stadtwerke Musterstadt", sort_order=0, is_active=True)`,
      'for i, layer in enumerate(fetch_wms_layers(url, use_cache=False)):',
      '    WMSLayer.objects.update_or_create(source=source, name=layer["name"], defaults={"title": layer["title"], "sort_order": i})',
      'print("layers", source.layers.count())',
    ].join('\n'),
    'Creating the WMS source',
  )
  expectOutput(output, 'layers 4', 'Creating the WMS source')
}

/**
 * Log entries for 28.5. The instance logs whatever happens on it - user names,
 * paths, IP addresses in extra_data - so the images show only these, on a day
 * no real entry has: CAPTURE_DATE, which the views are filtered to. Fixed
 * UUIDs, placeholder account, messages of the kinds the chapter explains.
 */
const LOG_ENTRIES = [
  {
    uuid: '9a0c1e2f-3b4d-4e5f-8a6b-7c8d9e0f1a01',
    minutes: 0,
    level: 'ERROR',
    source: 'frontend',
    logger: 'frontend',
    message: 'Error uploading files',
    path: '/conduit/2',
    user: 'm.mustermann',
  },
  {
    uuid: '9a0c1e2f-3b4d-4e5f-8a6b-7c8d9e0f1a02',
    minutes: 7,
    level: 'WARNING',
    source: 'backend',
    logger: 'apps.api.views',
    message: 'Excel-Import abgelehnt: Row 4: Status "Geplant" not found.',
    path: '/api/v1/import/conduit/',
    user: 'm.mustermann',
  },
  {
    uuid: '9a0c1e2f-3b4d-4e5f-8a6b-7c8d9e0f1a03',
    minutes: 19,
    level: 'ERROR',
    source: 'wfs',
    logger: 'postgres.wfs',
    message: 'ERROR: Cannot delete node: node has connected cables.',
    path: null,
    user: null,
  },
  {
    uuid: '9a0c1e2f-3b4d-4e5f-8a6b-7c8d9e0f1a04',
    minutes: 26,
    level: 'ERROR',
    source: 'backend',
    logger: 'django.request',
    message: 'Internal Server Error: /api/v1/feature-files/',
    path: '/api/v1/feature-files/',
    user: 'e.mustermann',
  },
]

export function seedLogEntries(): void {
  const output = runInBackend(
    [
      'import json, datetime',
      'from django.contrib.auth import get_user_model',
      'from django.utils.dateparse import parse_datetime',
      'from apps.api.models import LogEntry, Projects',
      `entries = ${pyLiteral(LOG_ENTRIES)}`,
      `base = parse_datetime(${pyLiteral(CAPTURE_DATE)})`,
      'project = Projects.objects.get(id=2)',
      'User = get_user_model()',
      'for e in entries:',
      '    LogEntry.objects.filter(uuid=e["uuid"]).delete()',
      '    user = User.objects.get(username=e["user"]) if e["user"] else None',
      '    LogEntry.objects.create(uuid=e["uuid"], level=e["level"], source=e["source"], logger_name=e["logger"], message=e["message"], path=e["path"], user=user, project=project)',
      '    LogEntry.objects.filter(uuid=e["uuid"]).update(timestamp=base - datetime.timedelta(minutes=e["minutes"]))',
      'print("seeded", len(entries))',
    ].join('\n'),
    'Creating the log entries',
  )
  expectOutput(output, `seeded ${LOG_ENTRIES.length}`, 'Creating the log entries')
}

export function removeLogEntries(): void {
  runInBackend(
    [
      'import json',
      'from apps.api.models import LogEntry',
      `LogEntry.objects.filter(uuid__in=${pyLiteral(LOG_ENTRIES.map((e) => e.uuid))}).delete()`,
      'print("removed")',
    ].join('\n'),
    'Removing the log entries',
  )
}

#!/usr/bin/env python3
"""Pulls the complete "Testprojekt" from app.geodock.de into a single JSON file.

Replaces the browser-console procedure that scripts/qonnectra-demo-data/README.md
used to describe: log in against the API, walk every resource the project has,
and write one merged JSON object that `import_geodock_export.py` reads.

Standard library only - the repo needs no extra dependency for it.

Credentials come from scripts/qonnectra-demo-data/.env next to this script
(gitignored, template in .env.example) or from the environment, and are never
printed, logged or written into the output:

    GEODOCK_USERNAME=...
    GEODOCK_PASSWORD=...

    scripts/qonnectra-demo-data/fetch_geodock_export.py \
        --out scripts/qonnectra-demo-data/testprojekt-export.json

--credentials points it at a different file, e.g. for a second installation.

The output holds, per resource name, the complete unpaginated list of API
objects. GeoJSON resources (trench, node, address, area) are flattened to
`{**properties, "geometry": ...}`, which is the shape the importer expects.
"""

import argparse
import json
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request

DEFAULT_HOST = "api.geodock.de"
# Next to this script, so that credentials and the script that uses them stay
# together. Covered by the ".env" rule in .gitignore.
DEFAULT_CREDENTIALS = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
DEFAULT_PROJECT = "Testprojekt"

# Reference data shared by all projects - fetched without a project filter.
GLOBAL_RESOURCES = [
    "attributes_cable_type",
    "attributes_company",
    "attributes_conduit_type",
    "attributes_construction_type",
    "attributes_surface",
    "attributes_fiber_color",
    "attributes_microduct_color",
    "attributes_microduct_status",
    "attributes_fiber_status",
    "attributes_network_level",
    "attributes_node_type",
    "attributes_status",
    "attributes_area_type",
    "attributes_status_development",
    "attributes_residential_unit_type",
    "attributes_residential_unit_status",
    "attributes_component_type",
    "attributes_component_structure",
    "flags",
    "cable_type_color_mapping",
    "container-type",
    "type-of-work",
    "request-reasons",
]

# Everything that accepts ?project=<id>.
PROJECT_RESOURCES = [
    "trench",
    "conduit",
    "trench_conduit_connection",
    "microduct",
    "microduct_connection",
    "microduct_cable_connection",
    "node",
    "address",
    "residential-unit",
    "cable",
    "cable_label",
    "fiber",
    "area",
    "valuation-rates",
    "wms-sources",
    "wms-layers",
    "pipeline-records",
]

# Resources with no project filter of their own; they hang off a parent object
# and are collected by iterating over the parents already fetched.
#   (resource, query parameter, parent resource, field of the parent UUID)
CHILD_RESOURCES = [
    ("node-slot-configuration", "node", "node", "uuid"),
    ("node-structure", "node", "node", "uuid"),
    ("container", "node", "node", "uuid"),
    ("node-trench-selection", "node", "node", "uuid"),
    ("node-slot-divider", "slot_configuration", "node-slot-configuration", "uuid"),
    ("node-slot-clip-number", "slot_configuration", "node-slot-configuration", "uuid"),
    ("fiber-splice", "node_structure", "node-structure", "uuid"),
    ("trench-conduit-canvas", "trench", "trench", "uuid"),
    ("pipeline-inquiry-areas", "pipeline_record", "pipeline-records", "uuid"),
]


# Endpoints the export account is not allowed to read (HTTP 403 on
# app.geodock.de, measured 2026-09-09). They are attempted anyway - a role with
# more rights gets them - but their absence is expected and not an error:
#   wms-sources           the URL and credentials of the WMS server
#   node-trench-selection which trenches a user picked for the branch canvas
#   node-slot-divider     visual dividers inside a slot configuration
#   node-slot-clip-number clip numbering inside a slot configuration
EXPECTED_FORBIDDEN = {
    "wms-sources",
    "node-trench-selection",
    "node-slot-divider",
    "node-slot-clip-number",
}

# Attachments have no project filter of their own (only ?object_id=<uuid>), so
# the whole list is fetched once and reduced to the objects of this project.
FILE_OWNER_RESOURCES = [
    "trench",
    "conduit",
    "node",
    "address",
    "area",
    "cable",
    "microduct",
]


def read_credentials(path, required_file):
    """Username and password from a key=value file, environment as fallback.

    required_file is False for the default path: a run that gets the values
    through the environment must not insist on the file existing.
    """
    username = os.environ.get("GEODOCK_USERNAME")
    password = os.environ.get("GEODOCK_PASSWORD")
    content = None
    if path:
        try:
            content = open(path, encoding="utf-8").read()
        except OSError as exc:
            if required_file:
                sys.exit(f"Credentials file cannot be read: {exc}")
    if content is not None:
        values = {}
        for line in content.splitlines():
            match = re.match(r"^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$", line)
            if match:
                values[match.group(1)] = re.sub(
                    r"^(['\"])(.*)\1$", r"\2", match.group(2).strip()
                )
        username = values.get("GEODOCK_USERNAME", username)
        password = values.get("GEODOCK_PASSWORD", password)
    if not username or not password:
        sys.exit(
            "GEODOCK_USERNAME/GEODOCK_PASSWORD are missing. Put them into\n"
            f"  {path}\n"
            "(template: scripts/qonnectra-demo-data/.env.example) or into the "
            "environment."
        )
    return username, password


class Api:
    """Minimal API client with a cookie jar for the api-access-token."""

    def __init__(self, host):
        self.base = f"https://{host}/api/v1/"
        self.cookies = {}

    def _request(self, url, data=None):
        body = json.dumps(data).encode() if data is not None else None
        request = urllib.request.Request(url, data=body, method="POST" if body else "GET")
        request.add_header("Accept", "application/json")
        if body:
            request.add_header("Content-Type", "application/json")
        if self.cookies:
            request.add_header(
                "Cookie", "; ".join(f"{k}={v}" for k, v in self.cookies.items())
            )
        try:
            response = urllib.request.urlopen(request, timeout=120)
        except urllib.error.HTTPError as exc:
            raise ApiError(url, exc.code, exc.read()[:400].decode("utf-8", "replace"))
        for header in response.headers.get_all("Set-Cookie") or []:
            name, _, rest = header.partition("=")
            self.cookies[name.strip()] = rest.split(";", 1)[0]
        payload = response.read()
        return json.loads(payload) if payload else None

    def login(self, username, password):
        self._request(self.base + "auth/login/", {"username": username, "password": password})
        if "api-access-token" not in self.cookies:
            sys.exit("Login did not set an api-access-token cookie.")

    def list(self, resource, params=None):
        """All rows of a resource, following pagination and flattening GeoJSON."""
        url = self.base + resource + "/"
        if params:
            url += "?" + urllib.parse.urlencode(params)
        rows = []
        while url:
            payload = self._request(url)
            page, url = self._page(payload)
            rows.extend(page)
        return rows

    @staticmethod
    def _page(payload):
        """(rows, next url) out of any of the shapes the API returns."""
        if payload is None:
            return [], None
        if isinstance(payload, list):
            return [flatten(row) for row in payload], None
        next_url = payload.get("next")
        results = payload.get("results", payload)
        if isinstance(results, dict) and results.get("type") == "FeatureCollection":
            results = results.get("features", [])
        elif isinstance(results, dict) and "features" in results:
            results = results["features"]
        elif isinstance(results, dict):
            # A single object (OneToOne settings endpoints).
            results = [results]
        return [flatten(row) for row in results], next_url


class ApiError(Exception):
    def __init__(self, url, status, body):
        super().__init__(f"HTTP {status} for {url}: {body}")
        self.status = status


def flatten(row):
    """GeoJSON feature -> {**properties, geometry}; everything else unchanged."""
    if isinstance(row, dict) and row.get("type") == "Feature":
        flat = dict(row.get("properties") or {})
        flat["geometry"] = row.get("geometry")
        if "uuid" not in flat and row.get("id") is not None:
            flat["uuid"] = row["id"]
        return flat
    return row


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--host", default=DEFAULT_HOST, help=f"API host (default {DEFAULT_HOST})")
    parser.add_argument("--project", default=DEFAULT_PROJECT, help="Project name to export")
    parser.add_argument(
        "--credentials",
        help="key=value file with GEODOCK_USERNAME/-PASSWORD "
        "(default: .env next to this script)",
    )
    parser.add_argument("--out", required=True, help="Path of the JSON file to write")
    parser.add_argument(
        "--skip",
        action="append",
        default=[],
        metavar="RESOURCE",
        help="Skip a resource (repeatable) - for endpoints a role may not read",
    )
    args = parser.parse_args()

    username, password = read_credentials(
        args.credentials or DEFAULT_CREDENTIALS, required_file=bool(args.credentials)
    )
    api = Api(args.host)
    api.login(username, password)
    print(f"Logged in to {args.host}")

    projects = api.list("projects")
    project = next((p for p in projects if p.get("project") == args.project), None)
    if not project:
        sys.exit(
            f'Project "{args.project}" not found. Available: '
            + ", ".join(sorted(str(p.get("project")) for p in projects))
        )
    project_id = project["id"]
    print(f'Project "{args.project}" has id {project_id}')

    data = {}
    failed = {}

    def fetch(key, resource, params=None):
        if resource in args.skip:
            print(f"  {key:<28} skipped")
            return []
        try:
            rows = api.list(resource, params)
        except ApiError as exc:
            failed[key] = str(exc)
            print(f"  {key:<28} FAILED ({exc.status})")
            return []
        data[key] = rows
        print(f"  {key:<28} {len(rows)}")
        return rows

    print("Reference data:")
    for resource in GLOBAL_RESOURCES:
        fetch(resource, resource)

    print(f"Project data (project={project_id}):")
    for resource in PROJECT_RESOURCES:
        fetch(resource, resource, {"project": project_id})

    print("Child resources (one request per parent):")
    for resource, param, parent, field in CHILD_RESOURCES:
        if resource in args.skip:
            print(f"  {resource:<28} skipped")
            continue
        parents = data.get(parent) or []
        ids = [row[field] for row in parents if row.get(field) is not None]
        rows, seen, errors = [], set(), 0
        for value in ids:
            try:
                page = api.list(resource, {param: value})
            except ApiError as exc:
                errors += 1
                failed.setdefault(resource, str(exc))
                continue
            for row in page:
                # Not every serializer exposes a key of its own
                # (pipeline-inquiry-areas has neither uuid nor id) - then the
                # whole row is the marker, otherwise all of them would
                # deduplicate down to the first.
                marker = row.get("uuid") or row.get("id")
                if marker is None:
                    marker = json.dumps(row, sort_keys=True)
                if marker in seen:
                    continue
                seen.add(marker)
                # Not every serializer returns the relation it was queried by
                # (a container knows no uuid_node), so the parent is kept
                # alongside the row - otherwise the link is lost on import.
                row["_fetched_with"] = {param: value}
                rows.append(row)
        data[resource] = rows
        note = f" ({errors} of {len(ids)} requests failed)" if errors else ""
        print(f"  {resource:<28} {len(rows)} from {len(ids)} {parent}{note}")

    print("Attachments (whole list, reduced to this project):")
    if "feature-files" in args.skip:
        print("  feature-files                skipped")
    else:
        try:
            all_files = api.list("feature-files")
        except ApiError as exc:
            failed["feature-files"] = str(exc)
            print(f"  feature-files                FAILED ({exc.status})")
        else:
            owned = {
                row["uuid"]
                for resource in FILE_OWNER_RESOURCES
                for row in data.get(resource) or []
                if row.get("uuid")
            }
            rows = [row for row in all_files if row.get("object_id") in owned]
            data["feature-files"] = rows
            print(
                f"  feature-files                {len(rows)} of {len(all_files)} "
                "belong to this project"
            )

    with open(args.out, "w", encoding="utf-8") as fh:
        json.dump(data, fh, ensure_ascii=False, indent=1)
    print(f"\nWritten: {args.out}")

    forbidden = {k: v for k, v in failed.items() if k in EXPECTED_FORBIDDEN}
    unexpected = {k: v for k, v in failed.items() if k not in EXPECTED_FORBIDDEN}

    if forbidden:
        print(
            "\nNot readable for this account (expected, see EXPECTED_FORBIDDEN): "
            + ", ".join(sorted(forbidden))
        )
    if unexpected:
        print("\nResources that did not come through:")
        for key, message in unexpected.items():
            print(f"  {key}: {message}")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main() or 0)

# Metadata-Driven LWC Framework

A reusable Lightning Web Component framework for Salesforce where all configuration — field definitions, queries, columns, labels — lives in **Custom Metadata Types**. Admins can add new objects or modify the UI from Setup without code deployments.

## Architecture

```
Custom Metadata (config)  →  Apex Controller (single class)  →  LWC Components (3 reusable)
```

- **Object_Config__mdt** — stores SOQL queries, datatable column definitions (JSON), sort order, page size, tab label/icon
- **RelatedQuickLink__mdt** — stores quick link definitions (JSON) with object names, icons, and filter fields
- **GetRecordController.cls** — single `with sharing` Apex class that reads metadata, builds dynamic SOQL with bind variables, and serves all three components

## Components

| Component | Purpose | Page Targets |
|-----------|---------|--------------|
| `dataTableLwc` | Generic datatable driven by `Object_Config__mdt`. Supports sorting, lookup filtering, pagination, "View All" in console tabs. | Home, App, URL Addressable |
| `createRecordComponent` | Toggle-based record creator (Opportunity / Case). Dispatches `RefreshEvent` on save to sync the datatable. | Home |
| `relatedListQuickLinks` | Quick links to related lists with live record counts. Navigates to `dataTableLwc` in full view. | Record, App, Home |

## How They Communicate

- **RefreshEvent** — `createRecordComponent` saves a record → dispatches `RefreshEvent` → `dataTableLwc` reloads automatically
- **URL State** — `relatedListQuickLinks` navigates to `dataTableLwc` passing filter params via `CurrentPageReference`
- **@api Properties** — parent pages pass `objectApiName`, `configName`, `recordId` through Lightning App Builder

## Deployment

```bash
git clone https://github.com/your-username/metadata-driven-lwc.git
cd metadata-driven-lwc
sf project deploy start --source-dir force-app --target-org your-org-alias
```

Before deploying, make sure the two Custom Metadata Types (`Object_Config__mdt` and `RelatedQuickLink__mdt`) exist in your org with the fields described above — or include their metadata definitions in your `force-app` directory.

## Page Setup

**Home Page** — In Lightning App Builder, add `dataTableLwc` (set `Object API Name` to `Opportunity` or `Case`) and `createRecordComponent` (set `Form Title`, enable toggle). Creating a record auto-refreshes the table.

**App Page** — Same as Home Page. Add multiple `dataTableLwc` instances for different objects and optionally `relatedListQuickLinks`.

**Record Page (e.g. Account)** — Add `relatedListQuickLinks` and set `Config Name` to match your `RelatedQuickLink__mdt` record (e.g. `Account_Related`). The component picks up `recordId` automatically and shows links with live counts.

## Adding a New Object

No code needed — just create a new `Object_Config__mdt` record in Setup with your SOQL query and column JSON, then drop `dataTableLwc` on any page and set the `Object API Name`. Optionally add it to a `RelatedQuickLink__mdt` record to include it in the quick links.

## Tech Stack

Salesforce API v65.0 · Apex (`with sharing`, dynamic SOQL, bind variables) · LWC (`NavigationMixin`, `platformWorkspaceApi`, `lightning/refresh`) · SLDS base components

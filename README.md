# Salesforce LWC – Opportunity & Case Manager

A Salesforce Lightning Web Components (LWC) application for creating and viewing **Opportunities** and **Cases** from a unified interface. Components communicate via Lightning Message Service (LMS) and support both standard and console navigation.

---

## Features

- **Toggle between Opportunity and Case** creation with a single switch
- **Dynamic record creation** using `lightning-record-edit-form` with field-level validation
- **Filterable data table** – filter Opportunities by Account or Cases by Contact via lookup fields
- **Sortable columns** in the data table
- **View All** – opens a full paginated view in a new console tab (or navigates via standard page reference)
- **Real-time refresh** – data table auto-reloads after a new record is created via LMS
- **Toast notifications** on success and error

---

## Project Structure

```
force-app/main/default/
│
├── classes/
│   ├── GetRecordController.cls          # Apex controller for SOQL queries
│   └── GetRecordController.cls-meta.xml
│
├── lwc/
│   ├── createRecordComponent/           # Form component for creating records
│   │   ├── createRecordComponent.html
│   │   ├── createRecordComponent.js
│   │   └── createRecordComponent.js-meta.xml
│   │
│   └── dataTableLwc/                    # Data table component for viewing records
│       ├── dataTableLwc.html
│       ├── dataTableLwc.js
│       └── dataTableLwc.js-meta.xml
│
└── messageChannels/
    └── HomePageChannel__c.messageChannel  # LMS channel for inter-component communication
```

---

## Components

### `createRecordComponent`

Renders a form card that allows users to create either an Opportunity or a Case.

| Property | Type | Description |
|---|---|---|
| `isToogleButtonVisible` | `@api Boolean` | Shows or hides the Opportunity/Case toggle |
| `formTitle` | `@api String` | Title displayed on the card header |

**Key behaviour:**
- Uses `lightning-record-edit-form` with `lightning-input-field` for standard platform field rendering and validation
- On successful save, fires a `RECORD_CREATED` LMS message to notify sibling components
- Resets all form fields after a successful save

**Opportunity fields:** Name, Account, Close Date, Probability, Amount, Type, Stage

**Case fields:** Contact, Status, Priority, Supplied Email, Origin, Description, Subject

---

### `dataTableLwc`

Displays a sortable data table of Opportunities or Cases, with an optional lookup filter.

| Property | Type | Description |
|---|---|---|
| `objectApiName` | `@api String` | `'Opportunity'` or `'Case'` – determines which data set is loaded |

**Key behaviour:**
- Subscribes to the `HomePageChannel__c` LMS channel; refreshes data when a `RECORD_CREATED` message is received
- Reads page state via `CurrentPageReference` to support deep-linking and the View All flow
- Shows a **View All** button when the result set exceeds 5 rows (the default page size)
- In console navigation, View All opens a new workspace tab with an appropriate label and icon
- Lookup filter (Account for Opportunities, Contact for Cases) narrows results without a page reload

---

## Apex Controller

### `GetRecordController`

`with sharing` Apex class exposing two `@AuraEnabled` methods:

| Method | Parameter | Returns |
|---|---|---|
| `getOpportunities` | `recordId` (nullable) | All Opportunities, or filtered by `AccountId` |
| `getCase` | `recordId` (nullable) | All Cases, or filtered by `ContactId` |

Both methods order results by `CreatedDate DESC`.

---

## Lightning Message Channel

**`HomePageChannel__c`** is used for communication between `createRecordComponent` and `dataTableLwc`.

| Field | Values | Description |
|---|---|---|
| `type` | `RECORD_CREATED` / `TARGET_CHANGED` | Message type |
| `objectApiName` | `Opportunity` / `Case` | The affected object |
| `targetId` | `String \| null` | Account or Contact Id for filtering |

---

## Setup & Deployment

### Prerequisites

- Salesforce CLI (`sf` or `sfdx`) installed
- A Salesforce org with Developer or Sandbox access
- The `HomePageChannel__c` message channel deployed

### Deploy to org

```bash
# Authenticate
sf org login web --alias my-org

# Deploy all metadata
sf project deploy start --source-dir force-app --target-org my-org
```

### Add components to a Lightning App Page

1. Open **Setup → Lightning App Builder**
2. Create or edit a Home or App page
3. Drag **createRecordComponent** and **dataTableLwc** onto the canvas
4. Set the `objectApiName` property on `dataTableLwc` to `Opportunity` or `Case`
5. **Save** and **Activate** the page

---

## Dependencies

| API / Feature | Usage |
|---|---|
| `lightning/messageService` | Inter-component communication |
| `lightning/navigation` + `NavigationMixin` | Standard and console navigation |
| `lightning/platformWorkspaceApi` | Console tab management (open, label, icon) |
| `lightning-record-edit-form` | Platform-native record creation with validation |
| `lightning-datatable` | Sortable, paginated data display |

---

## License

This project is intended for educational and demonstration purposes within a Salesforce environment.

import { LightningElement, api, wire } from 'lwc';
import getObjectConfig from '@salesforce/apex/GetRecordController.getObjectConfig';
import getRecords from '@salesforce/apex/GetRecordController.getRecords';
import { NavigationMixin, CurrentPageReference } from 'lightning/navigation';
import { openTab, setTabLabel, setTabIcon, EnclosingTabId, IsConsoleNavigation } from 'lightning/platformWorkspaceApi';
import { registerRefreshHandler, unregisterRefreshHandler } from 'lightning/refresh';




export default class DataTableLwc extends NavigationMixin(LightningElement) {


    @api objectApiName;
    data = [];
    error;
    columns = [];

    @wire(IsConsoleNavigation) isConsoleNavigation;
    @wire(EnclosingTabId) enclosingTabId;

    _config = null;
    _fieldSetup = null;
    _targetObject = null;
    _targetField = null;
    refreshHandlerID;



    showAll = true;
    targetId = null;
    isFullView = false;
    sortedBy;
    sortDirection;

    // Fetches the Object_Config__mdt metadata record based on objectApiName and parses the field setup JSON
    @wire(getObjectConfig, { objectApiName: '$objectApiName' })
    wiredConfig({ data, error }) {
        if (data) {
            this._config = data;
            try {
                this._fieldSetup = JSON.parse(this._config.FieldSetup__c);

            } catch (e) {
                this.error = 'Invalid Field Setup JSON in Metadata';
                return;
            }

            this._parseTargetField();
            this.columns = this._buildColumns();
            this.load();
        } else if (error) {
            this.error = error?.body?.message || error.message;
        }
    }



    // Reads navigation state parameters from the current page reference
    @wire(CurrentPageReference)
    readPageState(pageRef) {
        const state = pageRef?.state;
        if (!state) return;

        if (state.c__objectApiName) {
            this.objectApiName = state.c__objectApiName;
        }

        if ('c__targetId' in state) {
            this.targetId = state.c__targetId || null;
        }
        if ('c__targetField' in state) {
            this._targetField = state.c__targetField || null;
        }

        if ('c__targetObject' in state) {
            this._targetObject = state.c__targetObject || null;
        }

        if (state.c__viewAll === 'true') {
            this.isFullView = true;
            this.showAll = false; // Do not show the button again in full view
        }
    }


    // Registers a refresh handler to reload data when a RefreshEvent is dispatched
    connectedCallback() {
        this.refreshHandlerID = registerRefreshHandler(this, this.load.bind(this));
    }

    // Unregisters the refresh handler when the component is removed from the DOM
    disconnectedCallback() {
        if (this.refreshHandlerID) {
            unregisterRefreshHandler(this.refreshHandlerID);
        }
    }

    // Loads records from the server using the Apex getRecords method and updates tab metadata in full view mode
    async load() {
        if (!this.objectApiName) return;
        try {
            this.data = await getRecords({
                objectApiName: this.objectApiName,
                targetId: this.targetId,
                targetField: this._targetField
            });
            this.error = null;
        } catch (error) {

            this.error = error?.body?.message || error.message;
            this.data = [];
        }
        if (this.isFullView) {
            await this._updateTabMeta();
        }
    }

    // Parses the TargetField__c metadata value into separate target object and target field parts
    _parseTargetField() {
        if (!this._config?.TargetField__c) return;

        const parts = this._config.TargetField__c.split('.');
        this._targetObject = this._targetObject || parts[0];
        this._targetField = this._targetField || parts[1];
    }

    // Builds the datatable column definitions from the field setup metadata, filtering by visibility and sorting by sortOrder
    _buildColumns() {
        if (!this._fieldSetup?.length) return [];
        return this._fieldSetup
            .filter(f => f.isVisible)
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map(f => {
                if (f.type === 'url') {
                    return {
                        label: f.label,
                        fieldName: 'link',
                        type: 'url',
                        sortable: f.isSortable,
                        typeAttributes: {
                            label: { fieldName: f.fieldName },
                            target: '_self'
                        }
                    };
                }
                return {
                    label: f.label,
                    fieldName: f.fieldName,
                    type: f.type,
                    sortable: f.isSortable
                };
            });
    }


    // Updates the console tab label and icon based on the metadata configuration
    async _updateTabMeta() {
        if (!this.enclosingTabId || !this._config)
            return;
        await setTabLabel(this.enclosingTabId, this._config.TabLabel__c);
        await setTabIcon(this.enclosingTabId, this._config.TabIcon__c, {
            iconAlt: this._config.DataTableLabel__c
        });
    }


    // Navigates to a full view of the datatable, opening a new console tab or navigating to a new page
    async handleViewAll() {
        const pageReference = {
            type: 'standard__component',
            attributes: {
                componentName: 'c__dataTableLwc'
            },
            state: {
                c__objectApiName: this.objectApiName,
                c__targetId: this.targetId || '',
                c__targetField: this._targetField || '',
                c__targetObject: this._targetObject || '',
                c__viewAll: 'true',
                c__uid: `${this.objectApiName}-${this.targetId || 'all'}`
            }
        };

        if (this.isConsoleNavigation?.data) {
            await openTab({ pageReference, focus: true });
            return;
        }

        this[NavigationMixin.Navigate](pageReference);
    }



    // Handles target lookup field change and reloads the data with the newly selected record ID
    handleTargetChange(event) {
        this.showAll = true;
        this.targetId = event.detail.value[0] || null;
        this.load();
    }


    // Returns a comparator function for sorting data by a given field and direction with an optional primer
    sortBy(field, reverse, primer) {
        const key = primer
            ? function (x) {
                return primer(x[field]);
            }
            : function (x) {
                return x[field];
            };
        return function (a, b) {
            a = key(a);
            b = key(b);
            return reverse * ((a > b) - (b > a));
        };
    }

    // Handles column header sort event, clones and sorts the data array, then updates sort state
    onHandleSort(event) {
        const { fieldName: sortedBy, sortDirection } = event.detail;
        const cloneData = [...this.data];
        cloneData.sort(this.sortBy(sortedBy, sortDirection === 'asc' ? 1 : -1));
        this.data = cloneData;
        this.sortDirection = sortDirection;
        this.sortedBy = sortedBy;
    }



    get title() {
        return this._config?.TabLabel__c || 'Data Table';
    }

    get cardIcon() {
        return this._config?.TabIcon__c || 'standard:record';
    }

    get pageSize() {
        return this._config?.PageSize__c || 5;
    }

    get hasTarget() {
        return !!this._targetField;
    }


    get targetObject() {
        return this._targetObject;
    }

    get targetField() {
        return this._targetField;
    }


    // Determines whether the "View All" button should be visible based on data size and current view mode
    get showViewAll() {
        return this.showAll && !this.isFullView && (this.data?.length ?? 0) > this.pageSize;
    }

    // Returns the table data with record links and flattened relationship fields, limited by page size unless in full view
    get tableData() {
        if (!this.data?.length) return [];
        const rows = this.isFullView ? (this.data || []) : (this.data || []).slice(0, this.pageSize);
        return rows.map(r => ({
            ...r,
            link: `/${r.Id}`,
            Contact_Name: r.Contact?.Name,
            Account_Name: r.Account?.Name,
            ...(this._targetField && {
                [this._targetField]: r[this._targetObject]?.Name
            })
        }));
    }

}


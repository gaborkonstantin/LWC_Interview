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




    @wire(CurrentPageReference)
    readPageState(pageRef) {
        const state = pageRef?.state;
        if (!state) return;

        if (state.c__objectApiName ) {
            this.objectApiName = state.c__objectApiName;
        }

        if ('c__targetId' in state) {
            this.targetId = state.c__targetId || null;
        }

        if (state.c__viewAll === 'true') {
            this.isFullView = true;
            this.showAll = false; // Do not show the button again in full view
        }
    }


    connectedCallback() {
        this.refreshHandlerID = registerRefreshHandler(this, this.load.bind(this));
    }

    disconnectedCallback() {
        if (this.refreshHandlerID) {
            unregisterRefreshHandler(this.refreshHandlerID);
        }
    }


    async load() {
        if (!this.objectApiName) return;
        try {
            this.data = await getRecords({
                objectApiName: this.objectApiName,
                targetId: this.targetId,
            });
        } catch (error) {

            this.error = error?.body?.message || error.message;
            this.data = [];
        }
        if (this.isFullView) {
            await this._updateTabMeta();
        }
    }

    _parseTargetField() {
        if ( !this._config?.TargetField__c)
            return;
        [this._targetObject, this._targetField] = this._config.TargetField__c.split('.');
    }

    _buildColumns(){
        if(!this._fieldSetup?.length) return [];
        return this._fieldSetup
            .filter(f => f.isVisible)
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map(f => {
                if (f.type === 'url'){
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
                        }
                    });
                }

    

    async _updateTabMeta() {
        if (!this.enclosingTabId || !this._config) 
            return;
        await setTabLabel(this.enclosingTabId, this._config.TabLabel__c);
        await setTabIcon(this.enclosingTabId, this._config.TabIcon__c,{
            iconAlt: this._config.DataTableLabel__c
        });
    }

    async handleViewAll() {
        const pageReference = {
            type: 'standard__component',
            attributes: {
                componentName: 'c__dataTableLwc'
            },
            state: {
                c__objectApiName: this.objectApiName,
                c__targetId: this.targetId || '',
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


    handleTargetChange(event) {
        this.showAll = true;
        this.targetId = event.detail.value[0] || null;
        this.load();
    }



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

    onHandleSort(event) {
        const { fieldName: sortedBy, sortDirection } = event.detail;
        const cloneData = [...this.data];
        cloneData.sort(this.sortBy(sortedBy, sortDirection === 'asc' ? 1 : -1));
        this.data = cloneData;
        this.sortDirection = sortDirection;
        this.sortedBy = sortedBy;
    }



    get title(){
        return this._config?.TabLabel__c || 'Data Table';
    }

    get cardIcon(){
        return this._config?.TabIcon__c || 'standard:record';
    }

    get pageSize(){
        return this._config?.PageSize__c || 5;
    }

    get hasTarget(){
        return !!this._targetField;
    }


    get targetObject() {
        return this._targetObject;
    }

    get targetField() {
        return this._targetField;
    }



     get showViewAll() {
        return this.showAll && !this.isFullView && (this.data?.length ?? 0) > this.pageSize;
    }

    get tableData() {
        if (!this.data?.length) return [];
        const rows = this.isFullView ? (this.data || []) : (this.data || []).slice(0, this.pageSize);
        return rows.map(r => ({
            ...r,
            link: `/${r.Id}`,
            ...(this._targetField && {
                [this._targetField] : r [this._targetObject]?.Name
            })
        }));
    }

}


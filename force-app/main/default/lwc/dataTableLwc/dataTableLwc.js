import { LightningElement, api, track, wire } from 'lwc';
import getOpportunities from '@salesforce/apex/GetRecordController.getOpportunities';
import getCase from '@salesforce/apex/GetRecordController.getCase';
import { NavigationMixin, CurrentPageReference } from 'lightning/navigation';
import { openTab, setTabLabel, setTabIcon, EnclosingTabId, IsConsoleNavigation } from 'lightning/platformWorkspaceApi';
import { registerRefreshHandler, unregisterRefreshHandler } from 'lightning/refresh';



const PAGE_SIZE = 5;

export default class DataTableLwc extends NavigationMixin(LightningElement) {


    @api objectApiName;
    @track data = [];
    @track error;
    @wire(IsConsoleNavigation) isConsoleNavigation;
    @wire(EnclosingTabId) enclosingTabId;

    refreshHandlerID;
    showAll = true;
    targetId = null;
    isFullView = false;



    @wire(CurrentPageReference)
    readPageState(pageRef) {
        const state = pageRef?.state;
        if (!state) return;

        let shouldReload = false;

        if (state.c__objectApiName && state.c__objectApiName !== this.objectApiName) {
            this.objectApiName = state.c__objectApiName;
            shouldReload = true;
        }

        if ('c__targetId' in state) {
            const newTargetId = state.c__targetId || null;
            if (newTargetId !== this.targetId) {
                this.targetId = newTargetId;
                shouldReload = true;
            }
        }

        if (state.c__viewAll === 'true') {
            this.isFullView = true;
            this.showAll = false; // Do not show the button again in full view
            shouldReload = true;

        }

        if (shouldReload && this.objectApiName) {
            this.load();
        }
    }


    connectedCallback() {
        this.load();
        this.refreshHandlerID = registerRefreshHandler(this,this.load.bind(this));
    }

    disconnectedCallback() {
        if (this.refreshHandlerID) {
            unregisterRefreshHandler(this.refreshHandlerID);
        }
    }

    async load() {
        if (!this.objectApiName) return;
        try {
            if (this.isOpportunity) {
                this.data = await getOpportunities({ recordId: this.targetId });
            } else {
                this.data = await getCase({ recordId: this.targetId });
            }
        } catch (error) {

            this.error = error?.body?.message || error.message;
            this.data = [];
        }
        if (this.isFullView) {
            await this._updateTabMeta();
        }
    }

    async _updateTabMeta() {
        if (!this.enclosingTabId) 
            return;
        const label = this.isOpportunity ? 'Opportunity' : 'Case';
        const icon = this.isOpportunity ? 'standard:opportunity' : 'standard:case';
        await setTabLabel(this.enclosingTabId, label);
        await setTabIcon(this.enclosingTabId, icon, { iconAlt: label });
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

    
    get showViewAll() {
        return this.showAll && !this.isFullView && this.data.length > PAGE_SIZE;
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



    get isOpportunity() {
        return this.objectApiName === 'Opportunity';
    }

    get columns() {
        if (this.isOpportunity) {
            return [
                {
                    label: 'Opportunity Name', fieldName: 'link', type: 'url',
                    typeAttributes: {
                        label: { fieldName: 'Name' },
                        target: '_self'
                    }
                },
                { label: 'Account Name', fieldName: 'accountName', sortable: true },
                { label: 'Amount', fieldName: 'Amount' },
                { label: 'Type', fieldName: 'Type' },
                { label: 'Close Date', fieldName: 'CloseDate', sortable: true },
                { label: 'Stage', fieldName: 'StageName' },
                { label: 'Probability (%)', fieldName: 'Probability' },
            ];
        }
        return [
            {
                label: 'Case Number', fieldName: 'link', type: 'url',
                typeAttributes: { label: { fieldName: 'caseNumber' }, target: '_self' }
            },
            { label: 'Contact Name', fieldName: 'contactName', sortable: true },
            { label: 'Status', fieldName: 'Status' },
            { label: 'Priority', fieldName: 'Priority' },
            { label: 'Supplied Email', fieldName: 'SuppliedEmail' },
            { label: 'Description', fieldName: 'Description' },
            { label: 'Subject', fieldName: 'Subject' },
            { label: 'Origin', fieldName: 'Origin' },
        ];
    }

    get tableData() {
        const rows = this.isFullView ? (this.data || []) : (this.data || []).slice(0, PAGE_SIZE);
        return rows.map(r => ({
            ...r,
            link: `/${r.Id}`,
            accountName: r.Account?.Name,
            contactName: r.Contact?.Name,
            caseNumber: r.CaseNumber
        }));
    }

}


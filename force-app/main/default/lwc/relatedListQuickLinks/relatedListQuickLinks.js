import { LightningElement, api, wire} from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { openTab, IsConsoleNavigation } from 'lightning/platformWorkspaceApi';
import getRelatedQuickLinksConfig from '@salesforce/apex/GetRecordController.getRelatedQuickLinksConfig';
import getRecordCount from '@salesforce/apex/GetRecordController.getRecordCount';

export default class RelatedListQuickLinks extends NavigationMixin(LightningElement) {

    @api configName;
    @api recordId;

    links = [];
    isLoading = true;
    error;

    @wire(IsConsoleNavigation) isConsoleNavigation;

    
    @wire(getRelatedQuickLinksConfig, { configName: '$configName' })
    async wiredConfig({ data, error }) {
        if (data) {
            try {
                this.links = JSON.parse(data.LinksSetup__c);
            } catch (e) {
                this.error = 'Invalid LinksSetup JSON in metadata';
                this.isLoading = false;
                return;
            }
            await this._loadCounts();
            this.isLoading = false;
        } else if (error) {
            this.error = error?.body?.message || error.message;
            this.isLoading = false;
        }
    }

    async _loadCounts() {
        if (!this.recordId || !this.links.length) return;
        const counts = await Promise.all(
            this.links.map(link =>
                getRecordCount({ objectApiName: link.objectApiName, filterField: link.filterField, recordId: this.recordId })
            )
        );
        this.links = this.links.map((link, i) => ({ ...link, count: counts[i] }));
    }

    get formattedLinks() {
        return this.links.map(link => ({
            ...link,
            formattedLabel: link.count != null ? `${link.label} (${link.count > 10 ? '10+' : link.count})` : link.label
        }));
    }


   
    async handleLinkClick(event) {
        event.preventDefault();
        const objectApiName = event.currentTarget.dataset.object;
        if (!objectApiName) return;

        const pageReference = {
            type: 'standard__component',
            attributes: { componentName: 'c__dataTableLwc' },
            state: {
                c__objectApiName: objectApiName,
                c__targetId: this.recordId,
                c__viewAll: 'true',
                c__uid: `${objectApiName}-${this.recordId}`
            }
        };

        if (this.isConsoleNavigation?.data) {
            await openTab({ pageReference, focus: true });
            return;
        }

        this[NavigationMixin.Navigate](pageReference);
    }
}
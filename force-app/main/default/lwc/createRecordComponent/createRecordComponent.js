import { LightningElement, api } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import {RefreshEvent} from 'lightning/refresh';



export default class CreateRecordComponent extends LightningElement {

    @api isToogleButtonVisible;
    @api formTitle;
    

    // Determines the type of object : Opportunity or Case
    isOpportunity = true;
    formMainLabel = "Opportunity";

    // Search input values for Account and Contact lookup fields
    selectedAccountId;
    selectedContactId;

   
    inputFields = [
        {
            "objectApiName": "Opportunity",
            "isActive": true,
            "inputs": [
                { fieldName: 'Name', required: false },
                { fieldName: 'AccountId', required: true },
                { fieldName: 'CloseDate',required: true },
                { fieldName: 'Probability', required: false },
                { fieldName: 'Amount', required: false },
                { fieldName: 'Type', required: false },
                { fieldName: 'StageName', required: true },
            ],
            
        },
        {
            "objectApiName": "Case",
            "isActive": false,
            "inputs": [
                { fieldName: 'ContactId', required: true },
                { fieldName: 'Status', required: true },
                { fieldName: 'Priority', required: false },
                { fieldName: 'SuppliedEmail', required: true },
                { fieldName: 'Origin', required: false },
                { fieldName: 'Description', required: false },
                { fieldName: 'Subject', required: false },
            ]
        }
    ];

    // Handles tooggling between Opportunity and Case creation
    handleOnChange(event) {
        this.inputFields.forEach(md => {
            md.isActive = md.objectApiName === "Opportunity" ? this.isOpportunity? false : true : this.isOpportunity? true : false;

        })
        this.isOpportunity = event.target.checked;
        this.formMainLabel = this.isOpportunity ? 'Opportunity' : 'Case';
    }

    // Handles successful record creation and shows a toast message then subscrite to RefreshEvent
    handleSuccess(event) {
        const object = this.isOpportunity ? 'Opportunity' : 'Case';

        this.dispatchEvent(new ShowToastEvent({
            title: 'Success',
            message: `${object} created successfully!`,
            variant: 'success'
        }));

        this.resetFormFields();
        this.dispatchEvent(new RefreshEvent());
    }

    // Handles errors during record creation
    handleError(event) {
        const object = this.isOpportunity ? 'Opportunity' : 'Case';

        this.dispatchEvent(new ShowToastEvent({
            title: 'Error',
            message: `Error creating ${object}. Please try again.`,
            variant: 'error'
        }));
    }

    handleOppAccountChange(event) {
        this.selectedAccountId = event.detail.value || null;
    }

    handleCaseContactChange(event) {
        this.selectedContactId = event.detail.value || null;
    }

    // Resets all form fields to their default state
    resetFormFields() {
        this.template.querySelectorAll('lightning-input-field').forEach(field => {
            field.reset();
        });
    }
}
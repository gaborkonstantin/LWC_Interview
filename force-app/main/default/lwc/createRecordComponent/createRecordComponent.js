import { LightningElement, wire, api } from 'lwc';
import { publish, MessageContext } from 'lightning/messageService';
import CHANNEL from '@salesforce/messageChannel/HomePageChannel__c';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';



export default class CreateRecordComponent extends LightningElement {

    @api isToogleButtonVisible;
    @api formTitle;

    // Determines the type of object : Opportunity or Case
    isOpportunity = true;
    formMainLabel = "Opportunity";

    // Search input values for Account and Contact lookup fields
    selectedAccountId;
    selectedContactId;

    // Custom metadata typeba bevinni ezt az adatot
    // Refresht használni lms helyett
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
    ]

    @wire(MessageContext) messageContext;


    // Handles tooggling between Opportunity and Case creation
    handleOnChange(event) {
        this.inputFields.forEach(md => {
            md.isActive = md.objectApiName === "Opportunity" ? this.isOpportunity? false : true : this.isOpportunity? true : false;

        })
        this.isOpportunity = event.target.checked;
        this.formMainLabel = this.isOpportunity ? 'Opportunity' : 'Case';
    }

    // Handles successful record creation
    handleSuccess(event) {
        const object = this.isOpportunity ? 'Opportunity' : 'Case';

        this.dispatchEvent(new ShowToastEvent({
            title: 'Success',
            message: `${object} created successfully!`,
            variant: 'success'
        }));

        this.resetFormFields();

        publish(this.messageContext, CHANNEL, {
            type: 'RECORD_CREATED',
            objectApiName: object,
            targetId: null
        });


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

        publish(this.messageContext, CHANNEL, {
            type: 'TARGET_CHANGED',
            objectApiName: 'Opportunity',
            targetId: this.selectedAccountId
        });
    }

    handleCaseContactChange(event) {
        this.selectedContactId = event.detail.value || null;

        publish(this.messageContext, CHANNEL, {
            type: 'TARGET_CHANGED',
            objectApiName: 'Case',
            targetId: this.selectedContactId
        });
    }

    // Resets all form fields to their default state
    resetFormFields() {
        this.template.querySelectorAll('lightning-input-field').forEach(field => {
            field.reset();
        });
    }
}
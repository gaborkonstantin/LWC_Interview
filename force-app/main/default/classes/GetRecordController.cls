public with sharing class GetRecordController {

        @AuraEnabled
        public static List<Opportunity> getOpportunities(Id recordId) {
            if (recordId == null) {
                return [SELECT Id, Name, Amount, AccountId,Account.Name, Type, CloseDate, StageName, Probability 
                        FROM Opportunity
                        ORDER BY CreatedDate DESC];
                
            }else{
                return [SELECT Id, Name, Amount, AccountId,Account.Name, Type, CloseDate, StageName, Probability 
                        FROM Opportunity 
                        WHERE AccountId = :recordId
                        ORDER BY CreatedDate DESC];
            }
        }


        @AuraEnabled
        public static List<Case> getCase(Id recordId) {
            if (recordId == null) {
                return [SELECT Id, CaseNumber, ContactId, Contact.Name, Status, Priority, SuppliedEmail, Description, Subject, Origin 
                        FROM Case
                        ORDER BY CreatedDate DESC];
                
            }else{
                return [SELECT Id, CaseNumber, ContactId, Contact.Name, Status, Priority, SuppliedEmail, Description, Subject, Origin 
                        FROM Case 
                        WHERE ContactId = :recordId
                        ORDER BY CreatedDate DESC];
            }
        }

    }

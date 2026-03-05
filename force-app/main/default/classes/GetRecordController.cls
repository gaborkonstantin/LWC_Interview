public with sharing class GetRecordController {


    // Retrieves the Object_Config__mdt metadata record matching the given object API name
    @AuraEnabled(cacheable=true)
    public static Object_Config__mdt getObjectConfig(String objectApiName){
    return [SELECT FieldSetup__c, ObjectApiName__c, OrderBy__c, PageSize__c, Query__c, TabIcon__c, TabLabel__c, TargetField__C
    FROM Object_Config__mdt
    WHERE ObjectApiName__c = :objectApiName
    LIMIT 1];
    }


    // Fetches a list of records by building a dynamic SOQL query from the metadata configuration
    @AuraEnabled
    public static List<sObject> getRecords(String objectApiName, String targetId, String targetField) {
        try{
            Object_Config__mdt config = getObjectConfig(objectApiName);
            String query = buildQuery(config, targetId, targetField);
            return Database.query(query);
        }catch(Exception e){
            throw new AuraHandledException('Query Error: ' + e.getMessage());
        }
    }

    // Builds a dynamic SOQL query string from the metadata config, appending WHERE and ORDER BY clauses as needed
    private static String buildQuery(Object_Config__mdt config, String targetId, String targetField) {
        String query = config.Query__c;

        if (String.isNotBlank(targetId)) {
            String field = String.isNotBlank(targetField)
                ? targetField
                : (String.isNotBlank(config.TargetField__c) ? config.TargetField__c.split('\\.')[1] : null);

            if (String.isNotBlank(field)) {
                query += ' WHERE ' + field + ' = :targetId';
            }
        }

        if (String.isNotBlank(config.OrderBy__c)) {
            query += ' ' + config.OrderBy__c;
        }
        return query;
    }

    // Returns the total number of records for a given object filtered by a specific field and record ID
    @AuraEnabled(cacheable=true)
    public static Integer getRecordCount(String objectApiName, String filterField, String recordId) {
        String query = 'SELECT COUNT() FROM ' + objectApiName + ' WHERE ' + filterField + ' = :recordId';
        return Database.countQuery(query);
    }

    // Retrieves the RelatedQuickLink__mdt metadata record matching the given config name
    @AuraEnabled(cacheable=true)
    public static RelatedQuickLink__mdt getRelatedQuickLinksConfig(String configName) {
        return [
            SELECT ConfigName__c, TargetObject__c, LinksSetup__c
            FROM RelatedQuickLink__mdt
            WHERE ConfigName__c = :configName
            LIMIT 1
        ];
    }
    }
    
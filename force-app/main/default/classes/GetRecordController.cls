public with sharing class GetRecordController {

    @AuraEnabled(cacheable=true)
    public static Object_Config__mdt getObjectConfig(String objectApiName){
    return [SELECT FieldSetup__c, ObjectApiName__c, OrderBy__c, PageSize__c, Query__c, TabIcon__c, TabLabel__c, TargetField__C
    FROM Object_Config__mdt
    WHERE ObjectApiName__c = :objectApiName
    LIMIT 1];
    }


    @AuraEnabled(cacheable=true)
    public static List<sObject> getRecords(String objectApiName, String targetId){
        try{
            Object_Config__mdt config = getObjectConfig(objectApiName);
            String query = buildQuery(config, targetId);
            return Database.query(query);
        }catch(Exception e){
            throw new AuraHandledException('Query Error: ' + e.getMessage());
        }
    }


    private static String buildQuery(Object_Config__mdt config, String targetId){
        String query = config.Query__c;
        if(String.IsNotBlank(targetId) && String.IsNotBlank(config.TargetField__c)){
            String targetField = config.TargetField__c.split('\\.')[1];
            query += ' WHERE ' + targetField + ' = :targetId';
            
        }
        if (String.isNotBlank(config.OrderBy__c)) {
            query += ' ' + config.OrderBy__c;
        }
        return query;
    }

    @AuraEnabled(cacheable=true)
    public static Integer getRecordCount(String objectApiName, String filterField, String recordId) {
        String query = 'SELECT COUNT() FROM ' + objectApiName + ' WHERE ' + filterField + ' = :recordId';
        return Database.countQuery(query);
    }

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
    
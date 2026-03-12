@isTest
private class GetRecordControllerTest {

    // ─── getObjectConfig ───────────────────────────────────────────────────────

    @isTest
    static void testGetObjectConfig_ReturnsRecord() {
        List<Object_Config__mdt> existing = [SELECT ObjectApiName__c FROM Object_Config__mdt LIMIT 1];
        if (existing.isEmpty()) {
            return;
        }

        String apiName = existing[0].ObjectApiName__c;

        Test.startTest();
        Object_Config__mdt result = GetRecordController.getObjectConfig(apiName);
        Test.stopTest();

        System.assertNotEquals(null, result, 'Config record should exist');
        System.assertEquals(apiName, result.ObjectApiName__c, 'ObjectApiName__c should match');
    }

    @isTest
    static void testGetObjectConfig_ThrowsWhenNotFound() {
        String nonExistent = 'NonExistentObject_xyz_99999__c';

        Test.startTest();
        try {
            GetRecordController.getObjectConfig(nonExistent);
            System.assert(false, 'Expected QueryException was not thrown');
        } catch (System.QueryException e) {
            System.assert(true, 'QueryException thrown as expected');
        }
        Test.stopTest();
    }

    // ─── getRecords ────────────────────────────────────────────────────────────

    @isTest
    static void testGetRecords_ReturnsListWithoutFilter() {
        List<Object_Config__mdt> existing = [SELECT ObjectApiName__c FROM Object_Config__mdt LIMIT 1];
        if (existing.isEmpty()) {
            return;
        }

        String apiName = existing[0].ObjectApiName__c;

        Test.startTest();
        List<sObject> records = GetRecordController.getRecords(apiName, null, null);
        Test.stopTest();

        System.assertNotEquals(null, records, 'Result list should not be null');
    }

    @isTest
    static void testGetRecords_ReturnsListWithTargetField() {
        // Covers the WHERE branch in buildQuery when targetField is explicitly provided
        List<Object_Config__mdt> existing = [
            SELECT ObjectApiName__c, TargetField__c
            FROM Object_Config__mdt
            WHERE TargetField__c != null
            LIMIT 1
        ];
        if (existing.isEmpty()) {
            return;
        }

        String apiName = existing[0].ObjectApiName__c;

        Account acc = new Account(Name = 'Test Record Account');
        insert acc;

        Test.startTest();
        List<sObject> records = GetRecordController.getRecords(apiName, acc.Id, 'Id');
        Test.stopTest();

        System.assertNotEquals(null, records, 'Result list should not be null');
    }

    @isTest
    static void testGetRecords_ThrowsAuraHandledExceptionWhenConfigNotFound() {
        // AuraHandledException.getMessage() always returns "Script-thrown exception" in tests,
        // so we only assert that the correct exception type is thrown
        String nonExistent = 'NonExistentObject_xyz_99999__c';

        Test.startTest();
        try {
            GetRecordController.getRecords(nonExistent, null, null);
            System.assert(false, 'Expected AuraHandledException was not thrown');
        } catch (AuraHandledException e) {
            System.assert(true, 'AuraHandledException thrown as expected');
        }
        Test.stopTest();
    }

    // ─── getRecordCount ────────────────────────────────────────────────────────

    @isTest
    static void testGetRecordCount_ReturnsOne() {
        Account acc = new Account(Name = 'Count Test Account');
        insert acc;

        Test.startTest();
        Integer count = GetRecordController.getRecordCount('Account', 'Id', acc.Id);
        Test.stopTest();

        System.assertEquals(1, count, 'Count should be 1');
    }

    @isTest
    static void testGetRecordCount_ReturnsZeroWhenNoMatch() {
        Test.startTest();
        Integer count = GetRecordController.getRecordCount('Account', 'Name', 'NonExistentName_xyz_99999');
        Test.stopTest();

        System.assertEquals(0, count, 'Count should be 0');
    }

    // ─── getRelatedQuickLinksConfig ────────────────────────────────────────────

    @isTest
    static void testGetRelatedQuickLinksConfig_ReturnsRecord() {
        List<RelatedQuickLink__mdt> existing = [SELECT ConfigName__c FROM RelatedQuickLink__mdt LIMIT 1];
        if (existing.isEmpty()) {
            return;
        }

        String configName = existing[0].ConfigName__c;

        Test.startTest();
        RelatedQuickLink__mdt result = GetRecordController.getRelatedQuickLinksConfig(configName);
        Test.stopTest();

        System.assertNotEquals(null, result, 'Config record should exist');
        System.assertEquals(configName, result.ConfigName__c, 'ConfigName__c should match');
    }

    @isTest
    static void testGetRelatedQuickLinksConfig_ThrowsWhenNotFound() {
        String nonExistent = 'NonExistentConfig_xyz_99999';

        Test.startTest();
        try {
            GetRecordController.getRelatedQuickLinksConfig(nonExistent);
            System.assert(false, 'Expected QueryException was not thrown');
        } catch (System.QueryException e) {
            System.assert(true, 'QueryException thrown as expected');
        }
        Test.stopTest();
    }
}

/**
 * @author a.demeshko
 * created on 12/21/15
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.awsAccounts')
    .controller('awsAccountsCtrl', awsAccountsCtrl);

  /** @ngInject */
    function awsAccountsCtrl($scope, $http, $timeout, $element) {
        console.log("AWS Accounts Ctrl initialized");

        $scope.awsAccounts = [];
        $scope.currentAccount = {};
        $scope.currentAccount.currentTable = "";
        $scope.dynamoDBTables = [];

        $scope.refreshAwsAccount = refreshAwsAccounts;
        $scope.refreshAwsAccount();

        $scope.refreshDynamoDBTables = refreshDynamoDBTables;
        
        function refreshAwsAccounts() {
            var url = "http://subkale.aka.corp.amazon.com:5000/awsAccounts";
            var method = "GET";
            $http({
                method: method,
                url: url
            }).then(function success(response) {
                console.log(response);
                console.log(response.data);
                $scope.awsAccounts = response.data;
            }, function error(response) {
                console.log(response);
            });
        };

        function refreshDynamoDBTables(awsAccountNo) {
            if (!awsAccountNo) {
                return [];
            }
            var url = "http://subkale.aka.corp.amazon.com:5000/awsAccounts/"+awsAccountNo+"/us-east-1/dynamoDBtables/";
            var method = "GET";
            $http({
                method: method,
                url: url
            }).then(function success(response) {
                console.log(response);
                console.log(response.data);
                $scope.currentAccount.ddbTables = response.data;
            }, function error(response) {
                console.log(response);
            });
        };

        function refreshTableInfo(accountNo, tableName) {
            if (!accountNo || !tableName) {
                return [];
            }
            var url = "http://subkale.aka.corp.amazon.com:5000/awsAccounts/"+accountNo+"/us-east-1/dynamoDBtables/"+tableName+"/";
            var method = "GET";
            $http({
                method: method,
                url: url,
            }).then(function success(response) {
                console.log(response);
                console.log(response.data);
                $scope.currentAccount.currentTable.KeySchema = response.data.KeySchema;
                $scope.currentAccount.currentTable.AttributeDefinitions = response.data.AttributeDefinitions;
            }, function error(response) {
                console.log(response);
            });
        };

        function slugify(hashkeyname) {
            console.log(hashkeyname.toLowerCase().trim()
                        .replace(/\-/g, ''));
            return hashkeyname.toLowerCase().trim()
                .replace(/\-/g, '');
        }

        function getKeyConditions(hashKeyName, hashKeyValue, rangeKeyName, rangeKeyValue) {
        };
        
        function getKeyConditionExpression(hashKeyName, hashKeyValue, rangeKeyName, rangeKeyValue) {
            var key_condition_expression = hashKeyName+" = :"+hashKeyName;
            if(rangeKeyValue) {
                key_condition_expression += " AND "+rangeKeyName+" = :" + rangeKeyName;
            }
            return key_condition_expression;
        };

        function getExpressionAttributeValues(hashKeyName, hashKeyValue, rangeKeyName, rangeKeyValue) {
            var expressionAttributeValues = {};
            $scope.currentAccount.currentTable.AttributeDefinitions.forEach(function(value, index, arr) {
                var attributeName = value.AttributeName;
                var attributeType = value.AttributeType;
                if(angular.equals(attributeName, hashKeyName)) {
                    expressionAttributeValues[":"+attributeName] = {};
                    expressionAttributeValues[":"+attributeName][attributeType] =  hashKeyValue;
                };
                if(angular.equals(attributeName, rangeKeyName) && rangeKeyValue) {
                    expressionAttributeValues[":"+attributeName] = {};
                    expressionAttributeValues[":"+attributeName][attributeType] =  rangeKeyValue;
                };
                   
            });
            return expressionAttributeValues;
            
        };

        function getExpressionAttributeNames(hashKeyName, rangeKeyName) {
            var expressionAttributeNames =  {};
            expressionAttributeNames[slugify(hashKeyName)] = hashKeyName;
            expressionAttributeNames[slugify(rangeKeyName)] =  rangeKeyName;
            return expressionAttributeNames;
        };
        
        function transformDynamodbQueryResult(dynamodbQueryItem) {
            var headers = $scope.currentAccount.currentTable.headers;
            var newRecord = {};            
            headers.forEach(function(header, index, arr) {
                if (dynamodbQueryItem.hasOwnProperty(header)){
                    for(var recordType in dynamodbQueryItem[header]) {
                        newRecord[header] = dynamodbQueryItem[header][recordType];
                    }
                }
            });
            return newRecord;
        }
        
        function getTableData(dynamodbquerydata) {
            var tableHeaders = []
            let set = new Set();
            var queryResults = []
            dynamodbquerydata.Items.forEach(function(ddbRecord, ddbRecordindex, ddbRecordarr) {
                Object.keys(ddbRecord).forEach(function(ddbRecordKey, ddbRecordKeyindex, ddbRecordKeyarr) {
                    set.add(ddbRecordKey);
                    $scope.currentAccount.currentTable.headers = Array.from(set);
                });
                queryResults.push(transformDynamodbQueryResult(ddbRecord));
            });
            $scope.currentAccount.currentTable.headers = Array.from(set);
            $scope.currentAccount.currentTable.queryResults = queryResults;
            console.log($scope.currentAccount.currentTable.headers);
            console.log($scope.currentAccount.currentTable.queryResults);
        };
        
        $scope.selectCurrentAccount = function(account){
            $scope.currentAccount = account;
            if (!$scope.currentAccount.ddbTables) {
                refreshDynamoDBTables(account.accountNo);
            }
        }

        $scope.selectCurrentTable = function(table){
            $scope.currentAccount.currentTable = table;
            if (!$scope.currentAccount.currentTable.KeySchema) {
                refreshTableInfo($scope.currentAccount.accountNo, table.name);
            }
        }

        $scope.queryTable = function() {
            var hashkeyName = $scope.currentAccount.currentTable.KeySchema[0].AttributeName;
            var rangekeyName;
            var rangekeyValue;
            if ($scope.currentAccount.currentTable.KeySchema.length > 1) {
                var rangekeyName = $scope.currentAccount.currentTable.KeySchema[1].AttributeName;
                var rangekeyValue = $scope.currentAccount.currentTable.queryParams.rangeKey;
            }

            var hashkeyValue = $scope.currentAccount.currentTable.queryParams.hashKey;


            var tableName = $scope.currentAccount.currentTable.name;
            var accountNo = $scope.currentAccount.accountNo;
            var url = "http://subkale.aka.corp.amazon.com:5000/awsAccounts/"+accountNo+"/us-east-1/dynamoDBtables/"+tableName+"/query";
            var method = "GET";
            $http({
                method: method,
                url: url,
                params: {
                    'conditionExpression' : getKeyConditionExpression(hashkeyName, hashkeyValue, rangekeyName, rangekeyValue),
                    'expressionAttributeValues': getExpressionAttributeValues(hashkeyName, hashkeyValue, rangekeyName, rangekeyValue),
                    //'expressionAttributeNames': getExpressionAttributeNames(hashkeyName, rangekeyName)
                }
            }).then(function success(response) {
                console.log(response);
                console.log(response.data);
                getTableData(response.data);
            }, function error(response) {
                console.log(response);
            });
            
        }
    }
})();

/**
 * @author a.demeshko
 * created on 12/21/15
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.dynamodb')
    .controller('dynamodbCtrl', dynamodbCtrl);

  /** @ngInject */
    function dynamodbCtrl($scope, $http, $timeout, $element) {
        console.log("AWS Accounts Ctrl initialized");

        $scope.region = {};
        $scope.awsRegions = [
            {'name':'us-east-1', 'currentAccount': {}},
            {'name':'us-east-2', 'currentAccount': {}},
            {'name':'us-west-1', 'currentAccount': {}},
            {'name':'us-west-2', 'currentAccount': {}},
            {'name':'ap-northeast-1', 'currentAccount': {}},
            {'name':'ap-northeast-2', 'currentAccount': {}},
            {'name':'ap-northeast-3', 'currentAccount': {}},
            {'name':'ap-south-1', 'currentAccount': {}},
            {'name':'ap-southeast-1', 'currentAccount': {}},
            {'name':'ap-southeast-2', 'currentAccount': {}},
            {'name':'ca-central-1', 'currentAccount': {}},
            {'name':'cn-north-1', 'currentAccount': {}},
            {'name':'cn-northwest-1', 'currentAccount': {}},
            {'name':'eu-central-1', 'currentAccount': {}},
            {'name':'eu-west-1', 'currentAccount': {}},
            {'name':'eu-west-2', 'currentAccount': {}},
            {'name':'eu-west-3', 'currentAccount': {}},
            {'name':'sa-east-1', 'currentAccount': {}}];
        
        $scope.region.selected = $scope.awsRegions[0];
        $scope.currentRegion = $scope.region.selected; 


        $scope.awsAccounts = [];
        $scope.currentAccount = {};
        $scope.currentAccount[$scope.currentRegion.name] = {};
        $scope.currentAccount[$scope.currentRegion.name].currentTable = {};

        $scope.refreshAwsAccount = refreshAwsAccounts;
        $scope.refreshAwsAccount();

        $scope.refreshDynamoDBTables = refreshDynamoDBTables;
        
        function refreshAwsAccounts() {
            var url = "https://subkale.aka.corp.amazon.com:5000/awsAccounts";
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

        function refreshDynamoDBTables() {
            var region = $scope.currentRegion.name;
            var awsAccountNo = $scope.currentAccount.accountNo;
            $scope.currentAccount[region] = {};
            var url = "https://subkale.aka.corp.amazon.com:5000/awsAccounts/"+awsAccountNo+"/"+region+"/dynamoDBtables/";
            var method = "GET";
            $http({
                method: method,
                url: url
            }).then(function success(response) {
                console.log(response);
                console.log(response.data);
                $scope.currentAccount[region].ddbTables = response.data;
            }, function error(response) {
                console.log(response);
            });
        };

        function refreshTableInfo(accountNo, tableName) {
            var accountNo = $scope.currentAccount.accountNo;
            var currentRegion = $scope.currentRegion;
            var tableName = $scope.currentAccount[currentRegion.name].currentTable.name;
            var url = "https://subkale.aka.corp.amazon.com:5000/awsAccounts/"+accountNo+"/"+$scope.region.selected.name+"/dynamoDBtables/"+tableName+"/";
            var method = "GET";
            $http({
                method: method,
                url: url,
            }).then(function success(response) {
                console.log(response);
                console.log(response.data);
                $scope.currentAccount[currentRegion.name].currentTable.KeySchema = response.data.KeySchema;
                $scope.currentAccount[currentRegion.name].currentTable.AttributeDefinitions = response.data.AttributeDefinitions;
                $scope.currentAccount[currentRegion.name].currentTable.ProvisionedThroughput = response.data.ProvisionedThroughput;
                $scope.currentAccount[currentRegion.name].currentTable.StreamSpecification = response.data.StreamSpecification;
                $scope.currentAccount[currentRegion.name].currentTable.LatestStreamArn = response.data.LatestStreamArn;
                $scope.currentAccount[currentRegion.name].currentTable.LatestStreamLabel = response.data.LatestStreamLabel;

                $scope.currentAccount[currentRegion.name].currentTable.ItemCount = response.data.ItemCount;
                $scope.currentAccount[currentRegion.name].currentTable.TableStatus = response.data.TableStatus;
                $scope.currentAccount[currentRegion.name].currentTable.TableArn = response.data.TableArn;
                $scope.currentAccount[currentRegion.name].currentTable.TableSizeBytes = response.data.TableSizeBytes;
                
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
            var key_condition_expression = "#hashkey = :"+slugify(hashKeyName);
            if(rangeKeyValue) {
                key_condition_expression += " AND #rangekey = :" + slugify(rangeKeyName);
            }
            return key_condition_expression;
        };

        function getExpressionAttributeValues(hashKeyName, hashKeyValue, rangeKeyName, rangeKeyValue) {
            var expressionAttributeValues = {};
            var currentRegionName = $scope.currentRegion.name;
            $scope.currentAccount[currentRegionName].currentTable.AttributeDefinitions.forEach(function(value, index, arr) {
                var attributeName = value.AttributeName;
                var attributeType = value.AttributeType;
                var attributeKey = slugify(":"+attributeName)
                if(angular.equals(attributeName, hashKeyName)) {

                    expressionAttributeValues[attributeKey] = {};
                    expressionAttributeValues[attributeKey][attributeType] =  hashKeyValue;
                };
                if(angular.equals(attributeName, rangeKeyName) && rangeKeyValue) {
                    expressionAttributeValues[attributeKey] = {};
                    expressionAttributeValues[attributeKey][attributeType] =  rangeKeyValue;
                };
                   
            });
            return expressionAttributeValues;
            
        };

        function getExpressionAttributeNames(hashKeyName, hashKeyValue, rangeKeyName, rangeKeyValue) {
            var expressionAttributeNames =  {};
            expressionAttributeNames["#hashkey"] = hashKeyName;
            if(rangeKeyValue) {
                expressionAttributeNames["#rangekeyName"] =  rangeKeyName;
            }
            return expressionAttributeNames;
        };
        
        function transformDynamodbQueryResult(dynamodbQueryItem) {
            var currentRegionName = $scope.currentRegion.name;
            var headers = $scope.currentAccount[currentRegionName].currentTable.headers;
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
            var set = new Set();
            var queryResults = [];
            var currentRegionName = $scope.currentRegion.name;
            dynamodbquerydata.Items.forEach(function(ddbRecord, ddbRecordindex, ddbRecordarr) {
                Object.keys(ddbRecord).forEach(function(ddbRecordKey, ddbRecordKeyindex, ddbRecordKeyarr) {
                    set.add(ddbRecordKey);
                    $scope.currentAccount[currentRegionName].currentTable.headers = Array.from(set);
                });
                queryResults.push(transformDynamodbQueryResult(ddbRecord));
            });
            $scope.currentAccount[currentRegionName].currentTable.headers = Array.from(set);
            $scope.currentAccount[currentRegionName].currentTable.queryResults = queryResults;
        };
        
        $scope.selectCurrentAccount = function(account){
            $scope.currentAccount = account;
            var currentRegion = $scope.currentRegion;
            if (!$scope.currentAccount[currentRegion]) {
                $scope.currentAccount[currentRegion] = {}
                refreshDynamoDBTables();
            }
        }

        $scope.selectCurrentTable = function(table){
            var currentRegion = $scope.currentRegion;
            $scope.currentAccount[currentRegion.name].currentTable = table;
            if (!$scope.currentAccount[currentRegion.name].currentTable.KeySchema) {
                refreshTableInfo($scope.region.selected.currentAccount.accountNo, table.name);
            }
        }

        $scope.queryTable = function() {
            var currentRegionName = $scope.currentRegion.name;
            var hashkeyName = $scope.currentAccount[currentRegionName].currentTable.KeySchema[0].AttributeName;
            var rangekeyName;
            var rangekeyValue;
            if ($scope.currentAccount[currentRegionName].currentTable.KeySchema.length > 1) {
                var rangekeyName = $scope.currentAccount[currentRegionName].currentTable.KeySchema[1].AttributeName;
                var rangekeyValue = $scope.currentAccount[currentRegionName].currentTable.queryParams.rangeKey;
            }

            var hashkeyValue = $scope.currentAccount[currentRegionName].currentTable.queryParams.hashKey;


            var tableName = $scope.currentAccount[currentRegionName].currentTable.name;
            var accountNo = $scope.currentAccount.accountNo;
            var url = "https://subkale.aka.corp.amazon.com:5000/awsAccounts/"+accountNo+"/"+currentRegionName+"/dynamoDBtables/"+tableName+"/query";
            var method = "GET";
            $http({
                method: method,
                url: url,
                params: {
                    'conditionExpression' : getKeyConditionExpression(hashkeyName, hashkeyValue, rangekeyName, rangekeyValue),
                    'expressionAttributeValues': getExpressionAttributeValues(hashkeyName, hashkeyValue, rangekeyName, rangekeyValue),
                    'expressionAttributeNames': getExpressionAttributeNames(hashkeyName, hashkeyValue, rangekeyName, rangekeyValue)
                }
            }).then(function success(response) {
                console.log(response);
                console.log(response.data);
                getTableData(response.data);
            }, function error(response) {
                console.log(response);
            });
            
        };

        $scope.selectAwsRegion = function($item, $model) {
            $scope.currentRegion = $item;
            var currentRegion = $scope.currentRegion;
            if ($scope.currentAccount) {
                if (!$scope.currentAccount[currentRegion.name]) {
                    $scope.currentAccount[currentRegion.name] = {}
                    refreshDynamoDBTables();
                }
            }
        };

    };

})();

---
title: "DeleteItem - Amazon DynamoDB"
source: "https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_DeleteItem.html"
author:
published:
created: 2025-07-03
description: "Creates a new item, or replaces an old item with a new item. If an item that has the same primary key as the new item already exists in the specified table, the new item completely replaces the existing item. You can perform a conditional put operation (add a new item if one with the specified primary key doesn't exist), or replace an existing item if it has certain attribute values. You can return the item's attribute values in the same operation, using the"
tags:
  - "clippings"
---
DeleteItem - Amazon DynamoDB

Deletes a single item in a table by primary key. You can perform a conditional delete operation that deletes the item if it exists, or if it has an expected attribute value.

In addition to deleting an item, you can also return the item's attribute values in the same operation, using the `ReturnValues` parameter.

Unless you specify conditions, the `DeleteItem` is an idempotent operation; running it multiple times on the same item or attribute does *not* result in an error response.

Conditional deletes are useful for deleting items only if specific conditions are met. If those conditions are met, DynamoDB performs the delete. Otherwise, the item is not deleted.

## Request Syntax

```
{
   "ConditionalOperator": "string",
   "ConditionExpression": "string",
   "Expected": { 
      "string" : { 
         "AttributeValueList": [ 
            { 
               "B": blob,
               "BOOL": boolean,
               "BS": [ blob ],
               "L": [ 
                  "AttributeValue"
               ],
               "M": { 
                  "string" : "AttributeValue"
               },
               "N": "string",
               "NS": [ "string" ],
               "NULL": boolean,
               "S": "string",
               "SS": [ "string" ]
            }
         ],
         "ComparisonOperator": "string",
         "Exists": boolean,
         "Value": { 
            "B": blob,
            "BOOL": boolean,
            "BS": [ blob ],
            "L": [ 
               "AttributeValue"
            ],
            "M": { 
               "string" : "AttributeValue"
            },
            "N": "string",
            "NS": [ "string" ],
            "NULL": boolean,
            "S": "string",
            "SS": [ "string" ]
         }
      }
   },
   "ExpressionAttributeNames": { 
      "string" : "string" 
   },
   "ExpressionAttributeValues": { 
      "string" : { 
         "B": blob,
         "BOOL": boolean,
         "BS": [ blob ],
         "L": [ 
            "AttributeValue"
         ],
         "M": { 
            "string" : "AttributeValue"
         },
         "N": "string",
         "NS": [ "string" ],
         "NULL": boolean,
         "S": "string",
         "SS": [ "string" ]
      }
   },
   "Key": { 
      "string" : { 
         "B": blob,
         "BOOL": boolean,
         "BS": [ blob ],
         "L": [ 
            "AttributeValue"
         ],
         "M": { 
            "string" : "AttributeValue"
         },
         "N": "string",
         "NS": [ "string" ],
         "NULL": boolean,
         "S": "string",
         "SS": [ "string" ]
      }
   },
   "ReturnConsumedCapacity": "string",
   "ReturnItemCollectionMetrics": "string",
   "ReturnValues": "string",
   "ReturnValuesOnConditionCheckFailure": "string",
   "TableName": "string"
}
```

## Request Parameters

The request accepts the following data in JSON format.

###### Note

In the following list, the required parameters are described first.

**[Key](https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/#API_DeleteItem_RequestSyntax)**

A map of attribute names to `AttributeValue` objects, representing the primary key of the item to delete.

For the primary key, you must provide all of the key attributes. For example, with a simple primary key, you only need to provide a value for the partition key. For a composite primary key, you must provide values for both the partition key and the sort key.

Type: String to [AttributeValue](https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_AttributeValue.html) object map

Key Length Constraints: Maximum length of 65535.

Required: Yes

**[TableName](https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/#API_DeleteItem_RequestSyntax)**

The name of the table from which to delete the item. You can also provide the Amazon Resource Name (ARN) of the table in this parameter.

Type: String

Length Constraints: Minimum length of 1. Maximum length of 1024.

Required: Yes

**[ConditionalOperator](https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/#API_DeleteItem_RequestSyntax)**

This is a legacy parameter. Use `ConditionExpression` instead. For more information, see [ConditionalOperator](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/LegacyConditionalParameters.ConditionalOperator.html) in the *Amazon DynamoDB Developer Guide*.

Type: String

Valid Values: `AND | OR`

Required: No

**[ConditionExpression](https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/#API_DeleteItem_RequestSyntax)**

A condition that must be satisfied in order for a conditional `DeleteItem` to succeed.

An expression can contain any of the following:

- Functions: `attribute_exists | attribute_not_exists | attribute_type |                         contains | begins_with | size`
	These function names are case-sensitive.
- Comparison operators: `= | <> |             < | > | <= | >= |             BETWEEN | IN `
- Logical operators: `AND | OR | NOT`

For more information about condition expressions, see [Condition Expressions](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Expressions.SpecifyingConditions.html) in the *Amazon DynamoDB Developer Guide*.

Type: String

Required: No

**[Expected](https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/#API_DeleteItem_RequestSyntax)**

This is a legacy parameter. Use `ConditionExpression` instead. For more information, see [Expected](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/LegacyConditionalParameters.Expected.html) in the *Amazon DynamoDB Developer Guide*.

Type: String to [ExpectedAttributeValue](https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_ExpectedAttributeValue.html) object map

Key Length Constraints: Maximum length of 65535.

Required: No

**[ExpressionAttributeNames](https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/#API_DeleteItem_RequestSyntax)**

One or more substitution tokens for attribute names in an expression. The following are some use cases for using `ExpressionAttributeNames`:

- To access an attribute whose name conflicts with a DynamoDB reserved word.
- To create a placeholder for repeating occurrences of an attribute name in an expression.
- To prevent special characters in an attribute name from being misinterpreted in an expression.

Use the **#** character in an expression to dereference an attribute name. For example, consider the following attribute name:

- `Percentile`

The name of this attribute conflicts with a reserved word, so it cannot be used directly in an expression. (For the complete list of reserved words, see [Reserved Words](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/ReservedWords.html) in the *Amazon DynamoDB Developer Guide*). To work around this, you could specify the following for `ExpressionAttributeNames`:

- `{"#P":"Percentile"}`

You could then use this substitution in an expression, as in this example:

- `#P = :val`

###### Note

Tokens that begin with the **:** character are *expression attribute values*, which are placeholders for the actual value at runtime.

For more information on expression attribute names, see [Specifying Item Attributes](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Expressions.AccessingItemAttributes.html) in the *Amazon DynamoDB Developer Guide*.

Type: String to string map

Value Length Constraints: Maximum length of 65535.

Required: No

**[ExpressionAttributeValues](https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/#API_DeleteItem_RequestSyntax)**

One or more values that can be substituted in an expression.

Use the **:** (colon) character in an expression to dereference an attribute value. For example, suppose that you wanted to check whether the value of the *ProductStatus* attribute was one of the following:

`Available | Backordered | Discontinued`

You would first need to specify `ExpressionAttributeValues` as follows:

`{ ":avail":{"S":"Available"}, ":back":{"S":"Backordered"},                 ":disc":{"S":"Discontinued"} }`

You could then use these values in an expression, such as this:

`ProductStatus IN (:avail, :back, :disc)`

For more information on expression attribute values, see [Condition Expressions](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Expressions.SpecifyingConditions.html) in the *Amazon DynamoDB Developer Guide*.

Type: String to [AttributeValue](https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_AttributeValue.html) object map

Required: No

**[ReturnConsumedCapacity](https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/#API_DeleteItem_RequestSyntax)**

Determines the level of detail about either provisioned or on-demand throughput consumption that is returned in the response:

- `INDEXES` - The response includes the aggregate `ConsumedCapacity` for the operation, together with `ConsumedCapacity` for each table and secondary index that was accessed.
	Note that some operations, such as `GetItem` and `BatchGetItem`, do not access any indexes at all. In these cases, specifying `INDEXES` will only return `ConsumedCapacity` information for table(s).
- `TOTAL` - The response includes only the aggregate `ConsumedCapacity` for the operation.
- `NONE` - No `ConsumedCapacity` details are included in the response.

Type: String

Valid Values: `INDEXES | TOTAL | NONE`

Required: No

**[ReturnItemCollectionMetrics](https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/#API_DeleteItem_RequestSyntax)**

Determines whether item collection metrics are returned. If set to `SIZE`, the response includes statistics about item collections, if any, that were modified during the operation are returned in the response. If set to `NONE` (the default), no statistics are returned.

Type: String

Valid Values: `SIZE | NONE`

Required: No

**[ReturnValues](https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/#API_DeleteItem_RequestSyntax)**

Use `ReturnValues` if you want to get the item attributes as they appeared before they were deleted. For `DeleteItem`, the valid values are:

- `NONE` - If `ReturnValues` is not specified, or if its value is `NONE`, then nothing is returned. (This setting is the default for `ReturnValues`.)
- `ALL_OLD` - The content of the old item is returned.

There is no additional cost associated with requesting a return value aside from the small network and processing overhead of receiving a larger response. No read capacity units are consumed.

###### Note

The `ReturnValues` parameter is used by several DynamoDB operations; however, `DeleteItem` does not recognize any values other than `NONE` or `ALL_OLD`.

Type: String

Valid Values: `NONE | ALL_OLD | UPDATED_OLD | ALL_NEW | UPDATED_NEW`

Required: No

**[ReturnValuesOnConditionCheckFailure](https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/#API_DeleteItem_RequestSyntax)**

An optional parameter that returns the item attributes for a `DeleteItem` operation that failed a condition check.

There is no additional cost associated with requesting a return value aside from the small network and processing overhead of receiving a larger response. No read capacity units are consumed.

Type: String

Valid Values: `ALL_OLD | NONE`

Required: No

## Response Syntax

```
{
   "Attributes": { 
      "string" : { 
         "B": blob,
         "BOOL": boolean,
         "BS": [ blob ],
         "L": [ 
            "AttributeValue"
         ],
         "M": { 
            "string" : "AttributeValue"
         },
         "N": "string",
         "NS": [ "string" ],
         "NULL": boolean,
         "S": "string",
         "SS": [ "string" ]
      }
   },
   "ConsumedCapacity": { 
      "CapacityUnits": number,
      "GlobalSecondaryIndexes": { 
         "string" : { 
            "CapacityUnits": number,
            "ReadCapacityUnits": number,
            "WriteCapacityUnits": number
         }
      },
      "LocalSecondaryIndexes": { 
         "string" : { 
            "CapacityUnits": number,
            "ReadCapacityUnits": number,
            "WriteCapacityUnits": number
         }
      },
      "ReadCapacityUnits": number,
      "Table": { 
         "CapacityUnits": number,
         "ReadCapacityUnits": number,
         "WriteCapacityUnits": number
      },
      "TableName": "string",
      "WriteCapacityUnits": number
   },
   "ItemCollectionMetrics": { 
      "ItemCollectionKey": { 
         "string" : { 
            "B": blob,
            "BOOL": boolean,
            "BS": [ blob ],
            "L": [ 
               "AttributeValue"
            ],
            "M": { 
               "string" : "AttributeValue"
            },
            "N": "string",
            "NS": [ "string" ],
            "NULL": boolean,
            "S": "string",
            "SS": [ "string" ]
         }
      },
      "SizeEstimateRangeGB": [ number ]
   }
}
```

## Response Elements

If the action is successful, the service sends back an HTTP 200 response.

The following data is returned in JSON format by the service.

**[Attributes](https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/#API_DeleteItem_ResponseSyntax)**

A map of attribute names to `AttributeValue` objects, representing the item as it appeared before the `DeleteItem` operation. This map appears in the response only if `ReturnValues` was specified as `ALL_OLD` in the request.

Type: String to [AttributeValue](https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_AttributeValue.html) object map

Key Length Constraints: Maximum length of 65535.

**[ConsumedCapacity](https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/#API_DeleteItem_ResponseSyntax)**

The capacity units consumed by the `DeleteItem` operation. The data returned includes the total provisioned throughput consumed, along with statistics for the table and any indexes involved in the operation. `ConsumedCapacity` is only returned if the `ReturnConsumedCapacity` parameter was specified. For more information, see [Provisioned capacity mode](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/provisioned-capacity-mode.html) in the *Amazon DynamoDB Developer Guide*.

Type: [ConsumedCapacity](https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_ConsumedCapacity.html) object

**[ItemCollectionMetrics](https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/#API_DeleteItem_ResponseSyntax)**

Information about item collections, if any, that were affected by the `DeleteItem` operation. `ItemCollectionMetrics` is only returned if the `ReturnItemCollectionMetrics` parameter was specified. If the table does not have any local secondary indexes, this information is not returned in the response.

Each `ItemCollectionMetrics` element consists of:

- `ItemCollectionKey` - The partition key value of the item collection. This is the same as the partition key value of the item itself.
- `SizeEstimateRangeGB` - An estimate of item collection size, in gigabytes. This value is a two-element array containing a lower bound and an upper bound for the estimate. The estimate includes the size of all the items in the table, plus the size of all attributes projected into all of the local secondary indexes on that table. Use this estimate to measure whether a local secondary index is approaching its size limit.
	The estimate is subject to change over time; therefore, do not rely on the precision or accuracy of the estimate.

Type: [ItemCollectionMetrics](https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_ItemCollectionMetrics.html) object

## Errors

For information about the errors that are common to all actions, see [Common Errors](https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/CommonErrors.html).

**ConditionalCheckFailedException**

A condition specified in the operation failed to be evaluated.

HTTP Status Code: 400

**InternalServerError**

An error occurred on the server side.

HTTP Status Code: 500

**ItemCollectionSizeLimitExceededException**

An item collection is too large. This exception is only returned for tables that have one or more local secondary indexes.

HTTP Status Code: 400

**ProvisionedThroughputExceededException**

Your request rate is too high. The AWS SDKs for DynamoDB automatically retry requests that receive this exception. Your request is eventually successful, unless your retry queue is too large to finish. Reduce the frequency of requests and use exponential backoff. For more information, go to [Error Retries and Exponential Backoff](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Programming.Errors.html#Programming.Errors.RetryAndBackoff) in the *Amazon DynamoDB Developer Guide*.

HTTP Status Code: 400

**ReplicatedWriteConflictException**

The request was rejected because one or more items in the request are being modified by a request in another Region.

HTTP Status Code: 400

**RequestLimitExceeded**

Throughput exceeds the current throughput quota for your account. Please contact [Support](https://aws.amazon.com/support) to request a quota increase.

HTTP Status Code: 400

**ResourceNotFoundException**

The operation tried to access a nonexistent table or index. The resource might not be specified correctly, or its status might not be `ACTIVE`.

HTTP Status Code: 400

**TransactionConflictException**

Operation was rejected because there is an ongoing transaction for the item.

HTTP Status Code: 400

## Examples

### Delete an Item

The following example deletes an item from the `Thread` table, but only if that item does not already have an attribute named `Replies`. Because `ReturnValues` is set to `ALL_OLD`, the response contains the item as it appeared before the delete.

#### Sample Request

```
POST / HTTP/1.1
Host: dynamodb.<region>.<domain>;
Accept-Encoding: identity
Content-Length: <PayloadSizeBytes>
User-Agent: <UserAgentString>
Content-Type: application/x-amz-json-1.0
Authorization: AWS4-HMAC-SHA256 Credential=<Credential>, SignedHeaders=<Headers>, Signature=<Signature>
X-Amz-Date: <Date>
X-Amz-Target: DynamoDB_20120810.DeleteItem

{
    "TableName": "Thread",
    "Key": {
        "ForumName": {
            "S": "Amazon DynamoDB"
        },
        "Subject": {
            "S": "How do I update multiple items?"
        }
    },
    "ConditionExpression": "attribute_not_exists(Replies)",
    "ReturnValues": "ALL_OLD"
}
```

#### Sample Response

```makefile
HTTP/1.1 200 OK
x-amzn-RequestId: <RequestId>
x-amz-crc32: <Checksum>
Content-Type: application/x-amz-json-1.0
Content-Length: <PayloadSizeBytes>
Date: <Date>
 {
    "Attributes": {
        "LastPostedBy": {
            "S": "fred@example.com"
        },
        "ForumName": {
            "S": "Amazon DynamoDB"
        },
        "LastPostDateTime": {
            "S": "201303201023"
        },
        "Tags": {
            "SS": ["Update","Multiple Items","HelpMe"]
        },
        "Subject": {
            "S": "How do I update multiple items?"
        },
        "Message": {
            "S": "I want to update multiple items in a single call. What's the best way to do that?"
        }
    }
}
```

## See Also

For more information about using this API in one of the language-specific AWS SDKs, see the following:

- [AWS Command Line Interface](https://docs.aws.amazon.com/goto/aws-cli/dynamodb-2012-08-10/DeleteItem)
- [AWS SDK for.NET](https://docs.aws.amazon.com/goto/DotNetSDKV3/dynamodb-2012-08-10/DeleteItem)
- [AWS SDK for C++](https://docs.aws.amazon.com/goto/SdkForCpp/dynamodb-2012-08-10/DeleteItem)
- [AWS SDK for Go v2](https://docs.aws.amazon.com/goto/SdkForGoV2/dynamodb-2012-08-10/DeleteItem)
- [AWS SDK for Java V2](https://docs.aws.amazon.com/goto/SdkForJavaV2/dynamodb-2012-08-10/DeleteItem)
- [AWS SDK for JavaScript V3](https://docs.aws.amazon.com/goto/SdkForJavaScriptV3/dynamodb-2012-08-10/DeleteItem)
- [AWS SDK for Kotlin](https://docs.aws.amazon.com/goto/SdkForKotlin/dynamodb-2012-08-10/DeleteItem)
- [AWS SDK for PHP V3](https://docs.aws.amazon.com/goto/SdkForPHPV3/dynamodb-2012-08-10/DeleteItem)
- [AWS SDK for Python](https://docs.aws.amazon.com/goto/boto3/dynamodb-2012-08-10/DeleteItem)
- [AWS SDK for Ruby V3](https://docs.aws.amazon.com/goto/SdkForRubyV3/dynamodb-2012-08-10/DeleteItem)

---

### Discover highly rated pages

Abstracts generated by AI

Amazondynamodb › developerguide

![](https://prod.us-west-2.tcx-beacon.docs.aws.dev/recommendation-beacon/highlyRated/impressions/0195ce54-7b4b-46ca-8aa5-50f1e6a80031/VlnGrub7xW0_92oHWJ1ViiWXnjs3JsbZ_z0K-bVylInDhLqFEHoEUQ==/https:%7C%7Cdocs.aws.amazon.com%7Camazondynamodb%7Clatest%7CAPIReference%7CAPI_DeleteItem.html/https:%7C%7Cdocs.aws.amazon.com%7Camazondynamodb%7Clatest%7Cdeveloperguide%7CIntroduction.html)

DynamoDB offers serverless NoSQL database, single-digit millisecond performance, fully managed database, multi-active replication with global tables, ACID transactions, change data capture for event-driven architectures, secondary indexes.

*2025年7月2日*

Amazondynamodb › developerguide

![](https://prod.us-west-2.tcx-beacon.docs.aws.dev/recommendation-beacon/highlyRated/impressions/0195ce54-7b4b-46ca-8aa5-50f1e6a80031/VlnGrub7xW0_92oHWJ1ViiWXnjs3JsbZ_z0K-bVylInDhLqFEHoEUQ==/https:%7C%7Cdocs.aws.amazon.com%7Camazondynamodb%7Clatest%7CAPIReference%7CAPI_DeleteItem.html/https:%7C%7Cdocs.aws.amazon.com%7Camazondynamodb%7Clatest%7Cdeveloperguide%7CHowItWorks.CoreComponents.html)

DynamoDB tables store items containing attributes uniquely identified by primary keys. DynamoDB supports partition keys, partition and sort keys, and secondary indexes. DynamoDB Streams captures data modification events.

*2025年2月4日*

Amazondynamodb › developerguide

![](https://prod.us-west-2.tcx-beacon.docs.aws.dev/recommendation-beacon/highlyRated/impressions/0195ce54-7b4b-46ca-8aa5-50f1e6a80031/VlnGrub7xW0_92oHWJ1ViiWXnjs3JsbZ_z0K-bVylInDhLqFEHoEUQ==/https:%7C%7Cdocs.aws.amazon.com%7Camazondynamodb%7Clatest%7CAPIReference%7CAPI_DeleteItem.html/https:%7C%7Cdocs.aws.amazon.com%7Camazondynamodb%7Clatest%7Cdeveloperguide%7CGSI.html)

Global secondary indexes enable efficient queries on non-key attributes. Projecting attributes into indexes optimizes storage costs and throughput. Synchronization between tables and indexes is eventually consistent. Provisioning throughput for indexes avoids throttling.

*2025年2月26日*